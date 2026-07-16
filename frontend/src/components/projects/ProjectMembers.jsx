import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { projectApi } from '../../api/projectApi';
import { userApi } from '../../api/userApi';
import { Button } from '../ui/button';
import { cn, fieldClass, getInitials } from '../../lib/utils';
import { useConfirm } from '../../context/ConfirmContext';

const ROLES = ['admin', 'manager', 'developer', 'tester'];

const ROLE_COLORS = {
  admin: 'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700',
  developer: 'bg-emerald-100 text-emerald-700',
  tester: 'bg-amber-100 text-amber-700',
};

export default function ProjectMembers({ projectId }) {
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('developer');
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const confirm = useConfirm();

  const load = async () => setMembers(await projectApi.listMembers(projectId));

  useEffect(() => {
    load();
  }, [projectId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    setAdding(true);
    try {
      const user = await userApi.lookupByEmail(email);
      await projectApi.addMember(projectId, user._id, role);
      setEmail('');
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
    if (!(await confirm('Remove this member from the project?', { confirmLabel: 'Remove' }))) return;
    await projectApi.removeMember(projectId, targetUserId);
    load();
  };

  return (
    <div className="max-w-xl">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
        <Users className="size-4 text-slate-400 dark:text-slate-500" />
        Team Members
      </h3>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {members.filter((m) => m.userId).map((m, i) => (
          <li
            key={m._id}
            style={{ animationDelay: `${i * 30}ms` }}
            className="flex items-center justify-between p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors animate-slide-up"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center shrink-0">
                {getInitials(m.userId.name)}
              </div>
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">{m.userId.name}</div>
                <div className="text-slate-400 dark:text-slate-500 text-xs">{m.userId.email}</div>
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
                className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors duration-150"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
        {members.length === 0 && <li className="p-4 text-sm text-slate-400 dark:text-slate-500 text-center">No members yet.</li>}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Teammate's email"
          className={cn('flex-1 px-3 py-2 text-sm', fieldClass)}
          required
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
