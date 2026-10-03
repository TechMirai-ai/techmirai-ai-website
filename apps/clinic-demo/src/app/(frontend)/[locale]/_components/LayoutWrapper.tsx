'use client';
import { useState, useEffect } from 'react';
import { Loader } from '@techmirai/cms-core/components/ui';

// Note: some other apps built on this engine also render a <CeoWelcomePopup />
// here — that component carries hardcoded, app-specific marketing copy, not a
// generic engine feature, so it's intentionally not carried over into this
// vertical rather than reskinned.
export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This timer ensures the loader is visible for a minimum duration
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Loader isLoading={loading} logoSrc="/brand/logo.svg" alt="Clinic Demo" />
      <div
        className={`transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}
      >
        {children}
      </div>
    </>
  );
};