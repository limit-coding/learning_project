import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
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
    description: '选择你已掌握的基础，系统只面向北邮大二下课程推荐',
    hint: '不开放自由填写，避免把范围扩散到无关课程。',
    icon: <UserOutlined />,
  },
  {
    key: 'goals',
    title: '本学期重点',
    description: '选择这五门课里你最想优先突破的方向',
    hint: '推荐结果会围绕计组、通原、深度学习、离散、实训排序。',
    icon: <AimOutlined />,
  },
  {
    key: 'career',
    title: '输出导向',
    description: '选择你更关心考试、实验、项目还是长期能力',
    hint: '系统会据此调整推荐理由和章节路线侧重点。',
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
                <Option value="C">C</Option>
                <Option value="C++">C++</Option>
                <Option value="Python">Python</Option>
                <Option value="MATLAB">MATLAB</Option>
                <Option value="汇编">汇编基础</Option>
                <Option value="无代码">暂不考虑编程</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="技能水平"
              name="skill_level"
              rules={[{ required: true, message: '请选择你的技能水平' }]}
            >
              <Select placeholder="选择你当前所处阶段" style={fieldStyle}>
                <Option value="beginner">基础较薄弱 - 需要从第一章补起</Option>
                <Option value="intermediate">正常跟课 - 能完成作业但需要路线</Option>
                <Option value="advanced">基础较好 - 更关注拔高和总结</Option>
              </Select>
            </Form.Item>

            <Form.Item label="已完成课程" name="completed_courses">
              <Select
                mode="multiple"
                placeholder="选择已经比较稳的前置基础"
                style={fieldStyle}
                popupMatchSelectWidth={false}
              >
                <Option value="C 语言程序设计">C 语言程序设计</Option>
                <Option value="数据结构基础">数据结构基础</Option>
                <Option value="高等数学">高等数学</Option>
                <Option value="线性代数">线性代数</Option>
                <Option value="概率论基础">概率论基础</Option>
                <Option value="信号与系统">信号与系统</Option>
                <Option value="Python 编程">Python 编程</Option>
                <Option value="数字逻辑基础">数字逻辑基础</Option>
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
                placeholder="选择你本学期想优先突破的课程"
                style={fieldStyle}
                popupMatchSelectWidth={false}
              >
                <Option value="computer_architecture">计算机原理与组成（微机原理）</Option>
                <Option value="communication_principles">通信原理</Option>
                <Option value="deep_learning">深度学习（PyTorch）</Option>
                <Option value="discrete_math">离散数学</Option>
                <Option value="programming_practice">程序设计基础实训</Option>
              </Select>
            </Form.Item>

            <Form.Item label="具体主题" name="specific_topics">
              <Select
                mode="multiple"
                placeholder="选择当前最卡的知识点"
                style={fieldStyle}
                popupMatchSelectWidth={false}
              >
                <Option value="cpu_datapath">CPU 数据通路</Option>
                <Option value="memory">存储系统</Option>
                <Option value="modulation">调制解调</Option>
                <Option value="noise_ber">噪声与误码率</Option>
                <Option value="pytorch">PyTorch 训练闭环</Option>
                <Option value="cnn">CNN</Option>
                <Option value="logic">逻辑证明</Option>
                <Option value="graph_theory">图论</Option>
                <Option value="debugging">调试与测试</Option>
                <Option value="project_delivery">项目交付</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 2:
        return (
          <>
            <Form.Item
              label="本学期目标"
              name="target_role"
              rules={[{ required: true, message: '请选择本学期目标' }]}
            >
              <Select placeholder="选择一个主要输出目标" style={fieldStyle}>
                <Option value="考试稳过并争取高分">考试稳过并争取高分</Option>
                <Option value="实验和课程设计稳定交付">实验和课程设计稳定交付</Option>
                <Option value="保研/竞赛方向夯实基础">保研/竞赛方向夯实基础</Option>
                <Option value="AI/通信/系统方向长期能力">AI/通信/系统方向长期能力</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="偏好语言"
              name="preferred_language"
              rules={[{ required: true, message: '请选择偏好的编程语言' }]}
            >
              <Select placeholder="选择你偏好的主力语言" style={fieldStyle}>
                <Option value="C">C</Option>
                <Option value="C++">C++</Option>
                <Option value="Python">Python</Option>
                <Option value="MATLAB">MATLAB</Option>
                <Option value="无代码">无代码</Option>
              </Select>
            </Form.Item>

            <Form.Item label="推荐侧重点" name="industry">
              <Select placeholder="选择你希望系统优先展示的内容" style={fieldStyle}>
                <Option value="exam">考试复习</Option>
                <Option value="lab">实验实践</Option>
                <Option value="project">项目交付</Option>
                <Option value="foundation">知识体系</Option>
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
            <Text style={eyebrowStyle}>BUPT Sophomore Profile</Text>
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
          initialValues={{ industry: 'exam' }}
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
