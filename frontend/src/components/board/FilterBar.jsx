import { useState, useEffect } from 'react';
import { Search, Bookmark, Save, X } from 'lucide-react';
import { savedFilterApi } from '../../api/savedFilterApi';
import { useAuth } from '../../context/AuthContext';
import { cn, fieldClass } from '../../lib/utils';

const PRIORITIES = ['', 'lowest', 'low', 'medium', 'high', 'highest'];

const selectClass = cn('px-3 py-2 text-sm cursor-pointer', fieldClass);

export default function FilterBar({ filtersState, members = [], statuses = [], projectId }) {
  const { statusId, setStatusId, priority, setPriority, assigneeId, setAssigneeId, q, setQ, filters, applyFilters } =
    filtersState;
  const { user } = useAuth();
  const [savedFilters, setSavedFilters] = useState([]);
  const [selectedFilterId, setSelectedFilterId] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [name, setName] = useState('');
  const [isShared, setIsShared] = useState(false);

  const hasActiveFilters = Object.keys(filters).length > 0;
  const selectedFilter = savedFilters.find((f) => f._id === selectedFilterId);

  useEffect(() => {
    if (projectId) savedFilterApi.list(projectId).then(setSavedFilters);
  }, [projectId]);

  const handleSave = async (e) => {
    e.preventDefault();
    const saved = await savedFilterApi.create(projectId, { name, filters, isShared });
    setSavedFilters([saved, ...savedFilters]);
    setShowSaveForm(false);
    setName('');
    setIsShared(false);
  };

  const handleApply = (id) => {
    setSelectedFilterId(id);
    const saved = savedFilters.find((f) => f._id === id);
    if (saved) applyFilters(saved.filters);
  };

  const handleDelete = async () => {
    await savedFilterApi.remove(selectedFilterId);
    setSavedFilters(savedFilters.filter((f) => f._id !== selectedFilterId));
    setSelectedFilterId('');
  };

  return (
    <div className="flex flex-wrap gap-2 items-center flex-1">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search issues..."
          className={cn('w-full pl-8 pr-3 py-2 text-sm', fieldClass)}
        />
      </div>
      <select value={statusId} onChange={(e) => setStatusId(e.target.value)} className={selectClass}>
        <option value="">All statuses</option>
        {statuses.map((s) => (
          <option key={s._id} value={s._id}>
            {s.name}
          </option>
        ))}
      </select>
      <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p || 'All priorities'}
          </option>
        ))}
      </select>
      <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={selectClass}>
        <option value="">All assignees</option>
        {members
          .filter((m) => m.userId)
          .map((m) => (
            <option key={m.userId._id} value={m.userId._id}>
              {m.userId.name}
            </option>
          ))}
      </select>

      {savedFilters.length > 0 && (
        <div className="flex items-center gap-1">
          <select value={selectedFilterId} onChange={(e) => handleApply(e.target.value)} className={selectClass}>
            <option value="" disabled>
              Saved filters
            </option>
            {savedFilters.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
                {f.isShared ? ' (shared)' : ''}
              </option>
            ))}
          </select>
          {selectedFilter && String(selectedFilter.userId) === String(user?.id) && (
            <button
              onClick={handleDelete}
              title="Delete saved filter"
              className="text-slate-400 hover:text-red-500 transition-colors duration-150 p-1"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {hasActiveFilters && (
        <div className="relative">
          <button
            onClick={() => setShowSaveForm((s) => !s)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline px-1"
          >
            <Bookmark className="size-3.5" />
            Save filter
          </button>
          {showSaveForm && (
            <form
              onSubmit={handleSave}
              className="absolute top-full left-0 mt-2 z-10 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-64 space-y-2 animate-slide-down"
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Filter name"
                className={cn('w-full px-2 py-1.5 text-sm', fieldClass)}
                autoFocus
                required
              />
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} />
                Share with team
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSaveForm(false)} className="text-xs text-slate-500 px-2 py-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors duration-150"
                >
                  <Save className="size-3" />
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
