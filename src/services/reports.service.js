import axiosInstance from '@/lib/axios';

export const getEarningsReport = async (params = {}) => {
  const { data } = await axiosInstance.get('/reports/earnings', { params });
  return data;
};

export const getDisbursementsReport = async (params = {}) => {
  const { data } = await axiosInstance.get('/reports/disbursements', { params });
  return data;
};

export const getTaxReconciliationReport = async (params = {}) => {
  const { data } = await axiosInstance.get('/reports/tax-reconciliation', { params });
  return data;
};

export const getFreeShippingReport = async (params = {}) => {
  const { data } = await axiosInstance.get('/reports/free-shipping', { params });
  return data;
};
