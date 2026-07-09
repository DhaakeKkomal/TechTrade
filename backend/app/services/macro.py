class MacroService:
    @classmethod
    def get_economic_calendar(cls):
        return [
            {"date": "2026-07-15", "time": "08:30 EST", "event": "CPI MoM", "forecast": "0.2%", "previous": "0.1%", "impact": "HIGH"},
            {"date": "2026-07-18", "time": "14:00 EST", "event": "FOMC Minutes", "forecast": "N/A", "previous": "N/A", "impact": "HIGH"},
            {"date": "2026-07-22", "time": "08:30 EST", "event": "Initial Jobless Claims", "forecast": "220K", "previous": "224K", "impact": "MEDIUM"},
            {"date": "2026-07-28", "time": "10:00 EST", "event": "Consumer Confidence", "forecast": "108.5", "previous": "106.2", "impact": "MEDIUM"}
        ]

    @classmethod
    def get_ipo_calendar(cls):
        return [
            {"date": "2026-07-16", "symbol": "AIQT", "company": "AI Quant Technologies Inc.", "price_range": "$18.00 - $20.00", "shares": "5,000,000", "status": "EXPECTED"},
            {"date": "2026-07-20", "symbol": "BLKC", "company": "BlockChain Solutions Corp.", "price_range": "$12.00 - $14.00", "shares": "3,200,000", "status": "EXPECTED"},
            {"date": "2026-07-25", "symbol": "EVCH", "company": "EV Charging Network", "price_range": "$25.00 - $28.00", "shares": "8,500,000", "status": "EXPECTED"}
        ]
