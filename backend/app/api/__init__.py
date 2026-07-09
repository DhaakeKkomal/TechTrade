from fastapi import APIRouter
from app.api import auth, users, watchlists, stocks, scanner, journal, sentiment, backtest, ml, chat, alerts, portfolio, enterprise

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(watchlists.router, prefix="/watchlists", tags=["watchlists"])
api_router.include_router(stocks.router, prefix="/stocks", tags=["stocks"])
api_router.include_router(scanner.router, prefix="/scanner", tags=["scanner"])
api_router.include_router(journal.router, prefix="/journal", tags=["journal"])
api_router.include_router(sentiment.router, prefix="/sentiment", tags=["sentiment"])
api_router.include_router(backtest.router, prefix="/backtest", tags=["backtest"])
api_router.include_router(ml.router, prefix="/ml", tags=["ml"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(enterprise.router, prefix="/enterprise", tags=["enterprise"])
