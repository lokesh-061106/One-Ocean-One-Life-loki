import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  /** Optional badge/chip above the title (page supplies its own styling). */
  badge?: React.ReactNode;
  /** Page title, wrapped in an <h1>. May contain markup. */
  title?: React.ReactNode;
  /** Supporting line under the title. */
  subtitle?: React.ReactNode;
  /** Extra content such as CTA buttons or stat grids. */
  children?: React.ReactNode;
  align?: "center" | "left";
  width?: "default" | "wide";
  /** Extra classes on the <section> (e.g. bespoke vertical padding). */
  className?: string;
  /** Extra classes on the inner container. */
  contentClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  /**
   * Render `children` directly inside the <section> with no inner
   * container, badge/title/subtitle. Use for bespoke, multi-column hero
   * layouts that manage their own grid and padding.
   */
  bare?: boolean;
}

/**
 * Shared top-of-page hero banner.
 *
 * Every public page header uses the same navy → blue gradient so the
 * platform reads as one product. Pass page-specific badge/title/subtitle
 * and any CTA or stat content as children.
 */
export function PageHero({
  badge,
  title,
  subtitle,
  children,
  align = "center",
  width = "default",
  className,
  contentClassName,
  titleClassName,
  subtitleClassName,
  bare = false,
}: PageHeroProps) {
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-ocean-navy to-ocean-blue py-16 text-white sm:py-20",
        className,
      )}
    >
      {bare ? (
        children
      ) : (
        <div
          className={cn(
            "relative mx-auto px-4 sm:px-6 lg:px-8",
            width === "wide" ? "max-w-[1720px] xl:px-10" : "max-w-7xl",
            centered ? "text-center" : "text-left",
            contentClassName,
          )}
        >
          {badge}
          {title !== undefined && title !== null && (
            <h1
              className={cn(
                "text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl",
                centered ? "mb-4" : "mb-3",
                titleClassName,
              )}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              className={cn(
                "text-base font-medium text-ocean-sand sm:text-lg",
                centered ? "mx-auto max-w-2xl" : "max-w-3xl",
                subtitleClassName,
              )}
            >
              {subtitle}
            </p>
          )}
          {children}
        </div>
      )}
    </section>
  );
}
