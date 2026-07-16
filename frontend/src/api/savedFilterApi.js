import axiosClient from './axiosClient';

export const savedFilterApi = {
  list: (projectId) => axiosClient.get(`/projects/${projectId}/saved-filters`).then((r) => r.data.filters),
  create: (projectId, payload) =>
    axiosClient.post(`/projects/${projectId}/saved-filters`, payload).then((r) => r.data.filter),
  remove: (id) => axiosClient.delete(`/saved-filters/${id}`).then((r) => r.data),
};
