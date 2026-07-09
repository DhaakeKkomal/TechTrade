from fastapi import APIRouter
from app.api import auth, users, watchlists, stocks, scanner

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(watchlists.router, prefix="/watchlists", tags=["watchlists"])
api_router.include_router(stocks.router, prefix="/stocks", tags=["stocks"])
api_router.include_router(scanner.router, prefix="/scanner", tags=["scanner"])
