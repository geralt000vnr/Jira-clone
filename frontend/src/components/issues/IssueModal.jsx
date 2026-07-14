import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, Paperclip, MessageSquare, History, Upload, FileText, ListTodo } from 'lucide-react';
import { issueApi } from '../../api/issueApi';
import { commentApi } from '../../api/commentApi';
import { attachmentApi } from '../../api/attachmentApi';
import CommentThread from './CommentThread';
import IssueForm from './IssueForm';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'comments', label: 'Comments', Icon: MessageSquare },
  { id: 'attachments', label: 'Attachments', Icon: Paperclip },
  { id: 'activity', label: 'Activity', Icon: History },
];

export default function IssueModal({ issueId, onClose }) {
  const [issue, setIssue] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('comments'); // 'comments' | 'attachments' | 'activity'
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [issueRes, commentsRes, attachmentsRes] = await Promise.all([
        issueApi.get(issueId),
        commentApi.list(issueId),
        attachmentApi.list(issueId),
      ]);
      setIssue(issueRes.issue);
      setSubtasks(issueRes.subtasks);
      setComments(commentsRes);
      setAttachments(attachmentsRes);
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

  const handleStatusChange = async (toStatus) => {
    try {
      const updated = await issueApi.move(issueId, {
        toStatus,
        toPosition: 0,
        fromStatus: issue.status,
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

            <IssueForm issue={issue} onSave={handleFieldSave} onStatusChange={handleStatusChange} />

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
