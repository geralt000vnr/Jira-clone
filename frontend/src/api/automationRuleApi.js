import axiosClient from './axiosClient';

export const automationRuleApi = {
  list: (projectId) => axiosClient.get(`/projects/${projectId}/automation-rules`).then((r) => r.data.rules),
  create: (projectId, payload) =>
    axiosClient.post(`/projects/${projectId}/automation-rules`, payload).then((r) => r.data.rule),
  update: (projectId, id, payload) =>
    axiosClient.patch(`/projects/${projectId}/automation-rules/${id}`, payload).then((r) => r.data.rule),
  remove: (projectId, id) =>
    axiosClient.delete(`/projects/${projectId}/automation-rules/${id}`).then((r) => r.data),
};
