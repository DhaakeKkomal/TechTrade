from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base_class import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String, index=True, nullable=False)
    alert_type = Column(String, nullable=False)  # Breakouts, RSI Levels, MACD Crossovers, Support, Resistance, Volume Spikes, AI Confidence Threshold
    channel = Column(String, nullable=False)  # Email, Telegram, Browser, Push
    condition = Column(String, nullable=False)  # ABOVE, BELOW, CROSSES
    value = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="alerts")
