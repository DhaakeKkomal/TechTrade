import pytest
import pandas as pd
import numpy as np
from app.services.backtester import StrategyBacktester

def test_backtest_rule_evaluation():
    # Construct a simple dataframe
    df = pd.DataFrame({
        "Close": [10.0, 12.0, 15.0, 11.0, 9.0],
        "SMA50": [11.0, 11.0, 11.0, 11.0, 11.0]
    })
    
    # 1. Test GREATER_THAN
    rule1 = {"indicator": "Close", "condition": "GREATER_THAN", "value": "11.0"}
    assert StrategyBacktester._evaluate_rule(df, 2, rule1)  # 15.0 > 11.0
    assert not StrategyBacktester._evaluate_rule(df, 4, rule1)  # 9.0 < 11.0

    # 2. Test CROSSES_ABOVE
    rule2 = {"indicator": "Close", "condition": "CROSSES_ABOVE", "value": "SMA50"}
    assert StrategyBacktester._evaluate_rule(df, 1, rule2)   # 10.0 <= 11.0 and 12.0 > 11.0
    assert not StrategyBacktester._evaluate_rule(df, 2, rule2)  # 12.0 > 11.0 and 15.0 > 11.0

def test_backtest_simulation_math():
    # Generate 50 periods of increasing/decreasing values to trigger buy and sell signals
    prices = [100.0] * 50
    # RSI or indicator proxy values
    rsi_vals = [50.0] * 50
    
    # Inject buy signal (RSI < 30) at index 10
    rsi_vals[10] = 25.0
    prices[10] = 95.0
    
    # Inject sell signal (RSI > 70) at index 20
    rsi_vals[20] = 75.0
    prices[20] = 115.0
    
    dates = pd.date_range(start="2026-01-01", periods=50)
    df = pd.DataFrame({
        "Open": prices,
        "High": [p + 1.0 for p in prices],
        "Low": [p - 1.0 for p in prices],
        "Close": prices,
        "Volume": [1000] * 50
    }, index=dates)

    # Mock get_stock_history on YFinanceService to return our df
    from unittest.mock import patch
    with patch("app.services.yfinance_service.YFinanceService.get_stock_history", return_value=df):
        buy_rules = [{"indicator": "RSI", "condition": "LESS_THAN", "value": "30"}]
        sell_rules = [{"indicator": "RSI", "condition": "GREATER_THAN", "value": "70"}]
        
        # We need to make sure _calculate_indicators does not overwrite our injected columns
        original_calc = StrategyBacktester._calculate_indicators
        
        def mock_calc(data_df):
            # Keep our custom RSI
            data_df = original_calc(data_df)
            data_df["RSI"] = rsi_vals
            return data_df
            
        with patch.object(StrategyBacktester, "_calculate_indicators", side_effect=mock_calc):
            result = StrategyBacktester.run_backtest(
                symbol="AAPL",
                start_date="2026-01-01",
                end_date="2026-03-01",
                initial_capital=100000.0,
                buy_rules=buy_rules,
                sell_rules=sell_rules
            )
            
            assert "equity_curve" in result
            assert result["win_rate"] == 100.0
            assert len(result["trades_history"]) == 1
            assert result["trades_history"][0]["pnl"] > 0
            assert result["sharpe_ratio"] != 0.0
