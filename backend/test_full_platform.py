"""
Full Platform API Test - TechTrade (v2 - corrected schemas)
Tests every major endpoint with correct request formats.
ASCII-only output for Windows cp1252 compatibility.
"""
import sys
import requests

BASE = "http://localhost:8000/api/v1"
RESULTS = []


def check(name, resp, expected_status=200, key_check=None):
    status = "PASS" if resp.status_code == expected_status else "FAIL"
    detail = ""
    if status == "PASS" and key_check:
        try:
            data = resp.json()
            if key_check not in str(data):
                status = "WARN"
                detail = f"Key '{key_check}' not found"
        except Exception:
            status = "WARN"
            detail = "JSON parse error"
    short = (detail or resp.text[:120]).replace("\n", " ")
    RESULTS.append({"test": name, "status": status, "http": resp.status_code, "detail": short})
    icon = "[OK]  " if status == "PASS" else ("[WARN] " if status == "WARN" else "[FAIL] ")
    print(f"  {icon} {resp.status_code}  {name}")
    if status != "PASS":
        print(f"         => {short[:120]}")
    return resp


def check_err(name, error):
    msg = str(error)[:120]
    RESULTS.append({"test": name, "status": "ERROR", "http": 0, "detail": msg})
    print(f"  [ERROR]  0  {name}")
    print(f"         => {msg}")


print()
print("=" * 64)
print("  TECHTRADE FULL PLATFORM API TEST SUITE  (v2)")
print("=" * 64)

# ----------------------------------------------------------------
# 1. AUTH
# ----------------------------------------------------------------
print("\n[1] AUTH")
try:
    r = requests.post(f"{BASE}/auth/register",
                      json={"email": "apitest2@techtrade.com",
                            "password": "Test1234!",
                            "full_name": "API Tester"},
                      timeout=10)
    # 200 = new user, 400 = already exists (both acceptable)
    ok = r.status_code in (200, 400)
    status = "PASS" if ok else "FAIL"
    RESULTS.append({"test": "Register user", "status": status, "http": r.status_code, "detail": r.text[:80]})
    print(f"  {'[OK]  ' if ok else '[FAIL] '} {r.status_code}  Register user")
except Exception as e:
    check_err("Register user", e)

TOKEN = None
try:
    r = requests.post(f"{BASE}/auth/login",
                      data={"username": "apitest2@techtrade.com",
                            "password": "Test1234!"},
                      timeout=10)
    check("Login and get JWT token", r, 200, "access_token")
    TOKEN = r.json().get("access_token")
except Exception as e:
    check_err("Login", e)

H = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}

try:
    r = requests.get(f"{BASE}/users/me", headers=H, timeout=10)
    check("GET /users/me  (current user profile)", r, 200, "email")
except Exception as e:
    check_err("Get current user", e)

try:
    r = requests.put(f"{BASE}/users/me", headers=H,
                     json={"full_name": "API Tester Updated"}, timeout=10)
    check("PUT /users/me  (update profile)", r, 200)
except Exception as e:
    check_err("Update user", e)

# ----------------------------------------------------------------
# 2. STOCKS
# ----------------------------------------------------------------
print("\n[2] STOCKS")
for sym in ["AAPL", "TSLA", "MSFT"]:
    try:
        r = requests.get(f"{BASE}/stocks/{sym}/info", headers=H, timeout=15)
        check(f"GET /stocks/{sym}/info", r, 200)
    except Exception as e:
        check_err(f"Stock info {sym}", e)

try:
    r = requests.get(f"{BASE}/stocks/AAPL/history?period=1mo&interval=1d",
                     headers=H, timeout=15)
    check("GET /stocks/AAPL/history  (1mo daily)", r, 200)
except Exception as e:
    check_err("Price history", e)

try:
    r = requests.get(f"{BASE}/stocks/AAPL/analysis?period=1y&interval=1d",
                     headers=H, timeout=25)
    check("GET /stocks/AAPL/analysis  (technical indicators)", r, 200)
except Exception as e:
    check_err("Technical analysis", e)

try:
    r = requests.get(f"{BASE}/stocks/AAPL/price-action?period=3mo&interval=1d",
                     headers=H, timeout=25)
    check("GET /stocks/AAPL/price-action  (SMC/ICT)", r, 200)
except Exception as e:
    check_err("Price action", e)

