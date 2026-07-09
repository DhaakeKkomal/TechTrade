from fastapi import APIRouter, Depends, HTTPException, status
from app.api import deps
from app.models.user import User
from app.schemas.ml import TrainRequest, TrainResult, PredictRequest, PredictResult
from app.services.ml import MLEngine

router = APIRouter()
engine = MLEngine()

@router.post("/train", response_model=TrainResult)
def train_model(
    request: TrainRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Initiates model training asynchronously on historical data and records accuracy metrics.
    """
    try:
        metrics = engine.train_model(
            symbol=request.symbol.upper(),
            model_type=request.model_type
        )
        return {
            "success": True,
            "accuracy": metrics["accuracy"],
            "loss": metrics["loss"],
            "duration": metrics["duration"],
            "model_type": metrics["model_type"]
        }
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training failed: {str(e)}"
        )

@router.post("/predict", response_model=PredictResult)
def predict_model(
    request: PredictRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Runs model inference on the latest candle data point to generate market predictions.
    """
    try:
        result = engine.predict_market(
            symbol=request.symbol.upper(),
            model_type=request.model_type
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference prediction failed: {str(e)}"
        )
