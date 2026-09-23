import express, { Request, Response } from 'express';
import { getDb, saveDb } from './db.js';
import { saveAppointmentToSupabase, testSupabaseConnection, getSupabaseClient, SUPABASE_URL } from './supabase.js';

export const apiRouter = express.Router();

// Helper to convert HH:mm to minutes from 00:00 (with support for next-day times like 01:00 -> 1500 mins)
function timeToMinutes(timeStr: string, isNextDay = false): number {
  const [h, m] = timeStr.split(':').map(Number);
  let total = h * 60 + m;
  if (isNextDay || (h < 6)) { // Times between 00:00 and 06:00 count as past midnight in night owl hours
    total += 24 * 60;
  }
  return total;
}

function minutesToTime(mins: number): string {
  const normalized = mins % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatTime12h(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
}

// Generate random booking reference DPR-XXXXXX
function generateBookingReference(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `DPR-${num}`;
}

// Helper for db queries
function queryAll(db: any, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(db: any, sql: string, params: any[] = []): any | null {
  const rows = queryAll(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/* =========================================================================
   PUBLIC BOOTSTRAP DATA
   ========================================================================= */
apiRouter.get('/bootstrap', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    // 1. Settings
    const settingsRows = queryAll(db, 'SELECT key, value FROM business_settings');
    const settings: Record<string, string> = {};
    for (const r of settingsRows) {
      settings[r.key] = r.value;
    }

    // 2. Business Hours
    const hours = queryAll(db, 'SELECT * FROM business_hours');

    // 3. Services
    const services = queryAll(db, 'SELECT * FROM services WHERE is_active = 1 ORDER BY display_order ASC, name ASC');

    // 4. Packages
    const packages = queryAll(db, 'SELECT * FROM service_packages WHERE is_active = 1 ORDER BY display_order ASC');

    // 5. Staff
    const staff = queryAll(db, "SELECT id, name, role, bio, photo_url, specialties, status, working_days FROM staff WHERE status = 'active'");

    // 6. Reviews
    const reviews = queryAll(db, 'SELECT * FROM reviews WHERE is_featured = 1');

    // 7. Gallery
    const gallery = queryAll(db, 'SELECT * FROM gallery ORDER BY display_order ASC');

    res.json({
      success: true,
      data: {
        settings,
        hours,
        services,
        packages,
        staff,
        reviews,
        gallery
      }
    });
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ success: false, message: 'Failed to load business data' });
  }
});

/* =========================================================================
   SMART AVAILABILITY ENGINE
   ========================================================================= */
