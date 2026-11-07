export function timeAgo(ms) {
  if (!ms) return '';
  const s = Math.max(1, (Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const days = Math.floor(s / 86400);
  if (days === 1) return 'yesterday';
  return days < 30 ? `${days} days ago` : new Date(ms).toLocaleDateString();
}
