"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { NavigationChild } from "@/lib/navigation";

interface NavigationDropdownProps {
  label: string;
  items: NavigationChild[];
  open: boolean;
  active?: boolean;
}
export default function NavigationDropdown({
  label,
  items,
  open,
  active = false,
}: NavigationDropdownProps) {
  return (
    <div
      className="relative"
    >
         <button
        className={`
          flex
          items-center
          gap-1
          px-4
          py-2
          rounded-lg
          text-base
          font-medium
          transition-colors
          ${
            active
    ? "bg-blue-950 text-white"
    : "bg-blue-950 text-white hover:bg-blue-900"
          }
        `}
      >
        {label}

        <ChevronDown
          size={18}
          className={`
            transition-transform
            duration-200
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>
            {open && (

        <div
          className="
            absolute
            top-full
            left-0
            w-80
            bg-blue-900
            rounded-xl
            border
            border-blue-800
            shadow-xl
            overflow-hidden
            z-50
            animate-in
            fade-in
            zoom-in-95
            duration-150
          "
        >
                      {items.map((item) => (
                                    item.disabled ? (

              <div
                key={item.label}
                className="
    flex
    items-center
    justify-between
    px-4
    py-3
    bg-blue-900
    hover:bg-blue-800
    transition-colors
    border-b
    border-blue-600
    last:border-b-0
"
              >

                <span className="font-medium text-white">
                  {item.label}
                </span>

                <span
                  className="
                    text-xs
                    bg-blue-200
                    text-blue-900
                    rounded-full
                    px-2
                    py-0.5
                  "
                >
                  Próximamente
                </span>

              </div>

            ) : (
                              <Link
                key={item.label}
                href={item.href ?? "#"}
                className="
                  flex
                  items-center
                  justify-between
                  px-4
                  py-3
                  hover:bg-blue-800
                  transition-colors
                  border-b
                  border-blue-600
                  last:border-b-0
                "
              >

                <span
                  className="
                    font-medium
                    text-white
                  "
                >
                  {item.label}
                </span>

              </Link>
                          )

          ))}

        </div>

      )}

    </div>

  );

}