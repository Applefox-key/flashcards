import { useState, useEffect } from 'react'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/Button'

// ── Avatar URL helper ────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.learnapp.pro'

function getAvatarUrl(img: string | undefined, token: string | null): string {
  if (!img) return ''
  if (img.startsWith('http') || img.startsWith('blob') || img.startsWith('data:')) return img
  return `${API_URL}/img/avatars/?img=${encodeURIComponent(img)}&token=${token ?? ''}`
}

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 select-none">
      {initials || '?'}
    </div>
  )
}

// ── Avatar picker modal ──────────────────────────────────────────────────────
interface AvatarPickerProps {
  currentUrl: string
  onSelect: (file: File | null, url: string) => void
  onClose: () => void
}

function AvatarPicker({ currentUrl, onSelect, onClose }: AvatarPickerProps) {
  const [preview, setPreview] = useState<string>(currentUrl)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function handleClear() {
    setSelectedFile(null)
    setPreview('')
  }

  function handleSelect() {
    onSelect(selectedFile, preview)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Change avatar</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-4">
          {preview ? (
            <img
              src={preview}
              alt="preview"
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
              No image
            </div>
          )}
        </div>

        {/* File input */}
        <label className="block mb-4">
          <span className="sr-only">Choose image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50 cursor-pointer"
          />
        </label>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <Button size="sm" onClick={handleSelect} className="flex-1">
            Use this photo
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const toast = useToast()
  const { user, token, setUser } = useAuthStore()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const avatarUrl = avatarPreview || getAvatarUrl(user?.img, token)

  // Sync form when user loads (e.g. on page refresh)
  useEffect(() => {
    if (!user) return
    setName(user.name)
    setEmail(user.email)
  }, [user])

  function handleAvatarSelect(file: File | null, url: string) {
    setAvatarFile(file)
    setAvatarPreview(url)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      if (avatarFile) fd.append('file', avatarFile)
      fd.append('data[name]', name)
      fd.append('data[email]', email)
      fd.append('data[img]', avatarPreview && !avatarFile ? avatarPreview : (user?.img ?? ''))
      fd.append('data[id]', String(user?.id ?? ''))
      if (password) fd.append('data[password]', password)

      const updated = await authApi.updateProfile(fd)
      setUser(updated)
      setPassword('')
      setConfirmPassword('')
      setAvatarFile(null)
      // Keep preview pointing to new URL from server response
      setAvatarPreview(getAvatarUrl(updated.img, token))
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative cursor-pointer group"
            onClick={() => setPickerOpen(true)}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 group-hover:border-indigo-400 transition-colors"
              />
            ) : (
              <AvatarPlaceholder name={name || user.name} />
            )}
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-xs font-medium">Change</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="text-xs text-indigo-600 hover:underline"
          >
            Change photo
          </button>
        </div>

        {/* Profile fields */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700">Account info</h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700">Change password</h2>
          <p className="text-xs text-gray-400 -mt-2">Leave blank to keep your current password.</p>

          <div>
            <label className="block text-xs text-gray-500 mb-1">New password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="New password (min 6 chars)"
              minLength={password ? 6 : undefined}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Confirm new password</label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Repeat new password"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                confirmPassword && password !== confirmPassword
                  ? 'border-red-300 focus:ring-red-300'
                  : 'border-gray-300'
              }`}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
            )}
          </div>
        </div>

        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </form>

      {pickerOpen && (
        <AvatarPicker
          currentUrl={avatarUrl}
          onSelect={handleAvatarSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
