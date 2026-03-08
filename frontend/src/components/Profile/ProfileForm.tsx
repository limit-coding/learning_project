import React, { useState } from 'react';
import { Form, Input, Select, Button, Steps, Card, message, Space } from 'antd';
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
    { title: '当前基础', description: '您的编程基础' },
    { title: '学习目标', description: '想要学习的内容' },
    { title: '职业方向', description: '未来发展方向' },
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
      // 使用 getFieldsValue(true) 显式获取所有字段值，包括已卸载步骤的字段
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
      message.success('画像创建成功！');
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
              <Select mode="multiple" placeholder="选择您已掌握的编程语言">
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
              <Select placeholder="选择您的技能水平">
                <Option value="beginner">初学者</Option>
                <Option value="intermediate">中级</Option>
                <Option value="advanced">高级</Option>
              </Select>
            </Form.Item>

            <Form.Item label="已完成课程" name="completed_courses">
              <Select mode="tags" placeholder="输入已完成的课程（可选）">
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
              <Select mode="multiple" placeholder="选择您想学习的技能">
                <Option value="deep_learning">深度学习</Option>
                <Option value="computer_vision">计算机视觉</Option>
                <Option value="nlp">自然语言处理</Option>
                <Option value="reinforcement_learning">强化学习</Option>
                <Option value="generative_ai">生成式AI</Option>
              </Select>
            </Form.Item>

            <Form.Item label="具体主题" name="specific_topics">
              <Select mode="tags" placeholder="输入具体想学的主题（可选）">
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
              <Input placeholder="例如：AI工程师、算法研究员" />
            </Form.Item>

            <Form.Item
              label="偏好语言"
              name="preferred_language"
              rules={[{ required: true, message: '请选择偏好的编程语言' }]}
            >
              <Select placeholder="选择您偏好的编程语言">
                <Option value="Python">Python</Option>
                <Option value="C++">C++</Option>
                <Option value="Java">Java</Option>
              </Select>
            </Form.Item>

            <Form.Item label="目标行业" name="industry">
              <Select placeholder="选择目标行业">
                <Option value="tech">科技</Option>
                <Option value="research">学术研究</Option>
                <Option value="finance">金融</Option>
              </Select>
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card style={{ maxWidth: 800, margin: '0 auto' }}>
      <Steps current={current} items={steps} style={{ marginBottom: 32 }} />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ industry: 'tech' }}
      >
        {renderStepContent()}

        <Form.Item>
          <Space>
            {current > 0 && (
              <Button onClick={prev}>上一步</Button>
            )}
            {current < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                下一步
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" htmlType="submit" loading={loading}>
                提交
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProfileForm;
