import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Briefcase,
  Video,
  X,
  Trash2,
} from 'lucide-react';
import type { CalendarEvent } from '../../types';
import { formatLocalDateISO } from '../../store/useAppStore';

interface CalendarCardProps {
  events: CalendarEvent[];
  onAddEvent: (evt: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
  onOpenCalendarView: () => void;
}

function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${mStr || '00'} ${ampm}`;
}

function getWeekDates(anchor: Date): Date[] {
  const d = new Date(anchor);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(d);
    dt.setDate(d.getDate() + i);
    return dt;
  });
}

function CategoryIcon({ cat }: { cat: CalendarEvent['category'] }) {
  switch (cat) {
    case 'meeting':
      return <Video className="w-3.5 h-3.5 text-purple-300 shrink-0" />;
    case 'study':
      return <BookOpen className="w-3.5 h-3.5 text-sky-300 shrink-0" />;
    case 'work':
      return <Briefcase className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
  }
}

export const CalendarCard: React.FC<CalendarCardProps> = ({
  events,
  onAddEvent,
  onDeleteEvent,
  onOpenCalendarView,
}) => {
  const todayISO = formatLocalDateISO();
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedISO, setSelectedISO] = useState(todayISO);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('17:00');
  const [category, setCategory] = useState<CalendarEvent['category']>('meeting');

  const weekDates = getWeekDates(anchorDate);
  const monthLabel = anchorDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const shiftWeek = (days: number) => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + days);
    setAnchorDate(next);
  };

  const dayEvents = events.filter((e) => e.date === selectedISO);
  const eventDatesSet = new Set(events.map((e) => e.date));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddEvent({
      title: title.trim(),
      date: selectedISO,
      startTime: time,
      durationMin: 30,
      category,
    });
    setTitle('');
    setAdding(false);
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between relative">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={onOpenCalendarView}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4 text-purple-400" />
            <h2 className="text-[14.5px] font-semibold text-white group-hover:text-purple-200 transition-colors">
              Calendar
            </h2>
          </button>
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            title="Quick add event"
            className="w-6 h-6 rounded-lg hover:bg-purple-500/20 text-purple-200/80 hover:text-white flex items-center justify-center cursor-pointer"
          >
            {adding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {/* Month Switcher */}
        <div className="flex items-center justify-center gap-4 mb-2.5 text-xs font-medium text-slate-200">
          <button
            type="button"
            onClick={() => shiftWeek(-7)}
            className="p-0.5 hover:text-purple-300 cursor-pointer"
            title="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>{monthLabel}</span>
          <button
            type="button"
            onClick={() => shiftWeek(7)}
            className="p-0.5 hover:text-purple-300 cursor-pointer"
            title="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 7-day Strip */}
        <div className="grid grid-cols-7 gap-1 text-center pb-2.5 mb-2.5 border-b border-purple-500/15">
          {weekDates.map((d) => {
            const iso = formatLocalDateISO(d);
            const isSelected = iso === selectedISO;
            const isToday = iso === todayISO;
            const hasEvents = eventDatesSet.has(iso);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedISO(iso)}
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <span className="text-[10.5px] text-slate-400">{dayName}</span>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.85)]'
                      : isToday
                      ? 'border border-purple-400/70 text-purple-200'
                      : 'text-slate-200 group-hover:bg-white/10'
                  }`}
                >
                  {d.getDate()}
                </span>
                <span
                  className={`w-1 h-1 rounded-full ${
                    hasEvents ? 'bg-purple-400' : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Quick add form */}
        {adding && (
          <form onSubmit={handleSubmit} className="mb-2.5 space-y-1.5 p-2 rounded-xl bg-white/5 border border-purple-500/25">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Event on ${selectedISO}...`}
              autoFocus
              className="w-full px-2 py-1 rounded-lg bg-black/30 border border-purple-500/25 text-xs text-white focus:outline-none focus:border-purple-400"
            />
            <div className="flex gap-1.5">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="px-2 py-1 rounded-lg bg-black/30 border border-purple-500/25 text-xs text-white"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CalendarEvent['category'])}
                className="flex-1 px-2 py-1 rounded-lg bg-[#161231] border border-purple-500/25 text-xs text-white"
              >
                <option value="meeting">Meeting</option>
                <option value="study">Study</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
              </select>
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* Day Events List */}
        <div className="space-y-2 max-h-[104px] overflow-y-auto pr-0.5">
          {dayEvents.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-4">
              No events scheduled for {selectedISO === todayISO ? 'today' : selectedISO}.
            </div>
          ) : (
            dayEvents.map((ev) => (
              <div
                key={ev.id}
                className="group flex items-center justify-between gap-2 text-[12px] py-0.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CategoryIcon cat={ev.category} />
                  <span className="text-slate-100 truncate">{ev.title}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {formatTime12(ev.startTime)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteEvent(ev.id)}
                    title="Delete event"
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
