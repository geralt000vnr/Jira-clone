import axiosClient from './axiosClient';

export const sprintApi = {
  list: (projectId) => axiosClient.get('/sprints', { params: { projectId } }).then((r) => r.data.sprints),
  get: (id) => axiosClient.get(`/sprints/${id}`).then((r) => r.data), // { sprint, issues }
  create: (payload) => axiosClient.post('/sprints', payload).then((r) => r.data.sprint),
  update: (id, payload) => axiosClient.patch(`/sprints/${id}`, payload).then((r) => r.data.sprint),
  start: (id) => axiosClient.post(`/sprints/${id}/start`).then((r) => r.data.sprint),
  complete: (id) => axiosClient.post(`/sprints/${id}/complete`).then((r) => r.data.sprint),
  remove: (id) => axiosClient.delete(`/sprints/${id}`).then((r) => r.data),
  addIssue: (sprintId, issueId) =>
    axiosClient.post(`/sprints/${sprintId}/issues`, { issueId }).then((r) => r.data.issue),
  burndown: (id) => axiosClient.get(`/sprints/${id}/burndown`).then((r) => r.data), // { data, totalPoints }
};
