import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_materials_pagination(client):
    """Test materials listing with pagination parameters."""
    res = client.get("/api/v1/materials?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 9600
    assert len(data["items"]) == 10
    assert data["page"] == 1
    assert data["pageSize"] == 10
    assert data["totalPages"] >= 960


def test_materials_search(client):
    """Test searching materials across legacy codes and descriptions."""
    res = client.get("/api/v1/materials?query=VALVE&page=1&page_size=5")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    for item in data["items"]:
        text_corpus = f"{item['legacyCode']} {item['rawDescription']} {item['category']}".upper()
        assert "VALVE" in text_corpus or "VALVES" in text_corpus


def test_materials_cpse_filter(client):
    """Test filtering materials by participating CPSE enterprise."""
    res = client.get("/api/v1/materials?cpse=IOCL&page=1&page_size=15")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2412
    assert len(data["items"]) == 15
    for item in data["items"]:
        assert item["cpse"] == "IOCL"


def test_material_detail_and_404(client):
    """Test material detail retrieval and 404 handling."""
    # First get a valid material id
    list_res = client.get("/api/v1/materials?page=1&page_size=1")
    mat_id = list_res.json()["items"][0]["id"]

    res = client.get(f"/api/v1/materials/{mat_id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == mat_id
    assert "legacyCode" in detail
    assert "specifications" in detail
    assert "attributes" in detail

    # Test non-existent ID
    res_404 = client.get("/api/v1/materials/non-existent-uuid-999")
    assert res_404.status_code == 404


def test_national_materials_listing_and_detail(client):
    """Test National Materials Master listing, pagination, and detail inspection."""
    res = client.get("/api/v1/national-materials?page=1&page_size=5")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1340
    assert len(data["items"]) == 5

    first_nm = data["items"][0]
    assert first_nm["nationalCode"].startswith("NMC-") or "NO-MATCH" in first_nm["nationalCode"]
    assert first_nm["participatingCpsesCount"] >= 1

    # Detail by code
    det_res = client.get(f"/api/v1/national-materials/{first_nm['nationalCode']}")
    assert det_res.status_code == 200
    det = det_res.json()
    assert det["nationalCode"] == first_nm["nationalCode"]
    assert "mappedMaterials" in det
    assert isinstance(det["mappedMaterials"], list)


def test_cpses_endpoints(client):
    """Test CPSE enterprise listing and single CPSE retrieval."""
    res = client.get("/api/v1/cpses")
    assert res.status_code == 200
    cpses = res.json()
    assert len(cpses) == 4
    codes = {c["code"] for c in cpses}
    assert codes == {"IOCL", "NTPC", "SAIL", "BHEL"}

    # Single CPSE by acronym
    single_res = client.get("/api/v1/cpses/NTPC")
    assert single_res.status_code == 200
    single = single_res.json()
    assert single["code"] == "NTPC"
    assert single["materialsImported"] == 2396
    assert single["materialsStandardized"] == 2396

    # CPSE materials endpoint
    mat_res = client.get("/api/v1/cpses/NTPC/materials?page=1&page_size=10")
    assert mat_res.status_code == 200
    assert mat_res.json()["total"] == 2396


def test_mappings_endpoints(client):
    """Test material mappings listing and code lookups."""
    res = client.get("/api/v1/mappings?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 9600
    assert len(data["items"]) == 10

    first_map = data["items"][0]
    assert first_map["nationalMaterialCode"] != ""
    assert first_map["legacyMaterialCode"] != ""


def test_matches_endpoints(client):
    """Test match candidate retrieval and single match inspection."""
    res = client.get("/api/v1/matches?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 10
    assert len(data["items"]) >= 10

    first_match = data["items"][0]
    assert "breakdown" in first_match
    assert "rationale" in first_match
    assert "materialA" in first_match
    assert "materialB" in first_match

    # Detail
    detail_res = client.get(f"/api/v1/matches/{first_match['id']}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == first_match["id"]


def test_approval_workflow_and_audit_trail(client):
    """
    Test end-to-end Human-in-the-Loop decision processing:
    1. Fetch pending approvals
    2. Process approval decision (APPROVE)
    3. Verify database state updated
    4. Verify audit trail event recorded with officer signature
    """
    # 1. Fetch pending approvals
    list_res = client.get("/api/v1/approvals")
    assert list_res.status_code == 200
    approvals = list_res.json()
    assert len(approvals) > 0

    target = approvals[0]
    appr_id = target["id"]

    # 2. Process approval action
    action_res = client.post(
        f"/api/v1/approvals/{appr_id}/action",
        json={
            "status": "APPROVED",
            "reviewer": "P. K. Mishra (Chief Materials Manager)",
            "reviewNotes": "Physical dimensions and pressure ratings verified against IS-1239 standard.",
        },
    )
    assert action_res.status_code == 200
    updated = action_res.json()
    assert updated["status"] == "APPROVED"
    assert updated["reviewer"] == "P. K. Mishra (Chief Materials Manager)"

    # 3. Verify audit trail recorded this action
    audit_res = client.get("/api/v1/audit?page=1&page_size=5")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["total"] > 0

    # The most recent audit entry should be the approval action
    latest_event = audit_data["items"][0]
    assert latest_event["action"] == "APPROVE_MAPPING"
    assert latest_event["user"] == "P. K. Mishra (Chief Materials Manager)"


def test_analytics_metrics_and_distribution(client):
    """Test dashboard analytics KPIs and distribution charts derived from PostgreSQL."""
    # Metrics KPI
    metrics_res = client.get("/api/v1/analytics/metrics")
    assert metrics_res.status_code == 200
    m = metrics_res.json()
    assert m["totalMaterials"] == 9600
    assert m["materialsAnalyzed"] == 9600
    assert m["duplicateCandidates"] == 8400
    assert m["nationalMaterials"] == 1340
    assert m["cpsesConnected"] == 4

    # Distribution
    dist_res = client.get("/api/v1/analytics/relationship-distribution")
    assert dist_res.status_code == 200
    dist = dist_res.json()
    assert len(dist) == 4
    total_in_dist = sum(d["value"] for d in dist)
    assert total_in_dist == 9600

    # Procurement Records
    proc_res = client.get("/api/v1/analytics/procurement-records")
    assert proc_res.status_code == 200
    assert len(proc_res.json()) > 0


def test_uploads_endpoint(client):
    """Test uploads batch history listing."""
    res = client.get("/api/v1/uploads")
    assert res.status_code == 200
    uploads = res.json()
    assert len(uploads) >= 4
    for u in uploads:
        assert "filename" in u
        assert "status" in u
