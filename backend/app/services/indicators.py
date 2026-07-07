import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple

class TechnicalIndicators:
    @staticmethod
    def calculate_sma(series: pd.Series, window: int) -> pd.Series:
        return series.rolling(window=window).mean()

    @staticmethod
    def calculate_ema(series: pd.Series, window: int) -> pd.Series:
        return series.ewm(span=window, adjust=False).mean()

    @staticmethod
    def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
        delta = series.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        
        # Exponential moving average for gain and loss
        avg_gain = gain.ewm(alpha=1/period, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/period, adjust=False).mean()
        
        rs = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50)  # Neutral fill for initial rows

    @staticmethod
    def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        ema_fast = TechnicalIndicators.calculate_ema(series, fast)
        ema_slow = TechnicalIndicators.calculate_ema(series, slow)
        macd_line = ema_fast - ema_slow
        signal_line = TechnicalIndicators.calculate_ema(macd_line, signal)
        histogram = macd_line - signal_line
        return macd_line, signal_line, histogram

    @staticmethod
    def calculate_bollinger_bands(series: pd.Series, window: int = 20, num_std: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series]:
        sma = TechnicalIndicators.calculate_sma(series, window)
        std = series.rolling(window=window).std()
        upper_band = sma + (std * num_std)
        lower_band = sma - (std * num_std)
        return upper_band, sma, lower_band

    @classmethod
    def analyze_all(cls, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculates all indicators and trend metrics on the stock history dataframe.
        """
        if df.empty or len(df) < 50:
            return {"error": "Insufficient history data (at least 50 points required)"}

        close = df["Close"]
        high = df["High"]
        low = df["Low"]
        volume = df["Volume"]

        # Calculate standard overlays
        sma20 = cls.calculate_sma(close, 20)
        sma50 = cls.calculate_sma(close, 50)
        sma200 = cls.calculate_sma(close, 200) if len(df) >= 200 else cls.calculate_sma(close, len(df))
        ema20 = cls.calculate_ema(close, 20)
        
        # Bollinger Bands
        bb_upper, bb_middle, bb_lower = cls.calculate_bollinger_bands(close, 20)
        
        # Oscillators
        rsi = cls.calculate_rsi(close, 14)
        macd_line, macd_signal, macd_hist = cls.calculate_macd(close, 12, 26, 9)
        
        # Latest values
        current_price = float(close.iloc[-1])
        prev_price = float(close.iloc[-2]) if len(close) > 1 else current_price
        
        # Support and Resistance Peak/Valley Detection
        # Let's find local extrema within a rolling window of 10 periods
        sr_window = 10
        support_levels = []
        resistance_levels = []
        
        for i in range(sr_window, len(df) - sr_window):
            # Check for Resistance (Peak)
            if high.iloc[i] == high.iloc[i - sr_window : i + sr_window + 1].max():
                level = float(high.iloc[i])
                if not any(abs(level - r) / r < 0.015 for r in resistance_levels):  # Avoid duplicates within 1.5%
                    resistance_levels.append(level)
            # Check for Support (Valley)
            if low.iloc[i] == low.iloc[i - sr_window : i + sr_window + 1].min():
                level = float(low.iloc[i])
                if not any(abs(level - s) / s < 0.015 for s in support_levels):  # Avoid duplicates within 1.5%
                    support_levels.append(level)
                    
        # Sort and limit S/R levels
        support_levels = sorted(support_levels)[-3:]     # 3 closest below current price or lowest
        resistance_levels = sorted(resistance_levels)[:3] # 3 closest above current price or highest
        
        # Trend Detection
        trend = "Sideways"
        trend_score = 0.0  # -1.0 to 1.0 (bearish to bullish)
        
        latest_sma50 = sma50.iloc[-1]
        latest_sma200 = sma200.iloc[-1]
        
        if current_price > latest_sma50 and latest_sma50 > latest_sma200:
            trend = "Bullish"
            trend_score = 0.8
        elif current_price < latest_sma50 and latest_sma50 < latest_sma200:
            trend = "Bearish"
            trend_score = -0.8
        else:
            # Check slopes
            slope_50 = (latest_sma50 - sma50.iloc[-5]) / 5
            if slope_50 > 0 and current_price > latest_sma50:
                trend = "Weak Bullish"
                trend_score = 0.3
            elif slope_50 < 0 and current_price < latest_sma50:
                trend = "Weak Bearish"
                trend_score = -0.3
        
        # Volume Analysis
        vol_sma20 = volume.rolling(window=20).mean()
        latest_vol = float(volume.iloc[-1])
        avg_vol = float(vol_sma20.iloc[-1])
        vol_ratio = latest_vol / avg_vol if avg_vol > 0 else 1.0
        
        volume_status = "Normal"
        if vol_ratio > 2.0:
            volume_status = "Volume Spike"
        elif vol_ratio > 1.5:
            volume_status = "Above Average"
        elif vol_ratio < 0.5:
            volume_status = "Low Volume"
            
        volume_signal = "Neutral"
        if volume_status in ["Volume Spike", "Above Average"]:
            if current_price > prev_price:
                volume_signal = "Bullish Accumulation"
            else:
                volume_signal = "Bearish Distribution"

        return {
            "current_price": current_price,
            "change": current_price - prev_price,
            "change_percent": ((current_price - prev_price) / prev_price) * 100 if prev_price > 0 else 0,
            "sma": {
                "sma20": float(sma20.iloc[-1]) if not np.isnan(sma20.iloc[-1]) else current_price,
                "sma50": float(latest_sma50) if not np.isnan(latest_sma50) else current_price,
                "sma200": float(latest_sma200) if not np.isnan(latest_sma200) else current_price,
            },
            "ema": {
                "ema20": float(ema20.iloc[-1]) if not np.isnan(ema20.iloc[-1]) else current_price
            },
            "rsi": {
                "value": float(rsi.iloc[-1]),
                "status": "Overbought" if rsi.iloc[-1] > 70 else ("Oversold" if rsi.iloc[-1] < 30 else "Neutral")
            },
            "macd": {
                "macd": float(macd_line.iloc[-1]),
                "signal": float(macd_signal.iloc[-1]),
                "histogram": float(macd_hist.iloc[-1]),
                "signal_type": "Bullish Crossover" if (macd_line.iloc[-1] > macd_signal.iloc[-1] and macd_line.iloc[-2] <= macd_signal.iloc[-2]) else (
                    "Bearish Crossover" if (macd_line.iloc[-1] < macd_signal.iloc[-1] and macd_line.iloc[-2] >= macd_signal.iloc[-2]) else "Neutral"
                )
            },
            "bollinger_bands": {
                "upper": float(bb_upper.iloc[-1]) if not np.isnan(bb_upper.iloc[-1]) else current_price,
                "middle": float(bb_middle.iloc[-1]) if not np.isnan(bb_middle.iloc[-1]) else current_price,
                "lower": float(bb_lower.iloc[-1]) if not np.isnan(bb_lower.iloc[-1]) else current_price,
                "percent": float((current_price - bb_lower.iloc[-1]) / (bb_upper.iloc[-1] - bb_lower.iloc[-1])) if (bb_upper.iloc[-1] - bb_lower.iloc[-1]) > 0 else 0.5
            },
            "trend": {
                "direction": trend,
                "score": trend_score
            },
            "support_resistance": {
                "supports": [round(x, 2) for x in support_levels],
                "resistances": [round(x, 2) for x in resistance_levels]
            },
            "volume_analysis": {
                "latest_volume": latest_vol,
                "average_volume": avg_vol,
                "volume_ratio": vol_ratio,
                "status": volume_status,
                "signal": volume_signal
            }
        }
