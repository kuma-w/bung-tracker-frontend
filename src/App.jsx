import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import AdminGuard from './components/AdminGuard'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import AdminEventsPage from './pages/AdminEventsPage'
import AdminPaymentsPage from './pages/AdminPaymentsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<EventsPage />} />
        <Route path="/events/:date" element={<EventDetailPage />} />
        {/* 관리자 전용 — 키 없으면 로그인 화면으로 */}
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminEventsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
