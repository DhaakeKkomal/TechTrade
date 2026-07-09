from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.api import deps
from app.models.user import User
from app.schemas.sentiment import MarketSentimentReport, SectorSentiment, NewsFeedItem, HistoricalSentimentItem
from app.services.sentiment import MarketSentimentEngine

router = APIRouter()
engine = MarketSentimentEngine()

@router.get("/market", response_model=MarketSentimentReport)
async def get_market_sentiment(
    symbol: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Returns the comprehensive aggregated market sentiment report.
    """
    return await engine.get_market_sentiment(symbol)

@router.get("/sectors", response_model=List[SectorSentiment])
def get_sector_sentiment(
    current_user: User = Depends(deps.get_current_user)
):
    """
    Returns sentiment breakdowns and momentum strengths across market sectors.
    """
    return engine.get_sector_sentiment()

@router.get("/news", response_model=List[NewsFeedItem])
async def get_sentiment_news(
    symbol: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Returns a list of financial news stories tagged with bullish/bearish indicators.
    """
    report = await engine.get_market_sentiment(symbol)
    return report["news_feed"]

@router.get("/history", response_model=List[HistoricalSentimentItem])
def get_sentiment_history(
    current_user: User = Depends(deps.get_current_user)
):
    """
    Returns 30 days of historical bullish vs bearish sentiment indices.
    """
    return engine.get_historical_sentiment()
