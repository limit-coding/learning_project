import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Form, Input, message, Typography } from 'antd';
import {
  LockOutlined,
  MailOutlined,
  RobotOutlined,
  SafetyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authApi } from '../services/authApi';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const COOLDOWN = 60;

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = () => {
    setCountdown(COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) { clearInterval(timerRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) { message.warning('请先填写邮箱'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { message.warning('邮箱格式不正确'); return; }

    setSending(true);
    try {
      await axios.post('/api/auth/send-code', { email });
      message.success('验证码已发送，请查收邮件');
      startCountdown();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (values: {
    username: string;
    email: string;
    code: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res = await authApi.register(values);
      login(res.access_token, res.user);
      message.success('注册成功，欢迎加入知南！');
      navigate('/');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <Card style={cardStyle} styles={{ body: { padding: '40px 36px' } }}>
        {/* Logo */}
        <div style={logoStyle}>
          <div style={logoIconStyle}>
            <RobotOutlined style={{ fontSize: 26, color: '#f8fafc' }} />
          </div>
          <Title level={3} style={{ color: '#f8fafc', margin: 0 }}>
            注册知南
          </Title>
        </div>
        <Text style={{ color: '#64748b', display: 'block', textAlign: 'center', marginBottom: 32 }}>
          北邮课程路线系统 · 免费注册
        </Text>

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          {/* 用户名 */}
          <Form.Item
            label={<span style={labelStyle}>用户名</span>}
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, max: 30, message: '用户名 2-30 位' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#475569' }} />}
              placeholder="2-30 位，支持字母/数字/中文"
              style={inputStyle}
            />
          </Form.Item>

          {/* 邮箱 */}
          <Form.Item
            label={<span style={labelStyle}>邮箱</span>}
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#475569' }} />}
              placeholder="用于接收验证码和找回密码"
              style={inputStyle}
              suffix={
                <Button
                  type="link"
                  size="small"
                  loading={sending}
                  disabled={countdown > 0}
                  onClick={handleSendCode}
                  style={{ color: countdown > 0 ? '#475569' : '#38bdf8', padding: 0, fontSize: 13 }}
                >
                  {countdown > 0 ? `${countdown}s 后重试` : '发送验证码'}
                </Button>
              }
            />
          </Form.Item>

          {/* 验证码 */}
          <Form.Item
            label={<span style={labelStyle}>邮箱验证码</span>}
            name="code"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Input
              prefix={<SafetyOutlined style={{ color: '#475569' }} />}
              placeholder="请输入邮件中的 6 位验证码"
              maxLength={6}
              style={inputStyle}
            />
          </Form.Item>

          {/* 密码 */}
          <Form.Item
            label={<span style={labelStyle}>密码</span>}
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#475569' }} />}
              placeholder="至少 6 位"
              style={inputStyle}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={submitButtonStyle}
          >
            注册
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text style={{ color: '#64748b' }}>已有账号？</Text>{' '}
          <Link to="/login" style={{ color: '#38bdf8' }}>
            去登录
          </Link>
        </div>
      </Card>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(180deg, #07111f 0%, #0d1726 100%)',
  padding: 20,
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 440,
  borderRadius: 20,
  border: '1px solid rgba(125, 211, 252, 0.16)',
  background: 'rgba(14, 24, 40, 0.98)',
  boxShadow: '0 24px 48px rgba(2, 6, 23, 0.4)',
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  marginBottom: 8,
};

const logoIconStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0891b2, #4f46e5)',
};

const labelStyle: React.CSSProperties = {
  color: '#cbd5e1',
  fontSize: 14,
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  borderRadius: 12,
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(71, 85, 105, 0.4)',
  color: '#f8fafc',
};

const submitButtonStyle: React.CSSProperties = {
  borderRadius: 12,
  height: 46,
  background: 'linear-gradient(90deg, #0891b2, #4f46e5)',
  border: 'none',
  fontWeight: 600,
  fontSize: 15,
  marginTop: 4,
};

export default RegisterPage;
