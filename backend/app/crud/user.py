from typing import Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def get(db: Session, id: int) -> Optional[User]:
    return db.query(User).filter(User.id == id).first()

def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create(db: Session, obj_in: UserCreate) -> User:
    db_obj = User(
        email=obj_in.email,
        hashed_password=get_password_hash(obj_in.password),
        full_name=obj_in.full_name,
        preferences=obj_in.preferences or {}
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(
    db: Session, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
) -> User:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        db_obj.hashed_password = hashed_password
        del update_data["password"]
        
    for field in update_data:
        if hasattr(db_obj, field):
            setattr(db_obj, field, update_data[field])
            
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def authenticate(db: Session, email: str, password: str) -> Optional[User]:
    user = get_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
