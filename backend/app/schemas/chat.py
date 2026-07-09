from pydantic import BaseModel
from datetime import datetime

class ChatMessageCreate(BaseModel):
    content: str
    model_type: str  # OpenAI, Llama, Gemma, Mistral, DeepSeek

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True
