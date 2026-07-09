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

    @staticmethod
    def calculate_adx(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
        # True Range
        tr1 = high - low
        tr2 = (high - close.shift(1)).abs()
        tr3 = (low - close.shift(1)).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        
        # Smoothed True Range (Wilder's smoothing)
        smoothed_tr = tr.ewm(alpha=1/period, adjust=False).mean()
        
        # Directional Movement (+DM and -DM)
        up_move = high.diff()
        down_move = low.shift(1) - low
        
        pos_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
        neg_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
        
        pos_dm = pd.Series(pos_dm, index=high.index)
        neg_dm = pd.Series(neg_dm, index=high.index)
        
        # Smoothed Directional Movement
        smoothed_pos_dm = pos_dm.ewm(alpha=1/period, adjust=False).mean()
        smoothed_neg_dm = neg_dm.ewm(alpha=1/period, adjust=False).mean()
        
        # Directional Indexes (+DI and -DI)
        pos_di = 100 * (smoothed_pos_dm / smoothed_tr.replace(0, np.nan))
        neg_di = 100 * (smoothed_neg_dm / smoothed_tr.replace(0, np.nan))
        
        # Directional Index (DX)
        dx = 100 * (pos_di - neg_di).abs() / (pos_di + neg_di).replace(0, np.nan)
        
        # Average Directional Index (ADX)
        adx = dx.ewm(alpha=1/period, adjust=False).mean()
        
        return adx.fillna(0)

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
        
        # Calculate ADX Trend Strength
        adx = cls.calculate_adx(high, low, close, 14)
        latest_adx = float(adx.iloc[-1])
        
        if latest_adx < 20:
            trend_strength_desc = "Weak or No Trend"
        elif latest_adx < 25:
            trend_strength_desc = "Developing Trend"
        elif latest_adx < 50:
            trend_strength_desc = "Strong Trend"
        else:
            trend_strength_desc = "Very Strong Trend"

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

        # Confidence Score calculation (0 to 100)
        # Based on indicator alignment
        score_components = []
        
        # 1. Trend alignment: 30% weight
        if trend == "Bullish":
            trend_score_calc = 30.0
            if current_price < latest_sma50:
                trend_score_calc -= 10.0 # deduct if price falls below SMA50 despite primary bullish trend
        elif trend == "Bearish":
            trend_score_calc = 30.0
            if current_price > latest_sma50:
                trend_score_calc -= 10.0
        elif trend in ["Weak Bullish", "Weak Bearish"]:
            trend_score_calc = 15.0
        else: # Sideways
            trend_score_calc = 10.0
        score_components.append(max(0.0, trend_score_calc))
        
        # 2. RSI alignment with trend: 20% weight
        rsi_val = float(rsi.iloc[-1])
        rsi_score = 10.0  # Base RSI score
        if "Bullish" in trend:
            if 40 <= rsi_val <= 68:
                rsi_score = 20.0  # Strong momentum, not overbought yet
            elif rsi_val > 68:
                rsi_score = 8.0   # Overbought risk of reversal
            elif rsi_val < 40:
                rsi_score = 0.0   # Divergent momentum
        elif "Bearish" in trend:
            if 32 <= rsi_val <= 60:
                rsi_score = 20.0  # Strong downward momentum
            elif rsi_val < 32:
                rsi_score = 8.0   # Oversold risk of rebound
            elif rsi_val > 60:
                rsi_score = 0.0   # Divergent momentum
        else: # Sideways
            if 40 <= rsi_val <= 60:
                rsi_score = 20.0  # Stable neutral RSI is good for range trading
            else:
                rsi_score = 10.0
        score_components.append(rsi_score)
        
        # 3. MACD alignment with trend: 20% weight
        is_macd_bullish = macd_line.iloc[-1] > macd_signal.iloc[-1]
        macd_score = 10.0 # Base MACD score
        if "Bullish" in trend:
            macd_score = 20.0 if is_macd_bullish else 5.0
        elif "Bearish" in trend:
            macd_score = 20.0 if not is_macd_bullish else 5.0
        else: # Sideways
            macd_score = 10.0
        score_components.append(macd_score)
        
        # 4. Bollinger Bands position: 15% weight
        bb_upper_val = bb_upper.iloc[-1]
        bb_lower_val = bb_lower.iloc[-1]
        bb_width = bb_upper_val - bb_lower_val
        bb_percent = (current_price - bb_lower_val) / bb_width if bb_width > 0 else 0.5
        
        bb_score = 5.0
        if "Bullish" in trend:
            if 0.5 <= bb_percent <= 0.95:
                bb_score = 15.0  # Riding upper band cleanly
            elif bb_percent > 0.95:
                bb_score = 10.0  # Extended, close to upper band break
        elif "Bearish" in trend:
            if 0.05 <= bb_percent <= 0.5:
                bb_score = 15.0  # Riding lower band cleanly
            elif bb_percent < 0.05:
                bb_score = 10.0  # Extended, close to lower band break
        else: # Sideways
            if 0.2 <= bb_percent <= 0.8:
                bb_score = 15.0  # Safely within bounds
        score_components.append(bb_score)
        
        # 5. Volume Confirmation: 15% weight
        vol_score = 5.0
        if volume_signal in ["Bullish Accumulation", "Bearish Distribution"]:
            vol_score = 15.0 # Supported by volume spike
        elif volume_status == "Normal":
            vol_score = 10.0
        score_components.append(vol_score)
        
        # Total sum of components (max 100)
        confidence_score = sum(score_components)
        confidence_score = min(100.0, max(0.0, confidence_score))
        
        if confidence_score < 45:
            confidence_rating = "Low"
        elif confidence_score < 70:
            confidence_rating = "Medium"
        elif confidence_score < 85:
            confidence_rating = "High"
        else:
            confidence_rating = "Strong"

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
                "score": trend_score,
                "adx": latest_adx,
                "strength": trend_strength_desc
            },
            "confidence": {
                "score": confidence_score,
                "rating": confidence_rating
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
