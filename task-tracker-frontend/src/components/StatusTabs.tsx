import type { Task } from '../types';

export type TaskStatus = Task['status'];

const STATUS_CONFIG: { value: TaskStatus; label: string; dotClass: string }[] = [
  { value: 'BACKLOG', label: 'Backlog', dotClass: 'dot-backlog' },
  { value: 'TODO', label: 'To Do', dotClass: 'dot-todo' },
  { value: 'IN_PROGRESS', label: 'In Progress', dotClass: 'dot-in-progress' },
  { value: 'REVIEW', label: 'Review', dotClass: 'dot-review' },
  { value: 'DONE', label: 'Done', dotClass: 'dot-done' },
];

interface StatusTabsProps {
  tasks: Task[];
  active: TaskStatus;
  onChange: (status: TaskStatus) => void;
  // Prop baru untuk menerima jumlah total per status dari server/seluruh data
  totalCounts?: Record<TaskStatus, number>;
}

export default function StatusTabs({ tasks, active, onChange, totalCounts }: StatusTabsProps) {
  return (
    <div className="status-tabs">
      {STATUS_CONFIG.map((s) => {
        // Jika totalCounts dikirim dari parent, gunakan nilainya.
        // Jika tidak ada, fallback ke perhitungan lokal dari array tasks.
        const count = totalCounts ? (totalCounts[s.value] ?? 0) : tasks.filter((t) => t.status === s.value).length;

        return (
          <button
            key={s.value}
            type="button"
            className={`status-tab ${s.value === active ? 'active' : ''}`}
            onClick={() => onChange(s.value)}
          >
            <span className={`status-dot ${s.dotClass}`} aria-hidden="true" />
            <span className="status-tab-label">{s.label}</span>
            <span className="status-tab-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}