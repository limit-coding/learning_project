import React, { useMemo } from 'react';
import { Space, Tag, Typography } from 'antd';
import { BranchesOutlined, UnlockOutlined } from '@ant-design/icons';
import type { Recommendation, RoadmapResponse } from '../../types';

const { Text } = Typography;

interface RoadmapCanvasProps {
  recommendations?: Recommendation[];
  roadmap?: RoadmapResponse | null;
  activeCourseId?: number | null;
  activeRoadmapSlug?: string | null;
  onSelectCourse?: (courseId: number) => void;
  onSelectRoadmapNode?: (slug: string) => void;
}

interface RoadmapNode {
  id: number | string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  score: number;
  unlocked: boolean;
  topics: string[];
  prerequisite: string;
  slug?: string;
}

const positions = [
  { x: 40, y: 36 },
  { x: 300, y: 168 },
  { x: 86, y: 314 },
  { x: 346, y: 456 },
];

const RoadmapCanvas: React.FC<RoadmapCanvasProps> = ({
  recommendations = [],
  roadmap,
  activeCourseId,
  activeRoadmapSlug,
  onSelectCourse,
  onSelectRoadmapNode,
}) => {
  const nodes = useMemo<RoadmapNode[]>(() => {
    if (roadmap?.nodes?.length) {
      return roadmap.nodes.slice(0, 6).map((item, index) => {
        const incoming = roadmap.edges.find((edge) => edge.target === item.slug);
        return {
          id: item.slug,
          slug: item.slug,
          title: item.title,
          subtitle: item.difficulty || '课程节点',
          x: positions[index]?.x ?? 40 + (index % 2) * 250,
          y: positions[index]?.y ?? 36 + index * 120,
          score: item.is_mastered ? 100 : 80 - index * 6,
          unlocked: !item.is_mastered,
          topics: item.summary ? [item.summary.slice(0, 14)] : [],
          prerequisite: incoming?.source || '目标入口',
        };
      });
    }

    return recommendations.slice(0, 4).map((item, index) => ({
      id: item.course.id,
      title: item.course.title,
      subtitle: item.course.institution,
      x: positions[index]?.x ?? 40,
      y: positions[index]?.y ?? 36 + index * 130,
      score: Math.round(item.match_score),
      unlocked: index < 2,
      topics: item.course.topics.slice(0, 2),
      prerequisite: index === 0 ? '目标澄清' : recommendations[index - 1]?.course.title || '上一阶段',
    }));
  }, [recommendations, roadmap]);

  if (!nodes.length) {
    return null;
  }

  return (
    <div style={canvasStyle}>
      <svg viewBox="0 0 560 620" style={svgStyle} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="roadmap-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.75)" />
            <stop offset="100%" stopColor="rgba(129, 140, 248, 0.75)" />
          </linearGradient>
        </defs>

        {nodes.slice(0, -1).map((node, index) => {
          const next = nodes[index + 1];
          const startX = node.x + 200;
          const startY = node.y + 54;
          const endX = next.x;
          const endY = next.y + 54;
          const midX = (startX + endX) / 2;

          return (
            <path
              key={`${node.id}-${next.id}`}
              d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
              stroke="url(#roadmap-line)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={index === 1 ? '8 10' : undefined}
              opacity={0.92}
            />
          );
        })}
      </svg>

      {nodes.map((node, index) => {
        const isActive = roadmap
          ? activeRoadmapSlug === node.slug || (!activeRoadmapSlug && index === 0)
          : activeCourseId === node.id || (!activeCourseId && index === 0);

        return (
          <button
            key={node.id}
            type="button"
            onClick={() => {
              if (roadmap && node.slug) {
                onSelectRoadmapNode?.(node.slug);
                return;
              }
              if (typeof node.id === 'number') {
                onSelectCourse?.(node.id);
              }
            }}
            style={{
              ...nodeStyle,
              top: node.y,
              left: node.x,
              borderColor: isActive ? 'rgba(125, 211, 252, 0.68)' : 'rgba(148, 163, 184, 0.14)',
              boxShadow: isActive
                ? '0 0 0 1px rgba(125, 211, 252, 0.22), 0 22px 42px rgba(2, 6, 23, 0.28)'
                : '0 18px 30px rgba(2, 6, 23, 0.18)',
            }}
          >
            <div style={nodeHeaderStyle}>
              <div style={nodeIndexStyle}>{index + 1}</div>
              <div style={{ flex: 1 }}>
                <Text style={{ color: '#f8fafc', fontSize: 15, fontWeight: 600 }}>{node.title}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12, display: 'block', marginTop: 4 }}>
                  {node.subtitle}
                </Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text style={{ color: '#8fb3ff', fontSize: 11, display: 'block' }}>Score</Text>
                <Text style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>{node.score}</Text>
              </div>
            </div>

            <div style={metaLineStyle}>
              <BranchesOutlined style={{ color: '#8fb3ff' }} />
              <Text style={{ color: '#cbd5e1', fontSize: 12 }}>
                {roadmap ? '依赖：' : '前置：'}
                {node.prerequisite}
              </Text>
            </div>

            <Space wrap size={[8, 8]}>
              <Tag style={node.unlocked ? unlockedTagStyle : lockedTagStyle}>
                {node.unlocked ? (
                  <>
                    <UnlockOutlined /> 已解锁
                  </>
                ) : (
                  '待解锁'
                )}
              </Tag>
              {node.topics.map((topic) => (
                <Tag key={topic} style={topicTagStyle}>
                  {topic}
                </Tag>
              ))}
            </Space>
          </button>
        );
      })}
    </div>
  );
};

const canvasStyle: React.CSSProperties = {
  position: 'relative',
  minHeight: 620,
  borderRadius: 22,
  overflow: 'hidden',
  background:
    'radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.08), transparent 22%), radial-gradient(circle at 78% 26%, rgba(129, 140, 248, 0.12), transparent 18%), linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.54))',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const svgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

const nodeStyle: React.CSSProperties = {
  position: 'absolute',
  width: 200,
  minHeight: 108,
  padding: 16,
  borderRadius: 20,
  textAlign: 'left',
  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(18, 28, 45, 0.92))',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  cursor: 'pointer',
};

const nodeHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 12,
};

const nodeIndexStyle: React.CSSProperties = {
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
  flexShrink: 0,
};

const metaLineStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
  padding: '8px 10px',
  borderRadius: 12,
  background: 'rgba(148, 163, 184, 0.08)',
};

const unlockedTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 10px',
  background: 'rgba(32, 201, 151, 0.14)',
  color: '#9ff0d2',
  border: '1px solid rgba(32, 201, 151, 0.24)',
};

const lockedTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 10px',
  background: 'rgba(255, 196, 61, 0.12)',
  color: '#f8d27c',
  border: '1px solid rgba(255, 196, 61, 0.24)',
};

const topicTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 10px',
  background: 'rgba(30, 41, 59, 0.92)',
  color: '#cbd5e1',
  border: '1px solid rgba(71, 85, 105, 0.35)',
};

export default RoadmapCanvas;
