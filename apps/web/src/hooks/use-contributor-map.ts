"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/constants";

export type ContributorLevel = "state" | "zone" | "district" | "village";

export interface ContributorAggregateRow {
  id: string | null;
  name: string;
  slug: string | null;
  level: ContributorLevel;
  latitude: number | null;
  longitude: number | null;
  contributions: number;
  verified: number;
  points: number;
  contributors: number;
}

export interface ContributorTotals {
  contributions: number;
  verified: number;
  points: number;
  contributors: number;
}

export interface ContributorAggregateResponse {
  level: ContributorLevel;
  parent: string | null;
  totals: ContributorTotals;
  rows: ContributorAggregateRow[];
  truncated: boolean;
}

export interface ContributorPerson {
  user: string;
  name: string;
  contributor_type: string;
  village: string | null;
  district: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  verified_contributions: number;
  total_score: number;
  tier: string;
  earnings_inr: number | null;
  earnings_hidden: boolean;
  can_connect: boolean;
}

export interface ContributorPeopleResponse {
  count: number;
  results: ContributorPerson[];
}

export interface ContributorPoint {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
  type_display: string;
  status: string;
  points: number;
  created_at: string;
  contributor: string;
  contributor_type: string;
  village: string | null;
  district: string | null;
  state: string | null;
}

export interface ContributorPointsResponse {
  count: number;
  results: ContributorPoint[];
}

export interface ContributorAggregateFilters {
  level: ContributorLevel;
  parent?: string | null;
  type?: string;
  isCoastal?: boolean;
  dateFrom?: string;
  dateTo?: string;
  bbox?: string;
  resolve?: boolean;
}

function aggregateParams(filters: ContributorAggregateFilters): Record<string, string> {
  const params: Record<string, string> = { level: filters.level };
  if (filters.parent) params.parent = filters.parent;
  if (filters.type && filters.type !== "all") params.type = filters.type;
  if (filters.isCoastal) params.is_coastal = "1";
  if (filters.dateFrom) params.date_from = filters.dateFrom;
  if (filters.dateTo) params.date_to = filters.dateTo;
  if (filters.bbox) params.bbox = filters.bbox;
  if (filters.resolve === false) params.resolve = "0";
  return params;
}

export function useContributorAggregates(filters: ContributorAggregateFilters) {
  const params = aggregateParams(filters);
  return useQuery({
    queryKey: ["contributorAggregates", params],
    queryFn: () =>
      apiClient.get<ContributorAggregateResponse>(
        ENDPOINTS.MAPS.CONTRIBUTOR_AGGREGATES,
        params
      ),
    placeholderData: (prev) => prev,
  });
}

export function useContributorPeople(bbox?: string) {
  const params: Record<string, string> = {};
  if (bbox) params.bbox = bbox;
  return useQuery({
    queryKey: ["contributorPeople", params],
    queryFn: () =>
      apiClient.get<ContributorPeopleResponse>(ENDPOINTS.MAPS.CONTRIBUTOR_PEOPLE, params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useContributorPoints(bbox?: string, type?: string) {
  const params: Record<string, string> = {};
  if (bbox) params.bbox = bbox;
  if (type && type !== "all") params.type = type;
  return useQuery({
    queryKey: ["contributorPoints", params],
    queryFn: () =>
      apiClient.get<ContributorPointsResponse>(ENDPOINTS.MAPS.CONTRIBUTOR_POINTS, params),
    staleTime: 5 * 60 * 1000,
  });
}
