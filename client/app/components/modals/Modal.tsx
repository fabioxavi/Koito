import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

export function Modal({
  isOpen,
  onClose,
  children,
  maxW,
  h
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxW?: number;
  h?: number;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  // Show/hide logic
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 100); // Match fade-out duration
      return () => clearTimeout(timeout);
    }
  }, [isOpen, shouldRender]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape key
      if (e.key === 'Escape') {
        onClose()
      // Trap tab navigation to the modal
      } else if (e.key === 'Tab') {
        if (modalRef.current) {
          const focusableEls = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
          );
          const firstEl = focusableEls[0];
          const lastEl = focusableEls[focusableEls.length - 1];
          const activeEl = document.activeElement

          if (e.shiftKey && activeEl === firstEl) {
            e.preventDefault();
            lastEl.focus();
          } else if (!e.shiftKey && activeEl === lastEl) {
            e.preventDefault();
            firstEl.focus();
          } else if (!Array.from(focusableEls).find(node => node.isEqualNode(activeEl))) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      };
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (modalRef.current && modalRef.current.contains(target)) return;
      // Modals are separate portals, so a click inside a modal stacked on top
      // of this one is not a descendant of this modal's ref. Without this
      // check, that click would be treated as "outside" and close this
      // (lower) modal, which unmounts the stacked modal before its own click
      // handler can run.
      if ((target as HTMLElement).closest?.('[data-modal-content]')) return;
      onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-100 ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
    >
      <div
        ref={modalRef}
        data-modal-content
        className={`bg-(--color-bg-secondary) border border-(--color-bg-tertiary) rounded-2xl shadow-xl shadow-black/30 p-6 w-full relative max-h-3/4 overflow-y-auto transition-all duration-100 ${
          isClosing ? 'animate-fade-out-scale' : 'animate-fade-in-scale'
        }`}
        style={{ maxWidth: maxW ?? 600, height: h ?? '' }}
      >
        {children}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-(--color-fg-tertiary) hover:bg-(--color-bg-tertiary) hover:text-(--color-fg) rounded-lg p-1.5 hover:cursor-pointer transition-colors"
        >
          🞪
        </button>
      </div>
    </div>,
    document.body
  );
}
