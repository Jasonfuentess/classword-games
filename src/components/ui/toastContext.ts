import { createContext } from 'react';

export type Tone = 'success' | 'error' | 'info';

export interface ToastContextValue {
  toast: (message: string, tone?: Tone) => void;
}

export const ToastContext = createContext<ToastContextValue>({ toast: () => {} });
