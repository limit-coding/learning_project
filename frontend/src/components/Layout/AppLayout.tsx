import React from 'react';
import { Avatar, Button, Dropdown, Layout, Menu, Typography } from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  ApartmentOutlined,
  RobotOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Content } = Layout;
const { Text, Title } = Typography;

const navItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/courses', icon: <BookOutlined />, label: '课程库' },
  { key: '/mindmap', icon: <ApartmentOutlined />, label: '知识图谱' },
  { key: '/community', icon: <TeamOutlined />, label: '社区' },
  { key: '/ai', icon: <RobotOutlined />, label: 'AI 助手' },
];

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const activeKey = navItems
    .slice()
    .reverse()
    .find((item) => location.pathname === item.key || location.pathname.startsWith(item.key + '/'))
    ?.key ?? '/';

  return (
    <Layout style={layoutStyle}>
      <Header style={headerStyle}>
        <div style={brandStyle} onClick={() => navigate('/')}>
          <div style={brandIconStyle}>
            <RobotOutlined />
          </div>
          <div>
            <Text style={eyebrowStyle}>BUPT COURSE GUIDE</Text>
            <Title level={4} style={{ margin: 0, color: '#f8fafc' }}>
              北邮课程路线系统
            </Title>
          </div>
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={[activeKey]}
          style={menuStyle}
          onClick={({ key }) => navigate(key)}
          items={navItems}
          theme="dark"
        />

        <div style={{ flexShrink: 0, marginLeft: 16 }}>
          {user ? (
            <Dropdown
              menu={{
                items: [
                  { key: 'name', label: <span style={{ color: '#94a3b8' }}>{user.display_name || user.username}</span>, disabled: true },
                  { type: 'divider' },
                  ...(user.role === 'admin' ? [{ key: 'review', label: '资源审核', onClick: () => navigate('/admin/review') }] : []),
                  { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true, onClick: () => { logout(); navigate('/'); } },
                ],
              }}
              placement="bottomRight"
            >
              <Avatar
                style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #0891b2, #4f46e5)' }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          ) : (
            <Button
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
              style={loginButtonStyle}
            >
              登录
            </Button>
          )}
        </div>
      </Header>

      <Content style={contentStyle}>
        <Outlet />
      </Content>
    </Layout>
  );
};

const layoutStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #07111f 0%, #0d1726 45%, #101826 100%)',
};

const headerStyle: React.CSSProperties = {
  height: 72,
  padding: '0 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(7, 17, 31, 0.92)',
  borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
  position: 'sticky',
  top: 0,
  zIndex: 20,
  backdropFilter: 'blur(18px)',
};

const brandStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  cursor: 'pointer',
  flexShrink: 0,
};

const brandIconStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#f8fafc',
  fontSize: 18,
  background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
};

const eyebrowStyle: React.CSSProperties = {
  color: '#8fb3ff',
  fontSize: 11,
  letterSpacing: 1.2,
  display: 'block',
};

const contentStyle: React.CSSProperties = {
  padding: '28px 32px',
  maxWidth: 1280,
  margin: '0 auto',
  width: '100%',
};

const loginButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  height: 36,
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.68)',
};

const menuStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  flex: 1,
  justifyContent: 'flex-end',
  minWidth: 0,
};

export default AppLayout;
