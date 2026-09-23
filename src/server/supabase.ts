import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default to user's Supabase project credentials
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kpgpxokcsumjtpyrhlxr.supabase.co';
export const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_ffunjYcRUrGoq9js9PKA2w_rBlmg34E';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return supabaseInstance;
}

export interface SupabaseSyncResult {
  success: boolean;
  synced: boolean;
  tableExists: boolean;
  message?: string;
  error?: string;
}

/**
 * Test connectivity to Supabase and verify if the appointments table exists
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tableExists: boolean;
  error?: string;
  projectUrl: string;
}> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return {
          connected: true,
          tableExists: false,
          error: "Table 'appointments' does not exist yet in Supabase. Please run the SQL migration schema.",
          projectUrl: SUPABASE_URL
        };
      }
      return {
        connected: false,
        tableExists: false,
        error: error.message,
        projectUrl: SUPABASE_URL
      };
    }

    return {
      connected: true,
      tableExists: true,
      projectUrl: SUPABASE_URL
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      error: err?.message || 'Unknown network error connecting to Supabase',
      projectUrl: SUPABASE_URL
    };
  }
}

/**
 * Saves or syncs an appointment into Supabase table `appointments` and `customers`
 */
export async function saveAppointmentToSupabase(appointment: {
  id: string;
  booking_reference: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  service_id?: string | null;
  service_title?: string | null;
  package_id?: string | null;
  staff_id?: string | null;
  staff_name?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  notes?: string | null;
  status?: string;
}): Promise<SupabaseSyncResult> {
  try {
    const supabase = getSupabaseClient();

    // 1. Insert appointment into Supabase
    const { error: apptError } = await supabase
      .from('appointments')
      .upsert({
        id: appointment.id,
        booking_reference: appointment.booking_reference,
        customer_id: appointment.customer_id || null,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        customer_email: appointment.customer_email || null,
        service_id: appointment.service_id || null,
        service_title: appointment.service_title || null,
        package_id: appointment.package_id || null,
        staff_id: appointment.staff_id || null,
        staff_name: appointment.staff_name || null,
        date: appointment.date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        duration: appointment.duration,
        price: appointment.price,
        notes: appointment.notes || '',
        status: appointment.status || 'Confirmed',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (apptError) {
      console.warn('[Supabase Sync Warning] Failed to insert appointment:', apptError.message);
      const isMissingTable = apptError.code === 'PGRST205' || apptError.message.includes('Could not find the table');
      return {
        success: false,
        synced: false,
        tableExists: !isMissingTable,
        error: isMissingTable
          ? "Supabase table 'public.appointments' not created yet. Please execute supabase_schema.sql in Supabase SQL editor."
          : apptError.message
      };
    }

    // 2. Also upsert customer into Supabase
    if (appointment.customer_phone) {
      try {
        await supabase
          .from('customers')
          .upsert({
            id: appointment.customer_id || `cust-${Date.now()}`,
            name: appointment.customer_name,
            phone: appointment.customer_phone,
            email: appointment.customer_email || null,
            notes: appointment.notes || '',
            last_appointment: appointment.date
          }, { onConflict: 'phone' });
      } catch (err: any) {
        console.warn('[Supabase Customer Sync Warning]:', err?.message);
      }
    }

    console.log(`[Supabase Sync] Successfully saved appointment ${appointment.booking_reference} to Supabase!`);
    return {
      success: true,
      synced: true,
      tableExists: true,
      message: `Appointment ${appointment.booking_reference} saved to Supabase`
    };
  } catch (err: any) {
    console.error('[Supabase Sync Exception]:', err);
    return {
      success: false,
      synced: false,
      tableExists: false,
      error: err?.message || 'Error syncing to Supabase'
    };
  }
}
