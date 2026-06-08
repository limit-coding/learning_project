from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, ResetPasswordRequest, SendCodeRequest, TokenResponse, UserOut
from app.core.security import create_access_token, hash_password, verify_password
from app.core.deps import get_current_user
from app.core import verification
from app.services.email_service import send_reset_email, send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])

# 60 秒内不能重复发送
_RESEND_COOLDOWN = 60


@router.post("/send-code", status_code=200)
def send_code(req: SendCodeRequest, db: Session = Depends(get_db)):
    """发送邮箱验证码"""
    remaining = verification.has_pending(req.email)
    if remaining and remaining > (verification.CODE_TTL - _RESEND_COOLDOWN):
        raise HTTPException(
            status_code=429,
            detail=f"发送太频繁，请 {int(remaining - (verification.CODE_TTL - _RESEND_COOLDOWN))} 秒后再试",
        )
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    code = verification.gen_code()
    verification.save_code(req.email, code)

    try:
        send_verification_email(req.email, code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"邮件发送失败：{e}")

    return {"message": "验证码已发送，请查收邮件"}


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="用户名已被注册")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    if not verification.verify_code(req.email, req.code):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        display_name=req.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter((User.username == req.username) | (User.email == req.username))
        .first()
    )
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/send-reset-code", status_code=200)
def send_reset_code(req: SendCodeRequest, db: Session = Depends(get_db)):
    """发送重置密码验证码"""
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # 不暴露邮箱是否存在，统一返回成功
        return {"message": "如果该邮箱已注册，验证码将发送至邮箱"}

    remaining = verification.has_pending(req.email, scope="reset")
    if remaining and remaining > (verification.CODE_TTL - _RESEND_COOLDOWN):
        raise HTTPException(
            status_code=429,
            detail=f"发送太频繁，请 {int(remaining - (verification.CODE_TTL - _RESEND_COOLDOWN))} 秒后再试",
        )

    code = verification.gen_code()
    verification.save_code(req.email, code, scope="reset")
    try:
        send_reset_email(req.email, code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"邮件发送失败：{e}")

    return {"message": "验证码已发送，请查收邮件"}


@router.post("/reset-password", status_code=200)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """验证码校验通过后重置密码"""
    if not verification.verify_code(req.email, req.code, scope="reset"):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")

    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="账号不存在")

    from app.core.security import hash_password
    user.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"message": "密码重置成功，请重新登录"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
