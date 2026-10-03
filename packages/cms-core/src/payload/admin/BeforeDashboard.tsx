// TODO: color token — admin UI inline styles (#eff6ff bg, #bfdbfe border, #1e40af text, #374151 body, #6b7280 muted)
// This is the Payload admin panel info banner — intentionally uses direct style props (no Tailwind in admin context).
// Colors are blue-toned (Payload admin blue-50/blue-200/blue-800) not client brand colors — keep as-is.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BeforeDashboard(_props: Record<string, any>) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        borderRadius: '8px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#1e40af', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        CMS Workspace
      </p>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
        Manage content, media, and form submissions. Every save automatically invalidates
        the Next.js data cache for the affected collection.
      </p>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280' }}>
        Editors may create and update. Only admins may delete records or manage users.
      </p>
    </div>
  )
}
