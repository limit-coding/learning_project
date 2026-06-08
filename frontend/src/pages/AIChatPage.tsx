import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Select, Space, Tag, Typography } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const courses = [
  { slug: 'bupt_signal_analysis_and_processing', title: '信号分析与处理', shortTitle: '信号' },
  { slug: 'bupt_digital_electronics', title: '数字电子电路', shortTitle: '数电' },
  { slug: 'bupt_discrete_math', title: '离散数学', shortTitle: '离散' },
  { slug: 'bupt_communication_principles', title: '通信原理', shortTitle: '通信' },
  { slug: 'bupt_computer_organization', title: '计算机组成原理', shortTitle: '计组' },
  { slug: 'bupt_data_structure_algorithm', title: '数据结构与算法', shortTitle: '数据结构' },
];

const suggestedQuestions = [
  '这门课主要讲什么内容？',
  '考试重点有哪些？',
  '有什么学习建议？',
  '这门课难不难，怎么备考？',
  '推荐哪些参考资料？',
  '这门课和其他课有什么联系？',
];

const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input;
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    // 先插一条空的 assistant 消息，后续往里追加 token
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          course_title: selectedCourse || undefined,
        }),
      });

      if (!res.ok || !res.body) throw new Error('stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const chunk = JSON.parse(data);
            const token: string = chunk?.choices?.[0]?.delta?.content ?? '';
            if (token) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: updated[updated.length - 1].content + token,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '抱歉，发生了错误，请稍后重试。',
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={pageStyle}>
      {/* Left sidebar */}
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <div style={avatarStyle}>
            <RobotOutlined style={{ fontSize: 22 }} />
          </div>
          <div>
            <Title level={5} style={{ color: '#f8fafc', margin: 0 }}>
              AI 课程助手
            </Title>
            <Text style={{ color: '#64748b', fontSize: 12 }}>基于北邮课程内容</Text>
          </div>
        </div>

        <div style={sidebarSectionStyle}>
          <Text style={sidebarLabelStyle}>当前课程</Text>
          <Select
            placeholder="选择课程（可选）"
            style={{ width: '100%', marginTop: 8 }}
            value={selectedCourse || undefined}
            onChange={(v) => setSelectedCourse(v)}
            allowClear
          >
            {courses.map((course) => (
              <Select.Option key={course.slug} value={course.title}>
                <Space>
                  <Tag style={shortTagStyle}>{course.shortTitle}</Tag>
                  {course.title}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </div>

        <div style={sidebarSectionStyle}>
          <Text style={sidebarLabelStyle}>快速提问</Text>
          <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 8 }}>
            {suggestedQuestions.map((q) => (
              <div
                key={q}
                style={suggestItemStyle}
                onClick={() => setInput(q)}
              >
                <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{q}</Text>
              </div>
            ))}
          </Space>
        </div>

        <div style={sidebarFooterStyle}>
          <Button
            danger
            size="small"
            style={{ borderRadius: 8, width: '100%', border: '1px solid rgba(71, 85, 105, 0.3)', background: 'transparent', color: '#64748b' }}
            onClick={() => setMessages([])}
          >
            清空对话
          </Button>
        </div>
      </div>

      {/* Chat area */}
      <div style={chatAreaStyle}>
        <div style={messageListStyle}>
          {isEmpty && (
            <div style={emptyStateStyle}>
              <div style={bigAvatarStyle}>
                <RobotOutlined style={{ fontSize: 36, color: '#38bdf8' }} />
              </div>
              <Title level={4} style={{ color: '#f8fafc', margin: '16px 0 8px' }}>
                你好，我是 AI 课程助手
              </Title>
              <Paragraph style={{ color: '#64748b', textAlign: 'center', maxWidth: 420 }}>
                可以选择左侧课程后提问，也可以直接问北邮课程相关的任何问题。
              </Paragraph>
              {selectedCourse && (
                <Tag style={selectedCourseTagStyle}>
                  当前课程：{selectedCourse}
                </Tag>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...messageBubbleWrapStyle,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.role === 'assistant' && (
                <div style={msgAvatarStyle('#38bdf8')}>
                  <RobotOutlined style={{ fontSize: 14 }} />
                </div>
              )}
              <div
                style={{
                  ...(msg.role === 'user' ? userBubbleStyle : assistantBubbleStyle),
                }}
              >
                {msg.role === 'user' ? (
                  <Text style={{ color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {msg.content}
                  </Text>
                ) : (
                  <div className="markdown-body" style={{ color: '#e2e8f0' }}>
                    <ReactMarkdown
                      components={{
                        table: ({ children }) => (
                          <table style={{ borderCollapse: 'collapse', width: '100%', margin: '8px 0', fontSize: 13 }}>{children}</table>
                        ),
                        th: ({ children }) => (
                          <th style={{ border: '1px solid rgba(71,85,105,0.4)', padding: '8px 12px', background: 'rgba(30,41,59,0.6)', fontWeight: 600, textAlign: 'left', color: '#e2e8f0' }}>{children}</th>
                        ),
                        td: ({ children }) => (
                          <td style={{ border: '1px solid rgba(71,85,105,0.4)', padding: '8px 12px', color: '#cbd5e1' }}>{children}</td>
                        ),
                        h2: ({ children }) => <h2 style={{ fontSize: 16, fontWeight: 700, margin: '12px 0 8px', color: '#f8fafc' }}>{children}</h2>,
                        h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, margin: '10px 0 6px', color: '#e2e8f0' }}>{children}</h3>,
                        ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '4px 0' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '4px 0' }}>{children}</ol>,
                        li: ({ children }) => <li style={{ margin: '3px 0', lineHeight: 1.65, color: '#cbd5e1' }}>{children}</li>,
                        p: ({ children }) => <p style={{ margin: '4px 0', lineHeight: 1.75, color: '#cbd5e1' }}>{children}</p>,
                        strong: ({ children }) => <strong style={{ fontWeight: 600, color: '#f8fafc' }}>{children}</strong>,
                        code: ({ children }) => (
                          <code style={{ background: 'rgba(30,41,59,0.8)', padding: '2px 6px', borderRadius: 4, fontSize: 13, color: '#7dd3fc' }}>{children}</code>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div style={msgAvatarStyle('#4f46e5')}>
                  <UserOutlined style={{ fontSize: 14 }} />
                </div>
              )}
            </div>
          ))}

          {loading && messages[messages.length - 1]?.content === '' && (
            <div style={{ ...messageBubbleWrapStyle, justifyContent: 'flex-start' }}>
              <div style={msgAvatarStyle('#38bdf8')}>
                <RobotOutlined style={{ fontSize: 14 }} />
              </div>
              <div style={assistantBubbleStyle}>
                <Text style={{ color: '#64748b', fontSize: 13 }}>
                  <span style={typingDotsStyle}>●</span>
                  <span style={{ ...typingDotsStyle, animationDelay: '0.2s' }}>●</span>
                  <span style={{ ...typingDotsStyle, animationDelay: '0.4s' }}>●</span>
                </Text>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div style={inputBarStyle}>
          {selectedCourse && (
            <Tag style={inputCourseTagStyle} closable onClose={() => setSelectedCourse('')}>
              {selectedCourse}
            </Tag>
          )}
          <div style={inputRowStyle}>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题，Enter 发送，Shift+Enter 换行…"
              autoSize={{ minRows: 1, maxRows: 5 }}
              style={inputStyle}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              disabled={!input.trim()}
              style={sendButtonStyle}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  height: 'calc(100vh - 72px - 56px)',
  minHeight: 500,
};

const sidebarStyle: React.CSSProperties = {
  width: 260,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 18,
  background: 'rgba(9, 16, 28, 0.88)',
  border: '1px solid rgba(71, 85, 105, 0.2)',
  marginRight: 20,
  overflow: 'hidden',
};

const sidebarHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '20px 18px 16px',
  borderBottom: '1px solid rgba(71, 85, 105, 0.2)',
};

const avatarStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#f8fafc',
  fontSize: 20,
  background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
  flexShrink: 0,
};

const sidebarSectionStyle: React.CSSProperties = {
  padding: '16px 18px',
  borderBottom: '1px solid rgba(71, 85, 105, 0.15)',
};

const sidebarLabelStyle: React.CSSProperties = {
  color: '#8fb3ff',
  fontSize: 11,
  letterSpacing: 1.1,
  textTransform: 'uppercase',
};

const sidebarFooterStyle: React.CSSProperties = {
  padding: '14px 18px',
  marginTop: 'auto',
};

const shortTagStyle: React.CSSProperties = {
  borderRadius: 6,
  padding: '2px 8px',
  color: '#bae6fd',
  background: 'rgba(14, 165, 233, 0.14)',
  border: '1px solid rgba(56, 189, 248, 0.2)',
  fontSize: 11,
};

const suggestItemStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: 10,
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(71, 85, 105, 0.22)',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
};

const chatAreaStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 18,
  background: 'rgba(9, 16, 28, 0.88)',
  border: '1px solid rgba(71, 85, 105, 0.2)',
  overflow: 'hidden',
  minWidth: 0,
};

const messageListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '24px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '40px 20px',
  textAlign: 'center',
};

const bigAvatarStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, rgba(8,47,73,0.8), rgba(30,41,59,0.7))',
  border: '1px solid rgba(56, 189, 248, 0.3)',
};

const selectedCourseTagStyle: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 999,
  padding: '5px 14px',
  color: '#bae6fd',
  background: 'rgba(14, 165, 233, 0.12)',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  fontSize: 13,
};

const messageBubbleWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
};

const msgAvatarStyle = (bg: string): React.CSSProperties => ({
  width: 30,
  height: 30,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: bg,
  color: '#fff',
  flexShrink: 0,
  marginTop: 2,
});

const userBubbleStyle: React.CSSProperties = {
  maxWidth: '72%',
  padding: '12px 16px',
  borderRadius: '16px 4px 16px 16px',
  background: 'linear-gradient(135deg, #0891b2, #4f46e5)',
  boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)',
};

const assistantBubbleStyle: React.CSSProperties = {
  maxWidth: '80%',
  padding: '14px 18px',
  borderRadius: '4px 16px 16px 16px',
  background: 'rgba(30, 41, 59, 0.7)',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

const inputBarStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderTop: '1px solid rgba(71, 85, 105, 0.2)',
  background: 'rgba(7, 11, 22, 0.6)',
};

const inputCourseTagStyle: React.CSSProperties = {
  marginBottom: 10,
  borderRadius: 999,
  padding: '4px 12px',
  color: '#bae6fd',
  background: 'rgba(14, 165, 233, 0.12)',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  fontSize: 12,
};

const inputRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-end',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: 14,
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  color: '#f8fafc',
  resize: 'none',
};

const typingDotsStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 8,
  color: '#38bdf8',
  marginRight: 3,
  animation: 'bounce 1s infinite',
};

const sendButtonStyle: React.CSSProperties = {
  borderRadius: 14,
  height: 44,
  paddingInline: 20,
  background: 'linear-gradient(90deg, #0891b2, #4f46e5)',
  border: 'none',
  fontWeight: 600,
  flexShrink: 0,
};

export default AIChatPage;
