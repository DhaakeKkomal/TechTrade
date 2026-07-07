from fastapi.testclient import TestClient

def test_user_signup_and_login(client: TestClient):
    # 1. Test Registration
    signup_data = {
        "email": "test@techtrade.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "preferences": {"default_market": "NSE"}
    }
    response = client.post("/api/v1/auth/register", json=signup_data)
    assert response.status_code == 200
    registered_data = response.json()
    assert registered_data["email"] == "test@techtrade.com"
    assert registered_data["full_name"] == "Test User"
    assert "id" in registered_data
    assert registered_data["preferences"]["default_market"] == "NSE"

    # 2. Test Duplicate Registration Prevention
    response_dup = client.post("/api/v1/auth/register", json=signup_data)
    assert response_dup.status_code == 400
    assert "already exists" in response_dup.json()["detail"]

    # 3. Test Login
    login_data = {
        "username": "test@techtrade.com",
        "password": "testpassword123"
    }
    response_login = client.post("/api/v1/auth/login", data=login_data)
    assert response_login.status_code == 200
    login_res = response_login.json()
    assert "access_token" in login_res
    assert login_res["token_type"] == "bearer"
    
    token = login_res["access_token"]

    # 4. Test Fetch Profile (Authenticated)
    headers = {"Authorization": f"Bearer {token}"}
    response_me = client.get("/api/v1/users/me", headers=headers)
    assert response_me.status_code == 200
    profile_data = response_me.json()
    assert profile_data["email"] == "test@techtrade.com"
    assert profile_data["full_name"] == "Test User"

    # 5. Test Unauthenticated Profile Access
    response_unauth = client.get("/api/v1/users/me")
    assert response_unauth.status_code == 401
