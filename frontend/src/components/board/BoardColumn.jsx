import { Droppable } from '@hello-pangea/dnd';
import IssueCard from './IssueCard';
import { cn, STATUS_DOT_CLASS } from '../../lib/utils';

export default function BoardColumn({ status, issues, onIssueClick, members }) {
  return (
    <div className="flex-1 min-w-[280px] bg-slate-50/70 rounded-xl p-3">
      <h3 className="font-semibold text-sm text-slate-600 mb-3 flex items-center gap-2 px-1">
        <span className={cn('size-2 rounded-full', STATUS_DOT_CLASS[status.color] || STATUS_DOT_CLASS.slate)} />
        {status.name}
        <span className="ml-auto text-xs text-slate-500 bg-slate-200/80 rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
          {issues.length}
        </span>
      </h3>
      <Droppable droppableId={status._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'min-h-[200px] space-y-2 rounded-lg transition-colors duration-150 p-1 -m-1',
              snapshot.isDraggingOver && 'bg-indigo-50/70 ring-1 ring-indigo-200'
            )}
          >
            {issues.map((issue, index) => (
              <IssueCard key={issue._id} issue={issue} index={index} onIssueClick={onIssueClick} members={members} />
            ))}
            {provided.placeholder}
            {issues.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-xs text-slate-300 text-center py-6 select-none">No issues</div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
