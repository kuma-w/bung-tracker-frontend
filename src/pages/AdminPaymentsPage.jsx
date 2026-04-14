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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 text-sm">결제 내역</h2>
          <span className="text-xs text-gray-400">총 {total}건</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b bg-gray-50/50 text-xs">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">원본 내용</th>
                  <th className="px-4 py-3 font-medium">금액</th>
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">날짜</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">수신 시각</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">#{p.id}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-medium text-gray-700 truncate">{p.raw_content}</p>
                      {p.fail_reason && (
                        <p className="text-red-400 text-xs mt-0.5 truncate">{p.fail_reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {p.amount.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.parsed_names?.join(', ') || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.parsed_dates?.join(', ') || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {p.created_at?.replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canAssign(p.status) && (
                        <button
                          onClick={() => setAssignTarget(p)}
                          className="text-indigo-500 hover:text-indigo-700 text-xs font-medium transition-colors whitespace-nowrap"
                        >
                          수동 배정
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
