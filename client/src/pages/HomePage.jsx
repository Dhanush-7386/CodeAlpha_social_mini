import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

/* ─── SVG Icons ──────────────────────────────────────────────── */

function HeartIcon({ filled }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? '#ED4956' : 'none'}
      stroke={filled ? '#ED4956' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentIcon() {
  return (
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
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
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

/* ─── Comment Modal ──────────────────────────────────────────── */

function CommentModal({ post, user, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get(`/comments/${post._id}`);
        setComments(res.data.data || res.data || []);
      } catch {
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [post._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post('/comments', { postId: post._id, text: text.trim() });
      const newComment = res.data.data || res.data;
      setComments((prev) => [...prev, { ...newComment, author: user }]);
      setText('');
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    } catch {
      /* toast is handled at higher level if needed */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          width: 'min(900px, 95vw)',
          maxHeight: '85vh',
          overflow: 'hidden',
        }}
      >
        {/* Left: Post Image */}
        {post.image && (
          <div
            className="hide-mobile"
            style={{
              flex: '1 1 50%',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
            }}
          >
            <img
              src={post.image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Right: Comments */}
        <div
          style={{
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <Avatar user={post.author} size={32} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {post.author?.username}
            </span>
            <button
              onClick={onClose}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 22,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Caption */}
          {post.caption && (
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <Avatar user={post.author} size={28} />
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, marginRight: 6 }}>
                  {post.author?.username}
                </span>
                {post.caption}
              </div>
            </div>
          )}

          {/* Comments List */}
          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
                <LoadingSpinner size="sm" />
              </div>
            ) : comments.length === 0 ? (
              <p
                style={{
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  padding: 30,
                  fontSize: 14,
                }}
              >
                No comments yet. Be the first!
              </p>
            ) : (
              comments.map((c, i) => (
                <div
                  key={c._id || i}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                >
                  <Avatar user={c.author} size={28} />
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600, marginRight: 6 }}>
                      {c.author?.username}
                    </span>
                    {c.text}
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        marginTop: 4,
                      }}
                    >
                      {timeAgo(c.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid var(--border-color)',
              padding: '10px 16px',
              gap: 10,
            }}
          >
            <input
              className="input-field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                padding: '8px 0',
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontWeight: 600,
                fontSize: 14,
                cursor: text.trim() ? 'pointer' : 'default',
                opacity: text.trim() ? 1 : 0.4,
              }}
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Share Modal ────────────────────────────────────────────── */

function ShareModal({ postId, onClose, onToast }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/messages/conversations');
        setConversations(res.data.data || res.data || []);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleShare = async (conversationId) => {
    setSending(conversationId);
    try {
      await api.post(`/posts/${postId}/share`, { conversationId });
      onToast('Post shared!', 'success');
      onClose();
    } catch {
      onToast('Failed to share post', 'error');
    } finally {
      setSending(null);
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
            padding: '16px',
            borderBottom: '1px solid var(--border-color)',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          Share to…
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
              <LoadingSpinner size="sm" />
            </div>
          ) : conversations.length === 0 ? (
            <p
              style={{
                color: 'var(--text-secondary)',
                textAlign: 'center',
                padding: 30,
                fontSize: 14,
              }}
            >
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => {
              const other = conv.otherUser || conv.participants?.[0];
              return (
                <button
                  key={conv._id}
                  onClick={() => handleShare(conv._id)}
                  disabled={sending === conv._id}
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
                    transition: 'background 0.15s',
                    fontSize: 14,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--bg-tertiary)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'none')
                  }
                >
                  <Avatar user={other} size={40} />
                  <span style={{ fontWeight: 500 }}>
                    {other?.username || 'Unknown'}
                  </span>
                  {sending === conv._id && (
                    <span style={{ marginLeft: 'auto' }}>
                      <LoadingSpinner size="sm" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Post Card ──────────────────────────────────────────────── */

function PostCard({ post, userId, onToggleLike, onOpenComments, onOpenShare }) {
  const navigate = useNavigate();
  const liked = post.likes?.includes(userId);
  const [animating, setAnimating] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleLike = () => {
    setAnimating(true);
    onToggleLike(post._id);
    setTimeout(() => setAnimating(false), 400);
  };

  const handleQuickComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await api.post('/comments', { postId: post._id, text: commentText.trim() });
      setCommentText('');
    } catch {
      /* ignore */
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <article
      className="post-card animate-fade-in"
      style={{ marginBottom: 20 }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
        }}
      >
        <Avatar user={post.author} size={32} />
        <button
          onClick={() =>
            navigate(`/profile/${post.author?._id}`)
          }
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {post.author?.username}
        </button>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          {timeAgo(post.createdAt)}
        </span>
      </div>

      {/* Image */}
      {post.image && (
        <div style={{ width: '100%', maxHeight: 600, overflow: 'hidden' }}>
          <img
            src={post.image}
            alt=""
            style={{
              width: '100%',
              objectFit: 'cover',
              maxHeight: 600,
              display: 'block',
            }}
          />
        </div>
      )}

      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 16px 4px',
        }}
      >
        <button
          onClick={handleLike}
          className={animating && liked ? 'animate-heart-pop' : ''}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            color: 'var(--text-primary)',
          }}
          aria-label="Like"
        >
          <HeartIcon filled={liked} />
        </button>
        <button
          onClick={() => onOpenComments(post)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            color: 'var(--text-primary)',
          }}
          aria-label="Comment"
        >
          <CommentIcon />
        </button>
        <button
          onClick={() => onOpenShare(post._id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            color: 'var(--text-primary)',
          }}
          aria-label="Share"
        >
          <ShareIcon />
        </button>
      </div>

      {/* Like Count */}
      <div
        style={{
          padding: '2px 16px 4px',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {post.likes?.length || 0} {post.likes?.length === 1 ? 'like' : 'likes'}
      </div>

      {/* Caption */}
      {post.caption && (
        <div style={{ padding: '0 16px 4px', fontSize: 14, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600, marginRight: 6 }}>
            {post.author?.username}
          </span>
          {post.caption}
        </div>
      )}

      {/* View Comments */}
      {(post.commentsCount > 0 || post.comments?.length > 0) && (
        <button
          onClick={() => onOpenComments(post)}
          style={{
            display: 'block',
            padding: '2px 16px 6px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          View all {post.commentsCount || post.comments?.length || 0} comments
        </button>
      )}

      {/* Quick Comment Input */}
      <form
        onSubmit={handleQuickComment}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px 12px',
          gap: 8,
          borderTop: '1px solid var(--border-color)',
          marginTop: 4,
        }}
      >
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment…"
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        />
        {commentText.trim() && (
          <button
            type="submit"
            disabled={submittingComment}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Post
          </button>
        )}
      </form>
    </article>
  );
}

