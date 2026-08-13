'use client';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '@/lib/api';
import { io } from 'socket.io-client';
import { Send, MessageSquare, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const { user } = useSelector(state => state.auth);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchConversations();

    // Initialize socket
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');
    socketInstance.emit('join', String(user?._id || user?.id));
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      if (selectedConv && String(msg.conversationId) === String(selectedConv._id)) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const handleMessageDeleted = ({ messageId, conversationId }) => {
      if (selectedConv && String(conversationId) === String(selectedConv._id)) {
        setMessages(prev => prev.filter(m => String(m._id || m.id) !== String(messageId)));
      }
    };

    const handleChatCleared = ({ conversationId }) => {
      if (selectedConv && String(conversationId) === String(selectedConv._id)) {
        setMessages([]);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('chatCleared', handleChatCleared);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('chatCleared', handleChatCleared);
    };
  }, [socket, selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      // Get user's applications to create conversations
      const { data } = await api.get('/applications/my');
      const apps = data.applications;

      // Also get brand-side applications if brand
      let brandApps = [];
      if (user?.role === 'brand') {
        const { data: campaigns } = await api.get('/campaigns/my');
        for (const c of campaigns.campaigns?.slice(0, 5) || []) {
          try {
            const { data: appData } = await api.get(`/applications/campaign/${c._id}`);
            brandApps.push(...(appData.applications || []));
          } catch {}
        }
      }

      const allApps = [...apps, ...brandApps].filter((a, i, arr) =>
        arr.findIndex(x => x._id === a._id) === i
      );

      setConversations(allApps);
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = async (app) => {
    setSelectedConv(app);
    try {
      const { data } = await api.get(`/messages/${app._id}`);
      setMessages(data.messages);
    } catch (err) {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    setSending(true);

    const currentUserId = user?._id || user?.id;
    const creatorId = selectedConv.creator?._id || selectedConv.creator?.id || selectedConv.creatorId || selectedConv.creator;
    const brandId = selectedConv.brand?._id || selectedConv.brand?.id || selectedConv.brandId || selectedConv.brand;

    const receiverId = String(currentUserId) === String(creatorId) ? brandId : creatorId;

    try {
      const { data } = await api.post('/messages', {
        receiverId,
        message: newMessage,
        conversationId: selectedConv._id
      });
      setMessages(prev => [...prev, { ...data.message, sender: { _id: user._id || user.id, id: user.id || user._id, name: user.name, avatar: user.avatar, role: user.role } }]);
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File is too large (max 50MB)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setSending(true);
    const toastId = toast.loading('Uploading media...');
    try {
      const { data: uploadData } = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const currentUserId = user?._id || user?.id;
      const creatorId = selectedConv.creator?._id || selectedConv.creator?.id || selectedConv.creatorId || selectedConv.creator;
      const brandId = selectedConv.brand?._id || selectedConv.brand?.id || selectedConv.brandId || selectedConv.brand;
      const receiverId = String(currentUserId) === String(creatorId) ? brandId : creatorId;

      const { data: msgData } = await api.post('/messages', {
        receiverId,
        conversationId: selectedConv._id,
        fileUrl: uploadData.fileUrl,
        fileType: uploadData.fileType,
        message: ''
      });

      setMessages(prev => [
        ...prev,
        {
          ...msgData.message,
          sender: {
            _id: user._id || user.id,
            id: user.id || user._id,
            name: user.name,
            avatar: user.avatar,
            role: user.role
          }
        }
      ]);
      toast.success('Media sent successfully!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send media', { id: toastId });
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages(prev => prev.filter(m => String(m._id || m.id) !== String(messageId)));
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const clearChat = async () => {
    if (!selectedConv) return;
    if (!confirm('Are you sure you want to delete all chat history in this conversation? This cannot be undone.')) return;
    try {
      await api.delete(`/messages/conversation/${selectedConv._id}`);
      setMessages([]);
      toast.success('Chat history cleared');
    } catch (err) {
      toast.error('Failed to clear chat');
    }
  };

  const getUserId = () => user?._id || user?.id;
  const isMine = (msg) => {
    const senderId = msg.sender?._id || msg.sender?.id || msg.sender;
    return senderId?.toString() === getUserId()?.toString();
  };

  const getOtherParty = (app) => {
    const currentUserId = user?._id || user?.id;
    const creatorId = app.creator?._id || app.creator?.id || app.creatorId || app.creator;
    if (String(currentUserId) === String(creatorId)) {
      return app.brand;
    }
    return app.creator;
  };

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 ml-64">
        <div className="flex h-screen">
          {/* Conversation List */}
          <div className="w-80 glass border-r border-dark-600 overflow-y-auto">
            <div className="p-6 border-b border-dark-600">
              <h2 className="font-bold text-xl">Messages</h2>
              <p className="text-gray-400 text-sm">{conversations.length} conversations</p>
            </div>

            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs text-gray-500 mt-1">Apply to campaigns to start chatting</p>
              </div>
            ) : conversations.map(app => {
              const other = getOtherParty(app);
              return (
                <div
                  key={app._id}
                  onClick={() => selectConversation(app)}
                  className={`p-4 border-b border-dark-600 cursor-pointer transition-all ${
                    selectedConv?._id === app._id ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : 'hover:bg-dark-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'U')}&background=22223A&color=4F63FF&size=40`}
                      className="w-10 h-10 rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{other?.name}</div>
                      <div className="text-xs text-gray-500 truncate">{app.campaign?.title || 'Campaign'}</div>
                      <span className={`text-xs mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                        app.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>{app.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="glass border-b border-dark-600 p-4 flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getOtherParty(selectedConv)?.name || 'U')}&background=4F63FF&color=fff&size=40`}
                    className="w-10 h-10 rounded-xl"
                  />
                  <div>
                    <div className="font-semibold">{getOtherParty(selectedConv)?.name}</div>
                    <div className="text-xs text-gray-400">{selectedConv.campaign?.title}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-mono ${
                      selectedConv.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      Deal: {selectedConv.status}
                    </span>
                    <button
                      onClick={clearChat}
                      className="text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 font-semibold animate-pulse hover:animate-none"
                      title="Clear entire conversation"
                    >
                      <Trash2 size={12} /> Clear Chat
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-400 py-12">
                      <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No messages yet. Say hello! 👋</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const mine = isMine(msg);
                    const senderName = msg.sender?.name || (mine ? user?.name : 'Other User');
                    const senderRole = msg.sender?.role || (mine ? user?.role : '');

                    return (
                      <div key={i} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                        {/* Sender details */}
                        <div className="flex items-center gap-1.5 mb-1 px-2 text-[11px] text-gray-400">
                          <span className="font-semibold text-gray-300">{senderName}</span>
                          {senderRole && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] uppercase font-mono tracking-wider font-semibold ${
                              senderRole === 'brand' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {senderRole}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 group max-w-xs lg:max-w-md">
                          {mine && (
                            <button
                              onClick={() => deleteMessage(msg._id || msg.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1.5 bg-dark-700/50 hover:bg-dark-600 rounded-lg flex-shrink-0"
                              title="Delete message"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          <div className={`w-full px-4 py-3 rounded-2xl ${
                            mine
                              ? 'bg-primary-500 text-white rounded-br-sm'
                              : 'glass text-white rounded-bl-sm'
                          }`}>
                            {msg.fileUrl && (
                              <div className="mb-2 rounded-lg overflow-hidden border border-white/10 max-w-sm">
                                {msg.fileType?.startsWith('image') ? (
                                  <img 
                                    src={getMediaUrl(msg.fileUrl)} 
                                    alt="Attachment" 
                                    className="w-full h-auto object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity" 
                                    onClick={() => window.open(getMediaUrl(msg.fileUrl), '_blank')}
                                  />
                                ) : msg.fileType?.startsWith('video') ? (
                                  <video 
                                    src={getMediaUrl(msg.fileUrl)} 
                                    controls 
                                    className="w-full h-auto max-h-64"
                                  />
                                ) : (
                                  <a 
                                    href={getMediaUrl(msg.fileUrl)} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-2 p-2 bg-dark-800/40 text-blue-400 hover:underline"
                                  >
                                    📎 Download Attachment
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                            <p className={`text-xs mt-1 ${mine ? 'text-primary-200' : 'text-gray-500'}`}>
                              {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="glass border-t border-dark-600 p-4">
                  <div className="flex items-center gap-3">
                    <label className="p-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-dark-500 rounded-xl cursor-pointer text-gray-400 hover:text-white transition-all flex items-center justify-center flex-shrink-0">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,video/*" 
                        onChange={handleFileUpload} 
                        disabled={sending}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    </label>

                    <input
                      className="input-field flex-1"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="btn-primary px-4 py-3 flex-shrink-0"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Select a conversation</p>
                  <p className="text-sm text-gray-500">Your deals and chats appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
