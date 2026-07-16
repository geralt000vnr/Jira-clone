import { useState, useMemo } from 'react';

export default function useIssueFilters() {
  const [statusId, setStatusId] = useState('');
  const [priority, setPriority] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [q, setQ] = useState('');

  // Only include non-empty values so we don't send statusId=&priority= etc. to the API
  const filters = useMemo(() => {
    const f = {};
    if (statusId) f.statusId = statusId;
    if (priority) f.priority = priority;
    if (assigneeId) f.assigneeId = assigneeId;
    if (q) f.q = q;
    return f;
  }, [statusId, priority, assigneeId, q]);

  const applyFilters = (saved = {}) => {
    setStatusId(saved.statusId || '');
    setPriority(saved.priority || '');
    setAssigneeId(saved.assigneeId || '');
    setQ(saved.q || '');
  };

  return {
    statusId,
    setStatusId,
    priority,
    setPriority,
    assigneeId,
    setAssigneeId,
    q,
    setQ,
    filters,
    applyFilters,
  };
}
