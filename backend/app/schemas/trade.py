from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TradeCreate(BaseModel):
    symbol: str
    direction: str  # LONG or SHORT
    entry_price: float
    exit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    target: Optional[float] = None
    position_size: int
    notes: Optional[str] = ""
    emotions_before: Optional[str] = None
    emotions_after: Optional[str] = None
    chart_image_url: Optional[str] = None

class TradeUpdate(BaseModel):
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    target: Optional[float] = None
    position_size: Optional[int] = None
    notes: Optional[str] = None
    emotions_before: Optional[str] = None
    emotions_after: Optional[str] = None
    chart_image_url: Optional[str] = None
    status: Optional[str] = None

class TradeOut(BaseModel):
    id: int
    symbol: str
    direction: str
    entry_price: float
    exit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    target: Optional[float] = None
    position_size: int
    notes: Optional[str] = ""
    emotions_before: Optional[str] = None
    emotions_after: Optional[str] = None
    chart_image_url: Optional[str] = None
    status: str
    entry_date: datetime
    exit_date: Optional[datetime] = None
    pnl: float

    class Config:
        from_attributes = True

class JournalStats(BaseModel):
    win_rate: float
    risk_reward: float
    average_gain: float
    average_loss: float
    expectancy: float
    profit_factor: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    total_pnl: float

class MonthlyReport(BaseModel):
    month_name: str
    total_pnl: float
    win_rate: float
    profit_factor: float
    stats: JournalStats
    ai_feedback: str
