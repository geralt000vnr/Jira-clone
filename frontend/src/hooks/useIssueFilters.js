import { useState, useMemo } from 'react';

export default function useIssueFilters() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [q, setQ] = useState('');

  // Only include non-empty values so we don't send status=&priority= etc. to the API
  const filters = useMemo(() => {
    const f = {};
    if (status) f.status = status;
    if (priority) f.priority = priority;
    if (assigneeId) f.assigneeId = assigneeId;
    if (q) f.q = q;
    return f;
  }, [status, priority, assigneeId, q]);

  return { status, setStatus, priority, setPriority, assigneeId, setAssigneeId, q, setQ, filters };
}
