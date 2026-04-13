import React from 'react';
import { Button, Card, Empty, Progress, Space, Tag, Typography } from 'antd';
import {
  BookOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import type { Recommendation } from '../../types';

const { Title, Text, Paragraph } = Typography;

interface RecommendationListProps {
  recommendations: Recommendation[];
  loading?: boolean;
  activeCourseId?: number | null;
  onSelectCourse?: (courseId: number) => void;
}

const difficultyMap: Record<string, { label: string; color: string; bg: string }> = {
  beginner: { label: '初级', color: '#86efac', bg: 'rgba(34, 197, 94, 0.14)' },
  intermediate: { label: '中级', color: '#fdba74', bg: 'rgba(249, 115, 22, 0.14)' },
  advanced: { label: '高级', color: '#fca5a5', bg: 'rgba(239, 68, 68, 0.14)' },
};

const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  loading,
  activeCourseId,
  onSelectCourse,
}) => {
  if (loading) {
    return <Card loading={loading} style={loadingCardStyle} />;
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card style={emptyCardStyle}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: '#94a3b8' }}>完成左侧画像后，这里会出现推荐结果</span>}
        />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      {recommendations.map((rec, index) => {
        const difficulty = difficultyMap[rec.course.difficulty_level] || {
          label: rec.course.difficulty_level,
          color: '#cbd5e1',
          bg: 'rgba(148, 163, 184, 0.12)',
        };
        const isActive = activeCourseId === rec.course.id || (!activeCourseId && index === 0);

        return (
          <button
            key={rec.course.id}
            type="button"
            onClick={() => onSelectCourse?.(rec.course.id)}
            style={{
              ...cardButtonStyle,
              borderColor: isActive ? 'rgba(125, 211, 252, 0.5)' : 'rgba(148, 163, 184, 0.14)',
              boxShadow: isActive
                ? '0 0 0 1px rgba(125, 211, 252, 0.22), 0 18px 38px rgba(2, 6, 23, 0.24)'
                : '0 14px 28px rgba(2, 6, 23, 0.14)',
            }}
          >
            <div style={cardHeaderStyle}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={rankBadgeStyle}>{index + 1}</span>
                  <Title level={5} style={{ margin: 0, color: '#f8fafc' }}>
                    {rec.course.title}
                  </Title>
                </div>
                <Space size={[8, 8]} wrap>
                  <Tag style={{ ...tagStyle, color: difficulty.color, background: difficulty.bg }}>
                    {difficulty.label}
                  </Tag>
                  <Tag style={tagStyle} icon={<BookOutlined />}>
                    {rec.course.institution}
                  </Tag>
                  {rec.course.platform ? <Tag style={tagStyle}>{rec.course.platform}</Tag> : null}
                  {rec.course.estimated_hours ? (
                    <Tag style={tagStyle} icon={<ClockCircleOutlined />}>
                      {rec.course.estimated_hours} 小时
                    </Tag>
                  ) : null}
                  {rec.course.rating ? (
                    <Tag style={tagStyle} icon={<TrophyOutlined />}>
                      {rec.course.rating} 分
                    </Tag>
                  ) : null}
                </Space>
              </div>

              <div style={scoreBlockStyle}>
                <Progress
                  type="circle"
                  percent={Math.round(rec.match_score)}
                  width={66}
                  strokeColor={{
                    '0%': '#38bdf8',
                    '100%': '#6366f1',
                  }}
                  trailColor="rgba(148, 163, 184, 0.15)"
                  format={(value) => (
                    <span style={{ color: '#f8fafc', fontSize: 14, fontWeight: 700 }}>{value}</span>
                  )}
                />
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>匹配度</Text>
              </div>
            </div>

            <div style={reasonBoxStyle}>
              <Text style={{ color: '#8fb3ff', fontSize: 12 }}>推荐理由</Text>
              <Paragraph style={{ color: '#cbd5e1', margin: '6px 0 0', lineHeight: 1.75 }}>
                {rec.recommendation_reason}
              </Paragraph>
            </div>

            {rec.course.description ? (
              <Paragraph style={{ color: '#94a3b8', marginBottom: 0 }} ellipsis={{ rows: 2, expandable: true }}>
                {rec.course.description}
              </Paragraph>
            ) : null}

            <div style={metaGridStyle}>
              <div>
                <Text style={metaLabelStyle}>编程语言</Text>
                <Space size={[8, 8]} wrap>
                  {rec.course.programming_languages.map((lang) => (
                    <Tag key={lang} style={topicTagStyle}>
                      {lang}
                    </Tag>
                  ))}
                </Space>
              </div>
              <div>
                <Text style={metaLabelStyle}>主题</Text>
                <Space size={[8, 8]} wrap>
                  {rec.course.topics.slice(0, 4).map((topic) => (
                    <Tag key={topic} style={topicTagStyle}>
                      {topic}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>

            <div style={breakdownGridStyle}>
              {[
                ['语言', rec.score_breakdown.language_match, 30],
                ['难度', rec.score_breakdown.difficulty_match, 25],
                ['主题', rec.score_breakdown.domain_relevance, 25],
                ['前置', rec.score_breakdown.prerequisite_fit, 20],
              ].map(([label, value, total]) => (
                <div key={label} style={breakdownItemStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#cbd5e1', fontSize: 12 }}>{label}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                      {value}/{total}
                    </Text>
                  </div>
                  <Progress
                    percent={Math.round((Number(value) / Number(total)) * 100)}
                    size="small"
                    showInfo={false}
                    strokeColor={{
                      '0%': '#38bdf8',
                      '100%': '#818cf8',
                    }}
                    trailColor="rgba(148, 163, 184, 0.16)"
                  />
                </div>
              ))}
            </div>

            {rec.course.url ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="link"
                  icon={<LinkOutlined />}
                  href={rec.course.url}
                  target="_blank"
                  style={{ padding: 0, color: '#8fb3ff' }}
                  onClick={(event) => event.stopPropagation()}
                >
                  查看课程
                </Button>
              </div>
            ) : null}
          </button>
        );
      })}
    </Space>
  );
};

const loadingCardStyle: React.CSSProperties = {
  borderRadius: 22,
  background: 'rgba(9, 16, 28, 0.88)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const emptyCardStyle: React.CSSProperties = {
  borderRadius: 22,
  background: 'rgba(9, 16, 28, 0.88)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const cardButtonStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  borderRadius: 22,
  padding: 20,
  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(18, 28, 45, 0.88))',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  cursor: 'pointer',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 16,
};

const scoreBlockStyle: React.CSSProperties = {
  minWidth: 80,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
};

const rankBadgeStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
  color: '#f8fafc',
  fontSize: 13,
  fontWeight: 700,
};

const reasonBoxStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 14,
  marginBottom: 14,
  background: 'rgba(59, 130, 246, 0.08)',
  border: '1px solid rgba(96, 165, 250, 0.14)',
};

const metaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
  marginTop: 14,
};

const breakdownGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  marginTop: 16,
};

const breakdownItemStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const tagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 12px',
  background: 'rgba(148, 163, 184, 0.12)',
  color: '#dbe7ff',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const topicTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 12px',
  background: 'rgba(30, 41, 59, 0.92)',
  color: '#cbd5e1',
  border: '1px solid rgba(71, 85, 105, 0.35)',
};

const metaLabelStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  display: 'block',
  marginBottom: 8,
};

export default RecommendationList;
