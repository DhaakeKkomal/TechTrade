from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.api import deps
from app.services.yfinance_service import YFinanceService
from app.services.indicators import TechnicalIndicators
from app.services.ollama_service import OllamaService
from app.models.user import User

router = APIRouter()

@router.get("/search", response_model=List[Dict[str, Any]])
async def search_stocks(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Search for stock symbols by query.
    """
    return await YFinanceService.search_stocks(q)

@router.get("/{symbol}/info", response_model=Dict[str, Any])
def get_stock_info(
    symbol: str,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve descriptive details about a stock symbol.
    """
    return YFinanceService.get_stock_info(symbol)

@router.get("/{symbol}/history", response_model=List[Dict[str, Any]])
def get_stock_history(
    symbol: str,
    period: str = "1mo",
    interval: str = "1d",
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve historical OHLCV chart data for a stock symbol.
    """
    df = YFinanceService.get_stock_history(symbol, period, interval)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"Stock history not found for symbol: {symbol}")
    return YFinanceService.format_history_for_chart(df)

@router.get("/{symbol}/analysis", response_model=Dict[str, Any])
def get_stock_analysis(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve pre-calculated technical indicators (RSI, SMA, MACD, Bollinger, S/R levels) for a symbol.
    """
    df = YFinanceService.get_stock_history(symbol, period, interval)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"History not found for indicator calculations on: {symbol}")
    analysis = TechnicalIndicators.analyze_all(df)
    if "error" in analysis:
        raise HTTPException(status_code=400, detail=analysis["error"])
    return analysis

@router.get("/{symbol}/ai-summary", response_model=Dict[str, str])
async def get_stock_ai_summary(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
    current_user: User = Depends(deps.get_current_user)
):
    """
    Compile indicator values and query the local LLM via Ollama to generate a summary.
    """
    df = YFinanceService.get_stock_history(symbol, period, interval)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"History not found for AI summarizer on: {symbol}")
    analysis = TechnicalIndicators.analyze_all(df)
    if "error" in analysis:
        raise HTTPException(status_code=400, detail=analysis["error"])
    summary = await OllamaService.generate_technical_summary(symbol, analysis)
    return {"summary": summary}
