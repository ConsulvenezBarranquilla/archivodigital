"use client";

import React from "react";

interface ButtonProps {

  children: React.ReactNode;

  onClick?: () => void;

  type?:
    | "button"
    | "submit"
    | "reset";

  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";

  disabled?: boolean;

  icon?: React.ReactNode;

  className?: string;

}

export default function Button({

  children,

  onClick,

  type = "button",

  variant = "primary",

  disabled = false,

  icon,

  className = "",

}: ButtonProps) {

  const variants = {

    primary:

      "bg-blue-600 hover:bg-blue-700 text-white",

    secondary:

      "bg-gray-600 hover:bg-gray-700 text-white",

    success:

      "bg-green-600 hover:bg-green-700 text-white",

    warning:

      "bg-yellow-500 hover:bg-yellow-600 text-white",

    danger:

      "bg-red-600 hover:bg-red-700 text-white",

  };

  return (

    <button

      type={type}

      onClick={onClick}

      disabled={disabled}

      className={`

        inline-flex

        items-center

        gap-2

        px-4

        py-2

        rounded-lg

        font-medium

        transition-all

        duration-200

        disabled:opacity-50

        disabled:cursor-not-allowed

        ${variants[variant]}

        ${className}

      `}

    >      {icon && (

        <span

          className="

            flex

            items-center

            justify-center

          "

        >

          {icon}

        </span>

      )}

      <span>

        {children}

      </span>

    </button>

  );

}