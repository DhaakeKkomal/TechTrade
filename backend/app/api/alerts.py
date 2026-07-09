from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.user import User
from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.alerts import AlertsService

router = APIRouter()

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Returns all configured alerts for the logged-in user.
    """
    return db.query(Alert).filter(Alert.user_id == current_user.id).all()

@router.post("", response_model=AlertResponse)
def create_alert(
    request: AlertCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Configures a new price/indicator alert.
    """
    alert = Alert(
        user_id=current_user.id,
        symbol=request.symbol.upper(),
        alert_type=request.alert_type,
        channel=request.channel,
        condition=request.condition,
        value=request.value
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

@router.delete("/{id}")
def delete_alert(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Cancels and deletes an alert.
    """
    alert = db.query(Alert).filter(Alert.id == id, Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found or unauthorized deletion target"
        )
    db.delete(alert)
    db.commit()
    return {"success": True, "detail": "Alert deleted successfully"}

@router.post("/check")
def check_symbol_alerts(
    symbol: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Triggers chronological check of all active user alerts for a symbol.
    """
    try:
        count = AlertsService.check_alerts(db, symbol)
        return {"success": True, "triggered_count": count}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check alerts: {str(e)}"
        )
