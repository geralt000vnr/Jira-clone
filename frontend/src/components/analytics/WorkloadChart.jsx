import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { issueApi } from '../../api/issueApi';
import { projectApi } from '../../api/projectApi';
import { workflowStatusApi } from '../../api/workflowStatusApi';
import { useTheme } from '../../context/ThemeContext';

export default function WorkloadChart({ projectId }) {
  const [data, setData] = useState([]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  useEffect(() => {
    (async () => {
      const [issues, members, statuses] = await Promise.all([
        issueApi.list({ projectId }),
        projectApi.listMembers(projectId),
        workflowStatusApi.list(projectId),
      ]);
      const doneStatusIds = new Set(statuses.filter((s) => s.category === 'done').map((s) => s._id));

      const counts = members
        .filter((m) => m.userId)
        .map((m) => ({
          name: m.userId.name,
          open: issues.filter((i) => String(i.assigneeId) === String(m.userId._id) && !doneStatusIds.has(i.statusId))
            .length,
          done: issues.filter((i) => String(i.assigneeId) === String(m.userId._id) && doneStatusIds.has(i.statusId))
            .length,
        }));

      setData(counts);
    })();
  }, [projectId]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 animate-slide-up">
      <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Team Workload</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: tickColor }} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: `1px solid ${gridColor}`,
              fontSize: 13,
              background: isDark ? '#1e293b' : '#fff',
              color: isDark ? '#e2e8f0' : '#0f172a',
            }}
            cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }}
          />
          <Bar dataKey="open" stackId="a" fill="#4f46e5" name="Open issues" radius={[0, 0, 0, 0]} animationDuration={500} />
          <Bar dataKey="done" stackId="a" fill="#a5b4fc" name="Done" radius={[4, 4, 0, 0]} animationDuration={500} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