/* ─── Home Page ───────────────────────────────────────────────── */

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const emit = useSocketEmit();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [commentModalPost, setCommentModalPost] = useState(null);
  const [shareModalPostId, setShareModalPostId] = useState(null);
  const [toast, setToast] = useState(null);

  const sentinelRef = useRef(null);

  /* ─── Fetch Posts ───────────────────────────────────────────── */
  const fetchPosts = useCallback(async (pageNum, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await api.get(`/posts?page=${pageNum}&limit=10`);
      const data = res.data.data || res.data || [];
      const newPosts = Array.isArray(data) ? data : data.posts || [];
      if (newPosts.length < 10) setHasMore(false);
      setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
    } catch {
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  /* ─── Infinite Scroll ──────────────────────────────────────── */
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          setPage((prev) => {
            const next = prev + 1;
            fetchPosts(next, true);
            return next;
          });
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchPosts]);

  /* ─── Real-time new posts ──────────────────────────────────── */
  const handleNewPost = useCallback(
    (newPost) => {
      setPosts((prev) => {
        if (prev.some((p) => p._id === newPost._id)) return prev;
        return [newPost, ...prev];
      });
    },
    []
  );
  useSocket('post:created', handleNewPost);

  /* ─── Like Toggle ──────────────────────────────────────────── */
  const handleToggleLike = async (postId) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const alreadyLiked = p.likes?.includes(user._id);
        return {
          ...p,
          likes: alreadyLiked
            ? p.likes.filter((id) => id !== user._id)
            : [...(p.likes || []), user._id],
        };
      })
    );
    try {
      await api.post(`/posts/${postId}/like`, { userId: user._id });
    } catch {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p;
          const alreadyLiked = p.likes?.includes(user._id);
          return {
            ...p,
            likes: alreadyLiked
              ? p.likes.filter((id) => id !== user._id)
              : [...(p.likes || []), user._id],
          };
        })
      );
    }
  };

  /* ─── Toast Helper ─────────────────────────────────────────── */
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  /* ─── Render ───────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Comment Modal */}
      {commentModalPost && (
        <CommentModal
          post={commentModalPost}
          user={user}
          onClose={() => setCommentModalPost(null)}
        />
      )}

      {/* Share Modal */}
      {shareModalPostId && (
        <ShareModal
          postId={shareModalPostId}
          onClose={() => setShareModalPostId(null)}
          onToast={showToast}
        />
      )}

      {/* Main Content */}
      <main
        style={{
          marginLeft: window.innerWidth > 768 ? 220 : 0,
          paddingBottom: window.innerWidth <= 768 ? 70 : 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 470,
            padding: '24px 16px',
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
              }}
            >
              <LoadingSpinner size="lg" />
            </div>
          ) : posts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: 'var(--text-primary)',
                }}
              >
                No posts yet
              </h2>
              <p style={{ fontSize: 14 }}>
                Follow people to see their posts here, or{' '}
                <button
                  onClick={() => navigate('/create')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  create your first post
                </button>
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  userId={user?._id}
                  onToggleLike={handleToggleLike}
                  onOpenComments={setCommentModalPost}
                  onOpenShare={setShareModalPostId}
                />
              ))}
              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} style={{ height: 1 }} />
              {loadingMore && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                  <LoadingSpinner size="sm" />
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <p
                  style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    padding: '20px 0 40px',
                  }}
                >
                  You're all caught up ✓
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
