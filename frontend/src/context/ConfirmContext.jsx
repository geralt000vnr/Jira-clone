import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { message, confirmLabel, danger }
  const resolveRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ message, confirmLabel: options.confirmLabel || 'Confirm', danger: options.danger ?? true });
    });
  }, []);

  const handleClose = (result) => {
    resolveRef.current?.(result);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-fade-in"
          onClick={() => handleClose(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className={
                  dialog.danger
                    ? 'size-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0'
                    : 'size-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0'
                }
              >
                <AlertTriangle className="size-4.5" />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 pt-1.5">{dialog.message}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                variant={dialog.danger ? 'danger' : 'primary'}
                className={dialog.danger ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm' : ''}
                onClick={() => handleClose(true)}
              >
                {dialog.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext).confirm;
