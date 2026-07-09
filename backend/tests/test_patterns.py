import pandas as pd
import numpy as np
from app.services.patterns import ChartPatternDetector

def test_double_top_detection():
    # Construct a price series representing a Double Top
    # Peak 1 at index 5 (value 105.0)
    # Valley at index 10 (value 100.0)
    # Peak 2 at index 15 (value 105.0)
    # Settle down to consolidative range
    prices = [100.0] * 30
    # Slope up to peak 1
    for i in range(1, 6):
        prices[i] = 100.0 + i * 1.0 # 101, 102, 103, 104, 105
    # Slope down to valley
    for i in range(6, 11):
        prices[i] = 105.0 - (i - 5) * 1.0 # 104, 103, 102, 101, 100
    # Slope up to peak 2
    for i in range(11, 16):
        prices[i] = 100.0 + (i - 10) * 1.0 # 101, 102, 103, 104, 105
    # Slope down
    for i in range(16, 22):
        prices[i] = 105.0 - (i - 15) * 1.0 # 104, 103, 102, 101, 100, 99
        
    dates = pd.date_range(start="2026-01-01", periods=30)
    df = pd.DataFrame({
        "Open": prices,
        "High": [p + 0.1 for p in prices],
        "Low": [p - 0.1 for p in prices],
        "Close": prices,
        "Volume": [1000] * 30
    }, index=dates)
    
    result = ChartPatternDetector.detect(df)
    assert isinstance(result, list)
    
    # We should detect a Double Top
    double_tops = [p for p in result if p["name"] == "Double Top"]
    assert len(double_tops) > 0
    assert double_tops[0]["direction"] == "Bearish"
    assert double_tops[0]["probability"] == 72
    assert len(double_tops[0]["points"]) == 3

def test_symmetrical_triangle_detection():
    # Symmetrical triangle: converging highs (105, 103, 101) and lows (95, 97, 99)
    # Generate 40 periods
    prices = [100.0] * 40
    
    # Peak 1 (idx 5)
    for i in range(1, 6): prices[i] = 100.0 + i * 1.0 # 105
    # Valley 1 (idx 10)
    for i in range(6, 11): prices[i] = 105.0 - (i - 5) * 2.0 # 95
    # Peak 2 (idx 15)
    for i in range(11, 16): prices[i] = 95.0 + (i - 10) * 1.6 # 103
    # Valley 2 (idx 20)
    for i in range(16, 21): prices[i] = 103.0 - (i - 15) * 1.2 # 97
    # Peak 3 (idx 25)
    for i in range(21, 26): prices[i] = 97.0 + (i - 20) * 0.8 # 101
    # Valley 3 (idx 30)
    for i in range(26, 31): prices[i] = 101.0 - (i - 25) * 0.4 # 99
    
    dates = pd.date_range(start="2026-01-01", periods=40)
    df = pd.DataFrame({
        "Open": prices,
        "High": [p + 0.1 for p in prices],
        "Low": [p - 0.1 for p in prices],
        "Close": prices,
        "Volume": [1000] * 40
    }, index=dates)

    result = ChartPatternDetector.detect(df)
    assert isinstance(result, list)
    
    triangles = [p for p in result if p["name"] == "Symmetrical Triangle"]
    assert len(triangles) > 0
    assert len(triangles[0]["lines"]) == 2
    assert triangles[0]["lines"][0]["label"] == "Resistance line"

def test_head_and_shoulders_detection():
    # H&S Sequence: P1 (Left Shoulder), V1, P2 (Head), V2, P3 (Right Shoulder)
    # peaks: index 5=105.0 (left), index 15=110.0 (head), index 25=105.0 (right)
    # valleys: index 10=100.0, index 20=100.0
    prices = [100.0] * 35
    
    # Up to Left shoulder (idx 5)
    for i in range(1, 6):
        prices[i] = 100.0 + i * 1.0 # 105
    # Down to Valley 1 (idx 10)
    for i in range(6, 11):
        prices[i] = 105.0 - (i - 5) * 1.0 # 100
    # Up to Head (idx 15)
    for i in range(11, 16):
        prices[i] = 100.0 + (i - 10) * 2.0 # 110
    # Down to Valley 2 (idx 20)
    for i in range(16, 21):
        prices[i] = 110.0 - (i - 15) * 2.0 # 100
    # Up to Right shoulder (idx 25)
    for i in range(21, 26):
        prices[i] = 100.0 + (i - 20) * 1.0 # 105
    # Down past neckline
    for i in range(26, 32):
        prices[i] = 105.0 - (i - 25) * 1.5 # 96

    dates = pd.date_range(start="2026-01-01", periods=35)
    df = pd.DataFrame({
        "Open": prices,
        "High": [p + 0.1 for p in prices],
        "Low": [p - 0.1 for p in prices],
        "Close": prices,
        "Volume": [1000] * 35
    }, index=dates)

    result = ChartPatternDetector.detect(df)
    assert isinstance(result, list)
    
    hs = [p for p in result if p["name"] == "Head & Shoulders"]
    assert len(hs) > 0
    assert hs[0]["direction"] == "Bearish"
    assert hs[0]["probability"] == 82
    assert len(hs[0]["points"]) == 5
