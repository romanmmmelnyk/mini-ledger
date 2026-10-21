import { Dialog } from '@base-ui/react/dialog';
import type { ReactNode, RefObject } from 'react';
import { Close } from './icons';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
};

export function Modal({ open, onOpenChange, title, description, initialFocus, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup
          className="dialog-popup"
          initialFocus={(openType) => (openType === 'touch' ? true : (initialFocus?.current ?? true))}
        >
          <div className="dialog-head">
            <div>
              <Dialog.Title className="dialog-title">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="dialog-desc">{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close className="icon-btn" aria-label="Close">
              <Close />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