apiRouter.get('/availability', async (req: Request, res: Response) => {
  try {
    const { date, service_id, package_id, staff_id } = req.query as {
      date?: string;
      service_id?: string;
      package_id?: string;
      staff_id?: string;
    };

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required (YYYY-MM-DD)' });
    }

    const db = await getDb();

    // Determine duration
    let duration = 45; // default
    let itemTitle = 'Service';
    let itemPrice = 1200;

    if (service_id) {
      const srv = queryOne(db, 'SELECT name, duration, price FROM services WHERE id = ?', [service_id]);
      if (srv) {
        duration = Number(srv.duration);
        itemTitle = srv.name;
        itemPrice = Number(srv.price);
      }
    } else if (package_id) {
      const pkg = queryOne(db, 'SELECT name, duration, price FROM service_packages WHERE id = ?', [package_id]);
      if (pkg) {
        duration = Number(pkg.duration);
        itemTitle = pkg.name;
        itemPrice = Number(pkg.price);
      }
    }

    // 1. Check blocked dates
    const blocked = queryOne(
      db,
      "SELECT * FROM blocked_dates WHERE ? BETWEEN start_date AND end_date AND is_full_day = 1",
      [date]
    );

    if (blocked) {
      return res.json({
        success: true,
        isOpen: false,
        reason: blocked.reason || 'Appointments are unavailable on this date.',
        slots: []
      });
    }

    // 2. Day of week
    const dateObj = new Date(date + 'T12:00:00Z');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getUTCDay()];

    // 3. Business hours for this day
    const bHour = queryOne(db, 'SELECT * FROM business_hours WHERE day_of_week = ?', [dayOfWeek]);
    if (!bHour || bHour.is_open !== 1) {
      return res.json({
        success: true,
        isOpen: false,
        reason: "We're closed on this day.",
        slots: []
      });
    }

    // Calculate business open/close in minutes
    // e.g. open_time: '11:00', close_time: '01:00'
    const openMins = timeToMinutes(bHour.open_time, false);
    const closeMins = timeToMinutes(bHour.close_time, true);

    const breakStart = bHour.break_start ? timeToMinutes(bHour.break_start, false) : null;
    const breakEnd = bHour.break_end ? timeToMinutes(bHour.break_end, false) : null;

    // 4. Staff members to evaluate
    let candidateStaff: any[] = [];
    if (staff_id && staff_id !== 'any') {
      const single = queryOne(db, "SELECT * FROM staff WHERE id = ? AND status = 'active'", [staff_id]);
      if (single) candidateStaff = [single];
    } else {
      candidateStaff = queryAll(db, "SELECT * FROM staff WHERE status = 'active'");
    }

    if (candidateStaff.length === 0) {
      return res.json({
        success: true,
        isOpen: true,
        slots: [],
        message: 'No available barbers found for this day.'
      });
    }

    // 5. Existing appointments on this date
    const existingAppointments = queryAll(
      db,
      "SELECT staff_id, start_time, end_time FROM appointments WHERE date = ? AND status NOT IN ('Cancelled', 'No-show')",
      [date]
    );

    // 6. Generate time slots with 30-minute step
    const interval = 30; // 30 min intervals
    const slots: Array<{
      time: string;
      displayTime: string;
      availableBarbers: Array<{ id: string; name: string; role: string }>;
    }> = [];

    // Loop through minutes
    for (let currentMins = openMins; currentMins + duration <= closeMins; currentMins += interval) {
      const slotStart = currentMins;
      const slotEnd = currentMins + duration;

      // Check if slot overlaps with salon break
      if (breakStart !== null && breakEnd !== null) {
        if (!(slotEnd <= breakStart || slotStart >= breakEnd)) {
          continue; // Overlaps break
        }
      }

      // Check which barbers are available for this specific slot
      const freeBarbers: Array<{ id: string; name: string; role: string }> = [];

      for (const st of candidateStaff) {
        // Check staff working days
        if (st.working_days && !st.working_days.includes(dayOfWeek)) {
          continue;
        }

        // Check if barber has an overlapping appointment
        let hasConflict = false;
        for (const appt of existingAppointments) {
          if (appt.staff_id === st.id) {
            const apptStart = timeToMinutes(appt.start_time, false);
            const apptEnd = timeToMinutes(appt.end_time, false);
            if (!(slotEnd <= apptStart || slotStart >= apptEnd)) {
              hasConflict = true;
              break;
            }
          }
        }

        if (!hasConflict) {
          freeBarbers.push({
            id: st.id,
            name: st.name,
            role: st.role
          });
        }
      }

      if (freeBarbers.length > 0) {
        const timeStr = minutesToTime(slotStart);
        slots.push({
          time: timeStr,
          displayTime: formatTime12h(timeStr),
          availableBarbers: freeBarbers
        });
      }
    }

    res.json({
      success: true,
      isOpen: true,
      date,
      dayOfWeek,
      duration,
      itemTitle,
      itemPrice,
      slots
    });
  } catch (error: any) {
    console.error('Availability calculation error:', error);
    res.status(500).json({ success: false, message: 'Error checking availability' });
  }
});

/* =========================================================================
   CREATE APPOINTMENT (WITH STRICT SERVER-SIDE DOUBLE BOOKING PREVENTION)
   ========================================================================= */
