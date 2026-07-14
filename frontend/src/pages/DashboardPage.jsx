import { useAuth } from '../context/AuthContext';
import ProjectList from '../components/projects/ProjectList';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <span className="font-semibold">Jira Clone</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{user?.name}</span>
          <button onClick={logout} className="text-red-500 hover:underline">
            Log out
          </button>
        </div>
      </header>
      <main className="p-6">
        <ProjectList />
      </main>
    </div>
  );
}
