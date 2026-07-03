import { useEffect, useRef } from 'react';
import config from '../config.js';

/**
 * Renders the official Google Sign-In button.
 * Requires VITE_GOOGLE_CLIENT_ID in frontend/.env
 */
export function GoogleSignInButton({ onSuccess, onError, text = 'continue_with' }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!config.google_client_id || !buttonRef.current) return;

    const init = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: config.google_client_id,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError?.(new Error('No credential returned from Google'));
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text,
        width: buttonRef.current.offsetWidth || 360,
      });
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          init();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [onSuccess, onError, text]);

  if (!config.google_client_id) {
    return (
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google sign-in.
      </p>
    );
  }

  return <div ref={buttonRef} style={{ display: 'flex', justifyContent: 'center', width: '100%' }} />;
}
