import { LogOut, KanbanSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProjectList from '../components/projects/ProjectList';
import { getInitials } from '../lib/utils';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <KanbanSquare className="size-4" />
          </div>
          <span className="font-semibold text-slate-800">Jira Clone</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center">
              {getInitials(user?.name)}
            </div>
            <span className="text-slate-600">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors duration-150"
          >
            <LogOut className="size-3.5" />
            Log out
          </button>
        </div>
      </header>
      <main className="p-6 max-w-6xl mx-auto">
        <ProjectList />
      </main>
    </div>
  );
}
