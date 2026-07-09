import pandas as pd
import numpy as np
from app.services.price_action import PriceActionAnalyzer

def test_swing_and_structure_detection():
    # Construct a price series with a swing high and low break
    prices = [100.0, 101.0, 102.0, 103.0, 104.0, 105.0, 104.0, 103.0, 102.0, 101.0, 100.0, 
              102.0, 104.0, 106.0, 108.0, 110.0, 108.0, 107.0, 106.0, 105.0]
    
    dates = pd.date_range(start="2026-01-01", periods=len(prices))
    df = pd.DataFrame({
        "Open": prices,
        "High": [x + 0.2 for x in prices],
        "Low": [x - 0.2 for x in prices],
        "Close": prices,
        "Volume": [1000] * len(prices)
    }, index=dates)

    result = PriceActionAnalyzer.analyze(df)
    
    assert isinstance(result, dict)
    assert "swings" in result
    assert "structure_events" in result
    
    # We should have found some swings
    assert len(result["swings"]) > 0
    # The peak at 105.0 is around index 5. With window=5, it can be detected as high.
    # The break past 105.0 (high=105.2) happens around index 13 (close=106.0).
    # This should trigger a Bullish Break (BOS or CHOCH)
    assert len(result["structure_events"]) > 0
    assert any("Bullish" in evt["name"] for evt in result["structure_events"])

def test_candlestick_patterns():
    # Create 30 neutral bars
    opens = [100.0] * 30
    closes = [100.0] * 30
    highs = [100.2] * 30
    lows = [99.8] * 30

    # Inject a Doji (very small body) at index 10
    opens[10] = 100.0
    closes[10] = 100.01
    highs[10] = 101.0
    lows[10] = 99.0

    # Inject a Hammer at index 15
    # Close near High, body is small, long lower shadow.
    # o=100, c=100.5, h=100.6, l=98.0 -> Body = 0.5, lower shadow = 2.0 (>= 2 * body), upper shadow = 0.1 (<= 0.2 * body)
    opens[15] = 100.0
    closes[15] = 100.5
    highs[15] = 100.6
    lows[15] = 98.0

    # Inject a Bullish Engulfing at index 20 (previous is red, current is green engulfing)
    # index 19: o=102, c=100 -> red body 2.0
    # index 20: o=99.5, c=103.0 -> green body 3.5, engulfs
    opens[19] = 102.0
    closes[19] = 100.0
    highs[19] = 102.1
    lows[19] = 99.9

    opens[20] = 99.5
    closes[20] = 103.0
    highs[20] = 103.2
    lows[20] = 99.4

    dates = pd.date_range(start="2026-01-01", periods=30)
    df = pd.DataFrame({
        "Open": opens,
        "High": highs,
        "Low": lows,
        "Close": closes,
        "Volume": [1000] * 30
    }, index=dates)

    result = PriceActionAnalyzer.analyze(df)
    assert "candlesticks" in result
    
    # Verify Doji is found
    dojis = [c for c in result["candlesticks"] if c["name"] == "Doji"]
    assert len(dojis) > 0

    # Verify Hammer is found
    hammers = [c for c in result["candlesticks"] if c["name"] == "Hammer"]
    assert len(hammers) > 0

    # Verify Bullish Engulfing is found
    engulfings = [c for c in result["candlesticks"] if c["name"] == "Bullish Engulfing"]
    assert len(engulfings) > 0

def test_fair_value_gaps():
    opens = [100.0] * 30
    closes = [100.0] * 30
    highs = [100.2] * 30
    lows = [99.8] * 30

    # Inject a Bullish FVG at index 14 (candle 12, 13, 14)
    # Candle 12 (idx 12): high=100.2, low=99.8
    # Candle 13 (idx 13): rapid upward move. o=100.3, c=105.0, h=105.5, l=100.2
    # Candle 14 (idx 14): o=105.1, c=106.0, h=106.5, l=102.0
    # Since Low[14] (102.0) > High[12] (100.2), we have FVG between 100.2 and 102.0
    highs[12] = 100.2
    lows[12] = 99.8
    
    opens[13] = 100.3
    closes[13] = 105.0
    highs[13] = 105.5
    lows[13] = 100.2

    opens[14] = 105.1
    closes[14] = 106.0
    highs[14] = 106.5
    lows[14] = 102.0

    dates = pd.date_range(start="2026-01-01", periods=30)
    df = pd.DataFrame({
        "Open": opens,
        "High": highs,
        "Low": lows,
        "Close": closes,
        "Volume": [1000] * 30
    }, index=dates)

    result = PriceActionAnalyzer.analyze(df)
    assert "fvgs" in result
    assert len(result["fvgs"]) > 0
    assert result["fvgs"][0]["type"] == "bullish_fvg"
    assert result["fvgs"][0]["bottom"] == 100.2
    assert result["fvgs"][0]["top"] == 102.0
