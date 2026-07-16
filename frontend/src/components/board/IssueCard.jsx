import { Draggable } from '@hello-pangea/dnd';
import { ChevronsUp, ChevronUp, Equal, ChevronDown, ChevronsDown, Bug, BookOpen, CheckSquare, Layers, ListTodo } from 'lucide-react';
import { Badge } from '../ui/badge';
import { getInitials } from '../../lib/utils';

const PRIORITY_STYLES = {
  highest: { className: 'bg-red-50 text-red-600', Icon: ChevronsUp },
  high: { className: 'bg-orange-50 text-orange-600', Icon: ChevronUp },
  medium: { className: 'bg-yellow-50 text-yellow-700', Icon: Equal },
  low: { className: 'bg-blue-50 text-blue-600', Icon: ChevronDown },
  lowest: { className: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400', Icon: ChevronsDown },
};

const TYPE_ICONS = {
  bug: { Icon: Bug, className: 'text-red-500' },
  story: { Icon: BookOpen, className: 'text-emerald-500' },
  task: { Icon: CheckSquare, className: 'text-blue-500' },
  epic: { Icon: Layers, className: 'text-violet-500' },
  subtask: { Icon: ListTodo, className: 'text-slate-400 dark:text-slate-500' },
};

export default function IssueCard({ issue, index, onIssueClick, members = [] }) {
  const priority = PRIORITY_STYLES[issue.priority] || PRIORITY_STYLES.medium;
  const type = TYPE_ICONS[issue.type] || TYPE_ICONS.task;
  const assignee = members.find((m) => m.userId?._id === issue.assigneeId)?.userId;

  return (
    <Draggable draggableId={issue._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onIssueClick?.(issue._id)}
          className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 cursor-grab active:cursor-grabbing
            transition-all duration-150 ease-out
            ${
              snapshot.isDragging
                ? 'shadow-lg rotate-2 scale-[1.03] border-indigo-300'
                : 'shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5'
            }`}
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-1.5">
            <type.Icon className={`size-3.5 ${type.className}`} />
            {issue.key}
          </div>
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2.5 leading-snug">{issue.title}</div>
          <div className="flex items-center justify-between">
            <Badge className={`gap-0.5 ${priority.className}`}>
              <priority.Icon className="size-3" />
              {issue.priority}
            </Badge>
            {assignee && (
              <div
                title={assignee.name}
                className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] font-medium flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm"
              >
                {getInitials(assignee.name)}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
