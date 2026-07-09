from pydantic import BaseModel
from typing import List, Optional

class HoldingResponse(BaseModel):
    id: int
    symbol: str
    name: str
    shares: float
    avg_price: float
    current_price: float
    total_cost: float
    total_value: float
    pnl: float
    pnl_percent: float
    dividend_received: float
    projected_annual_dividend: float
    sector: str
    allocation_percent: float

class SectorAllocation(BaseModel):
    sector: str
    value: float
    percentage: float

class RiskAnalysis(BaseModel):
    beta_category: str
    rating: str

class PortfolioSummaryResponse(BaseModel):
    total_cost: float
    total_value: float
    total_pnl: float
    pnl_percent: float
    portfolio_beta: float
    projected_annual_dividends: float
    holdings: List[HoldingResponse]
    sector_allocation: List[SectorAllocation]
    risk_analysis: RiskAnalysis

class AIReviewResponse(BaseModel):
    review: str
