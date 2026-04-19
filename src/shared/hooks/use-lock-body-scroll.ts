'use client';

import { useEffect } from 'react';

const SCROLL_LOCK_DATASET_KEY = 'scrollLockCount';
const SCROLL_LOCK_Y_DATASET_KEY = 'scrollLockY';

export const useLockBodyScroll = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const scrollLockCount = Number(document.body.dataset[SCROLL_LOCK_DATASET_KEY] || '0');

    document.body.dataset[SCROLL_LOCK_DATASET_KEY] = String(scrollLockCount + 1);

    if (scrollLockCount === 0) {
      const scrollY = window.scrollY;

      document.body.dataset[SCROLL_LOCK_Y_DATASET_KEY] = String(scrollY);
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }

    return () => {
      const nextScrollLockCount = Math.max(
        0,
        Number(document.body.dataset[SCROLL_LOCK_DATASET_KEY] || '1') - 1,
      );

      if (nextScrollLockCount === 0) {
        const scrollY = Number(document.body.dataset[SCROLL_LOCK_Y_DATASET_KEY] || '0');

        delete document.body.dataset[SCROLL_LOCK_DATASET_KEY];
        delete document.body.dataset[SCROLL_LOCK_Y_DATASET_KEY];
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        return;
      }

      document.body.dataset[SCROLL_LOCK_DATASET_KEY] = String(nextScrollLockCount);
    };
  }, [enabled]);
};
