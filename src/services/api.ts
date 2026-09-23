import { Appointment, BusinessHour, BusinessSettings, Customer, GalleryItem, Review, Service, ServicePackage, Staff, TimeSlot } from '../types';

export interface BootstrapResponse {
  settings: BusinessSettings;
  hours: BusinessHour[];
  services: Service[];
  packages: ServicePackage[];
  staff: Staff[];
  reviews: Review[];
  gallery: GalleryItem[];
}

export const api = {
  async getBootstrap(): Promise<BootstrapResponse> {
    const res = await fetch('/api/bootstrap');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to load data');
    return json.data;
  },

  async getAvailability(params: {
    date: string;
    service_id?: string;
    package_id?: string;
    staff_id?: string;
  }): Promise<{
    isOpen: boolean;
    reason?: string;
    slots: TimeSlot[];
    duration?: number;
    itemTitle?: string;
    itemPrice?: number;
  }> {
    const searchParams = new URLSearchParams();
    searchParams.set('date', params.date);
    if (params.service_id) searchParams.set('service_id', params.service_id);
    if (params.package_id) searchParams.set('package_id', params.package_id);
    if (params.staff_id) searchParams.set('staff_id', params.staff_id);

    const res = await fetch(`/api/availability?${searchParams.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Availability check failed');
    return json;
  },

  async createAppointment(data: {
    service_id?: string;
    package_id?: string;
    staff_id?: string;
    date: string;
    time: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    notes?: string;
  }): Promise<any> {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Booking failed');
    return json.data;
  },

  async lookupAppointment(reference: string): Promise<Appointment> {
    const res = await fetch(`/api/appointments/lookup/${encodeURIComponent(reference.trim())}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Appointment not found');
    return json.data;
  },

  async cancelAppointment(id: string, reason?: string): Promise<void> {
    const res = await fetch(`/api/appointments/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Cancellation failed');
  },

  async rescheduleAppointment(id: string, date: string, time: string): Promise<void> {
    const res = await fetch(`/api/appointments/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Reschedule failed');
  },

  async customerAuth(phone: string, name?: string, email?: string): Promise<{ customer: Customer; appointments: Appointment[] }> {
    const res = await fetch('/api/customer/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, email })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Customer authentication failed');
    return json.data;
  },

  // Admin APIs
  async adminGetStatus(): Promise<{ hasAdmin: boolean; adminEmail?: string }> {
    const res = await fetch('/api/admin/status');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to check admin status');
    return json.data;
  },

  async adminSetup(data: { name: string; email: string; password: string; phone?: string }): Promise<{ token: string; user: any }> {
    const res = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Admin account creation failed');
    return json.data;
  },

  async adminLogin(email: string, password: string): Promise<{ token: string; user: any }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Login failed');
    return json.data;
  },

  async adminGetDashboardStats(): Promise<any> {
    const res = await fetch('/api/admin/dashboard-stats');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async adminGetAppointments(filters?: { date?: string; status?: string; staff_id?: string; search?: string }): Promise<Appointment[]> {
    const sp = new URLSearchParams();
    if (filters?.date) sp.set('date', filters.date);
    if (filters?.status) sp.set('status', filters.status);
    if (filters?.staff_id) sp.set('staff_id', filters.staff_id);
    if (filters?.search) sp.set('search', filters.search);

    const res = await fetch(`/api/admin/appointments?${sp.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async adminUpdateAppointmentStatus(id: string, status: string): Promise<void> {
    const res = await fetch(`/api/admin/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async adminGetCustomers(search?: string): Promise<Customer[]> {
    const sp = new URLSearchParams();
    if (search) sp.set('search', search);
    const res = await fetch(`/api/admin/customers?${sp.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async adminSaveService(service: Partial<Service>, id?: string): Promise<void> {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/admin/services/${id}` : '/api/admin/services';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async adminDeleteService(id: string): Promise<void> {
    const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async adminSaveStaff(staff: Partial<Staff>, id?: string): Promise<void> {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/admin/staff/${id}` : '/api/admin/staff';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async adminDeleteStaff(id: string): Promise<void> {
    const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async adminSaveHours(hours: BusinessHour[]): Promise<void> {
    const res = await fetch('/api/admin/hours', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async adminGetBlockedDates(): Promise<any[]> {
    const res = await fetch('/api/admin/blocked-dates');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  },

  async adminAddBlockedDate(data: { start_date: string; end_date?: string; reason?: string }): Promise<void> {
    const res = await fetch('/api/admin/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async adminDeleteBlockedDate(id: string): Promise<void> {
    const res = await fetch(`/api/admin/blocked-dates/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  },

  async adminSaveSettings(settings: Record<string, string>): Promise<void> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  }
};
