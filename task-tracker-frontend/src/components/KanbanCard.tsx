// src/components/KanbanCard.tsx
import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../types';

interface KanbanCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  isOverlay?: boolean;
}

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi',
};

export default function KanbanCard({
  task,
  onEdit,
  onDelete,
  isOverlay = false,
}: KanbanCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
    disabled: isOverlay,
  });

  // Saat menggunakan DragOverlay, kartu asli di kolom tidak boleh menggunakan transform
  // karena akan menggeser posisi DOM asli dan membuat koordinat overlay tidak sinkron.
  const style = isDragging
    ? {
        opacity: 0.25,
      }
    : undefined;

  const formatSafeDate = (rawDate: string | null | undefined) => {
    if (!rawDate) return null;
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime()) || dateObj.getFullYear() > 9999) {
      return null;
    }
    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formattedDueDate = formatSafeDate(task.due_date);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'is-dragging' : ''} ${
        isOverlay ? 'is-overlay' : ''
      }`}
      {...(!isOverlay ? { ...attributes, ...listeners } : {})}
    >
      <div className="kanban-card-header">
        <div className="kanban-drag-handle" title="Tahan & seret untuk memindahkan">
          <span className="material-symbols-outlined">drag_indicator</span>
        </div>
        <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      <div className="kanban-card-title-row">
        <h4 className="kanban-card-title">{task.title}</h4>
      </div>

      {task.description && (
        <div className="kanban-card-desc-wrap">
          <p className={`kanban-card-desc ${expanded ? 'expanded' : ''}`}>
            {task.description}
          </p>
          {task.description.length > 60 && (
            <button
              type="button"
              className="kanban-expand-desc-btn"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
            >
              {expanded ? 'Sembunyikan' : 'Selengkapnya'}
            </button>
          )}
        </div>
      )}

      <div className="kanban-card-footer">
        {formattedDueDate ? (
          <div className="kanban-due-date" title={`Tenggat: ${formattedDueDate}`}>
            <span className="material-symbols-outlined">event</span>
            <span>{formattedDueDate}</span>
          </div>
        ) : (
          <div />
        )}

        {!isOverlay && (
          <div className="kanban-card-actions">
            {onEdit && (
              <button
                type="button"
                className="icon-btn-tiny"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                title="Edit tugas"
                aria-label={`Edit tugas ${task.title}`}
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="icon-btn-tiny danger"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task);
                }}
                title="Hapus tugas"
                aria-label={`Hapus tugas ${task.title}`}
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
