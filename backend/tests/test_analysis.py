import pandas as pd
import numpy as np
from app.services.indicators import TechnicalIndicators

def test_indicators_math():
    # Generate 100 periods of constant price
    constant_price = 100.0
    dates = pd.date_range(start="2026-01-01", periods=100)
    df_constant = pd.DataFrame({
        "Open": [constant_price] * 100,
        "High": [constant_price] * 100,
        "Low": [constant_price] * 100,
        "Close": [constant_price] * 100,
        "Volume": [1000] * 100
    }, index=dates)

    # 1. Test SMA of constant array
    sma20 = TechnicalIndicators.calculate_sma(df_constant["Close"], 20)
    assert len(sma20) == 100
    assert np.isnan(sma20.iloc[18])
    assert sma20.iloc[19] == 100.0
    assert sma20.iloc[-1] == 100.0

    # 2. Test EMA of constant array
    ema20 = TechnicalIndicators.calculate_ema(df_constant["Close"], 20)
    assert len(ema20) == 100
    assert ema20.iloc[-1] == 100.0

    # 3. Test RSI of constant price (should be close to 50 due to division handle)
    rsi = TechnicalIndicators.calculate_rsi(df_constant["Close"], 14)
    assert len(rsi) == 100
    assert rsi.iloc[-1] == 50.0

    # 4. Test Bollinger Bands of constant price (std dev is 0, bands equal price)
    upper, middle, lower = TechnicalIndicators.calculate_bollinger_bands(df_constant["Close"], 20)
    assert middle.iloc[-1] == 100.0
    assert upper.iloc[-1] == 100.0
    assert lower.iloc[-1] == 100.0


def test_trend_and_sr_detection():
    # Create a zig-zag pattern with local extrema (Peak at 150, Valley at 130)
    prices = []
    # Up to 150 (index 50)
    prices.extend([float(x) for x in range(100, 151)])
    # Down to 130 (index 70)
    prices.extend([float(x) for x in range(149, 129, -1)])
    # Up to 180
    prices.extend([float(x) for x in range(131, 181)])
    
    dates = pd.date_range(start="2026-01-01", periods=len(prices))
    df = pd.DataFrame({
        "Open": prices,
        "High": [x + 0.5 for x in prices],
        "Low": [x - 0.5 for x in prices],
        "Close": prices,
        "Volume": [2000] * len(prices)
    }, index=dates)

    # Test analyze all
    analysis = TechnicalIndicators.analyze_all(df)
    
    assert "error" not in analysis
    assert analysis["current_price"] == 180.0
    
    # We should identify support near 130 and resistance near 150
    assert len(analysis["support_resistance"]["supports"]) > 0
    assert len(analysis["support_resistance"]["resistances"]) > 0
    
    # Check if support level 130 (low of 129.5) or nearby is found
    assert any(abs(s - 129.5) / 129.5 < 0.05 for s in analysis["support_resistance"]["supports"])
    # Check if resistance level 150 (high of 150.5) or nearby is found
    assert any(abs(r - 150.5) / 150.5 < 0.05 for r in analysis["support_resistance"]["resistances"])

