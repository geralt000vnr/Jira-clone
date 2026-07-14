import axiosClient from './axiosClient';

export const issueApi = {
  list: (params) => axiosClient.get('/issues', { params }).then((r) => r.data.issues),
  get: (id) => axiosClient.get(`/issues/${id}`).then((r) => r.data), // { issue, subtasks }
  create: (payload) => axiosClient.post('/issues', payload).then((r) => r.data.issue),
  update: (id, payload) => axiosClient.patch(`/issues/${id}`, payload).then((r) => r.data.issue),
  move: (id, payload) => axiosClient.patch(`/issues/${id}/move`, payload).then((r) => r.data.issue),
  remove: (id) => axiosClient.delete(`/issues/${id}`).then((r) => r.data),
  activity: (id) => axiosClient.get(`/issues/${id}/activity`).then((r) => r.data.activity),
};
