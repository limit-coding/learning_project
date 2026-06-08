"""用户认证接口测试"""
import pytest
from app.core import verification


def test_register_success(client):
    email = "newuser@example.com"
    code = verification.gen_code()
    verification.save_code(email, code)

    res = client.post("/api/auth/register", json={
        "username": "newuser",
        "email": email,
        "password": "Pass1234!",
        "code": code,
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["username"] == "newuser"


def test_register_duplicate_username(client):
    email1 = "dup1@example.com"
    email2 = "dup2@example.com"
    code1 = verification.gen_code()
    code2 = verification.gen_code()
    verification.save_code(email1, code1)
    verification.save_code(email2, code2)

    client.post("/api/auth/register", json={
        "username": "dupuser", "email": email1, "password": "Pass1234!", "code": code1,
    })
    res = client.post("/api/auth/register", json={
        "username": "dupuser", "email": email2, "password": "Pass1234!", "code": code2,
    })
    assert res.status_code == 400
    assert "用户名" in res.json()["detail"]


def test_register_wrong_code(client):
    res = client.post("/api/auth/register", json={
        "username": "wrongcode", "email": "wrong@example.com",
        "password": "Pass1234!", "code": "000000",
    })
    assert res.status_code == 400
    assert "验证码" in res.json()["detail"]


def test_login_success(client, registered_user):
    token, user = registered_user
    assert token
    assert user["username"] == "testuser"


def test_login_wrong_password(client):
    res = client.post("/api/auth/login", json={
        "username": "testuser", "password": "WrongPass!",
    })
    assert res.status_code == 401


def test_get_me(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["username"] == "testuser"


def test_get_me_no_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_get_me_invalid_token(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert res.status_code == 401
