import axiosClient from './axiosClient';

export const customFieldApi = {
  list: (projectId) => axiosClient.get(`/projects/${projectId}/custom-fields`).then((r) => r.data.fields),
  create: (projectId, payload) =>
    axiosClient.post(`/projects/${projectId}/custom-fields`, payload).then((r) => r.data.field),
  update: (projectId, id, payload) =>
    axiosClient.patch(`/projects/${projectId}/custom-fields/${id}`, payload).then((r) => r.data.field),
  remove: (projectId, id) => axiosClient.delete(`/projects/${projectId}/custom-fields/${id}`).then((r) => r.data),
};
