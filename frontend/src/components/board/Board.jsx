import { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import BoardColumn from './BoardColumn';
import { issueApi } from '../../api/issueApi';
import { useSocket } from '../../context/SocketContext';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export default function Board({ projectId, filters = {}, onIssueClick }) {
  const [issuesByStatus, setIssuesByStatus] = useState({ todo: [], in_progress: [], done: [] });
  const socket = useSocket();

  const loadIssues = useCallback(async () => {
    const issues = await issueApi.list({ projectId, ...filters });
    const grouped = { todo: [], in_progress: [], done: [] };
    issues.forEach((issue) => grouped[issue.status].push(issue));
    setIssuesByStatus(grouped);
  }, [projectId, JSON.stringify(filters)]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Real-time: refresh when someone else moves/edits a card on this board
  useEffect(() => {
    if (!socket) return;
    socket.emit('board:join', projectId);
    socket.on('issue:updated', loadIssues);
    return () => {
      socket.emit('board:leave', projectId);
      socket.off('issue:updated', loadIssues);
    };
  }, [socket, projectId, loadIssues]);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const fromStatus = source.droppableId;
    const toStatus = destination.droppableId;
    const movedIssue = issuesByStatus[fromStatus].find((i) => i._id === draggableId);
    if (!movedIssue) return;

    // Optimistic UI update
    setIssuesByStatus((prev) => {
      const next = { ...prev };
      next[fromStatus] = prev[fromStatus].filter((i) => i._id !== draggableId);
      next[toStatus] = [...prev[toStatus]];
      next[toStatus].splice(destination.index, 0, { ...movedIssue, status: toStatus });
      return next;
    });

    try {
      await issueApi.move(draggableId, {
        toStatus,
        toPosition: destination.index,
        fromStatus,
        expectedVersion: movedIssue.version,
      });
    } catch (err) {
      if (err.response?.status === 409) {
        alert('This issue was updated by someone else. Refreshing the board.');
      }
      loadIssues(); // reconcile with server truth on any failure
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto">
        {COLUMNS.map((col) => (
          <BoardColumn
            key={col.id}
            column={col}
            issues={issuesByStatus[col.id]}
            onIssueClick={onIssueClick}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
