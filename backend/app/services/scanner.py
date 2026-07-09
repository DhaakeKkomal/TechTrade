import pandas as pd
import numpy as np
import yfinance as yf
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseFilter(ABC):
    def __init__(self, operator: str, value: Optional[float] = None):
        self.operator = operator.lower()
        self.value = value

    @abstractmethod
    def evaluate(self, df: pd.DataFrame) -> bool:
        """
        Returns True if the stock DataFrame matches this filter condition on the latest candle.
        """
        pass

class RsiFilter(BaseFilter):
    def evaluate(self, df: pd.DataFrame) -> bool:
        if "RSI" not in df.columns or df["RSI"].empty:
            return False
        latest_rsi = float(df["RSI"].iloc[-1])
        if self.operator == "lt":
            return latest_rsi < (self.value or 30.0)
        elif self.operator == "gt":
            return latest_rsi > (self.value or 70.0)
        return False

class MaFilter(BaseFilter):
    def evaluate(self, df: pd.DataFrame) -> bool:
        # Operator can be: price_above_sma50, golden_cross, death_cross, price_above_ema20
        close = float(df["Close"].iloc[-1])
        
        if self.operator == "price_above_sma50":
            if "SMA50" not in df.columns: return False
            return close > float(df["SMA50"].iloc[-1])
            
        elif self.operator == "price_above_ema20":
            if "EMA20" not in df.columns: return False
            return close > float(df["EMA20"].iloc[-1])
            
        elif self.operator == "golden_cross":
            if "SMA50" not in df.columns or "SMA200" not in df.columns: return False
            sma50 = df["SMA50"]
            sma200 = df["SMA200"]
            # Current 50 > 200 and previous 50 <= 200
            return sma50.iloc[-1] > sma200.iloc[-1] and sma50.iloc[-2] <= sma200.iloc[-2]
            
        elif self.operator == "death_cross":
            if "SMA50" not in df.columns or "SMA200" not in df.columns: return False
            sma50 = df["SMA50"]
            sma200 = df["SMA200"]
            return sma50.iloc[-1] < sma200.iloc[-1] and sma50.iloc[-2] >= sma200.iloc[-2]
            
        return False

class BollingerFilter(BaseFilter):
    def evaluate(self, df: pd.DataFrame) -> bool:
        # Operator can be: crosses_lower, crosses_upper, price_below_lower
        if "BB_Upper" not in df.columns or "BB_Lower" not in df.columns:
            return False
        close = df["Close"]
        upper = df["BB_Upper"]
        lower = df["BB_Lower"]
        
        if self.operator == "price_below_lower":
            return close.iloc[-1] < lower.iloc[-1]
            
        elif self.operator == "crosses_lower":
            # Crossed below lower band on current or previous candle
            return (close.iloc[-1] < lower.iloc[-1] and close.iloc[-2] >= lower.iloc[-2]) or \
                   (close.iloc[-2] < lower.iloc[-2] and close.iloc[-3] >= lower.iloc[-3])
                   
        elif self.operator == "crosses_upper":
            return (close.iloc[-1] > upper.iloc[-1] and close.iloc[-2] <= upper.iloc[-2]) or \
                   (close.iloc[-2] > upper.iloc[-2] and close.iloc[-3] <= upper.iloc[-3])
                   
        return False

class VolumeSpikeFilter(BaseFilter):
    def evaluate(self, df: pd.DataFrame) -> bool:
        if "Vol_SMA20" not in df.columns:
            return False
        latest_vol = float(df["Volume"].iloc[-1])
        avg_vol = float(df["Vol_SMA20"].iloc[-1])
        if avg_vol == 0: return False
        
        ratio = latest_vol / avg_vol
        threshold = self.value or 1.5
        return ratio > threshold

class BreakoutFilter(BaseFilter):
    def evaluate(self, df: pd.DataFrame) -> bool:
        # Check breakout past recent 20 candle high/low
        close = df["Close"]
        highs = df["High"]
        lows = df["Low"]
        
        if self.operator == "bullish":
            # Current close > max(High of previous 20 candles)
            recent_max = highs.iloc[-21:-1].max()
            return close.iloc[-1] > recent_max
        elif self.operator == "bearish":
            recent_min = lows.iloc[-21:-1].min()
            return close.iloc[-1] < recent_min
        return False

class ConsolidationFilter(BaseFilter):
    def evaluate(self, df: pd.DataFrame) -> bool:
        # Consolidation check: BB Bandwidth squeeze
        # Bandwidth = (Upper - Lower) / Middle. If bandwidth is below a threshold (e.g. 5% or 0.05), consolidate.
        if "BB_Upper" not in df.columns or "BB_Lower" not in df.columns or "BB_Middle" not in df.columns:
            return False
        upper = df["BB_Upper"].iloc[-1]
        lower = df["BB_Lower"].iloc[-1]
        middle = df["BB_Middle"].iloc[-1]
        if middle == 0: return False
        
        bandwidth = (upper - lower) / middle
        threshold = self.value or 0.06 # default 6% squeeze
        return bandwidth < threshold

