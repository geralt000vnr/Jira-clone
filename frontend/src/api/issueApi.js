import axiosClient from './axiosClient';

export const issueApi = {
  list: (params) => axiosClient.get('/issues', { params }).then((r) => r.data.issues),
  get: (id) => axiosClient.get(`/issues/${id}`).then((r) => r.data), // { issue, subtasks, links }
  create: (payload) => axiosClient.post('/issues', payload).then((r) => r.data.issue),
  update: (id, payload) => axiosClient.patch(`/issues/${id}`, payload).then((r) => r.data.issue),
  move: (id, payload) => axiosClient.patch(`/issues/${id}/move`, payload).then((r) => r.data.issue),
  remove: (id) => axiosClient.delete(`/issues/${id}`).then((r) => r.data),
  activity: (id) => axiosClient.get(`/issues/${id}/activity`).then((r) => r.data.activity),
  addLink: (id, payload) => axiosClient.post(`/issues/${id}/links`, payload).then((r) => r.data.link),
  removeLink: (id, linkId) => axiosClient.delete(`/issues/${id}/links/${linkId}`).then((r) => r.data),
  bulkUpdate: (items, updates) => axiosClient.patch('/issues/bulk', { items, updates }).then((r) => r.data),
  bulkRemove: (issueIds) => axiosClient.delete('/issues/bulk', { data: { issueIds } }).then((r) => r.data),
};
