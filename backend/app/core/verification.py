import random
import string
import time
from typing import Optional

# {key: (code, expire_ts)}  — 内存存储，重启失效，开发够用
# key 格式：  "reg:{email}"  注册用
#             "reset:{email}" 找回密码用
_store: dict[str, tuple[str, float]] = {}

CODE_TTL = 300  # 5分钟有效


def gen_code() -> str:
    return "".join(random.choices(string.digits, k=6))


def save_code(email: str, code: str, scope: str = "reg") -> None:
    _store[f"{scope}:{email}"] = (code, time.time() + CODE_TTL)


def verify_code(email: str, code: str, scope: str = "reg") -> bool:
    key = f"{scope}:{email}"
    entry = _store.get(key)
    if not entry:
        return False
    saved_code, expire_ts = entry
    if time.time() > expire_ts:
        _store.pop(key, None)
        return False
    if saved_code != code:
        return False
    _store.pop(key, None)
    return True


def has_pending(email: str, scope: str = "reg") -> Optional[float]:
    key = f"{scope}:{email}"
    entry = _store.get(key)
    if not entry:
        return None
    _, expire_ts = entry
    remaining = expire_ts - time.time()
    return remaining if remaining > 0 else None
