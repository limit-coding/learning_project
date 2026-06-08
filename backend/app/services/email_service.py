import smtplib
import ssl
import certifi
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from dataclasses import dataclass
from app.config import get_settings

settings = get_settings()


@dataclass
class SmtpPreset:
    host: str
    port: int
    use_ssl: bool   # True=SMTP_SSL, False=STARTTLS


# 按邮箱域名自动匹配，找不到就用 .env 里的手动配置
SMTP_PRESETS: dict[str, SmtpPreset] = {
    # QQ 邮箱
    "qq.com":       SmtpPreset("smtp.qq.com",          465, True),
    # 网易系
    "163.com":      SmtpPreset("smtp.163.com",         465, True),
    "126.com":      SmtpPreset("smtp.126.com",         465, True),
    "yeah.net":     SmtpPreset("smtp.yeah.net",        465, True),
    # Gmail
    "gmail.com":    SmtpPreset("smtp.gmail.com",       465, True),
    # Outlook / Hotmail / Live
    "outlook.com":  SmtpPreset("smtp.office365.com",   587, False),
    "hotmail.com":  SmtpPreset("smtp.office365.com",   587, False),
    "live.com":     SmtpPreset("smtp.office365.com",   587, False),
    # 新浪
    "sina.com":     SmtpPreset("smtp.sina.com",        465, True),
    "sina.cn":      SmtpPreset("smtp.sina.com",        465, True),
    # 搜狐
    "sohu.com":     SmtpPreset("smtp.sohu.com",        465, True),
    # 北邮
    "bupt.edu.cn":  SmtpPreset("mail.bupt.edu.cn",     25,  False),
    "emails.bupt.edu.cn": SmtpPreset("mail.bupt.edu.cn", 25, False),
    # 阿里云企业邮
    "aliyun.com":   SmtpPreset("smtp.aliyun.com",      465, True),
    # iCloud
    "icloud.com":   SmtpPreset("smtp.mail.me.com",     587, False),
    "me.com":       SmtpPreset("smtp.mail.me.com",     587, False),
}

PROVIDER_TIPS: dict[str, str] = {
    "qq.com":       "QQ邮箱需开启SMTP并使用「授权码」而非登录密码",
    "163.com":      "163邮箱需开启SMTP/IMAP并生成「授权密码」",
    "126.com":      "126邮箱需开启SMTP/IMAP并生成「授权密码」",
    "gmail.com":    "Gmail需开启两步验证并使用「应用专用密码」",
    "outlook.com":  "Outlook直接用账号密码，若开启了两步验证需用「应用密码」",
    "bupt.edu.cn":  "北邮邮箱使用网页登录密码，端口25可能需要校园网",
}


def _get_preset(email: str) -> SmtpPreset | None:
    domain = email.split("@")[-1].lower().strip()
    return SMTP_PRESETS.get(domain)


def _ssl_ctx() -> ssl.SSLContext:
    """使用 certifi 证书，兼容 macOS / Linux"""
    ctx = ssl.create_default_context(cafile=certifi.where())
    return ctx


def _build_client(preset: SmtpPreset, host: str, port: int):
    """返回已连接的 SMTP 对象"""
    if preset.use_ssl:
        return smtplib.SMTP_SSL(host, port, context=_ssl_ctx(), timeout=15)
    else:
        server = smtplib.SMTP(host, port, timeout=15)
        server.ehlo()
        try:
            server.starttls(context=_ssl_ctx())
        except Exception:
            pass  # 25 端口可能不支持 STARTTLS（如北邮内网），直接明文
        return server


