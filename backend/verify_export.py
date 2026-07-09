import requests

BASE = "http://localhost:8000/api/v1"

r = requests.post(BASE+"/auth/login",
                  data={"username": "apitest2@techtrade.com", "password": "Test1234!"},
                  timeout=10)
token = r.json()["access_token"]
H = {"Authorization": "Bearer " + token}

r = requests.post(BASE+"/backtest/export", headers=H, json={
    "symbol": "AAPL",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "initial_capital": 10000.0,
    "buy_rules": [{"indicator": "RSI", "condition": "below", "value": "30"}],
    "sell_rules": [{"indicator": "RSI", "condition": "above", "value": "70"}]
}, timeout=60)

print("Status:", r.status_code)
ct = r.headers.get("content-type", "?")
cd = r.headers.get("content-disposition", "?")
print("Content-Type:", ct)
print("Content-Disposition:", cd)
if r.status_code == 200:
    print("CSV Preview:")
    print(r.text[:400])
    print("\n[PASS] Backtest export working correctly!")
else:
    print("Error:", r.text[:300])
    print("\n[FAIL] Backtest export still broken")
