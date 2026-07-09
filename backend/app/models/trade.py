from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base_class import Base

class Trade(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String, index=True, nullable=False)
    direction = Column(String, nullable=False)  # LONG or SHORT
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    target = Column(Float, nullable=True)
    position_size = Column(Integer, nullable=False)
    notes = Column(String, nullable=True, default="")
    emotions_before = Column(String, nullable=True)
    emotions_after = Column(String, nullable=True)
    chart_image_url = Column(String, nullable=True)
    status = Column(String, nullable=False, default="OPEN")  # OPEN or CLOSED
    entry_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    exit_date = Column(DateTime, nullable=True)
    pnl = Column(Float, default=0.0)

    # Relationships
    owner = relationship("User", back_populates="trades")
