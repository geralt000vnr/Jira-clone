import axiosClient from './axiosClient';

export const dashboardApi = {
  getMyIssues: () => axiosClient.get('/dashboard/my-issues').then((r) => r.data.issues),
  getActivity: () => axiosClient.get('/dashboard/activity').then((r) => r.data.activity),
};
