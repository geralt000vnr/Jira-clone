import { useState, useEffect, useCallback } from 'react';
import { sprintApi } from '../../api/sprintApi';
import { issueApi } from '../../api/issueApi';

export default function BacklogPanel({ projectId }) {
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [activeSprintIssues, setActiveSprintIssues] = useState([]);
  const [backlogIssues, setBacklogIssues] = useState([]);
  const [newSprint, setNewSprint] = useState({ name: '', startDate: '', endDate: '' });
  const [error, setError] = useState(null);

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
    <div className="p-4 space-y-6">
      {activeSprint ? (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Active Sprint: {activeSprint.name}</h3>
            <button onClick={() => handleComplete(activeSprint._id)} className="text-sm text-green-600 hover:underline">
              Complete sprint
            </button>
          </div>
          <ul className="divide-y border rounded bg-white">
            {activeSprintIssues.map((i) => (
              <li key={i._id} className="p-2 text-sm flex justify-between">
                <span>
                  {i.key} — {i.title}
                </span>
                <span className="text-xs text-slate-400 capitalize">{i.status.replace('_', ' ')}</span>
              </li>
            ))}
            {activeSprintIssues.length === 0 && (
              <li className="p-2 text-sm text-slate-400">No issues in this sprint yet.</li>
            )}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-slate-500">No active sprint. Start a planned sprint below, or create one.</p>
      )}

      <section>
        <h3 className="font-semibold mb-2">Backlog</h3>
        <ul className="divide-y border rounded bg-white">
          {backlogIssues.map((i) => (
            <li key={i._id} className="p-2 text-sm flex justify-between items-center">
              <span>
                {i.key} — {i.title}
              </span>
              <button onClick={() => handleAddToSprint(i._id)} className="text-xs text-indigo-600 hover:underline">
                Add to sprint
              </button>
            </li>
          ))}
          {backlogIssues.length === 0 && <li className="p-2 text-sm text-slate-400">Backlog is empty.</li>}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Planned Sprints</h3>
        <ul className="space-y-1 mb-3">
          {plannedSprints.map((s) => (
            <li key={s._id} className="flex justify-between items-center text-sm border rounded p-2 bg-white">
              <span>
                {s.name} ({new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()})
              </span>
              <button onClick={() => handleStart(s._id)} className="text-xs text-indigo-600 hover:underline">
                Start
              </button>
            </li>
          ))}
          {plannedSprints.length === 0 && <li className="text-sm text-slate-400">No planned sprints.</li>}
        </ul>

        <form onSubmit={handleCreateSprint} className="flex flex-wrap gap-2 items-end">
          <input
            placeholder="Sprint name"
            value={newSprint.name}
            onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
            className="border rounded p-2 text-sm"
            required
          />
          <input
            type="date"
            value={newSprint.startDate}
            onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
            className="border rounded p-2 text-sm"
            required
          />
          <input
            type="date"
            value={newSprint.endDate}
            onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
            className="border rounded p-2 text-sm"
            required
          />
          <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded">Create sprint</button>
        </form>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </section>
    </div>
  );
}
