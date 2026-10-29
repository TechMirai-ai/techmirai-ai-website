'use client'

import { useState, type FormEvent } from 'react'
import type { AccessCopy } from './access-copy'

interface RegisterFormProps {
  copy: AccessCopy
  locale: string
  onRegistered: () => void
  onBack: () => void
}

interface Fields {
  name: string
  contactNo: string
  email: string
  company: string
  purpose: string
}

const EMPTY: Fields = { name: '', contactNo: '', email: '', company: '', purpose: '' }

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-border-default px-4 py-2.5 text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

// Live-demo registration. All five fields are mandatory; the server validates again
// and sends the staff notification and the registrant's confirmation email.
export function RegisterForm({ copy, locale, onRegistered, onBack }: RegisterFormProps) {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [honeypot, setHoneypot] = useState('')
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)

  const set = (name: keyof Fields) => (value: string) => setFields((prev) => ({ ...prev, [name]: value }))

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending) return
    setSending(true)
    setFailed(false)
    try {
      const res = await fetch('/api/forms/demo-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, locale, _hp: honeypot }),
      })
      if (res.ok) {
        onRegistered()
        return
      }
      setFailed(true)
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  const field = (name: keyof Fields, label: string, type = 'text') => (
    <div>
      <label htmlFor={`demo-reg-${name}`} className="text-[13px] font-semibold text-text-primary">
        {label}
      </label>
      {name === 'purpose' ? (
        <textarea
          id={`demo-reg-${name}`}
          required
          rows={4}
          value={fields[name]}
          onChange={(e) => set(name)(e.target.value)}
          className={inputClass}
        />
      ) : (
        <input
          id={`demo-reg-${name}`}
          type={type}
          required
          value={fields[name]}
          onChange={(e) => set(name)(e.target.value)}
          className={inputClass}
        />
      )}
    </div>
  )

  return (
    <div className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
      <h3 className="text-[16px] font-bold text-text-primary">{copy.registerTitle}</h3>
      <form onSubmit={submit} className="mt-4 grid gap-4">
        {field('name', copy.nameLabel)}
        {field('contactNo', copy.contactNoLabel, 'tel')}
        {field('email', copy.emailLabel, 'email')}
        {field('company', copy.companyLabel)}
        {field('purpose', copy.purposeLabel)}
        {/* Honeypot: hidden from people, filled by bots. */}
        <input
          type="text"
          name="_hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />
        {failed && (
          <p role="alert" className="text-[12.5px] text-red-700">
            {copy.registerError}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-brand-primary px-7 py-3 text-[14px] font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? copy.registerSending : copy.registerSubmitLabel}
          </button>
          <button type="button" onClick={onBack} className="text-[13px] font-semibold text-text-secondary underline">
            {copy.backLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
