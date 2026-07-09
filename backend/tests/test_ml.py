import pytest
import pandas as pd
import numpy as np
from unittest.mock import patch
from app.services.ml import MLEngine

def test_ml_features_extraction():
    # Construct mock daily pricing history
    prices = [100.0, 101.0, 102.0, 100.0, 99.0, 98.0, 101.0, 103.0, 102.0, 105.0] * 5
    dates = pd.date_range(start="2026-01-01", periods=len(prices))
    df = pd.DataFrame({
        "Open": prices,
        "High": [p + 1.0 for p in prices],
        "Low": [p - 1.0 for p in prices],
        "Close": prices,
        "Volume": [1000] * len(prices)
    }, index=dates)

    engine = MLEngine()
    X, y, cleaned = engine._prepare_features(df)
    
    # 50 rows, minus shifting bounds and windowing limits
    assert len(X) > 10
    assert X.shape[1] == 8 # 8 feature columns
    assert len(y) == len(X)
    assert "Momentum" in cleaned.columns
    assert "ATR" in cleaned.columns

def test_ml_train_and_predict():
    prices = [100.0, 101.0, 102.0, 100.0, 99.0, 98.0, 101.0, 103.0, 102.0, 105.0] * 5
    dates = pd.date_range(start="2026-01-01", periods=len(prices))
    df = pd.DataFrame({
        "Open": prices,
        "High": [p + 1.0 for p in prices],
        "Low": [p - 1.0 for p in prices],
        "Close": prices,
        "Volume": [1000] * len(prices)
    }, index=dates)

    engine = MLEngine()
    
    with patch("app.services.yfinance_service.YFinanceService.get_stock_history", return_value=df):
        # 1. Retrain Random Forest model
        train_res = engine.train_model("AAPL", "Random Forest")
        assert train_res["success"] is True
        assert train_res["accuracy"] >= 0.0
        
        # 2. Run prediction using LSTM recurrent fallback cell
        pred_res = engine.predict_market("AAPL", "LSTM")
        assert pred_res["symbol"] == "AAPL"
        assert pred_res["model_type"] == "LSTM"
        assert "trend" in pred_res
        assert pred_res["direction_probability"] >= 0.0
        assert pred_res["expected_volatility"] >= 0.0
        assert pred_res["breakout_probability"] >= 0.0
        assert "confidence_interval" in pred_res
        assert pred_res["confidence_interval"]["lower"] < pred_res["confidence_interval"]["upper"]
