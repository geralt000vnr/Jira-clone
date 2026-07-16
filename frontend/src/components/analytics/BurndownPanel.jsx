import { useState, useEffect } from 'react';
import { sprintApi } from '../../api/sprintApi';
import { cn, fieldClass } from '../../lib/utils';
import BurndownChart from './BurndownChart';

export default function BurndownPanel({ projectId }) {
  const [sprints, setSprints] = useState([]);
  const [sprintId, setSprintId] = useState('');
  const [data, setData] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    sprintApi.list(projectId).then((all) => {
      setSprints(all);
      const active = all.find((s) => s.status === 'active') || all[0];
      if (active) setSprintId(active._id);
    });
  }, [projectId]);

  useEffect(() => {
    if (!sprintId) return;
    sprintApi.burndown(sprintId).then((res) => {
      setData(res.data);
      setTotalPoints(res.totalPoints);
    });
  }, [sprintId]);

  if (sprints.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-sm text-slate-400">
        No sprints yet — create one from the Backlog tab to see a burndown.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <select
          value={sprintId}
          onChange={(e) => setSprintId(e.target.value)}
          className={cn('px-3 py-1.5 text-sm cursor-pointer', fieldClass)}
        >
          {sprints.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.status})
            </option>
          ))}
        </select>
        {totalPoints > 0 && <span className="text-xs text-slate-400">{totalPoints} points at sprint start</span>}
      </div>
      {data && <BurndownChart data={data} />}
    </div>
  );
}
