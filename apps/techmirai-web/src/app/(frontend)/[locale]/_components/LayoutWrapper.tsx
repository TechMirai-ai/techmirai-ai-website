'use client';

// Note: some other apps built on this engine also render a <CeoWelcomePopup />
// here — that component carries hardcoded, app-specific marketing copy, not a
// generic engine feature, so it's intentionally not carried over into this
// vertical rather than reskinned.
// Voice-pivot (ECC Master Prompt v2 §6-§7): the former timed splash screen hid
// the whole page for 2 s and then faded it in for 1 s. That made first content
// (LCP) 9-17 s on a throttled phone and broke the "understand within 5
// seconds" goal, so children now render immediately. Logged in
// docs/ENGINE-FIXES.md.
export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};