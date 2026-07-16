import { useState, useEffect } from 'react';
import { Workflow, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { workflowStatusApi } from '../../api/workflowStatusApi';
import { Button } from '../ui/button';
import { cn, fieldClass, STATUS_DOT_CLASS } from '../../lib/utils';

const CATEGORIES = ['todo', 'in_progress', 'done'];
const COLORS = ['slate', 'blue', 'emerald', 'amber', 'violet', 'rose'];

export default function WorkflowSettings({ projectId }) {
  const [statuses, setStatuses] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('todo');
  const [color, setColor] = useState('blue');
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = () => workflowStatusApi.list(projectId).then(setStatuses);

  useEffect(() => {
    load();
  }, [projectId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    setAdding(true);
    try {
      await workflowStatusApi.create(projectId, { name, category, color });
      setName('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add status');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Delete this status? Issues using it must be moved first.')) return;
    try {
      await workflowStatusApi.remove(projectId, id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete status — is it still in use?');
    }
  };

  const handleReorder = async (status, direction) => {
    const sorted = [...statuses].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s._id === status._id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const other = sorted[swapIndex];
    await Promise.all([
      workflowStatusApi.update(projectId, status._id, { order: other.order }),
      workflowStatusApi.update(projectId, other._id, { order: status.order }),
    ]);
    load();
  };

  const sorted = [...statuses].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-xl">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-800">
        <Workflow className="size-4 text-slate-400" />
        Workflow Statuses
      </h3>

      <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl mb-4 bg-white shadow-sm overflow-hidden">
        {sorted.map((s, i) => (
          <li key={s._id} className="flex items-center justify-between p-3 text-sm hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className={cn('size-2.5 rounded-full', STATUS_DOT_CLASS[s.color] || STATUS_DOT_CLASS.slate)} />
              <div>
                <div className="font-medium text-slate-800">{s.name}</div>
                <div className="text-slate-400 text-xs capitalize">{s.category.replace('_', ' ')} category</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleReorder(s, -1)}
                disabled={i === 0}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                onClick={() => handleReorder(s, 1)}
                disabled={i === sorted.length - 1}
                className="text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronDown className="size-4" />
              </button>
              <button
                onClick={() => handleRemove(s._id)}
                className="text-slate-400 hover:text-red-500 transition-colors duration-150 ml-1"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
        {sorted.length === 0 && <li className="p-4 text-sm text-slate-400 text-center">No statuses yet.</li>}
      </ul>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Status name (e.g. In Review)"
          className={cn('flex-1 px-3 py-2 text-sm min-w-[160px]', fieldClass)}
          required
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn('px-2 py-2 text-sm cursor-pointer', fieldClass)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select value={color} onChange={(e) => setColor(e.target.value)} className={cn('px-2 py-2 text-sm cursor-pointer', fieldClass)}>
          {COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button type="submit" loading={adding}>
          {!adding && <Plus className="size-4" />}
          Add
        </Button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2 animate-slide-down">{error}</p>}
    </div>
  );
}
