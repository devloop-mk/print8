'use client';

import { useEffect, useRef, useState } from 'react';

type UseInViewOptions = {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
};

export function useInView<T extends Element = Element>({
  rootMargin = '0px 0px 20% 0px',
  threshold = 0.01,
  once = true,
}: UseInViewOptions = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}
