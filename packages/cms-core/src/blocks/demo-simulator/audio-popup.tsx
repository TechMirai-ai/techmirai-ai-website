'use client'

import { useEffect, useRef, useState } from 'react'

interface AudioPopupProps {
  audioSrc: string
  videoSrc: string
  title: string
  closeLabel: string
  onClose: () => void
}

const FOCUSABLE = 'button, [href], audio[controls], [tabindex]:not([tabindex="-1"])'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Full-screen overlay: a muted looping video as the backdrop while the audio
// plays. The video runs until the audio ends, then pauses; the popup stays open
// until the visitor closes it.
export function AudioPopup({ audioSrc, videoSrc, title, closeLabel, onClose }: AudioPopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ended, setEnded] = useState(false)
  const showVideo = Boolean(videoSrc) && !prefersReducedMotion()

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      opener?.focus()
    }
  }, [onClose])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (ended) video.pause()
    else void video.play().catch(() => undefined)
  }, [ended])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full flex-col justify-end overflow-hidden bg-neutral-900 sm:aspect-video sm:h-auto sm:max-w-3xl sm:rounded-2xl"
      >
        {showVideo && (
          <video
            ref={videoRef}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        )}

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/60 px-4 py-2 text-[13px] font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {closeLabel}
        </button>

        <div className="relative bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- the call transcript on the page is the text alternative */}
          <audio
            key={audioSrc}
            className="w-full"
            src={audioSrc}
            controls
            autoPlay
            onPlay={() => setEnded(false)}
            onEnded={() => setEnded(true)}
          />
        </div>
      </div>
    </div>
  )
}
