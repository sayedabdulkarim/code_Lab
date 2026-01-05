import { Toast, ToastContainer } from 'ui_zenkit';
import { useToastStore } from '../store';

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <ToastContainer position="bottom-right">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          type={toast.type}
          duration={toast.duration}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </ToastContainer>
  );
}
