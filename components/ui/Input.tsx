"use client";

import React from "react";

interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange"
  > {

  value: string;

  onChange: (value: string) => void;

  icon?: React.ReactNode;

  uppercase?: boolean;

  inputMode?:
    | "text"
    | "search"
    | "numeric"
    | "decimal"
    | "email";

}

export default function Input({

  value,

  onChange,

  placeholder = "",

  type = "text",

  disabled = false,

  icon,

  uppercase = false,

  inputMode = "text",

  className = "",

  ...props

}: InputProps) {

  function handleChange(

    e: React.ChangeEvent<HTMLInputElement>

  ) {

    let nuevoValor = e.target.value;

    if (inputMode === "numeric") {

      nuevoValor = nuevoValor.replace(

        /\D/g,

        ""

      );

    }

    if (uppercase) {

      nuevoValor = nuevoValor.toUpperCase();

    }

    onChange(nuevoValor);

  }

  return (

    <div

      className={`

        flex

        items-center

        gap-2

        rounded-lg

        border

        border-gray-300

        bg-white

        px-3

        py-2

        transition-all

        focus-within:border-blue-500

        focus-within:ring-2

        focus-within:ring-blue-500

        ${disabled ? "opacity-50" : ""}

        ${className}

      `}

    >

      {icon && (

        <span

          className="

            flex

            items-center

            justify-center

            text-gray-500

          "

        >

          {icon}

        </span>

      )}

      <input

        {...props}

        type={type}

        value={value}

        disabled={disabled}

        placeholder={placeholder}

        inputMode={inputMode}

        onChange={handleChange}

        className="

          flex-1

          bg-transparent

          outline-none

        "

      />

    </div>

  );

}