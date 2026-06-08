"""文件上传接口测试"""
import io


def test_upload_requires_auth(client):
    res = client.post("/api/upload", files={"file": ("test.pdf", b"data", "application/pdf")})
    assert res.status_code == 401


def test_upload_pdf(client, auth_headers):
    fake_pdf = b"%PDF-1.4 fake pdf content"
    res = client.post("/api/upload",
                      headers=auth_headers,
                      files={"file": ("test.pdf", io.BytesIO(fake_pdf), "application/pdf")})
    assert res.status_code == 200
    data = res.json()
    assert data["url"].startswith("/uploads/")
    assert data["url"].endswith(".pdf")
    assert data["filename"] == "test.pdf"
    assert data["size"] == len(fake_pdf)


def test_upload_image(client, auth_headers):
    # 最小合法 PNG（1x1 像素）
    png_bytes = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
        b'\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00'
        b'\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18'
        b'\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    res = client.post("/api/upload",
                      headers=auth_headers,
                      files={"file": ("photo.png", io.BytesIO(png_bytes), "image/png")})
    assert res.status_code == 200
    assert res.json()["url"].endswith(".png")


def test_upload_unsupported_type(client, auth_headers):
    res = client.post("/api/upload",
                      headers=auth_headers,
                      files={"file": ("script.py", b"print('hi')", "text/x-python")})
    assert res.status_code == 400
    assert "不支持" in res.json()["detail"]
