import React, { useState } from 'react';
import { Button, Card, Col, Row, Select, Space, Tag, Typography } from 'antd';
import {
  ApartmentOutlined,
  ArrowRightOutlined,
  BookOutlined,
  RobotOutlined,
  ScheduleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  courseColleges,
  courseGuidesByCollege,
  courseGuidesBySemester,
  courseSemesters,
  type CourseCollege,
  type CourseSemester,
} from '../data/buptCourses';

const { Title, Text, Paragraph } = Typography;

const features = [
  {
    icon: <BookOutlined style={{ fontSize: 28, color: '#38bdf8' }} />,
    title: '课程路线',
    desc: '按学院、学期整理的系统化学习路线，清楚知道先学什么、后学什么。',
    color: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.22)',
  },
  {
    icon: <ApartmentOutlined style={{ fontSize: 28, color: '#818cf8' }} />,
    title: '知识图谱',
    desc: '每门课的核心知识点可视化脑图，帮你在复习时快速定位重点板块。',
    color: 'rgba(129, 140, 248, 0.12)',
    border: 'rgba(129, 140, 248, 0.22)',
  },
  {
    icon: <ScheduleOutlined style={{ fontSize: 28, color: '#34d399' }} />,
    title: '章节重点',
    desc: '详细的章节拆解 + 考点 Checklist，考前复习效率翻倍。',
    color: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.22)',
  },
  {
    icon: <RobotOutlined style={{ fontSize: 28, color: '#f472b6' }} />,
    title: 'AI 助手',
    desc: '基于课程内容的智能 Q&A，随时问随时答，不用自己翻书对答案。',
    color: 'rgba(244, 114, 182, 0.12)',
    border: 'rgba(244, 114, 182, 0.22)',
  },
  {
    icon: <StarOutlined style={{ fontSize: 28, color: '#fbbf24' }} />,
    title: '公开课推荐',
    desc: '精选每门课对应的 B 站视频、MOOC、教材，省去搜索时间。',
    color: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.22)',
  },
];

