import pytest
from unittest.mock import patch
from app.services.macro import MacroService
from app.services.insider import InsiderService
from app.services.options import OptionsService
from app.services.ocr import OCRService
from app.services.exports import ExportsService

def test_economic_and_ipo_calendars():
    econ = MacroService.get_economic_calendar()
    ipos = MacroService.get_ipo_calendar()
    
    assert len(econ) > 0
    assert econ[0]["event"] == "CPI MoM"
    assert len(ipos) > 0
    assert ipos[0]["symbol"] == "AIQT"

def test_options_chain_calculations():
    chain = OptionsService.get_options_chain("AAPL")
    assert chain["symbol"] == "AAPL"
    assert len(chain["calls"]) > 0
    assert chain["calls"][0]["strike"] == 170.0

def test_insiders_and_institutional_governance():
    insiders = InsiderService.get_insider_trades("AAPL")
    insts = InsiderService.get_institutional_holdings("AAPL")
    
    assert len(insiders) > 0
    assert insiders[0]["relationship"] == "CEO"
    assert len(insts) > 0
    assert "Vanguard" in insts[0]["holder"]

def test_mock_ocr_scans():
    res = OCRService.extract_chart_image("chart.png")
    assert res["success"] is True
    assert "detected_texts" in res
    assert res["ticker_detected"] == "AAPL"

def test_document_exports():
    headers = ["Sym", "Value"]
    rows = [["AAPL", 1500.0], ["TSLA", 2000.0]]
    
    csv_out = ExportsService.export_csv(headers, rows)
    xls_out = ExportsService.export_excel(headers, rows)
    pdf_out = ExportsService.export_pdf("Summary", headers, rows)
    
    assert "Sym,Value" in csv_out
    assert "AAPL\t1500.0" in xls_out
    assert "PDF REPORT" in pdf_out
