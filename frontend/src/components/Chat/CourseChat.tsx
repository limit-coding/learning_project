import { useState, useRef, useEffect } from 'react';
import { Input, Button, Card, List, Typography, Spin, Select, Space } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Paragraph } = Typography;
const { TextArea } = Input;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Course {
  slug: string;
  title: string;
  shortTitle: string;
}

// 课程列表
const courses: Course[] = [
  { slug: 'bupt_signal_analysis_and_processing', title: '信号分析与处理', shortTitle: '信号' },
  { slug: 'bupt_digital_electronics', title: '数字电子电路', shortTitle: '数电' },
  { slug: 'bupt_discrete_math', title: '离散数学', shortTitle: '离散' },
  { slug: 'bupt_communication_principles', title: '通信原理', shortTitle: '通信' },
  { slug: 'bupt_computer_organization', title: '计算机组成原理', shortTitle: '计组' },
  { slug: 'bupt_data_structure_algorithm', title: '数据结构与算法', shortTitle: '数据结构' },
];

const CourseChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        question: input,
        course_title: selectedCourse || undefined,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.answer,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后再试。',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    '这门课主要讲什么？',
    '考试重点有哪些？',
    '有什么学习建议？',
    '这门课难不难？',
  ];

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>AI 课程助手</span>
        </Space>
      }
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}
    >
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择课程（可选）"
          style={{ width: '100%' }}
          value={selectedCourse || undefined}
          onChange={(value) => setSelectedCourse(value)}
          allowClear
        >
          {courses.map(course => (
            <Select.Option key={course.slug} value={course.title}>
              {course.title} ({course.shortTitle})
            </Select.Option>
          ))}
        </Select>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: 16,
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>你好！我是 AI 课程助手</div>
            <div style={{ marginTop: 8 }}>可以问我关于课程的问题</div>
            <div style={{ marginTop: 16 }}>
              <Space wrap>
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    size="small"
                    onClick={() => {
                      setInput(q);
                    }}
                  >
                    {q}
                  </Button>
                ))}
              </Space>
            </div>
          </div>
        )}

        <List
          dataSource={messages}
          renderItem={(msg) => (
            <List.Item
              style={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                border: 'none',
                padding: '8px 0',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: msg.role === 'user' ? '#1890ff' : '#52c41a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                </div>
                <div
                  style={{
                    backgroundColor: msg.role === 'user' ? '#1890ff' : 'white',
                    color: msg.role === 'user' ? 'white' : 'inherit',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  <Paragraph
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      color: msg.role === 'user' ? 'white' : 'inherit',
                    }}
                  >
                    {msg.content}
                  </Paragraph>
                </div>
              </div>
            </List.Item>
          )}
        />

        {loading && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Spin tip="AI 思考中..." />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入问题... (Enter 发送)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          style={{ height: 'auto' }}
        >
          发送
        </Button>
      </div>
    </Card>
  );
};

export default CourseChat;
