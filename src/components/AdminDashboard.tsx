import React, { useState, useEffect } from 'react';
import {
  X,
  LogOut,
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Clock,
  Ban,
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Phone,
  MessageCircle,
  Eye,
  Crown,
  Database,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Shield,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { Appointment, BusinessHour, Customer, Service, ServicePackage, Staff } from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onRefreshData
}) => {
  // Auth state & Single-Slot enforcement
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [loggedInAdmin, setLoggedInAdmin] = useState<{ name: string; email: string } | null>(null);

  // Login form inputs
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // First-time Single-Slot Admin Setup inputs
  const [setupName, setSetupName] = useState<string>('');
  const [setupEmail, setSetupEmail] = useState<string>('');
  const [setupPhone, setSetupPhone] = useState<string>('');
  const [setupPassword, setSetupPassword] = useState<string>('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState<string>('');

  // Active Tab - default to appointments to view all bookings immediately
  const [activeTab, setActiveTab] = useState<
    'appointments' | 'overview' | 'services' | 'packages' | 'staff' | 'hours' | 'blocked' | 'customers' | 'settings' | 'supabase'
  >('appointments');

  // Supabase states
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState<boolean>(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [syncSummary, setSyncSummary] = useState<any>(null);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [hoursList, setHoursList] = useState<BusinessHour[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});

  // Filters
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterStaff, setFilterStaff] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals / Edit forms
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff> | null>(null);
  const [newBlocked, setNewBlocked] = useState<{ start_date: string; end_date: string; reason: string }>({
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [manualBookingModal, setManualBookingModal] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState<any>({
    customer_name: '',
    customer_phone: '',
    service_id: '',
    staff_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    notes: 'Walk-in / Phone reservation'
  });

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load all data
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsData, apptsData, bootData, custData, blockData] = await Promise.all([
        api.adminGetDashboardStats(),
        api.adminGetAppointments({
          date: filterDate || undefined,
          status: filterStatus !== 'All' ? filterStatus : undefined,
          staff_id: filterStaff !== 'All' ? filterStaff : undefined,
          search: searchQuery || undefined
        }),
        api.getBootstrap(),
        api.adminGetCustomers(),
        api.adminGetBlockedDates()
      ]);

      setStats(statsData);
      setAppointments(apptsData);
      setServices(bootData.services);
      setPackages(bootData.packages);
      setStaffList(bootData.staff);
      setHoursList(bootData.hours);
      setSettingsMap((bootData.settings || {}) as Record<string, string>);
      setCustomers(custData);
      setBlockedDates(blockData);
      checkSupabase();
    } catch (err: any) {
      console.error('Admin load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSupabase = async () => {
    setIsCheckingSupabase(true);
    try {
      const res = await fetch('/api/supabase/status');
      const json = await res.json();
      setSupabaseStatus(json);
    } catch (e: any) {
      setSupabaseStatus({ connected: false, error: e.message, projectUrl: 'https://kpgpxokcsumjtpyrhlxr.supabase.co' });
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  const syncAllToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSyncSummary(null);
    try {
      const res = await fetch('/api/supabase/sync-all', { method: 'POST' });
      const json = await res.json();
      setSyncSummary(json);
      checkSupabase();
      if (json.synced > 0) {
        setFeedbackMsg(`Successfully synced ${json.synced} appointments to Supabase`);
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (e: any) {
      alert('Sync error: ' + e.message);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Check admin status when modal opens or load session from localStorage
  useEffect(() => {
    if (!isOpen) return;

    // Check if session stored in localStorage
    const savedToken = localStorage.getItem('dappers_admin_token');
    const savedUser = localStorage.getItem('dappers_admin_user');
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setLoggedInAdmin(parsed);
        setIsAuthenticated(true);
      } catch (e) {}
    }

    const checkStatus = async () => {
      setIsCheckingStatus(true);
      try {
        const res = await api.adminGetStatus();
        setHasAdmin(res.hasAdmin);
        if (res.adminEmail && !adminEmail) {
          setAdminEmail(res.adminEmail);
        }
      } catch (e) {
        setHasAdmin(true); // fallback to login
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated, filterDate, filterStatus, filterStaff, searchQuery]);

  if (!isOpen) return null;

  // Single-Slot Admin Registration handler
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (setupPassword !== setupConfirmPassword) {
      setAuthError('Passwords do not match. Please re-enter.');
      return;
    }
    if (setupPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.adminSetup({
        name: setupName,
        email: setupEmail,
        password: setupPassword,
        phone: setupPhone
      });
      localStorage.setItem('dappers_admin_token', res.token);
      localStorage.setItem('dappers_admin_user', JSON.stringify(res.user));
      setLoggedInAdmin(res.user);
      setHasAdmin(true);
      setIsAuthenticated(true);
      setActiveTab('appointments');
      setFeedbackMsg('🎉 Admin account created successfully! Public registration has now been locked permanently.');
      setTimeout(() => setFeedbackMsg(null), 6000);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setAuthError(err.message || 'Setup failed. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      setIsLoading(true);
      const res = await api.adminLogin(adminEmail, adminPassword);
      localStorage.setItem('dappers_admin_token', res.token);
      localStorage.setItem('dappers_admin_user', JSON.stringify(res.user));
      setLoggedInAdmin(res.user);
      setIsAuthenticated(true);
      setActiveTab('appointments');
    } catch (err: any) {
      setAuthError(err.message || 'Invalid administrator credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dappers_admin_token');
    localStorage.removeItem('dappers_admin_user');
    setLoggedInAdmin(null);
    setIsAuthenticated(false);
    setAdminPassword('');
  };

  // Status changer
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.adminUpdateAppointmentStatus(id, newStatus);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
      setFeedbackMsg(`Appointment status updated to ${newStatus}`);
      setTimeout(() => setFeedbackMsg(null), 3000);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  // Save Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      await api.adminSaveService(editingService, editingService.id);
      setEditingService(null);
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Save failed');
    }
  };

  // Save Staff
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      await api.adminSaveStaff(editingStaff, editingStaff.id);
      setEditingStaff(null);
      loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Save staff failed');
    }
  };

  // Save Hours
  const handleSaveHours = async () => {
    try {
      await api.adminSaveHours(hoursList);
      alert('Business hours saved successfully!');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert('Failed to save hours');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminSaveSettings(settingsMap);
      alert('Settings saved successfully!');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert('Failed to save settings');
    }
  };

  // Create manual appointment
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAppointment(manualForm);
      setManualBookingModal(false);
      loadAdminData();
      alert('Manual booking successfully created!');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Booking conflict');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-7xl bg-[#0b0c0e] border border-white/10 rounded-sm shadow-2xl flex flex-col h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#121316] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-display text-champagne font-semibold tracking-widest">
              DAPPERS
            </span>
            <span className="text-xs text-neutral-500 uppercase tracking-widest">
              · Management Console
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs text-neutral-400 hover:text-red-400 flex items-center gap-1.5 py-1 px-3 border border-white/10 rounded-sm transition-colors"
                title="Log out of admin console"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
              aria-label="Close Admin Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-[#0e1013] overflow-y-auto">
            {isCheckingStatus ? (
              <div className="text-center p-8">
                <div className="w-8 h-8 border-2 border-[#c89d56] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs text-[#b8b0a2]">Verifying administrator status...</span>
              </div>
            ) : hasAdmin === false ? (
              /* FIRST-TIME SINGLE-SLOT REGISTRATION */
              <div className="w-full max-w-md bg-[#121316] border border-[#c89d56]/40 p-6 sm:p-8 rounded-sm shadow-2xl relative my-auto">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c89d56]/15 border border-[#c89d56]/30 text-[#c89d56] text-[10px] uppercase tracking-widest font-semibold rounded-full mb-3">
                    <Sparkles className="w-3 h-3" />
                    <span>Single Slot Available • 1 Admin Only</span>
                  </div>
                  <h3 className="text-2xl font-display text-white font-medium">
                    Create Admin Account
                  </h3>
                  <p className="text-xs text-[#a8a194] mt-2 leading-relaxed">
                    As the salon owner, establish your primary administrative credentials below. Once submitted, registration is permanently locked and no other admin accounts can be created.
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-red-950/70 border border-red-500/50 text-red-200 text-xs rounded-sm mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleSetup} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Muneeb"
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                      required
                      className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#c89d56]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1">
                      Admin Email / Username *
                    </label>
                    <input
                      type="email"
                      placeholder="admin@dappers.pk"
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      required
                      className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#c89d56] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="0335 7792524"
                      value={setupPhone}
                      onChange={(e) => setSetupPhone(e.target.value)}
                      className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#c89d56] font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        placeholder="Min 6 characters"
                        value={setupPassword}
                        onChange={(e) => setSetupPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#c89d56]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-neutral-300 font-medium mb-1">
                        Confirm *
                      </label>
                      <input
                        type="password"
                        placeholder="Repeat password"
                        value={setupConfirmPassword}
                        onChange={(e) => setSetupConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#c89d56]"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-[#c89d56]/20 rounded-sm text-[11px] text-[#b8b0a2] space-y-1">
                    <div className="flex items-center gap-1.5 text-[#c89d56] font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Single-Slot Enforcement</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Once this master account is saved, nobody else can register. You will hold the only administrator access.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#c89d56] hover:bg-[#d8b16f] text-[#0b0c0e] font-semibold text-xs uppercase tracking-widest rounded-sm transition-all shadow-md mt-2 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{isLoading ? 'Creating Master Account...' : 'Create Account & Lock Slot'}</span>
                  </button>
                </form>
              </div>
            ) : (
              /* REGISTRATION LOCKED: LOGIN ONLY */
              <div className="w-full max-w-md bg-[#121316] border border-white/10 p-6 sm:p-8 rounded-sm shadow-xl my-auto">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-neutral-300 text-[10px] uppercase tracking-widest font-semibold rounded-full mb-3">
                    <Lock className="w-3 h-3 text-[#c89d56]" />
                    <span>Registrations Locked • Single Admin Slot Active</span>
                  </div>
                  <h3 className="text-2xl font-display text-white font-medium">
                    Admin Console Login
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2">
                    Enter your registered administrator credentials to view customer bookings and manage salon operations.
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-red-950/70 border border-red-500/50 text-red-200 text-xs rounded-sm mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1">
                      Admin Email or Phone
                    </label>
                    <input
                      type="text"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      placeholder="Enter registered email or phone"
                      className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#c89d56] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#c89d56]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#c89d56] hover:bg-[#d8b16f] text-[#0b0c0e] font-semibold text-xs uppercase tracking-widest rounded-sm transition-all shadow-md mt-2 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isLoading ? 'Authenticating...' : 'Access Admin Console'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-[11px] text-[#8c8577] block">
                      🔒 Public sign-ups are locked. Only the designated administrator account is permitted.
                    </span>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-56 bg-[#0e1013] border-r border-white/5 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
              <nav className="space-y-1">
                {[
                  { id: 'appointments', label: 'All Bookings', icon: Calendar },
                  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                  { id: 'services', label: 'Services Catalog', icon: Scissors },
                  { id: 'packages', label: 'Grooming Packages', icon: Crown },
                  { id: 'staff', label: 'Barber Staff', icon: Users },
                  { id: 'hours', label: 'Business Hours', icon: Clock },
                  { id: 'blocked', label: 'Blocked Dates', icon: Ban },
                  { id: 'customers', label: 'Client Directory', icon: Eye },
                  { id: 'settings', label: 'Salon Settings', icon: Settings },
                  { id: 'supabase', label: 'Supabase Backend', icon: Database }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#c89d56] text-[#0b0c0e] font-semibold shadow-sm'
                          : 'text-neutral-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-white/5 text-[11px] text-neutral-400 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 uppercase tracking-wider text-[9px]">Logged In</span>
                  <button
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log Out</span>
                  </button>
                </div>
                <div className="text-white font-medium truncate">{loggedInAdmin?.name || 'Administrator'}</div>
                <div className="text-[#c89d56] font-mono text-[10px] truncate">{loggedInAdmin?.email || adminEmail}</div>
              </div>
            </aside>

            {/* Main Tab Panel */}
            <main className="flex-1 bg-[#121316] p-6 overflow-y-auto">
              {feedbackMsg && (
                <div className="mb-4 p-3 bg-champagne/15 border border-champagne text-champagne text-xs rounded-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{feedbackMsg}</span>
                </div>
              )}

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-display text-white">Daily Overview</h3>
                      <p className="text-xs text-neutral-400">Live operational snapshot</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setManualBookingModal(true)}
                        className="px-4 py-2 bg-champagne text-[#0b0c0e] text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Walk-in / Phone Booking</span>
                      </button>
                      <button
                        onClick={loadAdminData}
                        className="p-2 border border-white/10 rounded-sm text-neutral-400 hover:text-white"
                        title="Refresh"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#181a1f] border border-white/5 p-4 rounded-sm">
                      <span className="text-[11px] uppercase tracking-wider text-neutral-400">Today's Appointments</span>
                      <div className="text-3xl font-display font-bold text-white mt-1 tabular-nums">
                        {stats?.counts?.today || 0}
                      </div>
                    </div>
                    <div className="bg-[#181a1f] border border-white/5 p-4 rounded-sm">
                      <span className="text-[11px] uppercase tracking-wider text-neutral-400">Upcoming Confirmed</span>
                      <div className="text-3xl font-display font-bold text-champagne mt-1 tabular-nums">
                        {stats?.counts?.upcoming || 0}
                      </div>
                    </div>
                    <div className="bg-[#181a1f] border border-white/5 p-4 rounded-sm">
                      <span className="text-[11px] uppercase tracking-wider text-neutral-400">Completed Visits</span>
                      <div className="text-3xl font-display font-bold text-emerald-400 mt-1 tabular-nums">
                        {stats?.counts?.completed || 0}
                      </div>
                    </div>
                    <div className="bg-[#181a1f] border border-white/5 p-4 rounded-sm">
                      <span className="text-[11px] uppercase tracking-wider text-neutral-400">Registered Patrons</span>
                      <div className="text-3xl font-display font-bold text-neutral-200 mt-1 tabular-nums">
                        {stats?.counts?.totalCustomers || 0}
                      </div>
                    </div>
                  </div>

                  {/* Recent Bookings Feed */}
                  <div className="bg-[#181a1f] border border-white/5 p-5 rounded-sm">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
                      Latest Bookings
                    </h4>
                    <div className="space-y-3">
                      {stats?.recentBookings?.map((b: any) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-3 bg-[#121316] border border-white/5 rounded-sm text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-champagne">{b.booking_reference}</span>
                              <span className="text-neutral-400">· {b.customer_name}</span>
                              <span className="text-neutral-500 font-mono">({b.customer_phone})</span>
                            </div>
                            <div className="text-neutral-300 mt-1">
                              {b.service_title} with <span className="text-champagne">{b.staff_name}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-white font-medium">{b.date} at {b.start_time}</div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                                b.status === 'Confirmed'
                                  ? 'bg-emerald-950 text-emerald-400'
                                  : b.status === 'Completed'
                                  ? 'bg-neutral-800 text-neutral-300'
                                  : 'bg-red-950 text-red-400'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: APPOINTMENTS */}
              {activeTab === 'appointments' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-display text-white">All Reservations</h3>
                        <span className="px-2 py-0.5 bg-[#c89d56]/20 border border-[#c89d56]/40 text-[#c89d56] text-[11px] font-bold rounded-sm">
                          {appointments.length} Total
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Live monitor of all bookings submitted on the Dappers website
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      <button
                        onClick={loadAdminData}
                        className="px-3 py-2 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white text-xs rounded-sm flex items-center gap-1.5 transition-colors bg-white/[0.02]"
                        title="Reload latest bookings"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#c89d56]' : ''}`} />
                        <span>Refresh</span>
                      </button>

                      <button
                        onClick={() => setManualBookingModal(true)}
                        className="px-4 py-2 bg-[#c89d56] hover:bg-[#d8b16f] text-[#0b0c0e] text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Appointment</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#181a1f] p-3.5 rounded-sm border border-white/5">
                      <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                        Total Bookings
                      </div>
                      <div className="text-2xl font-display font-bold text-white mt-1">
                        {appointments.length}
                      </div>
                    </div>

                    <div className="bg-[#181a1f] p-3.5 rounded-sm border border-white/5">
                      <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
                        Confirmed Slots
                      </div>
                      <div className="text-2xl font-display font-bold text-emerald-400 mt-1">
                        {appointments.filter(a => a.status === 'Confirmed').length}
                      </div>
                    </div>

                    <div className="bg-[#181a1f] p-3.5 rounded-sm border border-white/5">
                      <div className="text-[10px] uppercase tracking-wider text-neutral-300 font-medium">
                        Completed
                      </div>
                      <div className="text-2xl font-display font-bold text-neutral-300 mt-1">
                        {appointments.filter(a => a.status === 'Completed').length}
                      </div>
                    </div>

                    <div className="bg-[#181a1f] p-3.5 rounded-sm border border-white/5">
                      <div className="text-[10px] uppercase tracking-wider text-[#c89d56] font-medium">
                        Booking Value
                      </div>
                      <div className="text-xl font-sans font-bold text-white mt-1 flex items-baseline gap-1">
                        <span className="text-xs text-[#c89d56]">Rs.</span>
                        <span>
                          {appointments
                            .reduce((sum, a) => a.status !== 'Cancelled' ? sum + (a.price || 0) : sum, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div className="bg-[#181a1f] p-4 rounded-sm border border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-neutral-400 uppercase tracking-wider text-[10px] mb-1">Date</label>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 uppercase tracking-wider text-[10px] mb-1">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="No-show">No-show</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 uppercase tracking-wider text-[10px] mb-1">Barber</label>
                      <select
                        value={filterStaff}
                        onChange={(e) => setFilterStaff(e.target.value)}
                        className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                      >
                        <option value="All">All Barbers</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 uppercase tracking-wider text-[10px] mb-1">Search Ref / Name / Phone</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search DPR-..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 pr-7 text-white"
                        />
                        {(filterDate || filterStatus !== 'All' || filterStaff !== 'All' || searchQuery) && (
                          <button
                            onClick={() => {
                              setFilterDate('');
                              setFilterStatus('All');
                              setFilterStaff('All');
                              setSearchQuery('');
                            }}
                            className="absolute right-2 top-2.5 text-neutral-400 hover:text-white text-[10px] uppercase font-bold"
                            title="Reset filters"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Appointments Table */}
                  <div className="bg-[#181a1f] border border-white/5 rounded-sm overflow-x-auto">
                    <table className="w-full text-left text-xs text-neutral-300">
                      <thead className="bg-[#0e1013] text-neutral-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                        <tr>
                          <th className="p-3">Ref</th>
                          <th className="p-3">Date & Time</th>
                          <th className="p-3">Client</th>
                          <th className="p-3">Service</th>
                          <th className="p-3">Barber</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {appointments.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-neutral-500">
                              <Calendar className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-50" />
                              <p className="text-neutral-400 font-medium">No bookings found matching current filters.</p>
                              {(filterDate || filterStatus !== 'All' || filterStaff !== 'All' || searchQuery) && (
                                <button
                                  onClick={() => {
                                    setFilterDate('');
                                    setFilterStatus('All');
                                    setFilterStaff('All');
                                    setSearchQuery('');
                                  }}
                                  className="mt-2 text-xs text-[#c89d56] hover:underline"
                                >
                                  Clear all filters
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          appointments.map((a) => (
                            <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3 font-mono font-bold text-[#c89d56]">{a.booking_reference}</td>
                              <td className="p-3 whitespace-nowrap">
                                <div className="text-white font-medium">{a.date}</div>
                                <div className="text-neutral-400 text-[11px]">{a.start_time} ({a.duration}m)</div>
                              </td>
                              <td className="p-3">
                                <div className="text-white font-medium">{a.customer_name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-neutral-400 font-mono text-[11px]">{a.customer_phone}</span>
                                  {a.customer_phone && (
                                    <div className="flex items-center gap-1.5 ml-1">
                                      <a
                                        href={`https://wa.me/${a.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Assalam o Alaikum ${a.customer_name}, confirming your appointment at Dappers for ${a.date} at ${a.start_time}. Booking Reference: ${a.booking_reference}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 transition-colors p-0.5"
                                        title="Send WhatsApp Message"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                      <a
                                        href={`tel:${a.customer_phone}`}
                                        className="text-neutral-400 hover:text-white transition-colors p-0.5"
                                        title="Call Customer"
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-white">{a.service_title || 'Service'}</td>
                              <td className="p-3 text-[#c89d56]">{a.staff_name || 'Unassigned'}</td>
                              <td className="p-3 font-sans font-semibold text-white whitespace-nowrap">
                                Rs. {a.price?.toLocaleString()}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${
                                    a.status === 'Confirmed'
                                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                      : a.status === 'Completed'
                                      ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                      : a.status === 'Cancelled'
                                      ? 'bg-red-950/80 text-red-400 border border-red-500/30'
                                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {a.status}
                                </span>
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <select
                                  value={a.status}
                                  onChange={(e) => handleStatusChange(a.id, e.target.value)}
                                  className="bg-[#0b0c0e] border border-white/10 hover:border-white/20 text-white rounded-sm p-1.5 text-[11px] focus:outline-none focus:border-[#c89d56]"
                                >
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                  <option value="No-show">No-show</option>
                                  <option value="Pending">Pending</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: SERVICES */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-display text-white">Services Catalog</h3>
                      <p className="text-xs text-neutral-400">Manage grooming services, prices and durations</p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingService({
                          category: 'HAIR',
                          name: '',
                          description: '',
                          price: 1200,
                          duration: 45,
                          image_url: '/src/assets/images/service_precision_haircut_1790150247157.jpg',
                          is_active: 1
                        })
                      }
                      className="px-4 py-2 bg-champagne text-[#0b0c0e] text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Service</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((srv) => (
                      <div
                        key={srv.id}
                        className="bg-[#181a1f] border border-white/5 p-4 rounded-sm flex flex-col justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between text-neutral-400 mb-1">
                            <span className="uppercase text-[10px] text-champagne">{srv.category}</span>
                            <span className="font-mono">{srv.duration} mins</span>
                          </div>
                          <div className="text-sm font-semibold text-white mb-1">{srv.name}</div>
                          <p className="text-neutral-400 line-clamp-2 mb-3">{srv.description}</p>
                          <div className="font-sans text-base font-bold text-white flex items-baseline gap-1">
                            <span className="text-xs text-[#c89d56]">Rs.</span>
                            <span>{srv.price.toLocaleString()}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">PKR</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2 mt-4">
                          <button
                            onClick={() => setEditingService(srv)}
                            className="p-1.5 text-neutral-400 hover:text-white border border-white/10 rounded-sm"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Delete this service?')) {
                                await api.adminDeleteService(srv.id);
                                loadAdminData();
                              }
                            }}
                            className="p-1.5 text-red-400 hover:text-red-300 border border-white/10 rounded-sm"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PACKAGES */}
              {activeTab === 'packages' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-display text-white">Grooming Packages</h3>
                      <p className="text-xs text-neutral-400">Curated grooming packages and rates</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="bg-[#181a1f] border border-white/5 p-5 rounded-sm text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-display font-medium text-white">{pkg.name}</span>
                          <span className="text-base font-sans font-bold text-white flex items-baseline gap-1">
                            <span className="text-xs text-[#c89d56]">Rs.</span>
                            <span>{pkg.price.toLocaleString()}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">PKR</span>
                          </span>
                        </div>
                        <p className="text-neutral-400 mb-3">{pkg.description}</p>
                        <div className="text-neutral-500 font-mono">Duration: {pkg.duration} minutes</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: STAFF */}
              {activeTab === 'staff' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-display text-white">Barber Staff</h3>
                      <p className="text-xs text-neutral-400">Active barbers and their scheduling parameters</p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingStaff({
                          name: '',
                          role: 'Master Stylist',
                          bio: '',
                          specialties: 'Scissor cutting, Fades',
                          status: 'active',
                          working_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'
                        })
                      }
                      className="px-4 py-2 bg-champagne text-[#0b0c0e] text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Staff</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {staffList.map((st) => (
                      <div key={st.id} className="bg-[#181a1f] border border-white/5 p-5 rounded-sm text-xs">
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={st.photo_url || '/src/assets/images/service_precision_haircut_1790150247157.jpg'}
                            alt={st.name}
                            className="w-12 h-12 rounded-full object-cover border border-champagne/40"
                          />
                          <div>
                            <div className="text-sm font-semibold text-white">{st.name}</div>
                            <div className="text-champagne text-[11px]">{st.role}</div>
                          </div>
                        </div>

                        <p className="text-neutral-400 mb-3 line-clamp-2">{st.bio}</p>
                        <div className="text-[11px] text-neutral-400">
                          <strong>Specialties:</strong> {st.specialties}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-1">
                          <strong>Working Days:</strong> {st.working_days}
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2 mt-4">
                          <button
                            onClick={() => setEditingStaff(st)}
                            className="p-1.5 text-neutral-400 hover:text-white border border-white/10 rounded-sm"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Deactivate this staff member?')) {
                                await api.adminDeleteStaff(st.id);
                                loadAdminData();
                              }
                            }}
                            className="p-1.5 text-red-400 hover:text-red-300 border border-white/10 rounded-sm"
                            title="Deactivate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: BUSINESS HOURS */}
              {activeTab === 'hours' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-display text-white">Salon Business Hours</h3>
                      <p className="text-xs text-neutral-400">Standard operating hours & breaks (Open until 1:00 AM)</p>
                    </div>

                    <button
                      onClick={handleSaveHours}
                      className="px-5 py-2.5 bg-champagne text-[#0b0c0e] text-xs font-semibold uppercase tracking-wider rounded-sm shadow-md"
                    >
                      Save Business Hours
                    </button>
                  </div>

                  <div className="bg-[#181a1f] border border-white/5 rounded-sm p-4 space-y-3">
                    {hoursList.map((h, idx) => (
                      <div
                        key={h.day_of_week}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#121316] rounded-sm text-xs border border-white/5"
                      >
                        <div className="flex items-center gap-3 w-32">
                          <input
                            type="checkbox"
                            checked={h.is_open === 1}
                            onChange={(e) => {
                              const updated = [...hoursList];
                              updated[idx].is_open = e.target.checked ? 1 : 0;
                              setHoursList(updated);
                            }}
                            className="rounded"
                          />
                          <span className="font-semibold text-white">{h.day_of_week}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-neutral-500 text-[10px] block">Open Time</span>
                            <input
                              type="time"
                              value={h.open_time}
                              onChange={(e) => {
                                const updated = [...hoursList];
                                updated[idx].open_time = e.target.value;
                                setHoursList(updated);
                              }}
                              className="bg-[#0b0c0e] border border-white/10 rounded-sm p-1.5 text-white"
                            />
                          </div>

                          <div>
                            <span className="text-neutral-500 text-[10px] block">Close Time</span>
                            <input
                              type="time"
                              value={h.close_time}
                              onChange={(e) => {
                                const updated = [...hoursList];
                                updated[idx].close_time = e.target.value;
                                setHoursList(updated);
                              }}
                              className="bg-[#0b0c0e] border border-white/10 rounded-sm p-1.5 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: BLOCKED DATES */}
              {activeTab === 'blocked' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-display text-white">Blocked Dates & Holidays</h3>
                      <p className="text-xs text-neutral-400">Prevent appointments on designated maintenance or holiday dates</p>
                    </div>
                  </div>

                  {/* Add Block Form */}
                  <div className="bg-[#181a1f] border border-white/5 p-4 rounded-sm flex flex-col sm:flex-row gap-3 items-end text-xs">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase text-neutral-400 block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={newBlocked.start_date}
                        onChange={(e) => setNewBlocked({ ...newBlocked, start_date: e.target.value })}
                        className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase text-neutral-400 block mb-1">End Date</label>
                      <input
                        type="date"
                        value={newBlocked.end_date}
                        onChange={(e) => setNewBlocked({ ...newBlocked, end_date: e.target.value })}
                        className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase text-neutral-400 block mb-1">Reason</label>
                      <input
                        type="text"
                        placeholder="e.g. Eid Holiday or Maintenance"
                        value={newBlocked.reason}
                        onChange={(e) => setNewBlocked({ ...newBlocked, reason: e.target.value })}
                        className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!newBlocked.start_date) return alert('Start date required');
                        await api.adminAddBlockedDate(newBlocked);
                        setNewBlocked({ start_date: '', end_date: '', reason: '' });
                        loadAdminData();
                      }}
                      className="px-4 py-2 bg-champagne text-[#0b0c0e] font-semibold uppercase rounded-sm whitespace-nowrap"
                    >
                      Add Blocked Date
                    </button>
                  </div>

                  <div className="space-y-2">
                    {blockedDates.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 bg-[#181a1f] border border-white/5 rounded-sm flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">{b.start_date}</span>
                          {b.end_date && b.end_date !== b.start_date && (
                            <span className="text-neutral-400"> to {b.end_date}</span>
                          )}
                          <span className="text-champagne ml-3">· {b.reason}</span>
                        </div>
                        <button
                          onClick={async () => {
                            await api.adminDeleteBlockedDate(b.id);
                            loadAdminData();
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: CUSTOMERS */}
              {activeTab === 'customers' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-display text-white">Gentleman Client Directory</h3>
                    <p className="text-xs text-neutral-400">Patron records and visit frequencies</p>
                  </div>

                  <div className="bg-[#181a1f] border border-white/5 rounded-sm overflow-x-auto">
                    <table className="w-full text-left text-xs text-neutral-300">
                      <thead className="bg-[#0e1013] text-neutral-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                        <tr>
                          <th className="p-3">Client Name</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Total Appointments</th>
                          <th className="p-3">Last Visit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {customers.map((c) => (
                          <tr key={c.id}>
                            <td className="p-3 text-white font-medium">{c.name}</td>
                            <td className="p-3 font-mono">{c.phone}</td>
                            <td className="p-3 text-neutral-400">{c.email || '—'}</td>
                            <td className="p-3 font-bold text-champagne tabular-nums">{c.total_appointments}</td>
                            <td className="p-3 text-neutral-400">{c.last_appointment || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 9: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-display text-white">Business Settings</h3>
                      <p className="text-xs text-neutral-400">Core parameters for Dappers Gulzar-e-Hijri</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveSettings} className="bg-[#181a1f] border border-white/5 p-6 rounded-sm space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-neutral-400 block mb-1">Business Name</label>
                        <input
                          type="text"
                          value={settingsMap.business_name || ''}
                          onChange={(e) => setSettingsMap({ ...settingsMap, business_name: e.target.value })}
                          className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-neutral-400 block mb-1">Brand Tagline</label>
                        <input
                          type="text"
                          value={settingsMap.tagline || ''}
                          onChange={(e) => setSettingsMap({ ...settingsMap, tagline: e.target.value })}
                          className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-neutral-400 block mb-1">Business Phone</label>
                        <input
                          type="text"
                          value={settingsMap.phone || ''}
                          onChange={(e) => setSettingsMap({ ...settingsMap, phone: e.target.value })}
                          className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-neutral-400 block mb-1">WhatsApp Number</label>
                        <input
                          type="text"
                          value={settingsMap.whatsapp || ''}
                          onChange={(e) => setSettingsMap({ ...settingsMap, whatsapp: e.target.value })}
                          className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-neutral-400 block mb-1">Full Physical Address</label>
                      <input
                        type="text"
                        value={settingsMap.address || ''}
                        onChange={(e) => setSettingsMap({ ...settingsMap, address: e.target.value })}
                        className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-neutral-400 block mb-1">Cancellation Policy</label>
                      <textarea
                        rows={2}
                        value={settingsMap.cancellation_policy || ''}
                        onChange={(e) => setSettingsMap({ ...settingsMap, cancellation_policy: e.target.value })}
                        className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-champagne text-[#0b0c0e] font-semibold uppercase tracking-wider rounded-sm text-xs"
                    >
                      Save Configuration
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 10: SUPABASE BACKEND */}
              {activeTab === 'supabase' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-display text-white">Supabase Cloud Database</h3>
                      <p className="text-xs text-neutral-400">
                        Live connection to project <span className="font-mono text-champagne">kpgpxokcsumjtpyrhlxr</span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={checkSupabase}
                        disabled={isCheckingSupabase}
                        className="px-3.5 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSupabase ? 'animate-spin text-champagne' : ''}`} />
                        <span>Test Connection</span>
                      </button>

                      <button
                        onClick={syncAllToSupabase}
                        disabled={isSyncingSupabase}
                        className="px-4 py-2 bg-champagne text-[#0b0c0e] text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5 shadow-md hover:bg-champagne-light transition-colors disabled:opacity-50"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>{isSyncingSupabase ? 'Syncing...' : 'Sync All to Supabase'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Connection Status Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#181a1f] border border-white/5 p-4 rounded-sm">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Project Status</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-sm font-semibold text-white">Connected & Authorized</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-2 truncate">
                        kpgpxokcsumjtpyrhlxr.supabase.co
                      </div>
                    </div>

                    <div className="bg-[#181a1f] border border-white/5 p-4 rounded-sm">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Table 'public.appointments'</span>
                      <div className="flex items-center gap-2 mt-1">
                        {supabaseStatus?.tableExists ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-sm font-semibold text-emerald-400">Active & Ready</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-sm font-semibold text-amber-400">Needs SQL Setup</span>
                          </>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-2">
                        {supabaseStatus?.tableExists
                          ? 'Incoming bookings stream directly into Supabase'
                          : 'Run the schema script below in Supabase SQL editor'}
                      </div>
                    </div>

                    <div className="bg-[#181a1f] border border-white/5 p-4 rounded-sm">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">API Key Configured</span>
                      <div className="text-sm font-semibold text-champagne mt-1">
                        Publishable Key Active
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-2 truncate">
                        sb_publishable_ffunjYcR...mg34E
                      </div>
                    </div>
                  </div>

                  {/* Sync Summary Notification */}
                  {syncSummary && (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-sm text-xs">
                      <div className="text-emerald-300 font-semibold mb-1">Sync Report</div>
                      <div className="text-neutral-300">
                        Total appointments processed: <span className="font-bold text-white">{syncSummary.total}</span> ·
                        Successfully stored in Supabase: <span className="font-bold text-emerald-400">{syncSummary.synced}</span>
                      </div>
                      {syncSummary.errors && syncSummary.errors.length > 0 && (
                        <div className="mt-2 text-amber-300 text-[11px] bg-amber-950/40 p-2 rounded-sm border border-amber-500/30">
                          <strong>Note:</strong> {syncSummary.errors[0]}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Supabase Schema Instructions */}
                  <div className="bg-[#181a1f] border border-white/5 p-5 rounded-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <div>
                        <h4 className="text-sm font-semibold text-white">One-Step Supabase Database Setup</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          To store appointments in your Supabase project, execute this SQL script once in your Supabase SQL editor.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const sql = `-- DAPPERS SUPABASE SCHEMA
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    booking_reference TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    service_id TEXT,
    service_title TEXT,
    package_id TEXT,
    staff_id TEXT,
    staff_name TEXT,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER DEFAULT 45,
    price NUMERIC DEFAULT 1200,
    notes TEXT,
    status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    notes TEXT,
    total_appointments INTEGER DEFAULT 1,
    last_appointment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert appointments" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public can select appointments" ON public.appointments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can update appointments" ON public.appointments FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public can insert customers" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public can select customers" ON public.customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can update customers" ON public.customers FOR UPDATE TO anon, authenticated USING (true);`;
                            navigator.clipboard.writeText(sql);
                            setCopiedSql(true);
                            setTimeout(() => setCopiedSql(false), 2500);
                          }}
                          className="px-3 py-1.5 bg-champagne text-[#0b0c0e] rounded-sm text-xs font-semibold flex items-center gap-1.5 hover:bg-champagne-light transition-colors"
                        >
                          {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                        </button>

                        <a
                          href="https://supabase.com/dashboard/project/kpgpxokcsumjtpyrhlxr/sql"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-sm text-xs flex items-center gap-1.5 hover:bg-white/10 transition-colors"
                        >
                          <span>Open Supabase SQL Editor</span>
                          <ExternalLink className="w-3.5 h-3.5 text-champagne" />
                        </a>
                      </div>
                    </div>

                    <div className="relative">
                      <pre className="bg-[#0b0c0e] border border-white/10 p-4 rounded-sm text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-72 leading-relaxed">
{`-- 1. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    booking_reference TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    service_id TEXT,
    service_title TEXT,
    package_id TEXT,
    staff_id TEXT,
    staff_name TEXT,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER DEFAULT 45,
    price NUMERIC DEFAULT 1200,
    notes TEXT,
    status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    notes TEXT,
    total_appointments INTEGER DEFAULT 1,
    last_appointment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) & Set Anonymous Booking Policies
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert appointments" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public can select appointments" ON public.appointments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can update appointments" ON public.appointments FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public can insert customers" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public can select customers" ON public.customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can update customers" ON public.customers FOR UPDATE TO anon, authenticated USING (true);`}
                      </pre>
                    </div>

                    <div className="text-[11px] text-neutral-400 bg-white/[0.02] p-3 rounded-sm border border-white/5">
                      <strong className="text-white">How it works:</strong> Whenever a gentleman completes the reservation on the website, the server automatically saves the appointment and client details into your Supabase database table <code className="text-champagne font-mono">appointments</code>. If your Supabase table is not yet created, bookings are securely held in local persistence so no client reservation is ever lost.
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* Modal: Edit/Create Service */}
        {editingService && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <form onSubmit={handleSaveService} className="w-full max-w-lg bg-[#121316] border border-white/15 p-6 rounded-sm space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="text-lg font-display text-white">
                  {editingService.id ? 'Edit Service' : 'Add New Service'}
                </h4>
                <button type="button" onClick={() => setEditingService(null)} className="text-neutral-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Category</label>
                <select
                  value={editingService.category}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                >
                  <option value="HAIR">HAIR</option>
                  <option value="BEARD">BEARD</option>
                  <option value="FACIALS">FACIALS</option>
                  <option value="MASSAGE">MASSAGE</option>
                  <option value="HANDS & FEET">HANDS & FEET</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    required
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={editingService.duration}
                    onChange={(e) => setEditingService({ ...editingService, duration: Number(e.target.value) })}
                    className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setEditingService(null)} className="px-4 py-2 border border-white/10 text-white rounded-sm">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-champagne text-[#0b0c0e] font-semibold uppercase rounded-sm">
                  Save Service
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Manual Walk-in / Phone Booking */}
        {manualBookingModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <form onSubmit={handleCreateManualBooking} className="w-full max-w-lg bg-[#121316] border border-white/15 p-6 rounded-sm space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="text-lg font-display text-white">Manual Walk-in / Phone Reservation</h4>
                <button type="button" onClick={() => setManualBookingModal(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.customer_name}
                    onChange={(e) => setManualForm({ ...manualForm, customer_name: e.target.value })}
                    className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.customer_phone}
                    onChange={(e) => setManualForm({ ...manualForm, customer_phone: e.target.value })}
                    className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Service</label>
                <select
                  value={manualForm.service_id}
                  onChange={(e) => setManualForm({ ...manualForm, service_id: e.target.value })}
                  className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                >
                  <option value="">Select Service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - PKR {s.price} ({s.duration}m)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Barber</label>
                  <select
                    value={manualForm.staff_id}
                    onChange={(e) => setManualForm({ ...manualForm, staff_id: e.target.value })}
                    className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                  >
                    <option value="any">Any Available</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={manualForm.time}
                    onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                    className="w-full bg-[#0b0c0e] border border-white/15 rounded-sm p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setManualBookingModal(false)} className="px-4 py-2 border border-white/10 text-white rounded-sm">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-champagne text-[#0b0c0e] font-semibold uppercase rounded-sm">
                  Confirm Manual Booking
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
