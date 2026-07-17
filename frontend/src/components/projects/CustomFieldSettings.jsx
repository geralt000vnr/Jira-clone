import { useState, useEffect } from 'react';
import { SlidersHorizontal, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { customFieldApi } from '../../api/customFieldApi';
import { Button } from '../ui/button';
import { cn, fieldClass } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const TYPES = ['text', 'number', 'date', 'checkbox', 'select'];

export default function CustomFieldSettings({ projectId }) {
  const [fields, setFields] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState('');
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const load = () => customFieldApi.list(projectId).then(setFields);

  useEffect(() => {
    load();
  }, [projectId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    setAdding(true);
    try {
      const parsedOptions =
        type === 'select'
          ? options
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : [];
      await customFieldApi.create(projectId, { name, type, options: parsedOptions });
      setName('');
      setOptions('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add field');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    if (!(await confirm('Delete this custom field? Values already set on issues will no longer be shown.', { confirmLabel: 'Delete' })))
      return;
    try {
      await customFieldApi.remove(projectId, id);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete field');
    }
  };

  const handleReorder = async (field, direction) => {
    const sorted = [...fields].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((f) => f._id === field._id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const other = sorted[swapIndex];
    await Promise.all([
      customFieldApi.update(projectId, field._id, { order: other.order }),
      customFieldApi.update(projectId, other._id, { order: field.order }),
    ]);
    load();
  };

  const sorted = [...fields].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-xl">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
        <SlidersHorizontal className="size-4 text-slate-400 dark:text-slate-500" />
        Custom Fields
      </h3>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {sorted.map((f, i) => (
          <li key={f._id} className="flex items-center justify-between p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
            <div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{f.name}</div>
              <div className="text-slate-400 dark:text-slate-500 text-xs capitalize">
                {f.type}
                {f.type === 'select' && f.options.length > 0 && ` — ${f.options.join(', ')}`}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleReorder(f, -1)}
                disabled={i === 0}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                onClick={() => handleReorder(f, 1)}
                disabled={i === sorted.length - 1}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronDown className="size-4" />
              </button>
              <button
                onClick={() => handleRemove(f._id)}
                className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors duration-150 ml-1"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
        {sorted.length === 0 && <li className="p-4 text-sm text-slate-400 dark:text-slate-500 text-center">No custom fields yet.</li>}
      </ul>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Field name (e.g. Component)"
          className={cn('flex-1 px-3 py-2 text-sm min-w-[160px]', fieldClass)}
          required
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className={cn('px-2 py-2 text-sm cursor-pointer', fieldClass)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {type === 'select' && (
          <input
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Options, comma-separated"
            className={cn('flex-1 px-3 py-2 text-sm min-w-[160px] animate-slide-down', fieldClass)}
            required
          />
        )}
        <Button type="submit" loading={adding}>
          {!adding && <Plus className="size-4" />}
          Add
        </Button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2 animate-slide-down">{error}</p>}
    </div>
  );
}
