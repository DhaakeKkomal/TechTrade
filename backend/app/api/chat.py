from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.db.session import SessionLocal
from app.models.user import User
from app.models.chat import ChatMessage
from app.schemas.chat import ChatMessageResponse, ChatMessageCreate
from app.services.ai_assistant import AITradingAssistant

router = APIRouter()

@router.get("/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieves the last 30 messages in the user's conversation history.
    """
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.timestamp.desc())
        .limit(30)
        .all()
    )
    # Reverse so they read chronologically
    return list(reversed(messages))

@router.post("/message")
def post_chat_message(
    request: ChatMessageCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Streams assistant response token-by-token using Server-Sent Events (SSE),
    and logs both messages in the database.
    """
    # 1. Save user's question to database
    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=request.content
    )
    db.add(user_msg)
    db.commit()

    # 2. Get past history for memory context
    history_records = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.timestamp.asc())
        .limit(10)
        .all()
    )
    
    history_dicts = [
        {"role": r.role, "content": r.content}
        for r in history_records
    ]

    current_user_id = current_user.id
    model_type = request.model_type
    message_content = request.content

    async def stream_generator():
        full_response = ""
        try:
            async for chunk in AITradingAssistant.stream_response(
                query=message_content,
                history=history_dicts,
                model_type=model_type
            ):
                full_response += chunk
                yield f"{chunk}"
        except Exception as e:
            yield f"\n[Error streaming response: {str(e)}]"
            return

        # Save the completed assistant response to DB
        db_session = SessionLocal()
        try:
            assistant_msg = ChatMessage(
                user_id=current_user_id,
                role="assistant",
                content=full_response
            )
            db_session.add(assistant_msg)
            db_session.commit()
        except Exception as e:
            print(f"Error saving assistant message: {e}")
        finally:
            db_session.close()

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream"
    )
