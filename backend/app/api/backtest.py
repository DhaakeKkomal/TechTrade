import io
import csv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.schemas.backtest import BacktestRequest, BacktestResult
from app.services.backtester import StrategyBacktester

router = APIRouter()

@router.post("/run", response_model=BacktestResult)
def run_strategy_backtest(
    request: BacktestRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Executes a backtest simulation on historical price data based on indicators and patterns.
    """
    try:
        buy_rules_raw = [r.dict() for r in request.buy_rules]
        sell_rules_raw = [r.dict() for r in request.sell_rules]
        
        result = StrategyBacktester.run_backtest(
            symbol=request.symbol.upper(),
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
            buy_rules=buy_rules_raw,
            sell_rules=sell_rules_raw
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backtest execution failed: {str(e)}"
        )

@router.post("/export")
def export_backtest_report(
    request: BacktestRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Generates and returns a downloadable CSV file containing the strategy trade logs and metrics.
    """
    try:
        buy_rules_raw = [r.dict() for r in request.buy_rules]
        sell_rules_raw = [r.dict() for r in request.sell_rules]
        
        result = StrategyBacktester.run_backtest(
            symbol=request.symbol.upper(),
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
            buy_rules=buy_rules_raw,
            sell_rules=sell_rules_raw
        )
        
        # Build CSV file in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write general metrics headers
        writer.writerow(["Backtest Performance Report Summary"])
        writer.writerow(["Symbol", request.symbol.upper()])
        writer.writerow(["Period", f"{request.start_date} to {request.end_date}"])
        writer.writerow(["Win Rate (%)", f"{result['win_rate']:.2f}%"])
        writer.writerow(["Max Drawdown (%)", f"{result['max_drawdown']:.2f}%"])
        writer.writerow(["Sharpe Ratio", f"{result['sharpe_ratio']:.2f}"])
        writer.writerow(["Sortino Ratio", f"{result['sortino_ratio']:.2f}"])
        writer.writerow(["CAGR (%)", f"{result['cagr']:.2f}%"])
        writer.writerow(["Profit Factor", f"{result['profit_factor']:.2f}"])
        writer.writerow([])
        
        # Write trades list
        writer.writerow(["Trade History Log Details"])
        writer.writerow(["Symbol", "Type", "Entry Date", "Exit Date", "Entry Price", "Exit Price", "PnL ($)", "PnL (%)"])
        for trade in result["trades_history"]:
            writer.writerow([
                trade["symbol"],
                trade["type"],
                trade["entry_date"],
                trade["exit_date"],
                f"{trade['entry_price']:.2f}",
                f"{trade['exit_price']:.2f}",
                f"{trade['pnl']:.2f}",
                f"{trade['pnl_percent']:.2f}%"
            ])
            
        output.seek(0)
        
        filename = f"backtest_report_{request.symbol.upper()}_{datetime.now().strftime('%Y%m%d')}.csv"
        headers = {
            "Content-Disposition": f"attachment; filename={filename}"
        }
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers=headers
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate CSV export: {str(e)}"
        )
