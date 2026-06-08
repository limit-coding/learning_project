import React, { useState } from 'react';
import { Button, Card, Form, Input, message, Typography } from 'antd';
import { LockOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      login(res.access_token, res.user);
      message.success(`欢迎回来，${res.user.display_name || res.user.username}！`);
      navigate('/');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <Card style={cardStyle} bodyStyle={{ padding: '40px 36px' }}>
        <div style={logoStyle}>
          <div style={logoIconStyle}>
            <RobotOutlined style={{ fontSize: 26, color: '#f8fafc' }} />
          </div>
          <Title level={3} style={{ color: '#f8fafc', margin: 0 }}>
            登录知南
          </Title>
        </div>
        <Text style={{ color: '#64748b', display: 'block', textAlign: 'center', marginBottom: 28 }}>
          北邮课程路线系统
        </Text>

        <Form layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名或邮箱' }]}>
            <Input prefix={<UserOutlined style={{ color: '#475569' }} />} placeholder="用户名或邮箱" style={inputStyle} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#475569' }} />} placeholder="密码" style={inputStyle} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} style={submitButtonStyle}>
            登录
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text style={{ color: '#64748b' }}>还没有账号？</Text>{' '}
          <Link to="/register" style={{ color: '#38bdf8' }}>
            立即注册
          </Link>
          <span style={{ color: '#334155', margin: '0 10px' }}>·</span>
          <Link to="/forgot-password" style={{ color: '#64748b', fontSize: 13 }}>
            忘记密码
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
  maxWidth: 420,
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
};

export default LoginPage;
