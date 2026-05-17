import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Drawer,
  Layout,
  Row,
  Select,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import {
  ApartmentOutlined,
  BookOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  LinkOutlined,
  ReloadOutlined,
  RobotOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import {
  buptCourseGuideMap,
  buptCourseGuides,
  courseColleges,
  courseGuidesByCollege,
  courseGuidesBySemester,
  courseSemesters,
  type CourseCollege,
  type CourseSemester,
} from './data/buptCourses';
import CourseChat from './components/Chat/CourseChat';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const App: React.FC = () => {
  const [selectedCollege, setSelectedCollege] = useState<CourseCollege>('北邮信通院');
  const [selectedSemester, setSelectedSemester] = useState<CourseSemester>('大二下');
  const [selectedSlug, setSelectedSlug] = useState(buptCourseGuides[0].slug);
  const [chatOpen, setChatOpen] = useState(false);

  const collegeSemesters = courseGuidesByCollege[selectedCollege] || courseGuidesBySemester;
  const semesterOptions = courseSemesters.filter((semester) => Boolean(collegeSemesters[semester]?.length));
  const semesterGuides = collegeSemesters[selectedSemester] || buptCourseGuides;

  const selectedGuide = useMemo(() => {
    return buptCourseGuideMap[selectedSlug] || semesterGuides[0] || buptCourseGuides[0];
  }, [selectedSlug, semesterGuides]);

  const handleCollegeChange = (college: CourseCollege) => {
    const nextSemesters = courseGuidesByCollege[college] || courseGuidesBySemester;
    const nextSemester = (courseSemesters.find((semester) => nextSemesters[semester]?.length) || '大二下') as CourseSemester;
    const nextGuides = nextSemesters[nextSemester] || [];
    setSelectedCollege(college);
    setSelectedSemester(nextSemester);
    if (nextGuides[0]) {
      setSelectedSlug(nextGuides[0].slug);
    }
  };

  const handleSemesterChange = (semester: CourseSemester) => {
    const nextGuides = collegeSemesters[semester] || [];
    setSelectedSemester(semester);
    if (nextGuides[0]) {
      setSelectedSlug(nextGuides[0].slug);
    }
  };

  const handleReset = () => {
    setSelectedCollege('北邮信通院');
    setSelectedSemester('大二下');
    setSelectedSlug(buptCourseGuides[0].slug);
  };

  return (
    <Layout style={appLayoutStyle}>
      <Header style={headerStyle}>
        <div style={brandStyle}>
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

        <Space>
          <Tag style={headerTagStyle}>{selectedCollege}</Tag>
          <Tag style={headerTagStyle}>{selectedSemester}</Tag>
          <Tag style={headerTagStyle}>当前：{selectedGuide.shortTitle}</Tag>
          <Button
            icon={<CommentOutlined />}
            onClick={() => setChatOpen(true)}
            style={ghostButtonStyle}
          >
            AI 助手
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset} style={ghostButtonStyle}>
            重置
          </Button>
        </Space>
      </Header>

      <Content style={contentStyle}>
        <Card style={heroCardStyle} bodyStyle={{ padding: 28 }}>
          <Row gutter={[20, 20]} align="middle">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <Space wrap>
                  <Tag style={accentTagStyle}>按年级学期整理</Tag>
                  <Tag style={softTagStyle}>SQLite</Tag>
                  <Tag style={softTagStyle}>人工整理 + AI 辅助</Tag>
                </Space>
                <Title level={2} style={{ color: '#f8fafc', margin: 0 }}>
                  选一门课，直接看路线
                </Title>
                <Paragraph style={mutedParagraphStyle}>
                  先选择学院，再选择年级学期和课程。当前先整理北邮信通院，后续可以继续追加北邮计算机院等入口。
                </Paragraph>
              </Space>
            </Col>
            <Col xs={24} lg={10}>
              <div style={selectorPanelStyle}>
                <Text style={sectionEyebrowStyle}>Course Entry</Text>
                <Title level={4} style={sectionTitleStyle}>
                  选择学院、学期与课程
                </Title>
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Select
                    value={selectedCollege}
                    onChange={handleCollegeChange}
                    size="large"
                    style={{ width: '100%' }}
                    options={courseColleges.map((college) => ({
                      value: college,
                      label: college,
                    }))}
                  />
                  <Select
                    value={selectedSemester}
                    onChange={handleSemesterChange}
                    size="large"
                    style={{ width: '100%' }}
                    options={semesterOptions.map((semester) => ({
                      value: semester,
                      label: `${semester}（${collegeSemesters[semester].length} 门）`,
                    }))}
                  />
                  <Select
                    value={selectedSlug}
                    onChange={setSelectedSlug}
                    size="large"
                    style={{ width: '100%' }}
                    options={semesterGuides.map((guide) => ({
                      value: guide.slug,
                      label: guide.title,
                    }))}
                  />
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        <Space direction="vertical" size={20} style={{ width: '100%', marginTop: 20 }}>
          <Card style={panelCardStyle} bodyStyle={{ padding: 26 }}>
            <div style={panelHeaderStyle}>
              <div>
                <Text style={sectionEyebrowStyle}>Course Mind Map</Text>
                <Title level={3} style={sectionTitleStyle}>
                  单课程知识图谱
                </Title>
                <Paragraph style={mutedParagraphStyle}>
                  这里展示当前课程内部的主干知识点和单知识点节点，不再展示五门课之间的关系。
                </Paragraph>
              </div>
              <Tag style={accentTagStyle}>{selectedGuide.shortTitle}</Tag>
            </div>

            <CourseMindMapPanel guide={selectedGuide} />
          </Card>

          <Card style={panelCardStyle} bodyStyle={{ padding: 26 }}>
            <CourseGuidePanel guide={selectedGuide} />
          </Card>
        </Space>
      </Content>

      {/* 浮动 AI 助手按钮 */}
      <div style={floatingWrapperStyle}>
        <div style={floatingTooltipStyle}>
          👋 你好，我是AI小助手，有什么课程问题可以问我哦！
        </div>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<CommentOutlined />}
          onClick={() => setChatOpen(true)}
          style={floatingButtonStyle}
        />
      </div>

      <Drawer
        title="AI 课程助手"
        placement="right"
        width={480}
        onClose={() => setChatOpen(false)}
        open={chatOpen}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        <CourseChat />
      </Drawer>
    </Layout>
  );
};

