import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Download } from 'lucide-react';
import type { CalendarEvent } from '../../types';
import { formatLocalDateISO } from '../../store/useAppStore';

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (evt: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
}

const CAT_COLORS: Record<CalendarEvent['category'], string> = {
  meeting: 'bg-purple-500/25 border-purple-400/50 text-purple-200',
  study: 'bg-sky-500/25 border-sky-400/50 text-sky-200',
  work: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200',
  personal: 'bg-amber-500/25 border-amber-400/50 text-amber-200',
};

function buildMonthCells(year: number, month: number): Array<{ date: Date; inMonth: boolean }> {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0=Sun
  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    cells.push({ date: d, inMonth: d.getMonth() === month });
  }
  return cells;
}

function exportICS(events: CalendarEvent[]) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Waqar Command Center//Calendar//EN',
  ];
  for (const ev of events) {
    const dateDigits = ev.date.replace(/-/g, '');
    const timeDigits = ev.startTime.replace(':', '') + '00';
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.id}@commandcenter`);
    lines.push(`DTSTART:${dateDigits}T${timeDigits}`);
    lines.push(`SUMMARY:${ev.title}`);
    if (ev.notes) lines.push(`DESCRIPTION:${ev.notes}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'command-center-calendar.ics';
  a.click();
  URL.revokeObjectURL(url);
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onAddEvent,
  onDeleteEvent,
}) => {
  const todayISO = formatLocalDateISO();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedISO, setSelectedISO] = useState(todayISO);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('17:00');
  const [durationMin, setDurationMin] = useState(30);
  const [category, setCategory] = useState<CalendarEvent['category']>('meeting');
  const [notes, setNotes] = useState('');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = buildMonthCells(year, month);
  const dayEvents = events.filter((e) => e.date === selectedISO);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddEvent({
      title: title.trim(),
      date: selectedISO,
      startTime,
      durationMin,
      category,
      notes: notes.trim() || undefined,
    });
    setTitle('');
    setNotes('');
  };

  return (
    <div className="py-3 grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Monthly Grid */}
      <div className="lg:col-span-8 glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-400" />
              {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg bg-white/7 hover:bg-white/15 text-slate-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setViewDate(now);
                  setSelectedISO(formatLocalDateISO(now));
                }}
                className="px-2.5 py-1 rounded-lg bg-white/7 hover:bg-white/15 text-xs text-slate-200 cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg bg-white/7 hover:bg-white/15 text-slate-200 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => exportICS(events)}
            className="px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-xs font-medium text-purple-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export .ICS
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map(({ date, inMonth }) => {
            const iso = formatLocalDateISO(date);
            const evs = events.filter((e) => e.date === iso);
            const isSelected = iso === selectedISO;
            const isToday = iso === todayISO;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedISO(iso)}
                className={`min-h-[76px] p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600/30 border-purple-400 shadow-[0_0_16px_rgba(147,51,234,0.45)]'
                    : inMonth
                    ? 'bg-white/[0.03] border-purple-500/15 hover:border-purple-400/45'
                    : 'bg-black/20 border-transparent opacity-45'
                }`}
              >
                <span
                  className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-purple-600 text-white' : 'text-slate-200'
                  }`}
                >
                  {date.getDate()}
                </span>
                <div className="space-y-0.5 w-full overflow-hidden">
                  {evs.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${
                        CAT_COLORS[ev.category]
                      }`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {evs.length > 2 && (
                    <div className="text-[9.5px] text-purple-300">+{evs.length - 2} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda + Add Event */}
      <div className="lg:col-span-4 glass-card rounded-2xl p-5 flex flex-col justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white mb-1">
            Agenda • {selectedISO === todayISO ? 'Today' : selectedISO}
          </h3>
          <p className="text-xs text-slate-400 mb-4">{dayEvents.length} scheduled item(s)</p>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {dayEvents.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8 border border-dashed border-purple-500/20 rounded-xl">
                Free day — add an event below.
              </div>
            ) : (
              dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-white/[0.04] border border-purple-500/20 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">{ev.title}</div>
                    <div className="text-xs text-purple-300 mt-0.5">
                      {ev.startTime} • {ev.durationMin} min •{' '}
                      <span className="capitalize">{ev.category}</span>
                    </div>
                    {ev.notes && <p className="text-xs text-slate-400 mt-1">{ev.notes}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteEvent(ev.id)}
                    className="text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleAdd} className="space-y-2.5 pt-4 border-t border-purple-500/20">
          <div className="text-xs font-semibold text-purple-200">Add Event on {selectedISO}</div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title..."
            className="w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-2 py-1.5 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white"
            />
            <input
              type="number"
              min={5}
              max={480}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value) || 30)}
              placeholder="Min"
              className="px-2 py-1.5 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CalendarEvent['category'])}
              className="px-2 py-1.5 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
            >
              <option value="meeting">Meeting</option>
              <option value="study">Study</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-3 py-1.5 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white"
          />
          <button
            type="submit"
            className="purple-glow-btn w-full py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Schedule Event
          </button>
        </form>
      </div>
    </div>
  );
};
