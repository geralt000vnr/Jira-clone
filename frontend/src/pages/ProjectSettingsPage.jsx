import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProjectMembers from '../components/projects/ProjectMembers';
import WorkflowSettings from '../components/projects/WorkflowSettings';
import CustomFieldSettings from '../components/projects/CustomFieldSettings';
import AutomationRuleSettings from '../components/projects/AutomationRuleSettings';

export default function ProjectSettingsPage() {
  const { projectId } = useParams();
  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in space-y-8">
      <div>
        <Link
          to={`/projects/${projectId}/board`}
          className="flex items-center gap-1 w-fit text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors duration-150"
        >
          <ArrowLeft className="size-3.5" />
          Back to board
        </Link>
        <h2 className="text-xl font-semibold mb-5 mt-3 text-slate-900 dark:text-slate-100">Project Settings</h2>
      </div>
      <ProjectMembers projectId={projectId} />
      <WorkflowSettings projectId={projectId} />
      <CustomFieldSettings projectId={projectId} />
      <AutomationRuleSettings projectId={projectId} />
    </div>
  );
}
