import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Settings, Plus, LayoutGrid, ListTodo, BarChart3 } from 'lucide-react';
import Board from '../components/board/Board';
import FilterBar from '../components/board/FilterBar';
import BacklogPanel from '../components/board/BacklogPanel';
import IssueModal from '../components/issues/IssueModal';
import CreateIssueModal from '../components/issues/CreateIssueModal';
import WorkloadChart from '../components/analytics/WorkloadChart';
import useIssueFilters from '../hooks/useIssueFilters';
import { projectApi } from '../api/projectApi';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const TABS = [
  { id: 'board', label: 'Board', Icon: LayoutGrid },
  { id: 'backlog', label: 'Backlog', Icon: ListTodo },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
];

export default function ProjectBoardPage() {
  const { projectId } = useParams();
  const [tab, setTab] = useState('board'); // 'board' | 'backlog' | 'analytics'
  const [openIssueId, setOpenIssueId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [members, setMembers] = useState([]);
  const filtersState = useIssueFilters();

  useEffect(() => {
    projectApi.listMembers(projectId).then(setMembers);
  }, [projectId]);

  const handleCloseModal = (shouldRefresh) => {
    setOpenIssueId(null);
    if (shouldRefresh) setRefreshKey((k) => k + 1);
  };

  return (
    <div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors duration-150"
          >
            <ArrowLeft className="size-3.5" />
            Projects
          </Link>
          <div className="flex gap-1 text-sm">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150',
                  tab === id ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <Link
          to={`/projects/${projectId}/settings`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors duration-150"
        >
          <Settings className="size-3.5" />
          Settings
        </Link>
      </header>

      {tab === 'board' && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between px-4 pt-4 gap-3">
            <FilterBar filtersState={filtersState} members={members} />
            <Button onClick={() => setShowCreate(true)} className="whitespace-nowrap">
              <Plus className="size-4" />
              New Issue
            </Button>
          </div>
          <Board
            key={refreshKey}
            projectId={projectId}
            filters={filtersState.filters}
            onIssueClick={setOpenIssueId}
            members={members}
          />
        </div>
      )}

      {tab === 'backlog' && <BacklogPanel projectId={projectId} />}

      {tab === 'analytics' && (
        <div className="p-4 animate-fade-in">
          <WorkloadChart projectId={projectId} />
        </div>
      )}

      {openIssueId && <IssueModal issueId={openIssueId} onClose={handleCloseModal} />}
      {showCreate && (
        <CreateIssueModal
          projectId={projectId}
          onClose={(shouldRefresh) => {
            setShowCreate(false);
            if (shouldRefresh) setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
