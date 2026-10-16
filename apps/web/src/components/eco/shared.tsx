"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EcoModelCategory, TourismType } from "@/types";

/* ------------------------------------------------------------------ */
/* Category metadata — the 5 O3L models                                */
/* ------------------------------------------------------------------ */

export interface SampleRevenueRow {
  icon: string;
  experience: string;
  price: string;
  unit: string;
}

export interface HouseholdEarner {
  who: string;
  role: string;
  emoji: string;
}

export const MODEL_META: Record<
  EcoModelCategory,
  {
    number: number;
    label: string;
    short: string;
    taglineTop: string;
    taglineBottom: string;
    tagline: string;
    subtitle: string;
    keyDifference?: string;
    icon: string;
    emoji: string;
    gradient: string;
    headerBg: string;
    badgeTextColor: string;
    samplePillClass: string;
    cardBorderClass: string;
    chip: string;
    coverImage: string;
    infographicHighlights: { icon: string; title: string; detail: string; img: string }[];
    fullActivities: string[];
    sampleRevenue: SampleRevenueRow[];
    earners: HouseholdEarner[];
  }
> = {
  fisher_coastal: {
    number: 1,
    label: "Fisher-led Coastal Experience",
    short: "Fisher-led",
    taglineTop: "Go with local fishers • Learn • Experience",
    taglineBottom: "Respect the ocean",
    tagline: "Go with local fishers · Learn · Experience · Respect the ocean",
    subtitle: "A visitor books a 1–3 hour experience with a local fishing family rather than a conventional commercial tour operator.",
    keyDifference: "The fisherman becomes the guide and storyteller, not just the boat operator.",
    icon: "🎣",
    emoji: "🎣",
    gradient: "from-ocean-blue via-ocean-deep to-ocean-green",
    headerBg: "bg-gradient-to-r from-[#0A5C9E] to-[#1374BA]",
    badgeTextColor: "text-[#0A5C9E]",
    samplePillClass: "bg-sky-100 text-sky-900 border-sky-200",
    cardBorderClass: "border-sky-200/80",
    chip: "bg-ocean-blue/10 text-ocean-blue border-ocean-blue/20",
    coverImage: "/shg/p1-banner-boats.webp",
    infographicHighlights: [
      {
        icon: "🐟",
        title: "Catch & Release (Responsible)",
        detail: "Responsible catch-and-release recreational fishing with local fishers.",
        img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80",
      },
      {
        icon: "⛵",
        title: "Learn about boats & fishing",
        detail: "How nets are prepared, boat handling & traditional navigation.",
        img: "/shg/p1-banner-boats.webp",
      },
      {
        icon: "🌅",
        title: "Sunrise / Sunset boat rides",
        detail: "1–3 hour golden-hour trips along working coastal harbours.",
        img: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=400&q=80",
      },
    ],
    fullActivities: [
      "Traditional fishing boat",
      "Traditional fishing gear",
      "How nets are prepared",
      "Boat handling",
      "Fish identification",
      "Traditional navigation knowledge",
      "Sunrise / sunset experience",
      "Responsible catch-and-release recreational fishing",
      "Coastal bird observation",
      "Local stories about the sea",
    ],
    sampleRevenue: [
      { icon: "🚤", experience: "Guided boat tour (1–2 hrs)", price: "₹ 2,000 – 4,000", unit: "per boat (4–6 visitors)" },
      { icon: "🐟", experience: "Recreational fishing (catch & release)", price: "₹ 2,500 – 5,000", unit: "per small-group trip" },
      { icon: "👥", experience: "Fishing culture experience (local fisher guide)", price: "₹ 1,000 – 2,000", unit: "per group" },
      { icon: "🌅", experience: "Sunset / sunrise trip", price: "₹ 1,500 – 3,000", unit: "per boat" },
      { icon: "🎣", experience: "Traditional fishing demonstration", price: "₹ 500 – 1,500", unit: "per person" },
    ],
    earners: [
      { emoji: "🚤", who: "Fisherman / Boat Owner", role: "₹2,400 (80% of a ₹3,000 trip)" },
      { emoji: "🏘️", who: "Village / Community Fund", role: "₹300 (10% shared village pool)" },
      { emoji: "💻", who: "O3L Platform", role: "₹150 (5% app & payment ops)" },
      { emoji: "🛡️", who: "Safety & Environment Reserve", role: "₹150 (5% insurance & conservation)" },
    ],
  },
  nature_tours: {
    number: 2,
    label: "Mangrove, Lagoon & Marine Nature Tours",
    short: "Nature Tours",
    taglineTop: "Explore • Observe • Conserve",
    taglineBottom: "Community-guided eco-tours",
    tagline: "Explore · Observe · Conserve · Community-guided eco-tours",
    subtitle: "Particularly useful for families who cannot regularly go offshore — conserving natural areas while sustaining local well-being.",
    keyDifference: "One tourist generates income for several households (Fisher + Fisherwoman + Youth + Elder + Village).",
    icon: "🌿",
    emoji: "🌿",
    gradient: "from-ocean-green via-emerald-600 to-teal-700",
    headerBg: "bg-gradient-to-r from-[#187755] to-[#23946B]",
    badgeTextColor: "text-[#187755]",
    samplePillClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
    cardBorderClass: "border-emerald-200/80",
    chip: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    coverImage: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=80",
    infographicHighlights: [
      {
        icon: "🐬",
        title: "Dolphin / Turtle observation",
        detail: "Observed responsibly from safe distances.",
        img: "https://images.unsplash.com/photo-1570481662006-a3a1374699e8?auto=format&fit=crop&w=400&q=80",
      },
      {
        icon: "🐦",
        title: "Bird watching in mangroves & estuaries",
        detail: "Guided kayak & creek trails for migratory & resident birds.",
        img: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=400&q=80",
      },
      {
        icon: "🌱",
        title: "Conservation education",
        detail: "Mangrove roots, coastal vegetation & beach biodiversity walks.",
        img: "/shg/p1-seaweed-farm.webp",
      },
    ],
    fullActivities: [
      "Mangrove kayaking",
      "Lagoon tours",
      "Estuary exploration",
      "Bird watching",
      "Turtle observation from appropriate distances",
      "Dolphin observation where appropriate",
      "Coastal vegetation interpretation",
      "Photography",
      "Marine conservation walks",
      "Beach biodiversity walks",
    ],
    sampleRevenue: [
      { icon: "🛶", experience: "Kayak / small boat tour (mangrove/estuary)", price: "₹ 1,500 – 3,000", unit: "per person" },
      { icon: "🔭", experience: "Bird watching tour", price: "₹ 1,000 – 2,000", unit: "per person" },
      { icon: "🌿", experience: "Nature & conservation walk", price: "₹ 500 – 1,000", unit: "per person" },
      { icon: "👨‍👩‍👧‍👦", experience: "Group / school tour (education program)", price: "₹ 5,000 – 15,000", unit: "per group" },
      { icon: "📷", experience: "Photography / nature package", price: "₹ 1,000 – 3,000", unit: "per person" },
    ],
    earners: [
      { emoji: "🛶", who: "Fisher", role: "Boat / kayak operator" },
      { emoji: "🥥", who: "Fisherwoman", role: "Refreshments & local snacks" },
      { emoji: "🧭", who: "Youth", role: "Nature & birding guide" },
      { emoji: "📖", who: "Elder", role: "Traditional knowledge & storytelling" },
      { emoji: "🌱", who: "Village", role: "Community conservation fund" },
    ],
  },
  homestay_food: {
    number: 3,
    label: "Fisher Village Homestay & Local Food",
    short: "Homestay & Food",
    taglineTop: "Stay • Eat • Learn • Experience",
    taglineBottom: "Live the coastal culture",
    tagline: "Stay · Eat · Learn · Experience · Live the coastal culture",
    subtitle: "Instead of tourists staying only in hotels, selected fishing families host guests in the village and share authentic coastal cuisine.",
    keyDifference: "Don't make only the boat owner earn — O3L packages 6 families (A–F) into one seamless village stay.",
    icon: "🏠",
    emoji: "🏠",
    gradient: "from-orange-500 via-amber-500 to-ocean-coral",
    headerBg: "bg-gradient-to-r from-[#C8641B] to-[#DD7A26]",
    badgeTextColor: "text-[#C8641B]",
    samplePillClass: "bg-amber-100 text-amber-900 border-amber-200",
    cardBorderClass: "border-amber-200/80",
    chip: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    coverImage: "/shg/f-hero-meal.webp",
    infographicHighlights: [
      {
        icon: "🧶",
        title: "Traditional net making",
        detail: "Hands-on net weaving & repair with village elders.",
        img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80",
      },
      {
        icon: "🚤",
        title: "Boat building & repair demo",
        detail: "Traditional wooden craft & hull maintenance.",
        img: "/shg/p1-banner-boats.webp",
      },
      {
        icon: "🍤",
        title: "Fish processing & value addition",
        detail: "Fresh coastal meals, fish pickles & solar drying.",
        img: "/shg/p1-pickled-fish.webp",
      },
      {
        icon: "🧺",
        title: "Local crafts & souvenirs",
        detail: "Handmade shells, baskets & artisan keepsakes.",
        img: "/shg/p1-dried-fish.webp",
      },
    ],
    fullActivities: [
      "One clean guest room (Homestay)",
      "Local breakfast",
      "Traditional lunch / dinner",
      "Fishing-village experience",
      "Boat-building / repair demonstration",
      "Net-making demonstration",
      "Local seafood preparation & cooking experience",
      "Local crafts & souvenirs",
      "Village cultural walk",
    ],
    sampleRevenue: [
      { icon: "🏠", experience: "Homestay (per room/night)", price: "₹ 1,500 – 3,500", unit: "including breakfast" },
      { icon: "🍽️", experience: "Local seafood / coastal meals", price: "₹ 200 – 500", unit: "per meal" },
      { icon: "⚙️", experience: "Hands-on workshop (net making, boat building)", price: "₹ 500 – 1,000", unit: "per person" },
      { icon: "🧺", experience: "Handicrafts & local products", price: "₹ 100 – 1,000", unit: "per item" },
      { icon: "🎭", experience: "Village cultural experience & cooking", price: "₹ 500 – 1,500", unit: "per person" },
    ],
    earners: [
      { emoji: "🏠", who: "Family A", role: "Homestay guest room & breakfast" },
      { emoji: "🛶", who: "Family B", role: "Boat trip" },
      { emoji: "🍛", who: "Family C", role: "Seafood meal" },
      { emoji: "🧺", who: "Family D", role: "Handicrafts" },
      { emoji: "🧭", who: "Family E", role: "Local guide" },
      { emoji: "🥁", who: "Family F", role: "Cultural performance" },
    ],
  },
  ocean_learning: {
    number: 4,
    label: "Ocean Learning & Blue Experiences",
    short: "Ocean Learning",
    taglineTop: "Discover • Understand • Protect",
    taglineBottom: "Hands-on learning for all ages",
    tagline: "Discover · Understand · Protect · Hands-on learning for all ages",
    subtitle: "Connects marine bioacoustics (PAM), biodiversity science, and citizen science while employing educated youth from fishing families.",
    keyDifference: "Creates employment for educated children of fishing families as marine educators & bioacoustics hosts.",
    icon: "🔬",
    emoji: "🎧",
    gradient: "from-indigo-800 via-indigo-700 to-ocean-blue",
    headerBg: "bg-gradient-to-r from-[#2D2A7A] to-[#3F3B9D]",
    badgeTextColor: "text-[#2D2A7A]",
    samplePillClass: "bg-indigo-100 text-indigo-900 border-indigo-200",
    cardBorderClass: "border-indigo-200/80",
    chip: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
    coverImage: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=1000&q=80",
    infographicHighlights: [
      {
        icon: "🐬",
        title: "Marine mammals & underwater sounds",
        detail: "Listen to dolphin clicks, whale songs & reef snaps.",
        img: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&w=400&q=80",
      },
      {
        icon: "🐟",
        title: "Fish identification & coastal ecology",
        detail: "Field charts, sustainable fishing & coral/mangrove ecology.",
        img: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=400&q=80",
      },
      {
        icon: "📋",
        title: "Beach walks & citizen-science surveys",
        detail: "Intertidal surveys & real biodiversity data logging.",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
      },
    ],
    fullActivities: [
      "🐬 Marine mammals",
      "🐟 Fish identification",
      "🔊 Underwater sounds (PAM bioacoustics)",
      "🌊 Oceanography",
      "🎣 Sustainable fishing",
      "🪸 Coral ecosystems",
      "🐢 Turtle conservation",
      "🌱 Mangroves",
      "🦀 Intertidal biodiversity",
      "🚢 Shipping and ocean noise",
    ],
    sampleRevenue: [
      { icon: "🎓", experience: "Educational program (schools/colleges)", price: "₹ 300 – 800", unit: "per student" },
      { icon: "🐬", experience: "Ocean learning tour (marine life, ecology)", price: "₹ 1,000 – 2,500", unit: "per person" },
      { icon: "🔊", experience: "Underwater sound demo & awareness session", price: "₹ 1,000 – 2,000", unit: "per group" },
      { icon: "📋", experience: "Citizen-science program (beach survey, data collection)", price: "₹ 500 – 1,000", unit: "per person" },
      { icon: "🔬", experience: "University / research field experience", price: "₹ 2,000 – 5,000", unit: "per person" },
    ],
    earners: [
      { emoji: "🎓", who: "Student / Educated Youth", role: "Marine education assistant" },
      { emoji: "🎧", who: "Bioacoustics Facilitator", role: "'Listen to the Ocean' sound lab" },
      { emoji: "🐟", who: "Senior Fisher", role: "Species identification & sustainable gear mentor" },
    ],
  },
  festival_market: {
    number: 5,
    label: "Weekend Coastal Community Festival & Marketplace",
    short: "Festival & Market",
    taglineTop: "People • Culture • Food • Products",
    taglineBottom: "A vibrant coastal celebration",
    tagline: "People · Culture · Food · Products · A vibrant coastal celebration",
    subtitle: "Instead of waiting for tourists to come every day, create a weekly or monthly 'Saturday – Life of the Fishing Village' event involving the entire village.",
    keyDifference: "100 visitors × ₹300 = ₹30,000 | 300 visitors × ₹300 = ₹90,000 in a single day across the village.",
    icon: "🎉",
    emoji: "🎉",
    gradient: "from-sky-700 via-ocean-blue to-teal-600",
    headerBg: "bg-gradient-to-r from-[#0F548C] to-[#1971B2]",
    badgeTextColor: "text-[#0F548C]",
    samplePillClass: "bg-cyan-100 text-cyan-900 border-cyan-200",
    cardBorderClass: "border-cyan-200/80",
    chip: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    coverImage: "/shg/p3-hero-women.webp",
    infographicHighlights: [
      {
        icon: "🧹",
        title: "Beach clean-up drives",
        detail: "Evening community beach-cleaning & conservation action.",
        img: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=400&q=80",
      },
      {
        icon: "🍲",
        title: "Local food stalls (coastal cuisine)",
        detail: "Fresh seafood stalls & coconut coastal delicacies.",
        img: "/shg/f-hero-meal.webp",
      },
      {
        icon: "🧺",
        title: "Crafts & value-added products",
        detail: "Pickles, dry fish, seaweed products & handicrafts by fisherwomen.",
        img: "/shg/p3-pickled-fish.webp",
      },
      {
        icon: "🎵",
        title: "Cultural programs & storytelling",
        detail: "Traditional folk music, elders' sea stories & sunset gathering.",
        img: "/shg/p1-banner-women.webp",
      },
    ],
    fullActivities: [
      "Entry / activity passes",
      "Food stalls (local seafood & coastal food)",
      "Handicrafts & local crafts",
      "Short boat trips & fishing demonstrations",
      "Workshops & fish identification",
      "Cultural programmes & traditional music",
      "Photography",
      "Fisherwomen's value-added local products",
      "Sponsorship",
      "Conservation contributions & beach-cleaning activity",
    ],
    sampleRevenue: [
      { icon: "🏪", experience: "Stall fees (food, crafts, products)", price: "₹ 500 – 2,000", unit: "(per day)" },
      { icon: "🍲", experience: "Food festival (local cuisine)", price: "₹ 100 – 400", unit: "(per item)" },
      { icon: "🎵", experience: "Cultural program / event", price: "₹ 10,000 – 50,000", unit: "(per event, community share)" },
      { icon: "💚", experience: "Conservation contribution (donations, memberships)", price: "₹ 100 – 1,000", unit: "(per person)" },
      { icon: "🎟️", experience: "Visitor festival pass (100–300 visitors × ₹300)", price: "₹ 30,000 – 90,000", unit: "(illustrative daily village revenue)" },
    ],
    earners: [
      { emoji: "👩‍🍳", who: "Fisherwomen SHGs", role: "Seafood stalls & value-added products" },
      { emoji: "🛶", who: "Boat Operators", role: "Morning boat & fishing demos" },
      { emoji: "🥁", who: "Elders & Folk Artists", role: "Sea stories & evening cultural music" },
      { emoji: "🧹", who: "Youth & Village Committee", role: "Event management & beach clean-up" },
    ],
  },
};

