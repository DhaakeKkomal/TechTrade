import pytest
from app.models.chat import ChatMessage
from app.services.ai_assistant import AITradingAssistant

def test_chat_rag_matching():
    # 1. Check indicator lookup
    ctx1 = AITradingAssistant._retrieve_rag_context("Explain the RSI indicator formulas")
    assert "Relative Strength Index" in ctx1
    
    # 2. Check risk management sizing lookup
    ctx2 = AITradingAssistant._retrieve_rag_context("How do I compute position size?")
    assert "risk amount" in ctx2.lower()
    
    # 3. Check patterns lookup
    ctx3 = AITradingAssistant._retrieve_rag_context("what are the target rules for double tops pattern?")
    assert "Double Tops" in ctx3

def test_chat_database_persistence(db_session):
    # 1. Create a user message
    msg = ChatMessage(
        user_id=1,
        role="user",
        content="Hello world"
    )
    db_session.add(msg)
    db_session.commit()
    db_session.refresh(msg)
    
    assert msg.id is not None
    assert msg.role == "user"
    assert msg.content == "Hello world"
    
    # 2. Retrieve history list
    messages = db_session.query(ChatMessage).filter(ChatMessage.user_id == 1).all()
    assert len(messages) == 1
