from pydantic import BaseModel, EmailStr, field_validator
import re


class SendCodeRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("密码至少 6 位")
        return v


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    code: str
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if not 2 <= len(v) <= 30:
            raise ValueError("用户名长度 2-30 位")
        if not re.match(r"^[a-zA-Z0-9_一-鿿]+$", v):
            raise ValueError("用户名只能包含字母、数字、下划线或中文")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("密码至少 6 位")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    display_name: str | None
    avatar_url: str | None
    role: str

    model_config = {"from_attributes": True}


TokenResponse.model_rebuild()
