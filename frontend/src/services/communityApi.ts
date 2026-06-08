import axios from 'axios';

export interface AuthorOut {
  id: number;
  username: string;
  display_name: string | null;
}

export interface CommentOut {
  id: number;
  content: string;
  is_ai: boolean;
  author: AuthorOut | null;
  created_at: string;
  replies: CommentOut[];
}

export interface PostListItem {
  id: number;
  title: string;
  content: string;
  course_tag: string | null;
  needs_ai: boolean;
  ai_answered: boolean;
  view_count: number;
  comment_count: number;
  share_url: string | null;
  author: AuthorOut;
  created_at: string;
}

export interface PostDetail extends PostListItem {
  comments: CommentOut[];
}

const api = axios.create({ baseURL: '/api' });

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const communityApi = {
  listPosts: (params: { course_tag?: string; sort?: string; skip?: number; limit?: number } | undefined, token: string) =>
    api.get<PostListItem[]>('/community/posts', { params, headers: authHeader(token) }).then((r) => r.data),

  createPost: (
    data: { title: string; content: string; course_tag?: string; needs_ai?: boolean; share_url?: string },
    token: string,
  ) =>
    api
      .post<PostListItem>('/community/posts', data, { headers: authHeader(token) })
      .then((r) => r.data),

  getPost: (id: number, token: string) =>
    api.get<PostDetail>(`/community/posts/${id}`, { headers: authHeader(token) }).then((r) => r.data),

  addComment: (
    postId: number,
    data: { content: string; parent_id?: number },
    token: string,
  ) =>
    api
      .post<CommentOut>(`/community/posts/${postId}/comments`, data, {
        headers: authHeader(token),
      })
      .then((r) => r.data),

  deletePost: (id: number, token: string) =>
    api.delete(`/community/posts/${id}`, { headers: authHeader(token) }),

  uploadFile: async (file: File, token: string): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<{ url: string }>('/upload', form, {
      headers: { ...authHeader(token), 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};
