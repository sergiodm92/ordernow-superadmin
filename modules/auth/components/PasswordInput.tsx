"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { InputProps } from "@ui/index";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends InputProps {
  error?: string;
  register: any;
  name?: string;
  className?: string;
}

export const PasswordInput = ({ error, register, name = "password", className }: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={name}
          type={showPassword ? "text" : "password"}
          placeholder={name === "passwordRepeat" ? "Confirmar contraseña" : "Tu contraseña"}
          {...register(name)}
          className={cn(
            "w-full pl-10 pr-10 py-3 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
            className
          )}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 z-20"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
          ) : (
            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
