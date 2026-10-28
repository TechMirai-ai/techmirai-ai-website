'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useLocale } from 'next-intl'
import { PlayerControls, playerLabels } from './player-controls'
import { PlayIcon, ReplayIcon } from './player-icons'
import { SEEK_STEP_SECONDS, useMediaClock } from './use-media-clock'

interface ScenarioPlayerProps {
  videoSrc: string
  audioSrc: string
  label: string
}

const CONTROLS_IDLE_MS = 2500
const FLASH_MS = 450

// Inline player that looks and behaves like a video-site player: a big centre
// play icon, click the picture to play/pause, double-click for full screen, a
// control bar that hides while playing, and keyboard shortcuts. With a
// recording, the (muted) video is the visual and the recording is the sound and
// the timeline; without one, the video plays with its own sound.
export function ScenarioPlayer({ videoSrc, audioSrc, label }: ScenarioPlayerProps) {
  const labels = playerLabels(useLocale())
  const frameRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const idleTimer = useRef<number | undefined>(undefined)
  const flashTimer = useRef<number | undefined>(undefined)

  const hasAudio = Boolean(audioSrc)
  const hasVideo = Boolean(videoSrc)
  const clock = useMediaClock({
    clockRef: hasAudio ? audioRef : videoRef,
    followerRef: hasAudio && hasVideo ? videoRef : null,
    sourceKey: audioSrc || videoSrc,
  })
  const { playing, ended } = clock

  const [controlsAwake, setControlsAwake] = useState(true)
  const [flash, setFlash] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [canFullscreen, setCanFullscreen] = useState(false)

  const wake = useCallback(() => {
    setControlsAwake(true)
    window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => setControlsAwake(false), CONTROLS_IDLE_MS)
  }, [])

  useEffect(() => {
    if (playing) {
      wake()
    } else {
      window.clearTimeout(idleTimer.current)
      setControlsAwake(true)
    }
  }, [playing, wake])

  useEffect(() => {
    setCanFullscreen(document.fullscreenEnabled)
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(
    () => () => {
      window.clearTimeout(idleTimer.current)
      window.clearTimeout(flashTimer.current)
    },
    [],
  )

  const toggleFullscreen = useCallback(() => {
    const frame = frameRef.current
    if (!frame) return
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    else void frame.requestFullscreen().catch(() => undefined)
  }, [])

  // Starting playback briefly pulses the centre icon, then fades it out.
  const togglePlay = () => {
    if (!playing) {
      setFlash(true)
      window.clearTimeout(flashTimer.current)
      flashTimer.current = window.setTimeout(() => setFlash(false), FLASH_MS)
    }
    clock.togglePlay()
  }

  // On touch screens the first tap while the bar is hidden only reveals it.
  const onSurfaceClick = () => {
    if (playing && !controlsAwake) {
      wake()
      return
    }
    togglePlay()
    wake()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const onControl = (event.target as HTMLElement).closest('button, input, [role="slider"]') !== null
    const key = event.key.toLowerCase()
    wake()
    if (onControl && (key === ' ' || key === 'enter' || key.startsWith('arrow'))) return
    const actions: Record<string, () => void> = {
      ' ': togglePlay,
      k: togglePlay,
      arrowleft: () => clock.seekBy(-SEEK_STEP_SECONDS),
      arrowright: () => clock.seekBy(SEEK_STEP_SECONDS),
      m: clock.toggleMute,
      f: toggleFullscreen,
    }
    const action = actions[key]
    if (!action) return
    event.preventDefault()
    action()
  }

  const barVisible = controlsAwake || !playing
  const CenterIcon = ended ? ReplayIcon : PlayIcon
  // #t=0.1 makes the browser show a real first frame instead of a black box.
  const videoUrl = videoSrc.includes('#') ? videoSrc : `${videoSrc}#t=0.1`
  // Without a video the recording plays over a flat brand-green panel.
  const panelClass = hasVideo ? 'bg-black' : 'bg-[#2a783d]'

  return (
    <div
      ref={frameRef}
      role="group"
      aria-roledescription="video player"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerMove={wake}
      onPointerLeave={() => playing && setControlsAwake(false)}
      className={`group relative aspect-video w-full select-none overflow-hidden ${panelClass} text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        fullscreen ? '' : 'rounded-2xl'
      } ${playing && !barVisible ? 'cursor-none' : ''}`}
    >
      {hasVideo && (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- the scenario summary on the page is the text alternative
        <video
          ref={videoRef}
          src={videoUrl}
          muted={hasAudio}
          loop={hasAudio}
          playsInline
          preload="metadata"
          aria-hidden={hasAudio ? true : undefined}
          aria-label={hasAudio ? undefined : label}
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
      {hasAudio && (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- the scenario summary on the page is the text alternative
        <audio key={audioSrc} ref={audioRef} src={audioSrc} preload="metadata" />
      )}

      <div className="absolute inset-0 z-0" onClick={onSurfaceClick} onDoubleClick={toggleFullscreen} />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] grid place-items-center">
        <div
          className={`grid h-16 w-16 place-items-center rounded-full bg-black/65 transition duration-300 motion-reduce:transition-none sm:h-20 sm:w-20 ${
            !playing || flash ? 'scale-100 opacity-100' : 'scale-125 opacity-0'
          }`}
        >
          <CenterIcon className="h-9 w-9 sm:h-11 sm:w-11" />
        </div>
      </div>

      <PlayerControls
        clock={clock}
        labels={labels}
        lightAccent={!hasVideo}
        visible={barVisible}
        fullscreen={fullscreen}
        canFullscreen={canFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  )
}
