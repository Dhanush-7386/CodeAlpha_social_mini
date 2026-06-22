import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useSocket, useSocketEmit } from '../hooks/useSocket';

/* ─── Helpers ─────────────────────────────────────────────────── */

function Avatar({ user, size = 32 }) {
  if (user?.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: size * 0.4,
        fontWeight: 700,
      }}
    >
      {user?.username?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

/* ─── New Chat Modal ─────────────────────────────────────────── */

function NewChatModal({ onClose, onCreated, currentUserId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef(null);

  const searchUsers = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      const users = res.data.data || res.data || [];
      setResults(users.filter((u) => u._id !== currentUserId));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [currentUserId]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(val), 300);
  };

  const handleSelect = async (userId) => {
    setCreating(true);
    try {
      const res = await api.post('/messages/conversations', {
        participantId: userId,
      });
      const conv = res.data.data || res.data;
      onCreated(conv);
      onClose();
    } catch {
      /* ignore */
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(400px, 90vw)',
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 16 }}>New Message</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <input
            className="input-field"
            value={query}
            onChange={handleInputChange}
            placeholder="Search users…"
            autoFocus
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {searching && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <LoadingSpinner size="sm" />
            </div>
          )}
          {!searching &&
            results.map((u) => (
              <button
                key={u._id}
                onClick={() => handleSelect(u._id)}
                disabled={creating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--bg-tertiary)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'none')
                }
              >
                <Avatar user={u} size={40} />
                <span style={{ fontWeight: 500 }}>{u.username}</span>
              </button>
            ))}
          {!searching && query && results.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--text-secondary)',
                padding: 20,
                fontSize: 14,
              }}
            >
              No users found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Post Preview ────────────────────────────────────── */

