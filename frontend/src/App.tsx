import React, { useState } from 'react';
import { Layout, Typography, Space, Button } from 'antd';
import ProfileForm from './components/Profile/ProfileForm';
import RecommendationList from './components/Recommendations/RecommendationList';
import { getRecommendations } from './services/api';
import type { Recommendation } from './types';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const handleProfileSuccess = async (id: number) => {
    setShowForm(false);
    setLoading(true);

    try {
      const recs = await getRecommendations(id, 5);
      setRecommendations(recs);
    } catch (error) {
      console.error('获取推荐失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendations([]);
    setShowForm(true);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 50px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>
            🎓 AI学习指导系统
          </Title>
          {!showForm && (
            <Button onClick={handleReset}>重新填写</Button>
          )}
        </div>
      </Header>

      <Content style={{ padding: '50px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {showForm ? (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Title level={2}>欢迎使用AI学习指导系统</Title>
                <Text type="secondary">
                  填写您的学习画像，我们将为您推荐最适合的深度学习课程
                </Text>
              </div>
              <ProfileForm onSuccess={handleProfileSuccess} />
            </Space>
          ) : (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <Title level={2}>为您推荐以下课程</Title>
                <Text type="secondary">
                  根据您的学习画像，我们为您精选了{recommendations.length}门课程
                </Text>
              </div>
              <RecommendationList recommendations={recommendations} loading={loading} />
            </Space>
          )}
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        AI学习指导系统 ©2024 - 基于DeepSeek的个性化课程推荐
      </Footer>
    </Layout>
  );
};

export default App;
