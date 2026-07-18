import { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import BoardColumn from './BoardColumn';
import { issueApi } from '../../api/issueApi';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';

export default function Board({ projectId, filters = {}, onIssueClick, members = [], statuses = [] }) {
  const [issuesByStatus, setIssuesByStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { showToast } = useToast();

  const loadIssues = useCallback(async () => {
    const issues = await issueApi.list({ projectId, ...filters });
    const grouped = {};
    for (const s of statuses) grouped[s._id] = [];
    issues.forEach((issue) => {
      if (grouped[issue.statusId]) grouped[issue.statusId].push(issue);
    });
    setIssuesByStatus(grouped);
    setLoading(false);
  }, [projectId, JSON.stringify(filters), statuses]);

  useEffect(() => {
    if (statuses.length) loadIssues();
  }, [loadIssues, statuses.length]);

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

    const fromStatusId = source.droppableId;
    const toStatusId = destination.droppableId;
    const movedIssue = issuesByStatus[fromStatusId].find((i) => i._id === draggableId);
    if (!movedIssue) return;

    // Optimistic UI update
    setIssuesByStatus((prev) => {
      const next = { ...prev };
      next[fromStatusId] = prev[fromStatusId].filter((i) => i._id !== draggableId);
      next[toStatusId] = [...prev[toStatusId]];
      next[toStatusId].splice(destination.index, 0, { ...movedIssue, statusId: toStatusId });
      return next;
    });

    try {
      await issueApi.move(draggableId, {
        toStatusId,
        toPosition: destination.index,
        fromStatusId,
        expectedVersion: movedIssue.version,
      });
    } catch (err) {
      if (err.response?.status === 409) {
        showToast('This issue was updated by someone else. Refreshing the board.');
      } else if (err.response?.status === 400) {
        showToast(err.response?.data?.message || 'This move is not allowed.');
      }
      loadIssues(); // reconcile with server truth on any failure
    }
  };

  if (loading || !statuses.length) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {(statuses.length ? statuses : [0, 1, 2]).map((s, i) => (
          <div key={s._id || i} className="flex-1 min-w-[280px] bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 space-y-2">
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-3" />
            <div className="h-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto animate-fade-in">
        {statuses.map((status) => (
          <BoardColumn
            key={status._id}
            status={status}
            issues={issuesByStatus[status._id] || []}
            onIssueClick={onIssueClick}
            members={members}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
