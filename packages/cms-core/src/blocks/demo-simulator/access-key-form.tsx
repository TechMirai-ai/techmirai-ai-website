'use client'

import { useState, type FormEvent } from 'react'
import type { AccessCopy } from './access-copy'

type Status = 'idle' | 'checking' | 'invalid' | 'error'

interface AccessKeyFormProps {
  copy: AccessCopy
  liveCallUrl: string
  locale: string
  onRegister: () => void
  onBack: () => void
}

// "Do you have any key?" step of the live demo. The key is checked on the server;
// a valid key opens the live AI call in a new tab.
export function AccessKeyForm({ copy, liveCallUrl, locale, onRegister, onBack }: AccessKeyFormProps) {
  const [key, setKey] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!key.trim() || status === 'checking') return
    setStatus('checking')
    try {
      const res = await fetch('/api/demo/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, locale }),
      })
      const data = (await res.json()) as { valid?: boolean; tier?: 'access' | 'normal'; url?: string }
      // Premium keys open the server-provided URL; normal keys open the plain call link.
      const target = data.tier === 'access' ? data.url : liveCallUrl
      if (res.ok && data.valid === true && target && target.startsWith('https://')) {
        window.open(target, '_blank', 'noopener,noreferrer')
        setStatus('idle')
        return
      }
      setStatus(res.ok && data.valid === false ? 'invalid' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
      <form onSubmit={submit} noValidate>
        <label htmlFor="demo-access-key" className="text-[16px] font-bold text-text-primary">
          {copy.keyTitle}
        </label>
        <input
          id="demo-access-key"
          type="password"
          autoComplete="off"
          value={key}
          onChange={(e) => {
            setKey(e.target.value)
            if (status !== 'checking') setStatus('idle')
          }}
          aria-invalid={status === 'invalid'}
          aria-describedby={status === 'invalid' || status === 'error' ? 'demo-access-key-error' : undefined}
          className="mt-3 block w-full rounded-lg border border-border-default px-4 py-2.5 text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        {(status === 'invalid' || status === 'error') && (
          <p id="demo-access-key-error" role="alert" className="mt-2 text-[12.5px] text-red-700">
            {status === 'invalid' ? copy.keyInvalid : copy.keyError}
          </p>
        )}
        <button
          type="submit"
          disabled={!key.trim() || status === 'checking'}
          className="mt-4 rounded-full bg-brand-primary px-7 py-3 text-[14px] font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copy.keySubmitLabel}
        </button>
      </form>

      <p className="mt-5 text-[13px] leading-[1.7] text-text-muted">
        {copy.noKeyPrefix}{' '}
        <button type="button" onClick={onRegister} className="font-semibold text-text-primary underline">
          {copy.registerLinkLabel}
        </button>
      </p>

      <button type="button" onClick={onBack} className="mt-4 text-[13px] font-semibold text-text-secondary underline">
        {copy.backLabel}
      </button>
    </div>
  )
}
