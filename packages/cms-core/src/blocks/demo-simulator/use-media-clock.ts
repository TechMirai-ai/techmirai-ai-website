'use client'

import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'

export const SEEK_STEP_SECONDS = 5

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface ClockState {
  playing: boolean
  ended: boolean
  time: number
  duration: number
  buffered: number
  muted: boolean
  volume: number
}

const INITIAL_STATE: ClockState = {
  playing: false,
  ended: false,
  time: 0,
  duration: 0,
  buffered: 0,
  muted: false,
  volume: 1,
}

interface UseMediaClockArgs {
  /** The element whose time, volume and play state the controls drive (the recording, or the video itself). */
  clockRef: RefObject<HTMLMediaElement | null>
  /** The muted visual that follows the clock; null when the video is the clock. */
  followerRef: RefObject<HTMLVideoElement | null> | null
  /** Changes whenever the clock element is replaced (for example a new language file). */
  sourceKey: string
}

export interface MediaClock extends ClockState {
  togglePlay: () => void
  seekTo: (seconds: number) => void
  seekBy: (deltaSeconds: number) => void
  changeVolume: (volume: number) => void
  toggleMute: () => void
}

// Mirrors an audio or video element into React state, keeps an optional muted
// visual in step with it, and exposes the actions a custom control bar needs.
export function useMediaClock({ clockRef, followerRef, sourceKey }: UseMediaClockArgs): MediaClock {
  const [state, setState] = useState<ClockState>(INITIAL_STATE)
  const patch = useCallback((next: Partial<ClockState>) => setState((current) => ({ ...current, ...next })), [])

  useEffect(() => {
    const media = clockRef.current
    if (!media) return
    const visual = followerRef?.current ?? null

    const readTiming = () =>
      patch({ time: media.currentTime, duration: Number.isFinite(media.duration) ? media.duration : 0 })
    const readBuffered = () =>
      patch({ buffered: media.buffered.length ? media.buffered.end(media.buffered.length - 1) : 0 })

    const handlers: Record<string, () => void> = {
      play: () => {
        patch({ playing: true, ended: false })
        if (visual && !prefersReducedMotion()) void visual.play().catch(() => undefined)
      },
      pause: () => {
        patch({ playing: false })
        visual?.pause()
      },
      ended: () => {
        patch({ playing: false, ended: true })
        if (visual) {
          visual.pause()
          visual.currentTime = 0
        }
      },
      seeked: () => patch({ ended: media.ended, time: media.currentTime }),
      timeupdate: readTiming,
      loadedmetadata: readTiming,
      durationchange: readTiming,
      progress: readBuffered,
      volumechange: () => patch({ muted: media.muted, volume: media.volume }),
    }

    for (const [name, handler] of Object.entries(handlers)) media.addEventListener(name, handler)
    setState({ ...INITIAL_STATE, muted: media.muted, volume: media.volume })
    readTiming()
    readBuffered()

    return () => {
      for (const [name, handler] of Object.entries(handlers)) media.removeEventListener(name, handler)
    }
  }, [clockRef, followerRef, sourceKey, patch])

  const togglePlay = useCallback(() => {
    const media = clockRef.current
    if (!media) return
    if (media.paused || media.ended) {
      if (media.ended) media.currentTime = 0
      void media.play().catch(() => undefined)
    } else {
      media.pause()
    }
  }, [clockRef])

  const seekTo = useCallback(
    (seconds: number) => {
      const media = clockRef.current
      if (!media) return
      const limit = Number.isFinite(media.duration) ? media.duration : seconds
      const next = Math.min(Math.max(seconds, 0), limit)
      media.currentTime = next
      patch({ time: next })
    },
    [clockRef, patch],
  )

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      const media = clockRef.current
      if (media) seekTo(media.currentTime + deltaSeconds)
    },
    [clockRef, seekTo],
  )

  const changeVolume = useCallback(
    (volume: number) => {
      const media = clockRef.current
      if (!media) return
      media.volume = Math.min(Math.max(volume, 0), 1)
      media.muted = media.volume === 0
    },
    [clockRef],
  )

  const toggleMute = useCallback(() => {
    const media = clockRef.current
    if (media) media.muted = !media.muted
  }, [clockRef])

  return { ...state, togglePlay, seekTo, seekBy, changeVolume, toggleMute }
}
