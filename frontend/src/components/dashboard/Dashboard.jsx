import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Loader2, AlertTriangle, History, Eye } from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { getRecentlyViewed } from '../../lib/recentlyViewed';
import { cn, STATUS_DOT_CLASS } from '../../lib/utils';

export default function Dashboard() {
  const [myIssues, setMyIssues] = useState(null); // null = loading
  const [activity, setActivity] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    dashboardApi.getMyIssues().then(setMyIssues);
    dashboardApi.getActivity().then(setActivity);
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  const loadingIssues = myIssues === null;
  const nonDone = (myIssues || []).filter((i) => i.statusId?.category !== 'done');
  const inProgressCount = nonDone.filter((i) => i.statusId?.category === 'in_progress').length;
  const overdueCount = nonDone.filter((i) => i.dueDate && new Date(i.dueDate) < new Date()).length;

  return (
    <div className="space-y-6 mb-8">
      <div className="flex flex-wrap gap-4">
        <StatTile icon={ListChecks} label="Assigned to you" value={loadingIssues ? null : nonDone.length} />
        <StatTile icon={Loader2} label="In progress" value={loadingIssues ? null : inProgressCount} />
        <StatTile icon={AlertTriangle} label="Overdue" value={loadingIssues ? null : overdueCount} tone="warn" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AssignedToMe loading={loadingIssues} issues={nonDone} />
        </div>
        <RecentlyViewed items={recentlyViewed} />
      </div>

      <ActivityFeed loading={activity === null} activity={activity || []} />
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex-1 min-w-[140px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center gap-3">
      <div
        className={cn(
          'size-9 rounded-lg flex items-center justify-center shrink-0',
          tone === 'warn'
            ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
            : 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <div>
        {value === null ? (
          <div className="h-6 w-8 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ) : (
          <div className="text-xl font-semibold text-slate-800 dark:text-slate-100">{value}</div>
        )}
        <div className="text-xs text-slate-400 dark:text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function AssignedToMe({ loading, issues }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      <h3 className="font-semibold px-4 pt-3 pb-2 flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm">
        <ListChecks className="size-4 text-slate-400 dark:text-slate-500" />
        Assigned to you
      </h3>
      {loading ? (
        <div className="p-4 space-y-2">
          <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {issues.map((issue) => (
            <li key={issue._id}>
              <Link
                to={`/projects/${issue.projectId?._id}/board`}
                className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      'size-2 rounded-full shrink-0',
                      STATUS_DOT_CLASS[issue.statusId?.color] || STATUS_DOT_CLASS.slate
                    )}
                  />
                  <span className="text-slate-400 dark:text-slate-500 shrink-0">{issue.key}</span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">{issue.title}</span>
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                  {issue.projectId?.key}
                </span>
              </Link>
            </li>
          ))}
          {issues.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">
              Nothing assigned to you — nice and clear!
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function RecentlyViewed({ items }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      <h3 className="font-semibold px-4 pt-3 pb-2 flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm">
        <Eye className="size-4 text-slate-400 dark:text-slate-500" />
        Recently viewed
      </h3>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => (
          <li key={item._id}>
            <Link
              to={`/projects/${item.projectId}/board`}
              className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors min-w-0"
            >
              <span className="text-slate-400 dark:text-slate-500 shrink-0">{item.key}</span>
              <span className="text-slate-700 dark:text-slate-300 truncate">{item.title}</span>
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">
            You haven't viewed any issues yet.
          </li>
        )}
      </ul>
    </div>
  );
}

function ActivityFeed({ loading, activity }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      <h3 className="font-semibold px-4 pt-3 pb-2 flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm">
        <History className="size-4 text-slate-400 dark:text-slate-500" />
        Recent activity
      </h3>
      {loading ? (
        <div className="p-4 space-y-2">
          <div className="h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {activity.map((a) => (
            <li key={a._id} className="px-4 py-2.5 text-sm">
              <Link
                to={a.issueId?.projectId ? `/projects/${a.issueId.projectId._id}/board` : '#'}
                className="hover:underline"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">{a.actorId?.name}</span>{' '}
                <span className="text-slate-500 dark:text-slate-400">changed</span>{' '}
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5">{a.field}</span>{' '}
                <span className="text-slate-500 dark:text-slate-400">on</span>{' '}
                <span className="text-slate-700 dark:text-slate-300">{a.issueId?.key}</span>
                {': '}
                <em className="not-italic text-slate-500 dark:text-slate-400">{String(a.fromValue)}</em>
                {' → '}
                <em className="not-italic text-slate-800 dark:text-slate-200 font-medium">{String(a.toValue)}</em>
              </Link>
            </li>
          ))}
          {activity.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">No recent activity yet.</li>
          )}
        </ul>
      )}
    </div>
  );
}