interface CourseGuidePanelProps {
  guide: (typeof buptCourseGuides)[number];
}

const CourseMindMapPanel: React.FC<{ guide: (typeof buptCourseGuides)[number] }> = ({ guide }) => {
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
    <div style={courseMindMapScrollStyle}>
      <div style={{ ...courseMindMapGraphStyle, height: graphHeight }}>
        <svg viewBox={`0 0 1200 ${graphHeight}`} style={mindLineSvgStyle} aria-hidden="true">
          <defs>
            <linearGradient id="mind-line" x1="0%" y1="0%" x2="100%" y2="100%">
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
                stroke="url(#mind-line)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })}
        </svg>

        <div
          style={{
            ...mindCenterNodeStyle,
            left: centerNode.x,
            top: centerNode.y,
            width: centerNode.width,
            height: centerNode.height,
          }}
        >
          <ApartmentOutlined style={{ color: '#bae6fd', fontSize: 26 }} />
          <Text style={mindCenterTitleStyle}>{guide.title}</Text>
          <Space wrap size={[6, 6]} style={{ justifyContent: 'center' }}>
            {guide.route.slice(0, 4).map((item, index) => (
              <Tag key={item} style={centerRouteTagStyle}>
                {index + 1}. {item}
              </Tag>
            ))}
          </Space>
        </div>

        {branches.map((branch, index) => {
          const position = branchPositions[index];
          return (
            <div
              key={branch.title}
              style={{
                ...mindGraphBranchStyle,
                left: position.x,
                top: position.y,
                width: position.width,
                height: position.height,
              }}
            >
              <div style={mindGraphBranchHeaderStyle}>
                <span style={mindGraphBranchDotStyle}>{index + 1}</span>
                <Text style={mindGraphBranchTitleStyle}>{branch.title}</Text>
              </div>
              <div style={mindGraphKnowledgeGridStyle}>
                {branch.children.slice(0, 5).map((child) => (
                  <div key={child} style={mindGraphKnowledgeNodeStyle}>
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

const CourseGuidePanel: React.FC<CourseGuidePanelProps> = ({ guide }) => {
  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <div style={panelHeaderStyle}>
        <div>
          <Text style={sectionEyebrowStyle}>Course Detail</Text>
          <Title level={3} style={sectionTitleStyle}>
            {guide.title}
          </Title>
          <Paragraph style={mutedParagraphStyle}>{guide.summary}</Paragraph>
        </div>
        <Tag style={accentTagStyle}>{guide.shortTitle}</Tag>
      </div>

      <div style={routeStripStyle}>
        {guide.route.map((item, index) => (
          <div key={item} style={routeItemStyle}>
            <span style={routeDotStyle}>{index + 1}</span>
            <Text style={{ color: '#e2e8f0', fontSize: 13 }}>{item}</Text>
          </div>
        ))}
      </div>

      <div style={detailSectionStyle}>
        <Text style={detailSectionTitleStyle}>
          <ScheduleOutlined /> 章节重点
        </Text>
        <Timeline
          style={{ marginTop: 14 }}
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
                      <CheckCircleOutlined /> {item}
                    </div>
                  ))}
                </div>
              </div>
            ),
          }))}
        />
      </div>

      <div style={detailSectionStyle}>
        <Text style={detailSectionTitleStyle}>
          <BookOutlined /> 公开课与资料推荐
        </Text>
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
    </Space>
  );
};

const appLayoutStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #07111f 0%, #0d1726 45%, #101826 100%)',
};

const headerStyle: React.CSSProperties = {
  height: 80,
  padding: '0 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(7, 17, 31, 0.86)',
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
};

const brandIconStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#f8fafc',
  fontSize: 20,
  background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
};

const contentStyle: React.CSSProperties = {
  padding: 24,
};

