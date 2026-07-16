import { useState, useEffect, useCallback } from 'react';
import { Play, CheckCircle2, ArrowRightCircle, Rocket, Inbox, CalendarDays, Trash2, X } from 'lucide-react';
import { sprintApi } from '../../api/sprintApi';
import { issueApi } from '../../api/issueApi';
import { workflowStatusApi } from '../../api/workflowStatusApi';
import { projectApi } from '../../api/projectApi';
import { Button } from '../ui/button';
import { cn, fieldClass, STATUS_DOT_CLASS } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

export default function BacklogPanel({ projectId }) {
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [activeSprintIssues, setActiveSprintIssues] = useState([]);
  const [backlogIssues, setBacklogIssues] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [newSprint, setNewSprint] = useState({ name: '', startDate: '', endDate: '' });
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const statusById = Object.fromEntries(statuses.map((s) => [s._id, s]));

  const load = useCallback(async () => {
    const [all, statusList, memberList] = await Promise.all([
      sprintApi.list(projectId),
      workflowStatusApi.list(projectId),
      projectApi.listMembers(projectId),
    ]);
    setSprints(all);
    setStatuses(statusList);
    setMembers(memberList.filter((m) => m.userId));
    const active = all.find((s) => s.status === 'active');
    setActiveSprint(active || null);

    if (active) {
      const { issues } = await sprintApi.get(active._id);
      setActiveSprintIssues(issues);
    } else {
      setActiveSprintIssues([]);
    }

    // backlog = issues in this project with no sprint assigned
    const all_issues = await issueApi.list({ projectId });
    setBacklogIssues(all_issues.filter((i) => !i.sprintId));
    setSelected(new Set());
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await sprintApi.create({
        projectId,
        name: newSprint.name,
        startDate: new Date(newSprint.startDate).toISOString(),
        endDate: new Date(newSprint.endDate).toISOString(),
      });
      setNewSprint({ name: '', startDate: '', endDate: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sprint');
    } finally {
      setCreating(false);
    }
  };

  const handleStart = async (sprintId) => {
    try {
      await sprintApi.start(sprintId);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start sprint');
    }
  };

  const handleComplete = async (sprintId) => {
    if (!(await confirm('Complete this sprint? Unfinished issues will return to the backlog.', { confirmLabel: 'Complete' })))
      return;
    await sprintApi.complete(sprintId);
    load();
  };

  const handleAddToSprint = async (issueId) => {
    if (!activeSprint) return showToast('Start a sprint first');
    await sprintApi.addIssue(activeSprint._id, issueId);
    load();
  };

  const toggleSelected = (issueId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(issueId) ? next.delete(issueId) : next.add(issueId);
      return next;
    });
  };

  const selectedItems = () =>
    backlogIssues.filter((i) => selected.has(i._id)).map((i) => ({ issueId: i._id, expectedVersion: i.version }));

  const handleBulkUpdate = async (updates) => {
    setBulkBusy(true);
    try {
      const { failed } = await issueApi.bulkUpdate(selectedItems(), updates);
      if (failed.length > 0)
        showToast(`${failed.length} issue(s) couldn't be updated (they may have changed elsewhere).`);
      load();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!(await confirm(`Delete ${selected.size} issue(s)? This cannot be undone.`, { confirmLabel: 'Delete' })))
      return;
    setBulkBusy(true);
    try {
      await issueApi.bulkRemove([...selected]);
      load();
    } finally {
      setBulkBusy(false);
    }
  };

  const plannedSprints = sprints.filter((s) => s.status === 'planned');

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {activeSprint ? (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-50/60 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Rocket className="size-4 text-indigo-500" />
              {activeSprint.name}
              <span className="text-xs font-normal text-indigo-500 bg-indigo-100 rounded-full px-2 py-0.5">active</span>
            </h3>
            <button
              onClick={() => handleComplete(activeSprint._id)}
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              <CheckCircle2 className="size-3.5" />
              Complete sprint
            </button>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeSprintIssues.map((i) => (
              <li key={i._id} className="px-4 py-2.5 text-sm flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <span className="text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500 mr-1.5">{i.key}</span>
                  {i.title}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <span className={cn('size-1.5 rounded-full', STATUS_DOT_CLASS[statusById[i.statusId]?.color] || STATUS_DOT_CLASS.slate)} />
                  {statusById[i.statusId]?.name || 'Unknown'}
                </span>
              </li>
            ))}
            {activeSprintIssues.length === 0 && (
              <li className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">No issues in this sprint yet.</li>
            )}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60 rounded-lg px-4 py-3">
          No active sprint. Start a planned sprint below, or create one.
        </p>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Inbox className="size-4 text-slate-400 dark:text-slate-500" />
            Backlog
          </h3>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 text-xs animate-slide-down">
              <span className="text-slate-500 dark:text-slate-400">{selected.size} selected</span>
              <select
                disabled={bulkBusy}
                defaultValue=""
                onChange={(e) => e.target.value && handleBulkUpdate({ statusId: e.target.value })}
                className={cn('px-2 py-1 text-xs cursor-pointer', fieldClass)}
              >
                <option value="" disabled>
                  Move to...
                </option>
                {statuses.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                disabled={bulkBusy}
                defaultValue=""
                onChange={(e) => e.target.value && handleBulkUpdate({ assigneeId: e.target.value })}
                className={cn('px-2 py-1 text-xs cursor-pointer', fieldClass)}
              >
                <option value="" disabled>
                  Assign to...
                </option>
                {members.map((m) => (
                  <option key={m.userId._id} value={m.userId._id}>
                    {m.userId.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkDelete}
                disabled={bulkBusy}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 px-2 py-1"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
              <button onClick={() => setSelected(new Set())} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1">
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {backlogIssues.map((i) => (
            <li
              key={i._id}
              className={cn(
                'px-4 py-2.5 text-sm flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group',
                selected.has(i._id) && 'bg-indigo-50/60'
              )}
            >
              <label className="flex items-center gap-3 text-slate-700 dark:text-slate-300 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={selected.has(i._id)}
                  onChange={() => toggleSelected(i._id)}
                  className="cursor-pointer"
                />
                <span>
                  <span className="text-slate-400 dark:text-slate-500 mr-1.5">{i.key}</span>
                  {i.title}
                </span>
              </label>
              <button
                onClick={() => handleAddToSprint(i._id)}
                className="flex items-center gap-1 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 hover:underline transition-opacity duration-150"
              >
                <ArrowRightCircle className="size-3.5" />
                Add to sprint
              </button>
            </li>
          ))}
          {backlogIssues.length === 0 && <li className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">Backlog is empty.</li>}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <CalendarDays className="size-4 text-slate-400 dark:text-slate-500" />
          Planned Sprints
        </h3>
        <ul className="space-y-1.5 mb-3">
          {plannedSprints.map((s) => (
            <li
              key={s._id}
              className="flex justify-between items-center text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <span className="text-slate-700 dark:text-slate-300">
                {s.name}{' '}
                <span className="text-slate-400 dark:text-slate-500">
                  ({new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()})
                </span>
              </span>
              <button
                onClick={() => handleStart(s._id)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
              >
                <Play className="size-3" />
                Start
              </button>
            </li>
          ))}
          {plannedSprints.length === 0 && <li className="text-sm text-slate-400 dark:text-slate-500">No planned sprints.</li>}
        </ul>

        <form
          onSubmit={handleCreateSprint}
          className="flex flex-wrap gap-2 items-end bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm"
        >
          <input
            placeholder="Sprint name"
            value={newSprint.name}
            onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
            className={cn('px-3 py-2 text-sm flex-1 min-w-[140px]', fieldClass)}
            required
          />
          <input
            type="date"
            value={newSprint.startDate}
            onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
            className={cn('px-3 py-2 text-sm', fieldClass)}
            required
          />
          <input
            type="date"
            value={newSprint.endDate}
            onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
            className={cn('px-3 py-2 text-sm', fieldClass)}
            required
          />
          <Button type="submit" loading={creating}>
            {creating ? 'Creating...' : 'Create sprint'}
          </Button>
        </form>
        {error && <p className="text-red-500 text-xs mt-1 animate-slide-down">{error}</p>}
      </section>
    </div>
  );
}
