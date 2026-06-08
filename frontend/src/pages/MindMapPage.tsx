import React from 'react';
import { Button, Select, Space, Tag, Typography } from 'antd';
import { ApartmentOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  buptCourseGuideMap,
  buptCourseGuides,
  type CourseGuide,
} from '../data/buptCourses';

const { Title, Text } = Typography;

const MindMapPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const guide = (slug ? buptCourseGuideMap[slug] : undefined) ?? buptCourseGuides[0];

  const handleCourseChange = (newSlug: string) => {
    navigate(`/course/${newSlug}/mindmap`);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Top bar */}
      <div style={topBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/course/${guide.slug}`)}
            style={backButtonStyle}
          >
            课程详情
          </Button>
          <div>
            <Text style={eyebrowStyle}>Knowledge Mind Map</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Title level={4} style={{ color: '#f8fafc', margin: 0 }}>
                {guide.title}
              </Title>
              <Tag style={accentTagStyle}>{guide.shortTitle}</Tag>
            </div>
          </div>
        </div>
        <Space>
          <Select
            value={guide.slug}
            onChange={handleCourseChange}
            size="large"
            style={{ width: 200 }}
            options={buptCourseGuides.map((g) => ({ value: g.slug, label: g.title }))}
          />
        </Space>
      </div>

      {/* Tip */}
      <div style={tipBarStyle}>
        <InfoCircleOutlined style={{ color: '#38bdf8', flexShrink: 0 }} />
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>
          当前展示该课程的知识模块及核心知识点，可左右滚动查看完整图谱。
        </Text>
      </div>

      {/* Mind map */}
      <CourseMindMapFull guide={guide} />
    </div>
  );
};

/* ───────── Full Mind Map ───────── */
const CourseMindMapFull: React.FC<{ guide: CourseGuide }> = ({ guide }) => {
  const branches = guide.mindMap.slice(0, 8);
  const centerNode = { x: 465, y: 430, width: 270, height: 150 };
  const branchPositions = [
    { x: 430, y: 28, width: 340, height: 190 },
    { x: 48, y: 150, width: 348, height: 204 },
    { x: 804, y: 150, width: 348, height: 204 },
    { x: 48, y: 410, width: 348, height: 204 },
    { x: 804, y: 410, width: 348, height: 204 },
    { x: 48, y: 670, width: 348, height: 204 },
    { x: 804, y: 670, width: 348, height: 204 },
    { x: 430, y: 810, width: 340, height: 190 },
  ];
  const graphHeight = 1040;
  const centerPoint = {
    x: centerNode.x + centerNode.width / 2,
    y: centerNode.y + centerNode.height / 2,
  };

  return (
    <div style={scrollWrapStyle}>
      <div style={{ ...graphStyle, height: graphHeight }}>
        <svg viewBox={`0 0 1200 ${graphHeight}`} style={svgStyle} aria-hidden="true">
          <defs>
            <linearGradient id="mind-line-full" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.62)" />
              <stop offset="100%" stopColor="rgba(129, 140, 248, 0.5)" />
            </linearGradient>
          </defs>
          {branches.map((branch, index) => {
            const position = branchPositions[index];
            const target = {
              x: position.x + position.width / 2,
              y: position.y + position.height / 2,
            };
            const controlOffset = target.x < centerPoint.x ? -120 : target.x > centerPoint.x ? 120 : 0;
            return (
              <path
                key={branch.title}
                d={`M ${centerPoint.x} ${centerPoint.y} C ${centerPoint.x + controlOffset} ${centerPoint.y}, ${target.x - controlOffset} ${target.y}, ${target.x} ${target.y}`}
                stroke="url(#mind-line-full)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })}
        </svg>

        {/* Center node */}
        <div
          style={{
            ...centerNodeStyle,
            left: centerNode.x,
            top: centerNode.y,
            width: centerNode.width,
            height: centerNode.height,
          }}
        >
          <ApartmentOutlined style={{ color: '#bae6fd', fontSize: 28 }} />
          <Text style={centerTitleStyle}>{guide.title}</Text>
          <Space wrap size={[6, 6]} style={{ justifyContent: 'center' }}>
            {guide.route.slice(0, 4).map((item, i) => (
              <Tag key={item} style={centerRouteTagStyle}>
                {i + 1}. {item}
              </Tag>
            ))}
          </Space>
        </div>

        {/* Branch nodes */}
        {branches.map((branch, index) => {
          const position = branchPositions[index];
          return (
            <div
              key={branch.title}
              style={{
                ...branchStyle,
                left: position.x,
                top: position.y,
                width: position.width,
                height: position.height,
              }}
            >
              <div style={branchHeaderStyle}>
                <span style={branchDotStyle}>{index + 1}</span>
                <Text style={branchTitleStyle}>{branch.title}</Text>
              </div>
              <div style={knowledgeGridStyle}>
                {branch.children.map((child) => (
                  <div key={child} style={knowledgeNodeStyle}>
                    {child}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 16,
  marginBottom: 16,
};

const tipBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 16px',
  borderRadius: 12,
  background: 'rgba(8, 47, 73, 0.3)',
  border: '1px solid rgba(56, 189, 248, 0.14)',
  marginBottom: 20,
};

const backButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  color: '#94a3b8',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  background: 'transparent',
};

const eyebrowStyle: React.CSSProperties = {
  color: '#8fb3ff',
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  display: 'block',
};

const accentTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '3px 10px',
  color: '#bae6fd',
  background: 'rgba(14, 165, 233, 0.14)',
  border: '1px solid rgba(56, 189, 248, 0.28)',
};

const scrollWrapStyle: React.CSSProperties = {
  overflowX: 'auto',
  paddingBottom: 8,
};

const graphStyle: React.CSSProperties = {
  position: 'relative',
  minWidth: 1200,
  borderRadius: 22,
  overflow: 'hidden',
  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.5))',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const svgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

const centerNodeStyle: React.CSSProperties = {
  position: 'absolute',
  borderRadius: 20,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  background: 'linear-gradient(145deg, rgba(8, 47, 73, 0.88), rgba(30, 41, 59, 0.76))',
  border: '1px solid rgba(56, 189, 248, 0.34)',
  boxShadow: '0 22px 50px rgba(2, 6, 23, 0.36)',
};

const centerTitleStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontWeight: 800,
  textAlign: 'center',
  fontSize: 17,
  lineHeight: 1.3,
};

const centerRouteTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '3px 8px',
  color: '#dbeafe',
  background: 'rgba(15, 23, 42, 0.7)',
  border: '1px solid rgba(125, 211, 252, 0.16)',
  fontSize: 11,
};

const branchStyle: React.CSSProperties = {
  position: 'absolute',
  borderRadius: 16,
  padding: 14,
  overflowY: 'auto',
  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.94), rgba(8, 47, 73, 0.72))',
  border: '1px solid rgba(71, 85, 105, 0.38)',
  boxShadow: '0 18px 36px rgba(2, 6, 23, 0.22)',
};

const branchHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 10,
};

const branchDotStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#082f49',
  fontSize: 12,
  fontWeight: 800,
  background: '#7dd3fc',
  boxShadow: '0 0 0 4px rgba(56, 189, 248, 0.12)',
  flexShrink: 0,
};

const branchTitleStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontWeight: 760,
  fontSize: 15,
  lineHeight: 1.35,
};

const knowledgeGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const knowledgeNodeStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: '7px 9px',
  flex: '1 1 136px',
  color: '#dbeafe',
  background: 'rgba(8, 47, 73, 0.5)',
  border: '1px solid rgba(56, 189, 248, 0.16)',
  fontSize: 12,
  lineHeight: 1.45,
};

export default MindMapPage;
