import axiosInstance from "@/lib/axios";

const BASE = "/whatsapp";

export const whatsappApi = {
  getConversations: async (page = 1, limit = 20) => {
    const response = await axiosInstance.get(`${BASE}/conversations`, {
      params: { page, limit },
    });
    return response.data;
  },

  getConversationMessages: async (conversationId, page = 1, limit = 50) => {
    const response = await axiosInstance.get(
      `${BASE}/conversations/${conversationId}/messages`,
      { params: { page, limit } }
    );
    return response.data;
  },

  getConversationByPhoneNumber: async (phoneNumber) => {
    const response = await axiosInstance.get(
      `${BASE}/conversations/phone/${encodeURIComponent(phoneNumber)}`
    );
    return response.data;
  },

  startConversation: async (phoneNumber, contactName = null) => {
    const payload = { phoneNumber: phoneNumber.replace(/\D/g, "") };
    if (contactName) payload.contactName = contactName;
    const response = await axiosInstance.post(`${BASE}/conversations/start`, payload);
    return response.data;
  },

  sendMessage: async (phoneNumber, message, media, template) => {
    const payload = {
      phoneNumber,
      message: template?.name ? "" : ((message ?? "").trim() || " "),
    };
    if (template?.name) {
      payload.template = {
        name: template.name,
        language: template.language,
        parameters: template.parameters,
        documentUrl: template.documentUrl,
        documentFilename: template.documentFilename,
      };
    } else if (media?.url) {
      payload.media = {
        type: media.type || "document",
        url: media.url,
        filename: media.filename,
        caption: media.caption,
      };
    }
    const response = await axiosInstance.post(`${BASE}/send-message`, payload);
    return response.data;
  },

  getTemplates: async () => {
    const response = await axiosInstance.get(`${BASE}/templates`);
    return response.data;
  },

  createTemplate: async (templateData) => {
    const response = await axiosInstance.post(`${BASE}/templates`, templateData);
    return response.data;
  },

  updateTemplate: async (id, templateData) => {
    const response = await axiosInstance.put(
      `${BASE}/templates/${id}`,
      templateData
    );
    return response.data;
  },

  deleteTemplate: async (id) => {
    const response = await axiosInstance.delete(`${BASE}/templates/${id}`);
    return response.data;
  },
};

/**
 * Format message content for display (e.g. template placeholders).
 * Returns { isTemplate: true, templateName, content } or plain string.
 */
export function formatTemplateMessage(content) {
  if (content == null || content === "") return "";
  if (typeof content !== "string") return content;
  // Simple pass-through; extend to parse template placeholders if needed
  return content;
}
