from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

# Watchlist Item
class WatchlistItemBase(BaseModel):
    symbol: str

class WatchlistItemCreate(WatchlistItemBase):
    pass

class WatchlistItemResponse(WatchlistItemBase):
    id: int
    watchlist_id: int
    added_at: datetime

    class Config:
        from_attributes = True

# Watchlist
class WatchlistBase(BaseModel):
    name: str

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistUpdate(WatchlistBase):
    pass

class WatchlistResponse(WatchlistBase):
    id: int
    owner_id: int
    items: List[WatchlistItemResponse] = []

    class Config:
        from_attributes = True
