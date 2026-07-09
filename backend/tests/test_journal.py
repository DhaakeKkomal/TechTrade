import pytest
from datetime import datetime, timezone
from app.models.trade import Trade
from app.crud import trade as crud_trade
from app.schemas.trade import TradeCreate, TradeUpdate
from app.services.ai_coach import AICoachService

def test_trade_pnl_calculations(db_session):
    # 1. Test LONG winning trade PnL
    trade_long_win = TradeCreate(
        symbol="AAPL",
        direction="LONG",
        entry_price=100.0,
        exit_price=110.0,
        stop_loss=95.0,
        target=115.0,
        position_size=50,
        notes="Breakout entry"
    )
    
    db_trade1 = crud_trade.create_trade(db_session, obj_in=trade_long_win, user_id=1)
    assert db_trade1.status == "CLOSED"
    assert db_trade1.pnl == 500.0  # (110 - 100) * 50

    # 2. Test SHORT losing trade PnL
    trade_short_loss = TradeCreate(
        symbol="TSLA",
        direction="SHORT",
        entry_price=150.0,
        exit_price=155.0,
        stop_loss=148.0,
        target=135.0,
        position_size=20,
        notes="Reversal entry"
    )
    
    db_trade2 = crud_trade.create_trade(db_session, obj_in=trade_short_loss, user_id=1)
    assert db_trade2.status == "CLOSED"
    assert db_trade2.pnl == -100.0  # (150 - 155) * 20

def test_ai_coach_rules_fallback():
    # 1. Test discipline violation (held past stop loss)
    violation_trade = Trade(
        symbol="AAPL",
        direction="LONG",
        entry_price=100.0,
        exit_price=90.0,
        stop_loss=95.0,
        target=115.0,
        position_size=50,
        notes="Rule violation",
        emotions_before="Calm",
        emotions_after="Frustration",
        status="CLOSED",
        pnl=-500.0
    )
    
    analysis = AICoachService._run_rules_fallback(violation_trade)
    assert "discipline" in analysis
    assert "Discipline warning" in analysis["discipline"]
    assert "Failing to respect Stop Loss (held past exit point)" in analysis["mistakes"]
    assert "Revenge trading vulnerability" in analysis["mistakes"]

    # 2. Test early profit take
    early_exit_trade = Trade(
        symbol="AAPL",
        direction="LONG",
        entry_price=100.0,
        exit_price=105.0,
        stop_loss=95.0,
        target=115.0,
        position_size=50,
        notes="Early take",
        emotions_before="Fear",
        emotions_after="Relief",
        status="CLOSED",
        pnl=250.0
    )
    
    analysis2 = AICoachService._run_rules_fallback(early_exit_trade)
    assert "Early Profit Take (fear of giving back gains)" in analysis2["mistakes"]
    assert "Trading with pre-trade anxiety" in analysis2["mistakes"]
