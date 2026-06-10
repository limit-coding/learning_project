import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Form,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  LinkOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PendingResource {
  id: number;
  title: string;
  url: string;
  resource_type: string;
  summary: string;
  submitted_by: string;
  created_at: string;
}

const RESOURCE_TYPES = ['video', 'article', 'book', 'course', 'tool', 'other'];

const AdminReviewPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<PendingResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
    fetchPending();
  }, [user]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/resources/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResources(res.data);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject', extra?: { summary?: string; resource_type?: string }) => {
    setActing(id);
    try {
      await axios.post(
        `/api/resources/${id}/review`,
        { action, reviewer: user!.username, ...extra },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      message.success(action === 'approve' ? '已通过，资源进入知识库' : '已拒绝');
      setEditingId(null);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      message.error(e?.response?.data?.detail || '操作失败');
    } finally {
      setActing(null);
    }
  };

  const handleApproveWithEdit = async (id: number) => {
    const values = await form.validateFields();
    await handleAction(id, 'approve', {
      summary: values.summary || undefined,
      resource_type: values.resource_type || undefined,
    });
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ color: '#f8fafc', margin: 0 }}>资源审核</Title>
          <Text style={{ color: '#64748b' }}>用户提交的待审核资源，approve 后进入 AI 知识库</Text>
        </div>
        <Space>
          <Badge count={resources.length} color="#0891b2">
            <Button icon={<ReloadOutlined />} onClick={fetchPending} loading={loading} style={ghostBtn}>
              刷新
            </Button>
          </Badge>
        </Space>
      </div>

      {resources.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>暂无待审资源</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {resources.map((r) => (
          <Card key={r.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <Tag color="orange" style={{ borderRadius: 6 }}>待审</Tag>
                  <Tag color="default" style={{ borderRadius: 6 }}>{r.resource_type}</Tag>
                  <Text style={{ color: '#64748b', fontSize: 12 }}>by {r.submitted_by}</Text>
                  <Text style={{ color: '#64748b', fontSize: 12 }}>
                    {new Date(r.created_at).toLocaleDateString('zh-CN')}
                  </Text>
                </div>
                <Text strong style={{ color: '#e2e8f0', fontSize: 15, display: 'block', marginBottom: 6 }}>
                  {r.title}
                </Text>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#38bdf8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <LinkOutlined />
                  {r.url.startsWith('/uploads/')
                    ? r.title
                    : (r.url.length > 60 ? r.url.slice(0, 60) + '…' : r.url)}
                </a>
                {r.summary && r.summary !== '（待管理员审核后填写摘要）' && (
                  <Text style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginTop: 6 }}>
                    {r.summary}
                  </Text>
                )}
              </div>

              <Space direction="vertical" size={6} style={{ flexShrink: 0 }}>
                <Button
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => setEditingId(editingId === r.id ? null : r.id)}
                  style={{ borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', width: 80 }}
                >
                  通过
                </Button>
                <Popconfirm
                  title="确认拒绝并删除？"
                  onConfirm={() => handleAction(r.id, 'reject')}
                  okText="拒绝" cancelText="取消"
                >
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    loading={acting === r.id}
                    style={{ borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', width: 80 }}
                  >
                    拒绝
                  </Button>
                </Popconfirm>
              </Space>
            </div>

            {editingId === r.id && (
              <Form form={form} layout="vertical" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(71,85,105,0.2)' }}>
                <Form.Item name="resource_type" label={<span style={{ color: '#94a3b8' }}>资源类型（可修正）</span>} initialValue={r.resource_type}>
                  <Select
                    options={RESOURCE_TYPES.map((t) => ({ value: t, label: t }))}
                    style={{ width: 160 }}
                  />
                </Form.Item>
                <Form.Item name="summary" label={<span style={{ color: '#94a3b8' }}>摘要（可选填）</span>}>
                  <TextArea rows={2} placeholder="简要说明这个资源的内容和适用人群…" style={inputStyle} />
                </Form.Item>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={acting === r.id}
                  onClick={() => handleApproveWithEdit(r.id)}
                  style={{ borderRadius: 10, background: 'linear-gradient(90deg,#059669,#0891b2)', border: 'none' }}
                >
                  确认通过并入库
                </Button>
              </Form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(14,24,40,0.9)',
  border: '1px solid rgba(125,211,252,0.1)',
  borderRadius: 14,
};
const ghostBtn: React.CSSProperties = {
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

export default AdminReviewPage;
