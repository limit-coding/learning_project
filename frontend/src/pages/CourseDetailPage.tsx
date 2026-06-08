import React from 'react';
import { Button, Card, Space, Tag, Tabs, Timeline, Typography } from 'antd';
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  RobotOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { buptCourseGuideMap } from '../data/buptCourses';

const { Title, Text, Paragraph } = Typography;

const CourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const guide = slug ? buptCourseGuideMap[slug] : undefined;

  if (!guide) {
    return (
      <div style={notFoundStyle}>
        <Title level={3} style={{ color: '#f8fafc' }}>找不到该课程</Title>
        <Button onClick={() => navigate('/courses')} icon={<ArrowLeftOutlined />}>
          返回课程库
        </Button>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'route',
      label: (
        <span>
          <ScheduleOutlined style={{ marginRight: 6 }} />
          学习路线 & 章节重点
        </span>
      ),
      children: <RouteTab guide={guide} />,
    },
    {
      key: 'materials',
      label: (
        <span>
          <BookOutlined style={{ marginRight: 6 }} />
          公开课 & 资料推荐
        </span>
      ),
      children: <MaterialsTab guide={guide} />,
    },
    {
      key: 'mindmap',
      label: (
        <span>
          <ApartmentOutlined style={{ marginRight: 6 }} />
          知识图谱预览
        </span>
      ),
      children: <MindMapPreviewTab guide={guide} onFullscreen={() => navigate(`/course/${slug}/mindmap`)} />,
    },
  ];

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Back nav */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/courses')}
        style={backButtonStyle}
      >
        课程库
      </Button>

      {/* Course header card */}
      <Card style={headerCardStyle} bodyStyle={{ padding: '32px 36px' }}>
        <div style={courseHeaderInnerStyle}>
          <div style={{ flex: 1 }}>
            <Space wrap style={{ marginBottom: 14 }}>
              <Tag style={shortTitleTagStyle}>{guide.shortTitle}</Tag>
              <Tag style={codeTagStyle}>{guide.code}</Tag>
            </Space>
            <Title level={2} style={{ color: '#f8fafc', margin: '0 0 12px' }}>
              {guide.title}
            </Title>
            <Paragraph style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>
              {guide.summary}
            </Paragraph>
            <div style={routeStripStyle}>
              {guide.route.map((item, i) => (
                <div key={item} style={routeItemStyle}>
                  <span style={routeDotStyle}>{i + 1}</span>
                  <Text style={{ color: '#e2e8f0', fontSize: 13 }}>{item}</Text>
                </div>
              ))}
            </div>
          </div>
          <div style={headerActionsStyle}>
            <Button
              icon={<ApartmentOutlined />}
              onClick={() => navigate(`/course/${slug}/mindmap`)}
              style={outlineButtonStyle}
              size="large"
            >
              查看知识图谱
            </Button>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={() => navigate('/ai')}
              style={primaryButtonStyle}
              size="large"
            >
              问 AI 助手
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card style={tabCardStyle} bodyStyle={{ padding: '0 0 0 0' }}>
        <Tabs
          defaultActiveKey="route"
          items={tabItems}
          style={{ padding: '0 24px' }}
          tabBarStyle={{ borderBottom: '1px solid rgba(71, 85, 105, 0.3)', marginBottom: 0 }}
        />
      </Card>
    </div>
  );
};

/* ───────── Route Tab ───────── */
const RouteTab: React.FC<{ guide: ReturnType<typeof getGuide> }> = ({ guide }) => {
  if (!guide) return null;
  return (
    <div style={{ padding: '24px 0' }}>
      <div style={detailSectionStyle}>
        <Text style={sectionLabelStyle}>
          <ScheduleOutlined /> 章节重点
        </Text>
        <Timeline
          style={{ marginTop: 16 }}
          items={guide.chapters.map((chapter) => ({
            color: '#38bdf8',
            children: (
              <div style={chapterBlockStyle}>
                <Text style={{ color: '#f8fafc', fontWeight: 650 }}>{chapter.title}</Text>
                <Paragraph style={{ color: '#cbd5e1', margin: '8px 0', lineHeight: 1.7 }}>
                  {chapter.focus}
                </Paragraph>
                <div style={checklistGridStyle}>
                  {chapter.checklist.map((item) => (
                    <div key={item} style={checklistItemStyle}>
                      <CheckCircleOutlined style={{ color: '#38bdf8', flexShrink: 0 }} /> {item}
                    </div>
                  ))}
                </div>
              </div>
            ),
          }))}
        />
      </div>
    </div>
  );
};