function SharedPostPreview({ sharedPost }) {
  const navigate = useNavigate();
  if (!sharedPost) return null;
  return (
    <div
      onClick={() => navigate('/home')}
      style={{
        marginTop: 6,
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        maxWidth: 220,
        background: 'var(--bg-secondary)',
      }}
    >
      {sharedPost.image && (
        <img
          src={sharedPost.image}
          alt=""
          style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
        />
      )}
      <div style={{ padding: '6px 10px', fontSize: 12 }}>
        <span style={{ fontWeight: 600 }}>
          {sharedPost.author?.username || 'User'}
        </span>
        {sharedPost.caption && (
          <span style={{ marginLeft: 4, color: 'var(--text-secondary)' }}>
            {sharedPost.caption.length > 40
              ? sharedPost.caption.slice(0, 40) + '…'
              : sharedPost.caption}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Messages Page ──────────────────────────────────────────── */

export default function MessagesPage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const emit = useSocketEmit();

  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [convSearch, setConvSearch] = useState('');

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const [showNewChat, setShowNewChat] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevConvRef = useRef(null);

  /* ─── Fetch Conversations ──────────────────────────────────── */
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/messages/conversations');
        setConversations(res.data.data || res.data || []);
      } catch {
        setToast({ message: 'Failed to load conversations', type: 'error' });
      } finally {
        setConvLoading(false);
      }
    };
    fetchConversations();
  }, []);

  /* ─── Fetch Messages for active conversation ───────────────── */
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    // Leave previous conversation room
    if (prevConvRef.current && prevConvRef.current !== conversationId) {
      emit('conversation:leave', { conversationId: prevConvRef.current });
    }

    // Join new conversation room
    emit('conversation:join', { conversationId });
    prevConvRef.current = conversationId;

    setMsgLoading(true);
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/conversations/${conversationId}`);
        const data = res.data.data || res.data;
        setMessages(Array.isArray(data) ? data : data.messages || []);
      } catch {
        setMessages([]);
      } finally {
        setMsgLoading(false);
      }
    };
    fetchMessages();
    setMobileView('chat');

    return () => {
      emit('conversation:leave', { conversationId });
    };
  }, [conversationId, emit]);

  /* ─── Auto scroll to bottom ────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  /* ─── Real-time: new message ───────────────────────────────── */
  const handleNewMessage = useCallback(
    (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Update conversation list last message
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversationId
            ? { ...c, lastMessage: msg, updatedAt: msg.createdAt }
            : c
        )
      );
    },
    []
  );
  useSocket('message:received', handleNewMessage);

  /* ─── Real-time: typing indicators ─────────────────────────── */
  const handleTypingShow = useCallback((data) => {
    if (data.userId !== user?._id) {
      setTypingUser(data.username || 'Someone');
    }
  }, [user]);

  const handleTypingHide = useCallback((data) => {
    if (data.userId !== user?._id) {
      setTypingUser(null);
    }
  }, [user]);

  useSocket('typing:show', handleTypingShow);
  useSocket('typing:hide', handleTypingHide);

  /* ─── Send Message ─────────────────────────────────────────── */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || sending || !conversationId) return;
    setSending(true);

    // Stop typing indicator
    emit('typing:stop', { conversationId, userId: user._id });

    try {
      const res = await api.post(`/messages/conversations/${conversationId}`, {
        text: messageText.trim(),
      });
      const newMsg = res.data.data || res.data;
      setMessages((prev) => [...prev, newMsg]);
      emit('message:send', {
        ...newMsg,
        conversationId,
      });
      // Update conversation last message
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, lastMessage: newMsg, updatedAt: newMsg.createdAt }
            : c
        )
      );
      setMessageText('');
    } catch {
      setToast({ message: 'Failed to send message', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  /* ─── Typing ───────────────────────────────────────────────── */
  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!conversationId) return;
    emit('typing:start', {
      conversationId,
      userId: user._id,
      username: user.username,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emit('typing:stop', { conversationId, userId: user._id });
    }, 2000);
  };

  /* ─── Helpers ──────────────────────────────────────────────── */
  const getOtherUser = (conv) => {
    if (conv.otherUser) return conv.otherUser;
    return conv.participants?.find((p) =>
      typeof p === 'object' ? p._id !== user?._id : p !== user?._id
    ) || {};
  };

  const filteredConversations = conversations.filter((c) => {
    if (!convSearch.trim()) return true;
    const other = getOtherUser(c);
    return other?.username?.toLowerCase().includes(convSearch.toLowerCase());
  });

  const activeConv = conversations.find((c) => c._id === conversationId);
  const activeOtherUser = activeConv ? getOtherUser(activeConv) : null;

  const handleNewConversation = (conv) => {
    setConversations((prev) => {
      if (prev.some((c) => c._id === conv._id)) return prev;
      return [conv, ...prev];
    });
    navigate(`/messages/${conv._id}`);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  /* ─── Render ───────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={handleNewConversation}
          currentUserId={user?._id}
        />
      )}

      <main
        style={{
          marginLeft: isMobile ? 0 : 220,
          height: '100vh',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* ─── Left: Conversation List ───────────────────────────── */}
        <div
          style={{
            width: isMobile ? '100%' : 340,
            minWidth: isMobile ? '100%' : 340,
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-secondary)',
            ...(isMobile && mobileView === 'chat' ? { display: 'none' } : {}),
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 16px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Messages</h2>
            <button
              onClick={() => setShowNewChat(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="New message"
              title="New message"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 16px' }}>
            <input
              className="input-field"
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              placeholder="Search conversations…"
              style={{ fontSize: 14 }}
            />
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {convLoading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: 40,
                }}
              >
                <LoadingSpinner size="sm" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                <p style={{ fontSize: 14 }}>No conversations yet</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  style={{
                    marginTop: 12,
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherUser(conv);
                const isActive = conv._id === conversationId;
                const lastMsg = conv.lastMessage;
                return (
                  <button
                    key={conv._id}
                    onClick={() => navigate(`/messages/${conv._id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '14px 16px',
                      background: isActive ? 'var(--bg-tertiary)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Avatar user={other} size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {other?.username || 'Unknown'}
                        </span>
                        {(conv.updatedAt || lastMsg?.createdAt) && (
                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              marginLeft: 8,
                            }}
                          >
                            {timeAgo(conv.updatedAt || lastMsg?.createdAt)}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p
                          style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: 2,
                          }}
                        >
                          {lastMsg.text || 'Shared a post'}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Right: Chat Area ──────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-primary)',
            ...(isMobile && mobileView === 'list' ? { display: 'none' } : {}),
          }}
        >
          {!conversationId ? (
            /* Placeholder */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: '3px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                }}
              >
                ✉️
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                Your Messages
              </h3>
              <p style={{ fontSize: 14 }}>
                Select a conversation to start chatting
              </p>
              <button
                className="btn-primary"
                onClick={() => setShowNewChat(true)}
                style={{ marginTop: 8 }}
              >
                Send Message
              </button>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                }}
              >
                {isMobile && (
                  <button
                    onClick={() => {
                      setMobileView('list');
                      navigate('/messages');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}
                <Avatar user={activeOtherUser} size={36} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {activeOtherUser?.username || 'Unknown'}
                  </div>
                  {activeOtherUser?.isOnline && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--success)',
                          display: 'inline-block',
                        }}
                      />
                      Active now
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {msgLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flex: 1,
                    }}
                  >
                    <LoadingSpinner size="sm" />
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: 14,
                    }}
                  >
                    Say hello! 👋
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMine =
                      (typeof msg.sender === 'object'
                        ? msg.sender._id
                        : msg.sender) === user?._id;
                    return (
                      <div
                        key={msg._id || i}
                        style={{
                          display: 'flex',
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                          marginBottom: 2,
                        }}
                      >
                        <div>
                          <div
                            className={
                              isMine
                                ? 'chat-bubble-sent'
                                : 'chat-bubble-received'
                            }
                            style={{ animation: 'fadeIn 0.2s ease-out' }}
                          >
                            {msg.text}
                          </div>
                          {msg.sharedPost && (
                            <SharedPostPreview sharedPost={msg.sharedPost} />
                          )}
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-secondary)',
                              marginTop: 3,
                              textAlign: isMine ? 'right' : 'left',
                              paddingInline: 4,
                            }}
                          >
                            {timeAgo(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {typingUser && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 0',
                      animation: 'fadeIn 0.2s ease-out',
                    }}
                  >
                    <div
                      className="chat-bubble-received"
                      style={{
                        display: 'flex',
                        gap: 4,
                        padding: '10px 18px',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--text-secondary)',
                          animation: 'pulse 1.4s ease-in-out infinite',
                        }}
                      />
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--text-secondary)',
                          animation: 'pulse 1.4s ease-in-out 0.2s infinite',
                        }}
                      />
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--text-secondary)',
                          animation: 'pulse 1.4s ease-in-out 0.4s infinite',
                        }}
                      />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSend}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <input
                  className="input-field"
                  value={messageText}
                  onChange={handleTyping}
                  placeholder="Message…"
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color:
                      messageText.trim() && !sending
                        ? 'var(--accent)'
                        : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: messageText.trim() ? 'pointer' : 'default',
                    padding: '8px 4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
