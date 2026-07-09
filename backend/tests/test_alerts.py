import pytest
import pandas as pd
from unittest.mock import patch
from app.models.alert import Alert
from app.services.alerts import AlertsService

def test_alert_db_creation(db_session):
    alert = Alert(
        user_id=1,
        symbol="AAPL",
        alert_type="RSI Levels",
        condition="ABOVE",
        value=70.0,
        channel="Email, Browser"
    )
    db_session.add(alert)
    db_session.commit()
    db_session.refresh(alert)
    
    assert alert.id is not None
    assert alert.symbol == "AAPL"
    assert alert.is_active is True
    assert alert.triggered_at is None

def test_alerts_condition_evaluation(db_session):
    # Setup test alert
    alert = Alert(
        user_id=1,
        symbol="TSLA",
        alert_type="RSI Levels",
        condition="ABOVE",
        value=70.0,
        channel="Browser"
    )
    db_session.add(alert)
    db_session.commit()
    db_session.refresh(alert)
    
    # Mock stock pricing dataframe with RSI=75.0 (exceeds threshold)
    dates = pd.date_range(start="2026-01-01", periods=25)
    prices = [100.0] * 25
    df = pd.DataFrame({
        "Open": prices,
        "High": [p + 1.0 for p in prices],
        "Low": [p - 1.0 for p in prices],
        "Close": prices,
        "Volume": [1000] * 25
    }, index=dates)
    
    with patch("app.services.yfinance_service.YFinanceService.get_stock_history", return_value=df):
        # We patch indicators calculated to return RSI=75.0
        with patch("app.services.indicators.TechnicalIndicators.calculate_rsi", return_value=pd.Series([75.0] * 25, index=dates)):
            count = AlertsService.check_alerts(db_session, "TSLA")
            assert count == 1
            
            # Check alert is now marked as triggered
            db_session.refresh(alert)
            assert alert.is_active is False
            assert alert.triggered_at is not None
