import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple

class ChartPatternDetector:
    @staticmethod
    def get_swings(df: pd.DataFrame, window: int = 5) -> List[Dict[str, Any]]:
        """
        Extracts swing highs and swing lows.
        """
        highs = df["High"]
        lows = df["Low"]
        times = df.index
        
        swings = []
        for i in range(window, len(df) - window):
            # Check swing high
            if highs.iloc[i] == highs.iloc[i-window : i+window+1].max():
                swings.append({
                    "index": i,
                    "time": str(times[i].date()) if hasattr(times[i], "date") else str(times[i]),
                    "price": float(highs.iloc[i]),
                    "type": "high"
                })
            # Check swing low
            if lows.iloc[i] == lows.iloc[i-window : i+window+1].min():
                swings.append({
                    "index": i,
                    "time": str(times[i].date()) if hasattr(times[i], "date") else str(times[i]),
                    "price": float(lows.iloc[i]),
                    "type": "low"
                })
        return swings

    @classmethod
    def detect(cls, df: pd.DataFrame) -> List[Dict[str, Any]]:
        if df.empty or len(df) < 25:
            return []

        swings = cls.get_swings(df)
        if len(swings) < 4:
            return []

        patterns = []
        
        # Split swings into highs and lows
        high_swings = [s for s in swings if s["type"] == "high"]
        low_swings = [s for s in swings if s["type"] == "low"]

        # 1. Double Top
        if len(high_swings) >= 2:
            p1, p2 = high_swings[-2], high_swings[-1]
            # Must be separated by a valley
            valleys = [s for s in low_swings if p1["index"] < s["index"] < p2["index"]]
            if valleys:
                diff = abs(p1["price"] - p2["price"]) / p1["price"]
                if diff < 0.015:
                    v = valleys[-1]
                    patterns.append({
                        "name": "Double Top",
                        "confidence": int(100 - (diff * 2000)), # higher confidence if closer
                        "direction": "Bearish",
                        "probability": 72,
                        "explanation": "Double Top is a bearish reversal pattern showing two consecutive peaks at similar heights, indicating resistance is holding.",
                        "points": [
                            {"time": p1["time"], "price": p1["price"], "label": "Peak 1"},
                            {"time": p2["time"], "price": p2["price"], "label": "Peak 2"},
                            {"time": v["time"], "price": v["price"], "label": "Neckline Support"}
                        ],
                        "lines": [
                            {"start_time": p1["time"], "start_price": p1["price"], "end_time": p2["time"], "end_price": p2["price"], "label": "Resistance Channel"},
                            {"start_time": v["time"], "start_price": v["price"], "end_time": p2["time"], "end_price": v["price"], "label": "Neckline"}
                        ]
                    })

        # 2. Double Bottom
        if len(low_swings) >= 2:
            v1, v2 = low_swings[-2], low_swings[-1]
            peaks = [s for s in high_swings if v1["index"] < s["index"] < v2["index"]]
            if peaks:
                diff = abs(v1["price"] - v2["price"]) / v1["price"]
                if diff < 0.015:
                    p = peaks[-1]
                    patterns.append({
                        "name": "Double Bottom",
                        "confidence": int(100 - (diff * 2000)),
                        "direction": "Bullish",
                        "probability": 74,
                        "explanation": "Double Bottom is a bullish reversal pattern showing two consecutive valleys at similar heights, indicating support has held.",
                        "points": [
                            {"time": v1["time"], "price": v1["price"], "label": "Valley 1"},
                            {"time": v2["time"], "price": v2["price"], "label": "Valley 2"},
                            {"time": p["time"], "price": p["price"], "label": "Neckline Resistance"}
                        ],
                        "lines": [
                            {"start_time": v1["time"], "start_price": v1["price"], "end_time": v2["time"], "end_price": v2["price"], "label": "Support Channel"},
                            {"start_time": p["time"], "start_price": p["price"], "end_time": v2["time"], "end_price": p["price"], "label": "Neckline"}
                        ]
                    })

        # 3. Triple Top
        if len(high_swings) >= 3:
            p1, p2, p3 = high_swings[-3], high_swings[-2], high_swings[-1]
            diff1 = abs(p1["price"] - p2["price"]) / p1["price"]
            diff2 = abs(p2["price"] - p3["price"]) / p2["price"]
            if diff1 < 0.02 and diff2 < 0.02:
                patterns.append({
                    "name": "Triple Top",
                    "confidence": int(100 - ((diff1 + diff2) * 1000)),
                    "direction": "Bearish",
                    "probability": 76,
                    "explanation": "Triple Top is a bearish reversal pattern showing three consecutive peaks at similar heights, verifying extremely strong resistance.",
                    "points": [
                        {"time": p1["time"], "price": p1["price"], "label": "Peak 1"},
                        {"time": p2["time"], "price": p2["price"], "label": "Peak 2"},
                        {"time": p3["time"], "price": p3["price"], "label": "Peak 3"}
                    ],
                    "lines": [
                        {"start_time": p1["time"], "start_price": p1["price"], "end_time": p3["time"], "end_price": p3["price"], "label": "Triple Resistance"}
                    ]
                })

        # 4. Triple Bottom
        if len(low_swings) >= 3:
            v1, v2, v3 = low_swings[-3], low_swings[-2], low_swings[-1]
            diff1 = abs(v1["price"] - v2["price"]) / v1["price"]
            diff2 = abs(v2["price"] - v3["price"]) / v2["price"]
            if diff1 < 0.02 and diff2 < 0.02:
                patterns.append({
                    "name": "Triple Bottom",
                    "confidence": int(100 - ((diff1 + diff2) * 1000)),
                    "direction": "Bullish",
                    "probability": 78,
                    "explanation": "Triple Bottom is a bullish reversal pattern showing three consecutive valleys at similar heights, verifying extremely strong support.",
                    "points": [
                        {"time": v1["time"], "price": v1["price"], "label": "Valley 1"},
                        {"time": v2["time"], "price": v2["price"], "label": "Valley 2"},
                        {"time": v3["time"], "price": v3["price"], "label": "Valley 3"}
                    ],
                    "lines": [
                        {"start_time": v1["time"], "start_price": v1["price"], "end_time": v3["time"], "end_price": v3["price"], "label": "Triple Support"}
                    ]
                })

        # 5. Head & Shoulders
        if len(high_swings) >= 3 and len(low_swings) >= 2:
            p1, p2, p3 = high_swings[-3], high_swings[-2], high_swings[-1]
            v1, v2 = low_swings[-2], low_swings[-1]
            if p1["index"] < v1["index"] < p2["index"] < v2["index"] < p3["index"]:
                # Head must be higher than left and right shoulders
                if p2["price"] > p1["price"] and p2["price"] > p3["price"]:
                    # Shoulders must be close in height
                    shoulder_diff = abs(p1["price"] - p3["price"]) / p1["price"]
                    if shoulder_diff < 0.03:
                        patterns.append({
                            "name": "Head & Shoulders",
                            "confidence": int(100 - (shoulder_diff * 1000)),
                            "direction": "Bearish",
                            "probability": 82,
                            "explanation": "Head & Shoulders is a bearish reversal pattern featuring a left shoulder, a higher head, and a lower right shoulder.",
                            "points": [
                                {"time": p1["time"], "price": p1["price"], "label": "Left Shoulder"},
                                {"time": p2["time"], "price": p2["price"], "label": "Head"},
                                {"time": p3["time"], "price": p3["price"], "label": "Right Shoulder"},
                                {"time": v1["time"], "price": v1["price"], "label": "Neckline Support 1"},
                                {"time": v2["time"], "price": v2["price"], "label": "Neckline Support 2"}
                            ],
                            "lines": [
                                {"start_time": v1["time"], "start_price": v1["price"], "end_time": v2["time"], "end_price": v2["price"], "label": "Neckline"}
                            ]
                        })

        # 6. Inverse Head & Shoulders
        if len(low_swings) >= 3 and len(high_swings) >= 2:
            v1, v2, v3 = low_swings[-3], low_swings[-2], low_swings[-1]
            p1, p2 = high_swings[-2], high_swings[-1]
            if v1["index"] < p1["index"] < v2["index"] < p2["index"] < v3["index"]:
                if v2["price"] < v1["price"] and v2["price"] < v3["price"]:
                    shoulder_diff = abs(v1["price"] - v3["price"]) / v1["price"]
                    if shoulder_diff < 0.03:
                        patterns.append({
                            "name": "Inverse Head & Shoulders",
                            "confidence": int(100 - (shoulder_diff * 1000)),
                            "direction": "Bullish",
                            "probability": 85,
                            "explanation": "Inverse Head & Shoulders is a bullish reversal pattern featuring a left shoulder, a lower head valley, and a right shoulder.",
                            "points": [
                                {"time": v1["time"], "price": v1["price"], "label": "Left Shoulder"},
                                {"time": v2["time"], "price": v2["price"], "label": "Head"},
                                {"time": v3["time"], "price": v3["price"], "label": "Right Shoulder"},
                                {"time": p1["time"], "price": p1["price"], "label": "Neckline Resistance 1"},
                                {"time": p2["time"], "price": p2["price"], "label": "Neckline Resistance 2"}
                            ],
                            "lines": [
                                {"start_time": p1["time"], "start_price": p1["price"], "end_time": p2["time"], "end_price": p2["price"], "label": "Neckline"}
                            ]
                        })

        # 7. Triangles, Wedges, Channels and Rectangles
        # We can fit lines to the last 3 highs and 3 lows
        if len(high_swings) >= 3 and len(low_swings) >= 3:
            h_pts = high_swings[-3:]
            l_pts = low_swings[-3:]
            
            # Linear fit: y = m * x + c
            x_high = [p["index"] for p in h_pts]
            y_high = [p["price"] for p in h_pts]
            x_low = [p["index"] for p in l_pts]
            y_low = [p["price"] for p in l_pts]
            
            m_high, c_high = np.polyfit(x_high, y_high, 1)
            m_low, c_low = np.polyfit(x_low, y_low, 1)
            
            # Calculate standard deviation of residuals to evaluate fit quality
            fit_err_high = np.std(y_high - (m_high * np.array(x_high) + c_high)) / np.mean(y_high)
            fit_err_low = np.std(y_low - (m_low * np.array(x_low) + c_low)) / np.mean(y_low)
            
            if fit_err_high < 0.02 and fit_err_low < 0.02:
                # We can draw the trendlines across the range of these indexes
                start_idx = min(x_high[0], x_low[0])
                end_idx = max(x_high[-1], x_low[-1])
                start_time = str(df.index[start_idx].date()) if hasattr(df.index[start_idx], "date") else str(df.index[start_idx])
                end_time = str(df.index[end_idx].date()) if hasattr(df.index[end_idx], "date") else str(df.index[end_idx])
                
                h_start = float(m_high * start_idx + c_high)
                h_end = float(m_high * end_idx + c_high)
                l_start = float(m_low * start_idx + c_low)
                l_end = float(m_low * end_idx + c_low)
                
                lines = [
                    {"start_time": start_time, "start_price": h_start, "end_time": end_time, "end_price": h_end, "label": "Resistance line"},
                    {"start_time": start_time, "start_price": l_start, "end_time": end_time, "end_price": l_end, "label": "Support line"}
                ]
                
                # Check geometries based on slope rates (normalized to close price)
                norm_m_high = m_high / y_high[0]
                norm_m_low = m_low / y_low[0]
                
                # Symmetrical Triangle (high slopes down, low slopes up)
                if norm_m_high < -0.0005 and norm_m_low > 0.0005:
                    patterns.append({
                        "name": "Symmetrical Triangle",
                        "confidence": 80,
                        "direction": "Bullish", # typically breakout in direction of entry, assume bullish consolidation
                        "probability": 68,
                        "explanation": "Symmetrical Triangle shows converging support and resistance lines as consolidation tightens, pointing to an imminent breakout.",
                        "points": [],
                        "lines": lines
                    })
                # Ascending Triangle (high is flat, low slopes up)
                elif abs(norm_m_high) < 0.0004 and norm_m_low > 0.0005:
                    patterns.append({
                        "name": "Ascending Triangle",
                        "confidence": 82,
                        "direction": "Bullish",
                        "probability": 73,
                        "explanation": "Ascending Triangle is a bullish continuation pattern characterized by flat resistance and ascending support, indicating growing buying pressure.",
                        "points": [],
                        "lines": lines
                    })
                # Descending Triangle (high slopes down, low is flat)
                elif norm_m_high < -0.0005 and abs(norm_m_low) < 0.0004:
                    patterns.append({
                        "name": "Descending Triangle",
                        "confidence": 82,
                        "direction": "Bearish",
                        "probability": 71,
                        "explanation": "Descending Triangle is a bearish pattern featuring declining resistance and flat support, showing sellers are growing more aggressive.",
                        "points": [],
                        "lines": lines
                    })
                # Rectangle (both flat)
                elif abs(norm_m_high) < 0.0004 and abs(norm_m_low) < 0.0004:
                    patterns.append({
                        "name": "Rectangle Channel",
                        "confidence": 85,
                        "direction": "Bullish",
                        "probability": 65,
                        "explanation": "Rectangle Channel displays flat support and resistance levels. A breakout in either direction validates the trend continuation.",
                        "points": [],
                        "lines": lines
                    })
                # Wedge (both slope same direction, converging)
                elif norm_m_high * norm_m_low > 0: # same sign
                    # Converging?
                    if abs(norm_m_high - norm_m_low) > 0.0002:
                        is_rising = norm_m_high > 0
                        patterns.append({
                            "name": "Rising Wedge" if is_rising else "Falling Wedge",
                            "confidence": 78,
                            "direction": "Bearish" if is_rising else "Bullish",
                            "probability": 70 if is_rising else 74,
                            "explanation": f"{'Rising' if is_rising else 'Falling'} Wedge features converging support and resistance lines sloping {'upward' if is_rising else 'downward'}, signaling a structural reversal.",
                            "points": [],
                            "lines": lines
                        })
                    else:
                        # Parallel channel
                        is_ascending = norm_m_high > 0
                        patterns.append({
                            "name": "Ascending Channel" if is_ascending else "Descending Channel",
                            "confidence": 80,
                            "direction": "Bearish" if is_ascending else "Bullish",
                            "probability": 68,
                            "explanation": f"{'Ascending' if is_ascending else 'Descending'} Channel binds prices within parallel upward/downward channels. Breakouts typically occur opposite to the slope.",
                            "points": [],
                            "lines": lines
                        })

        # 8. Flags & Pennants
        # Check for sharp move (Pole) in preceding 10 candles
        if len(df) >= 20:
            close = df["Close"]
            high = df["High"]
            low = df["Low"]
            
            # Simple check for Bull Flag: strong move up followed by tight consolidation
            pole_move = ((close.iloc[-5] - close.iloc[-15]) / close.iloc[-15]) * 100
            if pole_move > 4.5: # 4.5% pole in 10 candles
                # Next check consolidation: the last 5 candles display negative slope / drop
                consol_range = high.iloc[-5:].max() - low.iloc[-5:].min()
                if consol_range / close.iloc[-1] < 0.03: # tight 3% consolidation
                    start_idx = len(df) - 5
                    end_idx = len(df) - 1
                    start_time = str(df.index[start_idx].date()) if hasattr(df.index[start_idx], "date") else str(df.index[start_idx])
                    end_time = str(df.index[end_idx].date()) if hasattr(df.index[end_idx], "date") else str(df.index[end_idx])
                    
                    patterns.append({
                        "name": "Bull Flag",
                        "confidence": 75,
                        "direction": "Bullish",
                        "probability": 72,
                        "explanation": "Bull Flag is a bullish continuation pattern showing a sharp rally (pole) followed by a tight consolidative channel.",
                        "points": [],
                        "lines": [
                            {"start_time": start_time, "start_price": float(high.iloc[start_idx]), "end_time": end_time, "end_price": float(high.iloc[end_idx]), "label": "Flag Resistance"},
                            {"start_time": start_time, "start_price": float(low.iloc[start_idx]), "end_time": end_time, "end_price": float(low.iloc[end_idx]), "label": "Flag Support"}
                        ]
                    })
            elif pole_move < -4.5: # sharp downward pole
                consol_range = high.iloc[-5:].max() - low.iloc[-5:].min()
                if consol_range / close.iloc[-1] < 0.03:
                    start_idx = len(df) - 5
                    end_idx = len(df) - 1
                    start_time = str(df.index[start_idx].date()) if hasattr(df.index[start_idx], "date") else str(df.index[start_idx])
                    end_time = str(df.index[end_idx].date()) if hasattr(df.index[end_idx], "date") else str(df.index[end_idx])
                    
                    patterns.append({
                        "name": "Bear Flag",
                        "confidence": 75,
                        "direction": "Bearish",
                        "probability": 70,
                        "explanation": "Bear Flag is a bearish continuation pattern showing a sharp selloff (pole) followed by a brief upward consolidative channel.",
                        "points": [],
                        "lines": [
                            {"start_time": start_time, "start_price": float(high.iloc[start_idx]), "end_time": end_time, "end_price": float(high.iloc[end_idx]), "label": "Flag Resistance"},
                            {"start_time": start_time, "start_price": float(low.iloc[start_idx]), "end_time": end_time, "end_price": float(low.iloc[end_idx]), "label": "Flag Support"}
                        ]
                    })

        # 9. Pennants (sharp pole followed by symmetrical triangle)
        # We can inherit the pole checks and look for narrowing ranges in the last 5 candles
        if len(df) >= 20:
            close = df["Close"]
            high = df["High"]
            low = df["Low"]
            
            pole_move = ((close.iloc[-5] - close.iloc[-15]) / close.iloc[-15]) * 100
            # Narrowing wicks?
            h_range = high.iloc[-5:].max() - low.iloc[-5:].min()
            narrowing = (high.iloc[-1] - low.iloc[-1]) < (high.iloc[-5] - low.iloc[-5])
            if abs(pole_move) > 4.5 and h_range / close.iloc[-1] < 0.035 and narrowing:
                start_idx = len(df) - 5
                end_idx = len(df) - 1
                start_time = str(df.index[start_idx].date()) if hasattr(df.index[start_idx], "date") else str(df.index[start_idx])
                end_time = str(df.index[end_idx].date()) if hasattr(df.index[end_idx], "date") else str(df.index[end_idx])
                
                is_bullish = pole_move > 0
                patterns.append({
                    "name": "Bullish Pennant" if is_bullish else "Bearish Pennant",
                    "confidence": 72,
                    "direction": "Bullish" if is_bullish else "Bearish",
                    "probability": 70 if is_bullish else 68,
                    "explanation": f"{'Bullish' if is_bullish else 'Bearish'} Pennant features a sharp {'rally' if is_bullish else 'selloff'} followed by a very tight converging triangular consolidation.",
                    "points": [],
                    "lines": [
                        {"start_time": start_time, "start_price": float(high.iloc[start_idx]), "end_time": end_time, "end_price": float(high.iloc[end_idx]), "label": "Pennant Resistance"},
                        {"start_time": start_time, "start_price": float(low.iloc[start_idx]), "end_time": end_time, "end_price": float(low.iloc[end_idx]), "label": "Pennant Support"}
                    ]
                })

        # 10. Cup & Handle
        # U-shape followed by a brief flag consolidation
        # Let's check for a U-shape in a 25-candle window
        if len(df) >= 30:
            close = df["Close"]
            # Look at segment from -30 to -5
            seg = close.iloc[-30:-5]
            # U-shape: endpoints are high, middle is low
            left_height = seg.iloc[0]
            right_height = seg.iloc[-1]
            min_height = seg.min()
            
            # Endpoints must be similar height
            if abs(left_height - right_height) / left_height < 0.05:
                # Middle must be lower (at least 3% lower than left)
                if min_height < left_height * 0.95:
                    # Let's check that it curves (middle index is approximately min height)
                    min_idx = seg.argmin()
                    if 5 < min_idx < 20: # min is somewhere in the middle
                        # Handle: last 5 candles consolidating below the right height
                        handle_seg = close.iloc[-5:]
                        if handle_seg.max() <= right_height * 1.02 and handle_seg.min() >= min_height:
                            patterns.append({
                                "name": "Cup & Handle",
                                "confidence": 70,
                                "direction": "Bullish",
                                "probability": 75,
                                "explanation": "Cup & Handle is a bullish continuation pattern characterized by a U-shaped rounded bottom (cup) and a short consolidative channel pullback (handle).",
                                "points": [
                                    {"time": str(df.index[-30].date()) if hasattr(df.index[-30], "date") else str(df.index[-30]), "price": left_height, "label": "Cup Left Rim"},
                                    {"time": str(df.index[-5].date()) if hasattr(df.index[-5], "date") else str(df.index[-5]), "price": right_height, "label": "Cup Right Rim"},
                                    {"time": str(df.index[-30 + min_idx].date()) if hasattr(df.index[-30 + min_idx], "date") else str(df.index[-30 + min_idx]), "price": min_height, "label": "Cup Bottom"}
                                ],
                                "lines": [
                                    {"start_time": str(df.index[-30].date()) if hasattr(df.index[-30], "date") else str(df.index[-30]), "start_price": left_height, "end_time": str(df.index[-5].date()) if hasattr(df.index[-5], "date") else str(df.index[-5]), "end_price": right_height, "label": "Rim Line"}
                                ]
                            })

        # Return all detected patterns, sorted by confidence descending
        patterns.sort(key=lambda x: x["confidence"], reverse=True)
        return patterns
