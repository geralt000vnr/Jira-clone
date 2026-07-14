import axiosClient from './axiosClient';

export const attachmentApi = {
  list: (issueId) => axiosClient.get(`/issues/${issueId}/attachments`).then((r) => r.data.attachments),
  upload: (issueId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient
      .post(`/issues/${issueId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.attachment);
  },
  remove: (id) => axiosClient.delete(`/attachments/${id}`).then((r) => r.data),
  // The file-serving route is auth-gated (JWT required), so a plain <a href> can't
  // load it directly — fetch it through axiosClient (which attaches the token) and
  // hand back a local blob URL the caller can open/download.
  openFile: async (url) => {
    const res = await axiosClient.get(url, { responseType: 'blob' });
    return URL.createObjectURL(res.data);
  },
};
