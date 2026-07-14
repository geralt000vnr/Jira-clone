import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { issueApi } from '../../api/issueApi';
import { projectApi } from '../../api/projectApi';

export default function WorkloadChart({ projectId }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      const [issues, members] = await Promise.all([issueApi.list({ projectId }), projectApi.listMembers(projectId)]);

      const counts = members.map((m) => ({
        name: m.userId.name,
        open: issues.filter((i) => String(i.assigneeId) === String(m.userId._id) && i.status !== 'done').length,
        done: issues.filter((i) => String(i.assigneeId) === String(m.userId._id) && i.status === 'done').length,
      }));

      setData(counts);
    })();
  }, [projectId]);

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Team Workload</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="open" stackId="a" fill="#4f46e5" name="Open issues" />
          <Bar dataKey="done" stackId="a" fill="#94a3b8" name="Done" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
