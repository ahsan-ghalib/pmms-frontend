import api from '@/lib/axios';

export const listActivationRequests = async () => {
    return await api.get('/admin/youtube/activation-requests');
};

export const updateActivationStatus = async (id, data) => {
    return await api.post(`/admin/youtube/activation-requests/${id}/status`, data);
};
