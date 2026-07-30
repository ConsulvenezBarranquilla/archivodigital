"use client";

import Link from "next/link";
import { useState } from "react";

import NavigationDropdown from "./NavigationDropdown";

import {
  NavigationItem as NavigationItemType,
} from "@/lib/navigation";

interface NavigationItemProps {
  item: NavigationItemType;
  activePath: string;
}
export default function NavigationItem({
  item,
  activePath,
}: NavigationItemProps) {

  const [open, setOpen] =
    useState(false);
      const active =
  item.href === activePath ||
  Boolean(
    item.children?.some(
      (child) => child.href === activePath
    )
  );
      if (!item.children) {

    return (

      <Link
        href={item.href ?? "#"}
        className={`
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

        {item.label}

      </Link>

    );

  }
  return (

  <div
    className="relative"
    onMouseEnter={() => setOpen(true)}
    onMouseLeave={() => setOpen(false)}
  >

    <NavigationDropdown
      label={item.label}
      items={item.children}
      open={open}
      active={active}
    />

  </div>

);
}