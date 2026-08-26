/**
 * useConfirm — reusable confirmation dialog hook.
 *
 * Usage:
 *   const { confirmDialog, confirm } = useConfirm();
 *   // In JSX: {confirmDialog}
 *   // On action: const ok = await confirm({ title, message, confirmText, danger });
 */
import { AlertTriangle, CircleHelp } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export function useConfirm() {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  function confirm({ title = "Are you sure?", message = "", confirmText, danger = false } = {}) {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ title, message, confirmText, danger });
    });
  }

  function handleResponse(answer) {
    setDialog(null);
    resolveRef.current?.(answer);
    resolveRef.current = null;
  }

  // Always portal to body so backdrop-filter / transform stacking contexts
  // on parent elements can never clip or misplace the modal.
  const confirmDialog = dialog
    ? createPortal(
        <ConfirmModal
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          danger={dialog.danger}
          onConfirm={() => handleResponse(true)}
          onCancel={() => handleResponse(false)}
        />,
        document.body
      )
    : null;

  return { confirm, confirmDialog };
}

/* ── Modal UI ─────────────────────────────────────────────── */
export function ConfirmModal({ title, message, confirmText, danger = false, onConfirm, onCancel }) {
  const defaultText = confirmText || (danger ? "Yes, delete" : "Confirm");

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div className="modal-box" onMouseDown={(e) => e.stopPropagation()}>
        <div className={`modal-icon ${danger ? "modal-icon-danger" : "modal-icon-info"}`}>
          {danger ? <AlertTriangle size={26} /> : <CircleHelp size={26} />}
        </div>
        <h3 className="modal-title">{title}</h3>
        {message && <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel}>Cancel</button>
          <button
            className={`modal-btn-confirm ${danger ? "modal-btn-danger" : "modal-btn-primary"}`}
            onClick={onConfirm}
            autoFocus
          >
            {defaultText}
          </button>
        </div>
      </div>
    </div>
  );
}
