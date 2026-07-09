class OCRService:
    @classmethod
    def extract_chart_image(cls, filename: str) -> dict:
        """
        Simulates OCR text extraction from chart image uploads.
        """
        return {
            "success": True,
            "filename": filename,
            "detected_texts": ["AAPL", "RSI(14)", "MACD(12,26,9)", "1D Chart", "Volume: 52M"],
            "ticker_detected": "AAPL",
            "timeframe": "1D",
            "confidence_score": 92.5
        }
