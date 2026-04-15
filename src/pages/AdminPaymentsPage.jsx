import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

const STATUS_MAP = {
  pending:  { label: '처리 중',   cls: 'bg-yellow-100 text-yellow-700' },
  assigned: { label: '배정 완료', cls: 'bg-emerald-100 text-emerald-700' },
  partial:  { label: '일부 배정', cls: 'bg-blue-100 text-blue-700' },
  failed:   { label: '실패',      cls: 'bg-red-100 text-red-600' },
}

const TABS = [
  { value: '', label: '전체' },
  { value: 'pending', label: '처리 중' },
  { value: 'assigned', label: '배정 완료' },
  { value: 'partial', label: '일부 배정' },
  { value: 'failed', label: '실패' },
]

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  )
}

function AssignModal({ payment, onClose, onDone }) {
  const [names, setNames] = useState(payment.parsed_names?.join(', ') || '')
  const [dates, setDates] = useState(payment.parsed_dates?.join(', ') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleAssign = async () => {
    const nameList = names.split(/[\s,]+/).map(n => n.trim()).filter(Boolean)
    const dateList = dates.split(/[\s,]+/).map(d => d.trim()).filter(Boolean)
    if (!nameList.length || !dateList.length) {
      setResult({ ok: false, message: '이름과 날짜를 입력하세요.' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await api.assignPayment(payment.id, { names: nameList, dates: dateList })
      setResult({ ok: true, message: res.message })
      onDone()
    } catch (err) {
      setResult({ ok: false, message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[420px] shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">수동 배정</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              #{payment.id} · {payment.amount.toLocaleString()}원
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600 font-mono break-all">
          {payment.raw_content}
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">이름 (쉼표 또는 공백 구분)</label>
            <input
              value={names}
              onChange={e => setNames(e.target.value)}
              placeholder="홍길동, 김철수"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">날짜 (YYYY-MM-DD, 쉼표 또는 공백 구분)</label>
            <input
              value={dates}
              onChange={e => setDates(e.target.value)}
              placeholder="2026-04-17, 2026-04-24"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {result && (
          <pre
            className={`text-xs rounded-lg p-3 mb-4 whitespace-pre-wrap ${
              result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {result.message}
          </pre>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {loading ? '처리 중...' : '배정'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [assignTarget, setAssignTarget] = useState(null)

  const load = useCallback((status = activeTab) => {
    setLoading(true)
    const params = {}
    if (status) params.status = status
    api
      .getPayments(params)
      .then(data => {
        setPayments(data.payments || [])
        setTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeTab])

  useEffect(() => { load(activeTab) }, [activeTab])

  const handleTabChange = (val) => {
    setActiveTab(val)
  }

  const canAssign = (status) => ['pending', 'partial', 'failed'].includes(status)

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5">입금 내역</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">총 {total}건</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">내역이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {payments.map(p => {
              const dt = p.created_at ? new Date(p.created_at) : null
              const dateStr = dt
                ? `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
                : ''
              const timeStr = dt
                ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
                : ''

              return (
                <div key={p.id} className="bg-white rounded-xl shadow-sm border p-4">
                  {/* 상단: 날짜·시간 + 상태 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-700">{dateStr}</span>
                      <span className="text-xs text-gray-400">{timeStr}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  {/* 원본 내용 */}
                  <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3 text-sm text-gray-700 font-mono break-all">
                    {p.raw_content || <span className="text-gray-300">-</span>}
                  </div>

                  {/* 파싱 결과 */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                    <span>
                      <span className="text-gray-400 mr-1">이름</span>
                      {p.parsed_names?.length ? p.parsed_names.join(', ') : <span className="text-gray-300">-</span>}
                    </span>
                    <span>
                      <span className="text-gray-400 mr-1">일정</span>
                      {p.parsed_dates?.length ? p.parsed_dates.join(', ') : <span className="text-gray-300">-</span>}
                    </span>
                    <span className="font-medium text-gray-700">
                      {p.amount?.toLocaleString()}원
                    </span>
                  </div>

                  {/* 실패 사유 */}
                  {p.fail_reason && (
                    <p className="text-xs text-red-400 mb-2">{p.fail_reason}</p>
                  )}

                  {/* 수동 배정 버튼 */}
                  {canAssign(p.status) && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setAssignTarget(p)}
                        className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
                      >
                        수동 배정
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {assignTarget && (
        <AssignModal
          payment={assignTarget}
          onClose={() => setAssignTarget(null)}
          onDone={() => {
            load(activeTab)
            setAssignTarget(null)
          }}
        />
      )}
    </div>
  )
}
