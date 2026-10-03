'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 650);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-[85px] left-1/2 z-50 -translate-x-1/2" // ← Below header
        >
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 rounded-full bg-white border border-brand-primary/20 px-5 py-2.5 text-sm font-semibold text-brand-primary shadow-md hover:bg-slate-50 hover:border-brand-primary/40 hover:shadow-lg transition-all duration-200"
          >
            <ArrowUp className="h-4 w-4 text-brand-primary" />
            Top
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}