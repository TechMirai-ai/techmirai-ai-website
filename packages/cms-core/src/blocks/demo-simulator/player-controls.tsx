'use client'

import { useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { formatClock } from './format-clock'
import {
  ControlButton,
  EnterFullscreenIcon,
  ExitFullscreenIcon,
  MutedIcon,
  PauseIcon,
  PlayIcon,
  ReplayIcon,
  VolumeIcon,
} from './player-icons'
import { SEEK_STEP_SECONDS, type MediaClock } from './use-media-clock'

export interface PlayerLabels {
  play: string
  pause: string
  replay: string
  mute: string
  unmute: string
  volume: string
  seek: string
  fullscreen: string
  exitFullscreen: string
}

// The Japanese player labels are DRAFT (written at the owner's request); a native speaker should review them.
const LABELS: Readonly<Record<'en' | 'ja', PlayerLabels>> = {
  en: {
    play: 'Play',
    pause: 'Pause',
    replay: 'Replay',
    mute: 'Mute',
    unmute: 'Unmute',
    volume: 'Volume',
    seek: 'Seek',
    fullscreen: 'Full screen',
    exitFullscreen: 'Exit full screen',
  },
  ja: {
    play: '再生',
    pause: '一時停止',
    replay: 'もう一度再生',
    mute: 'ミュート',
    unmute: 'ミュート解除',
    volume: '音量',
    seek: 'シークバー',
    fullscreen: '全画面',
    exitFullscreen: '全画面を終了',
  },
}

export function playerLabels(locale: string): PlayerLabels {
  return locale === 'ja' ? LABELS.ja : LABELS.en
}

interface ProgressBarProps {
  clock: MediaClock
  label: string
  /** White progress instead of brand green, for the flat green (no video) panel. */
  lightAccent: boolean
}

// Click or drag to seek; Left/Right/Home/End from the keyboard.
function ProgressBar({ clock, label, lightAccent }: ProgressBarProps) {
  const accent = lightAccent ? 'bg-white' : 'bg-brand-primary'
  const barRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const { time, duration, buffered, seekTo, seekBy } = clock
  const percent = (seconds: number) => (duration > 0 ? Math.min(100, (seconds / duration) * 100) : 0)

  const seekFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bar = barRef.current
    if (!bar || duration <= 0) return
    const rect = bar.getBoundingClientRect()
    seekTo(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) * duration)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const actions: Record<string, () => void> = {
      ArrowLeft: () => seekBy(-SEEK_STEP_SECONDS),
      ArrowRight: () => seekBy(SEEK_STEP_SECONDS),
      Home: () => seekTo(0),
      End: () => seekTo(duration),
    }
    const action = actions[event.key]
    if (!action) return
    event.preventDefault()
    event.stopPropagation()
    action()
  }

  return (
    <div
      ref={barRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={`${formatClock(time)} / ${formatClock(duration)}`}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        dragging.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        seekFromPointer(event)
      }}
      onPointerMove={(event) => {
        if (dragging.current) seekFromPointer(event)
      }}
      onPointerUp={(event) => {
        dragging.current = false
        event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
      className="group/bar relative flex h-5 cursor-pointer touch-none items-center focus-visible:outline-none sm:h-4"
    >
      <div className="relative h-[3px] w-full bg-white/30 transition-[height] group-hover/bar:h-[5px] group-focus-visible/bar:h-[5px] motion-reduce:transition-none">
        <div className="absolute inset-y-0 left-0 bg-white/40" style={{ width: `${percent(buffered)}%` }} />
        <div className={`absolute inset-y-0 left-0 ${accent}`} style={{ width: `${percent(time)}%` }} />
        <div
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${accent} opacity-0 group-hover/bar:opacity-100 group-focus-visible/bar:opacity-100`}
          style={{ left: `${percent(time)}%` }}
        />
      </div>
    </div>
  )
}

interface PlayerControlsProps {
  clock: MediaClock
  labels: PlayerLabels
  lightAccent: boolean
  visible: boolean
  fullscreen: boolean
  canFullscreen: boolean
  onToggleFullscreen: () => void
}

export function PlayerControls({
  clock,
  labels,
  lightAccent,
  visible,
  fullscreen,
  canFullscreen,
  onToggleFullscreen,
}: PlayerControlsProps) {
  const { playing, ended, time, duration, muted, volume } = clock
  const PlayStateIcon = ended ? ReplayIcon : playing ? PauseIcon : PlayIcon
  const playLabel = ended ? labels.replay : playing ? labels.pause : labels.play
  const silent = muted || volume === 0

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-1.5 pt-10 transition-opacity duration-200 motion-reduce:transition-none sm:px-3 sm:pb-2 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0 has-[:focus-visible]:pointer-events-auto has-[:focus-visible]:opacity-100'
      }`}
    >
      <ProgressBar clock={clock} label={labels.seek} lightAccent={lightAccent} />
      <div className="flex items-center gap-0.5 sm:gap-1">
        <ControlButton label={playLabel} onClick={clock.togglePlay}>
          <PlayStateIcon className="h-6 w-6 sm:h-7 sm:w-7" />
        </ControlButton>
        <div className="group/volume flex items-center">
          <ControlButton label={silent ? labels.unmute : labels.mute} onClick={clock.toggleMute}>
            {silent ? <MutedIcon /> : <VolumeIcon />}
          </ControlButton>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={silent ? 0 : volume}
            aria-label={labels.volume}
            onChange={(event) => clock.changeVolume(Number(event.target.value))}
            className="hidden h-1 w-0 cursor-pointer accent-white opacity-0 transition-all group-hover/volume:w-20 group-hover/volume:opacity-100 focus-visible:w-20 focus-visible:opacity-100 motion-reduce:transition-none sm:block"
          />
        </div>
        <span className="ml-1 whitespace-nowrap text-xs tabular-nums text-white sm:text-sm">
          {formatClock(time)} / {formatClock(duration)}
        </span>
        <span className="flex-1" />
        {canFullscreen && (
          <ControlButton label={fullscreen ? labels.exitFullscreen : labels.fullscreen} onClick={onToggleFullscreen}>
            {fullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
          </ControlButton>
        )}
      </div>
    </div>
  )
}