const stats = [
  { value: '6+', label: '课程收录' },
  { value: '8', label: '知识图谱模块 / 课' },
  { value: '100%', label: '人工审核' },
  { value: '持续', label: '更新迭代' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCollege, setSelectedCollege] = useState<CourseCollege>('北邮信通院');
  const [selectedSemester, setSelectedSemester] = useState<CourseSemester>('大二下');

  const collegeSemesters = courseGuidesByCollege[selectedCollege] || courseGuidesBySemester;
  const semesterOptions = courseSemesters.filter(
    (semester) => Boolean(collegeSemesters[semester]?.length),
  );

  const handleCollegeChange = (college: CourseCollege) => {
    const nextSemesters = courseGuidesByCollege[college] || courseGuidesBySemester;
    const nextSemester = (courseSemesters.find((s) => nextSemesters[s]?.length) ||
      '大二下') as CourseSemester;
    setSelectedCollege(college);
    setSelectedSemester(nextSemester);
  };

  const handleExplore = () => {
    navigate(`/courses?college=${encodeURIComponent(selectedCollege)}&semester=${encodeURIComponent(selectedSemester)}`);
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Hero */}
      <Card style={heroCardStyle} bodyStyle={{ padding: '52px 48px' }}>
        <Row gutter={[40, 40]} align="middle">
          <Col xs={24} lg={13}>
            <Space direction="vertical" size={18}>
              <Space wrap>
                <Tag style={accentTagStyle}>北邮信通院 · 在用</Tag>
                <Tag style={softTagStyle}>人工整理 + AI 辅助</Tag>
                <Tag style={softTagStyle}>持续更新</Tag>
              </Space>
              <Title style={{ color: '#f8fafc', margin: 0, fontSize: 40, lineHeight: 1.22 }}>
                选一门课，<br />直接看路线
              </Title>
              <Paragraph style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.8, marginBottom: 0 }}>
                北邮课程路线系统——按学院和学期整理课程学习路线、知识图谱和章节重点，
                配合 AI 助手，帮你高效搞定每一门核心课。
              </Paragraph>
              <Space wrap size={14}>
                <Button
                  type="primary"
                  size="large"
                  icon={<BookOutlined />}
                  onClick={() => navigate('/courses')}
                  style={primaryButtonStyle}
                >
                  浏览课程库
                </Button>
                <Button
                  size="large"
                  icon={<RobotOutlined />}
                  onClick={() => navigate('/ai')}
                  style={ghostButtonStyle}
                >
                  试试 AI 助手
                </Button>
              </Space>
            </Space>
          </Col>

          <Col xs={24} lg={11}>
            <div style={quickStartPanelStyle}>
              <Text style={eyebrowStyle}>Quick Start</Text>
              <Title level={4} style={{ color: '#f8fafc', margin: '6px 0 16px' }}>
                直接选课，开始学习
              </Title>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Select
                  value={selectedCollege}
                  onChange={handleCollegeChange}
                  size="large"
                  style={{ width: '100%' }}
                  options={courseColleges.map((c) => ({ value: c, label: c }))}
                />
                <Select
                  value={selectedSemester}
                  onChange={(v) => setSelectedSemester(v)}
                  size="large"
                  style={{ width: '100%' }}
                  options={semesterOptions.map((s) => ({
                    value: s,
                    label: `${s}（${collegeSemesters[s].length} 门）`,
                  }))}
                />
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<ArrowRightOutlined />}
                  onClick={handleExplore}
                  style={primaryButtonStyle}
                >
                  查看课程列表
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ margin: '28px 0' }}>
        {stats.map((s) => (
          <Col key={s.label} xs={12} sm={6}>
            <Card style={statCardStyle} bodyStyle={{ padding: '20px 24px' }}>
              <Title level={2} style={{ color: '#38bdf8', margin: 0 }}>
                {s.value}
              </Title>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>{s.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Features */}
      <div style={{ marginBottom: 12 }}>
        <Text style={sectionEyebrowStyle}>Platform Features</Text>
        <Title level={3} style={{ color: '#f8fafc', margin: '6px 0 24px' }}>
          有什么功能？
        </Title>
      </div>
      <Row gutter={[16, 16]}>
        {features.map((f) => (
          <Col key={f.title} xs={24} sm={12} lg={8}>
            <Card
              style={{ ...featureCardStyle, background: f.color, border: `1px solid ${f.border}` }}
              bodyStyle={{ padding: 24 }}
            >
              <Space direction="vertical" size={12}>
                {f.icon}
                <Title level={5} style={{ color: '#f8fafc', margin: 0 }}>
                  {f.title}
                </Title>
                <Text style={{ color: '#94a3b8', lineHeight: 1.75 }}>{f.desc}</Text>
              </Space>
            </Card>
          </Col>
        ))}
        {/* CTA card */}
        <Col xs={24} sm={12} lg={8}>
          <Card
            style={{ ...featureCardStyle, background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', cursor: 'pointer' }}
            bodyStyle={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
            onClick={() => navigate('/courses')}
          >
            <Title level={4} style={{ color: '#38bdf8', margin: '0 0 12px' }}>
              开始探索 →
            </Title>
            <Text style={{ color: '#64748b' }}>选择学院和课程，进入课程详情页</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const heroCardStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid rgba(125, 211, 252, 0.16)',
  background: 'linear-gradient(145deg, rgba(14, 24, 40, 0.98), rgba(17, 30, 48, 0.96))',
  boxShadow: '0 24px 48px rgba(2, 6, 23, 0.28)',
};

const quickStartPanelStyle: React.CSSProperties = {
  borderRadius: 18,
  padding: 24,
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
};

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.1)',
  background: 'rgba(9, 16, 28, 0.86)',
};

const featureCardStyle: React.CSSProperties = {
  borderRadius: 18,
  minHeight: 160,
};

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  height: 44,
  background: 'linear-gradient(90deg, #0891b2, #4f46e5)',
  border: 'none',
  fontWeight: 600,
};

const ghostButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  height: 44,
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.68)',
};

const eyebrowStyle: React.CSSProperties = {
  color: '#8fb3ff',
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
};

const sectionEyebrowStyle: React.CSSProperties = {
  color: '#8fb3ff',
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
};

const accentTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 12px',
  color: '#bae6fd',
  background: 'rgba(14, 165, 233, 0.14)',
  border: '1px solid rgba(56, 189, 248, 0.28)',
};

const softTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 10px',
  color: '#cbd5e1',
  background: 'rgba(30, 41, 59, 0.78)',
  border: '1px solid rgba(71, 85, 105, 0.35)',
};

export default HomePage;
