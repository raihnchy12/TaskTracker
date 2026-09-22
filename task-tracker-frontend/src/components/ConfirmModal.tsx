// src/components/ConfirmModal.tsx

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  isDanger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className={`material-symbols-outlined modal-icon ${isDanger ? 'danger-icon' : ''}`}>
            {isDanger ? 'warning' : 'help_outline'}
          </span>
          <h3>{title}</h3>
        </div>

        <p className="modal-body">{message}</p>

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={isDanger ? 'btn-danger btn-small' : 'btn-gradient btn-small'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}