apiRouter.post('/appointments', async (req: Request, res: Response) => {
  try {
    const {
      service_id,
      package_id,
      staff_id,
      date,
      time,
      customer_name,
      customer_phone,
      customer_email,
      notes
    } = req.body;

    if (!date || !time || !customer_name || !customer_phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, date, and appointment time are required.'
      });
    }

    const db = await getDb();

    // 1. Determine service/package and duration/price
    let duration = 45;
    let price = 1200;
    let serviceName = 'Haircut & Styling';

    if (service_id) {
      const srv = queryOne(db, 'SELECT name, duration, price FROM services WHERE id = ?', [service_id]);
      if (srv) {
        duration = Number(srv.duration);
        price = Number(srv.price);
        serviceName = srv.name;
      }
    } else if (package_id) {
      const pkg = queryOne(db, 'SELECT name, duration, price FROM service_packages WHERE id = ?', [package_id]);
      if (pkg) {
        duration = Number(pkg.duration);
        price = Number(pkg.price);
        serviceName = pkg.name;
      }
    }

    const startMins = timeToMinutes(time, false);
    const endMins = startMins + duration;
    const endTimeStr = minutesToTime(endMins);

    // 2. Resolve Barber
    let assignedStaffId = staff_id;
    let assignedStaffName = '';

    if (!assignedStaffId || assignedStaffId === 'any') {
      // Find the first free active staff member for this slot
      const allStaff = queryAll(db, "SELECT * FROM staff WHERE status = 'active'");
      const existing = queryAll(
        db,
        "SELECT staff_id, start_time, end_time FROM appointments WHERE date = ? AND status NOT IN ('Cancelled', 'No-show')",
        [date]
      );

      for (const st of allStaff) {
        let isOccupied = false;
        for (const appt of existing) {
          if (appt.staff_id === st.id) {
            const apptStart = timeToMinutes(appt.start_time, false);
            const apptEnd = timeToMinutes(appt.end_time, false);
            if (!(endMins <= apptStart || startMins >= apptEnd)) {
              isOccupied = true;
              break;
            }
          }
        }
        if (!isOccupied) {
          assignedStaffId = st.id;
          assignedStaffName = st.name;
          break;
        }
      }

      if (!assignedStaffId || assignedStaffId === 'any') {
        return res.status(409).json({
          success: false,
          message: 'This time was just booked. Please select another slot.'
        });
      }
    } else {
      // Specific staff chosen: STRICT CONFLICT CHECK
      const staffMember = queryOne(db, 'SELECT name FROM staff WHERE id = ?', [assignedStaffId]);
      if (!staffMember) {
        return res.status(404).json({ success: false, message: 'Selected barber not found' });
      }
      assignedStaffName = staffMember.name;

      const conflicting = queryAll(
        db,
        "SELECT id, start_time, end_time FROM appointments WHERE date = ? AND staff_id = ? AND status NOT IN ('Cancelled', 'No-show')",
        [date, assignedStaffId]
      );

      for (const appt of conflicting) {
        const apptStart = timeToMinutes(appt.start_time, false);
        const apptEnd = timeToMinutes(appt.end_time, false);
        if (!(endMins <= apptStart || startMins >= apptEnd)) {
          return res.status(409).json({
            success: false,
            message: 'This time slot was just taken. Please select an alternate time or barber.'
          });
        }
      }
    }

    // 3. Upsert customer record
    let customerId: string | null = null;
    const existingCust = queryOne(db, 'SELECT id, total_appointments FROM customers WHERE phone = ?', [customer_phone]);
    if (existingCust) {
      customerId = existingCust.id;
      db.run(
        `UPDATE customers
         SET total_appointments = total_appointments + 1,
             last_appointment = ?,
             name = ?,
             email = COALESCE(?, email)
         WHERE id = ?`,
        [date, customer_name, customer_email || null, customerId]
      );
    } else {
      customerId = `cust-${Date.now()}`;
      db.run(
        `INSERT INTO customers (id, name, phone, email, notes, total_appointments, last_appointment, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))`,
        [customerId, customer_name, customer_phone, customer_email || null, notes || '', date]
      );
    }

    // 4. Generate unique reference
    let bookingRef = generateBookingReference();
    while (queryOne(db, 'SELECT id FROM appointments WHERE booking_reference = ?', [bookingRef])) {
      bookingRef = generateBookingReference();
    }

    const apptId = `appt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    db.run(
      `INSERT INTO appointments (
        id, booking_reference, customer_id, staff_id, service_id, package_id,
        date, start_time, end_time, duration, price, customer_name, customer_phone, customer_email, notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', datetime('now'), datetime('now'))`,
      [
        apptId,
        bookingRef,
        customerId,
        assignedStaffId,
        service_id || null,
        package_id || null,
        date,
        time,
        endTimeStr,
        duration,
        price,
        customer_name,
        customer_phone,
        customer_email || null,
        notes || ''
      ]
    );

    saveDb();

    // Sync appointment to Supabase backend
    const supabaseSync = await saveAppointmentToSupabase({
      id: apptId,
      booking_reference: bookingRef,
      customer_id: customerId,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      service_id: service_id || null,
      service_title: serviceName,
      package_id: package_id || null,
      staff_id: assignedStaffId,
      staff_name: assignedStaffName,
      date,
      start_time: time,
      end_time: endTimeStr,
      duration,
      price,
      notes: notes || '',
      status: 'Confirmed'
    });

    // Prepare WhatsApp confirmation link
    const waText = encodeURIComponent(
      `*DAPPERS | THE GENTLEMAN CHOICE*\nAppointment Confirmation\n\nReference: *${bookingRef}*\nService: ${serviceName}\nBarber: ${assignedStaffName}\nDate: ${date}\nTime: ${formatTime12h(time)}\nDuration: ${duration} mins\nPrice: PKR ${price.toLocaleString()}\nClient: ${customer_name}\n\nBranch: W3VX+J98, Gulzar-e-Hijri Block 1/1, Metrovil Colony, Karachi\nPhone: 0335 7792524`
    );
    const whatsappLink = `https://wa.me/923357792524?text=${waText}`;

    res.status(201).json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: {
        id: apptId,
        booking_reference: bookingRef,
        service_name: serviceName,
        barber_name: assignedStaffName,
        date,
        time,
        time_formatted: formatTime12h(time),
        end_time: endTimeStr,
        duration,
        price,
        customer_name,
        customer_phone,
        customer_email,
        whatsapp_link: whatsappLink,
        supabase_sync: supabaseSync
      }
    });
  } catch (error: any) {
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, message: 'Server error while booking appointment' });
  }
});

