import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const isAdmin = !!localStorage.getItem('adminKey')

  const handleLogout = () => {
    localStorage.removeItem('adminKey')
    setShowModal(false)
    navigate('/')
    window.location.reload()
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

          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="text-indigo-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
              title="관리자 메뉴"
            >
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              관리자
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-72 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-800 mb-4">관리자</h3>
            <p className="text-xs text-gray-400 mb-5">
              현재 기기에 관리자 키가 저장되어 있습니다.
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