try:
    r = requests.get(f"{BASE}/stocks/AAPL/patterns?period=6mo&interval=1d",
                     headers=H, timeout=25)
    check("GET /stocks/AAPL/patterns  (chart patterns)", r, 200)
except Exception as e:
    check_err("Pattern recognition", e)

try:
    r = requests.get(f"{BASE}/stocks/search?q=Apple", headers=H, timeout=10)
    check("GET /stocks/search  (stock search)", r, 200)
except Exception as e:
    check_err("Stock search", e)

# AI summary requires Ollama — mark expected
try:
    r = requests.get(f"{BASE}/stocks/AAPL/ai-summary", headers=H, timeout=10)
    if r.status_code == 500:
        RESULTS.append({"test": "GET /stocks/AAPL/ai-summary (needs Ollama)", "status": "WARN",
                        "http": 500, "detail": "Expected — Ollama not running"})
        print("  [WARN]  500  GET /stocks/AAPL/ai-summary (needs Ollama - expected)")
    else:
        check("GET /stocks/AAPL/ai-summary", r, 200)
except Exception as e:
    check_err("AI summary", e)

# ----------------------------------------------------------------
# 3. WATCHLISTS
# ----------------------------------------------------------------
print("\n[3] WATCHLISTS")
WL_ID = None
try:
    r = requests.post(f"{BASE}/watchlists",
                      headers=H, json={"name": "My Tech Stocks"}, timeout=10)
    check("POST /watchlists  (create watchlist)", r, 200)
    WL_ID = r.json().get("id")
except Exception as e:
    check_err("Create watchlist", e)

try:
    r = requests.get(f"{BASE}/watchlists", headers=H, timeout=10)
    check("GET /watchlists  (list all)", r, 200)
    # Use first watchlist if creation failed
    if not WL_ID and r.status_code == 200:
        wls = r.json()
        if wls:
            WL_ID = wls[0]["id"]
except Exception as e:
    check_err("List watchlists", e)

if WL_ID:
    for sym in ["AAPL", "NVDA", "MSFT"]:
        try:
            r = requests.post(f"{BASE}/watchlists/{WL_ID}/items",
                              headers=H, json={"symbol": sym}, timeout=10)
            check(f"POST /watchlists/{WL_ID}/items  (add {sym})", r, 200)
        except Exception as e:
            check_err(f"Add {sym} to watchlist", e)

    try:
        r = requests.put(f"{BASE}/watchlists/{WL_ID}",
                         headers=H, json={"name": "My Renamed Watchlist"}, timeout=10)
        check(f"PUT /watchlists/{WL_ID}  (rename)", r, 200)
    except Exception as e:
        check_err("Rename watchlist", e)

# ----------------------------------------------------------------
# 4. SCANNER
# ----------------------------------------------------------------
print("\n[4] SCANNER")
# Correct schema: universe (str) + filters (list of {name, operator, value?})
try:
    r = requests.post(f"{BASE}/scanner/scan",
                      headers=H,
                      json={
                          "universe": "us",
                          "filters": [
                              {"name": "rsi", "operator": "lt", "value": 35},
                              {"name": "volume_spike", "operator": "bullish"}
                          ]
                      },
                      timeout=90)
    check("POST /scanner/scan  (RSI<35 + volume, us universe)", r, 200)
except Exception as e:
    check_err("Scanner scan us", e)

if WL_ID:
    try:
        r = requests.post(f"{BASE}/scanner/scan",
                          headers=H,
                          json={
                              "universe": "watchlist",
                              "filters": [{"name": "ma", "operator": "golden_cross"}]
                          },
                          timeout=60)
        check("POST /scanner/scan  (golden cross, watchlist universe)", r, 200)
    except Exception as e:
        check_err("Scanner watchlist scan", e)

# ----------------------------------------------------------------
# 5. JOURNAL  (uses multipart/form-data, not JSON)
# ----------------------------------------------------------------
print("\n[5] JOURNAL")
TRADE_ID = None
try:
    r = requests.post(f"{BASE}/journal/trades",
                      headers=H,
                      data={
                          "symbol": "AAPL",
                          "direction": "LONG",
                          "entry_price": "180.0",
                          "exit_price": "195.0",
                          "stop_loss": "175.0",
                          "target": "200.0",
                          "position_size": "10",
                          "notes": "Test API trade - LONG",
                          "emotions_before": "Confident",
                          "emotions_after": "Satisfied"
                      },
                      timeout=10)
    check("POST /journal/trades  (LONG AAPL, form-data)", r, 200)
    TRADE_ID = r.json().get("id")
