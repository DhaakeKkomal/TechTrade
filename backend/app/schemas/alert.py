from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertCreate(BaseModel):
    symbol: str
    alert_type: str  # RSI Levels, MACD Crossovers, Support, Resistance, Volume Spikes, Breakouts, AI Confidence Threshold
    channel: str     # Comma-separated string, e.g. "Email, Browser"
    condition: str   # ABOVE, BELOW, CROSSES
    value: float

class AlertResponse(BaseModel):
    id: int
    symbol: str
    alert_type: str
    channel: str
    condition: str
    value: float
    is_active: bool
    triggered_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
