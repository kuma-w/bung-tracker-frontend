import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

export default function EventDetailPage() {
  const { date } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [names, setNames] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [adding, setAdding] = useState(false)
  const [addResult, setAddResult] = useState(null)

  const adminKey = localStorage.getItem('adminKey')

  const load = useCallback(() => {
    setLoading(true)
    api
      .getEventDetail(date)
      .then(data => setEvent(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [date])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    const nameList = names.split(/[\s,]+/).map(n => n.trim()).filter(Boolean)
    if (!nameList.length) return
    setAdding(true)
    setAddResult(null)
    try {
      const body = { names: nameList }
      if (slotTime) body.slot_time = slotTime
      const res = await api.addAttendees(date, body)
      setAddResult({ ok: true, message: res.message })
      setNames('')
      load()
    } catch (err) {
      setAddResult({ ok: false, message: err.message })
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (name, slotTime) => {
    if (!window.confirm(`${name}님 (${slotTime}) 을 삭제할까요?`)) return
    try {
      await api.deleteAttendee(date, name, slotTime)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div>
        <Link to="/" className="text-indigo-500 text-sm mb-4 block">← 벙 목록</Link>
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Link to="/" className="text-indigo-500 text-sm mb-4 block">← 벙 목록</Link>
        <div className="text-center py-12 text-red-500 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <Link to="/" className="text-indigo-500 text-sm mb-5 block hover:underline">
        ← 벙 목록
      </Link>

      {/* Event header */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-5">
        <h1 className="text-xl font-bold text-gray-800">{formatDate(event.event_date)}</h1>
        <div className="flex gap-4 mt-1 text-sm text-gray-500">
          <span>1인 {event.amount_per_person.toLocaleString()}원</span>
          <span>총 {event.total_attendees}명 참석</span>
        </div>
      </div>

      {/* Slots */}
      <div className="space-y-4 mb-6">
        {event.slots.map(slot => (
          <div key={slot.slot_time} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800 text-base">{slot.slot_time}</h2>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  slot.count >= slot.capacity
                    ? 'bg-red-100 text-red-600'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {slot.count}/{slot.capacity}명
              </span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
              <div
                className={`h-1.5 rounded-full ${
                  slot.count >= slot.capacity ? 'bg-red-400' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, (slot.count / slot.capacity) * 100)}%` }}
              />
            </div>

            {slot.attendees.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {slot.attendees.map(att => (
                  <div
                    key={att.name}
                    className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <span className="text-gray-700">{att.name}</span>
                    {adminKey && (
                      <button
                        onClick={() => handleDelete(att.name, slot.slot_time)}
                        className="text-gray-300 hover:text-red-500 transition-colors ml-0.5 text-base leading-none"
                        title="삭제"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-300 text-sm">참석자 없음</p>
            )}
          </div>
        ))}
      </div>

      {/* Admin: Add attendees */}
      {adminKey && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
          <h3 className="font-semibold text-indigo-800 mb-3 text-sm">참석자 추가 (관리자)</h3>
          <div className="flex gap-2 mb-2">
            <input
              value={names}
              onChange={e => setNames(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="이름 (공백·쉼표로 구분)"
              className="flex-1 border border-indigo-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <select
              value={slotTime}
              onChange={e => setSlotTime(e.target.value)}
              className="border border-indigo-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">자동 배정</option>
              {event.slots.map(s => (
                <option key={s.slot_time} value={s.slot_time}>
                  {s.slot_time}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={adding || !names.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {adding ? '...' : '추가'}
            </button>
          </div>
          {addResult && (
            <pre
              className={`text-xs rounded-lg p-2.5 mt-2 whitespace-pre-wrap ${
                addResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {addResult.message}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
