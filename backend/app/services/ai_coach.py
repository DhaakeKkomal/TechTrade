import os
import httpx
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.trade import Trade
from app.core.config import settings

class AICoachService:
    @staticmethod
    async def analyze_trade(trade: Trade) -> Dict[str, Any]:
        """
        Queries Ollama to perform a psychological and risk analysis of a single trade.
        Falls back to a structured rules-based analyst model if Ollama is unreachable.
        """
        prompt = (
            f"Analyze this trading journal record and provide feedback in JSON format. Details:\n"
            f"- Symbol: {trade.symbol}\n"
            f"- Direction: {trade.direction}\n"
            f"- Entry Price: {trade.entry_price}, Exit Price: {trade.exit_price}\n"
            f"- Stop Loss: {trade.stop_loss}, Target: {trade.target}\n"
            f"- Position Size: {trade.position_size}\n"
            f"- User Notes: {trade.notes}\n"
            f"- Emotions (Before): {trade.emotions_before}, (After): {trade.emotions_after}\n"
            f"- Result P&L: {trade.pnl:.2f}\n\n"
            f"Generate a JSON response with these exact keys:\n"
            f"- 'discipline': A paragraph evaluating how well the trader stuck to rules/stops.\n"
            f"- 'mistakes': A list of identified trading mistakes (e.g. FOMO, revenge trading, exit-early).\n"
            f"- 'emotions': A paragraph analyzing emotional biases or mood swings.\n"
            f"- 'risk_management': Suggestions on position sizing or stop/target placements.\n"
            f"- 'feedback': Personalized encouraging feedback for improvement."
        )

        try:
            url = f"{settings.OLLAMA_BASE_URL}/api/generate"
            payload = {
                "model": os.getenv("OLLAMA_MODEL", "llama3"),
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10.0)
                if response.status_code == 200:
                    import json
                    result = response.json()
                    response_text = result.get("response", "").strip()
                    data = json.loads(response_text)
                    return {
                        "discipline": data.get("discipline", "Rule compliance evaluated successfully."),
                        "mistakes": data.get("mistakes", ["No obvious technical errors."]),
                        "emotions": data.get("emotions", "Neutral mood levels registered."),
                        "risk_management": data.get("risk_management", "Risk boundaries adhered to standard parameters."),
                        "feedback": data.get("feedback", "Stick to your systematic plan and continue logging setups.")
                    }
        except Exception:
            # Fallback to rich quantitative rule engine on connection/parsing errors
            pass

        return AICoachService._run_rules_fallback(trade)

    @staticmethod
    def _run_rules_fallback(trade: Trade) -> Dict[str, Any]:
        """
        A high-fidelity quantitative rules-based model to evaluate trades when offline.
        """
        mistakes = []
        
        # 1. Sticking to Stops
        discipline = "Excellent rule compliance. You exited the position within your planned boundaries."
        if trade.status == "CLOSED" and trade.pnl < 0:
            if trade.stop_loss and trade.exit_price:
                # If long, exit is lower than stop loss (or worse)
                if trade.direction == "LONG" and trade.exit_price < trade.stop_loss * 0.99:
                    discipline = "Discipline warning: You allowed the trade to drop below your stop loss limit. This suggests bag-holding behavior or manual interference."
                    mistakes.append("Failing to respect Stop Loss (held past exit point)")
                elif trade.direction == "SHORT" and trade.exit_price > trade.stop_loss * 1.01:
                    discipline = "Discipline warning: You allowed the trade to rise above your stop loss limit."
                    mistakes.append("Failing to respect Stop Loss (held past exit point)")

        # 2. Early Exit checks
        if trade.status == "CLOSED" and trade.pnl > 0:
            if trade.target and trade.exit_price:
                if trade.direction == "LONG" and trade.exit_price < trade.target * 0.95:
                    discipline = "Discipline review: You closed this winning trade early before it reached your target level."
                    mistakes.append("Early Profit Take (fear of giving back gains)")
                elif trade.direction == "SHORT" and trade.exit_price > trade.target * 1.05:
                    discipline = "Discipline review: You closed this winning trade early before it reached your target level."
                    mistakes.append("Early Profit Take (fear of giving back gains)")

        # 3. Emotions assessment
        emotions_before = (trade.emotions_before or "").lower()
        emotions_after = (trade.emotions_after or "").lower()
        
        emotions_analysis = "Your emotional state appeared stable. Entering a trade in a calm state helps reinforce objective decision-making."
        if "fear" in emotions_before or "anxiety" in emotions_before:
            emotions_analysis = "Entering the trade under fear or anxiety can lead to premature exits, micro-managing candles, or cutting wins short. Focus on sizing down."
            mistakes.append("Trading with pre-trade anxiety")
        elif "greed" in emotions_before or "excitement" in emotions_before:
            emotions_analysis = "Entering with high excitement or greed often leads to over-sizing, chasing breakouts, or ignoring stop losses. Ensure trade meets strict checklist criteria."
            mistakes.append("FOMO / Greed-driven entry")
            
        if "frustration" in emotions_after or "anger" in emotions_after:
            emotions_analysis += " Post-trade frustration indicates revenge-trading triggers. Step away from the screen to avoid compounding losses."
            mistakes.append("Revenge trading vulnerability")

        # 4. Risk management sizing
        capital_risk = trade.entry_price * trade.position_size
        risk_management = "Position sizing is conservative relative to standard account balances. Keep keeping risk per trade under 1-2%."
        if capital_risk > 10000: # large sizing mock
            risk_management = "Sizing caution: This trade represents a large capital commitment. Ensure your stop loss strictly limits net risk to <= 1.5% of total capital."
            mistakes.append("High capital exposure sizing")

        # 5. Encouraging personalized feedback
        if trade.pnl > 0:
            feedback = f"Good job securing a profit of {trade.pnl:.2f} on {trade.symbol}. Continue maintaining this positive expectancy."
        else:
            feedback = f"Treat this loss of {abs(trade.pnl):.2f} on {trade.symbol} as a data point. Sticking to planned risk bounds is a long-term win."

        if not mistakes:
            mistakes.append("No technical violations detected.")

        return {
            "discipline": discipline,
            "mistakes": mistakes,
            "emotions": emotions_analysis,
            "risk_management": risk_management,
            "feedback": feedback
        }

    @classmethod
    async def generate_monthly_report(cls, user_id: int, year: int, month: int, db: Session) -> Dict[str, Any]:
        """
        Aggregates closed trades for the month, calculates statistics, and builds an AI performance summary.
        """
        from app.crud.trade import get_user_trades
        all_trades = get_user_trades(db, user_id)
        
        # Filter closed trades in the specific month
        monthly_trades = []
        for t in all_trades:
            if t.status == "CLOSED" and t.exit_date:
                # Handle timezone-aware conversion or compare dates
                exit_dt = t.exit_date
                if exit_dt.year == year and exit_dt.month == month:
                    monthly_trades.append(t)
                    
        month_name = datetime(year, month, 1).strftime("%B %Y")
        
        if not monthly_trades:
            return {
                "month_name": month_name,
                "total_pnl": 0.0,
                "win_rate": 0.0,
                "profit_factor": 0.0,
                "stats": {
                    "win_rate": 0.0, "risk_reward": 0.0, "average_gain": 0.0, "average_loss": 0.0,
                    "expectancy": 0.0, "profit_factor": 0.0, "total_trades": 0, "winning_trades": 0,
                    "losing_trades": 0, "total_pnl": 0.0
                },
                "ai_feedback": f"No closed trades logged for {month_name}. Log trades in your journal to receive monthly performance reviews."
            }

        # Calculations
        total_pnl = sum(t.pnl for t in monthly_trades)
        wins = [t.pnl for t in monthly_trades if t.pnl > 0]
        losses = [t.pnl for t in monthly_trades if t.pnl <= 0]
        
        winning_trades_cnt = len(wins)
        losing_trades_cnt = len(losses)
        total_cnt = len(monthly_trades)
        
        win_rate = (winning_trades_cnt / total_cnt) * 100
        
        avg_gain = sum(wins) / winning_trades_cnt if winning_trades_cnt > 0 else 0.0
        avg_loss = abs(sum(losses) / losing_trades_cnt) if losing_trades_cnt > 0 else 0.0
        
        gross_profit = sum(wins)
        gross_loss = abs(sum(losses))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else (gross_profit if gross_profit > 0 else 1.0)
        
        # Expectancy
        expectancy = (win_rate / 100 * avg_gain) - ((100 - win_rate) / 100 * avg_loss)
        
        # Risk Reward Ratio based on target/stops if set
        rr_ratios = []
        for t in monthly_trades:
            if t.stop_loss and t.target:
                denom = abs(t.entry_price - t.stop_loss)
                if denom > 0:
                    rr_ratios.append(abs(t.target - t.entry_price) / denom)
        risk_reward = sum(rr_ratios) / len(rr_ratios) if rr_ratios else (avg_gain / avg_loss if avg_loss > 0 else 1.5)

        stats = {
            "win_rate": win_rate,
            "risk_reward": risk_reward,
            "average_gain": avg_gain,
            "average_loss": avg_loss,
            "expectancy": expectancy,
            "profit_factor": profit_factor,
            "total_trades": total_cnt,
            "winning_trades": winning_trades_cnt,
            "losing_trades": losing_trades_cnt,
            "total_pnl": total_pnl
        }

        # AI prompt summary
        prompt = (
            f"Generate a monthly performance synthesis review for a trading account in {month_name}. Details:\n"
            f"- Total Trades: {total_cnt}\n"
            f"- Net Profit/Loss: {total_pnl:.2f}\n"
            f"- Win Rate: {win_rate:.2f}%\n"
            f"- Profit Factor: {profit_factor:.2f}\n"
            f"- Average Win: {avg_gain:.2f}, Average Loss: {avg_loss:.2f}\n"
            f"- Expectancy: {expectancy:.2f}\n\n"
            f"Provide a structured, encouraging performance review summarizing strong behaviors, areas "
            f"needing risk attention, and specific tips on emotional control and position sizing."
        )

        ai_feedback = ""
        try:
            url = f"{settings.OLLAMA_BASE_URL}/api/generate"
            payload = {
                "model": os.getenv("OLLAMA_MODEL", "llama3"),
                "prompt": prompt,
                "stream": False
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10.0)
                if response.status_code == 200:
                    ai_feedback = response.json().get("response", "").strip()
        except Exception:
            pass

        # Fallback monthly text if Ollama fails
        if not ai_feedback:
            pnl_status = "profitable" if total_pnl > 0 else "unprofitable"
            ai_feedback = (
                f"### Monthly Review Summary ({month_name})\n"
                f"Your account was overall **{pnl_status}** this month, finishing with a net profit/loss of **{total_pnl:+.2f}**.\n\n"
                f"**Key Findings**:\n"
                f"- **Expectancy**: Your expectancy sits at **{expectancy:+.2f}** per trade. A positive expectancy denotes a viable long-term system.\n"
                f"- **Profit Factor**: A profit factor of **{profit_factor:.2f}** shows that you are generating more absolute profits than losses.\n"
                f"- **Risk Behavior**: Keep your loss size smaller than your average wins. Ensure you do not carry trades beyond stop loss boundaries.\n\n"
                f"**Recommendations**:\n"
                f"1. Scale down sizing during periods of low focus or pre-trade anxiety.\n"
                f"2. Maintain strict stop loss triggers to preserve capital."
            )

        return {
            "month_name": month_name,
            "total_pnl": total_pnl,
            "win_rate": win_rate,
            "profit_factor": profit_factor,
            "stats": stats,
            "ai_feedback": ai_feedback
        }
