import axios from 'axios';

export interface UserOut {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserOut;
}

const api = axios.create({ baseURL: '/api' });

export const authApi = {
  sendCode: (email: string) =>
    api.post('/auth/send-code', { email }).then((r) => r.data),

  register: (data: { username: string; email: string; code: string; password: string }) =>
    api.post<TokenResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { username: string; password: string }) =>
    api.post<TokenResponse>('/auth/login', data).then((r) => r.data),

  me: (token: string) =>
    api
      .get<UserOut>('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.data),
};
