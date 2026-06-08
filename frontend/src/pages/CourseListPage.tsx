import React, { useMemo, useState } from 'react';
import { Card, Col, Row, Select, Space, Tag, Typography } from 'antd';
import {
  ArrowRightOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  courseColleges,
  courseGuidesByCollege,
  courseGuidesBySemester,
  courseSemesters,
  type CourseCollege,
  type CourseSemester,
} from '../data/buptCourses';

const { Title, Text, Paragraph } = Typography;

const CourseListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initCollege = (searchParams.get('college') as CourseCollege) || '北邮信通院';
  const initSemester = (searchParams.get('semester') as CourseSemester) || '大二下';

  const [selectedCollege, setSelectedCollege] = useState<CourseCollege>(initCollege);
  const [selectedSemester, setSelectedSemester] = useState<CourseSemester>(initSemester);

  const collegeSemesters = courseGuidesByCollege[selectedCollege] || courseGuidesBySemester;
  const semesterOptions = courseSemesters.filter((s) => Boolean(collegeSemesters[s]?.length));
  const semesterGuides = collegeSemesters[selectedSemester] || [];

  const handleCollegeChange = (college: CourseCollege) => {
    const nextSemesters = courseGuidesByCollege[college] || courseGuidesBySemester;
    const nextSemester = (courseSemesters.find((s) => nextSemesters[s]?.length) ||
      '大二下') as CourseSemester;
    setSelectedCollege(college);
    setSelectedSemester(nextSemester);
  };

  const allSemestersForCollege = useMemo(() => {
    return semesterOptions.map((semester) => ({
      semester,
      guides: collegeSemesters[semester] || [],
    }));
  }, [selectedCollege, semesterOptions, collegeSemesters]);

  const displayGuides = semesterGuides;

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Page header */}
      <div style={pageHeaderStyle}>
        <div>
          <Text style={eyebrowStyle}>Course Library</Text>
          <Title level={2} style={{ color: '#f8fafc', margin: '6px 0 10px' }}>
            课程库
          </Title>
          <Paragraph style={{ color: '#94a3b8', marginBottom: 0 }}>
            按学院和学期筛选课程，点击任意课程进入详情页。
          </Paragraph>
        </div>
        <Space wrap>
          <Select
            value={selectedCollege}
            onChange={handleCollegeChange}
            size="large"
            style={{ width: 160 }}
            options={courseColleges.map((c) => ({ value: c, label: c }))}
          />
          <Select
            value={selectedSemester}
            onChange={(v) => setSelectedSemester(v)}
            size="large"
            style={{ width: 180 }}
            options={semesterOptions.map((s) => ({
              value: s,
              label: `${s}（${collegeSemesters[s].length} 门）`,
            }))}
          />
        </Space>
      </div>

      {/* Semester overview strip */}
      <div style={semesterStripStyle}>
        {allSemestersForCollege.map(({ semester, guides }) => (
          <div
            key={semester}
            style={{
              ...semesterPillStyle,
              ...(semester === selectedSemester ? semesterPillActiveStyle : {}),
            }}
            onClick={() => setSelectedSemester(semester)}
          >
            <Text style={{ color: semester === selectedSemester ? '#bae6fd' : '#64748b', fontSize: 13 }}>
              {semester}
            </Text>
            <Text style={{ color: semester === selectedSemester ? '#7dd3fc' : '#475569', fontSize: 11 }}>
              {guides.length} 门
            </Text>
          </div>
        ))}
      </div>

      {/* Course cards */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {displayGuides.length === 0 && (
          <Col span={24}>
            <div style={emptyStyle}>
              <BookOutlined style={{ fontSize: 40, color: '#334155', marginBottom: 12 }} />
              <Text style={{ color: '#64748b' }}>暂无课程</Text>
            </div>
          </Col>
        )}
        {displayGuides.map((guide) => (
          <Col key={guide.slug} xs={24} sm={12} lg={8}>
            <Card
              style={courseCardStyle}
              bodyStyle={{ padding: 24 }}
              hoverable
              onClick={() => navigate(`/course/${guide.slug}`)}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={courseIconStyle}>
                    <BookOutlined style={{ color: '#38bdf8', fontSize: 18 }} />
                  </div>
                  <Tag style={semesterTagStyle}>{selectedSemester}</Tag>
                </div>
                <div>
                  <Tag style={shortTitleTagStyle}>{guide.shortTitle}</Tag>
                  <Title level={4} style={{ color: '#f8fafc', margin: '8px 0 4px' }}>
                    {guide.title}
                  </Title>
                  <Paragraph
                    style={{ color: '#94a3b8', margin: 0, fontSize: 13, lineHeight: 1.7 }}
                    ellipsis={{ rows: 2 }}
                  >
                    {guide.summary}
                  </Paragraph>
                </div>
                <div style={routePreviewStyle}>
                  {guide.route.slice(0, 3).map((item, i) => (
                    <Tag key={item} style={routeTagStyle}>
                      {i + 1}. {item}
                    </Tag>
                  ))}
                  {guide.route.length > 3 && (
                    <Tag style={moreTagStyle}>+{guide.route.length - 3} 更多</Tag>
                  )}
                </div>
                <div style={cardFooterStyle}>
                  <Text style={{ color: '#475569', fontSize: 12 }}>
                    {guide.chapters?.length || 0} 章节 · {guide.mindMap?.length || 0} 知识模块
                  </Text>
                  <ArrowRightOutlined style={{ color: '#38bdf8', fontSize: 14 }} />
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

const pageHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 20,
  marginBottom: 24,
};

const eyebrowStyle: React.CSSProperties = {
  color: '#8fb3ff',
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
};

const semesterStripStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const semesterPillStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  padding: '10px 18px',
  borderRadius: 12,
  border: '1px solid rgba(71, 85, 105, 0.3)',
  background: 'rgba(15, 23, 42, 0.5)',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const semesterPillActiveStyle: React.CSSProperties = {
  border: '1px solid rgba(56, 189, 248, 0.4)',
  background: 'rgba(8, 47, 73, 0.6)',
};

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '80px 0',
};

const courseCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid rgba(71, 85, 105, 0.28)',
  background: 'rgba(9, 16, 28, 0.88)',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const courseIconStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(56, 189, 248, 0.1)',
  border: '1px solid rgba(56, 189, 248, 0.2)',
};

const shortTitleTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '3px 10px',
  color: '#bae6fd',
  background: 'rgba(14, 165, 233, 0.14)',
  border: '1px solid rgba(56, 189, 248, 0.28)',
  fontSize: 12,
};

const semesterTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '3px 10px',
  color: '#c4b5fd',
  background: 'rgba(79, 70, 229, 0.14)',
  border: '1px solid rgba(129, 140, 248, 0.28)',
  fontSize: 12,
};

const routePreviewStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
};

const routeTagStyle: React.CSSProperties = {
  borderRadius: 8,
  padding: '3px 8px',
  color: '#94a3b8',
  background: 'rgba(30, 41, 59, 0.7)',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  fontSize: 11,
};

const moreTagStyle: React.CSSProperties = {
  borderRadius: 8,
  padding: '3px 8px',
  color: '#64748b',
  background: 'transparent',
  border: '1px solid rgba(71, 85, 105, 0.2)',
  fontSize: 11,
};

const cardFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 10,
  borderTop: '1px solid rgba(71, 85, 105, 0.18)',
};

export default CourseListPage;
