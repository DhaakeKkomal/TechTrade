import httpx
from typing import Dict, Any
from app.core.config import settings

class OllamaService:
    @classmethod
    async def generate_technical_summary(cls, symbol: str, analysis_data: Dict[str, Any]) -> str:
        """
        Send formatted technical analysis data to a local Ollama model to generate a summary.
        If Ollama is not running or unreachable, return a simulated technical analysis summary.
        """
        
        # Build prompt
        current_price = analysis_data.get("current_price", 0.0)
        change_pct = analysis_data.get("change_percent", 0.0)
        trend = analysis_data.get("trend", {}).get("direction", "Sideways")
        rsi_val = analysis_data.get("rsi", {}).get("value", 50.0)
        rsi_status = analysis_data.get("rsi", {}).get("status", "Neutral")
        macd_signal = analysis_data.get("macd", {}).get("signal_type", "Neutral")
        macd_hist = analysis_data.get("macd", {}).get("histogram", 0.0)
        bb_upper = analysis_data.get("bollinger_bands", {}).get("upper", 0.0)
        bb_lower = analysis_data.get("bollinger_bands", {}).get("lower", 0.0)
        supports = analysis_data.get("support_resistance", {}).get("supports", [])
        resistances = analysis_data.get("support_resistance", {}).get("resistances", [])
        vol_status = analysis_data.get("volume_analysis", {}).get("status", "Normal")
        vol_signal = analysis_data.get("volume_analysis", {}).get("signal", "Neutral")

        prompt = (
            f"You are a professional quantitative technical analyst. Review the technical indicators for ticker {symbol} and write a summary. "
            f"Current statistics:\n"
            f"- Last price: {current_price:.2f} ({change_pct:+.2f}% change)\n"
            f"- Price Trend: {trend}\n"
            f"- RSI (14): {rsi_val:.1f} ({rsi_status})\n"
            f"- MACD: Histogram {macd_hist:.4f} with {macd_signal} signal\n"
            f"- Bollinger Bands: Upper Band {bb_upper:.2f}, Lower Band {bb_lower:.2f}\n"
            f"- Nearest Support Levels: {', '.join(map(str, supports)) if supports else 'None'}\n"
            f"- Nearest Resistance Levels: {', '.join(map(str, resistances)) if resistances else 'None'}\n"
            f"- Volume Profile: {vol_status} showing {vol_signal} activity\n\n"
            f"Please structure your response in 2-3 paragraphs:\n"
            f"1. **Trend & Market Structure**: Describe current market momentum and trend bias.\n"
            f"2. **Oscillators & Indicators**: Analyze whether the technical signals suggest overbought/oversold levels or crossovers.\n"
            f"3. **Support & Resistance Strategy**: Suggest key action zones to watch.\n\n"
            f"You MUST conclude your analysis with the exact disclaimer: "
            f"\"This information is generated for educational purposes only and should not be considered financial advice.\""
        )

        url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.9
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=15.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("response", "").strip()
        except Exception as e:
            # Silent fallback to mock analysis
            print(f"Ollama connection error: {e}. Falling back to rule-based technical summary.")
            
        # Return fallback mock summary
        return cls._generate_mock_summary(symbol, current_price, change_pct, trend, rsi_val, rsi_status, macd_signal, bb_upper, bb_lower, supports, resistances, vol_signal)

    @classmethod
    def _generate_mock_summary(
        cls, symbol: str, price: float, change: float, trend: str, 
        rsi: float, rsi_status: str, macd: str, bb_upper: float, bb_lower: float, 
        supports: list, resistances: list, vol_signal: str
    ) -> str:
        """
        Generate a highly professional, mock technical summary based on actual calculations.
        Used as a robust fallback when local Ollama is offline.
        """
        trend_clause = f"is currently displaying a **{trend}** bias" if "Bullish" in trend or "Bearish" in trend else "is moving in a **sideways consolidative range**"
        
        rsi_clause = ""
        if rsi_status == "Overbought":
            rsi_clause = f"The RSI index is elevated at **{rsi:.1f}**, signaling that the asset is in overbought territory and may experience short-term profit-taking or pullbacks."
        elif rsi_status == "Oversold":
            rsi_clause = f"The RSI index is depressed at **{rsi:.1f}**, suggesting oversold conditions where selling pressure might be exhausted, presenting a potential accumulation zone."
        else:
            rsi_clause = f"The RSI index stands at a neutral reading of **{rsi:.1f}**, indicating balanced momentum with no immediate signs of extreme buying or selling pressure."

        macd_clause = ""
        if "Bullish" in macd:
            macd_clause = "The MACD line has registered a bullish crossover above the signal line, suggesting expansion in upward momentum."
        elif "Bearish" in macd:
            macd_clause = "The MACD line has crossed below the signal line in a bearish crossover, pointing to growing distribution pressure."
        else:
            macd_clause = "The MACD lines are converging closely, confirming the absence of strong momentum acceleration."

        vol_clause = ""
        if vol_signal == "Bullish Accumulation":
            vol_clause = "Interestingly, the positive price move is backed by elevated volume (Bullish Accumulation), indicating strong institutional backing."
        elif vol_signal == "Bearish Distribution":
            vol_clause = "Concerningly, the price drop is accompanied by expanding volume (Bearish Distribution), which suggests strong selling conviction."
        else:
            vol_clause = "Volume remains within standard historical averages, suggesting standard retail participant trading."

        support_str = f"support levels near **{', '.join(map(str, supports))}**" if supports else "immediate support"
        resistance_str = f"resistance barriers around **{', '.join(map(str, resistances))}**" if resistances else "immediate overhead resistance"

        summary = (
            f"### Technical Summary for {symbol.upper()}\n\n"
            f"**Trend & Market Structure**: {symbol.upper()} is currently trading at **{price:.2f}** ({change:+.2f}%) and {trend_clause}. "
            f"The current price is trading relative to Bollinger Bands (Upper: {bb_upper:.2f}, Lower: {bb_lower:.2f}). {vol_clause}\n\n"
            f"**Oscillators & Indicators**: {rsi_clause} {macd_clause} This combination of momentum oscillators supports a short-term bias aligned with the current {trend} trend structure.\n\n"
            f"**Support & Resistance Strategy**: Traders should monitor price action closely as it approaches critical zones. "
            f"We identify key {support_str} which could trigger buying interest on dips, while overhead {resistance_str} will serve as targets for profit-taking or zones for potential trend exhaustion.\n\n"
            f"**This information is generated for educational purposes only and should not be considered financial advice.**"
        )
        return summary