/* =========================================================================
   LOOKUP APPOINTMENT BY REFERENCE
   ========================================================================= */
apiRouter.get('/appointments/lookup/:reference', async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const db = await getDb();

    const appt = queryOne(
      db,
      `SELECT a.*,
              COALESCE(s.name, p.name) as service_title,
              st.name as staff_name,
              st.role as staff_role
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN service_packages p ON a.package_id = p.id
       LEFT JOIN staff st ON a.staff_id = st.id
       WHERE a.booking_reference = ?`,
      [reference.toUpperCase()]
    );

    if (!appt) {
      return res.status(404).json({ success: false, message: 'Appointment not found with reference ' + reference });
    }

    res.json({ success: true, data: appt });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Lookup failed' });
  }
});

/* =========================================================================
   CUSTOMER CANCEL / RESCHEDULE
   ========================================================================= */
apiRouter.post('/appointments/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const db = await getDb();

    const appt = queryOne(db, 'SELECT * FROM appointments WHERE id = ? OR booking_reference = ?', [id, id]);
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appt.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'This appointment is already cancelled' });
    }

    db.run(
      `UPDATE appointments
       SET status = 'Cancelled',
           notes = notes || ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [reason ? ` [Cancelled: ${reason}]` : ' [Cancelled by customer]', appt.id]
    );

    saveDb();

    // Sync cancellation to Supabase
    try {
      const supabase = getSupabaseClient();
      await supabase.from('appointments').update({ status: 'Cancelled', updated_at: new Date().toISOString() }).eq('id', appt.id);
    } catch (e) {
      console.warn('[Supabase Sync Cancel Error]:', e);
    }

    res.json({ success: true, message: 'Appointment successfully cancelled' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
  }
});

apiRouter.post('/appointments/:id/reschedule', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(400).json({ success: false, message: 'New date and time required' });
    }

    const db = await getDb();
    const appt = queryOne(db, 'SELECT * FROM appointments WHERE id = ? OR booking_reference = ?', [id, id]);
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const duration = Number(appt.duration);
    const startMins = timeToMinutes(time, false);
    const endMins = startMins + duration;
    const endTimeStr = minutesToTime(endMins);

    // Conflict check for that staff member
    const conflicts = queryAll(
      db,
      "SELECT id, start_time, end_time FROM appointments WHERE date = ? AND staff_id = ? AND id != ? AND status NOT IN ('Cancelled', 'No-show')",
      [date, appt.staff_id, appt.id]
    );

    for (const c of conflicts) {
      const cStart = timeToMinutes(c.start_time, false);
      const cEnd = timeToMinutes(c.end_time, false);
      if (!(endMins <= cStart || startMins >= cEnd)) {
        return res.status(409).json({ success: false, message: 'The new time slot is unavailable.' });
      }
    }

    db.run(
      `UPDATE appointments
       SET date = ?, start_time = ?, end_time = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [date, time, endTimeStr, appt.id]
    );

    saveDb();

    // Sync reschedule to Supabase
    try {
      const supabase = getSupabaseClient();
      await supabase.from('appointments').update({
        date,
        start_time: time,
        end_time: endTimeStr,
        updated_at: new Date().toISOString()
      }).eq('id', appt.id);
    } catch (e) {
      console.warn('[Supabase Sync Reschedule Error]:', e);
    }

    res.json({ success: true, message: 'Appointment rescheduled successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to reschedule appointment' });
  }
});

