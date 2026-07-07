import yfinance as yf
import httpx
import requests
from typing import List, Dict, Any, Optional
import pandas as pd

# Create requests session to avoid Yahoo Finance rate limits
custom_session = requests.Session()
custom_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.5"
})

class YFinanceService:
    @staticmethod
    async def search_stocks(query: str) -> List[Dict[str, Any]]:
        """
        Search for stock tickers using Yahoo Finance unofficial autocomplete endpoint.
        Free, fast, and covers NSE, BSE, US, and other international markets.
        """
        if not query or len(query) < 2:
            return []
            
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=10&newsCount=0"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    quotes = data.get("quotes", [])
                    results = []
                    for q in quotes:
                        # Only include stocks and ETFs
                        quote_type = q.get("quoteType", "")
                        if quote_type in ["EQUITY", "ETF", "MUTUALFUND"]:
                            results.append({
                                "symbol": q.get("symbol"),
                                "name": q.get("shortname") or q.get("longname") or q.get("symbol"),
                                "exchange": q.get("exchange"),
                                "type": quote_type,
                                "sector": q.get("sector", "N/A"),
                                "industry": q.get("industry", "N/A")
                            })
                    return results
        except Exception as e:
            print(f"Error searching stocks: {e}")
            
        # Fallback to simple query logic or empty
        return []

    @staticmethod
    def get_stock_info(symbol: str) -> Dict[str, Any]:
        """
        Get metadata about a stock symbol.
        """
        try:
            ticker = yf.Ticker(symbol, session=custom_session)
            info = ticker.info
            return {
                "symbol": symbol,
                "name": info.get("longName") or info.get("shortName") or symbol,
                "sector": info.get("sector", "N/A"),
                "industry": info.get("industry", "N/A"),
                "summary": info.get("longBusinessSummary", "No summary available."),
                "currency": info.get("currency", "USD"),
                "currentPrice": info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose", 0.0),
                "marketCap": info.get("marketCap", 0),
                "volume": info.get("volume", 0),
                "peRatio": info.get("trailingPE", "N/A")
            }
        except Exception as e:
            print(f"Error fetching info for {symbol}: {e}")
            return {
                "symbol": symbol,
                "name": symbol,
                "sector": "N/A",
                "industry": "N/A",
                "summary": "Failed to fetch metadata.",
                "currency": "USD",
                "currentPrice": 0.0,
                "marketCap": 0,
                "volume": 0,
                "peRatio": "N/A"
            }

    @staticmethod
    def get_stock_history(symbol: str, period: str = "1mo", interval: str = "1d") -> pd.DataFrame:
        """
        Fetch historical stock data as a Pandas DataFrame.
        """
        try:
            ticker = yf.Ticker(symbol, session=custom_session)
            df = ticker.history(period=period, interval=interval)
            return df
        except Exception as e:
            print(f"Error fetching history for {symbol}: {e}")
            return pd.DataFrame()
            
    @staticmethod
    def format_history_for_chart(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Convert yfinance historical DataFrame into lightweight charts format.
        Lightweight charts need: { time: 'YYYY-MM-DD' or timestamp, open, high, low, close, volume }
        """
        if df.empty:
            return []
            
        chart_data = []
        df = df.reset_index()
        
        # Check date column name (either Date or Datetime depending on interval)
        date_col = 'Date' if 'Date' in df.columns else ('Datetime' if 'Datetime' in df.columns else df.columns[0])
        
        for _, row in df.iterrows():
            # Get timestamp or string depending on granularity
            date_val = row[date_col]
            if isinstance(date_val, pd.Timestamp):
                # Daily data -> YYYY-MM-DD
                # Intraday data -> UNIX timestamp (int seconds)
                if date_val.time() == pd.Timestamp('00:00:00').time():
                    time_str = date_val.strftime('%Y-%m-%d')
                else:
                    time_str = int(date_val.timestamp())
            else:
                time_str = str(date_val)
                
            chart_data.append({
                "time": time_str,
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"]) if "Volume" in row else 0
            })
        return chart_data
