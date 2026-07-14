import { useState, useEffect, useCallback } from 'react';
import { Play, CheckCircle2, ArrowRightCircle, Rocket, Inbox, CalendarDays } from 'lucide-react';
import { sprintApi } from '../../api/sprintApi';
import { issueApi } from '../../api/issueApi';
import { Button } from '../ui/button';
import { cn, fieldClass } from '../../lib/utils';

const STATUS_DOT = {
  todo: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  done: 'bg-emerald-500',
};

export default function BacklogPanel({ projectId }) {
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [activeSprintIssues, setActiveSprintIssues] = useState([]);
  const [backlogIssues, setBacklogIssues] = useState([]);
  const [newSprint, setNewSprint] = useState({ name: '', startDate: '', endDate: '' });
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const all = await sprintApi.list(projectId);
    setSprints(all);
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
      alert(err.response?.data?.message || 'Failed to start sprint');
    }
  };

  const handleComplete = async (sprintId) => {
    if (!confirm('Complete this sprint? Unfinished issues will return to the backlog.')) return;
    await sprintApi.complete(sprintId);
    load();
  };

  const handleAddToSprint = async (issueId) => {
    if (!activeSprint) return alert('Start a sprint first');
    await sprintApi.addIssue(activeSprint._id, issueId);
    load();
  };

  const plannedSprints = sprints.filter((s) => s.status === 'planned');

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {activeSprint ? (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-50/60 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
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
          <ul className="divide-y divide-slate-100">
            {activeSprintIssues.map((i) => (
              <li key={i._id} className="px-4 py-2.5 text-sm flex justify-between items-center hover:bg-slate-50 transition-colors">
                <span className="text-slate-700">
                  <span className="text-slate-400 mr-1.5">{i.key}</span>
                  {i.title}
                </span>
                <span className="text-xs text-slate-400 capitalize flex items-center gap-1.5">
                  <span className={cn('size-1.5 rounded-full', STATUS_DOT[i.status])} />
                  {i.status.replace('_', ' ')}
                </span>
              </li>
            ))}
            {activeSprintIssues.length === 0 && (
              <li className="px-4 py-6 text-sm text-slate-400 text-center">No issues in this sprint yet.</li>
            )}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-slate-500 bg-slate-100/70 rounded-lg px-4 py-3">
          No active sprint. Start a planned sprint below, or create one.
        </p>
      )}

      <section>
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-slate-800">
          <Inbox className="size-4 text-slate-400" />
          Backlog
        </h3>
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
          {backlogIssues.map((i) => (
            <li
              key={i._id}
              className="px-4 py-2.5 text-sm flex justify-between items-center hover:bg-slate-50 transition-colors group"
            >
              <span className="text-slate-700">
                <span className="text-slate-400 mr-1.5">{i.key}</span>
                {i.title}
              </span>
              <button
                onClick={() => handleAddToSprint(i._id)}
                className="flex items-center gap-1 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 hover:underline transition-opacity duration-150"
              >
                <ArrowRightCircle className="size-3.5" />
                Add to sprint
              </button>
            </li>
          ))}
          {backlogIssues.length === 0 && <li className="px-4 py-6 text-sm text-slate-400 text-center">Backlog is empty.</li>}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-slate-800">
          <CalendarDays className="size-4 text-slate-400" />
          Planned Sprints
        </h3>
        <ul className="space-y-1.5 mb-3">
          {plannedSprints.map((s) => (
            <li
              key={s._id}
              className="flex justify-between items-center text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white shadow-sm hover:border-slate-300 transition-colors"
            >
              <span className="text-slate-700">
                {s.name}{' '}
                <span className="text-slate-400">
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
          {plannedSprints.length === 0 && <li className="text-sm text-slate-400">No planned sprints.</li>}
        </ul>

        <form
          onSubmit={handleCreateSprint}
          className="flex flex-wrap gap-2 items-end bg-white border border-slate-200 rounded-xl p-3 shadow-sm"
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
