import { useRef, useState, useEffect } from 'react';

export default function OTPInput({ length = 6, onComplete }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value.slice(-1);
    setValues(newValues);

    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    const code = newValues.join('');
    if (code.length === length && !newValues.includes('')) {
      onComplete?.(code);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (paste.length === 0) return;

    const newValues = [...values];
    for (let i = 0; i < paste.length; i++) {
      newValues[i] = paste[i];
    }
    setValues(newValues);

    const nextIndex = Math.min(paste.length, length - 1);
    inputsRef.current[nextIndex]?.focus();

    if (paste.length === length) {
      onComplete?.(paste);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: '48px',
            height: '56px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '700',
            fontFamily: "'Inter', sans-serif",
            background: 'var(--bg-tertiary)',
            border: '2px solid var(--border-color)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            caretColor: 'var(--accent)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent)';
            e.target.style.boxShadow = '0 0 0 3px rgba(225,48,108,0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.boxShadow = 'none';
          }}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
