"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  hover = true,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        hover ? "card" : "card-static",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
