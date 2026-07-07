from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.watchlist import Watchlist, WatchlistItem
from app.schemas.watchlist import WatchlistCreate, WatchlistUpdate

def get_watchlists_by_user(db: Session, owner_id: int) -> List[Watchlist]:
    return db.query(Watchlist).filter(Watchlist.owner_id == owner_id).all()

def get_watchlist(db: Session, watchlist_id: int, owner_id: int) -> Optional[Watchlist]:
    return db.query(Watchlist).filter(Watchlist.id == watchlist_id, Watchlist.owner_id == owner_id).first()

def create_watchlist(db: Session, obj_in: WatchlistCreate, owner_id: int) -> Watchlist:
    db_obj = Watchlist(name=obj_in.name, owner_id=owner_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_watchlist(db: Session, db_obj: Watchlist, obj_in: WatchlistUpdate) -> Watchlist:
    db_obj.name = obj_in.name
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_watchlist(db: Session, watchlist_id: int, owner_id: int) -> bool:
    db_obj = get_watchlist(db, watchlist_id, owner_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False

def add_watchlist_item(db: Session, watchlist_id: int, symbol: str) -> Optional[WatchlistItem]:
    # Check if item already exists in this watchlist
    existing = db.query(WatchlistItem).filter(
        WatchlistItem.watchlist_id == watchlist_id,
        WatchlistItem.symbol == symbol
    ).first()
    
    if existing:
        return existing
        
    db_obj = WatchlistItem(watchlist_id=watchlist_id, symbol=symbol.upper())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_watchlist_item(db: Session, watchlist_id: int, symbol: str) -> bool:
    db_obj = db.query(WatchlistItem).filter(
        WatchlistItem.watchlist_id == watchlist_id,
        WatchlistItem.symbol == symbol.upper()
    ).first()
    
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False
