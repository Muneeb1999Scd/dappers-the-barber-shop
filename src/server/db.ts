import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'dappers.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

function initSchema(db: Database) {
  db.run(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      name TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      notes TEXT,
      total_appointments INTEGER DEFAULT 0,
      last_appointment TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT,
      photo_url TEXT,
      specialties TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      working_days TEXT NOT NULL DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      image_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS staff_services (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS service_packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      image_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS package_services (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      FOREIGN KEY (package_id) REFERENCES service_packages(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS business_hours (
      day_of_week TEXT PRIMARY KEY,
      is_open INTEGER NOT NULL DEFAULT 1,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      break_start TEXT,
      break_end TEXT
    );

    CREATE TABLE IF NOT EXISTS staff_hours (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      is_working INTEGER NOT NULL DEFAULT 1,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS breaks (
      id TEXT PRIMARY KEY,
      staff_id TEXT,
      day_of_week TEXT NOT NULL,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocked_dates (
      id TEXT PRIMARY KEY,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT,
      is_full_day INTEGER NOT NULL DEFAULT 1,
      start_time TEXT,
      end_time TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      booking_reference TEXT UNIQUE NOT NULL,
      customer_id TEXT,
      staff_id TEXT NOT NULL,
      service_id TEXT,
      package_id TEXT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      price INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      text TEXT NOT NULL,
      date_text TEXT NOT NULL,
      is_featured INTEGER NOT NULL DEFAULT 1,
      source TEXT NOT NULL DEFAULT 'Google'
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      alt_text TEXT,
      is_featured INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS business_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  seedDefaultData(db);
}

function seedDefaultData(db: Database) {
  // Check if settings already seeded
  const check = db.exec("SELECT COUNT(*) as count FROM business_settings");
  const count = check[0]?.values[0]?.[0] as number;
  if (count > 0) return;

  // 1. Settings
  const settings = [
    ['business_name', 'Dappers | The Gentleman Choice'],
    ['tagline', 'Refined Grooming. Defined by You.'],
    ['address', 'W3VX+J98, Gulzar-e-Hijri Block 1/1, Metrovil Colony, Karachi, Pakistan'],
    ['branch', 'Gulzar-e-Hijri Block 1/1, Karachi'],
    ['phone', '0335 7792524'],
    ['whatsapp', '+923357792524'],
    ['email', 'contact@salondappers.pk'],
    ['instagram', 'https://www.instagram.com/salondapper'],
    ['instagram_handle', '@salondapper'],
    ['google_rating', '4.9'],
    ['google_reviews_count', '170'],
    ['google_maps_url', 'https://maps.google.com/?q=W3VX%2BJ98,+Gulzar-e-Hijri+Block+1/1,+Metrovil+Colony,+Karachi'],
    ['booking_interval', '15'],
    ['min_booking_notice_hours', '1'],
    ['max_booking_window_days', '30'],
    ['cancellation_policy', 'Cancellations or rescheduling are welcomed up to 2 hours before the scheduled appointment.'],
    ['timezone', 'Asia/Karachi'],
    ['hero_headline', "THE GENTLEMAN'S STANDARD OF GROOMING."],
    ['hero_subheadline', 'Precision cuts, refined styling and complete grooming — created around you.']
  ];

  for (const [k, v] of settings) {
    db.run("INSERT OR REPLACE INTO business_settings (key, value) VALUES (?, ?)", [k, v]);
  }

  // 2. Business Hours (Open until 1:00 AM daily)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (const day of days) {
    // 11:00 AM to 01:00 AM next day (represented as 11:00 to 25:00 or handled via 01:00)
    // To make time slots clear in 24h format: 11:00 to 01:00 next day
    db.run(
      "INSERT OR REPLACE INTO business_hours (day_of_week, is_open, open_time, close_time, break_start, break_end) VALUES (?, 1, '11:00', '01:00', '18:00', '18:30')",
      [day]
    );
  }

  // 3. Single-Slot Admin Account: Not auto-seeded.
  // The first administrator sets up their unique account via the dedicated owner slot,
  // after which further registrations are permanently locked.

  // 4. Default Staff
  const staffMembers = [
    {
      id: 'stf-farhan',
      name: 'Farhan Malik',
      role: 'Master Stylist & Barber',
      bio: 'Over 8 years of master scissor craft, classic low fades, modern tapers and hair design.',
      photo_url: '/src/assets/images/service_precision_haircut_1790150247157.jpg',
      specialties: 'Bespoke Scissor Cuts, Skin Fades, Textured Crop, Styling Consultation',
      status: 'active'
    },
    {
      id: 'stf-tariq',
      name: 'Tariq Hussain',
      role: 'Senior Beard & Shave Artisan',
      bio: 'Master of the traditional hot towel straight-razor shave, razor edge sculpt and beard shaping.',
      photo_url: '/src/assets/images/service_beard_sculpt_1790150259291.jpg',
      specialties: 'Hot Towel Therapy, Straight-Razor Line-ups, Beard Contouring, Mustache Styling',
      status: 'active'
    },
    {
      id: 'stf-zeeshan',
      name: 'Zeeshan Ahmed',
      role: 'Gentleman Skin & Wellness Specialist',
      bio: 'Expert in masculine skincare, purifying charcoal facials, scalp rejuvenation and acupressure therapy.',
      photo_url: '/src/assets/images/service_gentleman_facial_1790150283552.jpg',
      specialties: 'Deep Detox Facials, Scalp Therapies, Neck & Shoulder Acupressure, Hands & Feet Care',
      status: 'active'
    }
  ];

  for (const s of staffMembers) {
    db.run(
      `INSERT OR REPLACE INTO staff (id, name, role, bio, photo_url, specialties, status, working_days, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday', datetime('now'))`,
      [s.id, s.name, s.role, s.bio, s.photo_url, s.specialties, s.status]
    );

    // Add staff working hours
    for (const d of days) {
      db.run(
        `INSERT OR REPLACE INTO staff_hours (id, staff_id, day_of_week, is_working, start_time, end_time)
         VALUES (?, ?, ?, 1, '11:00', '01:00')`,
        [`sh-${s.id}-${d}`, s.id, d]
      );
    }
  }

  // 5. Services across Categories (HAIR, BEARD, FACIALS, MASSAGE, HANDS & FEET, GROOMING PACKAGES)
  const defaultServices = [
    // Hair
    {
      id: 'srv-haircut-sig',
      category: 'HAIR',
      name: 'Signature Precision Haircut',
      description: 'Consultation, precision scissor & clipper cut tailored to your head shape, hair wash & bespoke styling finish.',
      price: 1200,
      duration: 45,
      image_url: '/src/assets/images/service_precision_haircut_1790150247157.jpg',
      order: 1
    },
    {
      id: 'srv-haircut-classic',
      category: 'HAIR',
      name: 'Classic Gentleman Haircut',
      description: 'Clean traditional cut, neck shave, and light pomade finish.',
      price: 900,
      duration: 35,
      image_url: '/src/assets/images/service_precision_haircut_1790150247157.jpg',
      order: 2
    },
    {
      id: 'srv-hair-wash',
      category: 'HAIR',
      name: 'Hair Wash, Condition & Blowout',
      description: 'Invigorating tea tree scalp wash, deep conditioning, and blow-dry styling.',
      price: 600,
      duration: 20,
      image_url: '/src/assets/images/service_precision_haircut_1790150247157.jpg',
      order: 3
    },
    {
      id: 'srv-scalp-therapy',
      category: 'HAIR',
      name: 'Scalp Rejuvenation Therapy',
      description: 'Exfoliating botanical treatment designed to cleanse follicles and stimulate healthy hair growth.',
      price: 1500,
      duration: 30,
      image_url: '/src/assets/images/service_precision_haircut_1790150247157.jpg',
      order: 4
    },

    // Beard
    {
      id: 'srv-beard-sculpt',
      category: 'BEARD',
      name: 'Master Beard Sculpt & Line-Up',
      description: 'Clipper shaping, razor perimeter definition, beard oil nourishment, and hot towel finish.',
      price: 700,
      duration: 25,
      image_url: '/src/assets/images/service_beard_sculpt_1790150259291.jpg',
      order: 5
    },
    {
      id: 'srv-royal-shave',
      category: 'BEARD',
      name: 'Royal Hot Towel Straight-Razor Shave',
      description: 'Double hot towel steam treatment, warm shaving cream, pristine straight razor shave, and cooling sandalwood balm.',
      price: 800,
      duration: 30,
      image_url: '/src/assets/images/service_beard_sculpt_1790150259291.jpg',
      order: 6
    },
    {
      id: 'srv-beard-trim',
      category: 'BEARD',
      name: 'Express Beard Trim & Tidy',
      description: 'Quick clipper length reduction and mustache grooming.',
      price: 500,
      duration: 20,
      image_url: '/src/assets/images/service_beard_sculpt_1790150259291.jpg',
      order: 7
    },

    // Facials
    {
      id: 'srv-facial-charcoal',
      category: 'FACIALS',
      name: 'Deep Charcoal Detox Facial',
      description: 'Steam pore extraction, activated charcoal mask, cold compress, and high-frequency skin toning.',
      price: 2500,
      duration: 45,
      image_url: '/src/assets/images/service_gentleman_facial_1790150283552.jpg',
      order: 8
    },
    {
      id: 'srv-facial-gold',
      category: 'FACIALS',
      name: 'Gold Glow Radiance Facial',
      description: 'Ultra-nourishing gentleman treatment targeting fatigue, sun exposure, and skin revitalisation.',
      price: 3500,
      duration: 50,
      image_url: '/src/assets/images/service_gentleman_facial_1790150283552.jpg',
      order: 9
    },
    {
      id: 'srv-facial-cleanse',
      category: 'FACIALS',
      name: 'Anti-Pollution Skin Cleansing',
      description: 'Targeted cleanse removing urban particulate matter, grime, and excess oil.',
      price: 1800,
      duration: 35,
      image_url: '/src/assets/images/service_gentleman_facial_1790150283552.jpg',
      order: 10
    },

    // Massage
    {
      id: 'srv-massage-head-neck',
      category: 'MASSAGE',
      name: 'Head, Neck & Shoulder Acupressure',
      description: 'Focused tension relief targeting upper trap stress, neck stiffness, and temple relaxation.',
      price: 1200,
      duration: 30,
      image_url: '/src/assets/images/service_gentleman_facial_1790150283552.jpg',
      order: 11
    },
    {
      id: 'srv-massage-upper-body',
      category: 'MASSAGE',
      name: 'Full Upper Body Relaxation Therapy',
      description: 'Therapeutic muscle soothing for back, shoulders, arms, and scalp in an ambient private lounger.',
      price: 2200,
      duration: 45,
      image_url: '/src/assets/images/service_gentleman_facial_1790150283552.jpg',
      order: 12
    },

    // Hands & Feet
    {
      id: 'srv-manicure',
      category: 'HANDS & FEET',
      name: "Executive Men's Manicure",
      description: 'Hand soak, nail shaping, cuticle cleanup, and nourishing massage for clean, professional hands.',
      price: 1400,
      duration: 30,
      image_url: '/src/assets/images/salon_interior_luxury_1790150271262.jpg',
      order: 13
    },
    {
      id: 'srv-pedicure',
      category: 'HANDS & FEET',
      name: "Gentleman's Relaxing Pedicure",
      description: 'Warm sea salt foot bath, callous buffing, nail grooming, and rejuvenating peppermint foot massage.',
      price: 1800,
      duration: 40,
      image_url: '/src/assets/images/salon_interior_luxury_1790150271262.jpg',
      order: 14
    }
  ];

  for (const s of defaultServices) {
    db.run(
      `INSERT OR REPLACE INTO services (id, category, name, description, price, duration, image_url, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [s.id, s.category, s.name, s.description, s.price, s.duration, s.image_url, s.order]
    );

    // Map to all staff by default
    for (const st of staffMembers) {
      db.run(
        `INSERT OR REPLACE INTO staff_services (id, staff_id, service_id)
         VALUES (?, ?, ?)`,
        [`ss-${st.id}-${s.id}`, st.id, s.id]
      );
    }
  }

  // 6. Packages
  const packages = [
    {
      id: 'pkg-dappers-sig',
      name: 'The Dappers Signature',
      description: 'Our essential gentleman combo: Signature Haircut + Master Beard Sculpt + Hot Towel finish.',
      price: 1800,
      duration: 65,
      image_url: '/src/assets/images/hero_gentleman_lounge_1790150232790.jpg',
      order: 1
    },
    {
      id: 'pkg-executive-revival',
      name: 'The Executive Revival',
      description: 'Precision Haircut + Beard Sculpt + Deep Charcoal Detox Facial + Relaxing Scalp Massage.',
      price: 4500,
      duration: 100,
      image_url: '/src/assets/images/service_gentleman_facial_1790150283552.jpg',
      order: 2
    },
    {
      id: 'pkg-complete-gentleman',
      name: 'The Complete Gentleman',
      description: 'Haircut + Beard Styling + Facial + Upper Body Massage + Executive Manicure & Pedicure.',
      price: 6800,
      duration: 150,
      image_url: '/src/assets/images/salon_interior_luxury_1790150271262.jpg',
      order: 3
    },
    {
      id: 'pkg-groom-royale',
      name: "Groom's Special Occasion Royale",
      description: 'Complete top-to-bottom VIP transformation for weddings and gala events. Includes luxury styling, custom treatment, and relaxation.',
      price: 8500,
      duration: 180,
      image_url: '/src/assets/images/hero_gentleman_lounge_1790150232790.jpg',
      order: 4
    }
  ];

  for (const p of packages) {
    db.run(
      `INSERT OR REPLACE INTO service_packages (id, name, description, price, duration, image_url, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [p.id, p.name, p.description, p.price, p.duration, p.image_url, p.order]
    );
  }

  // 7. Authentic Customer Reviews (From the supplied Google profile with 4.9 rating / 170 reviews)
  const authenticReviews = [
    {
      id: 'rev-1',
      author: 'Shahmir Khan',
      rating: 5,
      text: "One of the best barber shops I've visited. Clean environment, skilled barbers, and a great overall experience.",
      date: '2 weeks ago',
      featured: 1
    },
    {
      id: 'rev-2',
      author: 'Muhammad Bilal',
      rating: 5,
      text: "Professional barber, cutting according to my taste. Highly recommended for anyone in Gulzar-e-Hijri.",
      date: '1 month ago',
      featured: 1
    },
    {
      id: 'rev-3',
      author: 'Hamza Farooq',
      rating: 5,
      text: "The best salon of the town in the best reasonable prices. Attention to detail is unmatched.",
      date: '2 months ago',
      featured: 1
    },
    {
      id: 'rev-4',
      author: 'Syed Arsalan Ali',
      rating: 5,
      text: "Warm hospitality, impeccable hygiene and pristine fades. Dappers has become my regular grooming spot.",
      date: '3 months ago',
      featured: 1
    },
    {
      id: 'rev-5',
      author: 'Omair Siddiqui',
      rating: 5,
      text: "The hot towel shave and charcoal facial are top tier. They truly treat you like a gentleman.",
      date: '3 weeks ago',
      featured: 1
    }
  ];

  for (const r of authenticReviews) {
    db.run(
      `INSERT OR REPLACE INTO reviews (id, author_name, rating, text, date_text, is_featured, source)
       VALUES (?, ?, ?, ?, ?, ?, 'Google')`,
      [r.id, r.author, r.rating, r.text, r.date, r.featured]
    );
  }

  // 8. Gallery
  const galleryItems = [
    {
      id: 'gal-1',
      title: 'Lounge & Styling Station',
      category: 'INTERIOR',
      image_url: '/src/assets/images/salon_interior_luxury_1790150271262.jpg',
      alt_text: 'Interior view of Dappers premium barber lounge with bespoke chairs and warm ambient lighting',
      featured: 1,
      order: 1
    },
    {
      id: 'gal-2',
      title: 'Precision Taper & Scissor Fade',
      category: 'HAIRCUTS',
      image_url: '/src/assets/images/service_precision_haircut_1790150247157.jpg',
      alt_text: 'Gentleman receiving sharp classic taper fade haircut',
      featured: 1,
      order: 2
    },
    {
      id: 'gal-3',
      title: 'Hot Towel Beard Sculpt',
      category: 'BEARD',
      image_url: '/src/assets/images/service_beard_sculpt_1790150259291.jpg',
      alt_text: 'Straight razor beard line-up and warm towel treatment',
      featured: 1,
      order: 3
    },
    {
      id: 'gal-4',
      title: 'Gentleman Skin Ritual',
      category: 'GROOMING',
      image_url: '/src/assets/images/service_gentleman_facial_1790150283552.jpg',
      alt_text: 'Men facial cleansing and relaxing eye therapy',
      featured: 1,
      order: 4
    },
    {
      id: 'gal-5',
      title: 'The Master Barber Experience',
      category: 'EXPERIENCE',
      image_url: '/src/assets/images/hero_gentleman_lounge_1790150232790.jpg',
      alt_text: 'Full salon view of master barber crafting styling for a client',
      featured: 1,
      order: 5
    }
  ];

  for (const g of galleryItems) {
    db.run(
      `INSERT OR REPLACE INTO gallery (id, title, category, image_url, alt_text, is_featured, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [g.id, g.title, g.category, g.image_url, g.alt_text, g.featured, g.order]
    );
  }
}
