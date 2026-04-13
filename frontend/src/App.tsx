import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  Layout,
  message,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowRightOutlined,
  BookOutlined,
  BranchesOutlined,
  BulbOutlined,
  FileTextOutlined,
  NodeIndexOutlined,
  ReloadOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import ProfileForm from './components/Profile/ProfileForm';
import RecommendationList from './components/Recommendations/RecommendationList';
import RoadmapCanvas from './components/Roadmap/RoadmapCanvas';
import {
  generateRoadmap,
  chatRetrieve,
  getCourseNodeDetail,
  getCourseNodes,
  getRecommendations,
  getResources,
} from './services/api';
import type {
  ChatRetrieveResponse,
  CourseNode,
  CourseNodeDetail,
  Recommendation,
  Resource,
  RoadmapResponse,
} from './types';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

type StageStatus = 'done' | 'active' | 'pending';

interface WorkspaceStage {
  key: string;
  title: string;
  description: string;
  status: StageStatus;
}

const stagePalette: Record<StageStatus, { bg: string; border: string; text: string; label: string }> = {
  done: {
    bg: 'rgba(32, 201, 151, 0.14)',
    border: 'rgba(32, 201, 151, 0.35)',
    text: '#9ff0d2',
    label: '已完成',
  },
  active: {
    bg: 'rgba(255, 196, 61, 0.14)',
    border: 'rgba(255, 196, 61, 0.36)',
    text: '#ffe08a',
    label: '进行中',
  },
  pending: {
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.24)',
    text: '#cbd5e1',
    label: '待开始',
  },
};