const heroCardStyle: React.CSSProperties = {
  borderRadius: 18,
  overflow: 'hidden',
  border: '1px solid rgba(125, 211, 252, 0.18)',
  background: 'linear-gradient(145deg, rgba(14, 24, 40, 0.98), rgba(17, 30, 48, 0.96))',
  boxShadow: '0 22px 42px rgba(2, 6, 23, 0.24)',
};

const panelCardStyle: React.CSSProperties = {
  borderRadius: 18,
  overflow: 'hidden',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  background: 'rgba(9, 16, 28, 0.9)',
  boxShadow: '0 18px 34px rgba(2, 6, 23, 0.2)',
};

const selectorPanelStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.76)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
  marginBottom: 16,
};

const eyebrowStyle: React.CSSProperties = {
  color: '#8fb3ff',
  fontSize: 12,
  letterSpacing: 1.2,
};

const sectionEyebrowStyle: React.CSSProperties = {
  color: '#8fb3ff',
  fontSize: 11,
  letterSpacing: 1.1,
  textTransform: 'uppercase',
};

const sectionTitleStyle: React.CSSProperties = {
  color: '#f8fafc',
  margin: '4px 0 8px',
};

const mutedParagraphStyle: React.CSSProperties = {
  color: '#a4b1c4',
  marginBottom: 0,
  lineHeight: 1.75,
};

const headerTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '5px 12px',
  color: '#dbeafe',
  background: 'rgba(30, 41, 59, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const softTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 10px',
  color: '#cbd5e1',
  background: 'rgba(30, 41, 59, 0.78)',
  border: '1px solid rgba(71, 85, 105, 0.35)',
};

const accentTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 12px',
  color: '#bae6fd',
  background: 'rgba(14, 165, 233, 0.14)',
  border: '1px solid rgba(56, 189, 248, 0.28)',
};

const ghostButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  height: 40,
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.68)',
};

const routeStripStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 10,
};

const routeItemStyle: React.CSSProperties = {
  minHeight: 54,
  borderRadius: 14,
  padding: '10px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: 'rgba(15, 23, 42, 0.68)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const routeDotStyle: React.CSSProperties = {
  width: 24,
  height: 24,
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

const detailSectionStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 16,
  background: 'rgba(15, 23, 42, 0.58)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const detailSectionTitleStyle: React.CSSProperties = {
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

const courseMindMapGraphStyle: React.CSSProperties = {
  position: 'relative',
  minWidth: 1200,
  borderRadius: 20,
  overflow: 'hidden',
  background:
    'linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.46))',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const courseMindMapScrollStyle: React.CSSProperties = {
  overflowX: 'auto',
  paddingBottom: 4,
};

const mindLineSvgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

const mindCenterNodeStyle: React.CSSProperties = {
  position: 'absolute',
  borderRadius: 20,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  background: 'linear-gradient(145deg, rgba(8, 47, 73, 0.82), rgba(30, 41, 59, 0.72))',
  border: '1px solid rgba(56, 189, 248, 0.32)',
  boxShadow: '0 22px 50px rgba(2, 6, 23, 0.32)',
};

const mindCenterTitleStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontWeight: 800,
  textAlign: 'center',
  fontSize: 16,
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

const mindGraphBranchStyle: React.CSSProperties = {
  position: 'absolute',
  borderRadius: 16,
  padding: 14,
  overflowY: 'auto',
  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.94), rgba(8, 47, 73, 0.72))',
  border: '1px solid rgba(71, 85, 105, 0.38)',
  boxShadow: '0 18px 36px rgba(2, 6, 23, 0.22)',
};

const mindGraphBranchHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 10,
};

const mindGraphBranchDotStyle: React.CSSProperties = {
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

const mindGraphBranchTitleStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontWeight: 760,
  fontSize: 15,
  lineHeight: 1.35,
};

const mindGraphKnowledgeGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const mindGraphKnowledgeNodeStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: '7px 9px',
  flex: '1 1 136px',
  color: '#dbeafe',
  background: 'rgba(8, 47, 73, 0.5)',
  border: '1px solid rgba(56, 189, 248, 0.16)',
  fontSize: 12,
  lineHeight: 1.45,
};

const materialGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
  marginTop: 12,
};

const materialCardStyle: React.CSSProperties = {
  minHeight: 146,
  borderRadius: 14,
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  background: 'rgba(8, 47, 73, 0.34)',
  border: '1px solid rgba(56, 189, 248, 0.16)',
};

const materialCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 8,
};

const materialLinkStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: 0,
  marginTop: 10,
  color: '#8fb3ff',
};

const floatingWrapperStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 32,
  right: 32,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  zIndex: 1000,
};

const floatingTooltipStyle: React.CSSProperties = {
  background: 'white',
  color: '#1a1a1a',
  padding: '12px 16px',
  borderRadius: 12,
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  fontSize: 14,
  maxWidth: 260,
  lineHeight: 1.5,
  animation: 'fadeIn 0.5s ease-in-out',
};

const floatingButtonStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  fontSize: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 16px rgba(22, 93, 255, 0.4)',
  flexShrink: 0,
};

export default App;
