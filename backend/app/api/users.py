from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.db.session import get_db
from app.crud import user as crud_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get current logged-in user profile.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user profile / preferences.
    """
    return crud_user.update(db, db_obj=current_user, obj_in=user_in)
