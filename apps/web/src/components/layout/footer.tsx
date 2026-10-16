"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ExternalLink } from "lucide-react";
import { useNavFilter } from "@/components/layout/nav-data";

const footerLinks = {
  explore: [
    { href: "/guides", label: "Ocean Guides" },
    { href: "/map", label: "Ocean Map" },
    { href: "/sounds", label: "Ocean Sounds" },
    { href: "/sightings", label: "Marine Sightings" },
    { href: "/catches", label: "Fish Catch" },
    { href: "/observations", label: "Observations" },
  ],
  getInvolved: [
    { href: "/education", label: "Education" },
    { href: "/contributions", label: "Contributions" },
    { href: "/ecotourism", label: "Ecotourism" },
    { href: "/ecotourism/bookings", label: "My Bookings" },
  ],
  community: [
    { href: "/community/members", label: "Members" },
    { href: "/events", label: "Events" },
    { href: "/cleanups", label: "Beach Clean-ups" },
    { href: "/recognition", label: "Recognition" },
    { href: "/emergency", label: "Emergency" },
  ],
  about: [
    { href: "/about", label: "About O3L" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/contact", label: "Contact Us" },
  ],
};

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {  return (
    <div>
      <h3 className="font-semibold mb-4 text-white">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const filter = useNavFilter();

  /* Drop admin-disabled links and follow the admin's ordering. */
  const visible = (links: { href: string; label: string }[]) =>
    links
      .map((link, index) => ({ link, index }))
      .filter(({ link }) => filter.isVisible(link.href))
      .sort((a, b) => filter.orderOf(a.link.href) - filter.orderOf(b.link.href) || a.index - b.index)
      .map(({ link }) => link);

  const columns = [
    { title: "Explore", links: visible(footerLinks.explore) },
    { title: "Get Involved", links: visible(footerLinks.getInvolved) },
    { title: "Community", links: visible(footerLinks.community) },
    { title: "About", links: visible(footerLinks.about) },
  ].filter((column) => column.links.length > 0);

  return (
    <footer className="bg-ocean-navy text-white">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="space-y-4 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/o3l-logo.png"
                alt="O3L"
                width={48}
                height={48}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              One Ocean One Life. Connecting coastal communities to understand
              and protect the ocean.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a
                href="#"
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              <a
                href="#"
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          {columns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © 2026 O3L — One Ocean One Life. All rights
            reserved.
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-ocean-coral fill-ocean-coral" /> for ocean conservation
          </p>
        </div>
      </div>
    </footer>
  );
}