const App: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [goalPrompt, setGoalPrompt] = useState('我想补齐 AI 方向基础，并尽快形成一条可执行的学习路径。');
  const [courseNodes, setCourseNodes] = useState<CourseNode[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [selectedRoadmapSlug, setSelectedRoadmapSlug] = useState<string | null>(null);
  const [selectedCourseNodeDetail, setSelectedCourseNodeDetail] = useState<CourseNodeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fallbackResources, setFallbackResources] = useState<Resource[]>([]);
  const [question, setQuestion] = useState('这个阶段我应该优先看哪些资料？');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResult, setChatResult] = useState<ChatRetrieveResponse | null>(null);

  const hasResults = recommendations.length > 0;
  const hasRoadmap = Boolean(roadmap?.nodes?.length);
  const workspaceState = loading || roadmapLoading ? 'loading' : hasResults || hasRoadmap ? 'ready' : 'idle';

  const selectedRecommendation = useMemo(() => {
    if (!recommendations.length) {
      return null;
    }

    if (selectedCourseId !== null) {
      const matched = recommendations.find((item) => item.course.id === selectedCourseId);
      if (matched) {
        return matched;
      }
    }

    return recommendations[0];
  }, [recommendations, selectedCourseId]);

  const selectedRoadmapNode = useMemo(() => {
    if (!roadmap?.nodes?.length) {
      return null;
    }
    return roadmap.nodes.find((item) => item.slug === selectedRoadmapSlug) || roadmap.nodes[0];
  }, [roadmap, selectedRoadmapSlug]);

  const workspaceStages = useMemo<WorkspaceStage[]>(() => {
    return [
      {
        key: 'profile',
        title: '学习画像',
        description: hasResults ? '已完成目标解析与基础信息整理' : '填写基础信息、目标方向和职业偏好',
        status: hasResults ? 'done' : 'active',
      },
      {
        key: 'recommendation',
        title: '课程推荐',
        description: hasResults ? `已生成 ${recommendations.length} 条课程推荐结果` : '根据画像生成初始推荐列表',
        status: hasResults ? 'done' : 'pending',
      },
      {
        key: 'roadmap',
        title: '路线图草案',
        description: hasResults ? '已根据推荐结果生成一版学习路径草案' : '等待推荐结果后组织学习路线',
        status: hasResults ? 'active' : 'pending',
      },
    ];
  }, [hasResults, recommendations.length]);

  const resourceDrafts = useMemo(() => {
    if (selectedCourseNodeDetail?.resources?.length) {
      return selectedCourseNodeDetail.resources.map((item) => ({
        type: item.resource_type || 'resource',
        title: item.title,
        description: item.url || '已关联到当前课程节点，可进一步接入资源详情页。',
      }));
    }

    if (fallbackResources.length) {
      return fallbackResources.slice(0, 3).map((item) => ({
        type: item.resource_type || 'resource',
        title: item.title,
        description: item.summary || item.url || '已从真实资源接口拉取。',
      }));
    }

    if (!selectedRecommendation && !selectedRoadmapNode) {
      return [];
    }

    const title = selectedRoadmapNode?.title || selectedRecommendation?.course.title || '当前节点';
    const topics = selectedRecommendation?.course.topics || [];
    const prerequisites = selectedRecommendation?.course.prerequisites || [];

    return [
      {
        type: '课程主页',
        title: `${title} 官方入口`,
        description: '用于查看课程主页、教学安排和报名方式。',
      },
      {
        type: '知识重点',
        title: `${title} 核心主题`,
        description: `围绕 ${topics.slice(0, 2).join('、') || '课程主题'} 建立预习与复习资料集合。`,
      },
      {
        type: '学习动作',
        title: '下一步建议',
        description: prerequisites.length
          ? `建议先检查这些前置：${prerequisites.slice(0, 2).join('、')}`
          : '当前可以直接开始，优先浏览课程说明与第一讲内容。',
      },
    ];
  }, [fallbackResources, selectedCourseNodeDetail, selectedRecommendation, selectedRoadmapNode]);

  const roadmapSummary = useMemo(() => {
    if (roadmap?.nodes?.length) {
      const pathNodes = roadmap.nodes.slice(0, 6);
      const activeIndex = pathNodes.findIndex((item) => item.slug === selectedRoadmapNode?.slug);
      const currentIndex = activeIndex >= 0 ? activeIndex : 0;
      const current = pathNodes[currentIndex];
      const previous = currentIndex > 0 ? pathNodes[currentIndex - 1] : null;
      const next = currentIndex < pathNodes.length - 1 ? pathNodes[currentIndex + 1] : null;

      return {
        totalStages: pathNodes.length,
        currentStage: currentIndex + 1,
        currentTitle: current.title,
        previousTitle: previous?.title ?? '目标澄清 / 基础盘点',
        nextTitle: next?.title ?? '开始做项目或进入下一轮深入学习',
        stageFocus: current.summary ? [current.summary] : [current.difficulty || '当前阶段'],
      };
    }

    const pathCourses = recommendations.slice(0, 4);
    if (!pathCourses.length) {
      return null;
    }
    const activeIndex = pathCourses.findIndex((item) => item.course.id === selectedRecommendation?.course.id);
    const currentIndex = activeIndex >= 0 ? activeIndex : 0;
    const current = pathCourses[currentIndex];
    const previous = currentIndex > 0 ? pathCourses[currentIndex - 1] : null;
    const next = currentIndex < pathCourses.length - 1 ? pathCourses[currentIndex + 1] : null;

    return {
      totalStages: pathCourses.length,
      currentStage: currentIndex + 1,
      currentTitle: current.course.title,
      previousTitle: previous?.course.title ?? '目标澄清 / 基础盘点',
      nextTitle: next?.course.title ?? '开始做项目或进入下一轮深入学习',
      stageFocus: current.course.topics.slice(0, 3),
    };
  }, [recommendations, roadmap, selectedRecommendation, selectedRoadmapNode]);

  useEffect(() => {
    const run = async () => {
      try {
        const [nodes, resources] = await Promise.all([
          getCourseNodes(),
          getResources({ limit: 6, status: 'approved' }),
        ]);
        setCourseNodes(nodes);
        setFallbackResources(resources);
      } catch (error) {
        console.error('初始化课程节点/资源失败:', error);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const slug = selectedRoadmapNode?.slug;
    if (!slug || !courseNodes.length) {
      setSelectedCourseNodeDetail(null);
      return;
    }

    const matched = courseNodes.find((item) => item.slug === slug);
    if (!matched) {
      setSelectedCourseNodeDetail(null);
      return;
    }

    const run = async () => {
      setDetailLoading(true);
      try {
        const detail = await getCourseNodeDetail(matched.id);
        setSelectedCourseNodeDetail(detail);
      } catch (error) {
        console.error('获取课程节点详情失败:', error);
        setSelectedCourseNodeDetail(null);
      } finally {
        setDetailLoading(false);
      }
    };
    run();
  }, [courseNodes, selectedRoadmapNode]);

  const handleProfileSuccess = async (id: number) => {
    setProfileId(id);
    setLoading(true);

    try {
      const recs = await getRecommendations(id, 5);
      setRecommendations(recs);
      setSelectedCourseId(recs[0]?.course.id ?? null);
      message.success('工作台已生成首批学习建议。');
    } catch (error) {
      console.error('获取推荐失败:', error);
      message.error('推荐结果加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendations([]);
    setProfileId(null);
    setSelectedCourseId(null);
    setGoalPrompt('我想补齐 AI 方向基础，并尽快形成一条可执行的学习路径。');
    setRoadmap(null);
    setSelectedRoadmapSlug(null);
    setSelectedCourseNodeDetail(null);
  };

  const handleGenerateRoadmap = async () => {
    if (!goalPrompt.trim()) {
      message.warning('先输入一个学习目标，再生成路线图。');
      return;
    }

    setRoadmapLoading(true);
    try {
      const result = await generateRoadmap(goalPrompt.trim());
      setRoadmap(result);
      setSelectedRoadmapSlug(result.nodes[0]?.slug ?? null);
      message.success('已接入后端真实路线图接口。');
    } catch (error) {
      console.error('生成路线图失败:', error);
      message.error('路线图生成失败，请检查后端服务或稍后重试。');
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      message.warning('先输入一个问题，再开始检索。');
      return;
    }

    setChatLoading(true);
    try {
      const result = await chatRetrieve(question.trim());
      setChatResult(result);
      message.success('已返回基于站内资料的回答。');
    } catch (error) {
      console.error('检索问答失败:', error);
      message.error('检索问答失败，请检查后端服务或稍后重试。');
    } finally {
      setChatLoading(false);
    }
  };

  const renderRoadmapPanel = () => {
    if (!hasResults) {
      return (
        <Card style={panelCardStyle} bodyStyle={{ padding: 28 }}>
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <div>
              <Text style={sectionEyebrowStyle}>Roadmap Preview</Text>
              <Title level={3} style={sectionTitleStyle}>
                路线图会在这里展开
              </Title>
              <Paragraph style={mutedParagraphStyle}>
                先在左侧完成学习画像，系统会根据你的目标生成一版分阶段路径。下一版我们会把这里升级成真正的 React Flow 课程图谱。
              </Paragraph>
            </div>

            <div style={emptyStateBoxStyle}>
              <NodeIndexOutlined style={{ fontSize: 28, color: '#8fb3ff' }} />
              <Text style={{ color: '#cbd5e1', fontSize: 15 }}>
                还没有生成路径节点
              </Text>
            </div>
          </Space>
        </Card>
      );
    }

    return (
      <Card style={panelCardStyle} bodyStyle={{ padding: 28 }}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <Text style={sectionEyebrowStyle}>Roadmap Draft</Text>
              <Title level={3} style={sectionTitleStyle}>
                学习路径草案
              </Title>
              <Paragraph style={mutedParagraphStyle}>
                当前先用卡片流展示路径结构，后续会替换为真正的节点图和连线交互。
              </Paragraph>
            </div>
            <Tag style={accentTagStyle}>
              {roadmap?.nodes?.length ? roadmap.nodes.length : Math.min(recommendations.length, 4)} 个阶段
            </Tag>
          </div>
          <RoadmapCanvas
            recommendations={recommendations}
            roadmap={roadmap}
            activeCourseId={selectedRecommendation?.course.id ?? null}
            activeRoadmapSlug={selectedRoadmapNode?.slug ?? null}
            onSelectCourse={setSelectedCourseId}
            onSelectRoadmapNode={setSelectedRoadmapSlug}
          />

          {roadmapSummary ? (
            <div style={roadmapSummaryStyle}>
              <div style={roadmapSummaryHeaderStyle}>
                <div>
                  <Text style={detailSectionTitleStyle}>当前路径摘要</Text>
                  <Title level={4} style={{ color: '#f8fafc', margin: '4px 0 0' }}>
                    第 {roadmapSummary.currentStage} 阶段：{roadmapSummary.currentTitle}
                  </Title>
                </div>
                <Tag style={accentTagStyle}>{roadmapSummary.totalStages} 段路径</Tag>
              </div>

              <Row gutter={[12, 12]}>
                <Col xs={24} md={8}>
                  <div style={roadmapSummaryCardStyle}>
                    <Text style={detailSectionTitleStyle}>上一阶段</Text>
                    <Text style={roadmapSummaryTextStyle}>{roadmapSummary.previousTitle}</Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={roadmapSummaryCardStyle}>
                    <Text style={detailSectionTitleStyle}>当前关注</Text>
                    <Space wrap size={[8, 8]} style={{ marginTop: 10 }}>
                      {roadmapSummary.stageFocus.map((topic) => (
                        <Tag key={topic} style={topicTagStyle}>
                          {topic}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={roadmapSummaryCardStyle}>
                    <Text style={detailSectionTitleStyle}>下一阶段</Text>
                    <Text style={roadmapSummaryTextStyle}>{roadmapSummary.nextTitle}</Text>
                  </div>
                </Col>
              </Row>
            </div>
          ) : null}
        </Space>
      </Card>
    );
  };

  const renderDetailPanel = () => {
    if (!selectedRecommendation && !selectedRoadmapNode && !selectedCourseNodeDetail) {
      return (
        <Card style={panelCardStyle} bodyStyle={{ padding: 28 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#94a3b8' }}>还没有可展示的课程详情</span>}
          />
        </Card>
      );
    }

    const course = selectedRecommendation?.course;
    const scoreBreakdown = selectedRecommendation?.score_breakdown;
    const recommendationReason = selectedRecommendation?.recommendation_reason;
    const matchScore = selectedRecommendation?.match_score;
    const detailTitle = selectedCourseNodeDetail?.title || selectedRoadmapNode?.title || course?.title;
    const detailSummary =
      selectedCourseNodeDetail?.summary ||
      selectedRoadmapNode?.summary ||
      course?.description ||
      '当前课程暂无详细描述，可以在下一步接入资源元数据与课程说明。';
    const detailDifficulty =
      selectedCourseNodeDetail?.difficulty || selectedRoadmapNode?.difficulty || course?.difficulty_level;

    return (
      <Card style={panelCardStyle} bodyStyle={{ padding: 28 }}>
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <div>
            <Text style={sectionEyebrowStyle}>Artifacts</Text>
            <Title level={3} style={sectionTitleStyle}>
              课程详情面板
            </Title>
            <Paragraph style={mutedParagraphStyle}>
              这里对应未来 Workspace 右侧的资源与结果展示区。现在先展示课程摘要、推荐理由和评分拆解。
            </Paragraph>
          </div>

          <div style={detailHeroStyle}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Space wrap size={[8, 8]}>
                {course?.institution ? <Tag style={accentTagStyle}>{course.institution}</Tag> : null}
                {detailDifficulty ? <Tag style={softTagStyle}>{detailDifficulty}</Tag> : null}
                {course?.platform ? <Tag style={softTagStyle}>{course.platform}</Tag> : null}
                {selectedCourseNodeDetail ? <Tag style={softTagStyle}>真实节点详情</Tag> : null}
              </Space>
              <Title level={4} style={{ color: '#f8fafc', margin: 0 }}>
                {detailTitle}
              </Title>
              <Text style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
                {detailSummary}
              </Text>
            </Space>
          </div>

          {recommendationReason ? (
            <div style={reasonCardStyle}>
              <Text style={{ color: '#8fb3ff', fontSize: 12, display: 'block', marginBottom: 8 }}>推荐理由</Text>
              <Text style={{ color: '#e2e8f0', lineHeight: 1.8 }}>{recommendationReason}</Text>
            </div>
          ) : null}

          {scoreBreakdown ? (
            <Row gutter={[12, 12]}>
              {[
                ['语言匹配', scoreBreakdown.language_match],
                ['难度适配', scoreBreakdown.difficulty_match],
                ['主题相关', scoreBreakdown.domain_relevance],
                ['前置满足', scoreBreakdown.prerequisite_fit],
              ].map(([label, value]) => (
                <Col span={12} key={label}>
                  <div style={metricCardStyle}>
                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>{label}</Text>
                    <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: 700 }}>{value}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          ) : null}

          <div style={detailSectionStyle}>
            <Text style={detailSectionTitleStyle}>主题标签</Text>
            <Space wrap size={[8, 8]}>
              {(course?.topics || []).map((topic) => (
                <Tag key={topic} style={topicTagStyle}>
                  {topic}
                </Tag>
              ))}
              {selectedRoadmapNode?.summary && !course?.topics?.length ? (
                <Tag style={topicTagStyle}>{selectedRoadmapNode.summary}</Tag>
              ) : null}
            </Space>
          </div>

          <div style={detailSectionStyle}>
            <Text style={detailSectionTitleStyle}>前置建议</Text>
            <Space wrap size={[8, 8]}>
              {selectedCourseNodeDetail?.prerequisites?.length ? (
                selectedCourseNodeDetail.prerequisites.map((item) => (
                  <Tag key={item.id} style={softTagStyle}>
                    {item.title}
                  </Tag>
                ))
              ) : course?.prerequisites?.length ? (
                course.prerequisites.map((item) => (
                  <Tag key={item} style={softTagStyle}>
                    {item}
                  </Tag>
                ))
              ) : (
                <Tag style={softTagStyle}>可直接开始</Tag>
              )}
            </Space>
          </div>

          <div style={detailSectionStyle}>
            <Text style={detailSectionTitleStyle}>资源草稿区</Text>
            <div style={{ display: 'grid', gap: 10 }}>
              {resourceDrafts.map((item) => (
                <div key={item.title} style={resourceCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <Text style={{ color: '#f8fafc', fontWeight: 600 }}>{item.title}</Text>
                    <Tag style={softTagStyle}>{item.type}</Tag>
                  </div>
                  <Text style={{ color: '#cbd5e1', lineHeight: 1.7 }}>{item.description}</Text>
                </div>
              ))}
            </div>
          </div>

          <div style={detailFooterStyle}>
            <div>
              <Text style={{ color: '#94a3b8', fontSize: 12, display: 'block' }}>综合匹配度</Text>
              <Text style={{ color: '#f8fafc', fontSize: 30, fontWeight: 700 }}>
                {matchScore ? Math.round(matchScore) : detailLoading ? '...' : selectedCourseNodeDetail ? 'NODE' : '--'}
              </Text>
            </div>
            {course?.url ? (
              <Button type="primary" href={course.url} target="_blank" style={primaryButtonStyle}>
                查看课程
              </Button>
            ) : (
              <Button style={ghostButtonStyle}>
                {selectedCourseNodeDetail ? '节点详情已接入' : '资源待接入'}
              </Button>
            )}
          </div>
        </Space>
      </Card>
    );
  };

  return (
    <Layout style={appLayoutStyle}>
      <Header style={headerStyle}>
        <div style={brandStyle}>
          <div style={brandIconStyle}>
            <RobotOutlined />
          </div>
          <div>
            <Text style={{ color: '#8fb3ff', fontSize: 12, letterSpacing: 1.2 }}>AI LEARNING WORKSPACE</Text>
            <Title level={4} style={{ margin: 0, color: '#f8fafc' }}>
              AI 学习资源站
            </Title>
          </div>
        </div>

        <Space>
          <Tag style={headerTagStyle}>{profileId ? `画像 #${profileId}` : '未生成画像'}</Tag>
          <Button icon={<ReloadOutlined />} onClick={handleReset} style={ghostButtonStyle}>
            重新开始
          </Button>
        </Space>
      </Header>

      <Content style={contentStyle}>
        <Card style={statusCardStyle} bodyStyle={{ padding: 18 }}>
          <div style={statusRowStyle}>
            <div>
              <Text style={sectionEyebrowStyle}>Workspace State</Text>
              <Title level={4} style={{ color: '#f8fafc', margin: '4px 0 6px' }}>
                {workspaceState === 'loading'
                  ? '正在生成推荐与路径草案'
                  : workspaceState === 'ready'
                    ? '工作台已生成首批结果'
                    : '等待输入学习画像'}
              </Title>
              <Text style={{ color: '#94a3b8' }}>
                {workspaceState === 'loading'
                  ? '前端正在等待推荐结果返回，右侧结果区会在完成后自动填充。'
                  : workspaceState === 'ready'
                    ? '你现在可以查看路线图、切换推荐项，并检查右侧课程与资源草稿区。'
                    : '先填写左侧画像，或者先写一个目标草稿，再开始生成第一版学习工作流。'}
              </Text>
            </div>

            <Space wrap size={[8, 8]}>
              <Tag style={workspaceState === 'idle' ? stateIdleTagStyle : softTagStyle}>待开始</Tag>
              <Tag style={workspaceState === 'loading' ? stateLoadingTagStyle : softTagStyle}>生成中</Tag>
              <Tag style={workspaceState === 'ready' ? stateReadyTagStyle : softTagStyle}>已生成</Tag>
            </Space>
          </div>
        </Card>

        <Row gutter={[20, 20]}>
          <Col xs={24} xl={8}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <Card style={heroCardStyle} bodyStyle={{ padding: 28 }}>
                <Space direction="vertical" size={18} style={{ width: '100%' }}>
                  <Space>
                    <Tag style={accentTagStyle}>Workspace</Tag>
                    <Tag style={softTagStyle}>Phase 1</Tag>
                  </Space>

                  <div>
                    <Title level={2} style={{ color: '#f8fafc', marginBottom: 12 }}>
                      从画像到路线图，先搭出一套能工作的骨架
                    </Title>
                    <Paragraph style={mutedParagraphStyle}>
                      这一版先把现有推荐系统升级成工作台入口。左侧保留画像录入，右侧开始承载路线图草案和结果详情，方便我们继续往 Claude 式 Workspace 演进。
                    </Paragraph>
                  </div>

                  <Space wrap size={[10, 10]}>
                    <Tag style={softTagStyle}>
                      <ThunderboltOutlined /> 推荐引擎复用
                    </Tag>
                    <Tag style={softTagStyle}>
                      <NodeIndexOutlined /> 路线图区预留
                    </Tag>
                    <Tag style={softTagStyle}>
                      <BookOutlined /> 资源详情右栏
                    </Tag>
                  </Space>
                </Space>
              </Card>

              <Card style={panelCardStyle} bodyStyle={{ padding: 24 }}>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <div>
                      <Text style={sectionEyebrowStyle}>Input Panel</Text>
                      <Title level={4} style={{ margin: '4px 0 0', color: '#f8fafc' }}>
                        学习画像输入区
                      </Title>
                    </div>
                    <Button
                      type="primary"
                      icon={<ArrowRightOutlined />}
                      onClick={() => {
                        const element = document.getElementById('workspace-profile-form');
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      style={primaryButtonStyle}
                    >
                      开始填写
                    </Button>
                  </div>
                  <Paragraph style={mutedParagraphStyle}>
                    当前仍复用原有三步表单，下一步会把它改成更像对话流的输入体验。
                  </Paragraph>
                </Space>
              </Card>

              <Card style={panelCardStyle} bodyStyle={{ padding: 24 }}>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div>
                    <Text style={sectionEyebrowStyle}>Goal Draft</Text>
                    <Title level={4} style={{ margin: '4px 0 8px', color: '#f8fafc' }}>
                      目标输入草稿
                    </Title>
                    <Paragraph style={mutedParagraphStyle}>
                      这块是后续对话式输入区的前身。现在先让你能输入一个更像自然语言任务的目标，后面我们会把它真正接入路径生成接口。
                    </Paragraph>
                  </div>

                  <Space wrap size={[8, 8]}>
                    {[
                      '两个月补齐机器学习和深度学习基础',
                      '准备 AI 方向课程设计，想要一条路线图',
                      '优先学能快速上手项目的课程',
                    ].map((item) => (
                      <Tag
                        key={item}
                        style={{ ...softTagStyle, cursor: 'pointer' }}
                        onClick={() => setGoalPrompt(item)}
                      >
                        {item}
                      </Tag>
                    ))}
                  </Space>

                  <Input.TextArea
                    value={goalPrompt}
                    onChange={(event) => setGoalPrompt(event.target.value)}
                    autoSize={{ minRows: 4, maxRows: 6 }}
                    placeholder="输入你的目标，例如：我想补完 DSP 前置课程，并找到对应资料。"
                    style={goalInputStyle}
                  />

                  <div style={goalFooterStyle}>
                    <Text style={{ color: '#94a3b8' }}>
                      当前状态：前端已预留目标输入区，等待后端 `roadmaps/generate` 接口接入。
                    </Text>
                    <Button
                      icon={<SendOutlined />}
                      style={ghostButtonStyle}
                      onClick={handleGenerateRoadmap}
                      loading={roadmapLoading}
                    >
                      生成路线
                    </Button>
                  </div>
                </Space>
              </Card>

              <Card id="workspace-profile-form" style={panelCardStyle} bodyStyle={{ padding: 22 }}>
                <ProfileForm onSuccess={handleProfileSuccess} />
              </Card>

              <Card style={panelCardStyle} bodyStyle={{ padding: 24 }}>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div>
                    <Text style={sectionEyebrowStyle}>Pipeline</Text>
                    <Title level={4} style={{ margin: '4px 0 0', color: '#f8fafc' }}>
                      当前工作流
                    </Title>
                  </div>
                  {workspaceStages.map((stage) => {
                    const palette = stagePalette[stage.status];
                    return (
                      <div
                        key={stage.key}
                        style={{
                          background: palette.bg,
                          border: `1px solid ${palette.border}`,
                          borderRadius: 16,
                          padding: 16,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                          <Text style={{ color: '#f8fafc', fontWeight: 600 }}>{stage.title}</Text>
                          <Tag style={{ ...softTagStyle, color: palette.text }}>{palette.label}</Tag>
                        </div>
                        <Text style={{ color: '#cbd5e1' }}>{stage.description}</Text>
                      </div>
                    );
                  })}
                </Space>
              </Card>

              <Card style={panelCardStyle} bodyStyle={{ padding: 24 }}>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div>
                    <Text style={sectionEyebrowStyle}>Ask Library</Text>
                    <Title level={4} style={{ margin: '4px 0 8px', color: '#f8fafc' }}>
                      资料检索问答
                    </Title>
                    <Paragraph style={mutedParagraphStyle}>
                      这里已经接真实 `/chat/retrieve` 接口。你可以直接问“当前阶段先看什么资料”或者“这门课的前置是什么”。
                    </Paragraph>
                  </div>

                  <Space wrap size={[8, 8]}>
                    {[
                      '这个阶段先看哪些资料？',
                      '这条路径里最关键的前置是什么？',
                      '当前节点适合先做什么实践？',
                    ].map((item) => (
                      <Tag key={item} style={{ ...softTagStyle, cursor: 'pointer' }} onClick={() => setQuestion(item)}>
                        {item}
                      </Tag>
                    ))}
                  </Space>

                  <Input.TextArea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    autoSize={{ minRows: 3, maxRows: 5 }}
                    placeholder="输入问题，例如：我现在应该先看哪些资料来完成这一阶段？"
                    style={goalInputStyle}
                  />

                  <div style={goalFooterStyle}>
                    <Text style={{ color: '#94a3b8' }}>
                      当前会基于站内资源和文档切片返回答案与来源。
                    </Text>
                    <Button
                      icon={<SendOutlined />}
                      style={ghostButtonStyle}
                      onClick={handleAskQuestion}
                      loading={chatLoading}
                    >
                      开始检索
                    </Button>
                  </div>
                </Space>
              </Card>
            </Space>
          </Col>

          <Col xs={24} xl={16}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              {renderRoadmapPanel()}

              <Row gutter={[20, 20]}>
                <Col xs={24} xxl={14}>
                  <Card style={panelCardStyle} bodyStyle={{ padding: 28 }}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <div>
                        <Text style={sectionEyebrowStyle}>Recommendations</Text>
                        <Title level={3} style={sectionTitleStyle}>
                          推荐结果区
                        </Title>
                        <Paragraph style={mutedParagraphStyle}>
                          继续复用现有推荐结果组件，把它作为工作台中的一个结果视图，而不是整个系统的唯一主页面。
                        </Paragraph>
                      </div>
                      <Divider style={{ borderColor: 'rgba(148, 163, 184, 0.12)', margin: 0 }} />
                      <RecommendationList
                        recommendations={recommendations}
                        loading={loading}
                        activeCourseId={selectedRecommendation?.course.id ?? null}
                        onSelectCourse={setSelectedCourseId}
                      />
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} xxl={10}>{renderDetailPanel()}</Col>
              </Row>

              <Card style={panelCardStyle} bodyStyle={{ padding: 24 }}>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <div>
                    <Text style={sectionEyebrowStyle}>RAG Answer</Text>
                    <Title level={3} style={sectionTitleStyle}>
                      检索回答区
                    </Title>
                    <Paragraph style={mutedParagraphStyle}>
                      这一块直接展示后端 `/chat/retrieve` 的答案和来源，不再只是前端占位。
                    </Paragraph>
                  </div>

                  {chatResult ? (
                    <>
                      <div style={reasonCardStyle}>
                        <Text style={{ color: '#8fb3ff', fontSize: 12, display: 'block', marginBottom: 8 }}>
                          回答
                        </Text>
                        <Text style={{ color: '#e2e8f0', lineHeight: 1.85 }}>{chatResult.answer}</Text>
                      </div>

                      <div style={detailSectionStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                          <Text style={detailSectionTitleStyle}>来源片段</Text>
                          <Tag style={chatResult.has_enough_context ? stateReadyTagStyle : stateIdleTagStyle}>
                            {chatResult.has_enough_context ? '资料充分' : '资料不足'}
                          </Tag>
                        </div>

                        <div style={{ display: 'grid', gap: 10 }}>
                          {chatResult.sources.map((source) => (
                            <div key={source.chunk_id} style={resourceCardStyle}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                                <Text style={{ color: '#f8fafc', fontWeight: 600 }}>{source.resource_title}</Text>
                                <Tag style={softTagStyle}>score {source.score}</Tag>
                              </div>
                              <Text style={{ color: '#cbd5e1', lineHeight: 1.7 }}>{source.content}</Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={emptyStateBoxStyle}>
                      <FileTextOutlined style={{ fontSize: 28, color: '#8fb3ff' }} />
                      <Text style={{ color: '#cbd5e1', fontSize: 15 }}>左侧发起一次检索问答后，这里会显示答案和来源。</Text>
                    </div>
                  )}
                </Space>
              </Card>

              <Card style={panelCardStyle} bodyStyle={{ padding: 24 }}>
                <Row gutter={[16, 16]}>
                  {[
                    {
                      icon: <BulbOutlined />,
                      title: '下一步 1',
                      text: '把右侧路线图草案替换成真正的 React Flow 节点图。',
                    },
                    {
                      icon: <FileTextOutlined />,
                      title: '下一步 2',
                      text: '把课程详情扩展成资源详情，接入 Repo、PDF、视频与文档片段。',
                    },
                    {
                      icon: <BranchesOutlined />,
                      title: '下一步 3',
                      text: '让左侧输入从表单升级为目标驱动的对话流。',
                    },
                  ].map((item) => (
                    <Col xs={24} md={8} key={item.title}>
                      <div style={futureCardStyle}>
                        <div style={futureIconStyle}>{item.icon}</div>
                        <Title level={5} style={{ color: '#f8fafc', marginBottom: 8 }}>
                          {item.title}
                        </Title>
                        <Text style={{ color: '#cbd5e1', lineHeight: 1.7 }}>{item.text}</Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Space>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

const appLayoutStyle: React.CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 30%), radial-gradient(circle at top right, rgba(129, 140, 248, 0.14), transparent 24%), linear-gradient(180deg, #07111f 0%, #0b1220 38%, #101826 100%)',
};

const headerStyle: React.CSSProperties = {
  height: 80,
  padding: '0 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(7, 17, 31, 0.72)',
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
  background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
  boxShadow: '0 14px 28px rgba(56, 189, 248, 0.22)',
};

const contentStyle: React.CSSProperties = {
  padding: '24px',
};

const statusCardStyle: React.CSSProperties = {
  marginBottom: 20,
  borderRadius: 24,
  overflow: 'hidden',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  background: 'linear-gradient(145deg, rgba(12, 21, 36, 0.96), rgba(16, 27, 44, 0.94))',
  boxShadow: '0 18px 38px rgba(2, 6, 23, 0.18)',
};

const statusRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
};

const heroCardStyle: React.CSSProperties = {
  borderRadius: 24,
  overflow: 'hidden',
  border: '1px solid rgba(125, 211, 252, 0.18)',
  background: 'linear-gradient(145deg, rgba(14, 24, 40, 0.96), rgba(17, 30, 48, 0.96))',
  boxShadow: '0 26px 48px rgba(2, 6, 23, 0.28)',
};

const panelCardStyle: React.CSSProperties = {
  borderRadius: 24,
  overflow: 'hidden',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  background: 'rgba(9, 16, 28, 0.88)',
  boxShadow: '0 22px 42px rgba(2, 6, 23, 0.24)',
};

const detailHeroStyle: React.CSSProperties = {
  borderRadius: 18,
  padding: 20,
  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.94))',
  border: '1px solid rgba(125, 211, 252, 0.16)',
};

const reasonCardStyle: React.CSSProperties = {
  borderRadius: 18,
  padding: 18,
  background: 'rgba(59, 130, 246, 0.08)',
  border: '1px solid rgba(96, 165, 250, 0.16)',
};

const metricCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 16,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const futureCardStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 18,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const futureIconStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#8fb3ff',
  fontSize: 18,
  background: 'rgba(59, 130, 246, 0.12)',
  marginBottom: 12,
};

const emptyStateBoxStyle: React.CSSProperties = {
  minHeight: 220,
  borderRadius: 18,
  border: '1px dashed rgba(148, 163, 184, 0.24)',
  background: 'rgba(15, 23, 42, 0.34)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 12,
};

const detailSectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const detailFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
  paddingTop: 6,
};

const resourceCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 14,
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const roadmapSummaryStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: 'rgba(15, 23, 42, 0.58)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const roadmapSummaryHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  marginBottom: 14,
};

const roadmapSummaryCardStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(9, 16, 28, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const roadmapSummaryTextStyle: React.CSSProperties = {
  color: '#e2e8f0',
  display: 'block',
  marginTop: 10,
  lineHeight: 1.7,
};

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  border: 'none',
  height: 42,
  padding: '0 18px',
  fontWeight: 600,
  background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
  boxShadow: '0 14px 30px rgba(56, 189, 248, 0.22)',
};

const ghostButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  height: 40,
  padding: '0 16px',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.68)',
};

const goalInputStyle: React.CSSProperties = {
  borderRadius: 18,
  background: 'rgba(15, 23, 42, 0.78)',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.16)',
};

const goalFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
};

const sectionEyebrowStyle: React.CSSProperties = {
  color: '#8fb3ff',
  fontSize: 12,
  letterSpacing: 1.1,
  textTransform: 'uppercase',
};

const sectionTitleStyle: React.CSSProperties = {
  color: '#f8fafc',
  margin: '4px 0 8px',
};

const mutedParagraphStyle: React.CSSProperties = {
  color: '#94a3b8',
  marginBottom: 0,
  lineHeight: 1.8,
};

const detailSectionTitleStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  letterSpacing: 0.4,
};

const accentTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 12px',
  background: 'rgba(56, 189, 248, 0.14)',
  color: '#8fdcff',
  border: '1px solid rgba(56, 189, 248, 0.2)',
};

const softTagStyle: React.CSSProperties = {
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

const headerTagStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 12px',
  background: 'rgba(56, 189, 248, 0.1)',
  color: '#8fdcff',
  border: '1px solid rgba(56, 189, 248, 0.18)',
};

const stateIdleTagStyle: React.CSSProperties = {
  ...softTagStyle,
  color: '#f8d27c',
  background: 'rgba(255, 196, 61, 0.12)',
  border: '1px solid rgba(255, 196, 61, 0.24)',
};

const stateLoadingTagStyle: React.CSSProperties = {
  ...softTagStyle,
  color: '#8fdcff',
  background: 'rgba(56, 189, 248, 0.14)',
  border: '1px solid rgba(56, 189, 248, 0.2)',
};

const stateReadyTagStyle: React.CSSProperties = {
  ...softTagStyle,
  color: '#9ff0d2',
  background: 'rgba(32, 201, 151, 0.14)',
  border: '1px solid rgba(32, 201, 151, 0.24)',
};

export default App;
