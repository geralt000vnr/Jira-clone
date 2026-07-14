import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { issueApi } from '../../api/issueApi';
import { Button } from '../ui/button';
import { cn, fieldClass } from '../../lib/utils';

const TYPES = ['task', 'story', 'bug', 'epic', 'subtask'];
const PRIORITIES = ['lowest', 'low', 'medium', 'high', 'highest'];
const selectClass = cn('px-2 py-2 text-sm cursor-pointer', fieldClass);

export default function CreateIssueModal({ projectId, onClose }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('task');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose(false);
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

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
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={() => onClose(false)}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md p-6 space-y-3 shadow-2xl animate-scale-in"
      >
        <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-900">
          <Sparkles className="size-4 text-indigo-500" />
          New Issue
        </h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Issue title"
          className={cn('w-full px-3 py-2 text-sm', fieldClass)}
          autoFocus
          required
        />
        <div className="flex gap-3">
          <label className="flex-1 flex flex-col gap-1 text-sm text-slate-500">
            Type
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 flex flex-col gap-1 text-sm text-slate-500">
            Priority
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="text-red-500 text-xs animate-slide-down">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}
