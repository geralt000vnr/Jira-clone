import axiosClient from './axiosClient';

export const projectApi = {
  list: () => axiosClient.get('/projects').then((r) => r.data.projects),
  get: (id) => axiosClient.get(`/projects/${id}`).then((r) => r.data.project),
  create: (payload) => axiosClient.post('/projects', payload).then((r) => r.data.project),
  update: (id, payload) => axiosClient.patch(`/projects/${id}`, payload).then((r) => r.data.project),
  remove: (id) => axiosClient.delete(`/projects/${id}`).then((r) => r.data),
  listMembers: (id) => axiosClient.get(`/projects/${id}/members`).then((r) => r.data.members),
  addMember: (id, userId, role) =>
    axiosClient.post(`/projects/${id}/members`, { userId, role }).then((r) => r.data.membership),
  removeMember: (id, userId) => axiosClient.delete(`/projects/${id}/members/${userId}`).then((r) => r.data),
};
