import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Form, Input, message, Steps, Typography } from 'antd';
import {
  LockOutlined,
  MailOutlined,
  RobotOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const COOLDOWN = 60;

const ForgotPasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0); // 0=填邮箱  1=填验证码+新密码
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCountdown = () => {
    setCountdown(COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown((n) => { if (n <= 1) { clearInterval(timerRef.current!); return 0; } return n - 1; });
    }, 1000);
  };

  const handleSendCode = async () => {
    const val = form.getFieldValue('email');
    if (!val) { message.warning('请输入邮箱'); return; }
    setSending(true);
    try {
      await axios.post('/api/auth/send-reset-code', { email: val });
      setEmail(val);
      message.success('验证码已发送，请查收邮件');
      setStep(1);
      startCountdown();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    try {
      await axios.post('/api/auth/send-reset-code', { email });
      message.success('验证码已重新发送');
      startCountdown();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleReset = async (values: { code: string; new_password: string }) => {
    setSubmitting(true);
    try {
      await axios.post('/api/auth/reset-password', {
        email,
        code: values.code,
        new_password: values.new_password,
      });
      message.success('密码重置成功！请用新密码登录');
      navigate('/login');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '重置失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <Card style={cardStyle} styles={{ body: { padding: '40px 36px' } }}>
        <div style={logoStyle}>
          <div style={logoIconStyle}>
            <RobotOutlined style={{ fontSize: 26, color: '#f8fafc' }} />
          </div>
          <Title level={3} style={{ color: '#f8fafc', margin: 0 }}>
            找回密码
          </Title>
        </div>
        <Text style={{ color: '#64748b', display: 'block', textAlign: 'center', marginBottom: 28 }}>
          通过邮箱验证码重置密码
        </Text>

        <Steps
          current={step}
          size="small"
          style={{ marginBottom: 28 }}
          items={[{ title: <span style={{ color: '#94a3b8' }}>验证邮箱</span> }, { title: <span style={{ color: '#94a3b8' }}>设置新密码</span> }]}
        />

        {step === 0 && (
          <Form form={form} layout="vertical" size="large">
            <Form.Item
              label={<span style={labelStyle}>注册邮箱</span>}
              name="email"
              rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#475569' }} />}
                placeholder="输入你注册时使用的邮箱"
                style={inputStyle}
              />
            </Form.Item>
            <Button
              type="primary"
              block
              loading={sending}
              onClick={handleSendCode}
              style={submitButtonStyle}
            >
              发送验证码
            </Button>
          </Form>
        )}

        {step === 1 && (
          <Form layout="vertical" onFinish={handleReset} size="large">
            <div style={emailHintStyle}>
              <MailOutlined style={{ color: '#38bdf8', marginRight: 8 }} />
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>验证码已发送至 <span style={{ color: '#f8fafc' }}>{email}</span></Text>
            </div>

            <Form.Item
              label={<span style={labelStyle}>邮箱验证码</span>}
              name="code"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <Input
                prefix={<SafetyOutlined style={{ color: '#475569' }} />}
                placeholder="6 位验证码"
                maxLength={6}
                style={inputStyle}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    loading={sending}
                    disabled={countdown > 0}
                    onClick={handleResend}
                    style={{ color: countdown > 0 ? '#475569' : '#38bdf8', padding: 0, fontSize: 13 }}
                  >
                    {countdown > 0 ? `${countdown}s 后重发` : '重新发送'}
                  </Button>
                }
              />
            </Form.Item>

            <Form.Item
              label={<span style={labelStyle}>新密码</span>}
              name="new_password"
              rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少 6 位' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#475569' }} />}
                placeholder="至少 6 位"
                style={inputStyle}
              />
            </Form.Item>

            <Form.Item
              label={<span style={labelStyle}>确认新密码</span>}
              name="confirm"
              dependencies={['new_password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                    return Promise.reject(new Error('两次密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#475569' }} />}
                placeholder="再次输入新密码"
                style={inputStyle}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={submitting} style={submitButtonStyle}>
              重置密码
            </Button>
          </Form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ color: '#64748b', fontSize: 13 }}>
            ← 返回登录
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
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 8,
};
const logoIconStyle: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center',
  justifyContent: 'center', background: 'linear-gradient(135deg, #dc2626, #9333ea)',
};
const labelStyle: React.CSSProperties = { color: '#cbd5e1', fontSize: 14, fontWeight: 500 };
const inputStyle: React.CSSProperties = {
  borderRadius: 12, background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(71, 85, 105, 0.4)', color: '#f8fafc',
};
const submitButtonStyle: React.CSSProperties = {
  borderRadius: 12, height: 46, background: 'linear-gradient(90deg, #dc2626, #9333ea)',
  border: 'none', fontWeight: 600, fontSize: 15, marginTop: 4,
};
const emailHintStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10, marginBottom: 20,
  background: 'rgba(8, 47, 73, 0.4)', border: '1px solid rgba(56, 189, 248, 0.15)',
};

export default ForgotPasswordPage;
