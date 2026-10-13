"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-[#E2E8F0] border-y border-[#E2E8F0]", className)}>{children}</div>;
}

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="py-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left font-semibold text-[#0F172A] hover:text-[#16A34A] transition-colors gap-4"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-[#64748B] shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-[#16A34A]"
          )}
        />
      </button>
      {isOpen && (
        <div className="mt-2.5 text-sm leading-relaxed text-[#64748B]">
          {children}
        </div>
      )}
    </div>
  );
}
