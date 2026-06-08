"""社区帖子与评论接口测试"""
import pytest


def test_list_posts_requires_auth(client):
    res = client.get("/api/community/posts")
    assert res.status_code == 401


def test_list_posts_empty(client, auth_headers):
    res = client.get("/api/community/posts", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_create_post(client, auth_headers):
    res = client.post("/api/community/posts", headers=auth_headers, json={
        "title": "测试帖子",
        "content": "这是一个测试帖子内容",
        "course_tag": "数学",
        "needs_ai": False,
    })
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "测试帖子"
    assert data["course_tag"] == "数学"
    assert data["ai_answered"] is False
    return data["id"]


def test_create_post_missing_title(client, auth_headers):
    res = client.post("/api/community/posts", headers=auth_headers, json={
        "content": "没有标题的帖子",
    })
    assert res.status_code == 422


def test_get_post_detail(client, auth_headers):
    # 先创建帖子
    create_res = client.post("/api/community/posts", headers=auth_headers, json={
        "title": "详情测试帖",
        "content": "详情测试内容",
        "needs_ai": False,
    })
    post_id = create_res.json()["id"]

    res = client.get(f"/api/community/posts/{post_id}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "详情测试帖"
    assert "comments" in data
    assert data["view_count"] >= 1


def test_get_post_view_count_increments(client, auth_headers):
    create_res = client.post("/api/community/posts", headers=auth_headers, json={
        "title": "浏览计数帖",
        "content": "内容",
        "needs_ai": False,
    })
    post_id = create_res.json()["id"]

    client.get(f"/api/community/posts/{post_id}", headers=auth_headers)
    client.get(f"/api/community/posts/{post_id}", headers=auth_headers)
    res = client.get(f"/api/community/posts/{post_id}", headers=auth_headers)
    assert res.json()["view_count"] >= 3


def test_add_comment(client, auth_headers):
    create_res = client.post("/api/community/posts", headers=auth_headers, json={
        "title": "评论测试帖",
        "content": "内容",
        "needs_ai": False,
    })
    post_id = create_res.json()["id"]

    res = client.post(f"/api/community/posts/{post_id}/comments",
                      headers=auth_headers,
                      json={"content": "这是一条测试回复"})
    assert res.status_code == 201
    assert res.json()["content"] == "这是一条测试回复"
    assert res.json()["is_ai"] is False


def test_delete_post_by_author(client, auth_headers):
    create_res = client.post("/api/community/posts", headers=auth_headers, json={
        "title": "待删帖子",
        "content": "内容",
        "needs_ai": False,
    })
    post_id = create_res.json()["id"]

    res = client.delete(f"/api/community/posts/{post_id}", headers=auth_headers)
    assert res.status_code in (200, 204)

    get_res = client.get(f"/api/community/posts/{post_id}", headers=auth_headers)
    assert get_res.status_code == 404


def test_delete_post_by_other_user(client, auth_headers):
    from app.core import verification
    # 创建第二个用户
    email2 = "other@example.com"
    code2 = verification.gen_code()
    verification.save_code(email2, code2)
    client.post("/api/auth/register", json={
        "username": "otheruser", "email": email2, "password": "Pass1234!", "code": code2,
    })
    login_res = client.post("/api/auth/login", json={"username": "otheruser", "password": "Pass1234!"})
    other_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # 用原账号发帖
    create_res = client.post("/api/community/posts", headers=auth_headers, json={
        "title": "不让删的帖子",
        "content": "内容",
        "needs_ai": False,
    })
    post_id = create_res.json()["id"]

    # 其他用户尝试删除
    res = client.delete(f"/api/community/posts/{post_id}", headers=other_headers)
    assert res.status_code == 403
