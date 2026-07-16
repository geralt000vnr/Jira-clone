import axiosClient from './axiosClient';

export const worklogApi = {
  list: (issueId) => axiosClient.get(`/issues/${issueId}/worklogs`).then((r) => r.data.worklogs),
  create: (issueId, payload) =>
    axiosClient.post(`/issues/${issueId}/worklogs`, payload).then((r) => r.data), // { worklog, issue }
  remove: (id) => axiosClient.delete(`/worklogs/${id}`).then((r) => r.data),
};
