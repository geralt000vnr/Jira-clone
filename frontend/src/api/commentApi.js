import axiosClient from './axiosClient';

export const commentApi = {
  list: (issueId) => axiosClient.get(`/issues/${issueId}/comments`).then((r) => r.data.comments),
  create: (issueId, body) => axiosClient.post(`/issues/${issueId}/comments`, { body }).then((r) => r.data.comment),
  update: (id, body) => axiosClient.patch(`/comments/${id}`, { body }).then((r) => r.data.comment),
  remove: (id) => axiosClient.delete(`/comments/${id}`).then((r) => r.data),
};
