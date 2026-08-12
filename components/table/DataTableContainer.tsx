"use client";

import { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

export default function DataTableContainer({
    children,
}: Props) {

    return (

        <div
            className="
                w-full
                min-w-0
                overflow-x-auto
            "
        >
            {children}
        </div>

    );

}