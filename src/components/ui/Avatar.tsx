"use client";

import { useState } from "react";

interface Props {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const PALETTE = [
  "bg-brand-500",
  "bg-indigo-500",
  "bg-sky-500",
  "bg-fuchsia-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
];

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function hashIdx(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

export function Avatar({ name, src, size = "md", className = "" }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = name
    .replace(/^[ru]\//i, "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const bg = PALETTE[hashIdx(name)];

  if (src && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`inline-block rounded-full object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold ${bg} ${sizes[size]} ${className}`}
    >
      {initials || "?"}
    </div>
  );
}
