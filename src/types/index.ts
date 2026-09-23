export type ServiceCategory = 'HAIR' | 'BEARD' | 'FACIALS' | 'MASSAGE' | 'HANDS & FEET' | 'GROOMING PACKAGES';

export interface Service {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  image_url: string;
  is_active: number;
  display_order: number;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  image_url: string;
  is_active: number;
  display_order: number;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  specialties: string;
  status: 'active' | 'inactive';
  working_days: string;
}

export interface BusinessHour {
  day_of_week: string;
  is_open: number;
  open_time: string;
  close_time: string;
  break_start?: string | null;
  break_end?: string | null;
}

export interface Review {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  date_text: string;
  is_featured: number;
  source: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image_url: string;
  alt_text: string;
  is_featured: number;
  display_order: number;
}

export interface Appointment {
  id: string;
  booking_reference: string;
  customer_id?: string;
  staff_id: string;
  service_id?: string;
  package_id?: string;
  service_title?: string;
  staff_name?: string;
  staff_role?: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled' | 'No-show' | 'Pending';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  total_appointments: number;
  last_appointment?: string;
  created_at: string;
}

export interface TimeSlot {
  time: string;
  displayTime: string;
  availableBarbers: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export interface BusinessSettings {
  business_name?: string;
  tagline?: string;
  address?: string;
  branch?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  instagram_handle?: string;
  google_rating?: string;
  google_reviews_count?: string;
  google_maps_url?: string;
  booking_interval?: string;
  min_booking_notice_hours?: string;
  max_booking_window_days?: string;
  cancellation_policy?: string;
  timezone?: string;
  hero_headline?: string;
  hero_subheadline?: string;
  [key: string]: string | undefined;
}
