from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.schemas.portfolio import PortfolioSummaryResponse, AIReviewResponse
from app.services.portfolio import PortfolioService

router = APIRouter()

@router.get("", response_model=PortfolioSummaryResponse)
def get_portfolio_summary(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Returns the user's detailed portfolio valuation metrics, allocations, and beta risk.
    """
    try:
        return PortfolioService.get_portfolio_summary(db, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile portfolio summary: {str(e)}"
        )

@router.post("/import-journal")
def import_journal_trades(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Scans Trading Journal closed trades and populates portfolio holdings.
    """
    try:
        count = PortfolioService.import_trades_from_journal(db, current_user.id)
        return {"success": True, "synced_count": count}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import journal trades: {str(e)}"
        )

@router.post("/watchlist-sync")
def sync_watchlist(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Scans Watchlist stock symbols and creates default placeholder portfolio holdings.
    """
    try:
        count = PortfolioService.sync_watchlist_symbols(db, current_user.id)
        return {"success": True, "synced_count": count}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync watchlist symbols: {str(e)}"
        )

@router.get("/ai-review", response_model=AIReviewResponse)
def get_ai_portfolio_review(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Queries the AI Assistant to review asset diversification and risk parameters.
    """
    try:
        review_text = PortfolioService.generate_ai_review(db, current_user.id)
        return {"review": review_text}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Review compilation failed: {str(e)}"
        )
