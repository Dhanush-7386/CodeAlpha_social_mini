import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import OTPInput from '../components/OTPInput';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SignupPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  /* ── Resend Countdown Timer ─────────────────────────────── */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  /* ── Step 1: Sign Up ────────────────────────────────────── */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await auth.signup(username.trim(), email.trim(), password);
      setUserId(data.userId);
      setStep(2);
      setResendCooldown(60);
      setToast({ message: 'OTP sent to your email!', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP ─────────────────────────────────── */
  const handleOTPComplete = useCallback(
    async (otp) => {
      setLoading(true);
      setError('');
      try {
        await auth.verifyOTP(userId, otp);
        setToast({ message: 'Account verified! Welcome to SocialMini 🎉', type: 'success' });
        setTimeout(() => navigate('/home'), 600);
      } catch (err) {
        const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
        setError(msg);
        setToast({ message: msg, type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [auth, userId, navigate]
  );

  /* ── Resend OTP ─────────────────────────────────────────── */
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await auth.resendOTP(userId, 'signup');
      setResendCooldown(60);
      setToast({ message: 'OTP resent!', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to resend OTP.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared Styles ──────────────────────────────────────── */
  const containerStyle = {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '400px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  return (
    <div style={containerStyle}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="animate-scale-in" style={cardStyle}>
        {/* ── Logo ──────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            className="font-display accent-gradient-text"
            style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}
          >
            SocialMini
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {step === 1
              ? 'Sign up to see photos and videos from your friends.'
              : 'Enter the verification code we sent to your email.'}
          </p>
        </div>

        {step === 1 ? (
          /* ── Step 1: Signup Form ──────────────────────────── */
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input
                className="input-field"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p style={{ color: 'var(--error)', fontSize: '13px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '4px' }}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Sign Up'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link to="/forgot-password" style={{ color: 'var(--accent)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
          </form>
        ) : (
          /* ── Step 2: OTP Verification ─────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(225,48,108,0.1), rgba(81,91,212,0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              📧
            </div>

            <OTPInput length={6} onComplete={handleOTPComplete} />

            {error && (
              <p style={{ color: 'var(--error)', fontSize: '13px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            {loading && <LoadingSpinner size="sm" />}

            <button
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || loading}
              style={{
                background: 'none',
                border: 'none',
                color: resendCooldown > 0 ? 'var(--text-secondary)' : 'var(--accent)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: resendCooldown > 0 ? 'default' : 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        )}

        {/* ── Footer Link ───────────────────────────────────── */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
