const STATUSES = ['', 'todo', 'in_progress', 'done'];
const PRIORITIES = ['', 'lowest', 'low', 'medium', 'high', 'highest'];

export default function FilterBar({ filtersState, members = [] }) {
  const { status, setStatus, priority, setPriority, assigneeId, setAssigneeId, q, setQ } = filtersState;

  return (
    <div className="flex flex-wrap gap-2 items-center flex-1">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search issues..."
        className="border rounded p-2 text-sm flex-1 min-w-[180px]"
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded p-2 text-sm">
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s || 'All statuses'}
          </option>
        ))}
      </select>
      <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border rounded p-2 text-sm">
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p || 'All priorities'}
          </option>
        ))}
      </select>
      <select
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        className="border rounded p-2 text-sm"
      >
        <option value="">All assignees</option>
        {members.map((m) => (
          <option key={m.userId._id} value={m.userId._id}>
            {m.userId.name}
          </option>
        ))}
      </select>
    </div>
  );
}
