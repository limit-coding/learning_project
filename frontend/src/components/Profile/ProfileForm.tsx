import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import {
  AimOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { UserProfile } from '../../types';
import { createUserProfile } from '../../services/api';

const { Option } = Select;
const { Text, Title, Paragraph } = Typography;

interface ProfileFormProps {
  onSuccess: (profileId: number) => void;
}

interface StepMeta {
  key: string;
  title: string;
  description: string;
  hint: string;
  icon: React.ReactNode;
}

const steps: StepMeta[] = [
  {
    key: 'knowledge',
    title: '当前基础',
    description: '描述你现在会什么、做到什么程度',
    hint: '这会影响推荐算法对难度和前置条件的判断。',
    icon: <UserOutlined />,
  },
  {
    key: 'goals',
    title: '学习目标',
    description: '说明你真正想学什么、想达成什么',
    hint: '这里决定推荐内容的主题方向和优先级。',
    icon: <AimOutlined />,
  },
  {
    key: 'career',
    title: '职业方向',
    description: '给系统一个更具体的输出导向',
    hint: '会影响推荐理由和路径排序。',
    icon: <CompassOutlined />,
  },
];

const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess }) => {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const currentStep = steps[current];

  const completionText = useMemo(() => {
    return `Step ${current + 1} / ${steps.length}`;
  }, [current]);

  const next = () => {
    form.validateFields().then(() => {
      setCurrent((value) => value + 1);
    });
  };

  const prev = () => {
    setCurrent((value) => value - 1);
  };

  const onFinish = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue(true);

      const profile: UserProfile = {
        current_knowledge: {
          programming_languages: values.programming_languages || [],
          completed_courses: values.completed_courses || [],
          skill_level: values.skill_level || 'beginner',
        },
        learning_goals: {
          target_skills: values.target_skills || [],
          specific_topics: values.specific_topics || [],
        },
        career_direction: {
          target_role: values.target_role || '',
          preferred_language: values.preferred_language || '',
          industry: values.industry || 'tech',
        },
      };

      const response = await createUserProfile(profile);
      message.success('画像创建成功！正在生成推荐结果。');
      onSuccess(response.id);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const errMsg = Array.isArray(detail)
        ? detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join('；')
        : typeof detail === 'string'
          ? detail
          : '创建失败，请重试';
      message.error(errMsg);
      console.error('422 详情:', error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <>
            <Form.Item
              label="编程语言"
              name="programming_languages"
              rules={[{ required: true, message: '请选择至少一门编程语言' }]}
            >
              <Select
                mode="multiple"
                placeholder="选择你已经掌握的语言"
                style={fieldStyle}
                popupMatchSelectWidth={false}
              >
                <Option value="Python">Python</Option>
                <Option value="C++">C++</Option>
                <Option value="Java">Java</Option>
                <Option value="JavaScript">JavaScript</Option>
                <Option value="C">C</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="技能水平"
              name="skill_level"
              rules={[{ required: true, message: '请选择你的技能水平' }]}
            >
              <Select placeholder="选择你当前所处阶段" style={fieldStyle}>
                <Option value="beginner">🌱 初学者 - 刚开始接触编程</Option>
                <Option value="intermediate">🌿 中级 - 有一定项目经验</Option>
                <Option value="advanced">🌳 高级 - 熟练掌握多种技术</Option>
              </Select>
            </Form.Item>

            <Form.Item label="已完成课程" name="completed_courses">
              <Select
                mode="tags"
                placeholder="输入已完成课程，可自由补充"
                style={fieldStyle}
                popupMatchSelectWidth={false}
              >
                <Option value="CS50">CS50</Option>
                <Option value="Andrew Ng ML">Andrew Ng 机器学习</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 1:
        return (
          <>
            <Form.Item
              label="目标技能"
              name="target_skills"
              rules={[{ required: true, message: '请选择至少一个目标技能' }]}
            >
              <Select
                mode="multiple"
                placeholder="选择你想优先突破的方向"
                style={fieldStyle}
                popupMatchSelectWidth={false}
              >
                <Option value="deep_learning">🧠 深度学习</Option>
                <Option value="computer_vision">👁️ 计算机视觉</Option>
                <Option value="nlp">💬 自然语言处理</Option>
                <Option value="reinforcement_learning">🎮 强化学习</Option>
                <Option value="generative_ai">✨ 生成式 AI</Option>
              </Select>
            </Form.Item>

            <Form.Item label="具体主题" name="specific_topics">
              <Select
                mode="tags"
                placeholder="例如：Transformers、GAN、Diffusion"
                style={fieldStyle}
                popupMatchSelectWidth={false}
              >
                <Option value="CNN">卷积神经网络</Option>
                <Option value="transformers">Transformers</Option>
                <Option value="GAN">生成对抗网络</Option>
                <Option value="BERT">BERT</Option>
                <Option value="diffusion">扩散模型</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 2:
        return (
          <>
            <Form.Item
              label="目标职位"
              name="target_role"
              rules={[{ required: true, message: '请输入目标职位' }]}
            >
              <Input placeholder="例如：AI 工程师、算法研究员" style={fieldStyle} />
            </Form.Item>

            <Form.Item
              label="偏好语言"
              name="preferred_language"
              rules={[{ required: true, message: '请选择偏好的编程语言' }]}
            >
              <Select placeholder="选择你偏好的主力语言" style={fieldStyle}>
                <Option value="Python">🐍 Python</Option>
                <Option value="C++">⚡ C++</Option>
                <Option value="Java">☕ Java</Option>
              </Select>
            </Form.Item>

            <Form.Item label="目标行业" name="industry">
              <Select placeholder="选择你希望靠近的场景" style={fieldStyle}>
                <Option value="tech">💻 科技</Option>
                <Option value="research">🔬 学术研究</Option>
                <Option value="finance">💰 金融</Option>
              </Select>
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card style={cardStyle} bodyStyle={{ padding: 24 }}>
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <div style={stepHeaderStyle}>
          <div>
            <Text style={eyebrowStyle}>Learning Profile</Text>
            <Title level={3} style={{ color: '#f8fafc', margin: '6px 0 8px', fontWeight: 650 }}>
              {currentStep.title}
            </Title>
            <Paragraph style={descriptionStyle}>
              {currentStep.description}
            </Paragraph>
          </div>
          <div style={stepIconWrapStyle}>{currentStep.icon}</div>
        </div>

        <div style={stepSummaryStyle}>
          <div>
            <Text style={summaryLabelStyle}>当前阶段</Text>
            <Text style={summaryValueStyle}>{completionText}</Text>
          </div>
          <div style={summaryDividerStyle} />
          <div style={{ flex: 1 }}>
            <Text style={summaryLabelStyle}>设计提示</Text>
            <Text style={summaryHintStyle}>{currentStep.hint}</Text>
          </div>
        </div>

        <div style={stepTabsStyle}>
          {steps.map((step, index) => {
            const active = index === current;
            const passed = index < current;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => setCurrent(index)}
                style={{
                  ...stepTabStyle,
                  borderColor: active ? 'rgba(125, 211, 252, 0.34)' : 'rgba(148, 163, 184, 0.1)',
                  background: active ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.42)',
                  color: active ? '#f8fafc' : '#94a3b8',
                  boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <span
                  style={{
                    ...stepDotStyle,
                    background: active
                      ? 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)'
                      : passed
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.7) 0%, rgba(99, 102, 241, 0.7) 100%)'
                        : 'rgba(148, 163, 184, 0.16)',
                    color: active || passed ? '#fff' : '#94a3b8',
                  }}
                >
                  {passed ? '✓' : index + 1}
                </span>
                <span style={stepTitleTextStyle}>{step.title}</span>
              </button>
            );
          })}
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ industry: 'tech' }}
          style={{ width: '100%' }}
        >
          <div style={formPanelStyle}>{renderStepContent()}</div>

          <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
            <div style={actionsStyle}>
              <div>
                {current > 0 ? (
                  <Button onClick={prev} style={secondaryButtonStyle}>
                    上一步
                  </Button>
                ) : null}
              </div>

              <Space>
                {current < steps.length - 1 ? (
                  <Button type="primary" onClick={next} style={primaryButtonStyle}>
                    下一步
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                    style={primaryButtonStyle}
                  >
                    生成画像
                  </Button>
                )}
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
};

const cardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid rgba(148, 163, 184, 0.12)',
  background: 'linear-gradient(145deg, rgba(13, 20, 35, 0.98), rgba(17, 28, 45, 0.96))',
  boxShadow: '0 22px 42px rgba(2, 6, 23, 0.26)',
};

const stepHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
};

const eyebrowStyle: React.CSSProperties = {
  color: 'rgba(143, 179, 255, 0.88)',
  fontSize: 11,
  letterSpacing: 1.6,
  textTransform: 'uppercase',
};

const descriptionStyle: React.CSSProperties = {
  color: '#a4b1c4',
  marginBottom: 0,
  lineHeight: 1.75,
  maxWidth: 460,
};

const stepIconWrapStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.12))',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  color: '#b7ccff',
  fontSize: 17,
  flexShrink: 0,
};

const stepSummaryStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
  gap: 12,
  alignItems: 'center',
  padding: '14px 16px',
  borderRadius: 18,
  background: 'rgba(10, 17, 30, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.1)',
};

const summaryLabelStyle: React.CSSProperties = {
  display: 'block',
  color: '#718198',
  fontSize: 11,
  letterSpacing: 0.6,
  marginBottom: 4,
};

const summaryValueStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontSize: 14,
  fontWeight: 600,
};

const summaryHintStyle: React.CSSProperties = {
  display: 'block',
  color: '#c3d0e3',
  fontSize: 13,
  lineHeight: 1.6,
};

const summaryDividerStyle: React.CSSProperties = {
  width: 1,
  alignSelf: 'stretch',
  background: 'rgba(148, 163, 184, 0.14)',
};

const stepTabsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
};

const stepTabStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid rgba(148, 163, 184, 0.1)',
  padding: '14px 16px',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  cursor: 'pointer',
  transition: 'all 160ms ease',
};

const stepDotStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
};

const stepTitleTextStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 550,
  letterSpacing: 0.1,
};

const formPanelStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: 'rgba(15, 23, 42, 0.56)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const fieldStyle: React.CSSProperties = {
  borderRadius: 12,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
};

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  border: 'none',
  height: 42,
  padding: '0 22px',
  fontWeight: 600,
  background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
  boxShadow: '0 14px 28px rgba(56, 189, 248, 0.22)',
};

const secondaryButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  height: 40,
  padding: '0 18px',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.68)',
};

export default ProfileForm;
