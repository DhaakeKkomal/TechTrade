import asyncio
import httpx
from typing import AsyncGenerator, List, Dict, Any

class AITradingAssistant:
    # In-memory RAG database representing curated financial context
    RAG_KNOWLEDGE_BASE = {
        "rsi": (
            "Relative Strength Index (RSI) is a momentum oscillator measuring price changes from 0 to 100. "
            "Traditionally, values above 70 indicate overbought (potential sell/reversal) and below 30 indicate oversold "
            "(potential buy/rebound). Traders use RSI crossovers and bullish/bearish divergences to confirm trends."
        ),
        "bollinger": (
            "Bollinger Bands consist of a middle band (simple moving average) and two outer bands (standard deviations "
            "above and below the middle). Bands squeeze during low volatility (foreshadowing explosive breakouts) "
            "and expand during high volatility. Prices touching outer bands indicate exhaustion points."
        ),
        "macd": (
            "Moving Average Convergence Divergence (MACD) tracks momentum by calculating the difference between "
            "12-period and 26-period EMAs. A 9-period EMA acts as the Signal Line. Bullish crossovers occur when "
            "MACD crosses above Signal, while bearish crossovers happen when it slides below."
        ),
        "patterns": (
            "Classical chart patterns include Double Tops (bearish reversal at overhead resistance), Double Bottoms "
            "(bullish reversal), Head & Shoulders (trend exhaustion), and Symmetrical Triangles (consolidation preceding "
            "volatility breakout). Validation requires high volume on necklines/boundary breaches."
        ),
        "sizing": (
            "Risk management requires strict position sizing. Never risk more than 1-2% of total account equity "
            "on a single trade. Determine position size based on: (Account Risk Amount) / (Stop Loss Distance). "
            "Always enter a Stop Loss (SL) and Profit Target (TP) order concurrently with entries."
        ),
        "emotions": (
            "Trading discipline involves identifying biases. FOMO (Fear Of Missing Out) leads to buying at peaks, "
            "while Loss Aversion causes traders to hold losing trades, hoping they return to entry. Journaling emotions "
            "before and after trades helps neutralize emotional execution bias."
        )
    }

    @classmethod
    def _retrieve_rag_context(cls, query: str) -> str:
        """
        Retrieves matching RAG context paragraphs based on query keyword overlap.
        """
        query_lower = query.lower()
        matches = []
        
        for key, text in cls.RAG_KNOWLEDGE_BASE.items():
            if key in query_lower:
                matches.append(text)
            elif key == "sizing" and ("size" in query_lower or "risk" in query_lower or "capital" in query_lower):
                matches.append(text)
            elif key == "emotions" and ("emotion" in query_lower or "discipline" in query_lower or "anxiety" in query_lower or "fomo" in query_lower):
                matches.append(text)
            elif key == "patterns" and ("pattern" in query_lower):
                matches.append(text)
                
        if not matches:
            # Default general guideline
            return (
                "General Guideline: Always maintain a risk-reward ratio of at least 1:2. "
                "Combine price action (swings, support/resistance, breakouts) with indicators "
                "(RSI, MACD) to secure multi-indicator validation before taking positions."
            )
            
        return " | ".join(matches)

    @classmethod
    async def stream_response(
        cls, 
        query: str, 
        history: List[Dict[str, str]], 
        model_type: str
    ) -> AsyncGenerator[str, None]:
        """
        Streams AI response token-by-token.
        Attempts connection to OpenAI/Ollama APIs if configured. 
        Falls back to a high-fidelity synthetic streaming generator if APIs are offline.
        """
        context = cls._retrieve_rag_context(query)

        # System prompt with RAG context injected
        system_prompt = (
            "You are TechTrade AI, a professional stock market analyst and trading educator. "
            "Use the following curated knowledge base context to enrich your response:\n\n"
            f"Context: {context}\n\n"
            "Always be clear, structured, and actionable. Avoid generic advice. "
            "End responses with a brief disclaimer that this is educational, not financial advice."
        )

        # Map UI model label → actual Ollama model tag
        MODEL_MAP = {
            "DeepSeek":  "deepseek-r1:7b",
            "Mistral":   "mistral",
            "Llama":     "llama3",
            "Gemma":     "gemma:7b",
            "Llama3":    "llama3",
            "DeepSeek-R1": "deepseek-r1:7b",
        }
        ollama_model = MODEL_MAP.get(model_type, "mistral")

        ollama_url = "http://localhost:11434/api/generate"
        payload = {
            "model": ollama_model,
            "system": system_prompt,
            "prompt": query,
            "stream": True,
        }

        # --- Try live Ollama streaming first ---
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", ollama_url, json=payload) as response:
                    if response.status_code == 200:
                        import json as _json
                        async for line in response.aiter_lines():
                            if line.strip():
                                try:
                                    data = _json.loads(line)
                                    token = data.get("response", "")
                                    if token:
                                        yield token
                                    if data.get("done", False):
                                        return
                                except Exception:
                                    continue
                        return  # Successfully streamed from Ollama
        except Exception:
            pass  # Ollama offline — fall through to synthetic fallback

        # --- Synthetic fallback (Ollama not running) ---
        response_text = cls._generate_synthetic_response(query, context, model_type)
        words = response_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.04)


    @classmethod
    def _generate_synthetic_response(cls, query: str, context: str, model_type: str) -> str:
        """
        Generates rich, detailed financial explanations based on query targets.
        """
        q = query.lower()
        
        intro = f"[Assistant Model: {model_type} (RAG Activated)]\n\n"
        
        if "rsi" in q:
            return intro + (
                "Based on the Relative Strength Index (RSI) guidelines in the knowledge base, here is what you need to know:\n\n"
                "1. **Overbought & Oversold Conditions**: Standard bounds are 70 and 30. If a stock slides below 30, it indicates "
                "selling pressure may be exhausted (oversold), making it a candidate for a rebound. Conversely, crossing above 70 "
                "suggests buyers are overextended, implying a pull-back may occur.\n"
                "2. **RSI Divergences**: Watch for divergences between price and RSI. A bullish divergence happens when price "
                "makes a lower low but RSI makes a higher low. This indicates selling momentum is drying up and a bounce is likely.\n\n"
                "**Actionable Advice**: Never buy *solely* because RSI is under 30. Wait for the oscillator to cross back above 30 "
                "and align it with support zones or bullish candlestick patterns (like a Hammer or Morning Star) for entry validation."
            )
        elif "bollinger" in q or "band" in q:
            return intro + (
                "Regarding Bollinger Bands, they are a powerful volatility envelope indicator:\n\n"
                "1. **The Volatility Squeeze**: When volatility contracts, the upper and lower bands constrict towards the middle SMA line. "
                "This 'squeeze' indicates consolidation and often precedes an explosive breakout in either direction.\n"
                "2. **Band Riding**: In a strong uptrend, prices will frequently 'ride' the upper band. Do not automatically short a stock "
                "just because it touches the upper band—touching does not mean immediate reversal unless validated by volume divergence or resistance.\n\n"
                "**Actionable Advice**: Look for a candle to close *outside* the Bollinger Bands. A close outside followed by an inner candle "
                "reversal pattern provides a higher-probability counter-trend entry target."
            )
        elif "macd" in q:
            return intro + (
                "Here is an overview of the Moving Average Convergence Divergence (MACD) oscillator:\n\n"
                "1. **Crossovers**: The main MACD line is the difference between two moving averages (usually 12 and 26 EMA). The Signal line is a "
                "9 EMA of the MACD. When MACD crosses above the Signal line, it indicates bullish momentum is expanding. When it crosses below, bearish.\n"
                "2. **Zero-Line Cross**: The zero-line represents the point where the 12 and 26 EMAs are equal. Crosses above zero signal a long-term "
                "shift to a bullish environment.\n\n"
                "**Actionable Advice**: Be careful taking crossover signals during choppy, sideways markets. MACD works best in clear trending phases. "
                "Combine MACD crosses with a 200 EMA filter to trade only in the direction of the macro trend."
            )
        elif "pattern" in q or "double top" in q or "shoulders" in q:
            return intro + (
                "Let's break down classical chart patterns and structural geometries:\n\n"
                "1. **Reversal Geometries**: Double Tops and Head & Shoulders represent buying exhaustion. A Double Top forms two distinct peaks "
                "hitting resistance. A Head & Shoulders forms three peaks, with the middle (head) highest, showing buyers failed to sustain momentum.\n"
                "2. **Neckline Validation**: Patterns are not valid until the 'neckline' support connects the swing lows and is breached on high volume. "
                "Entering early before the neckline breaks increases the risk of being caught in a continuation fakeout.\n\n"
                "**Actionable Advice**: Measure the height of the pattern. The expected price target after a neckline breakout is equal to the "
                "height of the pattern projected down from the neckline breakout point."
            )
        elif "size" in q or "risk" in q or "loss" in q:
            return intro + (
                "Risk management is the single most important rule in professional trading:\n\n"
                "1. **The 1% Rule**: Never risk more than 1% of your total account capital on any single trade. If you have a $10,000 account, "
                "your maximum risk is $100.\n"
                "2. **Sizing Formula**: Calculate your size using: `Position Size = Risk / (Entry - Stop Loss)`. For example, if you risk $100 "
                "and buy at $50 with a stop loss at $48, your risk per share is $2. Therefore, you buy `100 / 2 = 50` shares.\n\n"
                "**Actionable Advice**: Define your stop loss *before* looking at size. Never adjust your stop loss wider to accommodate a "
                "larger position—this is a classic beginner mistake that leads to large drawdowns."
            )
        elif "emotion" in q or "fear" in q or "anxiety" in q or "fomo" in q:
            return intro + (
                "Emotional discipline determines long-term profitability:\n\n"
                "1. **FOMO (Fear of Missing Out)**: Occurs when you see a stock skyrocketing and buy in near the top without a setup. "
                "Remedy this by setting rigid criteria: if the price has already run more than 5% past a breakout point, skip the trade.\n"
                "2. **Revenge Trading**: Occurs after a loss when you immediately enter another trade with larger sizing to 'win back' money. "
                "Remedy this by closing your platform for the day after two consecutive stop-outs.\n\n"
                "**Actionable Advice**: Keep a log of your emotions (Anxiety, Greed, Calm) before and after each trade in your Trading Journal. "
                "Reviewing these logs monthly will expose recurring psychological triggers."
            )
        else:
            # General financial analysis
            return intro + (
                f"Thank you for asking about '{query}'. In market analysis, we recommend using a multi-factor checklist:\n\n"
                "1. **Analyze Macro Trend**: Identify whether the stock is trading above its 200-day simple moving average (SMA200). Only buy in bullish macro states.\n"
                "2. **Identify Key Levels**: Highlight primary support and demand zones. Wait for the price to retract to these levels before seeking entries.\n"
                "3. **Indicator Convergence**: Look for oversold RSI indicators, MACD bullish crossovers, and volume expansion to confirm entry targets.\n\n"
                "If you would like detailed explanations of specific indicators (like RSI, Bollinger Bands, or MACD), risk management sizing formulas, "
                "or emotional journaling strategies, please let me know!"
            )
