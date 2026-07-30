"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import NavigationItem from "./NavigationItem";

import {
  navigation,
  NavigationItem as NavigationItemType,
} from "@/lib/navigation";

import { tienePermiso } from "@/lib/permisos";

interface NavigationProps {
  rol: string;
}

export default function Navigation({ rol }: NavigationProps) {

  const pathname = usePathname();

  const menu = useMemo(() => {

    return navigation
      .map((item) => {

        // Menús sin submenús
        if (!item.children) {

          if (
            item.permiso &&
            !tienePermiso(rol, item.permiso)
          ) {
            return null;
          }

          return item;
        }

        // Filtrar únicamente los hijos

        const children = item.children.filter((child) => {

          if (!child.permiso) {
            return true;
          }

          return tienePermiso(
            rol,
            child.permiso
          );

        });

        // Si no queda ninguno, ocultar el menú

        if (children.length === 0) {
          return null;
        }

        return {
          ...item,
          children,
        };

      })
      .filter(
    (item): item is NavigationItemType =>
        item !== null
);

  }, [rol, navigation]);

  return (

    <nav
      className="
        flex
        flex-wrap
        justify-center
        gap-3
        mb-8
      "
    >

      {menu.map((item) => (

        <NavigationItem
          key={item.label}
          item={item}
          activePath={pathname}
        />

      ))}

    </nav>

  );

}