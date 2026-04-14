import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [keyInput, setKeyInput] = useState(localStorage.getItem('adminKey') || '')

  const saveKey = () => {
    localStorage.setItem('adminKey', keyInput)
    setShowKeyModal(false)
  }

  const navLink = (to, label, exact = false) => {
    const active = exact
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(to + '/')
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          active ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-600'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link to="/" className="text-white text-lg font-bold tracking-wide flex items-center gap-2">
              🏸 <span>벙 트래커</span>
            </Link>
            <nav className="flex gap-1">
              {navLink('/', '벙 일정', true)}
              {navLink('/admin', '벙 관리')}
              {navLink('/admin/payments', '입금 내역')}
            </nav>
          </div>
          <button
            onClick={() => {
              setKeyInput(localStorage.getItem('adminKey') || '')
              setShowKeyModal(true)
            }}
            className="text-indigo-200 hover:text-white text-lg transition-colors"
            title="관리자 키 설정"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-800 mb-1">관리자 키 설정</h3>
            <p className="text-xs text-gray-500 mb-3">관리자 기능을 사용하려면 x-admin-key를 입력하세요.</p>
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              placeholder="관리자 키 입력"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveKey}
                className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
