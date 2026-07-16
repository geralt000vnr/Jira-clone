import axiosClient from './axiosClient';

export const workflowStatusApi = {
  list: (projectId) => axiosClient.get(`/projects/${projectId}/workflow-statuses`).then((r) => r.data.statuses),
  create: (projectId, payload) =>
    axiosClient.post(`/projects/${projectId}/workflow-statuses`, payload).then((r) => r.data.status),
  update: (projectId, id, payload) =>
    axiosClient.patch(`/projects/${projectId}/workflow-statuses/${id}`, payload).then((r) => r.data.status),
  remove: (projectId, id) =>
    axiosClient.delete(`/projects/${projectId}/workflow-statuses/${id}`).then((r) => r.data),
};
