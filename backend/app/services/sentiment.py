from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import random
import math
from datetime import datetime, timedelta, timezone

class BaseSentimentProvider(ABC):
    @abstractmethod
    async def get_sentiment(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """
        Returns a dict containing:
        - bullish_score: float (0-100)
        - bearish_score: float (0-100)
        - neutral_score: float (0-100)
        - detail: dict or str (extra diagnostic context)
        """
        pass

class NewsSentimentProvider(BaseSentimentProvider):
    async def get_sentiment(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        # Simulates fetching financial news articles and scoring headlines
        # Keywords mapping for simple natural language scoring
        headlines = [
            ("Federal Reserve hints at interest rate stability in upcoming quarter", 65, "Neutral"),
            ("Tech sector triggers index highs on strong cloud earnings growth", 85, "Bullish"),
            ("Supply chain constraints raise inflation concerns in retail spaces", 30, "Bearish"),
            ("Global market trading remains cautious amid oil price swings", 45, "Neutral"),
            ("Semiconductor manufacturing shows solid pre-order surge demand", 80, "Bullish"),
            ("Retail sales margins drop slightly under increased logistics costs", 35, "Bearish")
        ]
        
        # Select items
        items = headlines if not symbol else [h for h in headlines if "Tech" in h[0] or "sales" in h[0]]
        if not items:
            items = headlines[:3]
            
        bull_sum = sum(h[1] for h in items) / len(items)
        bear_sum = 100.0 - bull_sum
        neutral = 15.0 # fixed buffer

        # Adjust ratios
        total = bull_sum + bear_sum + neutral
        return {
            "bullish_score": (bull_sum / total) * 100,
            "bearish_score": (bear_sum / total) * 100,
            "neutral_score": (neutral / total) * 100,
            "feed": [
                {
                    "title": h[0],
                    "sentiment": h[2],
                    "score": h[1],
                    "source": "Bloomberg" if i % 2 == 0 else "Reuters",
                    "url": "https://bloomberg.com"
                }
                for i, h in enumerate(items)
            ]
        }

class SocialMediaSentimentProvider(BaseSentimentProvider):
    async def get_sentiment(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        # Simulates Reddit and Twitter volume trackers
        # In a real setup, this pulls from Twitter API and Reddit praw subreddits
        # Positive sentiment keywords: buy, call, long, moon, earnings beat, bullish
        # Negative sentiment keywords: short, put, crash, dump, bankrupt, recession
        volume_reddit = 12500
        volume_twitter = 42000
        
        # Bullish ratio
        bull_ratio = 0.58
        bear_ratio = 0.32
        neutral_ratio = 0.10
        
        if symbol:
            # Add ticker variability
            seed = sum(ord(c) for c in symbol)
            random.seed(seed)
            bull_ratio = random.uniform(0.40, 0.70)
            bear_ratio = random.uniform(0.20, 0.45)
            neutral_ratio = 1.0 - bull_ratio - bear_ratio

        return {
            "bullish_score": bull_ratio * 100,
            "bearish_score": bear_ratio * 100,
            "neutral_score": neutral_ratio * 100,
            "detail": {
                "chatter_volume": volume_reddit + volume_twitter,
                "reddit_posts_scanned": volume_reddit,
                "twitter_posts_scanned": volume_twitter,
                "trending_hashtags": ["#EarningsSeason", symbol or "#StocksToWatch", "#Bullish"]
            }
        }

class FearGreedSentimentProvider(BaseSentimentProvider):
    async def get_sentiment(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        # Simulates CNN Fear & Greed index variables:
        # VIX, stock price strength, stock price breadth, safe haven demand, junk bond demand.
        vix_value = 14.5 # low volatility suggests greed
        junk_bond_spread = 1.8 # narrow spread suggests greed
        
        # Calculate single score (0 to 100)
        fg_index = 62.0 # Greed
        
        # Calculate bullish/bearish mapping
        # Index = 100 -> 100% bullish. Index = 0 -> 100% bearish.
        bullish = fg_index
        bearish = 100.0 - fg_index
        neutral = 10.0
        
        total = bullish + bearish + neutral
        return {
            "bullish_score": (bullish / total) * 100,
            "bearish_score": (bearish / total) * 100,
            "neutral_score": (neutral / total) * 100,
            "detail": {
                "fear_greed_index": fg_index,
                "vix": vix_value,
                "junk_bond_spread": junk_bond_spread,
                "sentiment_class": "Greed" if fg_index > 55 else ("Fear" if fg_index < 45 else "Neutral")
            }
        }

class TechnicalSentimentProvider(BaseSentimentProvider):
    async def get_sentiment(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        # Analyzes broad market indexes (S&P 500) or individual ticker technical indicators.
        # Queries yfinance_service or uses mock signals representing general S&P 500 status.
        # If S&P 500 trades above EMA 200 -> Bullish. If RSI is oversold -> potential reversal.
        rsi_val = 58.0
        above_ma200 = True
        macd_crossover = True
        
        bull_points = 0
        if above_ma200: bull_points += 40
        if rsi_val > 50: bull_points += 30
        if macd_crossover: bull_points += 30
        
        bullish = float(bull_points)
        bearish = 100.0 - bullish
        neutral = 15.0
        
        total = bullish + bearish + neutral
        return {
            "bullish_score": (bullish / total) * 100,
            "bearish_score": (bearish / total) * 100,
            "neutral_score": (neutral / total) * 100,
            "detail": {
                "index_rsi": rsi_val,
                "trend_ma200": "Bullish" if above_ma200 else "Bearish",
                "macd_signal": "Buy crossover"
            }
        }

class MarketSentimentEngine:
    def __init__(self):
        # Register providers with their respective weights
        self.providers: List[tuple[BaseSentimentProvider, float]] = [
            (NewsSentimentProvider(), 0.35),
            (SocialMediaSentimentProvider(), 0.25),
            (FearGreedSentimentProvider(), 0.20),
            (TechnicalSentimentProvider(), 0.20)
        ]

    async def get_market_sentiment(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """
        Aggregates bullish, bearish, and neutral sentiment ratios across active providers.
        """
        total_weight = sum(weight for _, weight in self.providers)
        
        avg_bullish = 0.0
        avg_bearish = 0.0
        avg_neutral = 0.0
        
        provider_details = {}
        news_feed = []

        for provider, weight in self.providers:
            res = await provider.get_sentiment(symbol)
            avg_bullish += res["bullish_score"] * weight
            avg_bearish += res["bearish_score"] * weight
            avg_neutral += res["neutral_score"] * weight
            
            p_name = provider.__class__.__name__
            provider_details[p_name] = res.get("detail", {})
            if "feed" in res:
                news_feed = res["feed"]

        avg_bullish /= total_weight
        avg_bearish /= total_weight
        avg_neutral /= total_weight

        # Determine overall mood
        # We can map the bullish score or fear-greed score
        fg_index = provider_details.get("FearGreedSentimentProvider", {}).get("fear_greed_index", 50.0)
        
        if fg_index >= 75:
            mood = "Extreme Greed"
        elif fg_index >= 55:
            mood = "Greed"
        elif fg_index >= 45:
            mood = "Neutral"
        elif fg_index >= 25:
            mood = "Fear"
        else:
            mood = "Extreme Fear"

        return {
            "bullish_score": avg_bullish,
            "bearish_score": avg_bearish,
            "neutral_score": avg_neutral,
            "overall_mood": mood,
            "fear_greed_index": fg_index,
            "provider_details": provider_details,
            "news_feed": news_feed
        }

    def get_sector_sentiment(self) -> List[Dict[str, Any]]:
        """
        Computes static mock sector scores showing momentum indicators.
        """
        sectors = [
            {"name": "Technology", "bullish": 78.0, "bearish": 15.0, "neutral": 7.0, "strength": "Strong Buy"},
            {"name": "Financials", "bullish": 52.0, "bearish": 35.0, "neutral": 13.0, "strength": "Neutral"},
            {"name": "Energy", "bullish": 30.0, "bearish": 60.0, "neutral": 10.0, "strength": "Sell"},
            {"name": "Healthcare", "bullish": 64.0, "bearish": 25.0, "neutral": 11.0, "strength": "Buy"},
            {"name": "Industrials", "bullish": 48.0, "bearish": 40.0, "neutral": 12.0, "strength": "Neutral"},
            {"name": "Utilities", "bullish": 42.0, "bearish": 45.0, "neutral": 13.0, "strength": "Neutral"},
            {"name": "Consumer Discretionary", "bullish": 70.0, "bearish": 20.0, "neutral": 10.0, "strength": "Strong Buy"}
        ]
        return sectors

    def get_historical_sentiment(self) -> List[Dict[str, Any]]:
        """
        Generates 30 days of historical sentiment trend ratios (Bullish vs. Bearish).
        """
        history = []
        base_date = datetime.now(timezone.utc) - timedelta(days=30)
        
        # Generate wave
        for d in range(30):
            date_str = (base_date + timedelta(days=d)).strftime("%Y-%m-%d")
            # Create a sinusoidal wave representing a shifting market cycles
            wave = math.sin(d * 0.2) * 15.0
            bullish = 55.0 + wave
            bearish = 100.0 - bullish - 10.0 # 10% neutral
            
            history.append({
                "time": date_str,
                "bullish_score": bullish,
                "bearish_score": bearish,
                "neutral_score": 10.0
            })
        return history
