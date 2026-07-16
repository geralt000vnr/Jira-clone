import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, Paperclip, MessageSquare, History, Upload, FileText, ListTodo, Link2, Plus, Search, Timer } from 'lucide-react';
import { issueApi } from '../../api/issueApi';
import { commentApi } from '../../api/commentApi';
import { attachmentApi } from '../../api/attachmentApi';
import { worklogApi } from '../../api/worklogApi';
import CommentThread from './CommentThread';
import IssueForm from './IssueForm';
import { cn, fieldClass, getInitials } from '../../lib/utils';

function formatDuration(seconds) {
  if (!seconds) return '0h';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ') || '0m';
}

const LINK_TYPES = ['blocks', 'relates_to', 'duplicates'];

const TABS = [
  { id: 'comments', label: 'Comments', Icon: MessageSquare },
  { id: 'attachments', label: 'Attachments', Icon: Paperclip },
  { id: 'activity', label: 'Activity', Icon: History },
];

export default function IssueModal({ issueId, onClose, statuses = [] }) {
  const [issue, setIssue] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [links, setLinks] = useState([]);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [worklogs, setWorklogs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('comments'); // 'comments' | 'attachments' | 'activity'
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [issueRes, commentsRes, attachmentsRes, worklogsRes] = await Promise.all([
        issueApi.get(issueId),
        commentApi.list(issueId),
        attachmentApi.list(issueId),
        worklogApi.list(issueId),
      ]);
      setIssue(issueRes.issue);
      setSubtasks(issueRes.subtasks);
      setLinks(issueRes.links || []);
      setComments(commentsRes);
      setAttachments(attachmentsRes);
      setWorklogs(worklogsRes);
    } catch (err) {
      setError('Failed to load issue');
    }
  }, [issueId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose(false);
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const loadActivity = async () => {
    const data = await issueApi.activity(issueId);
    setActivity(data);
  };

  const handleFieldSave = async (fields) => {
    try {
      const updated = await issueApi.update(issueId, { ...fields, expectedVersion: issue.version });
      setIssue(updated);
    } catch (err) {
      if (err.response?.status === 409) {
        alert('This issue changed elsewhere. Reloading the latest version.');
        loadAll();
      } else {
        setError('Failed to save changes');
      }
    }
  };

  const handleStatusChange = async (toStatusId) => {
    try {
      const updated = await issueApi.move(issueId, {
        toStatusId,
        toPosition: 0,
        fromStatusId: issue.statusId,
        expectedVersion: issue.version,
      });
      setIssue(updated);
    } catch (err) {
      if (err.response?.status === 409) {
        alert('This issue changed elsewhere. Reloading the latest version.');
        loadAll();
      } else {
        setError('Failed to change status');
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this issue? This cannot be undone.')) return;
    await issueApi.remove(issueId);
    onClose(true); // signal parent board to refresh
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={() => onClose(false)}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {!issue ? (
          <div className="p-6 space-y-4">
            <div className="h-5 w-40 rounded bg-slate-100 animate-pulse" />
            <div className="h-8 w-2/3 rounded bg-slate-100 animate-pulse" />
            <div className="h-20 rounded bg-slate-100 animate-pulse" />
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-medium tracking-wide text-slate-400">{issue.key}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md px-2 py-1 transition-colors duration-150"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
                <button
                  onClick={() => onClose(false)}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md p-1.5 transition-colors duration-150"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <IssueForm issue={issue} onSave={handleFieldSave} onStatusChange={handleStatusChange} statuses={statuses} />

            <TimeTrackingSection
              issueId={issueId}
              issue={issue}
              worklogs={worklogs}
              onIssueChange={setIssue}
              onWorklogsChange={setWorklogs}
            />

            {subtasks.length > 0 && (
              <div className="mt-5">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-slate-700">
                  <ListTodo className="size-4" />
                  Subtasks ({subtasks.length})
                </h4>
                <ul className="space-y-1 border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-hidden">
                  {subtasks.map((st) => (
                    <li key={st._id} className="text-sm text-slate-600 px-3 py-2 hover:bg-slate-50 transition-colors">
                      <span className="text-slate-400 mr-1.5">{st.key}</span>
                      {st.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <LinkedIssuesSection
              issueId={issueId}
              projectId={issue.projectId}
              links={links}
              onChange={setLinks}
            />

            <div className="mt-6 border-b border-slate-200 flex gap-1 text-sm">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setTab(id);
                    if (id === 'activity') loadActivity();
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 pb-2.5 pt-1 -mb-px border-b-2 transition-colors duration-150',
                    tab === id
                      ? 'border-indigo-600 text-indigo-600 font-medium'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="animate-fade-in">
              {tab === 'comments' && <CommentThread issueId={issueId} comments={comments} onChange={setComments} />}

              {tab === 'attachments' && (
                <AttachmentPanel issueId={issueId} attachments={attachments} onChange={setAttachments} />
              )}

              {tab === 'activity' && (
                <ul className="mt-4 space-y-2 text-sm">
                  {activity.map((a) => (
                    <li key={a._id} className="text-slate-600 flex items-start gap-2 py-1">
                      <span className="size-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                      <span>
                        <span className="font-medium text-slate-800">{a.actorId?.name}</span> changed{' '}
                        <span className="font-mono text-xs bg-slate-100 rounded px-1 py-0.5">{a.field}</span> from{' '}
                        <em className="not-italic text-slate-500">{String(a.fromValue)}</em> to{' '}
                        <em className="not-italic text-slate-800 font-medium">{String(a.toValue)}</em>
                        <span className="text-xs text-slate-400 ml-2">{new Date(a.createdAt).toLocaleString()}</span>
                      </span>
                    </li>
                  ))}
                  {activity.length === 0 && <li className="text-slate-400">No activity yet.</li>}
                </ul>
              )}
            </div>

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function TimeTrackingSection({ issueId, issue, worklogs, onIssueChange, onWorklogsChange }) {
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const hasEstimate = issue.originalEstimateSeconds != null;
  const total = issue.originalEstimateSeconds || 0;
  const logged = issue.loggedSeconds || 0;
  const pct = total > 0 ? Math.min(100, Math.round((logged / total) * 100)) : 0;

  const handleSetEstimate = async (e) => {
    const value = e.target.value;
    if (!value) return;
    const updated = await issueApi.update(issueId, {
      originalEstimateSeconds: Math.round(parseFloat(value) * 3600),
      expectedVersion: issue.version,
    });
    onIssueChange(updated);
  };

  const handleLogWork = async () => {
    const timeSpentSeconds = Math.round(parseFloat(hours) * 3600);
    if (!timeSpentSeconds || timeSpentSeconds < 60) return;
    setSaving(true);
    try {
      const { worklog, issue: updatedIssue } = await worklogApi.create(issueId, { timeSpentSeconds, description });
      onWorklogsChange([worklog, ...worklogs]);
      onIssueChange(updatedIssue);
      setShowForm(false);
      setHours('');
      setDescription('');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (worklog) => {
    await worklogApi.remove(worklog._id);
    onWorklogsChange(worklogs.filter((w) => w._id !== worklog._id));
    onIssueChange({
      ...issue,
      loggedSeconds: Math.max(0, issue.loggedSeconds - worklog.timeSpentSeconds),
      remainingEstimateSeconds:
        issue.remainingEstimateSeconds != null ? issue.remainingEstimateSeconds + worklog.timeSpentSeconds : null,
    });
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold flex items-center gap-1.5 text-slate-700">
          <Timer className="size-4" />
          Time tracking
        </h4>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
          <Plus className="size-3.5" />
          Log work
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500 mb-1">
        <span className="text-slate-700 font-medium">{formatDuration(logged)} logged</span>
        {hasEstimate && <span>of {formatDuration(total)} estimated</span>}
      </div>
      {hasEstimate && (
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
          <div
            className={cn('h-full rounded-full transition-all duration-300', pct > 100 ? 'bg-red-400' : 'bg-indigo-500')}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      )}
      {!hasEstimate && (
        <input
          type="number"
          min="0"
          step="0.5"
          placeholder="Set original estimate (hours)"
          onBlur={handleSetEstimate}
          className={cn('px-2 py-1 text-xs w-56 mb-2', fieldClass)}
        />
      )}

      {showForm && (
        <div className="border border-slate-200 rounded-lg p-3 space-y-2 animate-slide-down bg-slate-50/50 mb-2">
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Hours"
              className={cn('px-2 py-1.5 text-sm w-24', fieldClass)}
              autoFocus
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on? (optional)"
              className={cn('flex-1 px-2 py-1.5 text-sm', fieldClass)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 px-2 py-1">
              Cancel
            </button>
            <button
              onClick={handleLogWork}
              disabled={saving || !hours}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md disabled:opacity-40 disabled:pointer-events-none hover:bg-indigo-700 transition-colors duration-150"
            >
              {saving ? 'Logging...' : 'Log work'}
            </button>
          </div>
        </div>
      )}

      {worklogs.length > 0 && (
        <ul className="space-y-1">
          {worklogs.map((w) => (
            <li key={w._id} className="text-xs text-slate-500 flex items-center justify-between py-1 px-2 hover:bg-slate-50 rounded">
              <span className="flex items-center gap-1.5">
                <span className="size-4 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-medium flex items-center justify-center">
                  {getInitials(w.authorId?.name)}
                </span>
                <span className="font-medium text-slate-700">{formatDuration(w.timeSpentSeconds)}</span>
                {w.description && <span className="text-slate-400">— {w.description}</span>}
              </span>
              <button onClick={() => handleRemove(w)} className="text-slate-300 hover:text-red-500 transition-colors duration-150">
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LinkedIssuesSection({ issueId, projectId, links, onChange }) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('blocks');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!query.trim() || !projectId) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const found = await issueApi.list({ projectId, q: query.trim() });
      setResults(found.filter((i) => i._id !== issueId));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, projectId, issueId]);

  const handleAdd = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const link = await issueApi.addLink(issueId, { targetIssueId: selected._id, type });
      onChange([...links, link]);
      setShowForm(false);
      setQuery('');
      setSelected(null);
      setResults([]);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (linkId) => {
    await issueApi.removeLink(issueId, linkId);
    onChange(links.filter((l) => l._id !== linkId));
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold flex items-center gap-1.5 text-slate-700">
          <Link2 className="size-4" />
          Linked issues {links.length > 0 && `(${links.length})`}
        </h4>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
          <Plus className="size-3.5" />
          Add link
        </button>
      </div>

      {links.length > 0 && (
        <ul className="space-y-1 border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-hidden mb-2">
          {links.map((link) => (
            <li key={link._id} className="text-sm px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <span className="text-slate-600">
                <span className="text-slate-400 italic">{link.label}</span>{' '}
                <span className="text-slate-400">{link.issue.key}</span> {link.issue.title}
              </span>
              <button onClick={() => handleRemove(link._id)} className="text-slate-400 hover:text-red-500 transition-colors duration-150">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="border border-slate-200 rounded-lg p-3 space-y-2 animate-slide-down bg-slate-50/50">
          <div className="flex gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className={cn('px-2 py-1.5 text-sm cursor-pointer', fieldClass)}>
              {LINK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={selected ? `${selected.key} — ${selected.title}` : query}
                onChange={(e) => {
                  setSelected(null);
                  setQuery(e.target.value);
                }}
                placeholder="Search issue by key or title..."
                className={cn('w-full pl-7 pr-2 py-1.5 text-sm', fieldClass)}
              />
            </div>
          </div>
          {results.length > 0 && !selected && (
            <ul className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white">
              {results.map((r) => (
                <li
                  key={r._id}
                  onClick={() => {
                    setSelected(r);
                    setResults([]);
                  }}
                  className="text-sm px-3 py-1.5 hover:bg-indigo-50 cursor-pointer"
                >
                  <span className="text-slate-400 mr-1.5">{r.key}</span>
                  {r.title}
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 px-2 py-1">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!selected || saving}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md disabled:opacity-40 disabled:pointer-events-none hover:bg-indigo-700 transition-colors duration-150"
            >
              {saving ? 'Linking...' : 'Link issue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentPanel({ issueId, attachments, onChange }) {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const attachment = await attachmentApi.upload(issueId, file);
    onChange([attachment, ...attachments]);
    e.target.value = '';
  };

  const handleOpen = async (a) => {
    const blobUrl = await attachmentApi.openFile(a.url);
    window.open(blobUrl, '_blank');
  };

  const handleRemove = async (id) => {
    await attachmentApi.remove(id);
    onChange(attachments.filter((a) => a._id !== id));
  };

  return (
    <div className="mt-4">
      <label className="inline-flex items-center gap-1.5 text-sm text-indigo-600 border border-dashed border-indigo-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors duration-150 mb-3">
        <Upload className="size-3.5" />
        Upload file
        <input type="file" onChange={handleUpload} className="hidden" />
      </label>
      <ul className="space-y-1.5">
        {attachments.map((a) => (
          <li
            key={a._id}
            className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2 hover:border-slate-200 hover:bg-slate-50 transition-colors duration-150"
          >
            <button onClick={() => handleOpen(a)} className="flex items-center gap-2 text-indigo-600 hover:underline text-left">
              <FileText className="size-3.5 shrink-0" />
              {a.originalName}
            </button>
            <button
              onClick={() => handleRemove(a._id)}
              className="text-slate-400 hover:text-red-500 transition-colors duration-150"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
        {attachments.length === 0 && <li className="text-slate-400 text-sm">No attachments yet.</li>}
      </ul>
    </div>
  );
}
