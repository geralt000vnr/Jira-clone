import { useState } from 'react';

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['lowest', 'low', 'medium', 'high', 'highest'];

export default function IssueForm({ issue, onSave, onStatusChange }) {
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);

  return (
    <div className="space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== issue.title && onSave({ title })}
        className="text-lg font-semibold w-full border-b focus:outline-none focus:border-indigo-500 pb-1"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => description !== issue.description && onSave({ description })}
        className="w-full border rounded p-2 text-sm"
        rows={3}
        placeholder="Add a description..."
      />

      <div className="flex gap-4 text-sm">
        <label className="flex flex-col gap-1">
          Status
          {/* Status changes go through the move endpoint, not the general update endpoint
              (the backend's updateIssue only accepts title/description/priority/assigneeId/dueDate/labels/sprintId) */}
          <select value={issue.status} onChange={(e) => onStatusChange(e.target.value)} className="border rounded p-1">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          Priority
          <select value={issue.priority} onChange={(e) => onSave({ priority: e.target.value })} className="border rounded p-1">
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          Due date
          <input
            type="date"
            value={issue.dueDate ? issue.dueDate.slice(0, 10) : ''}
            onChange={(e) => onSave({ dueDate: e.target.value })}
            className="border rounded p-1"
          />
        </label>
      </div>
    </div>
  );
}
