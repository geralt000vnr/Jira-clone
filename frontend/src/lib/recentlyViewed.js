const KEY = 'recentlyViewedIssues';
const MAX = 8;

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(issue) {
  const existing = getRecentlyViewed().filter((i) => i._id !== issue._id);
  const next = [
    { _id: issue._id, key: issue.key, title: issue.title, projectId: issue.projectId },
    ...existing,
  ].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
}
