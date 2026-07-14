import { useState } from 'react';
import { issueApi } from '../../api/issueApi';

const TYPES = ['task', 'story', 'bug', 'epic', 'subtask'];
const PRIORITIES = ['lowest', 'low', 'medium', 'high', 'highest'];

export default function CreateIssueModal({ projectId, onClose }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('task');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await issueApi.create({ projectId, title, type, priority });
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create issue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => onClose(false)}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg w-full max-w-md p-6 space-y-3"
      >
        <h3 className="font-semibold text-lg">New Issue</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Issue title"
          className="w-full border rounded p-2 text-sm"
          autoFocus
          required
        />
        <div className="flex gap-3">
          <label className="flex-1 flex flex-col gap-1 text-sm">
            Type
            <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded p-2">
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 flex flex-col gap-1 text-sm">
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border rounded p-2">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => onClose(false)} className="text-sm text-slate-500 px-3 py-2">
            Cancel
          </button>
          <button disabled={saving} className="bg-indigo-600 text-white text-sm px-4 py-2 rounded">
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
