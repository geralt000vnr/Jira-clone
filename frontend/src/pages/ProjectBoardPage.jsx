import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Board from '../components/board/Board';
import FilterBar from '../components/board/FilterBar';
import BacklogPanel from '../components/board/BacklogPanel';
import IssueModal from '../components/issues/IssueModal';
import CreateIssueModal from '../components/issues/CreateIssueModal';
import WorkloadChart from '../components/analytics/WorkloadChart';
import useIssueFilters from '../hooks/useIssueFilters';
import { projectApi } from '../api/projectApi';

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
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-slate-500 hover:underline">
            ← Projects
          </Link>
          <div className="flex gap-4 text-sm">
            {['board', 'backlog', 'analytics'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`capitalize ${tab === t ? 'font-semibold text-indigo-600' : 'text-slate-500'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <Link to={`/projects/${projectId}/settings`} className="text-sm text-slate-500 hover:underline">
          Settings
        </Link>
      </header>

      {tab === 'board' && (
        <>
          <div className="flex items-center justify-between px-4 pt-4">
            <FilterBar filtersState={filtersState} members={members} />
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded whitespace-nowrap"
            >
              New Issue
            </button>
          </div>
          <Board key={refreshKey} projectId={projectId} filters={filtersState.filters} onIssueClick={setOpenIssueId} />
        </>
      )}

      {tab === 'backlog' && <BacklogPanel projectId={projectId} />}

      {tab === 'analytics' && (
        <div className="p-4">
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