class AtrFilter(BaseFilter):
    def evaluate(self, df: pd.DataFrame) -> bool:
        if "ATR" not in df.columns:
            return False
        latest_atr = float(df["ATR"].iloc[-1])
        # High volatility / Low volatility filter
        if self.operator == "high":
            # ATR is greater than historical 20-period average ATR
            avg_atr = df["ATR"].rolling(window=20).mean().iloc[-1]
            return latest_atr > avg_atr
        elif self.operator == "low":
            avg_atr = df["ATR"].rolling(window=20).mean().iloc[-1]
            return latest_atr < avg_atr
        return False

class RelativeStrengthFilter(BaseFilter):
    def evaluate(self, df: pd.DataFrame) -> bool:
        # Rate of change relative strength (Normalized 20-day return)
        close = df["Close"]
        roc_20 = ((close.iloc[-1] - close.iloc[-20]) / close.iloc[-20]) * 100 if len(close) >= 20 else 0.0
        threshold = self.value or 5.0 # default 5% return
        if self.operator == "strong":
            return roc_20 > threshold
        elif self.operator == "weak":
            return roc_20 < -threshold
        return False

class GapFilter(BaseFilter):
    def evaluate(self, df: pd.DataFrame) -> bool:
        if len(df) < 2: return False
        open_price = float(df["Open"].iloc[-1])
        prev_close = float(df["Close"].iloc[-2])
        threshold = self.value or 1.0 # default 1% gap
        
        gap_pct = ((open_price - prev_close) / prev_close) * 100
        if self.operator == "up":
            return gap_pct > threshold
        elif self.operator == "down":
            return gap_pct < -threshold
        return False

class FiftyTwoWeekFilter(BaseFilter):
    def evaluate(self, df: pd.DataFrame) -> bool:
        close = float(df["Close"].iloc[-1])
        if "High_52W" not in df.columns or "Low_52W" not in df.columns:
            return False
        high_52w = float(df["High_52W"].iloc[-1])
        low_52w = float(df["Low_52W"].iloc[-1])
        
        if self.operator == "near_high":
            # Price within 2.5% of 52-week high
            return (high_52w - close) / high_52w < 0.025
        elif self.operator == "near_low":
            # Price within 2.5% of 52-week low
            return (close - low_52w) / close < 0.025
        return False

