import { Droppable } from '@hello-pangea/dnd';
import IssueCard from './IssueCard';
import { cn } from '../../lib/utils';

const DOT_COLORS = {
  todo: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  done: 'bg-emerald-500',
};

export default function BoardColumn({ column, issues, onIssueClick, members }) {
  return (
    <div className="flex-1 min-w-[280px] bg-slate-50/70 rounded-xl p-3">
      <h3 className="font-semibold text-sm text-slate-600 mb-3 flex items-center gap-2 px-1">
        <span className={cn('size-2 rounded-full', DOT_COLORS[column.id])} />
        {column.title}
        <span className="ml-auto text-xs text-slate-500 bg-slate-200/80 rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
          {issues.length}
        </span>
      </h3>
      <Droppable droppableId={column.id}>
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
