import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: (clientX - innerWidth / 2) / innerWidth,
      y: (clientY - innerHeight / 2) / innerHeight,
    });
  };

  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      title: 'Share Photos',
      desc: 'Upload and share your best moments with stunning filters and effects.',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: 'Real-time Chat',
      desc: 'Message friends instantly with live typing indicators and read receipts.',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: 'Connect with Friends',
      desc: 'Discover people, follow their stories, and build your community.',
    },
  ];

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        position: 'relative',
        overflow: 'hidden',
        color: '#ffffff',
      }}
    >
      {/* ── Gradient Orbs Background ────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225,48,108,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          right: '-15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(81,91,212,0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: 'float 10s ease-in-out infinite 1s',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '30%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,133,41,0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: 'float 12s ease-in-out infinite 2s',
        }}
      />

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '40px 20px',
        }}
      >
        {/* Mouse-following glow */}
        <div
          style={{
            position: 'absolute',
            left: `calc(50% + ${mousePos.x * 100}px)`,
            top: `calc(50% + ${mousePos.y * 100}px)`,
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(225,48,108,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            transition: 'left 0.3s ease-out, top 0.3s ease-out',
            zIndex: 1,
          }}
        />

        {/* Floating Parallax Cards */}
        {/* Card 1 – Top-left: Like button mock */}
        <div
          className="parallax-card animate-fade-in-up"
          style={{
            position: 'absolute',
            top: '12%',
            left: '8%',
            width: '160px',
            padding: '16px',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            transform: `translate3d(${mousePos.x * 20}px, ${mousePos.y * 20}px, 0)`,
            animationDelay: '0.3s',
            opacity: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '8px', width: '60%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff6b6b' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>2,847</span>
          </div>
        </div>

        {/* Card 2 – Top-right: Avatar stack */}
        <div
          className="parallax-card animate-fade-in-up"
          style={{
            position: 'absolute',
            top: '18%',
            right: '10%',
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            transform: `translate3d(${mousePos.x * -15}px, ${mousePos.y * -15}px, 0)`,
            animationDelay: '0.5s',
            opacity: 0,
          }}
        >
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            {['#F58529', '#DD2A7B', '#8134AF', '#515BD4'].map((bg, i) => (
              <div
                key={i}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: bg,
                  border: '2px solid #1a1a1a',
                  marginLeft: i > 0 ? '-8px' : 0,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>+12k online</span>
        </div>

        {/* Card 3 – Middle-left: Chat bubble */}
        <div
          className="parallax-card animate-fade-in-up"
          style={{
            position: 'absolute',
            top: '55%',
            left: '5%',
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            transform: `translate3d(${mousePos.x * 30}px, ${mousePos.y * 30}px, 0)`,
            animationDelay: '0.7s',
            opacity: 0,
          }}
        >
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>New message 💬</div>
          <div
            style={{
              background: 'linear-gradient(135deg, #E1306C, #C13584)',
              color: 'white',
              padding: '8px 14px',
              borderRadius: '12px 12px 12px 4px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Hey! Check this out ✨
          </div>
        </div>

        {/* Card 4 – Middle-right: Image placeholder */}
        <div
          className="parallax-card animate-fade-in-up"
          style={{
            position: 'absolute',
            top: '50%',
            right: '6%',
            width: '140px',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            transform: `translate3d(${mousePos.x * -25}px, ${mousePos.y * -25}px, 0)`,
            animationDelay: '0.9s',
            opacity: 0,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
          <div style={{ padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff6b6b">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div style={{ height: '6px', width: '70%', background: 'rgba(255,255,255,0.15)', borderRadius: '3px' }} />
          </div>
        </div>

        {/* Card 5 – Bottom-left: Follow button */}
        <div
          className="parallax-card animate-fade-in-up"
          style={{
            position: 'absolute',
            bottom: '22%',
            left: '15%',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transform: `translate3d(${mousePos.x * -18}px, ${mousePos.y * 22}px, 0)`,
            animationDelay: '1.1s',
            opacity: 0,
          }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #F58529, #DD2A7B)' }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>sarah.designs</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Suggested for you</div>
          </div>
          <div
            style={{
              marginLeft: '8px',
              padding: '4px 12px',
              background: '#0095F6',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            Follow
          </div>
        </div>

        {/* Card 6 – Bottom-right: Notification */}
        <div
          className="parallax-card animate-fade-in-up"
          style={{
            position: 'absolute',
            bottom: '18%',
            right: '12%',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            transform: `translate3d(${mousePos.x * 25}px, ${mousePos.y * -20}px, 0)`,
            animationDelay: '1.3s',
            opacity: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#4BB543',
                boxShadow: '0 0 8px rgba(75,181,67,0.6)',
              }}
            />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>3 new notifications</span>
          </div>
        </div>

        {/* ── Main Hero Content ──────────────────────────────────── */}
        <div
          className="animate-fade-in-up"
          style={{
            textAlign: 'center',
            position: 'relative',
            zIndex: 10,
            maxWidth: '700px',
            opacity: 0,
            animationDelay: '0.1s',
          }}
        >
          <h1
            className="font-display accent-gradient-text"
            style={{
              fontSize: 'clamp(48px, 8vw, 80px)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: '20px',
              letterSpacing: '-2px',
            }}
          >
            SocialMini
          </h1>
          <p
            className="animate-fade-in-up"
            style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              color: 'rgba(255,255,255,0.55)',
              marginBottom: '48px',
              lineHeight: 1.6,
              fontWeight: 400,
              opacity: 0,
              animationDelay: '0.3s',
            }}
          >
            Share your world, one moment at a time.
          </p>

          <div
            className="animate-fade-in-up"
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              opacity: 0,
              animationDelay: '0.5s',
            }}
          >
            <button
              className="btn-gradient"
              onClick={() => navigate('/signup')}
              style={{ padding: '14px 40px', fontSize: '16px', borderRadius: '12px' }}
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '14px 40px',
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                borderRadius: '12px',
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────── */}
      <section
        style={{
          padding: '80px 20px 120px',
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        <h2
          className="font-display animate-fade-in-up"
          style={{
            textAlign: 'center',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800,
            marginBottom: '16px',
            color: 'white',
            opacity: 0,
            animationDelay: '0.2s',
          }}
        >
          Everything you need
        </h2>
        <p
          className="animate-fade-in-up"
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '60px',
            fontSize: '16px',
            opacity: 0,
            animationDelay: '0.3s',
          }}
        >
          A complete social experience, beautifully crafted.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
          }}
        >
          {features.map((feat, i) => (
            <div
              key={i}
              className="animate-fade-in-up"
              style={{
                padding: '32px 28px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                transition: 'all 0.3s ease',
                cursor: 'default',
                opacity: 0,
                animationDelay: `${0.4 + i * 0.15}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.borderColor = 'rgba(225,48,108,0.3)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(225,48,108,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(225,48,108,0.15), rgba(81,91,212,0.15))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  color: '#E1306C',
                }}
              >
                {feat.icon}
              </div>
              <h3
                className="font-display"
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '10px',
                  color: 'white',
                }}
              >
                {feat.title}
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)' }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer
        style={{
          padding: '24px 20px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '13px',
        }}
      >
        © {new Date().getFullYear()} SocialMini. All rights reserved.
      </footer>
    </div>
  );
}
