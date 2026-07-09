import pytest
from app.services.sentiment import (
    MarketSentimentEngine, NewsSentimentProvider, 
    SocialMediaSentimentProvider, FearGreedSentimentProvider, TechnicalSentimentProvider
)

@pytest.mark.anyio
async def test_sentiment_providers():
    # Test News provider
    news_prov = NewsSentimentProvider()
    news_res = await news_prov.get_sentiment()
    assert "bullish_score" in news_res
    assert "feed" in news_res
    assert len(news_res["feed"]) > 0

    # Test Social provider
    social_prov = SocialMediaSentimentProvider()
    social_res = await social_prov.get_sentiment()
    assert "chatter_volume" in social_res["detail"]

    # Test Fear/Greed provider
    fg_prov = FearGreedSentimentProvider()
    fg_res = await fg_prov.get_sentiment()
    assert "fear_greed_index" in fg_res["detail"]
    assert 0 <= fg_res["detail"]["fear_greed_index"] <= 100

@pytest.mark.anyio
async def test_market_sentiment_engine():
    engine = MarketSentimentEngine()
    
    # 1. Test overall sentiment report aggregation
    report = await engine.get_market_sentiment()
    assert "bullish_score" in report
    assert "overall_mood" in report
    assert report["fear_greed_index"] == 62.0
    assert 0 <= report["bullish_score"] <= 100
    assert 0 <= report["bearish_score"] <= 100
    
    # 2. Test Sector strengths
    sectors = engine.get_sector_sentiment()
    assert len(sectors) > 0
    assert sectors[0]["name"] == "Technology"
    assert "strength" in sectors[0]
    
    # 3. Test Historical sentiment trend outputs
    history = engine.get_historical_sentiment()
    assert len(history) == 30
    assert "time" in history[0]
    assert "bullish_score" in history[0]
