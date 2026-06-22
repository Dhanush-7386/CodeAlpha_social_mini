import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

/* ─── Helpers ─────────────────────────────────────────────────── */

function Avatar({ user, size = 32, ring = false }) {
  const inner = user?.profilePicture ? (
    <img
      src={user.profilePicture}
      alt=""
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        display: 'block',
      }}
    />
  ) : (
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

  if (ring) {
    return (
      <div
        style={{
          background: 'var(--accent-gradient)',
          padding: 3,
          borderRadius: '50%',
          display: 'inline-flex',
        }}
      >
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: '50%',
            padding: 2,
            display: 'inline-flex',
          }}
        >
          {inner}
        </div>
      </div>
    );
  }

  return inner;
}

/* ─── Edit Profile Modal ─────────────────────────────────────── */

function EditProfileModal({ user, onClose, onSaved, onToast }) {
  const [bio, setBio] = useState(user?.bio || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user?.profilePicture || '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bio', bio);
      if (file) formData.append('profilePicture', file);
      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSaved(res.data.data || res.data);
      onToast('Profile updated!', 'success');
      onClose();
    } catch {
      onToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, 92vw)',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Edit Profile</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 22,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Avatar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            onClick={() => fileRef.current?.click()}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            {preview ? (
              <img
                src={preview}
                alt=""
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                {user?.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 14,
              }}
            >
              📷
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Change photo
          </button>
        </div>

        {/* Bio */}
        <label
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Bio
        </label>
        <textarea
          className="input-field"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell something about yourself…"
          rows={3}
          style={{ resize: 'vertical', marginBottom: 20 }}
        />

        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%' }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

/* ─── Settings Panel ─────────────────────────────────────────── */

