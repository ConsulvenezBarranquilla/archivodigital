"use client";

interface DashboardGridProps {

  children: React.ReactNode;

}

export default function DashboardGrid({

  children,

}: DashboardGridProps) {

  return (

    <div

      className="

        grid

        grid-cols-1

        sm:grid-cols-2

        xl:grid-cols-4

        gap-5

        mb-6

      "

    >

      {children}

    </div>

  );

}