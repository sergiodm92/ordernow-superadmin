import { toast } from "sonner";

const toastConfirm = (callback: () => void, text: string) => {
  toast(text, {
    duration: 0,
    action: {
      label: "Confirmar",
      onClick: () => {
        callback();
        toast.dismiss();
      },
    },
    cancel: {
      label: "Cancelar",
      onClick: () => toast.dismiss(),
    },
  });
};

export default toastConfirm;
