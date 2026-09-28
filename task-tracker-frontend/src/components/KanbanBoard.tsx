// src/components/KanbanBoard.tsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Task } from '../types';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

interface KanbanBoardProps {
  tasks: Task[];
  onMoveTask: (task: Task, nextStatus: Task['status']) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onAddTaskToStatus?: (status: Task['status']) => void;
}

const COLUMNS: {
  status: Task['status'];
  label: string;
  dotClass: string;
}[] = [
  { status: 'BACKLOG', label: 'Backlog', dotClass: 'dot-backlog' },
  { status: 'TODO', label: 'To Do', dotClass: 'dot-todo' },
  { status: 'IN_PROGRESS', label: 'In Progress', dotClass: 'dot-in-progress' },
  { status: 'REVIEW', label: 'Review', dotClass: 'dot-review' },
  { status: 'DONE', label: 'Done', dotClass: 'dot-done' },
];

export default function KanbanBoard({
  tasks,
  onMoveTask,
  onEditTask,
  onDeleteTask,
  onAddTaskToStatus,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Sensor terpisah untuk mouse kursor dan sentuhan jari
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // Geser mouse 5px untuk mulai drag
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150, // Tahan jari 150ms agar bisa scroll tanpa terseret tidak sengaja
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  // Strategi deteksi tabrakan presisi: utamakan kolom tempat kursor/jari berada
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const taskData = event.active.data.current?.task as Task | undefined;
    if (taskData) {
      setActiveTask(taskData);
      return;
    }

    const taskId = Number(String(event.active.id).replace('task-', ''));
    const found = tasks.find((t) => t.id === taskId);
    if (found) {
      setActiveTask(found);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = Number(String(active.id).replace('task-', ''));
    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) return;

    let targetStatus: Task['status'] | null = null;

    // Cek apakah target drop adalah kolom berstatus valid
    const targetStatusCandidate = String(over.id) as Task['status'];
    const validStatuses: Task['status'][] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

    if (validStatuses.includes(targetStatusCandidate)) {
      targetStatus = targetStatusCandidate;
    } else {
      // Jika di-drop di atas kartu lain di kolom tersebut
      const overTask = tasks.find((t) => `task-${t.id}` === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    // Jika status berubah, picu callback perpindahan
    if (targetStatus && targetStatus !== draggedTask.status) {
      onMoveTask(draggedTask, targetStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board-scroll">
        <div className="kanban-board-grid">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.status);
            return (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                dotClass={col.dotClass}
                tasks={columnTasks}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onAddTaskToStatus={onAddTaskToStatus}
              />
            );
          })}
        </div>
      </div>

      {/* Render DragOverlay di root document.body via Portal agar koordinat cursor 100% presisi dan tidak offset karena scroll/parent */}
      {typeof document !== 'undefined' &&
        createPortal(
          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div style={{ width: 240, pointerEvents: 'none' }}>
                <KanbanCard task={activeTask} isOverlay />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}
