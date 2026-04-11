'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    UnicornStudio?: {
      init: () => void;
      destroy: () => void;
    };
  }
}

export function UnicornBackground() {
  useEffect(() => {
    const initUS = () => {
      setTimeout(() => {
        if (window.UnicornStudio?.init) {
          window.UnicornStudio.init();
        }
      }, 100);
    };

    const existingScript = document.querySelector('script[src*="unicornStudio"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js';
      script.onload = initUS;
      document.head.appendChild(script);
    } else {
      initUS();
    }

    return () => {
      if (window.UnicornStudio?.destroy) {
        window.UnicornStudio.destroy();
      }
    };
  }, []);

  return (
    <div
      data-us-project="X0ErZR3QhPzMHfKgBbJJ"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        filter: 'blur(3px)',
      }}
    />
  );
}
