import pytest
from unittest.mock import patch
from app.models.holding import Holding
from app.models.trade import Trade
from app.models.watchlist import Watchlist, WatchlistItem
from app.services.portfolio import PortfolioService

def test_holding_db_creation(db_session):
    holding = Holding(
        user_id=1,
        symbol="AAPL",
        shares=15.0,
        avg_price=175.0,
        dividend_received=12.50
    )
    db_session.add(holding)
    db_session.commit()
    db_session.refresh(holding)
    
    assert holding.id is not None
    assert holding.shares == 15.0
    assert holding.dividend_received == 12.50

def test_portfolio_summary_calculations(db_session):
    # Setup test holdings
    h1 = Holding(user_id=1, symbol="AAPL", shares=10.0, avg_price=150.0)
    h2 = Holding(user_id=1, symbol="TSLA", shares=5.0, avg_price=200.0)
    db_session.add_all([h1, h2])
    db_session.commit()
    
    # Mock stock info currentPrice to trigger PnL changes
    mock_stock_data = {
        "AAPL": {"currentPrice": 160.0, "name": "Apple Inc.", "sector": "Technology"},
        "TSLA": {"currentPrice": 220.0, "name": "Tesla Inc.", "sector": "Automotive"}
    }
    
    def mock_get_info(symbol):
        return mock_stock_data.get(symbol.upper(), {"currentPrice": 100.0})
        
    with patch("app.services.yfinance_service.YFinanceService.get_stock_info", side_effect=mock_get_info):
        summary = PortfolioService.get_portfolio_summary(db_session, 1)
        
        # Calculations:
        # total_cost = (10 * 150) + (5 * 200) = 1500 + 1000 = 2500
        # total_value = (10 * 160) + (5 * 220) = 1600 + 1100 = 2700
        # total_pnl = 2700 - 2500 = 200
        # pnl_percent = 200 / 2500 = 8%
        assert summary["total_cost"] == 2500.0
        assert summary["total_value"] == 2700.0
        assert summary["total_pnl"] == 200.0
        assert summary["pnl_percent"] == 8.0
        
        # Sector Rollups:
        # Tech: 1600 (59.25%)
        # Auto: 1100 (40.74%)
        sectors = {s["sector"]: s["percentage"] for s in summary["sector_allocation"]}
        assert "Technology" in sectors
        assert "Automotive" in sectors
        assert sectors["Technology"] > 59.0

def test_import_trades_from_journal(db_session):
    # Setup test trade journal entries
    t1 = Trade(
        user_id=1,
        symbol="NVDA",
        direction="LONG",
        position_size=10,
        entry_price=100.0,
        stop_loss=90.0,
        target=120.0,
        exit_price=110.0, # closed trade
        notes="Nice breakout",
        emotions_before="Neutral",
        emotions_after="Happy"
    )
    db_session.add(t1)
    db_session.commit()
    
    count = PortfolioService.import_trades_from_journal(db_session, 1)
    assert count == 1
    
    holding = db_session.query(Holding).filter(Holding.user_id == 1, Holding.symbol == "NVDA").first()
    assert holding is not None
    assert holding.shares == 10.0
    assert holding.avg_price == 100.0

def test_sync_watchlist_symbols(db_session):
    # Setup watchlist item
    wl = Watchlist(owner_id=1, name="My watchlist")
    db_session.add(wl)
    db_session.commit()
    
    item = WatchlistItem(watchlist_id=wl.id, symbol="MSFT")
    db_session.add(item)
    db_session.commit()
    
    with patch("app.services.yfinance_service.YFinanceService.get_stock_info", return_value={"currentPrice": 300.0}):
        count = PortfolioService.sync_watchlist_symbols(db_session, 1)
        assert count == 1
        
        holding = db_session.query(Holding).filter(Holding.user_id == 1, Holding.symbol == "MSFT").first()
        assert holding is not None
        assert holding.shares == 10.0 # default placeholder shares count
        assert holding.avg_price == 300.0
