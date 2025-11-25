import copy
from fastapi.testclient import TestClient
from src import app as app_module
from src.app import app


# snapshot baseline at import time
BASELINE = copy.deepcopy(app_module.activities)


import pytest


@pytest.fixture(autouse=True)
def reset_activities():
    # Reset the in-memory activities before each test
    app_module.activities = copy.deepcopy(BASELINE)
    yield
    app_module.activities = copy.deepcopy(BASELINE)


def test_get_activities():
    client = TestClient(app)
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister():
    client = TestClient(app)
    activity = "Chess Club"
    email = "testuser@example.com"

    # Precondition: not signed up
    assert email not in app_module.activities[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in app_module.activities[activity]["participants"]

    # Duplicate signup should fail
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400

    # Unregister
    resp3 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp3.status_code == 200
    assert email not in app_module.activities[activity]["participants"]

    # Unregistering again should return 400
    resp4 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp4.status_code == 400
