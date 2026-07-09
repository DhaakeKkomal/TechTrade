from pydantic import BaseModel
from typing import List, Optional

class BacktestRule(BaseModel):
    indicator: str
    condition: str
    value: str

class BacktestRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    initial_capital: Optional[float] = 100000.0
    buy_rules: List[BacktestRule]
    sell_rules: List[BacktestRule]

class EquityCurveItem(BaseModel):
    time: str
    value: float

class BacktestTradeItem(BaseModel):
    symbol: str
    type: str
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    pnl: float
    pnl_percent: float

class BacktestResult(BaseModel):
    equity_curve: List[EquityCurveItem]
    win_rate: float
    max_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float
    cagr: float
    profit_factor: float
    trades_history: List[BacktestTradeItem]
    summary: str
