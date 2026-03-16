import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Space, Button, Row, Col, Card } from 'antd';
import { RocketOutlined, ThunderboltOutlined, BulbOutlined, StarOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons';
import ProfileForm from './components/Profile/ProfileForm';
import RecommendationList from './components/Recommendations/RecommendationList';
import { getRecommendations } from './services/api';
import type { Recommendation } from './types';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

const App: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: <ThunderboltOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
      title: 'AI智能分析',
      description: '基于DeepSeek大模型，深度理解您的学习需求'
    },
    {
      icon: <BulbOutlined style={{ fontSize: 40, color: '#52c41a' }} />,
      title: '精准推荐',
      description: '多维度评分系统，为您匹配最适合的课程'
    },
    {
      icon: <StarOutlined style={{ fontSize: 40, color: '#faad14' }} />,
      title: '权威课程',
      description: '精选Stanford、MIT等顶级机构的深度学习课程'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header 
        style={{ 
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          padding: '0 60px',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.1)' : 'none',
          position: 'fixed',
          width: '100%',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          backdropFilter: scrolled ? 'blur(10px)' : 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <RocketOutlined style={{ fontSize: 28, color: '#1890ff', marginRight: 12 }} />
            <Title level={4} style={{ margin: 0, color: scrolled ? '#333' : '#fff', fontWeight: 600 }}>
              AI学习指导系统
            </Title>
          </div>
          {!showForm && (
            <Button 
              onClick={handleReset}
              icon={<ReloadOutlined />}
              style={{ 
                borderRadius: 20,
                background: '#1890ff',
                color: '#fff',
                border: 'none',
                fontWeight: 500
              }}
            >
              重新开始
            </Button>
          )}
        </div>
      </Header>

      {showForm && (
        <div 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            paddingTop: 64
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)'
          }} />
          <div style={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '5%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)'
          }} />
          
          <div style={{ textAlign: 'center', color: '#fff', maxWidth: 800, padding: '0 20px', position: 'relative', zIndex: 1 }}>
            <Title level={1} style={{ color: '#fff', marginBottom: 24, fontSize: '3rem', fontWeight: 700 }}>
              开启您的AI学习之旅
            </Title>
            <Paragraph style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', marginBottom: 40, lineHeight: 1.8 }}>
              基于深度学习的个性化课程推荐系统<br />
              为您量身定制专属学习路径
            </Paragraph>
            <Button 
              type="primary" 
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => {
                document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ 
                background: '#fff',
                color: '#667eea',
                border: 'none',
                height: 50,
                padding: '0 40px',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 25,
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}
            >
              立即开始
            </Button>
          </div>
        </div>
      )}

      <Content style={{ paddingTop: showForm ? 0 : 100 }}>
        {showForm ? (
          <>
            <div style={{ padding: '80px 60px', background: '#fff' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 50, color: '#333' }}>
                  为什么选择我们
                </Title>
                <Row gutter={[40, 40]}>
                  {features.map((feature, index) => (
                    <Col xs={24} md={8} key={index}>
                      <Card 
                        style={{ 
                          textAlign: 'center',
                          border: 'none',
                          borderRadius: 16,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          padding: '20px 10px',
                          transition: 'all 0.3s ease',
                          cursor: 'default'
                        }}
                        bodyStyle={{ padding: 24 }}
                      >
                        <div style={{ marginBottom: 20 }}>{feature.icon}</div>
                        <Title level={4} style={{ marginBottom: 12, color: '#333' }}>{feature.title}</Title>
                        <Text type="secondary" style={{ fontSize: 15 }}>{feature.description}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>

            <div id="form-section" style={{ padding: '80px 60px', background: '#f5f7fa' }}>
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <Title level={2} style={{ color: '#333', marginBottom: 12 }}>创建您的学习画像</Title>
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    填写以下信息，AI将为您推荐最适合的深度学习课程
                  </Text>
                </div>
                <ProfileForm onSuccess={handleProfileSuccess} />
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '40px 60px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 50 }}>
              <Title level={2} style={{ color: '#333', marginBottom: 12 }}>为您精选的课程推荐</Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                根据您的学习画像，我们为您推荐了 {recommendations.length} 门最适合的课程
              </Text>
            </div>
            <RecommendationList recommendations={recommendations} loading={loading} />
          </div>
        )}
      </Content>

      <Footer style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '40px 60px'
      }}>
        <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
          © 2024 AI学习指导系统 - 基于DeepSeek的个性化课程推荐
        </Text>
      </Footer>
    </Layout>
  );
};

export default App;
