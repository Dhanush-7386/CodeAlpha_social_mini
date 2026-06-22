import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import OTPInput from '../components/OTPInput';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  /* ── Step 1: Request Reset Code ─────────────────────────── */
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setUserId(data.userId);
      setStep(2);
      setResendCooldown(60);
      setToast({ message: 'Reset code sent to your email!', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset code. Please try again.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: OTP Complete ───────────────────────────────── */
  const handleOTPComplete = useCallback((otpValue) => {
    setOtp(otpValue);
    setStep(3);
  }, []);

  /* ── Resend OTP ─────────────────────────────────────────── */
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setResendCooldown(60);
      setToast({ message: 'Reset code resent!', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to resend code.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: Reset Password ─────────────────────────────── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        userId,
        otp,
        newPassword,
      });
      /* Auto-login: save token */
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setToast({ message: 'Password reset successful! 🎉', type: 'success' });
      setTimeout(() => navigate('/home'), 600);
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed. Please try again.';
      setError(msg);
      setToast({ message: msg, type: 'error' });
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

  const stepSubtitles = {
    1: 'Enter your email and we\u2019ll send you a reset code.',
    2: 'Enter the verification code we sent to your email.',
    3: 'Choose a new password for your account.',
  };

  const stepIcons = {
    1: '📧',
    2: '🔐',
    3: '🔑',
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
            {stepSubtitles[step]}
          </p>
        </div>

        {step === 1 && (
          /* ── Step 1: Email Form ───────────────────────────── */
          <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                'Send Reset Code'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
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
              {stepIcons[2]}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
              Code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>

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
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        )}

        {step === 3 && (
          /* ── Step 3: New Password ─────────────────────────── */
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '8px',
              }}
            >
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
                {stepIcons[3]}
              </div>
            </div>

            <div>
              <label style={labelStyle}>New Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                'Reset Password'
              )}
            </button>
          </form>
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
          <Link
            to="/login"
            style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
