class InsiderService:
    @classmethod
    def get_insider_trades(cls, symbol: str):
        sym = symbol.upper()
        return [
            {"date": "2026-07-02", "insider": "Cook Timothy D", "relationship": "CEO", "transaction": "SELL", "shares": "50,000", "price": "$185.20", "value": "$9,260,000"},
            {"date": "2026-06-25", "insider": "Levinson Arthur D", "relationship": "Director", "transaction": "BUY", "shares": "5,000", "price": "$182.10", "value": "$910,500"},
            {"date": "2026-05-18", "insider": "Maestri Luca", "relationship": "CFO", "transaction": "SELL", "shares": "20,000", "price": "$178.40", "value": "$3,568,000"}
        ]

    @classmethod
    def get_institutional_holdings(cls, symbol: str):
        return [
            {"holder": "Vanguard Group Inc.", "shares": "1,270,450,200", "value": "$235.03B", "percentage": "8.15%"},
            {"holder": "BlackRock Inc.", "shares": "1,032,150,800", "value": "$190.95B", "percentage": "6.62%"},
            {"holder": "Berkshire Hathaway Inc.", "shares": "915,560,300", "value": "$169.38B", "percentage": "5.87%"},
            {"holder": "State Street Corp.", "shares": "592,400,100", "value": "$109.59B", "percentage": "3.80%"}
        ]