export const MODEL_ORDER: EcoModelCategory[] = [
  "fisher_coastal",
  "nature_tours",
  "homestay_food",
  "ocean_learning",
  "festival_market",
];

export const TYPE_META: Record<string, { icon: string; label: string; fallbackImg: string }> = {
  whale_watching: { icon: "🐋", label: "Whale Watching", fallbackImg: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?auto=format&fit=crop&w=900&q=80" },
  snorkeling: { icon: "🤿", label: "Snorkeling", fallbackImg: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80" },
  diving: { icon: "🤿", label: "Diving", fallbackImg: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80" },
  boat_tour: { icon: "🛶", label: "Boat Tour", fallbackImg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80" },
  fishing_trip: { icon: "🎣", label: "Fishing Trip", fallbackImg: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=900&q=80" },
  bird_watching: { icon: "🐦", label: "Bird Watching", fallbackImg: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=900&q=80" },
  mangrove_tour: { icon: "🌿", label: "Mangrove Tour", fallbackImg: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=80" },
  kayak_tour: { icon: "🛶", label: "Mangrove Kayaking", fallbackImg: "https://images.unsplash.com/photo-1544551763-92ab472cad5d?auto=format&fit=crop&w=900&q=80" },
  beach_tour: { icon: "🏖", label: "Beach Tour", fallbackImg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80" },
  village_tour: { icon: "🏘", label: "Village Tour", fallbackImg: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80" },
  cultural_tour: { icon: "🏛", label: "Cultural Tour", fallbackImg: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80" },
  sunset_trip: { icon: "🌅", label: "Sunrise / Sunset Trip", fallbackImg: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80" },
  traditional_fishing_demo: { icon: "🎣", label: "Fishing Demonstration", fallbackImg: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80" },
  turtle_watching: { icon: "🐢", label: "Turtle Observation", fallbackImg: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=900&q=80" },
  dolphin_watching: { icon: "🐬", label: "Dolphin Observation", fallbackImg: "https://images.unsplash.com/photo-1570481662006-a3a1374699e8?auto=format&fit=crop&w=900&q=80" },
  estuary_tour: { icon: "🏞", label: "Estuary Tour", fallbackImg: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80" },
  coastal_photography: { icon: "📷", label: "Photography Walk", fallbackImg: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80" },
  nature_walk: { icon: "🌱", label: "Nature Walk", fallbackImg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80" },
  homestay_stay: { icon: "🏠", label: "Homestay", fallbackImg: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80" },
  cooking_experience: { icon: "🍳", label: "Cooking Experience", fallbackImg: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80" },
  seafood_meal: { icon: "🍤", label: "Seafood Meal", fallbackImg: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80" },
  net_making_demo: { icon: "🧶", label: "Net Making", fallbackImg: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80" },
  boat_building_demo: { icon: "🚤", label: "Boat Building", fallbackImg: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=900&q=80" },
  village_walk: { icon: "👣", label: "Village Walk", fallbackImg: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80" },
  handicraft: { icon: "🧺", label: "Handicrafts", fallbackImg: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=900&q=80" },
  marine_education: { icon: "🐟", label: "Marine Life", fallbackImg: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=900&q=80" },
  underwater_sounds: { icon: "🎧", label: "Ocean Sounds", fallbackImg: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=80" },
  school_program: { icon: "🎓", label: "School Program", fallbackImg: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=900&q=80" },
  citizen_science: { icon: "🔬", label: "Citizen Science", fallbackImg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80" },
  festival: { icon: "🎉", label: "Village Festival", fallbackImg: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=900&q=80" },
  craft_market: { icon: "🧺", label: "Craft Market", fallbackImg: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80" },
  cultural_performance: { icon: "🎵", label: "Music & Stories", fallbackImg: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80" },
};

export function typeMeta(type?: string) {
  return (
    TYPE_META[type || ""] || {
      icon: "🌊",
      label: (type || "Experience").replace(/_/g, " "),
      fallbackImg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    }
  );
}

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

export function formatINR(amount?: number | string | null): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function priceOf(item: {
  price_min?: number | string | null;
  price_max?: number | string | null;
  price_range?: string;
}): string {
  const min = item.price_min !== undefined && item.price_min !== null ? item.price_min : null;
  const max = item.price_max !== undefined && item.price_max !== null ? item.price_max : null;
  if (min !== null && max !== null && String(min) !== String(max)) {
    return `${formatINR(min)} – ${formatINR(max)}`;
  }
  if (min !== null) return formatINR(min);
  return item.price_range || "On request";
}

/* ------------------------------------------------------------------ */
/* Animated counter                                                    */
/* ------------------------------------------------------------------ */

export function AnimatedNumber({
  value,
  duration = 1400,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: number | undefined;
    const finish = () => setDisplay(value);
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(finish);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (reduced) {
              finish();
              return;
            }
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - t, 3);
              setDisplay(value * eased);
              if (t < 1) requestAnimationFrame(tick);
              else finish();
            };
            requestAnimationFrame(tick);
            timer = window.setTimeout(finish, duration + 500);
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {Math.round(display).toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Rating stars                                                        */
/* ------------------------------------------------------------------ */

export function Stars({
  rating = 0,
  count,
  size = "sm",
  className,
}: {
  rating?: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const starCls = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            starCls,
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
                ? "fill-amber-400/60 text-amber-400"
                : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-ocean-navy">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-ocean-text-secondary">({count})</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export function EcoBadge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "green" | "amber" | "coral" | "blue" | "dark";
  className?: string;
}) {
  const tones = {
    default: "bg-ocean-light text-ocean-deep border-ocean-blue/20",
    green: "bg-emerald-50 text-emerald-700 border-emerald-500/25",
    amber: "bg-amber-50 text-amber-700 border-amber-500/25",
    coral: "bg-orange-50 text-orange-600 border-orange-500/25",
    blue: "bg-sky-50 text-sky-700 border-sky-500/25",
    dark: "bg-ocean-deep text-white border-white/15",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