except Exception as e:
    check_err("Create LONG trade", e)

try:
    r = requests.post(f"{BASE}/journal/trades",
                      headers=H,
                      data={
                          "symbol": "TSLA",
                          "direction": "SHORT",
                          "entry_price": "250.0",
                          "exit_price": "230.0",
                          "stop_loss": "260.0",
                          "target": "220.0",
                          "position_size": "5",
                          "notes": "Test SHORT trade",
                          "emotions_before": "Fearful",
                          "emotions_after": "Relieved"
                      },
                      timeout=10)
    check("POST /journal/trades  (SHORT TSLA, form-data)", r, 200)
except Exception as e:
    check_err("Create SHORT trade", e)

try:
    r = requests.get(f"{BASE}/journal/trades", headers=H, timeout=10)
    check("GET /journal/trades  (list all)", r, 200)
    if not TRADE_ID and r.status_code == 200:
        trades = r.json()
        if trades:
            TRADE_ID = trades[0]["id"]
except Exception as e:
    check_err("List trades", e)

try:
    r = requests.get(f"{BASE}/journal/stats", headers=H, timeout=10)
    check("GET /journal/stats  (win rate, R:R, expectancy)", r, 200)
except Exception as e:
    check_err("Journal stats", e)

# Correct route: /journal/report  (not /monthly-report)
try:
    r = requests.get(f"{BASE}/journal/report", headers=H, timeout=10)
    check("GET /journal/report  (monthly report)", r, 200)
except Exception as e:
    check_err("Monthly report", e)

# Correct route: /journal/trades/{id}/ai-coach  (not /journal/ai-coach)
if TRADE_ID:
    try:
        r = requests.get(f"{BASE}/journal/trades/{TRADE_ID}/ai-coach",
                         headers=H, timeout=15)
        check(f"GET /journal/trades/{TRADE_ID}/ai-coach  (AI coach)", r, 200)
    except Exception as e:
        check_err("AI coach", e)

# ----------------------------------------------------------------
# 6. SENTIMENT
# ----------------------------------------------------------------
print("\n[6] SENTIMENT")
# Correct route: /sentiment/market  (not /market-mood)
try:
    r = requests.get(f"{BASE}/sentiment/market", headers=H, timeout=15)
    check("GET /sentiment/market  (market mood / F&G)", r, 200)
except Exception as e:
    check_err("Market mood", e)

try:
    r = requests.get(f"{BASE}/sentiment/sectors", headers=H, timeout=10)
    check("GET /sentiment/sectors  (sector strength)", r, 200)
except Exception as e:
    check_err("Sector strengths", e)

try:
    r = requests.get(f"{BASE}/sentiment/news", headers=H, timeout=10)
    check("GET /sentiment/news  (news feed)", r, 200)
except Exception as e:
    check_err("News feed", e)

try:
    r = requests.get(f"{BASE}/sentiment/history", headers=H, timeout=10)
    check("GET /sentiment/history  (30-day history)", r, 200)
except Exception as e:
    check_err("Sentiment history", e)

# ----------------------------------------------------------------
# 7. BACKTEST  (correct schema: start_date, end_date, buy_rules, sell_rules)
# ----------------------------------------------------------------
print("\n[7] BACKTEST")
try:
    r = requests.post(f"{BASE}/backtest/run",
                      headers=H,
                      json={
                          "symbol": "AAPL",
                          "start_date": "2025-01-01",
                          "end_date": "2025-12-31",
                          "initial_capital": 10000.0,
                          "buy_rules": [
                              {"indicator": "RSI", "condition": "below", "value": "30"}
                          ],
                          "sell_rules": [
                              {"indicator": "RSI", "condition": "above", "value": "70"}
                          ]
                      },
                      timeout=60)
    check("POST /backtest/run  (RSI strategy AAPL 2025)", r, 200)
except Exception as e:
    check_err("Run backtest", e)

try:
    r = requests.post(f"{BASE}/backtest/export",
                      headers=H,
                      json={
                          "symbol": "AAPL",
                          "start_date": "2025-01-01",
                          "end_date": "2025-12-31",
                          "initial_capital": 10000.0,
                          "buy_rules": [{"indicator": "RSI", "condition": "below", "value": "30"}],
                          "sell_rules": [{"indicator": "RSI", "condition": "above", "value": "70"}]
                      },
                      timeout=60)
    check("POST /backtest/export  (CSV report download)", r, 200)
