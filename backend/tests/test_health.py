def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["problem_statement"] == "SIH PS 26099"
    assert data["ai_engine_mode"] == "mock"


def test_health_check_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["api"] == "online"
    assert data["database"]["status"] == "connected"
    assert data["database"]["engine"] == "PostgreSQL"
    assert data["ai_engine"]["mode"] == "mock"
    assert data["ai_engine"]["real_ml_active"] is False


def test_api_v1_routers_mounted(client):
    routes_to_test = [
        "/api/v1/auth/status",
        "/api/v1/cpses/",
        "/api/v1/materials/",
        "/api/v1/matches/",
        "/api/v1/national-materials/",
        "/api/v1/mappings/",
        "/api/v1/approvals/",
        "/api/v1/audit/",
        "/api/v1/analytics/summary",
        "/api/v1/uploads/status",
    ]
    for route in routes_to_test:
        res = client.get(route)
        assert res.status_code == 200, f"Route {route} failed with {res.status_code}"
        data = res.json()
        assert isinstance(data, (list, dict))
