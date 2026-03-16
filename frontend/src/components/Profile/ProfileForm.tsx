import React, { useState } from 'react';
import { Form, Input, Select, Button, Steps, Card, message, Space } from 'antd';
import { UserOutlined, AimOutlined, CompassOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UserProfile } from '../../types';
import { createUserProfile } from '../../services/api';

const { Option } = Select;

interface ProfileFormProps {
  onSuccess: (profileId: number) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess }) => {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const steps = [
    { 
      title: '当前基础', 
      description: '您的编程基础',
      icon: <UserOutlined />
    },
    { 
      title: '学习目标', 
      description: '想要学习的内容',
      icon: <AimOutlined />
    },
    { 
      title: '职业方向', 
      description: '未来发展方向',
      icon: <CompassOutlined />
    },
  ];

  const next = () => {
    form.validateFields().then(() => {
      setCurrent(current + 1);
    });
  };

  const prev = () => {
    setCurrent(current - 1);
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
      message.success('画像创建成功！正在为您生成推荐...');
      onSuccess(response.id);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const errMsg = Array.isArray(detail)
        ? detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join('；')
        : (typeof detail === 'string' ? detail : '创建失败，请重试');
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
                placeholder="选择您已掌握的编程语言"
                style={{ borderRadius: 8 }}
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
              rules={[{ required: true, message: '请选择您的技能水平' }]}
            >
              <Select placeholder="选择您的技能水平" style={{ borderRadius: 8 }}>
                <Option value="beginner">🌱 初学者 - 刚开始接触编程</Option>
                <Option value="intermediate">🌿 中级 - 有一定项目经验</Option>
                <Option value="advanced">🌳 高级 - 熟练掌握多种技术</Option>
              </Select>
            </Form.Item>

            <Form.Item label="已完成课程" name="completed_courses">
              <Select mode="tags" placeholder="输入已完成的课程（可选）" style={{ borderRadius: 8 }}>
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
              <Select mode="multiple" placeholder="选择您想学习的技能" style={{ borderRadius: 8 }}>
                <Option value="deep_learning">🧠 深度学习</Option>
                <Option value="computer_vision">👁️ 计算机视觉</Option>
                <Option value="nlp">💬 自然语言处理</Option>
                <Option value="reinforcement_learning">🎮 强化学习</Option>
                <Option value="generative_ai">✨ 生成式AI</Option>
              </Select>
            </Form.Item>

            <Form.Item label="具体主题" name="specific_topics">
              <Select mode="tags" placeholder="输入具体想学的主题（可选）" style={{ borderRadius: 8 }}>
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
              <Input placeholder="例如：AI工程师、算法研究员" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item
              label="偏好语言"
              name="preferred_language"
              rules={[{ required: true, message: '请选择偏好的编程语言' }]}
            >
              <Select placeholder="选择您偏好的编程语言" style={{ borderRadius: 8 }}>
                <Option value="Python">🐍 Python</Option>
                <Option value="C++">⚡ C++</Option>
                <Option value="Java">☕ Java</Option>
              </Select>
            </Form.Item>

            <Form.Item label="目标行业" name="industry">
              <Select placeholder="选择目标行业" style={{ borderRadius: 8 }}>
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
    <Card 
      style={{ 
        borderRadius: 20,
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        border: 'none'
      }}
      bodyStyle={{ padding: 40 }}
    >
      <Steps 
        current={current} 
        items={steps} 
        style={{ marginBottom: 40 }}
        size="small"
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ industry: 'tech' }}
      >
        <div style={{ minHeight: 280 }}>
          {renderStepContent()}
        </div>

        <Form.Item style={{ marginTop: 30, marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            {current > 0 && (
              <Button 
                onClick={prev}
                style={{ 
                  borderRadius: 20,
                  padding: '8px 24px',
                  height: 42
                }}
              >
                上一步
              </Button>
            )}
            <div style={{ flex: 1 }}></div>
            {current < steps.length - 1 && (
              <Button 
                type="primary" 
                onClick={next}
                style={{ 
                  borderRadius: 20,
                  padding: '8px 32px',
                  height: 42,
                  fontWeight: 500
                }}
              >
                下一步
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<CheckCircleOutlined />}
                style={{ 
                  borderRadius: 20,
                  padding: '8px 32px',
                  height: 42,
                  fontWeight: 500,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                生成推荐
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProfileForm;
