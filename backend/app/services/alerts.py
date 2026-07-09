import pandas as pd
import numpy as np
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.services.yfinance_service import YFinanceService
from app.services.indicators import TechnicalIndicators

class AlertsService:
    @classmethod
    def check_alerts(cls, db: Session, symbol: str) -> int:
        """
        Pulls yahoo finance daily prices, calculates current indicators,
        evaluates active alerts, and dispatches simulated notifications.
        Returns: number of triggered alerts.
        """
        active_alerts = (
            db.query(Alert)
            .filter(Alert.symbol == symbol.upper(), Alert.is_active == True)
            .all()
        )
        if not active_alerts:
            return 0
            
        df = YFinanceService.get_stock_history(symbol, period="1mo", interval="1d")
        if df.empty or len(df) < 5:
            return 0
            
        # Calculate necessary indicators
        df = df.copy()
        df["RSI"] = TechnicalIndicators.calculate_rsi(df["Close"], 14)
        macd, signal, _ = TechnicalIndicators.calculate_macd(df["Close"])
        df["MACD"] = macd
        df["MACD_Signal"] = signal
        
        upper, _, lower = TechnicalIndicators.calculate_bollinger_bands(df["Close"], 20)
        df["BB_Upper"] = upper
        df["BB_Lower"] = lower
        df["Volume_SMA"] = TechnicalIndicators.calculate_sma(df["Volume"], 20)
        
        # Latest values
        close = float(df["Close"].iloc[-1])
        prev_close = float(df["Close"].iloc[-2]) if len(df) > 1 else close
        rsi = float(df["RSI"].iloc[-1])
        macd_val = float(df["MACD"].iloc[-1])
        sig_val = float(df["MACD_Signal"].iloc[-1])
        prev_macd = float(df["MACD"].iloc[-2]) if len(df) > 1 else macd_val
        prev_sig = float(df["MACD_Signal"].iloc[-2]) if len(df) > 1 else sig_val
        
        volume = float(df["Volume"].iloc[-1])
        vol_sma = float(df["Volume_SMA"].iloc[-1]) if not pd.isna(df["Volume_SMA"].iloc[-1]) else volume
        bb_upper = float(df["BB_Upper"].iloc[-1]) if not pd.isna(df["BB_Upper"].iloc[-1]) else close
        bb_lower = float(df["BB_Lower"].iloc[-1]) if not pd.isna(df["BB_Lower"].iloc[-1]) else close
        
        triggered_count = 0
        
        for alert in active_alerts:
            triggered = False
            msg = ""
            
            if alert.alert_type == "RSI Levels":
                if alert.condition == "ABOVE" and rsi > alert.value:
                    triggered = True
                    msg = f"RSI level for {symbol} reached {rsi:.1f} (Threshold: ABOVE {alert.value})"
                elif alert.condition == "BELOW" and rsi < alert.value:
                    triggered = True
                    msg = f"RSI level for {symbol} reached {rsi:.1f} (Threshold: BELOW {alert.value})"
                    
            elif alert.alert_type == "MACD Crossovers":
                # Check for signal line crosses
                if alert.condition == "ABOVE" and prev_macd <= prev_sig and macd_val > sig_val:
                    triggered = True
                    msg = f"MACD bullish crossover detected for {symbol} (MACD crossed ABOVE Signal)"
                elif alert.condition == "BELOW" and prev_macd >= prev_sig and macd_val < sig_val:
                    triggered = True
                    msg = f"MACD bearish crossover detected for {symbol} (MACD crossed BELOW Signal)"
                    
            elif alert.alert_type == "Volume Spikes":
                # Value represents spike factor, e.g. 2 means 2x Volume SMA
                if volume > (alert.value * vol_sma):
                    triggered = True
                    msg = f"Volume spike detected on {symbol}: current volume {volume:,.0f} exceeds {alert.value}x SMA ({vol_sma:,.0f})"
                    
            elif alert.alert_type == "Breakouts":
                if alert.condition == "ABOVE" and close > bb_upper:
                    triggered = True
                    msg = f"Price breakout ABOVE Bollinger Upper Band (${bb_upper:.2f}) on {symbol} at ${close:.2f}"
                elif alert.condition == "BELOW" and close < bb_lower:
                    triggered = True
                    msg = f"Price breakout BELOW Bollinger Lower Band (${bb_lower:.2f}) on {symbol} at ${close:.2f}"
                    
            elif alert.alert_type == "Support":
                # Support breach below level
                if prev_close >= alert.value and close < alert.value:
                    triggered = True
                    msg = f"Support level breach: price of {symbol} fell below support of ${alert.value:.2f} to ${close:.2f}"
                    
            elif alert.alert_type == "Resistance":
                # Resistance break above level
                if prev_close <= alert.value and close > alert.value:
                    triggered = True
                    msg = f"Resistance level breakout: price of {symbol} rose above resistance of ${alert.value:.2f} to ${close:.2f}"
                    
            elif alert.alert_type == "AI Confidence Threshold":
                # Mock AI confidence scoring threshold check
                # If alert.condition ABOVE or BELOW, trigger
                ai_conf = 85.0 # baseline mock confidence score
                if alert.condition == "ABOVE" and ai_conf > alert.value:
                    triggered = True
                    msg = f"AI Confidence threshold met on {symbol}: {ai_conf:.1f}% exceeds threshold of {alert.value}%"
            
            if triggered:
                alert.is_active = False # Deactivate one-shot alert
                alert.triggered_at = datetime.now(timezone.utc)
                db.add(alert)
                db.commit()
                
                cls.send_notification(alert, msg)
                triggered_count += 1
                
        return triggered_count

    @classmethod
    def send_notification(cls, alert: Alert, message: str) -> None:
        """
        Dispatches alert messages across requested channels (simulated).
        """
        channels = [c.strip() for c in alert.channel.split(",")]
        for chan in channels:
            if chan == "Email":
                print(f"[Simulated Email Dispatch] To User ID {alert.user_id}: {message}")
            elif chan == "Telegram":
                print(f"[Simulated Telegram Message] To User ID {alert.user_id}: {message}")
            elif chan == "Push":
                print(f"[Simulated Mobile Push Notification] To User ID {alert.user_id}: {message}")
            elif chan == "Browser":
                print(f"[Simulated Browser Notification Toast] To User ID {alert.user_id}: {message}")
