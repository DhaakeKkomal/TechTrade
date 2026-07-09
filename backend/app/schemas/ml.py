from pydantic import BaseModel

class TrainRequest(BaseModel):
    symbol: str
    model_type: str  # Random Forest, Gradient Boosting, LSTM, GRU, Transformer

class TrainResult(BaseModel):
    success: bool
    accuracy: float
    loss: float
    duration: float
    model_type: str

class PredictRequest(BaseModel):
    symbol: str
    model_type: str

class ConfidenceInterval(BaseModel):
    lower: float
    upper: float

class PredictResult(BaseModel):
    trend: str
    direction_probability: float
    expected_volatility: float
    breakout_probability: float
    confidence_interval: ConfidenceInterval
    symbol: str
    model_type: str
