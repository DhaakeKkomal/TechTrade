import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.api import deps
from app.db.session import get_db
from app.models.user import User
from app.schemas.trade import TradeOut, TradeUpdate, JournalStats, MonthlyReport
from app.crud import trade as crud_trade
from app.services.ai_coach import AICoachService

router = APIRouter()

@router.get("/trades", response_model=List[TradeOut])
def read_trades(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve all trade logs logged by the current user.
    """
    return crud_trade.get_user_trades(db, user_id=current_user.id)

@router.post("/trades", response_model=TradeOut)
async def create_trade(
    symbol: str = Form(...),
    direction: str = Form(...),
    entry_price: float = Form(...),
    exit_price: Optional[float] = Form(None),
    stop_loss: Optional[float] = Form(None),
    target: Optional[float] = Form(None),
    position_size: int = Form(...),
    notes: Optional[str] = Form(""),
    emotions_before: Optional[str] = Form(None),
    emotions_after: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Log a new trading journal entry. If file is supplied, it uploads the screenshot
    attachment to static asset directories.
    """
    chart_image_url = None
    if file:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attachment must be an image.")
        
        # Resolve uploads directory
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(uploads_dir, filename)
        
        try:
            with open(filepath, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            # Reference path mapping
            chart_image_url = f"/static/uploads/{filename}"
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to write image attachment: {str(e)}"
            )

    # Convert form inputs to schema representation
    from app.schemas.trade import TradeCreate
    obj_in = TradeCreate(
        symbol=symbol,
        direction=direction,
        entry_price=entry_price,
        exit_price=exit_price,
        stop_loss=stop_loss,
        target=target,
        position_size=position_size,
        notes=notes,
        emotions_before=emotions_before,
        emotions_after=emotions_after,
        chart_image_url=chart_image_url
    )

    return crud_trade.create_trade(db, obj_in=obj_in, user_id=current_user.id)

@router.put("/trades/{id}", response_model=TradeOut)
def update_trade(
    id: int,
    obj_in: TradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update or close an existing logged trade.
    """
    db_obj = crud_trade.get_trade(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade record not found.")
    if db_obj.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return crud_trade.update_trade(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/trades/{id}", response_model=TradeOut)
def delete_trade(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Delete a trade record.
    """
    db_obj = crud_trade.get_trade(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade record not found.")
    if db_obj.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return crud_trade.delete_trade(db, id=id)

@router.get("/stats", response_model=JournalStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Compiles aggregate metrics for all CLOSED trades.
    """
    trades = crud_trade.get_user_trades(db, user_id=current_user.id)
    closed = [t for t in trades if t.status == "CLOSED"]
    
    total_trades = len(closed)
    wins = [t.pnl for t in closed if t.pnl > 0]
    losses = [t.pnl for t in closed if t.pnl <= 0]
    
    winning_cnt = len(wins)
    losing_cnt = len(losses)
    total_pnl = sum(t.pnl for t in closed)
    
    win_rate = (winning_cnt / total_trades) * 100 if total_trades > 0 else 0.0
    avg_gain = sum(wins) / winning_cnt if winning_cnt > 0 else 0.0
    avg_loss = abs(sum(losses) / losing_cnt) if losing_cnt > 0 else 0.0
    
    gross_profit = sum(wins)
    gross_loss = abs(sum(losses))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else (gross_profit if gross_profit > 0 else 1.0)
    
    expectancy = (win_rate / 100 * avg_gain) - ((100 - win_rate) / 100 * avg_loss)
    
    # Risk Reward
    rr_ratios = []
    for t in closed:
        if t.stop_loss and t.target:
            denom = abs(t.entry_price - t.stop_loss)
            if denom > 0:
                rr_ratios.append(abs(t.target - t.entry_price) / denom)
    risk_reward = sum(rr_ratios) / len(rr_ratios) if rr_ratios else (avg_gain / avg_loss if avg_loss > 0 else 0.0)

    return {
        "win_rate": win_rate,
        "risk_reward": risk_reward,
        "average_gain": avg_gain,
        "average_loss": avg_loss,
        "expectancy": expectancy,
        "profit_factor": profit_factor,
        "total_trades": total_trades,
        "winning_trades": winning_cnt,
        "losing_trades": losing_cnt,
        "total_pnl": total_pnl
    }

@router.get("/report", response_model=MonthlyReport)
async def get_report(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Returns the monthly performance stats and compiled AI coach overview review.
    """
    now = datetime.now(timezone.utc)
    y = year or now.year
    m = month or now.month
    return await AICoachService.generate_monthly_report(
        user_id=current_user.id,
        year=y,
        month=m,
        db=db
    )

@router.get("/trades/{id}/ai-coach")
async def get_trade_ai_feedback(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Provides specific AI coach diagnostics (discipline, emotional bias, errors) for a single trade.
    """
    db_obj = crud_trade.get_trade(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Trade record not found.")
    if db_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return await AICoachService.analyze_trade(db_obj)
