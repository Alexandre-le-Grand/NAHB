import React, { ButtonHTMLAttributes, FC } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const Button: FC<ButtonProps> = ({ children, variant = "primary", ...props }) => {
  const baseStyle =
    "w-full py-3 rounded-2xl text-lg shadow-md font-semibold transition-colors duration-200";

  const styles =
    variant === "primary"
      ? `${baseStyle} bg-blue-500 text-white hover:bg-blue-600`
      : `${baseStyle} bg-gray-200 text-gray-800 hover:bg-gray-300`;

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
};
