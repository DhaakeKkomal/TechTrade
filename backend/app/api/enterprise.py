from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
from app.api import deps
from app.models.user import User
from app.services.macro import MacroService
from app.services.insider import InsiderService
from app.services.options import OptionsService
from app.services.ocr import OCRService
from app.services.exports import ExportsService
from app.services.portfolio import PortfolioService

router = APIRouter()

@router.get("/calendars")
def get_calendars(
    current_user: User = Depends(deps.get_current_user)
):
    """
    Returns Economic event indicators list and IPO listing schedules.
    """
    return {
        "economic": MacroService.get_economic_calendar(),
        "ipo": MacroService.get_ipo_calendar()
    }

@router.get("/options")
def get_options_chain(
    symbol: str = Query(..., description="Stock symbol, e.g. AAPL"),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Returns Options Chain call/put tables for a stock.
    """
    return OptionsService.get_options_chain(symbol)

@router.get("/insiders")
def get_insiders(
    symbol: str = Query(..., description="Stock symbol, e.g. AAPL"),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Returns Insider transactions and Institutional holdings distributions.
    """
    return {
        "insider_trades": InsiderService.get_insider_trades(symbol),
        "institutional_holdings": InsiderService.get_institutional_holdings(symbol)
    }

@router.post("/ocr")
def run_ocr(
    filename: str = Query("chart.png", description="Dummy chart file name"),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Executes mock OCR text detection from chart screenshots.
    """
    return OCRService.extract_chart_image(filename)

@router.get("/export")
def export_portfolio_data(
    format: str = Query("csv", description="csv, excel, pdf"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Downloads active holdings spreadsheet files.
    """
    summary = PortfolioService.get_portfolio_summary(db, current_user.id)
    headers = ["Symbol", "Shares", "Avg Cost", "Current Price", "Value", "P&L", "Sector"]
    rows = []
    for h in summary["holdings"]:
        rows.append([
            h["symbol"],
            h["shares"],
            h["avg_price"],
            h["current_price"],
            h["total_value"],
            h["pnl"],
            h["sector"]
        ])

    if format == "csv":
        content = ExportsService.export_csv(headers, rows)
        media_type = "text/csv"
        filename = "portfolio_export.csv"
    elif format == "excel":
        content = ExportsService.export_excel(headers, rows)
        media_type = "application/vnd.ms-excel"
        filename = "portfolio_export.xls"
    else:
        content = ExportsService.export_pdf("Portfolio Holdings", headers, rows)
        media_type = "application/pdf"
        filename = "portfolio_export.pdf"

    buffer = io.BytesIO(content.encode("utf-8"))
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