/* =========================================================================
   CUSTOMER AUTHENTICATION
   ========================================================================= */
apiRouter.post('/customer/auth', async (req: Request, res: Response) => {
  try {
    const { phone, name, email } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const db = await getDb();
    let customer = queryOne(db, 'SELECT * FROM customers WHERE phone = ?', [phone]);

    if (!customer) {
      const custId = `cust-${Date.now()}`;
      db.run(
        `INSERT INTO customers (id, name, phone, email, notes, total_appointments, created_at)
         VALUES (?, ?, ?, ?, '', 0, datetime('now'))`,
        [custId, name || 'Gentleman Client', phone, email || null]
      );
      saveDb();
      customer = queryOne(db, 'SELECT * FROM customers WHERE id = ?', [custId]);
    }

    // Get customer's appointments
    const appointments = queryAll(
      db,
      `SELECT a.*,
              COALESCE(s.name, p.name) as service_title,
              st.name as staff_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN service_packages p ON a.package_id = p.id
       LEFT JOIN staff st ON a.staff_id = st.id
       WHERE a.customer_phone = ?
       ORDER BY a.date DESC, a.start_time DESC`,
      [phone]
    );

    res.json({
      success: true,
      data: {
        customer,
        appointments
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
});

/* =========================================================================
   ADMIN AUTHENTICATION & DASHBOARD
   ========================================================================= */

// Check if admin is initialized (Single-slot enforcement)
apiRouter.get('/admin/status', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const adminUser = queryOne(db, "SELECT id, email, name, created_at FROM users WHERE role = 'admin' LIMIT 1");
    res.json({
      success: true,
      data: {
        hasAdmin: !!adminUser,
        adminEmail: adminUser ? adminUser.email : undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to check admin status' });
  }
});

// Single-slot Admin Account Registration (Permanent lock after creation)
apiRouter.post('/admin/setup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const db = await getDb();
    // STRICT CHECK: Ensure absolutely NO admin exists already
    const existingAdmin = queryOne(db, "SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin account already registered. New admin account creation is permanently locked.'
      });
    }

    const adminId = `usr-admin-${Date.now()}`;
    const cleanEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO users (id, email, password_hash, role, name, phone, created_at)
       VALUES (?, ?, ?, 'admin', ?, ?, ?)`,
      [adminId, cleanEmail, password, name.trim(), (phone || '').trim(), now]
    );
    saveDb();

    // Generate authenticated session token
    const token = `dappers_admin_${Buffer.from(adminId + ':' + Date.now()).toString('base64')}`;

    res.json({
      success: true,
      message: 'Admin account created successfully. Registration is now locked permanently.',
      data: {
        token,
        user: {
          id: adminId,
          name: name.trim(),
          email: cleanEmail,
          role: 'admin'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Admin setup failed' });
  }
});

apiRouter.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const db = await getDb();
    const cleanInput = email.toLowerCase().trim();
    const user = queryOne(
      db,
      "SELECT * FROM users WHERE (LOWER(email) = ? OR phone = ?) AND role = 'admin'",
      [cleanInput, cleanInput]
    );

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Return session token
    const token = `dappers_admin_${Buffer.from(user.id + ':' + Date.now()).toString('base64')}`;

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Admin stats
apiRouter.get('/admin/dashboard-stats', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];

    const todayAppts = queryAll(db, 'SELECT * FROM appointments WHERE date = ?', [today]);
    const upcoming = queryAll(db, "SELECT * FROM appointments WHERE date >= ? AND status = 'Confirmed'", [today]);
    const pending = queryAll(db, "SELECT * FROM appointments WHERE status = 'Pending'");
    const confirmed = queryAll(db, "SELECT * FROM appointments WHERE status = 'Confirmed'");
    const completed = queryAll(db, "SELECT * FROM appointments WHERE status = 'Completed'");
    const cancelled = queryAll(db, "SELECT * FROM appointments WHERE status = 'Cancelled'");
    const totalCustomers = queryOne(db, 'SELECT COUNT(*) as count FROM customers');

    // Recent 10 bookings
    const recentBookings = queryAll(
      db,
      `SELECT a.*,
              COALESCE(s.name, p.name) as service_title,
              st.name as staff_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN service_packages p ON a.package_id = p.id
       LEFT JOIN staff st ON a.staff_id = st.id
       ORDER BY a.created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        counts: {
          today: todayAppts.length,
          upcoming: upcoming.length,
          pending: pending.length,
          confirmed: confirmed.length,
          completed: completed.length,
          cancelled: cancelled.length,
          totalCustomers: totalCustomers?.count || 0
        },
        recentBookings
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
});

// Admin Appointments List
apiRouter.get('/admin/appointments', async (req: Request, res: Response) => {
  try {
    const { date, status, staff_id, search } = req.query as {
      date?: string;
      status?: string;
      staff_id?: string;
      search?: string;
    };

    const db = await getDb();
    let sql = `
      SELECT a.*,
             COALESCE(s.name, p.name) as service_title,
             st.name as staff_name,
             st.role as staff_role
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN service_packages p ON a.package_id = p.id
      LEFT JOIN staff st ON a.staff_id = st.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      sql += ' AND a.date = ?';
      params.push(date);
    }
    if (status && status !== 'All') {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (staff_id && staff_id !== 'All') {
      sql += ' AND a.staff_id = ?';
      params.push(staff_id);
    }
    if (search) {
      sql += ' AND (a.customer_name LIKE ? OR a.customer_phone LIKE ? OR a.booking_reference LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY a.date DESC, a.start_time DESC LIMIT 100';

    const appointments = queryAll(db, sql, params);
    res.json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve appointments' });
  }
});

// Admin status change
apiRouter.patch('/admin/appointments/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Confirmed', 'Completed', 'Cancelled', 'No-show', 'Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const db = await getDb();
    db.run("UPDATE appointments SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id]);
    saveDb();
    res.json({ success: true, message: 'Status updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// Admin Customer Management
apiRouter.get('/admin/customers', async (req: Request, res: Response) => {
  try {
    const { search } = req.query as { search?: string };
    const db = await getDb();
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY total_appointments DESC, last_appointment DESC';

    const customers = queryAll(db, sql, params);
    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

// Admin Services CRUD
apiRouter.post('/admin/services', async (req: Request, res: Response) => {
  try {
    const { category, name, description, price, duration, image_url } = req.body;
    const db = await getDb();
    const id = `srv-${Date.now()}`;
    db.run(
      `INSERT INTO services (id, category, name, description, price, duration, image_url, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 99)`,
      [id, category, name, description, Number(price), Number(duration), image_url || '/src/assets/images/service_precision_haircut_1790150247157.jpg']
    );
    saveDb();
    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
});

apiRouter.put('/admin/services/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, name, description, price, duration, image_url, is_active } = req.body;
    const db = await getDb();
    db.run(
      `UPDATE services
       SET category = ?, name = ?, description = ?, price = ?, duration = ?, image_url = ?, is_active = ?
       WHERE id = ?`,
      [category, name, description, Number(price), Number(duration), image_url, is_active ? 1 : 0, id]
    );
    saveDb();
    res.json({ success: true, message: 'Service updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
});

apiRouter.delete('/admin/services/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.run('DELETE FROM services WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true, message: 'Service deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
});

// Admin Staff CRUD
apiRouter.post('/admin/staff', async (req: Request, res: Response) => {
  try {
    const { name, role, bio, photo_url, specialties, working_days } = req.body;
    const db = await getDb();
    const id = `stf-${Date.now()}`;
    db.run(
      `INSERT INTO staff (id, name, role, bio, photo_url, specialties, status, working_days, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'))`,
      [id, name, role, bio, photo_url || '/src/assets/images/service_precision_haircut_1790150247157.jpg', specialties, working_days || 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday']
    );
    saveDb();
    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to add staff member' });
  }
});

apiRouter.put('/admin/staff/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, bio, photo_url, specialties, status, working_days } = req.body;
    const db = await getDb();
    db.run(
      `UPDATE staff
       SET name = ?, role = ?, bio = ?, photo_url = ?, specialties = ?, status = ?, working_days = ?
       WHERE id = ?`,
      [name, role, bio, photo_url, specialties, status, working_days, id]
    );
    saveDb();
    res.json({ success: true, message: 'Staff updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update staff' });
  }
});

apiRouter.delete('/admin/staff/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.run("UPDATE staff SET status = 'inactive' WHERE id = ?", [id]);
    saveDb();
    res.json({ success: true, message: 'Staff member deactivated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to deactivate staff' });
  }
});

