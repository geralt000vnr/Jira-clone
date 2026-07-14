import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProjectMembers from '../components/projects/ProjectMembers';

export default function ProjectSettingsPage() {
  const { projectId } = useParams();
  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <Link
        to={`/projects/${projectId}/board`}
        className="flex items-center gap-1 w-fit text-sm text-slate-500 hover:text-slate-800 transition-colors duration-150"
      >
        <ArrowLeft className="size-3.5" />
        Back to board
      </Link>
      <h2 className="text-xl font-semibold mb-5 mt-3 text-slate-900">Project Settings</h2>
      <ProjectMembers projectId={projectId} />
    </div>
  );
}
