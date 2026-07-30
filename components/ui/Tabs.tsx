"use client";

import React from "react";

export interface TabItem {

  id: string;

  label: string;

  badge?: number;

}

interface TabsProps {

  tabs: TabItem[];

  value: string;

  onChange: (id: string) => void;

}

export default function Tabs({

  tabs,

  value,

  onChange,

}: TabsProps) {

  return (

    <div

      className="

        flex

        gap-2

        border-b

        border-gray-200

        mb-5

      "

    >

      {tabs.map((tab) => (

        <button

          key={tab.id}

          onClick={() => onChange(tab.id)}

          className={`

            flex

            items-center

            gap-2

            px-4

            py-3

            font-bold

            transition-all

            border-b-2

            ${

              value === tab.id

                ? "border-blue-600 text-blue-600"

                : "border-transparent text-gray-500 hover:text-blue-600"

            }

          `}

        >

          <span>

            {tab.label}

          </span>

          {tab.badge !== undefined && (

            <span

              className="

                rounded-full

                bg-gray-200

                px-2

                py-0.5

                text-lg

              "

            >

              {tab.badge}

            </span>

          )}

        </button>

      ))}

    </div>

  );

}