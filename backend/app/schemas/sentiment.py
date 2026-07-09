from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class NewsFeedItem(BaseModel):
    title: str
    sentiment: str
    score: float
    source: str
    url: str

class SectorSentiment(BaseModel):
    name: str
    bullish: float
    bearish: float
    neutral: float
    strength: str

class MarketSentimentReport(BaseModel):
    bullish_score: float
    bearish_score: float
    neutral_score: float
    overall_mood: str
    fear_greed_index: float
    provider_details: Dict[str, Any]
    news_feed: List[NewsFeedItem]

class HistoricalSentimentItem(BaseModel):
    time: str
    bullish_score: float
    bearish_score: float
    neutral_score: float
