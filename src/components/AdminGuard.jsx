import { useState } from 'react'
import { Outlet } from 'react-router-dom'

async function validateKey(key) {
  const res = await fetch('/payments?limit=1', {
    headers: { 'x-admin-key': key },
  })
  return res.ok
}

export default function AdminGuard() {
  const [saved, setSaved] = useState(!!localStorage.getItem('adminKey'))
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (saved) return <Outlet />

  const handleLogin = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    try {
      const ok = await validateKey(input.trim())
      if (ok) {
        localStorage.setItem('adminKey', input.trim())
        setSaved(true)
      } else {
        setError('관리자 키가 올바르지 않습니다.')
      }
    } catch {
      setError('서버에 연결할 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-4xl mb-3">🔑</p>
          <h2 className="text-xl font-bold text-gray-800">관리자 인증</h2>
          <p className="text-sm text-gray-400 mt-1">관리자 키를 입력하세요</p>
        </div>
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="관리자 키"
          className="w-full border rounded-xl px-4 py-3 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center tracking-widest"
          autoFocus
          autoComplete="current-password"
        />
        {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading || !input.trim()}
          className="w-full mt-2 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 transition-colors"
        >
          {loading ? '확인 중...' : '로그인'}
        </button>
      </div>
    </div>
  )
}
