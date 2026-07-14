import { Draggable } from '@hello-pangea/dnd';
import { Badge } from '../ui/badge';

const PRIORITY_COLORS = {
  highest: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
  lowest: 'bg-slate-100 text-slate-600',
};

export default function IssueCard({ issue, index, onIssueClick }) {
  return (
    <Draggable draggableId={issue._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onIssueClick?.(issue._id)}
          className={`bg-white rounded-md shadow-sm border p-3 cursor-grab ${
            snapshot.isDragging ? 'shadow-lg rotate-1' : ''
          }`}
        >
          <div className="text-xs text-slate-400 mb-1">{issue.key}</div>
          <div className="text-sm font-medium mb-2">{issue.title}</div>
          <div className="flex items-center justify-between">
            <Badge className={PRIORITY_COLORS[issue.priority]}>{issue.priority}</Badge>
            {issue.assigneeId && (
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                {issue.assigneeInitials || '?'}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
