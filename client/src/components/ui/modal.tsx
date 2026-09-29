"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@utils/cn";

// shared modal on base-ui Dialog (focus trap, esc/backdrop close, aria labels)

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  // max-width class, e.g. "max-w-2xl"
  size?: string;
  // set false to stop closing while something is saving
  dismissible?: boolean;
  bodyClassName?: string;
}

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "max-w-2xl",
  dismissible = true,
  bodyClassName,
}: ModalProps) => (
  <Dialog.Root
    open={open}
    onOpenChange={(next) => {
      if (!next && dismissible) onClose();
    }}
  >
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <Dialog.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-slate-800 dark:bg-slate-900",
          size,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {description}
              </Dialog.Description>
            )}
          </div>
          <Dialog.Close
            disabled={!dismissible}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </Dialog.Close>
        </div>

        <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-5", bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
            {footer}
          </div>
        )}
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
);
