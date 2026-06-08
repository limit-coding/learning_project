import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.deps import get_current_user
from app.models.models import User

router = APIRouter(prefix="/upload")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "text/plain": ".txt",
    "application/zip": ".zip",
}
MAX_SIZE_MB = 50


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content_type = file.content_type or ""
    ext = ALLOWED_TYPES.get(content_type)
    if not ext:
        # 也接受 .pdf 后缀但 content_type 不标准的情况
        if file.filename and file.filename.lower().endswith(".pdf"):
            ext = ".pdf"
        else:
            raise HTTPException(status_code=400, detail=f"不支持的文件类型：{content_type}，支持 PDF / JPG / PNG / TXT / ZIP")

    data = await file.read()
    if len(data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"文件超过 {MAX_SIZE_MB}MB 限制")

    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_DIR, filename)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(data)

    return {
        "url": f"/uploads/{filename}",
        "filename": file.filename,
        "size": len(data),
    }
