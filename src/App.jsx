import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
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
        <Route path="/admin" element={<AdminEventsPage />} />
        <Route path="/admin/payments" element={<AdminPaymentsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
