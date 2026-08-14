import axiosInstance from '@/lib/axios';

export const getTikTokAccount = async () => {
  const { data } = await axiosInstance.get('/tiktok');
  return data;
};

export const submitTikTokAccount = async (payload) => {
  const { data } = await axiosInstance.post('/tiktok', payload);
  return data;
};

// Admin Endpoints
export const getAdminTikTokAccounts = async (params = {}) => {
  const { data } = await axiosInstance.get('/admin/tiktok', { params });
  return data;
};

export const updateAdminTikTokAccountStatus = async (id, payload) => {
  const { data } = await axiosInstance.post(`/admin/tiktok/${id}/status`, payload);
  return data;
};
