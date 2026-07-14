import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// data: [{ day: 'Day 1', ideal: 40, actual: 40 }, { day: 'Day 2', ideal: 36, actual: 38 }, ...]
export default function BurndownChart({ data }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Sprint Burndown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis label={{ value: 'Story Points Remaining', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" name="Ideal" />
          <Line type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={2} name="Actual" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
