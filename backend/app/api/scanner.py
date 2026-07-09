from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.api import deps
from app.db.session import get_db
from app.crud import watchlist as crud_watchlist
from app.services.scanner import SwingScanner
from app.models.user import User

router = APIRouter()

class ScanFilterConfig(BaseModel):
    name: str  # e.g., rsi, ma, volume_spike, consolidation, gap, 52week
    operator: str  # e.g., lt, gt, golden_cross, crosses_lower, bullish, near_high
    value: Optional[float] = None

class ScanRequest(BaseModel):
    universe: str  # us, nse, watchlist
    filters: List[ScanFilterConfig]

class ScanResult(BaseModel):
    symbol: str
    price: float
    change_percent: float
    scan_score: int
    momentum: str
    risk_score: int
    probability: int
    summary: str

@router.post("/scan", response_model=List[ScanResult])
async def run_scan(
    request: ScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Executes a swing trading market scan using the specified filter settings.
    If universe is set to 'watchlist', it scans tickers compiled from the user's active watchlists.
    """
    custom_tickers = None
    
    # If scanning watchlist, pull all tickers registered in user's watchlists
    if request.universe == "watchlist":
        watchlists = crud_watchlist.get_watchlists_by_user(db, owner_id=current_user.id)
        symbols = set()
        for wl in watchlists:
            for item in wl.items:
                symbols.add(item.symbol)
        custom_tickers = list(symbols)
        if not custom_tickers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your watchlist universe is empty. Search stocks and add symbols first."
            )

    # Convert request filters list to dictionary configurations for Scanner service
    filters_config = [
        {"name": f.name, "operator": f.operator, "value": f.value}
        for f in request.filters
    ]

    try:
        results = await SwingScanner.scan(
            universe_name=request.universe,
            filters_config=filters_config,
            custom_tickers=custom_tickers
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scanner execution error: {str(e)}"
        )
