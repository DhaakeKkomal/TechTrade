import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.yfinance_service import YFinanceService
from app.services.indicators import TechnicalIndicators
from app.services.price_action import PriceActionAnalyzer

class StrategyBacktester:
    @staticmethod
    def _calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculates all standard indicators on the DataFrame.
        """
        df = df.copy()
        
        # SMAs & EMAs
        df["SMA20"] = TechnicalIndicators.calculate_sma(df["Close"], 20)
        df["SMA50"] = TechnicalIndicators.calculate_sma(df["Close"], 50)
        df["SMA200"] = TechnicalIndicators.calculate_sma(df["Close"], 200)
        df["EMA20"] = TechnicalIndicators.calculate_ema(df["Close"], 20)
        
        # RSI
        df["RSI"] = TechnicalIndicators.calculate_rsi(df["Close"], 14)
        
        # Bollinger Bands
        upper, middle, lower = TechnicalIndicators.calculate_bollinger_bands(df["Close"], 20)
        df["BB_Upper"] = upper
        df["BB_Middle"] = middle
        df["BB_Lower"] = lower
        
        # MACD
        macd, signal, hist = TechnicalIndicators.calculate_macd(df["Close"])
        df["MACD"] = macd
        df["MACD_Signal"] = signal
        
        # Volume SMA
        df["Volume_SMA20"] = TechnicalIndicators.calculate_sma(df["Volume"], 20)
        
        # Price Action Patterns
        df["Doji"] = False
        df["Hammer"] = False
        df["Engulfing"] = False
        
        try:
            pa_res = PriceActionAnalyzer.analyze(df)
            for c in pa_res.get("candlesticks", []):
                dt_str = c["time"]
                dt = pd.to_datetime(dt_str)
                if df.index.tz is not None:
                    dt = dt.tz_localize(df.index.tz)
                if dt in df.index:
                    if c["name"] == "Doji":
                        df.loc[dt, "Doji"] = True
                    elif c["name"] == "Hammer":
                        df.loc[dt, "Hammer"] = True
                    elif "Engulfing" in c["name"]:
                        df.loc[dt, "Engulfing"] = True
        except Exception:
            pass
            
        return df

    @staticmethod
    def _evaluate_rule(df: pd.DataFrame, idx: int, rule: Dict[str, Any]) -> bool:
        """
        Evaluates a single rule at a given DataFrame index.
        """
        if idx < 1:
            return False

        indicator = rule.get("indicator", "")
        condition = rule.get("condition", "")
        value_str = rule.get("value", "0")
        
        # Resolve indicators mapping
        if indicator not in df.columns:
            return False

        current_val = df[indicator].iloc[idx]
        prev_val = df[indicator].iloc[idx - 1]
        
        if pd.isna(current_val):
            return False

        # Attempt to parse target value or check against other column
        if value_str in df.columns:
            target_val = df[value_str].iloc[idx]
            prev_target_val = df[value_str].iloc[idx - 1]
        else:
            try:
                target_val = float(value_str)
                prev_target_val = target_val
            except ValueError:
                # E.g. String matching for patterns (Doji == True)
                if value_str.lower() in ["true", "yes", "1"]:
                    target_val = True
                elif value_str.lower() in ["false", "no", "0"]:
                    target_val = False
                else:
                    target_val = value_str

        # Condition checks
        if condition == "GREATER_THAN":
            return current_val > target_val
        elif condition == "LESS_THAN":
            return current_val < target_val
        elif condition == "EQUAL":
            return current_val == target_val
        elif condition == "CROSSES_ABOVE":
            return prev_val <= prev_target_val and current_val > target_val
        elif condition == "CROSSES_BELOW":
            return prev_val >= prev_target_val and current_val < target_val
            
        return False

    @classmethod
    def run_backtest(
        cls,
        symbol: str,
        start_date: str,
        end_date: str,
        initial_capital: float = 100000.0,
        buy_rules: List[Dict[str, Any]] = None,
        sell_rules: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Runs the chronological backtester simulation loop over historical daily prices.
        """
        buy_rules = buy_rules or []
        sell_rules = sell_rules or []

        # 1. Fetch daily data
        df = YFinanceService.get_stock_history(symbol, period="5y", interval="1d")
        if df.empty:
            raise ValueError(f"No historical price data found for {symbol}")

        # Filter by requested date range
        df = df.loc[start_date:end_date]
        if len(df) < 5:
            raise ValueError("Insufficient trading days in the requested date range.")

        # 2. Compute indicators
        df = cls._calculate_indicators(df)
        
        # Simulation parameters
        capital = initial_capital
        position = 0.0 # shares held
        entry_price = 0.0
        entry_date = None
        
        trades_history = []
        equity_curve = []
        
        # Loop chronologically
        for i in range(len(df)):
            date = df.index[i]
            close_p = float(df["Close"].iloc[i])
            high_p = float(df["High"].iloc[i])
            low_p = float(df["Low"].iloc[i])
            
            # Check exit
            if position > 0.0:
                # Evaluate sell rules
                sell_triggered = False
                if sell_rules:
                    sell_triggered = all(cls._evaluate_rule(df, i, r) for r in sell_rules)
                
                # Default exit rule: trailing stops or target mock or standard rule trigger
                if sell_triggered:
                    exit_p = close_p
                    pnl_val = (exit_p - entry_price) * position
                    capital = position * exit_p
                    
                    trades_history.append({
                        "symbol": symbol,
                        "type": "SELL",
                        "entry_date": entry_date.strftime("%Y-%m-%d"),
                        "exit_date": date.strftime("%Y-%m-%d"),
                        "entry_price": entry_price,
                        "exit_price": exit_p,
                        "pnl": pnl_val,
                        "pnl_percent": ((exit_p - entry_price) / entry_price) * 100
                    })
                    position = 0.0
                    entry_price = 0.0
                    entry_date = None
            
            # Check entry
            elif position == 0.0:
                buy_triggered = False
                if buy_rules:
                    buy_triggered = all(cls._evaluate_rule(df, i, r) for r in buy_rules)
                
                if buy_triggered:
                    entry_price = close_p
                    entry_date = date
                    # size with entire capital
                    position = capital / entry_price
                    capital = 0.0
            
            # Record daily equity value
            current_equity = capital + (position * close_p)
            equity_curve.append({
                "time": date.strftime("%Y-%m-%d"),
                "value": current_equity
            })

        # Calculate final liquidation if position open at the end
        final_equity = capital
        if position > 0.0:
            final_equity = position * float(df["Close"].iloc[-1])

        # 3. Calculate Performance metrics
        total_days = len(df)
        net_profit = final_equity - initial_capital
        
        # Win rate
        wins = [t for t in trades_history if t["pnl"] > 0]
        losses = [t for t in trades_history if t["pnl"] <= 0]
        total_trades = len(trades_history)
        win_rate = (len(wins) / total_trades) * 100 if total_trades > 0 else 0.0
        
        # Max Drawdown
        equity_vals = [e["value"] for e in equity_curve]
        peak = equity_vals[0]
        max_dd = 0.0
        for val in equity_vals:
            if val > peak:
                peak = val
            dd = (peak - val) / peak
            if dd > max_dd:
                max_dd = dd
        
        # CAGR
        years = total_days / 252.0
        cagr = ((final_equity / initial_capital) ** (1.0 / years) - 1.0) * 100 if years > 0 else 0.0
        
        # Sharpe & Sortino (based on daily returns)
        equity_series = pd.Series(equity_vals)
        daily_rets = equity_series.pct_change().dropna()
        
        # Risk free rate per day (assuming 2% annual)
        r_f_daily = 0.02 / 252.0
        excess_rets = daily_rets - r_f_daily
        
        if len(daily_rets) > 1 and daily_rets.std() > 0:
            sharpe = (excess_rets.mean() / daily_rets.std()) * np.sqrt(252)
        else:
            sharpe = 0.0
            
        downside_rets = daily_rets[daily_rets < 0]
        if len(downside_rets) > 1 and downside_rets.std() > 0:
            sortino = (excess_rets.mean() / downside_rets.std()) * np.sqrt(252)
        else:
            sortino = 0.0

        # Profit Factor
        gross_profit = sum(t["pnl"] for t in wins)
        gross_loss = abs(sum(t["pnl"] for t in losses))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else (gross_profit if gross_profit > 0 else 1.0)

        summary = (
            f"Backtest for {symbol} completed across {total_days} trading days. "
            f"Net P&L: {net_profit:+.2f} ({ (net_profit/initial_capital)*100:+.2f}%). "
            f"Trades taken: {total_trades}. Sharpe Ratio: {sharpe:.2f}."
        )

        return {
            "equity_curve": equity_curve,
            "win_rate": win_rate,
            "max_drawdown": max_dd * 100, # percent
            "sharpe_ratio": float(sharpe),
            "sortino_ratio": float(sortino),
            "cagr": float(cagr),
            "profit_factor": float(profit_factor),
            "trades_history": trades_history,
            "summary": summary
        }
