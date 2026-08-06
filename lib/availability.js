export function getCategoryState(category, now) {
  const from = category.availableFrom ? new Date(category.availableFrom) : null;
  const until = category.availableUntil ? new Date(category.availableUntil) : null;

  if (from && now < from.getTime()) return { state: 'locked', opensAt: from };
  if (until && now > until.getTime()) return { state: 'closed', closesAt: until };
  return { state: 'open' };
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const fmtTime = (d) =>
  d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

export function formatAvailabilityLine(category, now) {
  const { state, opensAt, closesAt } = getCategoryState(category, now);
  if (state === 'locked') return { title: 'Öffnet gleich', detail: `in ${formatCountdown(opensAt.getTime() - now)}` };
  if (state === 'closed') return { title: 'Heute geschlossen', detail: closesAt ? `ab ${fmtTime(closesAt)} Uhr` : '' };
  return null;
}

export function formatSchedule(from, until) {
  const fmt = (iso) =>
    new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  if (from && until) return `Frei: ${fmt(from)} – ${fmt(until)}`;
  if (from) return `Frei ab: ${fmt(from)}`;
  if (until) return `Frei bis: ${fmt(until)}`;
  return 'Immer verfügbar';
}
