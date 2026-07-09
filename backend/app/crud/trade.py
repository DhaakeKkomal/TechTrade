from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.models.trade import Trade
from app.schemas.trade import TradeCreate, TradeUpdate

def get_trade(db: Session, id: int) -> Optional[Trade]:
    return db.query(Trade).filter(Trade.id == id).first()

def get_user_trades(db: Session, user_id: int) -> List[Trade]:
    return db.query(Trade).filter(Trade.user_id == user_id).order_by(Trade.entry_date.desc()).all()

def create_trade(db: Session, obj_in: TradeCreate, user_id: int) -> Trade:
    pnl = 0.0
    status = "OPEN"
    exit_date = None

    if obj_in.exit_price is not None:
        status = "CLOSED"
        exit_date = datetime.now(timezone.utc)
        if obj_in.direction.upper() == "LONG":
            pnl = (obj_in.exit_price - obj_in.entry_price) * obj_in.position_size
        else:
            pnl = (obj_in.entry_price - obj_in.exit_price) * obj_in.position_size

    db_obj = Trade(
        user_id=user_id,
        symbol=obj_in.symbol.upper(),
        direction=obj_in.direction.upper(),
        entry_price=obj_in.entry_price,
        exit_price=obj_in.exit_price,
        stop_loss=obj_in.stop_loss,
        target=obj_in.target,
        position_size=obj_in.position_size,
        notes=obj_in.notes or "",
        emotions_before=obj_in.emotions_before,
        emotions_after=obj_in.emotions_after,
        chart_image_url=obj_in.chart_image_url,
        status=status,
        exit_date=exit_date,
        pnl=pnl
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_trade(db: Session, db_obj: Trade, obj_in: TradeUpdate) -> Trade:
    update_data = obj_in.dict(exclude_unset=True)
    
    # Check if closing trade
    if "exit_price" in update_data and update_data["exit_price"] is not None:
        db_obj.status = "CLOSED"
        db_obj.exit_date = datetime.now(timezone.utc)
        exit_p = update_data["exit_price"]
        entry_p = update_data.get("entry_price", db_obj.entry_price)
        size = update_data.get("position_size", db_obj.position_size)
        direction = update_data.get("direction", db_obj.direction).upper()
        
        if direction == "LONG":
            db_obj.pnl = (exit_p - entry_p) * size
        else:
            db_obj.pnl = (entry_p - exit_p) * size

    for field, value in update_data.items():
        if field not in ["exit_price", "pnl", "status", "exit_date"]:
            setattr(db_obj, field, value)

    # If updating an open trade and no exit price was specified, but status was marked open
    if "status" in update_data and update_data["status"] == "OPEN":
        db_obj.status = "OPEN"
        db_obj.exit_price = None
        db_obj.exit_date = None
        db_obj.pnl = 0.0

    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_trade(db: Session, id: int) -> Optional[Trade]:
    db_obj = db.query(Trade).filter(Trade.id == id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj
