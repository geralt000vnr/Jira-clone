import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, ArrowRight } from 'lucide-react';
import { projectApi } from '../../api/projectApi';
import { Button } from '../ui/button';
import { cn, fieldClass } from '../../lib/utils';

const ACCENTS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-violet-500',
];

function accentFor(key) {
  const sum = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  return ACCENTS[sum % ACCENTS.length];
}

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', key: '', description: '' });
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setProjects(await projectApi.list());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await projectApi.create(form);
      setForm({ name: '', key: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your Projects</h2>
        <Button variant={showForm ? 'secondary' : 'primary'} onClick={() => setShowForm((s) => !s)}>
          {!showForm && <Plus className="size-4" />}
          {showForm ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-5 space-y-3 max-w-md shadow-sm animate-slide-down"
        >
          <input
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={cn('w-full px-3 py-2 text-sm', fieldClass)}
            autoFocus
            required
          />
          <input
            placeholder="Key (e.g. ENG)"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
            className={cn('w-full px-3 py-2 text-sm', fieldClass)}
            maxLength={10}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={cn('w-full px-3 py-2 text-sm resize-none', fieldClass)}
            rows={2}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <Button type="submit" loading={creating}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {projects.map((p, i) => (
            <div
              key={p._id}
              onClick={() => navigate(`/projects/${p._id}/board`)}
              style={{ animationDelay: `${i * 30}ms` }}
              className="group relative overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 cursor-pointer
                shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-600
                transition-all duration-200 animate-slide-up"
            >
              <div className={cn('absolute top-0 left-0 h-1 w-full', accentFor(p.key))} />
              <div className="flex items-start justify-between">
                <div className="text-xs font-medium tracking-wide text-slate-400 dark:text-slate-500 mb-1">{p.key}</div>
                <ArrowRight className="size-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 -translate-x-1 transition-all duration-200" />
              </div>
              <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">{p.name}</div>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{p.description || 'No description'}</p>
            </div>
          ))}
          {projects.length === 0 && !showForm && (
            <div className="col-span-full flex flex-col items-center justify-center text-center py-16 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <FolderKanban className="size-8 mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm">No projects yet — create your first one.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
