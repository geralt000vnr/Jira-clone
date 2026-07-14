import { useState, useEffect } from 'react';
import { projectApi } from '../../api/projectApi';

const ROLES = ['admin', 'manager', 'developer', 'tester'];

export default function ProjectMembers({ projectId }) {
  const [members, setMembers] = useState([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('developer');
  const [error, setError] = useState(null);

  const load = async () => setMembers(await projectApi.listMembers(projectId));

  useEffect(() => {
    load();
  }, [projectId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // NOTE: no user-lookup-by-email endpoint exists yet, so this expects a raw user id.
      await projectApi.addMember(projectId, userId, role);
      setUserId('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
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
      <h3 className="font-semibold mb-3">Team Members</h3>

      <ul className="divide-y border rounded mb-4">
        {members.map((m) => (
          <li key={m._id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <div className="font-medium">{m.userId.name}</div>
              <div className="text-slate-400 text-xs">{m.userId.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={m.role}
                onChange={(e) => handleRoleChange(m.userId._id, e.target.value)}
                className="border rounded p-1 text-xs"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button onClick={() => handleRemove(m.userId._id)} className="text-red-500 text-xs hover:underline">
                Remove
              </button>
            </div>
          </li>
        ))}
        {members.length === 0 && <li className="p-3 text-sm text-slate-400">No members yet.</li>}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID"
          className="flex-1 border rounded p-2 text-sm"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="border rounded p-2 text-sm">
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button className="bg-indigo-600 text-white text-sm px-4 rounded">Add</button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
