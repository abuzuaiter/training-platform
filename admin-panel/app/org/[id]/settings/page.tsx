'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

export default function OrgSettingsPage() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [message, setMessage]   = useState('')
  const [form, setForm] = useState({
    name: '', name_ar: '', email: '', phone: '', mobile: '', category: '',
  })
  const [logoUrl, setLogoUrl]     = useState('')
  const [stampUrl, setStampUrl]   = useState('')
  const [uploading, setUploading] = useState<'logo' | 'stamp' | null>(null)
  const logoInputRef  = useRef<HTMLInputElement>(null)
  const stampInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/organizations/${id}`)
    if (res.ok) {
      const d = await res.json()
      setForm({
        name:     d.name     || '',
        name_ar:  d.name_ar  || '',
        email:    d.email    || '',
        phone:    d.phone    || '',
        mobile:   d.mobile   || '',
        category: d.category || '',
      })
      setLogoUrl(d.logo_url   || '')
      setStampUrl(d.stamp_url || '')
    }
    setLoading(false)
  }

  async function handleUpload(file: File, type: 'logo' | 'stamp') {
    setUploading(type)
    setMessage('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('org_id', id)
      fd.append('type', type)
      const res = await fetch('/api/upload-logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) {
        setMessage('Upload failed: ' + (data.error || res.status))
      } else {
        if (type === 'logo')  setLogoUrl(data.url)
        if (type === 'stamp') setStampUrl(data.url)
        setMessage(`${type === 'logo' ? 'Logo' : 'Stamp'} updated successfully!`)
      }
    } catch (e: any) {
      setMessage('Upload error: ' + e.message)
    }
    setUploading(null)
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')
    const res = await fetch(`/api/organizations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setMessage('Settings saved successfully!')
    } else {
      setMessage('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your organization information</p>

      {/* Logo + Stamp */}
      <div className="flex gap-4 mb-6">
        {([
          { label: 'Logo',  type: 'logo'  as const, url: logoUrl,  ref: logoInputRef  },
          { label: 'Stamp', type: 'stamp' as const, url: stampUrl, ref: stampInputRef },
        ]).map(({ label, type, url, ref }) => (
          <div key={type} className="flex-1 border border-gray-200 rounded-2xl p-4 bg-white flex flex-col items-center gap-2">
            {/* hidden file input */}
            <input
              ref={ref}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file, type)
                e.target.value = ''
              }}
            />

            {/* preview */}
            {url ? (
              <img src={url} alt={label} className="w-16 h-16 object-contain rounded-lg" />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                {label}
              </div>
            )}

            <span className="text-xs font-semibold text-gray-500">{label}</span>

            {/* upload button */}
            <button
              onClick={() => ref.current?.click()}
              disabled={uploading !== null}
              className="mt-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200
                         bg-gray-50 hover:bg-gray-100 text-gray-600 disabled:opacity-50 transition
                         flex items-center gap-1.5"
            >
              {uploading === type ? (
                <>
                  <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M8 11V3M5 6l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 13h12" strokeLinecap="round"/>
                  </svg>
                  {url ? 'Replace' : 'Upload'}
                </>
              )}
            </button>

            {url && (
              <p className="text-[10px] text-gray-400 text-center leading-tight max-w-[120px] truncate">
                {url.split('/').pop()}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Category */}
      {form.category && (
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
            {form.category}
          </span>
        </div>
      )}

      {/* General */}
      <div className="bg-white border border-gray-200 rounded-2xl mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">General</p>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { key: 'name',    label: 'Name (EN)', placeholder: 'Organization name' },
            { key: 'name_ar', label: 'Name (AR)', placeholder: 'اسم المنظمة' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center px-4 py-3 gap-3">
              <label className="text-sm font-medium text-gray-500 w-28 shrink-0">{label}</label>
              <input
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="flex-1 text-sm text-gray-900 bg-transparent outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white border border-gray-200 rounded-2xl mb-6 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact</p>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { key: 'email',  label: 'Email',  placeholder: 'email@example.com', type: 'email' },
            { key: 'phone',  label: 'Phone',  placeholder: '+974 xxxx xxxx',    type: 'tel' },
            { key: 'mobile', label: 'Mobile', placeholder: '+974 xxxx xxxx',    type: 'tel' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key} className="flex items-center px-4 py-3 gap-3">
              <label className="text-sm font-medium text-gray-500 w-28 shrink-0">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="flex-1 text-sm text-gray-900 bg-transparent outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          message.includes('success')
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-600'
        }`}>
          {message}
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
