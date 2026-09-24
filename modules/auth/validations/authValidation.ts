import * as Yup from "yup";

export const loginSchema = Yup.object().shape({
  email: Yup.string().email("Correo inválido").required("El correo es obligatorio"),
  password: Yup.string().min(6, "La contraseña debe tener al menos 6 caracteres").required("La contraseña es obligatoria"),
});

export const changePasswordWith2FASchema = Yup.object().shape({
  currentPassword: Yup.string().required("La contraseña actual es obligatoria"),
  newPassword: Yup.string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, "La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial")
    .required("La nueva contraseña es obligatoria"),
  confirmPassword: Yup.string().oneOf([Yup.ref("newPassword")], "Las contraseñas no coinciden").required("La confirmación de contraseña es obligatoria"),
});

export const verifyChangePasswordCodeSchema = Yup.object().shape({
  code: Yup.string()
    .matches(/^[0-9]{6}$/, "El código debe tener 6 dígitos")
    .required("El código es obligatorio"),
});
