'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface LoaderProps {
  isLoading?: boolean
  // Generic defaults for any consumer that doesn't override them — pass your
  // own app's logo/alt for a different site.
  logoSrc?: string
  alt?: string
}

export const Loader = ({ isLoading = true, logoSrc = '/logo.png', alt = 'Loading' }: LoaderProps) => {
  const shimmer = {
    hidden: { x: '-100%' },
    show: { x: '100%', transition: { duration: 1.5, repeat: Infinity, repeatDelay: 0.5 } }
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-brand-accent z-[9999]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="relative overflow-hidden w-[300px] h-[100px] md:w-[700px] md:h-[300px]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Image
              src={logoSrc}
              alt={alt}
              fill
              priority
              className="relative z-10 object-contain"
            />

            {/* Shimmer Overlay */}
            <motion.div
              className="absolute inset-0 bg-white/20 skew-x-[-20deg] z-20"
              variants={shimmer}
              initial="hidden"
              animate="show"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};