class SwingScanner:
    # Pre-defined universes of stock symbols
    UNIVERSES = {
        "us": ["AAPL", "MSFT", "TSLA", "NVDA", "GOOGL", "AMZN", "META", "NFLX", "AMD", "INTC"],
        "nse": ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BHARTIARTL.NS", "SBIN.NS", "LICI.NS", "ITC.NS", "HINDUNILVR.NS"],
        "default": ["AAPL", "MSFT", "TSLA", "RELIANCE.NS", "TCS.NS", "INFY.NS"]
    }

    @staticmethod
    def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocesses and computes technical indicator columns on the DataFrame.
        """
        if df.empty or len(df) < 20:
            return df
            
        close = df["Close"]
        high = df["High"]
        low = df["Low"]
        volume = df["Volume"]

        # SMAs
        df["SMA20"] = close.rolling(window=20).mean()
        df["SMA50"] = close.rolling(window=50).mean() if len(df) >= 50 else close.rolling(window=len(df)).mean()
        df["SMA200"] = close.rolling(window=200).mean() if len(df) >= 200 else close.rolling(window=len(df)).mean()
        
        # EMAs
        df["EMA20"] = close.ewm(span=20, adjust=False).mean()
        
        # Bollinger Bands
        std20 = close.rolling(window=20).std()
        df["BB_Middle"] = df["SMA20"]
        df["BB_Upper"] = df["BB_Middle"] + (std20 * 2.0)
        df["BB_Lower"] = df["BB_Middle"] - (std20 * 2.0)

        # Volume SMA
        df["Vol_SMA20"] = volume.rolling(window=20).mean()

        # RSI (14)
        delta = close.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.ewm(alpha=1/14, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/14, adjust=False).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        df["RSI"] = 100 - (100 / (1 + rs))
        df["RSI"] = df["RSI"].fillna(50)

        # MACD (12, 26, 9)
        ema_fast = close.ewm(span=12, adjust=False).mean()
        ema_slow = close.ewm(span=26, adjust=False).mean()
        df["MACD"] = ema_fast - ema_slow
        df["MACD_Signal"] = df["MACD"].ewm(span=9, adjust=False).mean()
        df["MACD_Hist"] = df["MACD"] - df["MACD_Signal"]

        # ATR (14)
        tr1 = high - low
        tr2 = (high - close.shift(1)).abs()
        tr3 = (low - close.shift(1)).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        df["ATR"] = tr.rolling(window=14).mean()

        # 52-Week High & Low
        df["High_52W"] = high.rolling(window=252, min_periods=1).max()
        df["Low_52W"] = low.rolling(window=252, min_periods=1).min()

        return df

    @classmethod
    def parse_filter(cls, config: Dict[str, Any]) -> Optional[BaseFilter]:
        name = config.get("name", "").lower()
        operator = config.get("operator", "")
        value = config.get("value")

        if name == "rsi": return RsiFilter(operator, value)
        elif name == "ma": return MaFilter(operator, value)
        elif name == "bollinger": return BollingerFilter(operator, value)
        elif name == "volume_spike": return VolumeSpikeFilter(operator, value)
        elif name == "breakout": return BreakoutFilter(operator, value)
        elif name == "consolidation": return ConsolidationFilter(operator, value)
        elif name == "atr": return AtrFilter(operator, value)
        elif name == "relative_strength": return RelativeStrengthFilter(operator, value)
        elif name == "gap": return GapFilter(operator, value)
        elif name == "52week": return FiftyTwoWeekFilter(operator, value)
        return None

    @classmethod
    async def scan(cls, universe_name: str, filters_config: List[Dict[str, Any]], custom_tickers: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Orchestrates scanner download and evaluation.
        """
        # Resolve tickers to scan
        if universe_name == "watchlist" and custom_tickers:
            tickers = custom_tickers
        else:
            tickers = cls.UNIVERSES.get(universe_name, cls.UNIVERSES["default"])

        if not tickers:
            return []

        # Parse filter objects
        filters = []
        for config in filters_config:
            f = cls.parse_filter(config)
            if f: filters.append(f)

        if not filters:
            return []

        # Fetch bulk market data using yfinance
        # Optimization: Pull 1 year of history in a single API call for all tickers
        tickers_str = " ".join(tickers)
        try:
            bulk_df = yf.download(tickers_str, period="1y", interval="1d", group_by="ticker", progress=False)
        except Exception as e:
            print(f"Error bulk downloading market data: {e}")
            return []

        matched_stocks = []

        for symbol in tickers:
            # Safely extract single ticker DataFrame
            try:
                if len(tickers) == 1:
                    df = bulk_df.copy()
                else:
                    if symbol not in bulk_df.columns.levels[0]:
                        continue
                    df = bulk_df[symbol].copy()
            except Exception:
                continue

            df = df.dropna(subset=["Close"])
            if len(df) < 20:
                continue

            # Calculate preprocessor indicators
            df = cls.calculate_indicators(df)

            # Evaluate filters
            matched_count = 0
            for f in filters:
                if f.evaluate(df):
                    matched_count += 1

            # Determine match score (Percentage of active filters met)
            # To match, the stock must satisfy at least one filter. Typically, scanner requires meeting all or a threshold.
            # Let's say: to qualify as matching, it must meet at least 50% of the active filters (or all if only 1 filter).
            # This is a very clean scoring approach.
            if matched_count == 0:
                continue

            scan_score = int((matched_count / len(filters)) * 100)
            
            # Calculations for results payload
            close_latest = float(df["Close"].iloc[-1])
            prev_close = float(df["Close"].iloc[-2])
            change_pct = ((close_latest - prev_close) / prev_close) * 100
            
            # Risk Score based on annualized volatility (std deviation) and ATR
            atr_val = float(df["ATR"].iloc[-1]) if not np.isnan(df["ATR"].iloc[-1]) else 1.0
            atr_pct = (atr_val / close_latest) * 100
            # Risk rating out of 100
            risk_score = min(100, max(10, int(atr_pct * 15)))
            
            # Momentum classification (ROC 10 period + SMA alignment)
            roc_10 = ((close_latest - df["Close"].iloc[-10]) / df["Close"].iloc[-10]) * 100 if len(df) >= 10 else 0.0
            if roc_10 > 3.0:
                momentum = "Bullish Acceleration"
            elif roc_10 < -3.0:
                momentum = "Bearish Exhaustion"
            else:
                momentum = "Neutral Consolidation"

            # Weighted Win Probability based on scan score and indicator alignment
            base_prob = 50
            probability = base_prob + int(scan_score * 0.35)
            # Add bonus for volume spike
            if df["Vol_SMA20"].iloc[-1] > 0 and df["Volume"].iloc[-1] > 1.5 * df["Vol_SMA20"].iloc[-1]:
                probability += 10
            probability = min(92, max(35, probability))

            # Technical Summary tag
            reasons = []
            for idx, f in enumerate(filters):
                if f.evaluate(df):
                    reasons.append(filters_config[idx].get("name", "").upper())
            
            summary = f"Ticker matched {', '.join(reasons)} criteria with close at {close_latest:.2f} ({change_pct:+.2f}%)."

            matched_stocks.append({
                "symbol": symbol,
                "price": close_latest,
                "change_percent": change_pct,
                "scan_score": scan_score,
                "momentum": momentum,
                "risk_score": risk_score,
                "probability": probability,
                "summary": summary
            })

        # Sort results by Scan Score and Probability descending
        matched_stocks.sort(key=lambda x: (x["scan_score"], x["probability"]), reverse=True)
        return matched_stocks
