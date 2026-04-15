const API_BASE = import.meta.env.VITE_API_BASE || ''

function getAdminKey() {
  return localStorage.getItem('adminKey') || ''
}

async function request(method, path, body = null, adminRequired = false) {
  const headers = { 'Content-Type': 'application/json' }
  if (adminRequired) {
    headers['x-admin-key'] = getAdminKey()
  }

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(API_BASE + path, options)
  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.message || '오류가 발생했습니다.')
    err.status = res.status
    throw err
  }

  return data
}

export const api = {
  // 공개 API
  getEvents: () => request('GET', '/events'),
  getEventDetail: (date) => request('GET', `/events/${date}`),

  // 관리자 - 벙 관리
  createEvent: (body) => request('POST', '/events', body, true),
  updateEvent: (date, body) => request('PATCH', `/events/${date}`, body, true),
  deleteEvent: (date) => request('DELETE', `/events/${date}`, null, true),

  // 관리자 - 참석자 관리
  addAttendees: (date, body) => request('POST', `/events/${date}/attendees`, body, true),
  deleteAttendee: (date, name, slotTime) => {
    const q = slotTime ? `?slot_time=${encodeURIComponent(slotTime)}` : ''
    return request('DELETE', `/events/${date}/attendees/${encodeURIComponent(name)}${q}`, null, true)
  },

  // 관리자 - 입금 내역
  getPayments: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/payments${q ? '?' + q : ''}`, null, true)
  },
  assignPayment: (id, body) => request('POST', `/payments/${id}/assign`, body, true),
}
