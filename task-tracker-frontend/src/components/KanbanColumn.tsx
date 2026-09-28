// src/components/KanbanColumn.tsx
import { useDroppable } from '@dnd-kit/core';
import type { Task } from '../types';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  status: Task['status'];
  label: string;
  dotClass: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onAddTaskToStatus?: (status: Task['status']) => void;
}

export default function KanbanColumn({
  status,
  label,
  dotClass,
  tasks,
  onEditTask,
  onDeleteTask,
  onAddTaskToStatus,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column kanban-col-${status.toLowerCase().replace('_', '-')} ${
        isOver ? 'column-droppable-active' : ''
      }`}
    >
      <div className="kanban-column-header">
        <div className="kanban-col-title-group">
          <span className={`status-dot ${dotClass}`} aria-hidden="true" />
          <h3 className="kanban-col-title">{label}</h3>
          <span className="kanban-col-counter">{tasks.length}</span>
        </div>

        {onAddTaskToStatus && (
          <button
            type="button"
            className="kanban-add-column-btn"
            onClick={() => onAddTaskToStatus(status)}
            title={`Tambah tugas ke ${label}`}
            aria-label={`Tambah tugas ke ${label}`}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        )}
      </div>

      <div className="kanban-cards-container">
        {tasks.length === 0 ? (
          <div className="kanban-empty-dropzone">
            <span className="material-symbols-outlined empty-icon">low_priority</span>
            <p>Lepas tugas di sini</p>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
