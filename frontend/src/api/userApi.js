import axiosClient from './axiosClient';

export const userApi = {
  lookupByEmail: (email) => axiosClient.get('/users', { params: { email } }).then((r) => r.data.user),
};