def send_verification_email(to_email: str, code: str) -> None:
    user = settings.smtp_user
    password = settings.smtp_password

    if not user or not password:
        raise RuntimeError(
            "邮件服务未配置。请在 .env 中填写 SMTP_USER（发件邮箱）和 SMTP_PASSWORD（授权码/密码）"
        )

    preset = _get_preset(user)
    if preset:
        host, port, use_ssl = preset.host, preset.port, preset.use_ssl
    else:
        # 用 .env 手动配置
        host, port, use_ssl = settings.smtp_host, settings.smtp_port, settings.smtp_port == 465

    subject = f"【知南】验证码：{code}"
    html = f"""
    <div style="font-family:PingFang SC,Helvetica,sans-serif;max-width:480px;margin:0 auto;
                padding:32px 28px;background:#0d1726;border-radius:16px;
                border:1px solid rgba(56,189,248,0.18)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
        <div style="width:40px;height:40px;border-radius:12px;
                    background:linear-gradient(135deg,#0891b2,#4f46e5);
                    display:flex;align-items:center;justify-content:center;font-size:20px">🤖</div>
        <div>
          <div style="color:#38bdf8;font-weight:700;font-size:16px">知南课程助手</div>
          <div style="color:#64748b;font-size:12px">北邮课程路线系统</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid rgba(71,85,105,0.3);margin:20px 0">
      <p style="color:#e2e8f0;margin:0 0 20px;font-size:15px">你正在注册知南账号，验证码是：</p>
      <div style="font-size:38px;font-weight:800;letter-spacing:12px;color:#f8fafc;
                  background:linear-gradient(135deg,#0f172a,#1e293b);
                  border:1px solid rgba(56,189,248,0.3);
                  border-radius:14px;padding:18px 28px;text-align:center;
                  margin-bottom:24px;font-family:monospace">
        {code}
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 8px">⏱ 验证码 <strong style="color:#f8fafc">5 分钟</strong>内有效</p>
      <p style="color:#64748b;font-size:12px;margin:0">如非本人操作，请忽略此邮件。</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = formataddr((str(Header(settings.smtp_from_name, "utf-8")), user))
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    server = _build_client(SmtpPreset(host, port, use_ssl), host, port)
    try:
        server.login(user, password)
        server.sendmail(user, to_email, msg.as_string())
    finally:
        server.quit()


def send_reset_email(to_email: str, code: str) -> None:
    user = settings.smtp_user
    password = settings.smtp_password
    if not user or not password:
        raise RuntimeError("邮件服务未配置")

    preset = _get_preset(user)
    if preset:
        host, port, use_ssl = preset.host, preset.port, preset.use_ssl
    else:
        host, port, use_ssl = settings.smtp_host, settings.smtp_port, settings.smtp_port == 465

    subject = f"【知南】重置密码验证码：{code}"
    html = f"""
    <div style="font-family:PingFang SC,Helvetica,sans-serif;max-width:480px;margin:0 auto;
                padding:32px 28px;background:#0d1726;border-radius:16px;
                border:1px solid rgba(248,113,113,0.2)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
        <div style="width:40px;height:40px;border-radius:12px;
                    background:linear-gradient(135deg,#dc2626,#9333ea);
                    display:flex;align-items:center;justify-content:center;font-size:20px">🔑</div>
        <div>
          <div style="color:#f87171;font-weight:700;font-size:16px">知南 · 重置密码</div>
          <div style="color:#64748b;font-size:12px">北邮课程路线系统</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid rgba(71,85,105,0.3);margin:20px 0">
      <p style="color:#e2e8f0;margin:0 0 20px;font-size:15px">你正在重置知南账号密码，验证码是：</p>
      <div style="font-size:38px;font-weight:800;letter-spacing:12px;color:#f8fafc;
                  background:linear-gradient(135deg,#0f172a,#1e293b);
                  border:1px solid rgba(248,113,113,0.3);
                  border-radius:14px;padding:18px 28px;text-align:center;
                  margin-bottom:24px;font-family:monospace">
        {code}
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 8px">⏱ 验证码 <strong style="color:#f8fafc">5 分钟</strong>内有效</p>
      <p style="color:#64748b;font-size:12px;margin:0">如非本人操作，请忽略此邮件，你的密码不会被更改。</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = formataddr((str(Header(settings.smtp_from_name, "utf-8")), user))
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    server = _build_client(SmtpPreset(host, port, use_ssl), host, port)
    try:
        server.login(user, password)
        server.sendmail(user, to_email, msg.as_string())
    finally:
        server.quit()


def get_provider_tip(email: str) -> str | None:
    domain = email.split("@")[-1].lower().strip()
    return PROVIDER_TIPS.get(domain)
