import axiosClient from './axiosClient';

export const authApi = {
  login: (email, password) => axiosClient.post('/auth/login', { email, password }).then((r) => r.data),
  signup: (payload) => axiosClient.post('/auth/signup', payload).then((r) => r.data),
};
