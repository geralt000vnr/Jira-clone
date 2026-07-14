import { Search } from 'lucide-react';
import { cn, fieldClass } from '../../lib/utils';

const STATUSES = ['', 'todo', 'in_progress', 'done'];
const PRIORITIES = ['', 'lowest', 'low', 'medium', 'high', 'highest'];

const selectClass = cn('px-3 py-2 text-sm cursor-pointer', fieldClass);

export default function FilterBar({ filtersState, members = [] }) {
  const { status, setStatus, priority, setPriority, assigneeId, setAssigneeId, q, setQ } = filtersState;

  return (
    <div className="flex flex-wrap gap-2 items-center flex-1">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search issues..."
          className={cn('w-full pl-8 pr-3 py-2 text-sm', fieldClass)}
        />
      </div>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s || 'All statuses'}
          </option>
        ))}
      </select>
      <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p || 'All priorities'}
          </option>
        ))}
      </select>
      <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={selectClass}>
        <option value="">All assignees</option>
        {members
          .filter((m) => m.userId)
          .map((m) => (
            <option key={m.userId._id} value={m.userId._id}>
              {m.userId.name}
            </option>
          ))}
      </select>
    </div>
  );
}
