import { Droppable } from '@hello-pangea/dnd';
import IssueCard from './IssueCard';

export default function BoardColumn({ column, issues, onIssueClick }) {
  return (
    <div className="flex-1 min-w-[280px] bg-slate-50 rounded-lg p-3">
      <h3 className="font-semibold text-sm text-slate-600 mb-3 flex items-center justify-between">
        {column.title}
        <span className="text-xs bg-slate-200 rounded-full px-2 py-0.5">{issues.length}</span>
      </h3>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] space-y-2 rounded-md transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {issues.map((issue, index) => (
              <IssueCard key={issue._id} issue={issue} index={index} onIssueClick={onIssueClick} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