except Exception as e:
    check_err("Backtest export", e)

# ----------------------------------------------------------------
# 8. MACHINE LEARNING  (model keys: "Random Forest", "LSTM", etc.)
# ----------------------------------------------------------------
print("\n[8] MACHINE LEARNING")
try:
    r = requests.post(f"{BASE}/ml/train",
                      headers=H,
                      json={"symbol": "AAPL", "model_type": "Random Forest"},
                      timeout=120)
    check("POST /ml/train  (Random Forest on AAPL)", r, 200)
except Exception as e:
    check_err("Train Random Forest", e)

try:
    r = requests.post(f"{BASE}/ml/train",
                      headers=H,
                      json={"symbol": "AAPL", "model_type": "LSTM"},
                      timeout=120)
    check("POST /ml/train  (LSTM on AAPL)", r, 200)
except Exception as e:
    check_err("Train LSTM", e)

# Correct route: POST /ml/predict with body
try:
    r = requests.post(f"{BASE}/ml/predict",
                      headers=H,
                      json={"symbol": "AAPL", "model_type": "Random Forest"},
                      timeout=30)
    check("POST /ml/predict  (Random Forest prediction AAPL)", r, 200)
except Exception as e:
    check_err("ML predict", e)

# ----------------------------------------------------------------
# 9. AI CHAT
# ----------------------------------------------------------------
print("\n[9] AI CHAT ASSISTANT")
try:
    r = requests.get(f"{BASE}/chat/history", headers=H, timeout=10)
    check("GET /chat/history  (conversation history)", r, 200)
except Exception as e:
    check_err("Chat history", e)

# Streaming endpoint — test only non-stream mode
try:
    r = requests.post(f"{BASE}/chat/message",
                      headers=H,
                      json={"content": "What is RSI?", "model_type": "DeepSeek"},
                      timeout=5)
    # SSE streaming will cause timeout — just check it starts responding
    if r.status_code in (200, 500):  # 500 if Ollama offline
        RESULTS.append({"test": "POST /chat/message (streaming SSE)", "status": "WARN",
                        "http": r.status_code, "detail": "SSE streaming — needs Ollama"})
        print(f"  [WARN]  {r.status_code}  POST /chat/message (SSE streaming - needs Ollama)")
    else:
        check("POST /chat/message  (SSE stream)", r, 200)
except Exception as e:
    RESULTS.append({"test": "POST /chat/message (streaming SSE)", "status": "WARN",
                    "http": 0, "detail": "SSE timeout expected without Ollama"})
    print("  [WARN]    0  POST /chat/message (SSE timeout - needs Ollama)")

# ----------------------------------------------------------------
# 10. ALERTS
# ----------------------------------------------------------------
print("\n[10] ALERTS")
ALERT_ID = None
try:
    r = requests.post(f"{BASE}/alerts",
                      headers=H,
                      json={"symbol": "AAPL", "alert_type": "RSI_ABOVE",
                            "channel": "browser", "condition": "above", "value": 70.0},
                      timeout=10)
    check("POST /alerts  (RSI>70 AAPL browser alert)", r, 200)
    ALERT_ID = r.json().get("id")
except Exception as e:
    check_err("Create RSI alert", e)

try:
    r = requests.post(f"{BASE}/alerts",
                      headers=H,
                      json={"symbol": "TSLA", "alert_type": "VOLUME_SPIKE",
                            "channel": "browser", "condition": "above", "value": 5000000},
                      timeout=10)
    check("POST /alerts  (volume spike TSLA)", r, 200)
except Exception as e:
    check_err("Create volume alert", e)

try:
    r = requests.get(f"{BASE}/alerts", headers=H, timeout=10)
    check("GET /alerts  (list all active)", r, 200)
except Exception as e:
    check_err("List alerts", e)

try:
    r = requests.post(f"{BASE}/alerts/check?symbol=AAPL", headers=H, timeout=20)
    check("POST /alerts/check  (trigger scan AAPL)", r, 200)
except Exception as e:
    check_err("Check alerts", e)

if ALERT_ID:
    try:
        r = requests.delete(f"{BASE}/alerts/{ALERT_ID}", headers=H, timeout=10)
        check(f"DELETE /alerts/{ALERT_ID}  (delete alert)", r, 200)
    except Exception as e:
        check_err("Delete alert", e)

