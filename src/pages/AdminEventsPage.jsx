import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return `${dateStr} (${DAYS[d.getDay()]})`
}

const DEFAULT_SLOTS = [
  { slot_time: '10:30', capacity: 10 },
  { slot_time: '12:00', capacity: 10 },
]

// ─── 수정 모달 ────────────────────────────────────────────────
function EditModal({ event, onClose, onDone }) {
  const [amount, setAmount] = useState(event.amount_per_person)
  // 기존 슬롯: { slot_time, capacity, deleted }
  const [slots, setSlots] = useState(
    event.slots.map(s => ({ slot_time: s.slot_time, capacity: s.capacity, deleted: false }))
  )
  // 새로 추가할 슬롯
  const [newSlots, setNewSlots] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleDelete = (i) =>
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, deleted: !s.deleted } : s))

  const updateCapacity = (i, val) =>
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, capacity: Number(val) } : s))

  const updateNew = (i, field, val) =>
    setNewSlots(prev => prev.map((s, idx) =>
      idx === i ? { ...s, [field]: field === 'capacity' ? Number(val) : val } : s
    ))

  const addNewSlot = () => setNewSlots(prev => [...prev, { slot_time: '', capacity: 10 }])
  const removeNew = (i) => setNewSlots(prev => prev.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const body = {}

      if (amount !== event.amount_per_person) body.amount_per_person = amount

      const upsertSlots = [
        ...slots.filter(s => !s.deleted).map(s => ({ slot_time: s.slot_time, capacity: s.capacity })),
        ...newSlots.filter(s => s.slot_time),
      ]
      if (upsertSlots.length) body.slots = upsertSlots

      const deleteSlots = slots.filter(s => s.deleted).map(s => s.slot_time)
      if (deleteSlots.length) body.delete_slots = deleteSlots

      await api.updateEvent(event.event_date, body)
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">일정 수정 — {formatDate(event.event_date)}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* 참가비 */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium mb-1 block">1인 참가비 (원)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* 기존 슬롯 */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 font-medium mb-2 block">기존 슬롯</label>
          <div className="space-y-2">
            {slots.map((slot, i) => (
              <div key={slot.slot_time} className={`flex gap-2 items-center rounded-lg px-3 py-2 border ${slot.deleted ? 'bg-red-50 border-red-200 opacity-60' : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-sm font-medium text-gray-700 w-14 shrink-0">{slot.slot_time}</span>
                <input
                  type="number"
                  value={slot.capacity}
                  min="1"
                  disabled={slot.deleted}
                  onChange={e => updateCapacity(i, e.target.value)}
                  className="w-16 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100"
                />
                <span className="text-xs text-gray-400">명</span>
                <span className="text-xs text-gray-400 ml-1">
                  (현재 {event.slots.find(s => s.slot_time === slot.slot_time)?.count ?? 0}명 참석)
                </span>
                <button
                  onClick={() => toggleDelete(i)}
                  className={`ml-auto text-xs font-medium px-2 py-1 rounded transition-colors ${
                    slot.deleted
                      ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      : 'bg-red-100 text-red-500 hover:bg-red-200'
                  }`}
                >
                  {slot.deleted ? '취소' : '삭제'}
                </button>
              </div>
            ))}
          </div>
          {slots.some(s => s.deleted) && (
            <p className="text-xs text-red-400 mt-1">* 참석자가 있는 슬롯은 삭제 시 오류가 발생합니다.</p>
          )}
        </div>

        {/* 새 슬롯 추가 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500 font-medium">새 슬롯 추가</label>
            <button onClick={addNewSlot} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
              + 슬롯 추가
            </button>
          </div>
          {newSlots.length > 0 && (
            <div className="space-y-2">
              {newSlots.map((slot, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={slot.slot_time}
                    onChange={e => updateNew(i, 'slot_time', e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    type="number"
                    value={slot.capacity}
                    min="1"
                    onChange={e => updateNew(i, 'capacity', e.target.value)}
                    className="w-16 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-xs text-gray-400">명</span>
                  <button onClick={() => removeNew(i)} className="text-gray-300 hover:text-red-400 text-xl leading-none ml-1">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 메인 페이지 ──────────────────────────────────────────────
export default function AdminEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(null)

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
      setCreateResult({ ok: true, message: '일정이 생성되었습니다.' })
      setForm({ event_date: '', amount_per_person: 1500, slots: DEFAULT_SLOTS.map(s => ({ ...s })) })
      load()
    } catch (err) {
      setCreateResult({ ok: false, message: err.message })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (date) => {
    if (!window.confirm(`${date} 일정을 삭제할까요?\n참석자 정보도 모두 삭제됩니다.`)) return
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
      <h1 className="text-xl font-bold text-gray-800 mb-6">일정 관리</h1>

      {/* Create form */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">새 일정 생성</h2>

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
            <button onClick={addSlot} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
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
          {creating ? '생성 중...' : '일정 생성'}
        </button>

        {createResult && (
          <p className={`text-sm mt-3 ${createResult.ok ? 'text-emerald-600' : 'text-red-500'}`}>
            {createResult.message}
          </p>
        )}
      </div>

      {/* Events list */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 text-sm">등록된 일정 목록</h2>
          <span className="text-xs text-gray-400">{events.length}개</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">등록된 일정이 없습니다.</div>
        ) : (
          <>
            {/* ── 모바일: 카드 목록 ── */}
            <div className="sm:hidden max-h-[480px] overflow-y-auto divide-y divide-gray-100">
              {events.map(event => {
                const total = event.slots.reduce((s, sl) => s + sl.count, 0)
                const cap = event.slots.reduce((s, sl) => s + sl.capacity, 0)
                const past = new Date(event.event_date + 'T00:00:00') < (() => { const t = new Date(); t.setHours(0,0,0,0); return t })()
                return (
                  <div key={event.id} className={`px-4 py-3 ${past ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/events/${formatDate(event.event_date)}`} className={`font-semibold text-sm hover:underline ${past ? 'text-gray-400' : 'text-indigo-600'}`}>
                            {formatDate(event.event_date)}
                          </Link>
                          {past && <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">종료</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{event.amount_per_person.toLocaleString()}원 · {event.slots.map(s => `${s.slot_time}(${s.count}/${s.capacity})`).join(' · ')}</p>
                      </div>
                      <div className="flex gap-3 ml-3 shrink-0">
                        <button onClick={() => setEditTarget(event)} className="text-indigo-400 hover:text-indigo-600 text-xs font-medium">수정</button>
                        <button onClick={() => handleDelete(event.event_date)} className="text-red-400 hover:text-red-600 text-xs font-medium">삭제</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${past ? 'bg-gray-300' : total >= cap ? 'bg-red-400' : 'bg-indigo-400'}`}
                          style={{ width: `${Math.min(100, cap > 0 ? (total / cap) * 100 : 0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{total}/{cap}명</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── 데스크톱: 테이블 ── */}
            <div className="hidden sm:block">
              <div className="max-h-[480px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="text-left text-gray-500 border-b bg-gray-50 text-xs">
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
                      const past = new Date(event.event_date + 'T00:00:00') < (() => { const t = new Date(); t.setHours(0,0,0,0); return t })()
                      return (
                        <tr key={event.id} className={`border-b last:border-0 transition-colors ${past ? 'bg-gray-50/60 text-gray-400' : 'hover:bg-gray-50'}`}>
                          <td className="px-5 py-3">
                            <Link to={`/events/${formatDate(event.event_date)}`} className={`font-medium hover:underline ${past ? 'text-gray-400' : 'text-indigo-600'}`}>
                              {formatDate(event.event_date)}
                            </Link>
                            {past && <span className="ml-2 text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">종료</span>}
                          </td>
                          <td className="px-5 py-3">{event.amount_per_person.toLocaleString()}원</td>
                          <td className="px-5 py-3 text-gray-500">
                            {event.slots.map(s => `${s.slot_time}(${s.count}/${s.capacity})`).join(' · ')}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${past ? 'bg-gray-300' : total >= cap ? 'bg-red-400' : 'bg-indigo-400'}`}
                                  style={{ width: `${Math.min(100, cap > 0 ? (total / cap) * 100 : 0)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{total}/{cap}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex gap-3 justify-end">
                              <button onClick={() => setEditTarget(event)} className="text-indigo-400 hover:text-indigo-600 text-xs font-medium transition-colors">수정</button>
                              <button onClick={() => handleDelete(event.event_date)} className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors">삭제</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {editTarget && (
        <EditModal
          event={editTarget}
          onClose={() => setEditTarget(null)}
          onDone={() => { setEditTarget(null); load() }}
        />
      )}
    </div>
  )
}
