import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Input,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  LinkOutlined,
  MessageOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { communityApi, CommentOut, PostDetail } from '../services/communityApi';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CommunityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchPost = async () => {
    if (!id || !token) return;
    try {
      const data = await communityApi.getPost(Number(id), token);
      setPost(data);
    } catch {
      message.error('帖子不存在或加载失败');
      navigate('/community');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id, token]);

  const handleReply = (commentId: number, authorName: string) => {
    setReplyTo({ id: commentId, name: authorName });
    setCommentText(`@${authorName} `);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleAtAI = () => {
    setReplyTo(null);
    setCommentText('@AI助手 ');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = async () => {
    if (!token) { message.warning('请先登录'); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await communityApi.addComment(
        Number(id),
        { content: commentText.trim(), parent_id: replyTo?.id },
        token,
      );
      message.success(commentText.includes('@AI助手') ? 'AI 正在思考中…' : '回复成功');
      setCommentText('');
      setReplyTo(null);
      await fetchPost();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '发送失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!token) return;
    try {
      await communityApi.deletePost(Number(id), token);
      message.success('帖子已删除');
      navigate('/community');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '删除失败');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#64748b' }}>加载中…</div>;
  }
  if (!post) return null;

  const isAuthor = user?.id === post.author.id;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/community')}
        style={ghostBtnStyle}
      >
        返回社区
      </Button>

      <Card style={{ ...cardStyle, marginTop: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {post.course_tag && <Tag color="blue" style={{ borderRadius: 6 }}>{post.course_tag}</Tag>}
              {post.ai_answered && (
                <Tag icon={<RobotOutlined />} color="purple" style={{ borderRadius: 6 }}>AI 已答</Tag>
              )}
              {post.share_url && (
                <Tag icon={<LinkOutlined />} color="cyan" style={{ borderRadius: 6 }}>含附件</Tag>
              )}
            </div>
            <Title level={3} style={{ color: '#f8fafc', margin: '0 0 12px' }}>{post.title}</Title>
          </div>
          {isAuthor && (
            <Popconfirm title="确定删除此帖子？" onConfirm={handleDeletePost} okText="删除" cancelText="取消">
              <Button icon={<DeleteOutlined />} danger size="small" style={{ marginLeft: 12 }} />
            </Popconfirm>
          )}
        </div>

        <div style={{ color: '#cbd5e1', lineHeight: 1.75, marginBottom: 16 }}>
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {post.share_url && (() => {
          type FileEntry = { url: string; name: string };
          let entries: FileEntry[];
          try {
            const parsed = JSON.parse(post.share_url!);
            if (Array.isArray(parsed)) {
              entries = parsed.map((item) =>
                typeof item === 'string'
                  ? { url: item, name: item.split('/').pop() || item }
                  : item as FileEntry
              );
            } else {
              entries = [{ url: post.share_url!, name: post.share_url!.split('/').pop() || post.share_url! }];
            }
          } catch {
            entries = [{ url: post.share_url!, name: post.share_url!.split('/').pop() || post.share_url! }];
          }
          return (
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.map((entry, entryIdx) => (
                <div key={entryIdx} style={{
                  padding: '10px 14px',
                  background: 'rgba(6,182,212,0.08)',
                  border: '1px solid rgba(6,182,212,0.25)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <LinkOutlined style={{ color: '#22d3ee', flexShrink: 0 }} />
                  <Text style={{ color: '#7dd3fc', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name}
                  </Text>
                  <Button
                    size="small"
                    icon={entry.url.startsWith('/uploads') ? <DownloadOutlined /> : <LinkOutlined />}
                    href={entry.url}
                    target="_blank"
                    download={entry.url.startsWith('/uploads') ? entry.name : undefined}
                    style={{ flexShrink: 0, borderRadius: 8, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}
                  >
                    {entry.url.startsWith('/uploads') ? '下载' : '访问链接'}
                  </Button>
                </div>
              ))}
            </div>
          );
        })()}

        <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 13, flexWrap: 'wrap' }}>
          <span>{post.author.display_name || post.author.username}</span>
          <span>{new Date(post.created_at).toLocaleString('zh-CN')}</span>
          <span><EyeOutlined /> {post.view_count}</span>
          <span><MessageOutlined /> {post.comment_count}</span>
        </div>
      </Card>

      <div style={{ marginBottom: 16 }}>
        <Text style={{ color: '#94a3b8', fontWeight: 600, fontSize: 15 }}>
          {post.comment_count} 条回复
        </Text>
        <Tooltip title="呼叫 AI 助手">
          <Button
            icon={<RobotOutlined />}
            size="small"
            onClick={handleAtAI}
            style={{ marginLeft: 12, borderRadius: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}
          >
            @AI助手
          </Button>
        </Tooltip>
      </div>

      {post.comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          暂无回复，来发表第一条吧
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {post.comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      <Card style={{ ...cardStyle, marginTop: 8 }}>
        {replyTo && (
          <div style={{ marginBottom: 8, color: '#7dd3fc', fontSize: 13 }}>
            回复 <strong>@{replyTo.name}</strong>
            <Button
              type="link"
              size="small"
              onClick={() => { setReplyTo(null); setCommentText(''); }}
              style={{ color: '#64748b', padding: '0 4px' }}
            >
              取消
            </Button>
          </div>
        )}
        <TextArea
          ref={inputRef as any}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
          placeholder={user ? '写下你的回复… 输入 @AI助手 可触发 AI 回复' : '请先登录后发表回复'}
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
          }}
          disabled={!user}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            disabled={!user || !commentText.trim()}
            style={primaryBtnStyle}
          >
            {user ? '发送 (Ctrl+Enter)' : '请先登录'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const CommentCard: React.FC<{
  comment: CommentOut;
  onReply: (id: number, name: string) => void;
  currentUserId?: number;
  depth?: number;
}> = ({ comment, onReply, currentUserId, depth = 0 }) => {
  const authorName = comment.author?.display_name || comment.author?.username || 'AI助手';
  const isAI = comment.is_ai;

  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0 }}>
      <Card
        size="small"
        style={{
          ...cardStyle,
          border: isAI
            ? '1px solid rgba(139,92,246,0.35)'
            : '1px solid rgba(125,211,252,0.1)',
          background: isAI ? 'rgba(88,28,135,0.12)' : 'rgba(14,24,40,0.9)',
        }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <Avatar
            size={32}
            icon={isAI ? <RobotOutlined /> : <UserOutlined />}
            style={{
              flexShrink: 0,
              background: isAI
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : 'linear-gradient(135deg, #0891b2, #4f46e5)',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Text strong style={{ color: isAI ? '#c4b5fd' : '#7dd3fc', fontSize: 13 }}>
                {isAI ? 'AI助手' : authorName}
              </Text>
              {isAI && <Tag color="purple" style={{ borderRadius: 6, fontSize: 11 }}>AI</Tag>}
              <Text style={{ color: '#64748b', fontSize: 12 }}>
                {new Date(comment.created_at).toLocaleString('zh-CN')}
              </Text>
            </div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: 14 }}>
              {isAI ? (
                <ReactMarkdown>{comment.content}</ReactMarkdown>
              ) : (
                <span>{comment.content}</span>
              )}
            </div>
            {!isAI && (
              <Button
                type="link"
                size="small"
                onClick={() => onReply(comment.id, authorName)}
                style={{ padding: 0, color: '#64748b', fontSize: 12, marginTop: 4 }}
              >
                回复
              </Button>
            )}
          </div>
        </div>
      </Card>

      {comment.replies.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onReply={onReply}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(14, 24, 40, 0.9)',
  border: '1px solid rgba(125, 211, 252, 0.1)',
  borderRadius: 14,
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
