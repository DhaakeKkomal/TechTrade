import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models.holding import Holding
from app.models.trade import Trade
from app.models.watchlist import Watchlist, WatchlistItem
from app.services.yfinance_service import YFinanceService

class PortfolioService:
    # Benchmark betas relative to S&P 500 index
    BETA_MAPPING = {
        "AAPL": 1.20,
        "NVDA": 2.15,
        "TSLA": 1.80,
        "MSFT": 1.15,
        "AMZN": 1.25,
        "RELIANCE.NS": 0.85,
        "INFY.NS": 0.95,
        "TCS.NS": 0.80
    }
    
    # Trail yields (simulated projected dividends yields)
    YIELD_MAPPING = {
        "AAPL": 0.0055, # 0.55%
        "NVDA": 0.0003, # 0.03%
        "MSFT": 0.0075, # 0.75%
        "INFY.NS": 0.0210, # 2.10%
        "TCS.NS": 0.0230, # 2.30%
        "RELIANCE.NS": 0.0080 # 0.80%
    }

    @classmethod
    def get_portfolio_summary(cls, db: Session, user_id: int) -> Dict[str, Any]:
        """
        Computes portfolio valuations, net PnL ratios, sector weight divisions,
        dividend payments curves, and benchmark volatility risk ratings.
        """
        holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
        
        if not holdings:
            return {
                "total_cost": 0.0,
                "total_value": 0.0,
                "total_pnl": 0.0,
                "pnl_percent": 0.0,
                "portfolio_beta": 1.0,
                "projected_annual_dividends": 0.0,
                "holdings": [],
                "sector_allocation": [],
                "risk_analysis": {
                    "beta_category": "Conservative",
                    "rating": "Low Risk"
                }
            }

        total_cost = 0.0
        total_value = 0.0
        projected_annual_dividends = 0.0
        
        holdings_details = []
        sector_weights = {}

        # 1. Fetch current prices & calculate valuations
        for h in holdings:
            symbol = h.symbol.upper()
            cost = h.shares * h.avg_price
            
            # Fetch current stock price and sector info
            info = YFinanceService.get_stock_info(symbol)
            curr_price = float(info.get("currentPrice", h.avg_price))
            if curr_price <= 0:
                curr_price = h.avg_price
                
            name = info.get("name", symbol)
            sector = info.get("sector", "Technology") # default
            
            val = h.shares * curr_price
            pnl = val - cost
            pnl_pct = (pnl / cost * 100.0) if cost > 0 else 0.0
            
            total_cost += cost
            total_value += val
            
            # Trailing dividends
            div_yield = cls.YIELD_MAPPING.get(symbol, 0.0150) # default 1.5% yield
            projected_div = val * div_yield
            projected_annual_dividends += projected_div
            
            # Group sectors
            sector_weights[sector] = sector_weights.get(sector, 0.0) + val
            
            holdings_details.append({
                "id": h.id,
                "symbol": symbol,
                "name": name,
                "shares": h.shares,
                "avg_price": h.avg_price,
                "current_price": curr_price,
                "total_cost": cost,
                "total_value": val,
                "pnl": pnl,
                "pnl_percent": pnl_pct,
                "dividend_received": h.dividend_received,
                "projected_annual_dividend": projected_div,
                "sector": sector,
                "allocation_percent": 0.0 # set after total value is calculated
            })

        # Calculate allocation percentages & weighted portfolio beta
        weighted_beta = 0.0
        for item in holdings_details:
            if total_value > 0:
                item["allocation_percent"] = (item["total_value"] / total_value) * 100.0
                
            # Compute beta component
            beta = cls.BETA_MAPPING.get(item["symbol"], 1.0)
            weighted_beta += beta * (item["allocation_percent"] / 100.0)

        # Build sector allocation list
        sector_allocation = []
        for sect, val in sector_weights.items():
            pct = (val / total_value * 100.0) if total_value > 0 else 0.0
            sector_allocation.append({
                "sector": sect,
                "value": val,
                "percentage": pct
            })

        # Portfolio Risk category
        if weighted_beta > 1.3:
            risk_cat = "Aggressive Growth"
            risk_rating = "High Volatility"
        elif weighted_beta < 0.85:
            risk_cat = "Conservative Value"
            risk_rating = "Low Volatility"
        else:
            risk_cat = "Moderate Balance"
            risk_rating = "Medium Volatility"

        net_pnl = total_value - total_cost
        pnl_percent = (net_pnl / total_cost * 100.0) if total_cost > 0 else 0.0

        return {
            "total_cost": total_cost,
            "total_value": total_value,
            "total_pnl": net_pnl,
            "pnl_percent": pnl_percent,
            "portfolio_beta": weighted_beta,
            "projected_annual_dividends": projected_annual_dividends,
            "holdings": holdings_details,
            "sector_allocation": sector_allocation,
            "risk_analysis": {
                "beta_category": risk_cat,
                "rating": risk_rating
            }
        }

    @classmethod
    def import_trades_from_journal(cls, db: Session, user_id: int) -> int:
        """
        Scans completed trades in the Trading Journal and aggregates them as portfolio holdings.
        """
        # Fetch completed LONG trades
        trades = (
            db.query(Trade)
            .filter(
                Trade.user_id == user_id, 
                Trade.direction == "LONG", 
                Trade.exit_price != None
            )
            .all()
        )
        if not trades:
            return 0

        # Group by symbol
        symbols_map = {}
        for t in trades:
            symbol = t.symbol.upper()
            if symbol not in symbols_map:
                symbols_map[symbol] = []
            symbols_map[symbol].append(t)

        synced_count = 0
        
        for symbol, list_t in symbols_map.items():
            total_shares = sum(float(t.position_size) for t in list_t)
            # Weighted average cost price
            total_cost = sum(float(t.position_size) * float(t.entry_price) for t in list_t)
            avg_price = total_cost / total_shares if total_shares > 0 else 0.0
            
            if total_shares <= 0:
                continue

            # Upsert into holdings
            holding = db.query(Holding).filter(Holding.user_id == user_id, Holding.symbol == symbol).first()
            if not holding:
                holding = Holding(
                    user_id=user_id,
                    symbol=symbol,
                    shares=total_shares,
                    avg_price=avg_price
                )
                db.add(holding)
            else:
                # Merge holdings
                combined_shares = holding.shares + total_shares
                combined_cost = (holding.shares * holding.avg_price) + total_cost
                holding.shares = combined_shares
                holding.avg_price = combined_cost / combined_shares if combined_shares > 0 else avg_price
                db.add(holding)
                
            db.commit()
            synced_count += 1
            
        return synced_count

    @classmethod
    def sync_watchlist_symbols(cls, db: Session, user_id: int) -> int:
        """
        Checks user's Watchlist items and creates placeholder holdings (10 shares at current price)
        for any symbol not yet present in portfolio holdings.
        """
        watchlists = db.query(Watchlist).filter(Watchlist.owner_id == user_id).all()
        if not watchlists:
            return 0
            
        watchlist_ids = [w.id for w in watchlists]
        items = db.query(WatchlistItem).filter(WatchlistItem.watchlist_id.in_(watchlist_ids)).all()
        if not items:
            return 0
            
        synced_count = 0
        
        for item in items:
            symbol = item.symbol.upper()
            # Verify if already in holdings
            exists = db.query(Holding).filter(Holding.user_id == user_id, Holding.symbol == symbol).first()
            if not exists:
                info = YFinanceService.get_stock_info(symbol)
                curr_price = float(info.get("currentPrice", 100.0))
                if curr_price <= 0:
                    curr_price = 100.0
                    
                new_holding = Holding(
                    user_id=user_id,
                    symbol=symbol,
                    shares=10.0, # default placeholder shares count
                    avg_price=curr_price
                )
                db.add(new_holding)
                db.commit()
                synced_count += 1
                
        return synced_count

    @classmethod
    def generate_ai_review(cls, db: Session, user_id: int) -> str:
        """
        Passes portfolio allocation weights and risk ratings to formulate copilot advice.
        """
        summary = cls.get_portfolio_summary(db, user_id)
        if not summary["holdings"]:
            return "No holdings configured in your portfolio to review. Sync with watchlists or trade logs first."

        # Compile data summaries
        tickers = [h["symbol"] for h in summary["holdings"]]
        allocations = [f"{h['symbol']}: {h['allocation_percent']:.1f}%" for h in summary["holdings"]]
        beta = summary["portfolio_beta"]
        risk_rating = summary["risk_analysis"]["rating"]
        sectors = [f"{s['sector']}: {s['percentage']:.1f}%" for s in summary["sector_allocation"]]

        review = (
            f"[AI PORTFOLIO ANALYSIS REPORT]\n\n"
            f"**Portfolio Structure Overview**:\n"
            f"- Configured holdings assets: {', '.join(tickers)}\n"
            f"- Sector weights: {', '.join(sectors)}\n"
            f"- S&P 500 Portfolio Beta: {beta:.2f} ({risk_rating})\n\n"
            f"**Copilot Analysis & Recommendations**:\n"
        )

        # Generate rule-based recommendations based on metrics
        if beta > 1.3:
            review += (
                "1. **Concentration & Volatility Alert**: Your portfolio has a high weighted beta, making it highly sensitive to market indices fluctuations. "
                "Aggressive positions in stocks like NVDA/TSLA should be hedged with defensive assets (consumer staples, utilities) or treasury bonds.\n"
                "2. **Optimal Sizing Limits**: Ensure position allocations for highly volatile stocks do not exceed 10-15% of your total portfolio size to protect against tail risk."
            )
        elif len(tickers) < 3:
            review += (
                "1. **Diversification Deficit Warning**: Your portfolio is concentrated in only a few tickers. This exposes you to significant single-stock idiosyncratic risk. "
                "Consider expanding to at least 5-8 distinct assets across multiple sectors.\n"
                "2. **Sector Exposure Sizing**: You have large exposure to a single sector. Aim to distribute capital so no individual sector exceeds 30-40% allocation."
            )
        else:
            review += (
                "1. **Healthy Allocation Balance**: Your portfolio demonstrates moderate diversification and sector balance. S&P 500 correlation suggests market-performing returns "
                "with structured benchmark volatility risks.\n"
                "2. **Dividend Compound Optimization**: Projected trailing annual dividend yield compoundings can be reinvested to optimize cost-basis entries."
            )

        return review
