import React, { useState } from 'react';
import { Card, Tag, Progress, Typography, Space, Button, Row, Col, Divider, Empty } from 'antd';
import { 
  BookOutlined, 
  ClockCircleOutlined, 
  TrophyOutlined, 
  LinkOutlined,
  StarFilled,
  CheckCircleOutlined,
  CodeOutlined,
  TagsOutlined,
  CalendarOutlined,
  HeartFilled,
  HeartOutlined,
  FolderOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import type { Recommendation } from '../../types';

const { Title, Text, Paragraph } = Typography;

interface RecommendationListProps {
  recommendations: Recommendation[];
  loading?: boolean;
}

const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations, loading }) => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const getDifficultyConfig = (level: string) => {
    const configs: Record<string, { color: string; text: string; bgColor: string }> = {
      beginner: { color: '#52c41a', text: '初级', bgColor: '#f6ffed' },
      intermediate: { color: '#fa8c16', text: '中级', bgColor: '#fff7e6' },
      advanced: { color: '#f5222d', text: '高级', bgColor: '#fff1f0' },
    };
    return configs[level] || { color: '#1890ff', text: level, bgColor: '#e6f7ff' };
  };

  const toggleFavorite = (courseId: number) => {
    setFavorites(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const getFavoriteCourses = () => {
    return recommendations.filter(rec => favorites.includes(rec.course.id));
  };

  const renderCourseCard = (rec: Recommendation, index: number, isFavoriteView: boolean = false) => {
    const diffConfig = getDifficultyConfig(rec.course.difficulty_level);
    const matchScore = Math.round(rec.match_score || 0);
    const isFavorited = favorites.includes(rec.course.id);
    
    return (
      <Card
        key={rec.course.id}
        style={{ 
          borderRadius: 16,
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ position: 'relative' }}>
          {index === 0 && !isFavoriteView && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '0 16px 0 16px',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              zIndex: 1
            }}>
              <StarFilled /> 最佳推荐
            </div>
          )}
          
          <div style={{ padding: 32 }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={18}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 16,
                        boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
                      }}>
                        {isFavoriteView ? index + 1 : index + 1}
                      </div>
                      <Title level={4} style={{ margin: 0, color: '#333' }}>
                        {rec.course.title}
                      </Title>
                    </div>
                    
                    <Space size={[8, 8]} wrap>
                      <Tag 
                        style={{ 
                          borderRadius: 20, 
                          padding: '4px 12px',
                          background: diffConfig.bgColor,
                          color: diffConfig.color,
                          border: 'none',
                          fontWeight: 500
                        }}
                      >
                        {diffConfig.text}
                      </Tag>
                      <Tag 
                        icon={<BookOutlined />}
                        style={{ borderRadius: 20, padding: '4px 12px', background: '#f0f5ff', border: 'none' }}
                      >
                        {rec.course.institution}
                      </Tag>
                      {rec.course.platform && (
                        <Tag style={{ borderRadius: 20, padding: '4px 12px', background: '#fff0f6', border: 'none' }}>
                          {rec.course.platform}
                        </Tag>
                      )}
                      {rec.course.estimated_hours && (
                        <Tag 
                          icon={<ClockCircleOutlined />}
                          style={{ borderRadius: 20, padding: '4px 12px', background: '#e6fffb', border: 'none' }}
                        >
                          {rec.course.estimated_hours} 小时
                        </Tag>
                      )}
                      {rec.course.rating && (
                        <Tag 
                          icon={<TrophyOutlined />}
                          style={{ borderRadius: 20, padding: '4px 12px', background: '#fffbe6', color: '#d48806', border: 'none' }}
                        >
                          {rec.course.rating} 分
                        </Tag>
                      )}
                    </Space>
                  </div>

                  <div style={{ 
                    background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                    padding: 16,
                    borderRadius: 12,
                    borderLeft: '4px solid #69c0ff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <CheckCircleOutlined style={{ color: '#1890ff', marginTop: 2 }} />
                      <div>
                        <Text strong style={{ color: '#333', display: 'block', marginBottom: 4 }}>
                          推荐理由
                        </Text>
                        <Text style={{ color: '#666', lineHeight: 1.6 }}>
                          {rec.recommendation_reason}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {rec.course.description && (
                    <Paragraph 
                      ellipsis={{ rows: 2, expandable: true }}
                      style={{ color: '#666', marginBottom: 0 }}
                    >
                      {rec.course.description}
                    </Paragraph>
                  )}

                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CodeOutlined style={{ color: '#52c41a' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>编程语言</Text>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {rec.course.programming_languages.map(lang => (
                          <Tag 
                            key={lang} 
                            style={{ borderRadius: 16, marginBottom: 4, background: '#f6ffed', color: '#389e0d', border: '1px solid #b7eb8f' }}
                          >
                            {lang}
                          </Tag>
                        ))}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TagsOutlined style={{ color: '#52c41a' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>主题</Text>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {rec.course.topics.slice(0, 3).map(topic => (
                          <Tag 
                            key={topic}
                            style={{ borderRadius: 16, marginBottom: 4, background: '#f5f5f5', border: 'none' }}
                          >
                            {topic}
                          </Tag>
                        ))}
                        {rec.course.topics.length > 3 && (
                          <Tag style={{ borderRadius: 16, marginBottom: 4 }}>
                            +{rec.course.topics.length - 3}
                          </Tag>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Space>
              </Col>

              <Col xs={24} md={6}>
                <div style={{ 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                  borderRadius: 16,
                  padding: 24,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '1px solid #b7eb8f',
                  position: 'relative'
                }}>
                  <Progress
                    type="dashboard"
                    percent={matchScore}
                    width={120}
                    strokeWidth={8}
                    strokeColor={{
                      '0%': '#52c41a',
                      '50%': '#389e0d',
                      '100%': '#237804',
                    }}
                    trailColor="rgba(82, 196, 26, 0.15)"
                    format={(percent) => (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: 28, 
                          fontWeight: 700, 
                          color: '#389e0d',
                          lineHeight: 1
                        }}>
                          {percent}
                        </span>
                        <span style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>分</span>
                      </div>
                    )}
                  />
                  <Text style={{ display: 'block', marginTop: 8, fontWeight: 600, color: '#389e0d', fontSize: 15 }}>
                    匹配度
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    综合评分
                  </Text>
                </div>
              </Col>
            </Row>

            <div style={{ 
              marginTop: 24, 
              paddingTop: 24, 
              borderTop: '1px solid #f0f0f0' 
            }}>
              <Text type="secondary" style={{ fontSize: 13, marginBottom: 12, display: 'block' }}>
                评分详情
              </Text>
              <Row gutter={[16, 12]}>
                <Col xs={12} md={6}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: '#666' }}>语言匹配</Text>
                      <Text style={{ fontSize: 12, fontWeight: 500, color: '#1890ff' }}>
                        {rec.score_breakdown.language_match}/30
                      </Text>
                    </div>
                    <Progress
                      percent={(rec.score_breakdown.language_match / 30) * 100}
                      size="small"
                      showInfo={false}
                      strokeColor="#1890ff"
                    />
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: '#666' }}>难度适配</Text>
                      <Text style={{ fontSize: 12, fontWeight: 500, color: '#b37feb' }}>
                        {rec.score_breakdown.difficulty_match}/25
                      </Text>
                    </div>
                    <Progress
                      percent={(rec.score_breakdown.difficulty_match / 25) * 100}
                      size="small"
                      showInfo={false}
                      strokeColor="#b37feb"
                    />
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: '#666' }}>领域相关</Text>
                      <Text style={{ fontSize: 12, fontWeight: 500, color: '#faad14' }}>
                        {rec.score_breakdown.domain_relevance}/25
                      </Text>
                    </div>
                    <Progress
                      percent={(rec.score_breakdown.domain_relevance / 25) * 100}
                      size="small"
                      showInfo={false}
                      strokeColor="#faad14"
                    />
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: '#666' }}>前置知识</Text>
                      <Text style={{ fontSize: 12, fontWeight: 500, color: '#eb2f96' }}>
                        {rec.score_breakdown.prerequisite_fit}/20
                      </Text>
                    </div>
                    <Progress
                      percent={(rec.score_breakdown.prerequisite_fit / 20) * 100}
                      size="small"
                      showInfo={false}
                      strokeColor="#eb2f96"
                    />
                  </div>
                </Col>
              </Row>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {rec.course.url && (
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  href={rec.course.url}
                  target="_blank"
                  style={{ 
                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                    border: 'none',
                    borderRadius: 20,
                    height: 44,
                    padding: '0 28px',
                    fontWeight: 500,
                    fontSize: 14,
                    boxShadow: '0 4px 12px rgba(82, 196, 26, 0.35)'
                  }}
                >
                  查看课程详情
                </Button>
              )}
              <Button
                icon={<CalendarOutlined />}
                style={{ 
                  borderRadius: 20,
                  height: 44,
                  padding: '0 24px',
                  borderColor: '#52c41a',
                  color: '#52c41a',
                  fontWeight: 500,
                  fontSize: 14
                }}
              >
                添加到学习计划
              </Button>
              <Button
                icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
                onClick={() => toggleFavorite(rec.course.id)}
                style={{ 
                  borderRadius: 20,
                  height: 44,
                  padding: '0 24px',
                  borderColor: isFavorited ? '#237804' : '#b7eb8f',
                  color: isFavorited ? '#fff' : '#389e0d',
                  background: isFavorited ? 'linear-gradient(135deg, #237804 0%, #135200 100%)' : '#fff',
                  fontWeight: 500,
                  fontSize: 14,
                  transition: 'all 0.3s ease'
                }}
              >
                {isFavorited ? '已收藏' : '收藏课程'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card 
        loading={loading} 
        style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
      />
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card 
        style={{ 
          textAlign: 'center', 
          padding: 60,
          borderRadius: 16,
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Text type="secondary" style={{ fontSize: 16 }}>暂无推荐课程</Text>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24 
      }}>
        <Title level={3} style={{ margin: 0, color: '#333' }}>
          {showFavorites ? '我的课程' : '为您精选的课程推荐'}
        </Title>
        <Button
          type={showFavorites ? 'default' : 'primary'}
          icon={showFavorites ? <ArrowLeftOutlined /> : <FolderOutlined />}
          onClick={() => setShowFavorites(!showFavorites)}
          style={{ 
            borderRadius: 20,
            height: 42,
            padding: '0 24px',
            fontWeight: 500,
            background: showFavorites ? '#fff' : 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
            borderColor: showFavorites ? '#52c41a' : 'transparent',
            color: showFavorites ? '#52c41a' : '#fff',
            boxShadow: showFavorites ? 'none' : '0 4px 12px rgba(82, 196, 26, 0.35)'
          }}
        >
          {showFavorites ? '返回推荐' : `我的课程 (${favorites.length})`}
        </Button>
      </div>

      {showFavorites ? (
        favorites.length === 0 ? (
          <Card 
            style={{ 
              textAlign: 'center', 
              padding: 60,
              borderRadius: 16,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary" style={{ fontSize: 16 }}>
                  暂无收藏的课程
                </Text>
              }
            />
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => setShowFavorites(false)}
              style={{ 
                marginTop: 20,
                borderRadius: 20,
                height: 42,
                padding: '0 24px',
                fontWeight: 500,
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none'
              }}
            >
              去收藏课程
            </Button>
          </Card>
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {getFavoriteCourses().map((rec, index) => renderCourseCard(rec, index, true))}
          </Space>
        )
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {recommendations.map((rec, index) => renderCourseCard(rec, index, false))}
        </Space>
      )}
    </div>
  );
};

export default RecommendationList;
