import pandas as pd
import numpy as np
from app.services.scanner import (
    SwingScanner, RsiFilter, MaFilter, BollingerFilter,
    VolumeSpikeFilter, BreakoutFilter, ConsolidationFilter,
    AtrFilter, RelativeStrengthFilter, GapFilter, FiftyTwoWeekFilter
)

def create_mock_df(size=30) -> pd.DataFrame:
    dates = pd.date_range(start="2026-01-01", periods=size)
    return pd.DataFrame({
        "Open": [100.0] * size,
        "High": [101.0] * size,
        "Low": [99.0] * size,
        "Close": [100.0] * size,
        "Volume": [1000] * size
    }, index=dates)

def test_indicators_preprocessor():
    df = create_mock_df(250)
    processed = SwingScanner.calculate_indicators(df)
    
    assert "SMA20" in processed.columns
    assert "EMA20" in processed.columns
    assert "BB_Upper" in processed.columns
    assert "RSI" in processed.columns
    assert "MACD" in processed.columns
    assert "ATR" in processed.columns
    assert "High_52W" in processed.columns

def test_rsi_filter():
    df = create_mock_df()
    df["RSI"] = [50.0] * 30
    
    # Test Less Than operator
    f_lt = RsiFilter("lt", 40.0)
    assert not f_lt.evaluate(df)
    df["RSI"].iloc[-1] = 35.0
    assert f_lt.evaluate(df)

    # Test Greater Than operator
    f_gt = RsiFilter("gt", 70.0)
    assert not f_gt.evaluate(df)
    df["RSI"].iloc[-1] = 75.0
    assert f_gt.evaluate(df)

def test_ma_filter():
    df = create_mock_df()
    
    # Test Golden Cross
    df["SMA50"] = [100.0] * 30
    df["SMA200"] = [101.0] * 30
    f_cross = MaFilter("golden_cross")
    assert not f_cross.evaluate(df)
    
    # Trigger cross: current SMA50 > SMA200 (102 > 101), previous <=
    df["SMA50"].iloc[-1] = 102.0
    assert f_cross.evaluate(df)

def test_bollinger_filter():
    df = create_mock_df()
    df["BB_Upper"] = [105.0] * 30
    df["BB_Lower"] = [95.0] * 30
    
    f_bb = BollingerFilter("price_below_lower")
    assert not f_bb.evaluate(df)
    df["Close"].iloc[-1] = 94.0
    assert f_bb.evaluate(df)

def test_volume_spike_filter():
    df = create_mock_df()
    df["Vol_SMA20"] = [1000.0] * 30
    
    f_vol = VolumeSpikeFilter("gt", 2.0)
    assert not f_vol.evaluate(df)
    df["Volume"].iloc[-1] = 2500.0
    assert f_vol.evaluate(df)

def test_breakout_filter():
    df = create_mock_df()
    # Fill past highs
    df["High"] = [102.0] * 30
    df["Low"] = [98.0] * 30
    
    f_break = BreakoutFilter("bullish")
    assert not f_break.evaluate(df)
    df["Close"].iloc[-1] = 103.0
    assert f_break.evaluate(df)

def test_consolidation_filter():
    df = create_mock_df()
    # Squeeze: Bandwidth = (Upper - Lower) / Middle
    # If upper=101, lower=99, middle=100 -> bandwidth = (101-99)/100 = 0.02 (< 0.06 threshold)
    df["BB_Upper"] = [101.0] * 30
    df["BB_Lower"] = [99.0] * 30
    df["BB_Middle"] = [100.0] * 30
    
    f_squeeze = ConsolidationFilter("lt", 0.05)
    assert f_squeeze.evaluate(df)

def test_gap_filter():
    df = create_mock_df()
    # Gap Up: Open of current > Close of previous
    df["Close"].iloc[-2] = 100.0
    df["Open"].iloc[-1] = 102.0
    
    f_gap = GapFilter("up", 1.5)
    assert f_gap.evaluate(df)

def test_fifty_two_week_filter():
    df = create_mock_df()
    df["High_52W"] = [120.0] * 30
    df["Low_52W"] = [80.0] * 30
    
    f_high = FiftyTwoWeekFilter("near_high")
    assert not f_high.evaluate(df)
    df["Close"].iloc[-1] = 118.0
    assert f_high.evaluate(df)
