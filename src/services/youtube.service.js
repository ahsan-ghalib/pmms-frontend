import api from '@/lib/axios';

export const getGoogleAccounts = async () => {
    return await api.get('/youtube/google-accounts');
};

export const reAuthenticateAccount = async (id) => {
    return await api.post(`/youtube/google-accounts/${id}/re-authenticate`);
};

export const deleteGoogleAccount = async (id) => {
    return await api.delete(`/youtube/google-accounts/${id}`);
};

export const discoverChannels = async (id) => {
    return await api.get(`/youtube/google-accounts/${id}/channels/discover`);
};

export const syncChannel = async (googleAccountId, data) => {
    return await api.post('/youtube/channels', { ...data, google_account_id: googleAccountId });
};

export const requestActivation = async (channelId) => {
    return await api.post(`/youtube/channels/${channelId}/activate`);
};

export const getLiveReadiness = async () => {
    return await api.get('/youtube/readiness');
};

export const listChannels = async () => {
    return await api.get('/youtube/channels');
};
