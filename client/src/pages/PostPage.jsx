import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useSocketEmit } from '../hooks/useSocket';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const MAX_CAPTION = 2200;

export default function PostPage() {
  const navigate = useNavigate();
  const emit = useSocketEmit();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  /* ── File Handling ──────────────────────────────────────── */
  const processFile = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file.', type: 'error' });
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setToast({ message: 'Image must be under 10 MB.', type: 'error' });
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleFileSelect = (e) => {
    processFile(e.target.files?.[0]);
  };

  /* ── Drag & Drop ────────────────────────────────────────── */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  /* ── Remove Image ───────────────────────────────────────── */
  const removeImage = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Submit Post ────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!file) {
      setToast({ message: 'Please select an image to share.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('caption', caption);

      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      emit('post:new', res.data.data || res.data);
      setToast({ message: 'Post shared successfully! 🎉', type: 'success' });
      setTimeout(() => navigate('/home'), 800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create post.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ── Main Content Area ─────────────────────────────── */}
      <main
        style={{
          marginLeft: '220px',
          minHeight: '100vh',
          padding: '40px 20px 100px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div
          className="animate-fade-in-up"
          style={{
            width: '100%',
            maxWidth: '600px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
          }}
        >
          {/* ── Header ──────────────────────────────────────── */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              className="font-display"
              style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              Create Post
            </h2>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!file || loading}
              style={{ padding: '8px 24px', fontSize: '14px' }}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Share Post'}
            </button>
          </div>

          {/* ── Upload Area / Preview ───────────────────────── */}
          <div style={{ padding: '24px' }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border-color)'}`,
                  borderRadius: '16px',
                  padding: '60px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: dragActive ? 'rgba(225,48,108,0.04)' : 'var(--bg-tertiary)',
                }}
              >
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(225,48,108,0.1), rgba(81,91,212,0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Drag photos here
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  or click to browse from your device
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{ padding: '8px 24px', fontSize: '13px' }}
                >
                  Select from computer
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '450px',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    background: 'var(--bg-tertiary)',
                  }}
                />
                <button
                  onClick={removeImage}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    color: 'white',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
                >
                  ✕
                </button>
              </div>
            )}

            {/* ── Caption ──────────────────────────────────────── */}
            <div style={{ marginTop: '20px' }}>
              <div
                style={{
                  position: 'relative',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <textarea
                  placeholder="Write a caption…"
                  value={caption}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CAPTION) {
                      setCaption(e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '14px 16px',
                    background: 'var(--bg-tertiary)',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.6,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    background: 'var(--bg-tertiary)',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  {/* Emoji hint button */}
                  <button
                    type="button"
                    onClick={() => {
                      /* Let native emoji keyboard / OS picker handle it */
                    }}
                    title="Use your system emoji picker (Ctrl+. or Cmd+Ctrl+Space)"
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '20px',
                      cursor: 'pointer',
                      padding: '2px',
                      opacity: 0.6,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                  >
                    😊
                  </button>
                  <span
                    style={{
                      fontSize: '12px',
                      color:
                        caption.length > MAX_CAPTION * 0.9
                          ? 'var(--error)'
                          : 'var(--text-secondary)',
                      fontWeight: caption.length > MAX_CAPTION * 0.9 ? 600 : 400,
                    }}
                  >
                    {caption.length.toLocaleString()}/{MAX_CAPTION.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile responsive override ────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          main {
            margin-left: 0 !important;
            padding-bottom: 120px !important;
          }
        }
      `}</style>
    </>
  );
}
