export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register/',
    LOGIN: '/auth/login/',
    REFRESH: '/auth/token/refresh/',
    VERIFY: '/auth/token/verify/',
    ME: '/auth/me/',
    CHANGE_PASSWORD: '/auth/change-password/',
  },
  ZONES: {
    LIST: '/zones/',
    DETAIL: (id: string) => `/zones/${id}/`,
  },
  DISTRICTS: {
    LIST: '/districts/',
    DETAIL: (id: string) => `/districts/${id}/`,
  },
  STATES: {
    LIST: '/states/',
  },
  VILLAGES: {
    LIST: '/villages/',
    DETAIL: (id: string) => `/villages/${id}/`,
  },
  STATE_PROFILES: {
    LIST: '/state-profiles/',
    DETAIL: (slug: string) => `/state-profiles/${slug}/`,
  },
  GUIDES: {
    CATEGORIES: '/guides/categories/',
    SPECIES: '/guides/species/',
    SPECIES_DETAIL: (id: string) => `/guides/species/${id}/`,
  },
  EDUCATION: {
    CATEGORIES: '/education/categories/',
    POSTS: '/education/posts/',
    POST_DETAIL: (id: string) => `/education/posts/${id}/`,
  },
  CONTRIBUTIONS: {
    TYPES: '/contributions/types/',
    LIST: '/contributions/',
    MY: '/contributions/my/',
    MY_STATS: '/contributions/my/stats/',
    PUBLIC: '/contributions/public/',
    PUBLIC_DETAIL: (id: string) => `/contributions/public/${id}/`,
    ADMIN_ALL: '/contributions/admin/all/',
    REVIEW: (id: string) => `/contributions/${id}/review/`,
    DETAIL: (id: string) => `/contributions/${id}/`,
  },
  SOUNDS: {
    LIST: '/sounds/',
    CREATE: '/sounds/create/',
    DETAIL: (id: string) => `/sounds/${id}/`,
  },
  SIGHTINGS: {
    LIST: '/sightings/',
    CATEGORIES: '/sightings/categories/',
    CREATE: '/sightings/create/',
    DETAIL: (id: string) => `/sightings/${id}/`,
  },
  COMMUNITY: {
    MEMBERS: '/community/members/',
    EVENTS: '/community/events/',
    EVENT_CREATE: '/community/events/create/',
    EVENT_DETAIL: (id: string) => `/community/events/${id}/`,
    POSTS: '/community/posts/',
    POST_DETAIL: (id: string) => `/community/posts/${id}/`,
  },
  MAPS: {
    HOTSPOTS: '/maps/hotspots/',
    EMERGENCY_CONTACTS: '/maps/emergency/contacts/',
    EMERGENCY_NEARBY: '/maps/emergency/nearby/',
    CONTRIBUTOR_AGGREGATES: '/maps/contributors/',
    CONTRIBUTOR_PEOPLE: '/maps/contributors/people/',
    CONTRIBUTOR_POINTS: '/maps/contributors/points/',
  },
  RECOGNITION: {
    AWARDS: '/recognition/awards/',
    LEADERBOARD: '/recognition/leaderboard/',
  },
  EMERGENCY: {
    OFFLINE_DATA: '/emergency/offline-data/',
  },
  NOTIFICATIONS: {
    LIST: '/notifications/',
    MARK_READ: (id: string) => `/notifications/${id}/read/`,
    MARK_ALL_READ: '/notifications/read-all/',
  },
  CMS: {
    HEADER_MENU: '/cms/header-menu/',
    MENU_ITEMS: '/cms/menu-items/',
    MENU_ITEMS_BULK: '/cms/menu-items/bulk/',
  },
  SEARCH: '/search/',
  MEDIA: '/media/',
} as const;
