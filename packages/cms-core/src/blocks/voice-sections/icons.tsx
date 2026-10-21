import {
  AudioLines, BookOpen, Building2, CalendarCheck, CircleHelp, ClipboardList, Clock, FileText, Forward, Gauge,
  Headset, Hourglass, Layers, LayoutDashboard, ListChecks, Mail, MessageSquare, Moon, Phone, PhoneCall, PhoneOff,
  Play, Route, Search, Settings, ShieldCheck, Sun, Sunrise, Timer, UserRound, Users, Voicemail,
  type LucideIcon,
} from 'lucide-react'

// Fixed icon vocabulary for the voice-sections blocks. Editors pick a name
// from this list in the CMS; unknown names fall back to a phone.
export const VOICE_ICONS = {
  phone: Phone, phoneCall: PhoneCall, phoneOff: PhoneOff, headset: Headset, users: Users, fileText: FileText,
  bookOpen: BookOpen, clipboard: ClipboardList, user: UserRound, clock: Clock, moon: Moon, sun: Sun,
  sunrise: Sunrise, help: CircleHelp, route: Route, mail: Mail, calendar: CalendarCheck, message: MessageSquare,
  forward: Forward, play: Play, list: ListChecks, timer: Timer, layers: Layers, shield: ShieldCheck,
  audio: AudioLines, hourglass: Hourglass, building: Building2, dashboard: LayoutDashboard, settings: Settings,
  search: Search, voicemail: Voicemail, gauge: Gauge,
} as const satisfies Record<string, LucideIcon>

export type VoiceIconName = keyof typeof VOICE_ICONS

export const VOICE_ICON_NAMES = Object.keys(VOICE_ICONS) as VoiceIconName[]

export function toIconName(value: unknown): VoiceIconName {
  return typeof value === 'string' && value in VOICE_ICONS ? (value as VoiceIconName) : 'phone'
}

interface VoiceIconProps {
  name: VoiceIconName
  className?: string
  size?: number
}

export function VoiceIcon({ name, className, size = 20 }: VoiceIconProps) {
  const Icon = VOICE_ICONS[name]
  return <Icon aria-hidden="true" size={size} className={className} strokeWidth={1.8} />
}