function SettingsPanel({ onClose, onToast }) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      onToast('Please fill in both fields', 'error');
      return;
    }
    if (newPassword.length < 6) {
      onToast('New password must be at least 6 characters', 'error');
      return;
    }
    setChangingPw(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      onToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      onToast(
        err.response?.data?.message || 'Failed to change password',
        'error'
      );
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--modal-overlay)',
          zIndex: 8999,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(360px, 85vw)',
          background: 'var(--bg-secondary)',
          zIndex: 9000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.3s ease-out',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Settings</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 22,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Appearance */}
          <div>
            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 14,
              }}
            >
              Appearance
            </h4>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: 15 }}>Dark Mode</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {theme === 'dark' ? 'Currently dark' : 'Currently light'}
                </div>
              </div>
              {/* Toggle switch */}
              <div
                onClick={toggleTheme}
                role="switch"
                aria-checked={theme === 'dark'}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') toggleTheme();
                }}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background:
                    theme === 'dark'
                      ? 'var(--accent)'
                      : 'var(--border-color)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.3s ease',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: 3,
                    left: theme === 'dark' ? 25 : 3,
                    transition: 'left 0.3s ease',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div>
            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 14,
              }}
            >
              Change Password
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                className="input-field"
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                className="input-field"
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                className="btn-secondary"
                onClick={handleChangePassword}
                disabled={changingPw}
                style={{ marginTop: 4 }}
              >
                {changingPw ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div
          style={{
            padding: '16px 20px 24px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              background: 'none',
              border: '1px solid var(--error)',
              borderRadius: 10,
              color: 'var(--error)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--error)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--error)';
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Profile Page ───────────────────────────────────────────── */

export default function ProfilePage() {
  const { user: authUser, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { userId } = useParams();
  const navigate = useNavigate();

  const isOwnProfile = !userId || userId === authUser?._id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  /* ─── Fetch Profile ────────────────────────────────────────── */
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (isOwnProfile) {
          setProfile(authUser);
        } else {
          const res = await api.get(`/users/${userId}`);
          const data = res.data.data || res.data;
          setProfile(data);
          setFollowing(
            data.followers?.includes(authUser?._id) ||
            authUser?.following?.includes(userId) ||
            false
          );
        }
      } catch {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, isOwnProfile, authUser]);

  /* ─── Fetch Posts ──────────────────────────────────────────── */
  useEffect(() => {
    const targetId = isOwnProfile ? authUser?._id : userId;
    if (!targetId) return;

    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const res = await api.get(`/users/${targetId}/posts`);
        setPosts(res.data.data || res.data || []);
      } catch {
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [userId, isOwnProfile, authUser?._id]);

  /* ─── Follow / Unfollow ────────────────────────────────────── */
  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await api.post(`/users/${userId}/follow`);
      setFollowing((prev) => !prev);
      setProfile((prev) => {
        if (!prev) return prev;
        const alreadyFollowing = prev.followers?.includes(authUser?._id);
        return {
          ...prev,
          followers: alreadyFollowing
            ? prev.followers.filter((id) => id !== authUser?._id)
            : [...(prev.followers || []), authUser?._id],
        };
      });
      showToast(
        following ? 'Unfollowed' : 'Following!',
        'success'
      );
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  /* ─── Edit Profile Save ────────────────────────────────────── */
  const handleProfileSaved = (updatedUser) => {
    setProfile(updatedUser);
    updateUser(updatedUser);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Navbar />
        <main
          style={{
            marginLeft: isMobile ? 0 : 220,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
          }}
        >
          <LoadingSpinner size="lg" />
        </main>
      </div>
    );
  }

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

      {showEditModal && (
        <EditProfileModal
          user={profile}
          onClose={() => setShowEditModal(false)}
          onSaved={handleProfileSaved}
          onToast={showToast}
        />
      )}

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onToast={showToast}
        />
      )}

      <main
        style={{
          marginLeft: isMobile ? 0 : 220,
          paddingBottom: isMobile ? 70 : 0,
        }}
      >
        <div
          style={{
            maxWidth: 935,
            margin: '0 auto',
            padding: '24px 20px',
          }}
        >
          {/* ─── Settings Hamburger (top-right) ──────────────────── */}
          {isOwnProfile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontSize: 26,
                  padding: '4px 8px',
                  borderRadius: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--bg-tertiary)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'none')
                }
                aria-label="Settings"
              >
                ☰
              </button>
            </div>
          )}

          {/* ─── Profile Header ──────────────────────────────────── */}
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              gap: isMobile ? 20 : 60,
              alignItems: isMobile ? 'center' : 'flex-start',
              flexDirection: isMobile ? 'column' : 'row',
              marginBottom: 40,
            }}
          >
            {/* Avatar */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
              <Avatar user={profile} size={150} ring={isOwnProfile} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
              {/* Username + Action */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 16,
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <h1 style={{ fontSize: 22, fontWeight: 400 }}>
                  {profile?.username}
                </h1>
                {isOwnProfile ? (
                  <button
                    className="btn-secondary"
                    onClick={() => setShowEditModal(true)}
                    style={{ padding: '6px 20px', fontSize: 13 }}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    className={following ? 'btn-secondary' : 'btn-primary'}
                    onClick={handleFollow}
                    disabled={followLoading}
                    style={{ padding: '6px 24px', fontSize: 13 }}
                  >
                    {followLoading
                      ? '…'
                      : following
                      ? 'Unfollow'
                      : 'Follow'}
                  </button>
                )}
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'flex',
                  gap: isMobile ? 32 : 40,
                  marginBottom: 16,
                  justifyContent: isMobile ? 'center' : 'flex-start',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    {posts.length}
                  </span>
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    posts
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    {profile?.followers?.length || 0}
                  </span>
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    followers
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    {profile?.following?.length || 0}
                  </span>
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    following
                  </span>
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* ─── Divider ─────────────────────────────────────────── */}
          <div
            style={{
              height: 1,
              background: 'var(--border-color)',
              marginBottom: 24,
            }}
          />

          {/* ─── Posts Grid ──────────────────────────────────────── */}
          {postsLoading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: 40,
              }}
            >
              <LoadingSpinner size="md" />
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
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: 'var(--text-primary)',
                }}
              >
                No Posts Yet
              </h3>
              {isOwnProfile && (
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
                  Create your first post
                </button>
              )}
            </div>
          ) : (
            <div className="profile-grid">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="profile-grid-item"
                  onClick={() => navigate('/home')}
                >
                  <img
                    src={post.image}
                    alt=""
                    loading="lazy"
                  />
                  <div className="overlay">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="white"
                        stroke="none"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {post.likes?.length || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="white"
                        stroke="none"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {post.commentsCount || post.comments?.length || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
