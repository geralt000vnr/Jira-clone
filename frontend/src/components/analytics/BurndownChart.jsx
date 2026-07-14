import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// data: [{ day: 'Day 1', ideal: 40, actual: 40 }, { day: 'Day 2', ideal: 36, actual: 38 }, ...]
export default function BurndownChart({ data }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-slide-up">
      <h3 className="font-semibold mb-4 text-slate-800">Sprint Burndown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            label={{ value: 'Story Points Remaining', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#94a3b8"
            strokeDasharray="5 5"
            name="Ideal"
            animationDuration={600}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#4f46e5"
            strokeWidth={2}
            name="Actual"
            dot={{ r: 3 }}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
