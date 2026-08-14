import axiosInstance from '@/lib/axios';

export const ChatService = {
  getConversations: async (page = 1) => {
    const response = await axiosInstance.get(`/chat/conversations?page=${page}`);
    return response.data;
  },

  getMessages: async (conversationId, page = 1) => {
    const response = await axiosInstance.get(`/chat/conversations/${conversationId}/messages?page=${page}`);
    return response.data;
  },

  storeConversation: async (vendorId) => {
    const response = await axiosInstance.post(`/chat/conversations`, { vendor_id: vendorId });
    return response.data;
  },

  sendMessage: async (conversationId, payload) => {
    // payload can be FormData if there are attachments
    const isFormData = payload instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    
    const response = await axiosInstance.post(`/chat/conversations/${conversationId}/messages`, payload, config);
    return response.data;
  }
};
