import { useState, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn, fieldClass } from '../../lib/utils';

const PRIORITIES = ['lowest', 'low', 'medium', 'high', 'highest'];
const selectClass = cn('px-2 py-1.5 text-sm cursor-pointer', fieldClass);

export default function IssueForm({ issue, onSave, onStatusChange, statuses = [] }) {
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [storyPoints, setStoryPoints] = useState(issue.storyPoints ?? '');
  const [saved, setSaved] = useState(false);
  const savedTimeout = useRef(null);

  const flashSaved = () => {
    setSaved(true);
    clearTimeout(savedTimeout.current);
    savedTimeout.current = setTimeout(() => setSaved(false), 1400);
  };

  const saveIfChanged = (field, value, original) => {
    if (value === original) return;
    onSave({ [field]: value });
    flashSaved();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => saveIfChanged('title', title, issue.title)}
          className="text-lg font-semibold w-full text-slate-900 dark:text-slate-100 border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:outline-none focus:border-indigo-500 pb-1 transition-colors duration-150 -mx-1 px-1"
        />
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 shrink-0 animate-fade-in">
            <Check className="size-3.5" />
            Saved
          </span>
        )}
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => saveIfChanged('description', description, issue.description)}
        className={cn('w-full px-3 py-2 text-sm resize-none', fieldClass)}
        rows={3}
        placeholder="Add a description..."
      />

      <div className="flex gap-4 text-sm flex-wrap">
        <label className="flex flex-col gap-1 text-slate-500 dark:text-slate-400">
          Status
          {/* Status changes go through the move endpoint, not the general update endpoint
              (the backend's updateIssue only accepts title/description/priority/assigneeId/dueDate/labels/sprintId/storyPoints/originalEstimateSeconds) */}
          <select value={issue.statusId} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
            {statuses.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-slate-500 dark:text-slate-400">
          Priority
          <select
            value={issue.priority}
            onChange={(e) => onSave({ priority: e.target.value })}
            className={selectClass}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-slate-500 dark:text-slate-400">
          Story points
          <input
            type="number"
            min="0"
            max="999"
            value={storyPoints}
            onChange={(e) => setStoryPoints(e.target.value)}
            onBlur={() => {
              const value = storyPoints === '' ? null : Number(storyPoints);
              saveIfChanged('storyPoints', value, issue.storyPoints ?? null);
            }}
            placeholder="—"
            className={cn('px-2 py-1.5 text-sm w-16', fieldClass)}
          />
        </label>

        <label className="flex flex-col gap-1 text-slate-500 dark:text-slate-400">
          Due date
          <input
            type="date"
            value={issue.dueDate ? issue.dueDate.slice(0, 10) : ''}
            onChange={(e) => onSave({ dueDate: e.target.value })}
            className={cn('px-2 py-1.5 text-sm', fieldClass)}
          />
        </label>
      </div>
    </div>
  );
}
