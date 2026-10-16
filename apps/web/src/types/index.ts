export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  profile?: Profile;
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'SCIENTIFIC_VALIDATOR'
  | 'RESEARCHER'
  | 'NGO'
  | 'COMMUNITY_ORGANIZATION'
  | 'FISHERMAN'
  | 'COMMUNITY_MEMBER'
  | 'VENDOR'
  | 'TOURISM_PROVIDER'
  | 'EDUCATOR'
  | 'VOLUNTEER'
  | 'GUEST';

export interface Profile {
  id: string;
  user: string;
  village?: string;
  village_name?: string;
  bio?: string;
  occupation?: string;
  organization?: string;
  phone?: string;
  profile_photo?: string;
  latitude?: number;
  longitude?: number;
  location_precision: LocationPrecision;
  contribution_score: number;
  member_status: string;
  last_active?: string;
  gender?: string;
  age_range?: string;
  languages?: string[];
  skills?: string;
  years_of_experience?: number;
  areas_of_expertise?: string;
  verification_status: VerificationStatus;
}

export type LocationPrecision =
  | 'exact'
  | 'approximate'
  | 'village'
  | 'district'
  | 'private'
  | 'research_only';

export type VerificationStatus = 'pending' | 'partial' | 'verified' | 'rejected';

export interface Zone {
  id: string;
  name: string;
  zone_number: number;
  description?: string;
  districts?: District[];
}

export interface District {
  id: string;
  name: string;
  zone: string;
  state: string;
  villages?: Village[];
}

export interface Village {
  id: string;
  name: string;
  district: string;
  latitude?: number;
  longitude?: number;
}

export interface GuideCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parent?: string;
  species_count?: number;
}

export interface GuideSpecies {
  id: string;
  slug?: string;
  category: string;
  category_name?: string;
  common_name: string;
  tamil_name?: string;
  scientific_name?: string;
  description?: string;
  habitat?: string;
  id_characteristics?: string;
  size_range?: string;
  diet?: string;
  behavior?: string;
  key_facts?: string;
  conservation_status?: string;
  seasonal_info?: string;
  distribution_notes?: string;
  images: string[];
  videos?: string[];
  verified: boolean;
  latitude?: number;
  longitude?: number;
}

