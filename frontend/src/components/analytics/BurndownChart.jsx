import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// data: [{ day: 'Day 1', ideal: 40, actual: 40 }, { day: 'Day 2', ideal: 36, actual: 38 }, ...]
export default function BurndownChart({ data }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 animate-slide-up">
      <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200">Sprint Burndown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: tickColor }} />
          <YAxis
            tick={{ fontSize: 12, fill: tickColor }}
            label={{ value: 'Story Points Remaining', angle: -90, position: 'insideLeft', fill: tickColor }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: `1px solid ${gridColor}`,
              fontSize: 13,
              background: isDark ? '#1e293b' : '#fff',
              color: isDark ? '#e2e8f0' : '#0f172a',
            }}
          />
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
