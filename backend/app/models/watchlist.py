from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base_class import Base

class Watchlist(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="watchlists")
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")

class WatchlistItem(Base):
    __tablename__ = "watchlistitem"  # Force lower-case table name matching base_class behavior
    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlist.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String, index=True, nullable=False)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    watchlist = relationship("Watchlist", back_populates="items")
