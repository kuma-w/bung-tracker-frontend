import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const DEFAULT_SLOTS = [
  { slot_time: '10:30', capacity: 10 },
  { slot_time: '12:00', capacity: 10 },
]

export default function AdminEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    event_date: '',
    amount_per_person: 1500,
    slots: DEFAULT_SLOTS.map(s => ({ ...s })),
  })
  const [creating, setCreating] = useState(false)
  const [createResult, setCreateResult] = useState(null)

  const load = () => {
    api
      .getEvents()
      .then(data => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.event_date) {
      setCreateResult({ ok: false, message: '날짜를 입력하세요.' })
      return
    }
    setCreating(true)
    setCreateResult(null)
    try {
      await api.createEvent(form)
      setCreateResult({ ok: true, message: '벙이 생성되었습니다.' })
      setForm({ event_date: '', amount_per_person: 1500, slots: DEFAULT_SLOTS.map(s => ({ ...s })) })
      load()
    } catch (err) {
      setCreateResult({ ok: false, message: err.message })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (date) => {
    if (!window.confirm(`${date} 벙을 삭제할까요?\n참석자 정보도 모두 삭제됩니다.`)) return
    try {
      await api.deleteEvent(date)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  const updateSlot = (i, field, value) => {
    const slots = form.slots.map((s, idx) =>
      idx === i ? { ...s, [field]: field === 'capacity' ? Number(value) : value } : s
    )
    setForm(f => ({ ...f, slots }))
  }

  const addSlot = () =>
    setForm(f => ({ ...f, slots: [...f.slots, { slot_time: '', capacity: 10 }] }))

  const removeSlot = (i) =>
    setForm(f => ({ ...f, slots: f.slots.filter((_, idx) => idx !== i) }))

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">벙 관리</h1>

      {/* Create form */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">새 벙 생성</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">날짜</label>
            <input
              type="date"
              value={form.event_date}
              onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block font-medium">1인 참가비 (원)</label>
            <input
              type="number"
              value={form.amount_per_person}
              onChange={e => setForm(f => ({ ...f, amount_per_person: Number(e.target.value) }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500 font-medium">타임슬롯</label>
            <button
              onClick={addSlot}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              + 슬롯 추가
            </button>
          </div>
          <div className="space-y-2">
            {form.slots.map((slot, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="time"
                  value={slot.slot_time}
                  onChange={e => updateSlot(i, 'slot_time', e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="number"
                  value={slot.capacity}
                  min="1"
                  onChange={e => updateSlot(i, 'capacity', e.target.value)}
                  className="w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-sm text-gray-400">명</span>
                {form.slots.length > 1 && (
                  <button
                    onClick={() => removeSlot(i)}
                    className="text-gray-300 hover:text-red-400 text-xl leading-none transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={creating}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {creating ? '생성 중...' : '벙 생성'}
        </button>

        {createResult && (
          <p
            className={`text-sm mt-3 ${createResult.ok ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {createResult.message}
          </p>
        )}
      </div>

      {/* Events table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 text-sm">등록된 벙 목록</h2>
          <span className="text-xs text-gray-400">{events.length}개</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">등록된 벙이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50/50 text-xs">
                <th className="px-5 py-3 font-medium">날짜</th>
                <th className="px-5 py-3 font-medium">참가비</th>
                <th className="px-5 py-3 font-medium">슬롯</th>
                <th className="px-5 py-3 font-medium">참석 현황</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => {
                const total = event.slots.reduce((s, sl) => s + sl.count, 0)
                const cap = event.slots.reduce((s, sl) => s + sl.capacity, 0)
                return (
                  <tr key={event.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        to={`/events/${event.event_date}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {event.event_date}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{event.amount_per_person.toLocaleString()}원</td>
                    <td className="px-5 py-3 text-gray-500">
                      {event.slots.map(s => `${s.slot_time}(${s.count}/${s.capacity})`).join(' · ')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${total >= cap ? 'bg-red-400' : 'bg-indigo-400'}`}
                            style={{ width: `${Math.min(100, cap > 0 ? (total / cap) * 100 : 0)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{total}/{cap}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(event.event_date)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
