import { Link, useParams } from 'react-router-dom';
import ProjectMembers from '../components/projects/ProjectMembers';

export default function ProjectSettingsPage() {
  const { projectId } = useParams();
  return (
    <div className="p-6">
      <Link to={`/projects/${projectId}/board`} className="text-sm text-slate-500 hover:underline">
        ← Back to board
      </Link>
      <h2 className="text-xl font-semibold mb-4 mt-2">Project Settings</h2>
      <ProjectMembers projectId={projectId} />
    </div>
  );
}
