'use client';

import { useEffect, useRef } from 'react';

interface HomePageClientProps {
  html: string;
}

export default function HomePageClient({ html }: HomePageClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Execute scripts sequentially in DOM order
    const scripts = Array.from(containerRef.current.querySelectorAll('script'));

    let promise = Promise.resolve();
    scripts.forEach((oldScript) => {
      promise = promise.then(() => {
        return new Promise<void>((resolve) => {
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });

          if (oldScript.src) {
            newScript.onload = () => resolve();
            newScript.onerror = () => resolve();
          } else {
            newScript.textContent = oldScript.textContent;
            setTimeout(resolve, 10);
          }

          oldScript.parentNode?.replaceChild(newScript, oldScript);
          if (!oldScript.src) {
            resolve();
          }
        });
      });
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}

