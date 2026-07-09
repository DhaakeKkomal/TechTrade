class OptionsService:
    @classmethod
    def get_options_chain(cls, symbol: str):
        sym = symbol.upper()
        # Mock options chain around a current price range (e.g. $150 to $200)
        return {
            "symbol": sym,
            "expiry": "2026-08-21",
            "calls": [
                {"strike": 170.0, "bid": 8.50, "ask": 8.70, "volume": 1250, "open_interest": 8450},
                {"strike": 175.0, "bid": 5.20, "ask": 5.35, "volume": 2840, "open_interest": 12100},
                {"strike": 180.0, "bid": 2.85, "ask": 2.95, "volume": 5300, "open_interest": 18600},
                {"strike": 185.0, "bid": 1.40, "ask": 1.45, "volume": 9400, "open_interest": 22400},
                {"strike": 190.0, "bid": 0.65, "ask": 0.70, "volume": 11050, "open_interest": 31000}
            ],
            "puts": [
                {"strike": 170.0, "bid": 1.10, "ask": 1.15, "volume": 4200, "open_interest": 14300},
                {"strike": 175.0, "bid": 2.65, "ask": 2.75, "volume": 6800, "open_interest": 19500},
                {"strike": 180.0, "bid": 5.15, "ask": 5.30, "volume": 3100, "open_interest": 11200},
                {"strike": 185.0, "bid": 8.60, "ask": 8.80, "volume": 1200, "open_interest": 6500},
                {"strike": 190.0, "bid": 12.80, "ask": 13.05, "volume": 450, "open_interest": 2800}
            ]
        }
