from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.db.session import get_db
from app.crud import watchlist as crud_watchlist
from app.models.user import User
from app.schemas.watchlist import (
    WatchlistResponse,
    WatchlistCreate,
    WatchlistUpdate,
    WatchlistItemResponse,
    WatchlistItemCreate
)

router = APIRouter()

@router.get("", response_model=List[WatchlistResponse])
def read_watchlists(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve all watchlists for the authenticated user.
    """
    return crud_watchlist.get_watchlists_by_user(db, owner_id=current_user.id)

@router.post("", response_model=WatchlistResponse)
def create_watchlist(
    watchlist_in: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Create a new watchlist.
    """
    return crud_watchlist.create_watchlist(db, obj_in=watchlist_in, owner_id=current_user.id)

@router.put("/{watchlist_id}", response_model=WatchlistResponse)
def update_watchlist(
    watchlist_id: int,
    watchlist_in: WatchlistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update a watchlist name.
    """
    db_obj = crud_watchlist.get_watchlist(db, watchlist_id=watchlist_id, owner_id=current_user.id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return crud_watchlist.update_watchlist(db, db_obj=db_obj, obj_in=watchlist_in)

@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Delete a watchlist.
    """
    success = crud_watchlist.delete_watchlist(db, watchlist_id=watchlist_id, owner_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return None

@router.post("/{watchlist_id}/items", response_model=WatchlistItemResponse)
def add_item_to_watchlist(
    watchlist_id: int,
    item_in: WatchlistItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Add a stock ticker symbol to a watchlist.
    """
    watchlist = crud_watchlist.get_watchlist(db, watchlist_id=watchlist_id, owner_id=current_user.id)
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    item = crud_watchlist.add_watchlist_item(db, watchlist_id=watchlist_id, symbol=item_in.symbol)
    return item

@router.delete("/{watchlist_id}/items/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item_from_watchlist(
    watchlist_id: int,
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Remove a stock ticker symbol from a watchlist.
    """
    watchlist = crud_watchlist.get_watchlist(db, watchlist_id=watchlist_id, owner_id=current_user.id)
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
        
    success = crud_watchlist.remove_watchlist_item(db, watchlist_id=watchlist_id, symbol=symbol)
    if not success:
        raise HTTPException(status_code=404, detail="Symbol not found in this watchlist")
    return None
