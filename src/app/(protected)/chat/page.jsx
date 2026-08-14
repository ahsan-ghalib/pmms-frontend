'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import echo from '@/lib/echo';
import { ChatService } from '@/services/chat.service';
import AudioPlayer from '@/components/chat/AudioPlayer';
import { Send, Image as ImageIcon, Video, Mic, Paperclip, Loader2, File } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id; // Depending on next-auth config, the ID is usually here

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch Conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen to active conversation for new messages
  useEffect(() => {
    if (!activeConversation || !echo) return;

    const channelName = `conversation.${activeConversation.id}`;
    
    echo.private(channelName)
      .listen('MessageSent', (e) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === e.message.id)) return prev;
          return [...prev, e.message];
        });
        scrollToBottom();
        // Update last message timestamp in sidebar
        updateConversationLastMessage(activeConversation.id, new Date());
      });

    return () => {
      echo.leave(channelName);
    };
  }, [activeConversation]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await ChatService.getConversations();
      if (res.success) {
        setConversations(res.data.data); // data.data because it's paginated
      }
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversation) => {
    try {
      setActiveConversation(conversation);
      setLoadingMessages(true);
      const res = await ChatService.getMessages(conversation.id);
      if (res.success) {
        // Reverse because they are likely ordered newest first by the backend API
        setMessages(res.data.data.reverse()); 
        
        // Remove unread count locally
        setConversations(prev => 
          prev.map(c => c.id === conversation.id ? { ...c, unread_count: 0 } : c)
        );
      }
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !activeConversation) return;

    try {
      setSending(true);
      
      const payload = new FormData();
      if (newMessage.trim()) payload.append('body', newMessage.trim());
      attachments.forEach((file) => payload.append('attachments[]', file));

      const res = await ChatService.sendMessage(activeConversation.id, payload);
      
      if (res.success) {
        setMessages((prev) => {
          if (prev.some(m => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
        setNewMessage('');
        setAttachments([]);
        updateConversationLastMessage(activeConversation.id, new Date());
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateConversationLastMessage = (id, date) => {
    setConversations(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, last_message_at: date.toISOString() } : c);
      return updated.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] p-4">
      <div className="flex w-full h-full rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
        
        {/* Sidebar */}
        <div className="w-1/3 max-w-sm border-r border-white/40 flex flex-col backdrop-blur-md">
          <div className="p-6 border-b border-white/40 ">
            <h2 className="text-2xl font-bold text-[#8E54E9]">
              Messages
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {loadingConversations ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => {
                const otherUser = conv.customer_id == userId ? conv.vendor : conv.customer;
                const isActive = activeConversation?.id === conv.id;
                return (
                  <div 
                    key={conv.id} 
                    onClick={() => fetchMessages(conv)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border border-transparent ${
                      isActive 
                        ? 'bg-white/80 shadow-md border-white/60 scale-[1.02]' 
                        : 'hover:bg-white/50 hover:border-white/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className={`font-semibold ${isActive ? 'text-[#8E54E9]' : 'text-gray-800 dark:text-white'}`}>
                        {otherUser?.name || 'User'}
                      </h3>
                      {conv.last_message_at && (
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(conv.last_message_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-4">
                        Click to view conversation...
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-gradient-to-r from-red-400 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-6 text-gray-400 font-medium">No conversations yet</div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 rounded-2xl border-b border-white/40 bg-white/40 backdrop-blur-md flex items-center shadow-sm z-10">
                <div className="w-12 h-12 bg-[#8E54E9] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md mr-4 border-2 border-white">
                  {((activeConversation.customer_id == userId ? activeConversation.vendor?.name : activeConversation.customer?.name) || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">
                    {activeConversation.customer_id == userId ? activeConversation.vendor?.name : activeConversation.customer?.name}
                  </h2>
                  <p className="text-xs text-[#8E54E9] font-medium">Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender_id == userId;
                    return (
                      <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div 
                          className={`max-w-[70%] rounded-3xl p-4 shadow-md backdrop-blur-sm ${
                            isMine 
                              ? 'bg-[#8E54E9] text-white rounded-br-sm border border-white/20' 
                              : 'bg-white/80 text-gray-800 dark:text-white rounded-bl-sm border border-white/60'
                          }`}
                        >
                          {msg.body && <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.body}</p>}
                          
                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {msg.attachments.map((url, i) => {
                                const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);
                                const isVideo = url.match(/\.(mp4|mov)$/i);
                                const isAudio = url.match(/\.(mp3|wav|m4a)$/i);
                                
                                if (isImage) {
                                  return <img key={i} src={url} alt="attachment" className="rounded-xl max-h-56 object-cover border border-white/20 shadow-sm" />;
                                } else if (isVideo) {
                                  return <video key={i} src={url} controls className="rounded-xl max-h-56 border border-white/20 shadow-sm" />;
                                } else if (isAudio) {
                                  return <AudioPlayer key={i} src={url} isMine={isMine} />;
                                }
                                return (
                                  <a key={i} href={url} target="_blank" rel="noreferrer" className={`flex items-center text-sm font-medium hover:underline ${isMine ? 'text-blue-100' : 'text-blue-600'}`}>
                                    <File className="w-4 h-4 mr-1.5" /> Document attached
                                  </a>
                                );
                              })}
                            </div>
                          )}
                          <span className={`text-[10px] mt-2 block font-medium ${isMine ? 'text-blue-100/70' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Input Area */}
              <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-md border-t border-white/60">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 px-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center text-gray-700 dark:text-gray-200 shadow-sm border border-white">
                        <Paperclip className="w-3 h-3 mr-1.5 text-blue-500" />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                      </div>
                    ))}
                    <button onClick={() => setAttachments([])} className="text-xs text-red-500 font-medium hover:text-red-600 px-2">Clear All</button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 text-gray-500 dark:text-gray-400 hover:text-purple-600 bg-white/60 hover:bg-white rounded-full shadow-sm border border-white/60 transition-all active:scale-95"
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-3xl flex items-center px-5 py-2.5 shadow-inner border border-white/60 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-200 transition-all">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="w-full bg-transparent border-none outline-none resize-none max-h-32 text-gray-800 dark:text-white placeholder-gray-400 py-1"
                      rows="1"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                    className="p-3.5 bg-[#8E54E9] text-white rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center active:scale-95"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm rounded-2xl">
              <div className="w-32 h-32 mb-6 bg-white/50 backdrop-blur-md rounded-full shadow-xl border border-white/60 flex items-center justify-center">
                <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-700 dark:text-gray-200 bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-500">
                Select a conversation
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Start chatting with your customers or vendors</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