// Admin Blocked Dates
apiRouter.get('/admin/blocked-dates', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const rows = queryAll(db, 'SELECT * FROM blocked_dates ORDER BY start_date DESC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch blocked dates' });
  }
});

apiRouter.post('/admin/blocked-dates', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, reason } = req.body;
    const db = await getDb();
    const id = `blk-${Date.now()}`;
    db.run(
      `INSERT INTO blocked_dates (id, start_date, end_date, reason, is_full_day, created_at)
       VALUES (?, ?, ?, ?, 1, datetime('now'))`,
      [id, start_date, end_date || start_date, reason || 'Closed / Maintenance']
    );
    saveDb();
    res.json({ success: true, message: 'Blocked date added' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to add blocked date' });
  }
});

apiRouter.delete('/admin/blocked-dates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.run('DELETE FROM blocked_dates WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true, message: 'Blocked date removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete blocked date' });
  }
});

// Admin Settings
apiRouter.get('/admin/settings', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const rows = queryAll(db, 'SELECT key, value FROM business_settings');
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

apiRouter.put('/admin/settings', async (req: Request, res: Response) => {
  try {
    const settingsObj = req.body;
    const db = await getDb();
    for (const [k, v] of Object.entries(settingsObj)) {
      db.run('INSERT OR REPLACE INTO business_settings (key, value) VALUES (?, ?)', [k, String(v)]);
    }
    saveDb();
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to save settings' });
  }
});

// Admin Hours
apiRouter.put('/admin/hours', async (req: Request, res: Response) => {
  try {
    const { hours } = req.body as { hours: any[] };
    const db = await getDb();
    for (const h of hours) {
      db.run(
        `INSERT OR REPLACE INTO business_hours (day_of_week, is_open, open_time, close_time, break_start, break_end)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [h.day_of_week, h.is_open ? 1 : 0, h.open_time, h.close_time, h.break_start || null, h.break_end || null]
      );
    }
    saveDb();
    res.json({ success: true, message: 'Business hours saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update business hours' });
  }
});

/* =========================================================================
   SUPABASE BACKEND INTEGRATION ENDPOINTS
   ========================================================================= */
apiRouter.get('/supabase/status', async (req: Request, res: Response) => {
  try {
    const status = await testSupabaseConnection();
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ success: false, connected: false, error: err?.message });
  }
});

apiRouter.post('/supabase/sync-all', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const all = queryAll(
      db,
      `SELECT a.*,
              COALESCE(s.name, p.name) as service_title,
              st.name as staff_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN service_packages p ON a.package_id = p.id
       LEFT JOIN staff st ON a.staff_id = st.id
       ORDER BY a.created_at ASC`
    );

    let syncedCount = 0;
    const errors: string[] = [];

    for (const appt of all) {
      const result = await saveAppointmentToSupabase({
        id: appt.id,
        booking_reference: appt.booking_reference,
        customer_id: appt.customer_id,
        customer_name: appt.customer_name,
        customer_phone: appt.customer_phone,
        customer_email: appt.customer_email,
        service_id: appt.service_id,
        service_title: appt.service_title,
        package_id: appt.package_id,
        staff_id: appt.staff_id,
        staff_name: appt.staff_name,
        date: appt.date,
        start_time: appt.start_time,
        end_time: appt.end_time,
        duration: Number(appt.duration),
        price: Number(appt.price),
        notes: appt.notes,
        status: appt.status
      });

      if (result.synced) {
        syncedCount++;
      } else if (result.error && errors.length < 3) {
        errors.push(result.error);
      }
    }

    res.json({
      success: true,
      total: all.length,
      synced: syncedCount,
      errors
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Sync failed' });
  }
});