/* ───────── Materials Tab ───────── */
const MaterialsTab: React.FC<{ guide: ReturnType<typeof getGuide> }> = ({ guide }) => {
  if (!guide) return null;
  return (
    <div style={{ padding: '24px 0' }}>
      <div style={materialGridStyle}>
        {guide.publicMaterials.map((item) => (
          <div key={`${item.type}-${item.title}`} style={materialCardStyle}>
            <div style={materialCardHeaderStyle}>
              <Text style={{ color: '#f8fafc', fontWeight: 650, lineHeight: 1.45 }}>{item.title}</Text>
              <Tag style={accentTagStyle}>{item.type}</Tag>
            </div>
            <Text style={{ color: '#cbd5e1', lineHeight: 1.7 }}>{item.description}</Text>
            {item.url ? (
              <Button
                type="link"
                href={item.url}
                target="_blank"
                rel="noreferrer"
                icon={<LinkOutlined />}
                style={materialLinkStyle}
              >
                查看资料
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────── MindMap Preview Tab ───────── */
const MindMapPreviewTab: React.FC<{
  guide: ReturnType<typeof getGuide>;
  onFullscreen: () => void;
}> = ({ guide, onFullscreen }) => {
  if (!guide) return null;
  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={sectionLabelStyle}>知识模块概览</Text>
        <Button icon={<ApartmentOutlined />} onClick={onFullscreen} style={outlineButtonStyle}>
          全屏图谱
        </Button>
      </div>
      <div style={mindMapPreviewGridStyle}>
        {guide.mindMap.map((branch, index) => (
          <div key={branch.title} style={mindMapPreviewCardStyle}>
            <div style={mindMapPreviewHeaderStyle}>
              <span style={indexDotStyle}>{index + 1}</span>
              <Text style={{ color: '#f8fafc', fontWeight: 700, fontSize: 14 }}>{branch.title}</Text>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {branch.children.map((child) => (
                <div key={child} style={mindMapNodeTagStyle}>{child}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getGuide(slug: string | undefined) {
  return slug ? buptCourseGuideMap[slug] : undefined;
}

// ─── Styles ───────────────────────────────────────────────────────────

const notFoundStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '80px 0',
  gap: 20,
};

const backButtonStyle: React.CSSProperties = {
  marginBottom: 20,
  borderRadius: 999,
  color: '#94a3b8',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  background: 'transparent',
};

const headerCardStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid rgba(125, 211, 252, 0.16)',
  background: 'linear-gradient(145deg, rgba(14, 24, 40, 0.98), rgba(17, 30, 48, 0.96))',
  marginBottom: 20,
};

const tabCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid rgba(71, 85, 105, 0.2)',
  background: 'rgba(9, 16, 28, 0.88)',
  overflow: 'hidden',
};

const courseHeaderInnerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 24,
  flexWrap: 'wrap',
};

const headerActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  justifyContent: 'flex-start',
  flexShrink: 0,
};

const shortTitleTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 12px',
  color: '#bae6fd',
  background: 'rgba(14, 165, 233, 0.14)',
  border: '1px solid rgba(56, 189, 248, 0.28)',
};

const codeTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 10px',
  color: '#cbd5e1',
  background: 'rgba(30, 41, 59, 0.78)',
  border: '1px solid rgba(71, 85, 105, 0.35)',
};

const routeStripStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const routeItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 12,
  background: 'rgba(15, 23, 42, 0.68)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const routeDotStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#bae6fd',
  background: 'rgba(14, 165, 233, 0.18)',
  fontSize: 12,
  fontWeight: 750,
  flexShrink: 0,
};

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  background: 'linear-gradient(90deg, #0891b2, #4f46e5)',
  border: 'none',
  fontWeight: 600,
};

const outlineButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  color: '#94a3b8',
  border: '1px solid rgba(71, 85, 105, 0.35)',
  background: 'transparent',
};

const detailSectionStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.5)',
  border: '1px solid rgba(71, 85, 105, 0.2)',
};

const sectionLabelStyle: React.CSSProperties = {
  color: '#dbeafe',
  fontSize: 13,
  fontWeight: 700,
};

const chapterBlockStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: 14,
  background: 'rgba(30, 41, 59, 0.62)',
  border: '1px solid rgba(71, 85, 105, 0.3)',
};

const checklistGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 8,
};

const checklistItemStyle: React.CSSProperties = {
  minHeight: 36,
  borderRadius: 12,
  padding: '8px 10px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  color: '#dbeafe',
  fontSize: 13,
  lineHeight: 1.55,
  background: 'rgba(30, 41, 59, 0.78)',
  border: '1px solid rgba(71, 85, 105, 0.35)',
};

const materialGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14,
};

const materialCardStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  background: 'rgba(8, 47, 73, 0.34)',
  border: '1px solid rgba(56, 189, 248, 0.16)',
};

const materialCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 10,
};

const materialLinkStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: 0,
  color: '#8fb3ff',
};

const accentTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '3px 10px',
  color: '#bae6fd',
  background: 'rgba(14, 165, 233, 0.14)',
  border: '1px solid rgba(56, 189, 248, 0.28)',
  fontSize: 12,
};

const mindMapPreviewGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14,
};

const mindMapPreviewCardStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: 16,
  background: 'rgba(15, 23, 42, 0.68)',
  border: '1px solid rgba(71, 85, 105, 0.28)',
};

const mindMapPreviewHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 12,
};

const indexDotStyle: React.CSSProperties = {
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
  flexShrink: 0,
};

const mindMapNodeTagStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: '5px 9px',
  color: '#dbeafe',
  background: 'rgba(8, 47, 73, 0.5)',
  border: '1px solid rgba(56, 189, 248, 0.16)',
  fontSize: 12,
};

export default CourseDetailPage;
