import pandas as pd
import numpy as np
from typing import List, Dict, Any

class PriceActionAnalyzer:
    @classmethod
    def analyze(cls, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs mathematical filters on the stock history dataframe to extract swing points,
        BOS/CHOCH break events, Fair Value Gaps, Order Blocks, Liquidity Sweeps, and Candlestick patterns.
        """
        if df.empty or len(df) < 20:
            return {
                "swings": [], "structure_events": [], "fvgs": [], "order_blocks": [],
                "supply_zones": [], "demand_zones": [], "liquidity_sweeps": [],
                "fakeouts": [], "breakouts": [], "candlesticks": []
            }

        opens = df["Open"]
        highs = df["High"]
        lows = df["Low"]
        closes = df["Close"]
        dates = df.index

        # Helper to format timestamps/dates
        def get_time(idx):
            val = dates[idx]
            if isinstance(val, pd.Timestamp):
                if val.time() == pd.Timestamp('00:00:00').time():
                    return val.strftime('%Y-%m-%d')
                return int(val.timestamp())
            return str(val)

        # 1. Swing Points Detection
        # Finds local peaks and valleys within a rolling window of 5 candles
        window = 5
        swings = []
        for i in range(window, len(df) - window):
            is_high = True
            is_low = True
            for j in range(1, window + 1):
                if highs.iloc[i] < highs.iloc[i - j] or highs.iloc[i] < highs.iloc[i + j]:
                    is_high = False
                if lows.iloc[i] > lows.iloc[i - j] or lows.iloc[i] > lows.iloc[i + j]:
                    is_low = False
            
            if is_high:
                swings.append({
                    "index": i,
                    "type": "high",
                    "price": float(highs.iloc[i]),
                    "time": get_time(i)
                })
            elif is_low:
                swings.append({
                    "index": i,
                    "type": "low",
                    "price": float(lows.iloc[i]),
                    "time": get_time(i)
                })

        # Classify Swings as HH, LH, HL, LL
        classified_swings = []
        last_high = None
        last_low = None
        for swing in swings:
            price = swing["price"]
            swing_type = swing["type"]
            label = ""
            if swing_type == "high":
                if last_high is None:
                    label = "High"
                elif price > last_high:
                    label = "HH"  # Higher High
                else:
                    label = "LH"  # Lower High
                last_high = price
            else:  # low
                if last_low is None:
                    label = "Low"
                elif price > last_low:
                    label = "HL"  # Higher Low
                else:
                    label = "LL"  # Lower Low
                last_low = price
            
            classified_swings.append({
                **swing,
                "label": label
            })

        # 2. BOS and CHOCH Breaks
        structure_events = []
        current_trend = "Bullish"
        active_high = None
        active_low = None

        for i in range(1, len(df)):
            close_price = float(closes.iloc[i])
            
            # Check for swing updates completed on previous candle
            for cs in classified_swings:
                if cs["index"] == i - 1:
                    if cs["type"] == "high":
                        active_high = cs
                    else:
                        active_low = cs
            
            # Evaluate breaks
            if active_high and close_price > active_high["price"]:
                event_type = "BOS" if current_trend == "Bullish" else "CHOCH"
                structure_events.append({
                    "type": event_type,
                    "name": f"{event_type} (Bullish)",
                    "price": active_high["price"],
                    "time": get_time(i),
                    "details": f"Bullish breakout past previous High ({active_high['price']:.2f})"
                })
                current_trend = "Bullish"
                active_high = None
                
            elif active_low and close_price < active_low["price"]:
                event_type = "BOS" if current_trend == "Bearish" else "CHOCH"
                structure_events.append({
                    "type": event_type,
                    "name": f"{event_type} (Bearish)",
                    "price": active_low["price"],
                    "time": get_time(i),
                    "details": f"Bearish breakdown past previous Low ({active_low['price']:.2f})"
                })
                current_trend = "Bearish"
                active_low = None

        # 3. Fair Value Gaps (FVG)
        fvgs = []
        for i in range(2, len(df)):
            # Bullish FVG
            if lows.iloc[i] > highs.iloc[i - 2]:
                fvgs.append({
                    "type": "bullish_fvg",
                    "name": "Bullish FVG",
                    "top": float(lows.iloc[i]),
                    "bottom": float(highs.iloc[i - 2]),
                    "time": get_time(i - 1),
                    "details": f"Bullish Fair Value Gap between {highs.iloc[i-2]:.2f} and {lows.iloc[i]:.2f}"
                })
            # Bearish FVG
            elif highs.iloc[i] < lows.iloc[i - 2]:
                fvgs.append({
                    "type": "bearish_fvg",
                    "name": "Bearish FVG",
                    "top": float(lows.iloc[i - 2]),
                    "bottom": float(highs.iloc[i]),
                    "time": get_time(i - 1),
                    "details": f"Bearish Fair Value Gap between {lows.iloc[i-2]:.2f} and {highs.iloc[i]:.2f}"
                })

        # 4. Order Blocks (OB)
        order_blocks = []
        for event in structure_events:
            event_time = event["time"]
            event_idx = None
            for idx in range(len(df)):
                if get_time(idx) == event_time:
                    event_idx = idx
                    break
            
            if event_idx is None:
                continue

            if "Bullish" in event["name"]:
                ob_candidate = None
                for idx in range(event_idx - 1, max(0, event_idx - 15), -1):
                    if closes.iloc[idx] < opens.iloc[idx]:  # Red candle
                        ob_candidate = {
                            "type": "bullish_ob",
                            "name": "Bullish Order Block",
                            "top": float(highs.iloc[idx]),
                            "bottom": float(lows.iloc[idx]),
                            "price": float(closes.iloc[idx]),
                            "time": get_time(idx),
                            "details": f"Bullish Order Block at {lows.iloc[idx]:.2f} - {highs.iloc[idx]:.2f}"
                        }
                        break
                if ob_candidate:
                    order_blocks.append(ob_candidate)
            else:  # Bearish
                ob_candidate = None
                for idx in range(event_idx - 1, max(0, event_idx - 15), -1):
                    if closes.iloc[idx] > opens.iloc[idx]:  # Green candle
                        ob_candidate = {
                            "type": "bearish_ob",
                            "name": "Bearish Order Block",
                            "top": float(highs.iloc[idx]),
                            "bottom": float(lows.iloc[idx]),
                            "price": float(closes.iloc[idx]),
                            "time": get_time(idx),
                            "details": f"Bearish Order Block at {lows.iloc[idx]:.2f} - {highs.iloc[idx]:.2f}"
                        }
                        break
                if ob_candidate:
                    order_blocks.append(ob_candidate)

        # 5. Supply & Demand Zones
        supply_zones = []
        demand_zones = []
        for cs in classified_swings:
            if cs["type"] == "high" and cs["label"] in ["HH", "High"]:
                supply_zones.append({
                    "type": "supply",
                    "name": "Supply Zone",
                    "top": cs["price"] * 1.015,
                    "bottom": cs["price"] * 0.985,
                    "price": cs["price"],
                    "time": cs["time"],
                    "details": f"Supply Zone around Swing High {cs['price']:.2f}"
                })
            elif cs["type"] == "low" and cs["label"] in ["LL", "Low"]:
                demand_zones.append({
                    "type": "demand",
                    "name": "Demand Zone",
                    "top": cs["price"] * 1.015,
                    "bottom": cs["price"] * 0.985,
                    "price": cs["price"],
                    "time": cs["time"],
                    "details": f"Demand Zone around Swing Low {cs['price']:.2f}"
                })

        # 6. Liquidity Sweeps, Breakouts & Fakeouts
        liquidity_sweeps = []
        fakeouts = []
        breakouts = []
        
        for cs in classified_swings:
            swing_idx = cs["index"]
            swing_price = cs["price"]
            swing_type = cs["type"]
            
            for i in range(swing_idx + 1, len(df)):
                if swing_type == "high":
                    if highs.iloc[i] > swing_price and closes.iloc[i] <= swing_price:
                        liquidity_sweeps.append({
                            "type": "liquidity_sweep",
                            "name": "Liquidity Sweep",
                            "price": swing_price,
                            "time": get_time(i),
                            "details": f"Buy liquidity swept at {highs.iloc[i]:.2f} before closing below {swing_price:.2f}"
                        })
                        break
                    elif closes.iloc[i] > swing_price:
                        if i < len(df) - 1 and closes.iloc[i + 1] < swing_price:
                            fakeouts.append({
                                "type": "fakeout",
                                "name": "Fake Breakout",
                                "price": swing_price,
                                "time": get_time(i),
                                "details": f"Bullish fake breakout above resistance {swing_price:.2f}"
                            })
                        else:
                            breakouts.append({
                                "type": "breakout",
                                "name": "Bullish Breakout",
                                "price": swing_price,
                                "time": get_time(i),
                                "details": f"Bullish breakout above resistance {swing_price:.2f}"
                            })
                        break
                else:  # low
                    if lows.iloc[i] < swing_price and closes.iloc[i] >= swing_price:
                        liquidity_sweeps.append({
                            "type": "liquidity_sweep",
                            "name": "Liquidity Sweep",
                            "price": swing_price,
                            "time": get_time(i),
                            "details": f"Sell liquidity swept at {lows.iloc[i]:.2f} before closing above {swing_price:.2f}"
                        })
                        break
                    elif closes.iloc[i] < swing_price:
                        if i < len(df) - 1 and closes.iloc[i + 1] > swing_price:
                            fakeouts.append({
                                "type": "fakeout",
                                "name": "Fake Breakout",
                                "price": swing_price,
                                "time": get_time(i),
                                "details": f"Bearish fake breakout below support {swing_price:.2f}"
                            })
                        else:
                            breakouts.append({
                                "type": "breakout",
                                "name": "Bearish Breakout",
                                "price": swing_price,
                                "time": get_time(i),
                                "details": f"Bearish breakout below support {swing_price:.2f}"
                            })
                        break

        # 7. Candlestick Patterns
        candlesticks = []
        for i in range(2, len(df)):
            o = float(opens.iloc[i])
            h = float(highs.iloc[i])
            l = float(lows.iloc[i])
            c = float(closes.iloc[i])
            body = abs(c - o)
            rng = h - l
            
            if rng == 0:
                continue

            o_prev = float(opens.iloc[i - 1])
            c_prev = float(closes.iloc[i - 1])
            h_prev = float(highs.iloc[i - 1])
            l_prev = float(lows.iloc[i - 1])
            body_prev = abs(c_prev - o_prev)

            o_prev2 = float(opens.iloc[i - 2])
            c_prev2 = float(closes.iloc[i - 2])
            body_prev2 = abs(c_prev2 - o_prev2)

            # Doji
            if body <= 0.1 * rng:
                candlesticks.append({
                    "type": "candlestick", "name": "Doji", "time": get_time(i), "price": c,
                    "details": "Doji candle signaling market indecision."
                })
                continue

            # Hammer
            lower_shadow = min(o, c) - l
            upper_shadow = h - max(o, c)
            if lower_shadow >= 2 * body and upper_shadow <= 0.2 * body and body > 0:
                candlesticks.append({
                    "type": "candlestick", "name": "Hammer", "time": get_time(i), "price": c,
                    "details": "Hammer candle signifying localized demand pressure."
                })
                continue

            # Shooting Star
            if upper_shadow >= 2 * body and lower_shadow <= 0.2 * body and body > 0:
                candlesticks.append({
                    "type": "candlestick", "name": "Shooting Star", "time": get_time(i), "price": c,
                    "details": "Shooting Star candle signifying overhead selling pressure."
                })
                continue

            # Engulfing
            # Bullish
            if c_prev < o_prev and c > o and o <= c_prev and c >= o_prev and body > body_prev:
                candlesticks.append({
                    "type": "candlestick", "name": "Bullish Engulfing", "time": get_time(i), "price": c,
                    "details": "Bullish Engulfing pattern indicating reversal momentum."
                })
                continue
            # Bearish
            elif c_prev > o_prev and c < o and o >= c_prev and c <= o_prev and body > body_prev:
                candlesticks.append({
                    "type": "candlestick", "name": "Bearish Engulfing", "time": get_time(i), "price": c,
                    "details": "Bearish Engulfing pattern indicating supply takeover."
                })
                continue

            # Harami
            # Bullish
            if c_prev < o_prev and c > o and o > c_prev and c < o_prev and body_prev > 2 * body:
                candlesticks.append({
                    "type": "candlestick", "name": "Bullish Harami", "time": get_time(i), "price": c,
                    "details": "Bullish Harami inside-bar pattern."
                })
                continue
            # Bearish
            elif c_prev > o_prev and c < o and o < c_prev and c > o_prev and body_prev > 2 * body:
                candlesticks.append({
                    "type": "candlestick", "name": "Bearish Harami", "time": get_time(i), "price": c,
                    "details": "Bearish Harami inside-bar pattern."
                })
                continue

            # Morning Star (3-candle Bullish)
            if c_prev2 < o_prev2 and body_prev2 > body_prev and c_prev < c_prev2 and c > o and c > (o_prev2 + c_prev2) / 2:
                candlesticks.append({
                    "type": "candlestick", "name": "Morning Star", "time": get_time(i), "price": c,
                    "details": "Morning Star 3-candle bullish reversal pattern."
                })
                continue

            # Evening Star (3-candle Bearish)
            if c_prev2 > o_prev2 and body_prev2 > body_prev and c_prev > c_prev2 and c < o and c < (o_prev2 + c_prev2) / 2:
                candlesticks.append({
                    "type": "candlestick", "name": "Evening Star", "time": get_time(i), "price": c,
                    "details": "Evening Star 3-candle bearish reversal pattern."
                })
                continue

            # Tweezers
            # Tweezer Bottom
            if abs(l - l_prev) / l < 0.001 and l == min(l, l_prev):
                candlesticks.append({
                    "type": "candlestick", "name": "Tweezer Bottom", "time": get_time(i), "price": l,
                    "details": "Tweezer Bottom pattern highlighting equal support lows."
                })
                continue
            # Tweezer Top
            elif abs(h - h_prev) / h < 0.001 and h == max(h, h_prev):
                candlesticks.append({
                    "type": "candlestick", "name": "Tweezer Top", "time": get_time(i), "price": h,
                    "details": "Tweezer Top pattern highlighting equal overhead highs."
                })
                continue

        return {
            "swings": classified_swings,
            "structure_events": structure_events,
            "fvgs": fvgs,
            "order_blocks": order_blocks,
            "supply_zones": supply_zones,
            "demand_zones": demand_zones,
            "liquidity_sweeps": liquidity_sweeps,
            "fakeouts": fakeouts,
            "breakouts": breakouts,
            "candlesticks": candlesticks
        }
