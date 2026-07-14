import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { projectApi } from '../../api/projectApi';
import { Button } from '../ui/button';
import { cn, fieldClass, getInitials } from '../../lib/utils';

const ROLES = ['admin', 'manager', 'developer', 'tester'];

const ROLE_COLORS = {
  admin: 'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  developer: 'bg-emerald-100 text-emerald-700',
  tester: 'bg-amber-100 text-amber-700',
};

export default function ProjectMembers({ projectId }) {
  const [members, setMembers] = useState([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('developer');
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = async () => setMembers(await projectApi.listMembers(projectId));

  useEffect(() => {
    load();
  }, [projectId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    setAdding(true);
    try {
      // NOTE: no user-lookup-by-email endpoint exists yet, so this expects a raw user id.
      await projectApi.addMember(projectId, userId, role);
      setUserId('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    await projectApi.addMember(projectId, targetUserId, newRole); // upsert — same endpoint updates role
    load();
  };

  const handleRemove = async (targetUserId) => {
    if (!confirm('Remove this member from the project?')) return;
    await projectApi.removeMember(projectId, targetUserId);
    load();
  };

  return (
    <div className="max-w-xl">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-800">
        <Users className="size-4 text-slate-400" />
        Team Members
      </h3>

      <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl mb-4 bg-white shadow-sm overflow-hidden">
        {members.filter((m) => m.userId).map((m, i) => (
          <li
            key={m._id}
            style={{ animationDelay: `${i * 30}ms` }}
            className="flex items-center justify-between p-3 text-sm hover:bg-slate-50 transition-colors animate-slide-up"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center shrink-0">
                {getInitials(m.userId.name)}
              </div>
              <div>
                <div className="font-medium text-slate-800">{m.userId.name}</div>
                <div className="text-slate-400 text-xs">{m.userId.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={m.role}
                onChange={(e) => handleRoleChange(m.userId._id, e.target.value)}
                className={cn('text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer', ROLE_COLORS[m.role])}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleRemove(m.userId._id)}
                className="text-slate-400 hover:text-red-500 transition-colors duration-150"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
        {members.length === 0 && <li className="p-4 text-sm text-slate-400 text-center">No members yet.</li>}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID"
          className={cn('flex-1 px-3 py-2 text-sm', fieldClass)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className={cn('px-2 py-2 text-sm cursor-pointer', fieldClass)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Button type="submit" loading={adding}>
          {!adding && <UserPlus className="size-4" />}
          Add
        </Button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2 animate-slide-down">{error}</p>}
    </div>
  );
}
