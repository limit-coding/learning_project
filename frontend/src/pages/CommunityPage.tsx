import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Tabs,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import {
  EyeOutlined,
  LinkOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PlusOutlined,
  RobotOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { communityApi, PostListItem } from '../services/communityApi';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const COURSE_TAGS = [
  '数学', '英语', '物理', '编程基础', '数据结构', '操作系统',
  '计算机网络', '数据库', '算法', '机器学习', '信号与系统', '其他',
];

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<'new' | 'hot'>('new');
  const [filterTag, setFilterTag] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [shareMode, setShareMode] = useState<'url' | 'file'>('url');
  const [form] = Form.useForm();

  const fetchPosts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await communityApi.listPosts({ sort, course_tag: filterTag }, token);
      setPosts(data);
    } catch {
      message.error('加载帖子失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [sort, filterTag]);

  const handleCreate = async (values: any) => {
    if (!token) {
      message.warning('请先登录');
      return;
    }
    setSubmitting(true);
    try {
      const finalUrl = shareMode === 'file' ? uploadedUrl : (values.share_url?.trim() || undefined);
      await communityApi.createPost(
        {
          title: values.title,
          content: values.content,
          course_tag: values.course_tag || undefined,
          needs_ai: values.needs_ai ?? false,
          share_url: finalUrl,
        },
        token,
      );
      message.success(finalUrl ? '发帖成功！资源已提交 AI 整理，等待管理员审核后进入知识库' : '发帖成功！');
      setModalOpen(false);
      form.resetFields();
      setFileList([]);
      setUploadedUrl('');
      setShareMode('url');
      fetchPosts();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '发帖失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={headerRowStyle}>
        <div>
          <Title level={3} style={{ color: '#f8fafc', margin: 0 }}>
            社区讨论
          </Title>
          <Text style={{ color: '#64748b' }}>交流课程学习经验，AI 助手在线答疑</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchPosts} style={ghostBtnStyle} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              if (!user) { navigate('/login'); return; }
              setModalOpen(true);
            }}
            style={primaryBtnStyle}
          >
            发帖
          </Button>
        </Space>
      </div>

      <div style={filtersStyle}>
        <Select
          placeholder="按课程筛选"
          allowClear
          value={filterTag}
          onChange={setFilterTag}
          style={{ width: 160 }}
          options={COURSE_TAGS.map((t) => ({ value: t, label: t }))}
        />
        <Select
          value={sort}
          onChange={setSort}
          style={{ width: 120 }}
          options={[
            { value: 'new', label: '最新' },
            { value: 'hot', label: '最热' },
          ]}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>加载中…</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
          暂无帖子，来发第一帖吧～
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map((post) => (
            <Card
              key={post.id}
              style={cardStyle}
              hoverable
              onClick={() => navigate(`/community/${post.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {post.course_tag && (
                      <Tag color="blue" style={{ borderRadius: 6 }}>{post.course_tag}</Tag>
                    )}
                    {post.ai_answered && (
                      <Tooltip title="AI 已回复">
                        <Tag icon={<RobotOutlined />} color="purple" style={{ borderRadius: 6 }}>
                          AI 已答
                        </Tag>
                      </Tooltip>
                    )}
                  </div>
                  <Text strong style={{ color: '#e2e8f0', fontSize: 15 }}>
                    {post.title}
                  </Text>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ color: '#94a3b8', marginTop: 4, marginBottom: 0 }}
                  >
                    {post.content}
                  </Paragraph>
                </div>
              </div>
              <div style={metaRowStyle}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>
                  {post.author.display_name || post.author.username}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 12 }}>
                  {new Date(post.created_at).toLocaleDateString('zh-CN')}
                </Text>
                <Space size={16}>
                  <span style={metaIconStyle}><EyeOutlined /> {post.view_count}</span>
                  <span style={metaIconStyle}><MessageOutlined /> {post.comment_count}</span>
                </Space>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={<span style={{ color: '#e2e8f0' }}>发布帖子</span>}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        styles={{ content: { background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)' }, header: { background: '#0f172a', borderBottom: '1px solid rgba(148,163,184,0.1)' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="title" label={<span style={{ color: '#94a3b8' }}>标题</span>} rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="帖子标题" style={inputStyle} />
          </Form.Item>
          <Form.Item name="content" label={<span style={{ color: '#94a3b8' }}>内容</span>} rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={5} placeholder="详细描述你的问题或分享…" style={inputStyle} />
          </Form.Item>
          <Form.Item name="course_tag" label={<span style={{ color: '#94a3b8' }}>关联课程（可选）</span>}>
            <Select
              allowClear
              placeholder="选择课程"
              style={{ ...inputStyle, height: undefined }}
              options={COURSE_TAGS.map((t) => ({ value: t, label: t }))}
            />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#94a3b8' }}>分享资源（可选）</span>}>
            <Tabs
              size="small"
              activeKey={shareMode}
              onChange={(k) => setShareMode(k as 'url' | 'file')}
              style={{ marginBottom: 0 }}
              items={[
                {
                  key: 'url',
                  label: <span><LinkOutlined /> 外部链接</span>,
                  children: (
                    <Form.Item
                      name="share_url"
                      noStyle
                      rules={shareMode === 'url' ? [{ type: 'url', message: '请输入有效的 URL' }] : []}
                    >
                      <Input
                        placeholder="B站、知乎、GitHub、MOOC 等链接..."
                        style={inputStyle}
                      />
                    </Form.Item>
                  ),
                },
                {
                  key: 'file',
                  label: <span><PaperClipOutlined /> 上传文件</span>,
                  children: (
                    <Upload
                      fileList={fileList}
                      maxCount={1}
                      accept=".pdf,.jpg,.jpeg,.png,.txt,.zip"
                      customRequest={async ({ file, onSuccess, onError }) => {
                        if (!token) { message.warning('请先登录'); return; }
                        try {
                          const url = await communityApi.uploadFile(file as File, token);
                          setUploadedUrl(url);
                          onSuccess?.({});
                          message.success('文件上传成功');
                        } catch (e: any) {
                          onError?.(e);
                          message.error(e?.response?.data?.detail || '上传失败');
                        }
                      }}
                      onChange={({ fileList: fl }) => setFileList(fl)}
                      onRemove={() => { setUploadedUrl(''); }}
                    >
                      <Button icon={<PaperClipOutlined />} style={ghostBtnStyle}>
                        选择文件（PDF / 图片 / ZIP，最大 50MB）
                      </Button>
                    </Upload>
                  ),
                },
              ]}
            />
            <div style={{ color: '#475569', fontSize: 12, marginTop: 6 }}>
              AI 自动提取信息，管理员审核通过后进入知识库
            </div>
          </Form.Item>
          <Form.Item name="needs_ai" label={<span style={{ color: '#94a3b8' }}>需要 AI 解答</span>} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting} style={primaryBtnStyle}>
            发布
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 20,
};

const filtersStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 20,
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(14, 24, 40, 0.9)',
  border: '1px solid rgba(125, 211, 252, 0.1)',
  borderRadius: 14,
  cursor: 'pointer',
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginTop: 12,
};

const metaIconStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const primaryBtnStyle: React.CSSProperties = {
  borderRadius: 10,
  background: 'linear-gradient(90deg, #0891b2, #4f46e5)',
  border: 'none',
};

const ghostBtnStyle: React.CSSProperties = {
  borderRadius: 10,
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(148,163,184,0.2)',
  color: '#94a3b8',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(15,23,42,0.8)',
  border: '1px solid rgba(71,85,105,0.4)',
  color: '#f8fafc',
  borderRadius: 10,
};

export default CommunityPage;
