import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../../api/projectApi';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', key: '', description: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = async () => setProjects(await projectApi.list());

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await projectApi.create(form);
      setForm({ name: '', key: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        <button onClick={() => setShowForm((s) => !s)} className="bg-indigo-600 text-white text-sm px-4 py-2 rounded">
          {showForm ? 'Cancel' : 'New Project'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded p-4 mb-4 space-y-3 max-w-md">
          <input
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded p-2 text-sm"
            required
          />
          <input
            placeholder="Key (e.g. ENG)"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
            className="w-full border rounded p-2 text-sm"
            maxLength={10}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded p-2 text-sm"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded">Create</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div
            key={p._id}
            onClick={() => navigate(`/projects/${p._id}/board`)}
            className="border rounded-lg p-4 bg-white hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="text-xs text-slate-400 mb-1">{p.key}</div>
            <div className="font-medium mb-1">{p.name}</div>
            <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>
          </div>
        ))}
        {projects.length === 0 && !showForm && (
          <p className="text-slate-400 text-sm">No projects yet — create your first one.</p>
        )}
      </div>
    </div>
  );
}
