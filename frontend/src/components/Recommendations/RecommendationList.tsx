import React from 'react';
import { Card, Tag, Progress, Typography, Space, Divider, Button } from 'antd';
import { BookOutlined, ClockCircleOutlined, TrophyOutlined, LinkOutlined } from '@ant-design/icons';
import type { Recommendation } from '../../types';

const { Title, Text, Paragraph } = Typography;

interface RecommendationListProps {
  recommendations: Recommendation[];
  loading?: boolean;
}

const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations, loading }) => {
  const getDifficultyColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'green',
      intermediate: 'orange',
      advanced: 'red',
    };
    return colors[level] || 'blue';
  };

  const getDifficultyText = (level: string) => {
    const texts: Record<string, string> = {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级',
    };
    return texts[level] || level;
  };

  if (loading) {
    return <Card loading={loading} />;
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <Text type="secondary">暂无推荐课程</Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {recommendations.map((rec, index) => (
        <Card
          key={rec.course.id}
          hoverable
          style={{ borderLeft: `4px solid ${index === 0 ? '#1890ff' : '#d9d9d9'}` }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* 标题和匹配分数 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ marginBottom: 8 }}>
                  {index + 1}. {rec.course.title}
                </Title>
                <Space size="small" wrap>
                  <Tag color={getDifficultyColor(rec.course.difficulty_level)}>
                    {getDifficultyText(rec.course.difficulty_level)}
                  </Tag>
                  <Tag icon={<BookOutlined />}>{rec.course.institution}</Tag>
                  {rec.course.platform && <Tag>{rec.course.platform}</Tag>}
                  {rec.course.estimated_hours && (
                    <Tag icon={<ClockCircleOutlined />}>
                      {rec.course.estimated_hours}小时
                    </Tag>
                  )}
                  {rec.course.rating && (
                    <Tag icon={<TrophyOutlined />} color="gold">
                      {rec.course.rating}分
                    </Tag>
                  )}
                </Space>
              </div>
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <Progress
                  type="circle"
                  percent={rec.match_score}
                  width={60}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                  匹配度
                </Text>
              </div>
            </div>

            {/* 推荐理由 */}
            <Paragraph style={{ marginBottom: 0, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}>
              <Text strong>推荐理由：</Text>
              <br />
              {rec.recommendation_reason}
            </Paragraph>

            {/* 课程描述 */}
            {rec.course.description && (
              <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                {rec.course.description}
              </Paragraph>
            )}

            {/* 技术标签 */}
            <div>
              <Text type="secondary" style={{ marginRight: 8 }}>编程语言：</Text>
              {rec.course.programming_languages.map(lang => (
                <Tag key={lang} color="blue">{lang}</Tag>
              ))}
            </div>

            <div>
              <Text type="secondary" style={{ marginRight: 8 }}>主题：</Text>
              {rec.course.topics.map(topic => (
                <Tag key={topic}>{topic}</Tag>
              ))}
            </div>

            {/* 评分细节 */}
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <div>
                <Text type="secondary">语言匹配：</Text>
                <Progress
                  percent={(rec.score_breakdown.language_match / 30) * 100}
                  size="small"
                  showInfo={false}
                />
              </div>
              <div>
                <Text type="secondary">难度适配：</Text>
                <Progress
                  percent={(rec.score_breakdown.difficulty_match / 25) * 100}
                  size="small"
                  showInfo={false}
                />
              </div>
              <div>
                <Text type="secondary">领域相关：</Text>
                <Progress
                  percent={(rec.score_breakdown.domain_relevance / 25) * 100}
                  size="small"
                  showInfo={false}
                />
              </div>
              <div>
                <Text type="secondary">前置知识：</Text>
                <Progress
                  percent={(rec.score_breakdown.prerequisite_fit / 20) * 100}
                  size="small"
                  showInfo={false}
                />
              </div>
            </div>

            {/* 课程链接 */}
            {rec.course.url && (
              <Button
                type="link"
                icon={<LinkOutlined />}
                href={rec.course.url}
                target="_blank"
                style={{ padding: 0 }}
              >
                查看课程
              </Button>
            )}
          </Space>
        </Card>
      ))}
    </Space>
  );
};

export default RecommendationList;
