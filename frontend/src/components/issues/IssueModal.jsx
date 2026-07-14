import { useState, useEffect, useCallback } from 'react';
import { issueApi } from '../../api/issueApi';
import { commentApi } from '../../api/commentApi';
import { attachmentApi } from '../../api/attachmentApi';
import CommentThread from './CommentThread';
import IssueForm from './IssueForm';

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

  if (!issue) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => onClose(false)}>
      <div
        className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs text-slate-400">{issue.key}</span>
          <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">
            Delete issue
          </button>
        </div>

        <IssueForm issue={issue} onSave={handleFieldSave} onStatusChange={handleStatusChange} />

        {subtasks.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Subtasks ({subtasks.length})</h4>
            <ul className="space-y-1">
              {subtasks.map((st) => (
                <li key={st._id} className="text-sm text-slate-600">
                  {st.key} — {st.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 border-b flex gap-4 text-sm">
          {['comments', 'attachments', 'activity'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t === 'activity') loadActivity();
              }}
              className={`pb-2 capitalize ${tab === t ? 'border-b-2 border-indigo-600 font-medium' : 'text-slate-500'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'comments' && <CommentThread issueId={issueId} comments={comments} onChange={setComments} />}

        {tab === 'attachments' && (
          <AttachmentPanel issueId={issueId} attachments={attachments} onChange={setAttachments} />
        )}

        {tab === 'activity' && (
          <ul className="mt-4 space-y-2 text-sm">
            {activity.map((a) => (
              <li key={a._id} className="text-slate-600">
                <span className="font-medium">{a.actorId?.name}</span> changed <span className="font-mono">{a.field}</span>{' '}
                from <em>{String(a.fromValue)}</em> to <em>{String(a.toValue)}</em>
                <span className="text-xs text-slate-400 ml-2">{new Date(a.createdAt).toLocaleString()}</span>
              </li>
            ))}
            {activity.length === 0 && <li className="text-slate-400">No activity yet.</li>}
          </ul>
        )}

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
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
      <input type="file" onChange={handleUpload} className="text-sm mb-3" />
      <ul className="space-y-2">
        {attachments.map((a) => (
          <li key={a._id} className="flex items-center justify-between text-sm border rounded p-2">
            <button onClick={() => handleOpen(a)} className="text-indigo-600 hover:underline text-left">
              {a.originalName}
            </button>
            <button onClick={() => handleRemove(a._id)} className="text-red-500 text-xs hover:underline">
              Remove
            </button>
          </li>
        ))}
        {attachments.length === 0 && <li className="text-slate-400 text-sm">No attachments yet.</li>}
      </ul>
    </div>
  );
}
