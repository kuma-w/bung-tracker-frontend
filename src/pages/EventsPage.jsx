import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function isPast(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr + "T00:00:00") < today;
}

function EventCard({ event }) {
  const totalCapacity = event.slots.reduce((s, sl) => s + sl.capacity, 0);
  const totalCount = event.slots.reduce((s, sl) => s + sl.count, 0);
  const isFull = totalCount >= totalCapacity;
  const past = isPast(event.event_date);

  return (
    <div
      className={`rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow ${past ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-100"}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2
            className={`text-base font-bold ${past ? "text-gray-400" : "text-gray-800"}`}
          >
            {formatDate(event.event_date)}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            1인 {event.amount_per_person.toLocaleString()}원
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            past
              ? "bg-gray-100 text-gray-400"
              : isFull
                ? "bg-red-100 text-red-600"
                : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {past
            ? "종료"
            : isFull
              ? "마감"
              : `${totalCapacity - totalCount}자리 남음`}
        </span>
      </div>

      <div className="space-y-2.5">
        {event.slots.map((slot) => (
          <div key={slot.slot_time}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="font-medium text-gray-700">
                {slot.slot_time}
              </span>
              <span>
                {slot.count}/{slot.capacity}명
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  past
                    ? "bg-gray-300"
                    : slot.count >= slot.capacity
                      ? "bg-red-400"
                      : "bg-indigo-500"
                }`}
                style={{
                  width: `${Math.min(100, (slot.count / slot.capacity) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
        <span className="text-gray-400 text-xs">
          전체 {totalCount}/{totalCapacity}명
        </span>
        <span
          className={`text-xs font-medium ${past ? "text-gray-400" : "text-indigo-500"}`}
        >
          상세 보기 →
        </span>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    api
      .getEvents()
      .then((data) => setEvents(data.events || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const upcoming = events
    .filter((e) => !isPast(e.event_date))
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = events
    .filter((e) => isPast(e.event_date))
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5">일정</h1>

      {/* 예정 일정 */}
      {upcoming.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-5xl mb-4">🏸</p>
          <p className="font-medium">예정된 일정이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {upcoming.map((event) => (
            <Link key={event.id} to={`/events/${event.event_date}`}>
              <EventCard event={event} />
            </Link>
          ))}
        </div>
      )}

      {/* 지난 일정 토글 */}
      {past.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast((v) => !v)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
          >
            <span
              className={`transition-transform ${showPast ? "rotate-90" : ""}`}
            >
              ▶
            </span>
            지난 일정 ({past.length}개)
          </button>
          {showPast && (
            <div className="grid gap-4 sm:grid-cols-2">
              {past.map((event) => (
                <Link key={event.id} to={`/events/${event.event_date}`}>
                  <EventCard event={event} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
