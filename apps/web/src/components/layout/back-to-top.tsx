"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SHOW_AFTER = 400;

function getScrollTop(): number {
  const main = document.querySelector("main");
  if (main && main.scrollHeight - main.clientHeight > 4) {
    return main.scrollTop;
  }
  return window.scrollY;
}

function scrollToTop() {
  const behavior: ScrollBehavior = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
    ? "auto"
    : "smooth";
  window.scrollTo({ top: 0, behavior });
  document.querySelector("main")?.scrollTo({ top: 0, behavior });
}

export function BackToTop() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(getScrollTop() > SHOW_AFTER);
    const main = document.querySelector("main");

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    main?.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      main?.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <button
      suppressHydrationWarning
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full",
        "bg-ocean-blue text-white shadow-ocean-lg transition-all duration-300 ease-in-out",
        "hover:bg-ocean-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-blue focus-visible:ring-offset-2",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
