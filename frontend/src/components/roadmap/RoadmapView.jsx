import { useState, useEffect } from 'react';
import { Milestone } from 'lucide-react';
import { projectApi } from '../../api/projectApi';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function RoadmapView({ projectId, onIssueClick }) {
  const [epics, setEpics] = useState(null); // null = loading

  useEffect(() => {
    projectApi.getRoadmap(projectId).then(setEpics);
  }, [projectId]);

  if (epics === null) {
    return (
      <div className="p-4 max-w-5xl mx-auto space-y-2">
        <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (epics.length === 0) {
    return (
      <div className="m-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 text-sm text-slate-400 dark:text-slate-500">
        No epics yet — create an issue with type "Epic" to start planning a roadmap.
      </div>
    );
  }

  const scheduled = epics.filter((e) => e.startDate && e.dueDate);
  const unscheduled = epics.filter((e) => !e.startDate || !e.dueDate);

  let rangeStart, rangeEnd, totalMs, months;
  if (scheduled.length > 0) {
    const starts = scheduled.map((e) => new Date(e.startDate).getTime());
    const ends = scheduled.map((e) => new Date(e.dueDate).getTime());
    rangeStart = new Date(Math.min(...starts) - 3 * DAY_MS);
    rangeEnd = new Date(Math.max(...ends) + 3 * DAY_MS);
    totalMs = rangeEnd - rangeStart;

    months = [];
    let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    while (cursor <= rangeEnd) {
      months.push(new Date(cursor));
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {scheduled.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-100 dark:border-slate-800 h-7 relative">
            <div className="w-48 shrink-0 border-r border-slate-100 dark:border-slate-800" />
            <div className="flex-1 relative">
              {months.map((m, i) => (
                <span
                  key={i}
                  className="absolute top-1.5 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap"
                  style={{ left: `${((m - rangeStart) / totalMs) * 100}%` }}
                >
                  {m.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {scheduled.map((epic) => {
              const start = new Date(epic.startDate).getTime();
              const end = new Date(epic.dueDate).getTime();
              const leftPct = Math.max(0, ((start - rangeStart) / totalMs) * 100);
              const widthPct = Math.max(2, ((end - start) / totalMs) * 100);
              const pct = epic.totalChildren > 0 ? Math.round((epic.doneChildren / epic.totalChildren) * 100) : 0;

              return (
                <li key={epic._id} className="flex items-center text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <button
                    onClick={() => onIssueClick?.(epic._id)}
                    className="w-48 shrink-0 text-left px-3 py-2.5 truncate"
                  >
                    <span className="text-slate-400 dark:text-slate-500 mr-1.5">{epic.key}</span>
                    <span className="text-slate-700 dark:text-slate-300">{epic.title}</span>
                  </button>
                  <div className="flex-1 relative h-9 px-1">
                    <button
                      onClick={() => onIssueClick?.(epic._id)}
                      title={`${epic.doneChildren}/${epic.totalChildren} done`}
                      className="absolute top-1/2 -translate-y-1/2 h-4 rounded-full bg-indigo-100 dark:bg-indigo-500/15 overflow-hidden hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700 transition-shadow duration-150"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    >
                      <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {unscheduled.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm">
            <Milestone className="size-4 text-slate-400 dark:text-slate-500" />
            Unscheduled epics
          </h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {unscheduled.map((epic) => (
              <li key={epic._id}>
                <button
                  onClick={() => onIssueClick?.(epic._id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                >
                  <span>
                    <span className="text-slate-400 dark:text-slate-500 mr-1.5">{epic.key}</span>
                    <span className="text-slate-700 dark:text-slate-300">{epic.title}</span>
                  </span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 shrink-0">Set start/due dates</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