export interface EducationCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface EducationPost {
  id: string;
  slug?: string;
  category: string;
  category_name?: string;
  title: string;
  content: string;
  post_type: EducationPostType;
  author: string;
  author_name?: string;
  language: string;
  image?: string;
  view_count: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type EducationPostType =
  | 'article'
  | 'blog'
  | 'story'
  | 'knowledge'
  | 'experience'
  | 'observation'
  | 'tutorial'
  | 'research'
  | 'video'
  | 'podcast'
  | 'lesson';

export interface ContributionType {
  id: string;
  name: string;
  description?: string;
  points_submitted: number;
  points_verified: number;
  icon?: string;
}

export interface ContributionMediaFile {
  id: string;
  kind: "image" | "video" | "audio" | "document";
  url: string;
  display_name: string;
  name?: string;
  caption?: string;
  order: number;
  created_at: string;
}

export interface Contribution {
  id: string;
  slug?: string;
  type: string;
  type_display?: string;
  user?: string;
  user_name?: string;
  title: string;
  author?: string;
  author_display?: string;
  description?: string;
  notes?: string;
  status: ContributionStatus;
  status_display?: string;
  village?: string | null;
  village_name?: string | null;
  zone?: string | null;
  zone_name?: string | null;
  points: number;
  quality_score?: number;
  safety_status?: string;
  moderation_decision?: string;
  visibility_status?: string;
  media?: ContributionMediaFile[];
  metadata?: Record<string, unknown>;
  verified_by?: string;
  verified_at?: string | null;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type ContributionStatus =
  | 'draft'
  | 'submitted'
  | 'auto_validated'
  | 'moderator_review'
  | 'scientific_review'
  | 'verified'
  | 'rejected'
  | 'duplicate';

export interface OceanSound {
  id: string;
  contribution: string;
  audio_file: string;
  voice_description?: string;
  written_description?: string;
  duration?: number;
  instrument?: string;
  instrument_manufacturer?: string;
  instrument_model?: string;
  depth_meters?: number;
  measurement_method?: string;
  frequency_range?: string;
  environmental_conditions?: Record<string, unknown>;
  recording_date?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface MarineSighting {
  id: string;
  contribution: string;
  species_name: string;
  species_suggestion?: string;
  count?: number;
  behavior?: SightingBehavior;
  photo?: string;
  video?: string;
  depth_meters?: number;
  distance_from_shore?: number;
  sea_conditions?: string;
  weather_conditions?: string;
  ai_species_suggestion?: string;
  ai_confidence?: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export type SightingBehavior =
  | 'feeding'
  | 'breeding'
  | 'traveling'
  | 'resting'
  | 'socializing'
  | 'unknown';

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  organizer: string;
  organizer_name?: string;
  village?: string;
  village_name?: string;
  latitude?: number;
  longitude?: number;
  start_date: string;
  end_date?: string;
  max_participants?: number;
  current_participants: number;
  image?: string;
  created_at: string;
}

export type EventType =
  | 'cleanup'
  | 'education'
  | 'research'
  | 'community'
  | 'training'
  | 'emergency'
  | 'celebration'
  | 'workshop';

export interface EventParticipant {
  id: string;
  event: string;
  user: string;
  user_name?: string;
  status: 'registered' | 'attended' | 'cancelled';
  registered_at: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  author_name?: string;
  author_photo?: string;
  title?: string;
  content: string;
  visibility: PostVisibility;
  latitude?: number;
  longitude?: number;
  village?: string;
  village_name?: string;
  images: string[];
  video?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export type PostVisibility = 'public' | 'village' | 'zone';

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Vendor {
  id: string;
  user: string;
  user_name?: string;
  business_name: string;
  business_description?: string;
  business_license?: string;
  gst_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  village?: string;
  village_name?: string;
  verified: boolean;
  rating: number;
  created_at: string;
}

export interface Product {
  id: string;
  vendor: string;
  vendor_name?: string;
  category: string;
  category_name?: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stock: number;
  images: string[];
  active: boolean;
  contribution_discount_eligible: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  buyer: string;
  buyer_name?: string;
  vendor: string;
  vendor_name?: string;
  items: OrderItem[];
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: OrderStatus;
  shipping_address?: string;
  created_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  product: string;
  product_name?: string;
  quantity: number;
  price: number;
}

export interface PaymentTransaction {
  id: string;
  order: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  provider_payment_id?: string;
  status: PaymentStatus;
  created_at: string;
}

export type PaymentProvider = 'razorpay' | 'stripe' | 'upi' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface BeachProfile {
  id: string;
  name: string;
  description?: string;
  village?: string;
  village_name?: string;
  latitude?: number;
  longitude?: number;
  beach_length_km?: number;
  beach_type?: string;
  water_quality?: string;
  safety_rating?: number;
  blue_flag: boolean;
  images: string[];
  created_at: string;
}

export interface TourismOpportunity {
  id: string;
  slug?: string;
  name: string;
  opportunity_type: TourismType;
  model_category: EcoModelCategory;
  description?: string;
  beach?: string | null;
  beach_name?: string | null;
  village?: string | null;
  village_name?: string | null;
  district_name?: string | null;
  state?: string | null;
  family?: string | null;
  family_name?: string | null;
  price_range?: string;
  price_min?: number | string | null;
  price_max?: number | string | null;
  price_unit?: PriceUnit;
  display_price?: string;
  booking_price?: number | string | null;
  split_preview?: SplitLine[];
  duration?: string;
  duration_minutes?: number | null;
  max_participants?: number | null;
  highlights?: string[];
  inclusions?: string[];
  meeting_point?: string;
  images?: string[];
  image?: string | null;
  family_phone?: string | null;
  family_verified?: boolean;
  family_members_count?: number | null;
  contact_phone?: string | null;
  verification_code?: string | null;
  google_maps_url?: string | null;
  escrow_guarantee?: string | null;
  is_offshore?: boolean;
  lean_season_friendly?: boolean;
  weekday?: string;
  start_time?: string | null;
  end_time?: string | null;
  is_sustainable?: boolean;
  rating?: number;
  total_reviews?: number;
  total_bookings?: number;
  latitude?: number | null;
  longitude?: number | null;
  blocked_reason?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export type EcoModelCategory =
  | 'fisher_coastal'
  | 'nature_tours'
  | 'homestay_food'
  | 'ocean_learning'
  | 'festival_market';

export type PriceUnit = 'person' | 'boat' | 'group' | 'night' | 'student';

export type TourismType =
  | 'whale_watching'
  | 'snorkeling'
  | 'diving'
  | 'boat_tour'
  | 'fishing_trip'
  | 'bird_watching'
  | 'mangrove_tour'
  | 'beach_tour'
  | 'village_tour'
  | 'cultural_tour'
  | 'sunset_trip'
  | 'traditional_fishing_demo'
  | 'kayak_tour'
  | 'turtle_watching'
  | 'dolphin_watching'
  | 'estuary_tour'
  | 'coastal_photography'
  | 'nature_walk'
  | 'homestay_stay'
  | 'cooking_experience'
  | 'seafood_meal'
  | 'net_making_demo'
  | 'boat_building_demo'
  | 'village_walk'
  | 'handicraft'
  | 'marine_education'
  | 'underwater_sounds'
  | 'school_program'
  | 'citizen_science'
  | 'festival'
  | 'craft_market'
  | 'cultural_performance';

export interface EcoModel {
  key: EcoModelCategory;
  label: string;
  blurb: string;
  icon: string;
  experience_count: number;
  package_count: number;
  min_price?: number | string | null;
}

export interface FisherFamily {
  id: string;
  name: string;
  village?: string | null;
  village_name?: string | null;
  district_name?: string | null;
  state?: string | null;
  members_count?: number;
  description?: string;
  skills?: string[];
  photo?: string | null;
  is_verified?: boolean;
  rating?: number;
  total_reviews?: number;
  total_earnings?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  verification_id?: string | null;
  google_maps_url?: string | null;
}

export interface EcoPackage {
  id: string;
  model_category: EcoModelCategory;
  title: string;
  slug: string;
  description: string;
  village?: string | null;
  village_name?: string | null;
  district_name?: string | null;
  price: number | string;
  original_price?: number | string | null;
  duration_text: string;
  duration_minutes?: number | null;
  max_participants: number;
  inclusions?: string[];
  itinerary?: { time: string; title: string; detail: string }[];
  image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  family_count?: number;
  families?: FisherFamily[];
  rating?: number;
  total_reviews?: number;
  total_bookings?: number;
  is_active?: boolean;
  split_preview?: SplitLine[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
export type BookingPaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

export interface SplitLine {
  recipient_type: 'provider' | 'village' | 'platform' | 'conservation';
  label: string;
  percentage: number | string;
  amount: number | string;
  status?: 'pending' | 'settled' | 'reversed';
}

export interface SplitRule {
  id: string;
  name: string;
  scope: string;
  provider_pct: number | string;
  village_pct: number | string;
  platform_pct: number | string;
  conservation_pct: number | string;
  is_active: boolean;
  is_default: boolean;
}

export interface EcoBooking {
  id: string;
  booking_ref: string;
  title: string;
  experience?: string | null;
  experience_name?: string | null;
  package?: string | null;
  package_title?: string | null;
  village_name?: string | null;
  experience_date: string;
  time_slot?: string;
  participants: number;
  unit_price: number | string;
  total_amount: number | string;
  status: BookingStatus;
  payment_status: BookingPaymentStatus;
  payment_method?: string;
  is_lean_season?: boolean;
  created_at?: string;
  paid_at?: string | null;
  payouts?: BookingPayout[];
  split_preview?: SplitLine[];
}

export interface BookingPayout {
  recipient_type: 'provider' | 'village' | 'platform' | 'conservation';
  label: string;
  percentage: number | string;
  amount: number | string;
  status?: 'pending' | 'settled' | 'reversed';
}

export interface EcoReview {
  id: string;
  user?: string;
  user_name?: string;
  experience?: string | null;
  package?: string | null;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_stay?: boolean;
  target_label?: string;
  created_at?: string;
}

export interface LeanSeasonData {
  active: boolean;
  simulated?: boolean;
  checked_on: string;
  message: string;
  windows: {
    id: string;
    state: string;
    district?: string | null;
    region_label: string;
    typical_period: string;
    main_reason?: string;
    start_month?: number;
    start_day?: number;
    end_month?: number;
    end_day?: number;
    ban_relief_text?: string;
    lean_allowance_text?: string;
  }[];
  profile?: {
    state: string;
    ban_relief_text?: string;
    lean_allowance_text?: string;
    period_remarks?: string;
  } | null;
  experiences: TourismOpportunity[];
  packages: EcoPackage[];
}

export interface MapPoint {
  type: 'experience' | 'package' | 'business';
  id: string;
  slug?: string;
  name: string;
  category: string;
  price?: number | null;
  price_unit?: string | null;
  rating?: number;
  village?: string | null;
  latitude: number;
  longitude: number;
  blocked?: boolean;
}

export interface BeachCleanupEvent {
  id: string;
  beach: string;
  beach_name?: string;
  event?: string | null;
  title: string;
  description?: string;
  cleanup_date: string;
  participants_count: number;
  waste_collected_kg?: number;
  photos_count?: number;
  organized_by?: string | null;
  created_at?: string;
}

export interface LocalBusiness {
  id: string;
  name: string;
  business_type: BusinessType;
  description?: string;
  village?: string;
  village_name?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  verified: boolean;
  created_at: string;
}

export type BusinessType =
  | 'restaurant'
  | 'homestay'
  | 'shop'
  | 'transport'
  | 'guide'
  | 'craft'
  | 'fishing'
  | 'other';

export interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  estimated_investment?: string;
  expected_return?: string;
  skills_required?: string;
  case_study?: string;
  image?: string;
  created_at: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  description: string;
  category: string;
  eligibility?: string;
  benefits?: string;
  application_process?: string;
  deadline?: string;
  website?: string;
  created_at: string;
}

export interface EmergencyProfile {
  id: string;
  user: string;
  blood_group?: string;
  medical_conditions?: string;
  allergies?: string;
  medications?: string;
  emergency_contacts: EmergencyContact[];
  boat_registration?: string;
  fishing_license?: string;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
  contact_type: EmergencyContactType;
  latitude?: number;
  longitude?: number;
}

export type EmergencyContactType =
  | 'coast_guard'
  | 'police'
  | 'hospital'
  | 'family'
  | 'village_head'
  | 'ngo'
  | 'other';

export interface Notification {
  id: string;
  user: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export type NotificationType =
  | 'verification'
  | 'emergency'
  | 'event'
  | 'recognition'
  | 'milestone'
  | 'marketplace'
  | 'comment'
  | 'mention'
  | 'system';

export interface RecognitionAward {
  id: string;
  user: string;
  user_name?: string;
  award_type: AwardType;
  title: string;
  description?: string;
  points: number;
  awarded_at: string;
}

export type AwardType =
  | 'first_contribution'
  | 'streak_7'
  | 'streak_30'
  | 'streak_90'
  | 'top_contributor'
  | 'community_hero'
  | 'ocean_guardian'
  | 'knowledge_seeker'
  | 'data_pioneer'
  | 'verification_champion'
  | 'event_organizer'
  | 'mentor'
  | 'innovator'
  | 'collaborator'
  | 'ambassador';

export interface ContributionScore {
  id: string;
  user: string;
  user_name?: string;
  total_score: number;
  quantity_score: number;
  quality_score: number;
  verification_score: number;
  community_score: number;
  environmental_score: number;
  knowledge_score: number;
  event_score: number;
  last_calculated: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: string;
  user_name?: string;
  village?: string;
  score: number;
  level: string;
}

export interface MapObservation {
  id: string;
  type: 'sighting' | 'sound' | 'contribution';
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  date: string;
  icon?: string;
}

export interface OceanHotspot {
  id: string;
  name: string;
  description?: string;
  hotspot_type: string;
  intensity: number;
  area_km2?: number;
  boundary?: string;
  created_at: string;
  updated_at: string;
}

export interface AnnualReport {
  id: string;
  year: number;
  title: string;
  summary?: string;
  monthly_data?: Record<string, unknown>;
  variance_analysis?: Record<string, unknown>;
  generated_at: string;
}

export interface SearchResult {
  type: 'guide' | 'education' | 'event' | 'member' | 'product' | 'emergency';
  id: string;
  title: string;
  description?: string;
  image?: string;
  url: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