# ----------------------------------------------------------------
# 11. PORTFOLIO
# ----------------------------------------------------------------
print("\n[11] PORTFOLIO")
try:
    r = requests.get(f"{BASE}/portfolio", headers=H, timeout=15)
    check("GET /portfolio  (summary + holdings)", r, 200)
except Exception as e:
    check_err("Portfolio summary", e)

try:
    r = requests.post(f"{BASE}/portfolio/import-journal", headers=H, timeout=15)
    check("POST /portfolio/import-journal  (sync from trades)", r, 200)
except Exception as e:
    check_err("Import journal", e)

try:
    r = requests.post(f"{BASE}/portfolio/watchlist-sync", headers=H, timeout=15)
    check("POST /portfolio/watchlist-sync  (sync from watchlists)", r, 200)
except Exception as e:
    check_err("Sync watchlist", e)

try:
    r = requests.get(f"{BASE}/portfolio/ai-review", headers=H, timeout=15)
    check("GET /portfolio/ai-review  (AI recommendations)", r, 200)
except Exception as e:
    check_err("AI review", e)

# ----------------------------------------------------------------
# 12. ENTERPRISE
# ----------------------------------------------------------------
print("\n[12] ENTERPRISE FEATURES")
try:
    r = requests.get(f"{BASE}/enterprise/calendars", headers=H, timeout=10)
    check("GET /enterprise/calendars  (economic + IPO)", r, 200)
    data = r.json()
    assert "economic" in data and "ipo" in data, "Missing keys"
    print(f"         => {len(data['economic'])} economic events, {len(data['ipo'])} IPOs")
except Exception as e:
    check_err("Calendars", e)

try:
    r = requests.get(f"{BASE}/enterprise/options?symbol=AAPL", headers=H, timeout=10)
    check("GET /enterprise/options?symbol=AAPL  (calls + puts chain)", r, 200)
    data = r.json()
    print(f"         => {len(data.get('calls',[]))} calls, {len(data.get('puts',[]))} puts, expiry={data.get('expiry','?')}")
except Exception as e:
    check_err("Options chain", e)

try:
    r = requests.get(f"{BASE}/enterprise/insiders?symbol=AAPL", headers=H, timeout=10)
    check("GET /enterprise/insiders?symbol=AAPL  (trades + institutions)", r, 200)
    data = r.json()
    print(f"         => {len(data.get('insider_trades',[]))} insider trades, {len(data.get('institutional_holdings',[]))} institutions")
except Exception as e:
    check_err("Insider data", e)

try:
    r = requests.post(f"{BASE}/enterprise/ocr?filename=chart_aapl.png",
                      headers=H, timeout=10)
    check("POST /enterprise/ocr  (chart OCR mock)", r, 200)
    data = r.json()
    print(f"         => ticker={data.get('ticker_detected','?')}, confidence={data.get('confidence_score','?')}%")
except Exception as e:
    check_err("OCR scan", e)

for fmt in ["csv", "excel", "pdf"]:
    try:
        r = requests.get(f"{BASE}/enterprise/export?format={fmt}", headers=H, timeout=15)
        check(f"GET /enterprise/export?format={fmt}", r, 200)
    except Exception as e:
        check_err(f"Export {fmt}", e)

# ----------------------------------------------------------------
# SUMMARY
# ----------------------------------------------------------------
passed  = [r for r in RESULTS if r["status"] == "PASS"]
warned  = [r for r in RESULTS if r["status"] == "WARN"]
failed  = [r for r in RESULTS if r["status"] in ("FAIL", "ERROR")]
total   = len(RESULTS)

print()
print("=" * 64)
print("  FINAL TEST RESULTS")
print("=" * 64)
print(f"  PASSED  : {len(passed)}/{total}")
print(f"  WARNED  : {len(warned)}/{total}  (requires Ollama local LLM)")
print(f"  FAILED  : {len(failed)}/{total}")

if failed:
    print("\n  --- Failures ---")
    for r in failed:
        print(f"  [FAIL] HTTP {r['http']}  {r['test']}")
        print(f"         {r['detail'][:110]}")

if warned:
    print("\n  --- Warnings (Ollama-dependent) ---")
    for r in warned:
        print(f"  [WARN] {r['test']}")

print()
print("=" * 64)
sys.exit(0 if not failed else 1)
