export interface RecipeIngredient {
  id: string;
  name: string;
  qtyPer100Pax: number;
  unit: 'kg' | 'L' | 'g' | 'pcs';
  costPer100Pax: number;
}

export interface DishItem {
  id: string;
  code: string;
  name: string;
  category:
    | 'Welcome & Chaat'
    | 'Royal Starters'
    | 'Signature Mains'
    | 'Biryani & Breads'
    | 'Artisanal Desserts';
  dietary: 'Pure Veg · Jain Available' | 'Pure Veg' | 'Pure Veg · Swaminarayan';
  station:
    | 'Tandoor Station'
    | 'Handi & Curry'
    | 'Live Chaat Counter'
    | 'Halwai Mithai Station'
    | 'Dum & Bakery';
  sellingPricePerPlate: number;
  foodCostPerPlate: number;
  prepTimeMins: number;
  includedInMenu: boolean;
  imageUrl: string | null;
  description: string;
  ingredients: RecipeIngredient[];
}

export interface ClientTenant {
  clientId: string;
  tenantId: string;
  clientName: string;
  mobileNumber: string;
  otpCode: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  guestPax: number;
  dietaryPreference: string;
  gstin: string;
  selectedDishIds: string[];
}

export interface AdminOtpDispatchRecord {
  id: string;
  clientId: string;
  tenantId: string;
  clientName: string;
  mobileNumber: string;
  otpCode: string;
  eventTitle: string;
  guestPax: number;
  dispatchedAt: string;
  isNew?: boolean;
}

export interface OverviewTask {
  id: string;
  code: string;
  title: string;
  department: string;
  dueTime: string;
  status: 'Completed' | 'In Progress' | 'Action Required';
  owner: string;
  clientId?: string;
}

export interface CrmLead {
  id: string;
  code: string;
  clientId?: string;
  clientName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  guestPax: number;
  targetRatePerPlate: number;
  stage: 'New Inquiry' | 'Tasting Scheduled' | 'Quote Sent' | 'Advance Received';
  phone: string;
  dietaryPreference: string;
}

export interface ProposalQuote {
  id: string;
  quoteNo: string;
  clientId?: string;
  clientName: string;
  eventTitle: string;
  tier: 'Royal Platinum' | 'Heritage Gold' | 'Classic Silver';
  guestPax: number;
  ratePerPlate: number;
  gstPercent: 5 | 18;
  validUntil: string;
  status: 'Draft' | 'Sent via WhatsApp' | 'Approved';
  highlights: string;
}

export interface BanquetEvent {
  id: string;
  bookingCode: string;
  clientId?: string;
  eventName: string;
  clientName: string;
  eventDate: string;
  shift:
    | 'Morning Muhurat (11 AM - 4 PM)'
    | 'Evening Reception (7 PM - 11:30 PM)'
    | 'Full Day Royal (9 AM - 11 PM)';
  venueHall: string;
  guaranteedPax: number;
  headMaharaj: string;
  status: 'Confirmed' | 'Tentative Hold' | 'Kitchen Prep Active' | 'Completed';
}

export interface KotTicket {
  id: string;
  kotNumber: string;
  clientId?: string;
  eventName: string;
  station: string;
  dishId: string;
  batchPax: number;
  dispatchTime: string;
  assignedUstad: string;
  status: 'Queued' | 'Firing on Range' | 'Plated & Dispatched';
  stockDeducted?: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  itemName: string;
  category: string;
  inStockQty: number;
  reorderLevel: number;
  unit: string;
  unitPrice: number;
  preferredVendor: string;
  lastKotDeduction?: string;
  imageUrl?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  itemsSummary: string;
  deliveryDate: string;
  totalAmount: number;
  status: 'Issued' | 'Partially Delivered' | 'Received & Verified';
}

export interface StaffMember {
  id: string;
  empCode: string;
  clientId?: string;
  fullName: string;
  roleTitle:
    | 'Head Maharaj'
    | 'Tandoor Ustad'
    | 'Halwai Specialist'
    | 'Chaat Master'
    | 'Banquet Captain'
    | 'Manager'
    | 'Counter Crew'
    | 'Supporting Staff'
    | 'Waiter'
    | 'Labour'
    | 'Supplement Staff'
    | string;
  specialty: string;
  assignedEvent: string;
  shiftRate: number;
  attendance: 'On Duty' | 'Standby' | 'Confirmed Shift';
  phone: string;
}

export interface GstInvoice {
  id: string;
  invoiceNo: string;
  clientId?: string;
  clientName: string;
  gstin: string;
  eventName: string;
  sacCode: string;
  billingDate: string;
  taxableAmount: number;
  gstRate: 5 | 18;
  amountPaid: number;
  paymentStatus: 'Paid in Full' | 'Part Advance' | 'Payment Due';
  paymentMethod?: string;
  transactionRef?: string;
}

export interface ClientTastingNote {
  id: string;
  clientId?: string;
  clientName: string;
  courseName: string;
  feedbackText: string;
  spicePreference: 'Mild Royal' | 'Medium Traditional' | 'Chatpata Marwari';
  approved: boolean;
}

export interface ModuleConfig {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: string;
}

// Culinary gallery for brand presentation and visual previews
export const STUDIO_CULINARY_GALLERY = [
  {
    id: 'gal-paneer',
    label: 'Zafrani Paneer Tikka Platter',
    category: 'Royal Starters',
    url: '/images/dish_paneer_tikka_1791316793179.jpg',
  },
  {
    id: 'gal-dal',
    label: '24-Hour Copper Handi Dal Makhani',
    category: 'Signature Mains',
    url: '/images/dish_dal_makhani_1791316806403.jpg',
  },
  {
    id: 'gal-biryani',
    label: 'Lucknowi Subz Dum Biryani',
    category: 'Biryani & Breads',
    url: '/images/dish_dum_biryani_1791316820010.jpg',
  },
  {
    id: 'gal-gulab',
    label: 'Kesar Gulab Jamun & Malai Rabri',
    category: 'Artisanal Desserts',
    url: '/images/dish_gulab_jamun_1791316830012.jpg',
  },
  {
    id: 'gal-chaat',
    label: 'Banarasi Palak Patta Chaat',
    category: 'Welcome & Chaat',
    url: '/images/dish_chaat_counter_1791316841675.jpg',
  },
];

const CORE_SIX_DISHES: DishItem[] = [
  {
    id: 'dish-1',
    code: 'DSH-101',
    name: 'Banarasi Crispy Palak Patta Chaat',
    category: 'Welcome & Chaat',
    dietary: 'Pure Veg · Jain Available',
    station: 'Live Chaat Counter',
    sellingPricePerPlate: 145,
    foodCostPerPlate: 42,
    prepTimeMins: 20,
    includedInMenu: true,
    imageUrl: '/images/dish_chaat_counter_1791316841675.jpg',
    description:
      'Tempura-crisp baby spinach leaves drizzled with chilled sweetened hung curd, Khajoor Imli chutney, mint crema, and fresh Kandhari pomegranate pearls.',
    ingredients: [
      { id: 'ing-101', name: 'Baby Spinach & Besan Batter', qtyPer100Pax: 6.5, unit: 'kg', costPer100Pax: 950 },
      { id: 'ing-102', name: 'Chilled Hung Curd (Dahi)', qtyPer100Pax: 8, unit: 'kg', costPer100Pax: 1440 },
      { id: 'ing-103', name: 'Kandhari Pomegranate & Mint Chutney', qtyPer100Pax: 4, unit: 'kg', costPer100Pax: 1810 },
    ],
  },
  {
    id: 'dish-2',
    code: 'DSH-102',
    name: 'Zafrani Malai Paneer Tikka',
    category: 'Royal Starters',
    dietary: 'Pure Veg · Jain Available',
    station: 'Tandoor Station',
    sellingPricePerPlate: 195,
    foodCostPerPlate: 64,
    prepTimeMins: 35,
    includedInMenu: true,
    imageUrl: '/images/dish_paneer_tikka_1791316793179.jpg',
    description:
      'Charcoal-roasted cottage cheese barrels marinated in Kashmiri saffron, hung yogurt, yellow chili, and roasted gram flour, served with mint chutney.',
    ingredients: [
      { id: 'ing-201', name: 'Fresh Malai Paneer (Cow Milk Block)', qtyPer100Pax: 14, unit: 'kg', costPer100Pax: 3780 },
      { id: 'ing-202', name: 'Kashmiri Saffron & Yellow Chilli Marinade', qtyPer100Pax: 3, unit: 'kg', costPer100Pax: 1620 },
      { id: 'ing-203', name: 'Artisanal White Makkhan & Desi Ghee', qtyPer100Pax: 2, unit: 'kg', costPer100Pax: 1000 },
    ],
  },
  {
    id: 'dish-3',
    code: 'DSH-103',
    name: '24-Hour Copper Handi Dal Makhani',
    category: 'Signature Mains',
    dietary: 'Pure Veg · Jain Available',
    station: 'Handi & Curry',
    sellingPricePerPlate: 185,
    foodCostPerPlate: 52,
    prepTimeMins: 90,
    includedInMenu: true,
    imageUrl: '/images/dish_dal_makhani_1791316806403.jpg',
    description:
      'Whole black urad lentils braised overnight over dying charcoal embers in a heavy copper handi, enriched with white makhan, vine tomato puree, and kasuri methi.',
    ingredients: [
      { id: 'ing-301', name: 'Whole Black Sabut Urad Dal (Bukhara Grade)', qtyPer100Pax: 9, unit: 'kg', costPer100Pax: 1620 },
      { id: 'ing-302', name: 'Artisanal White Makkhan & Desi Ghee', qtyPer100Pax: 5.5, unit: 'kg', costPer100Pax: 2750 },
      { id: 'ing-303', name: 'Desi Tomato Puree & Methi', qtyPer100Pax: 11, unit: 'kg', costPer100Pax: 830 },
    ],
  },
  {
    id: 'dish-4',
    code: 'DSH-104',
    name: 'Lucknowi Subz Dum Pukht Biryani',
    category: 'Biryani & Breads',
    dietary: 'Pure Veg · Swaminarayan',
    station: 'Dum & Bakery',
    sellingPricePerPlate: 210,
    foodCostPerPlate: 68,
    prepTimeMins: 55,
    includedInMenu: true,
    imageUrl: '/images/dish_dum_biryani_1791316820010.jpg',
    description:
      'Aged XXL Royal Basmati layered with seasonal jackfruit, baby potatoes, paneer cubes, kewra water, and golden birista sealed under whole-wheat parda.',
    ingredients: [
      { id: 'ing-401', name: '2-Year Aged Royal XXL Basmati Rice', qtyPer100Pax: 12, unit: 'kg', costPer100Pax: 2640 },
      { id: 'ing-402', name: 'Pure Cow Ghee & Shahi Masala', qtyPer100Pax: 3.5, unit: 'kg', costPer100Pax: 2450 },
      { id: 'ing-403', name: 'Assorted Vegetables, Cashews & Saffron', qtyPer100Pax: 9, unit: 'kg', costPer100Pax: 1710 },
    ],
  },
  {
    id: 'dish-5',
    code: 'DSH-105',
    name: 'Warm Kesar Gulab Jamun with Malai Rabri',
    category: 'Artisanal Desserts',
    dietary: 'Pure Veg · Jain Available',
    station: 'Halwai Mithai Station',
    sellingPricePerPlate: 160,
    foodCostPerPlate: 49,
    prepTimeMins: 45,
    includedInMenu: true,
    imageUrl: '/images/dish_gulab_jamun_1791316830012.jpg',
    description:
      'Melt-in-mouth khoya dumplings steeped in green cardamom saffron syrup, served warm over chilled reduced buffalo milk rabri and pistachio slivers.',
    ingredients: [
      { id: 'ing-501', name: 'Danedar Bikaneri Khoya & Chenna', qtyPer100Pax: 8.5, unit: 'kg', costPer100Pax: 2890 },
      { id: 'ing-502', name: 'Full-Cream Milk for Laccha Rabri', qtyPer100Pax: 18, unit: 'L', costPer100Pax: 1260 },
      { id: 'ing-503', name: 'Peshawari Pistachio & Cardamom Syrup', qtyPer100Pax: 4, unit: 'kg', costPer100Pax: 750 },
    ],
  },
  {
    id: 'dish-6',
    code: 'DSH-106',
    name: 'Awadhi Dahi Ke Shikampuri Kebab',
    category: 'Royal Starters',
    dietary: 'Pure Veg · Jain Available',
    station: 'Tandoor Station',
    sellingPricePerPlate: 170,
    foodCostPerPlate: 51,
    prepTimeMins: 30,
    includedInMenu: true,
    imageUrl: '/images/dish_paneer_tikka_1791316793179.jpg',
    description:
      'Velvety hung-curd medallions stuffed with caramelized ginger, green chilies, and toasted coriander seeds, pan-seared in pure desi ghee.',
    ingredients: [
      { id: 'ing-601', name: 'Double-Strained Hung Curd', qtyPer100Pax: 11, unit: 'kg', costPer100Pax: 2970 },
      { id: 'ing-602', name: 'Roasted Gram Flour & Desi Ghee', qtyPer100Pax: 3.5, unit: 'kg', costPer100Pax: 2130 },
    ],
  },
];

export const INITIAL_DISHES: DishItem[] = [...CORE_SIX_DISHES];

export const INITIAL_VENUE_HALLS: string[] = [
  'Grand Imperial Lawns',
  'Kohinoor Crystal Ballroom',
  'Sheesh Mahal Pavilion',
  'Vedic Poolside Courtyard',
  'Royal Palm Banquet',
];

export const ADMIN_MODULES: ModuleConfig[] = [
  {
    id: '01-overview',
    title: '01. Overview & Event Pulse',
    subtitle: 'Live kitchen & banquet operations dashboard',
  },
  {
    id: '02-menu-builder',
    title: '02. Dishes Menu (Selection)',
    subtitle: 'Interactive culinary menu builder & plate pricing',
  },
  {
    id: '04-crm-leads',
    title: '03. Lead & Inquiry CRM',
    subtitle: 'Client inquiries, booking pipelines & follow-ups',
  },
  {
    id: '05-proposals-whatsapp',
    title: '04. Proposals & WhatsApp Quotation',
    subtitle: 'Formal proposals & instant WhatsApp quotes',
  },
  {
    id: '06-banquet-calendar',
    title: '05. Banquet Event Calendar',
    subtitle: 'Hall allocation, schedule shifts & head maharaj',
  },
  {
    id: '07-kitchen-kot',
    title: '06. Kitchen Order Tickets (KOT)',
    subtitle: 'Live firing ranges, batch pax & station routing',
  },
  {
    id: '08-inventory-po',
    title: '07. Central Commissary & Inventory',
    subtitle: 'Stock balances, auto PO reorder & raw materials',
  },
  {
    id: '09-staff-roster',
    title: '08. Staff & Maharaj Roster',
    subtitle: 'Duty assignments, culinary ustads & wage tracking',
  },
  {
    id: '10-gst-invoicing',
    title: '09. GST Invoicing & Tax Ledger',
    subtitle: 'SAC 996333 compliance, receipts & PDF exports',
  },
  {
    id: '11-client-emenu',
    title: '10. Client E-Menu & Live Tasting',
    subtitle: 'Interactive tasting notes & guest curation',
  },
  {
    id: '12-2fa-security',
    title: '11. Security & Admin 2FA',
    subtitle: 'Multi-tenant isolation & cryptographic OTP audit',
  },
];

export const INITIAL_CLIENT_TENANTS: ClientTenant[] = [
  {
    clientId: 'CLI-SINGHANIA-01',
    tenantId: 'TEN-ROYAL-01',
    clientName: 'Singhania Heritage Wedding',
    mobileNumber: '9811098765',
    otpCode: '482910',
    eventTitle: 'Singhania & Somani Grand Varmala & Reception',
    eventDate: '2026-12-18',
    venue: 'Grand Imperial Lawns, New Delhi',
    guestPax: 850,
    dietaryPreference: 'Pure Veg · Jain Counter Dedicated',
    gstin: '07AAAAA0000A1Z5',
    selectedDishIds: ['dish-1', 'dish-2', 'dish-3', 'dish-4', 'dish-5', 'dish-6'],
  },
  {
    clientId: 'CLI-KAPOOR-02',
    tenantId: 'TEN-ROYAL-02',
    clientName: 'Kapoor Sangeet Gala',
    mobileNumber: '9822012345',
    otpCode: '619284',
    eventTitle: 'Kapoor & Oberoi Sangeet & Cocktail Evening',
    eventDate: '2026-12-20',
    venue: 'Kohinoor Crystal Ballroom',
    guestPax: 500,
    dietaryPreference: 'Pure Veg · Multi-Cuisine Gourmet',
    gstin: '07BBBBA1111B1Z2',
    selectedDishIds: ['dish-1', 'dish-2', 'dish-3', 'dish-4'],
  },
  {
    clientId: 'CLI-MEHTA-03',
    tenantId: 'TEN-ROYAL-03',
    clientName: 'Mehta 50th Golden Jubilee',
    mobileNumber: '9833056789',
    otpCode: '739105',
    eventTitle: 'Shri Arvind Mehta Golden Milestone Banquet',
    eventDate: '2026-12-22',
    venue: 'Sheesh Mahal Pavilion',
    guestPax: 350,
    dietaryPreference: 'Pure Veg · Swaminarayan Strictly',
    gstin: '07CCCCA2222C1Z8',
    selectedDishIds: ['dish-2', 'dish-3', 'dish-4', 'dish-5'],
  },
  {
    clientId: 'CLI-SHARMA-04',
    tenantId: 'TEN-ROYAL-04',
    clientName: 'Sharma Ji Shubh Vivah',
    mobileNumber: '9844098765',
    otpCode: '852194',
    eventTitle: 'Sharma Ji Shubh Vivah & Vedic Pheras',
    eventDate: '2026-12-25',
    venue: 'Vedic Poolside Courtyard',
    guestPax: 650,
    dietaryPreference: 'Pure Veg · 100% Pure Jain No-Onion No-Garlic',
    gstin: '07DDDDA3333D1Z4',
    selectedDishIds: ['dish-1', 'dish-2', 'dish-3', 'dish-5', 'dish-6'],
  },
];

export const INITIAL_ADMIN_OTP_DISPATCH_LOGS: AdminOtpDispatchRecord[] = [
  {
    id: 'otp-log-1',
    clientId: 'CLI-SINGHANIA-01',
    tenantId: 'TEN-ROYAL-01',
    clientName: 'Singhania Heritage Wedding',
    mobileNumber: '9811098765',
    otpCode: '482910',
    eventTitle: 'Singhania & Somani Grand Varmala & Reception',
    guestPax: 850,
    dispatchedAt: 'Today · 10:15 AM',
    isNew: false,
  },
  {
    id: 'otp-log-2',
    clientId: 'CLI-KAPOOR-02',
    tenantId: 'TEN-ROYAL-02',
    clientName: 'Kapoor Sangeet Gala',
    mobileNumber: '9822012345',
    otpCode: '619284',
    eventTitle: 'Kapoor & Oberoi Sangeet & Cocktail Evening',
    guestPax: 500,
    dispatchedAt: 'Today · 09:30 AM',
    isNew: false,
  },
  {
    id: 'otp-log-3',
    clientId: 'CLI-MEHTA-03',
    tenantId: 'TEN-ROYAL-03',
    clientName: 'Mehta 50th Golden Jubilee',
    mobileNumber: '9833056789',
    otpCode: '739105',
    eventTitle: 'Shri Arvind Mehta Golden Milestone Banquet',
    guestPax: 350,
    dispatchedAt: 'Yesterday · 04:45 PM',
    isNew: false,
  },
  {
    id: 'otp-log-4',
    clientId: 'CLI-SHARMA-04',
    tenantId: 'TEN-ROYAL-04',
    clientName: 'Sharma Ji Shubh Vivah',
    mobileNumber: '9844098765',
    otpCode: '852194',
    eventTitle: 'Sharma Ji Shubh Vivah & Vedic Pheras',
    guestPax: 650,
    dispatchedAt: 'Yesterday · 02:10 PM',
    isNew: false,
  },
];

export const INITIAL_OVERVIEW_TASKS: OverviewTask[] = [
  {
    id: 'tsk-1',
    code: 'OPS-01',
    clientId: 'CLI-SINGHANIA-01',
    title: 'Pre-chill 850 clay kulhads for Kesar Badam Milk welcome station',
    department: 'Beverage Operations',
    dueTime: 'Today · 14:00 IST',
    status: 'In Progress',
    owner: 'Captain Rajeshwar',
  },
  {
    id: 'tsk-2',
    code: 'OPS-02',
    clientId: 'CLI-SINGHANIA-01',
    title: 'Verify 48-Hour slow braise charcoal ember replenishment for Dal Makhani',
    department: 'Central Commissary',
    dueTime: 'Today · 16:30 IST',
    status: 'In Progress',
    owner: 'Head Maharaj Ramswaroop',
  },
  {
    id: 'tsk-3',
    code: 'OPS-03',
    clientId: 'CLI-KAPOOR-02',
    title: 'Inspect Live Chaat Counter brass tawa burners & liquid nitrogen supply',
    department: 'Equipment & Safety',
    dueTime: 'Today · 18:00 IST',
    status: 'Action Required',
    owner: 'Ops Lead Vikramaditya',
  },
  {
    id: 'tsk-4',
    code: 'OPS-04',
    clientId: 'CLI-MEHTA-03',
    title: 'Generate 18% GST Outdoor Catering Tax Invoice for Apex FinTech Gala',
    department: 'Accounts & GST',
    dueTime: 'Tomorrow · 11:00 IST',
    status: 'In Progress',
    owner: 'CA Nidhi Agarwal',
  },
  {
    id: 'tsk-5',
    code: 'OPS-05',
    clientId: 'CLI-SHARMA-04',
    title: 'Confirm Pure Jain No-Onion No-Garlic Counter Setup for Sharma Ji Vivah',
    department: 'Kitchen Quality & FSSAI',
    dueTime: 'Tomorrow · 15:00 IST',
    status: 'Completed',
    owner: 'Halwai Specialist Keshav',
  },
];

export const INITIAL_CRM_LEADS: CrmLead[] = [
  {
    id: 'lead-1',
    code: 'LEAD-801',
    clientId: 'CLI-SINGHANIA-01',
    clientName: 'Mr. Arvind Singhania',
    eventTitle: 'Singhania & Somani Grand Varmala & Reception',
    eventDate: '2026-12-18',
    venue: 'Grand Imperial Lawns, New Delhi',
    guestPax: 850,
    targetRatePerPlate: 2650,
    stage: 'Advance Received',
    phone: '+91 98110 98765',
    dietaryPreference: 'Pure Veg · Jain Counter Dedicated',
  },
  {
    id: 'lead-2',
    code: 'LEAD-802',
    clientId: 'CLI-KAPOOR-02',
    clientName: 'Mrs. Rohini Kapoor',
    eventTitle: 'Kapoor & Oberoi Sangeet & Cocktail Evening',
    eventDate: '2026-12-20',
    venue: 'Kohinoor Crystal Ballroom',
    guestPax: 500,
    targetRatePerPlate: 2200,
    stage: 'Quote Sent',
    phone: '+91 98220 12345',
    dietaryPreference: 'Pure Veg · Multi-Cuisine Gourmet',
  },
  {
    id: 'lead-3',
    code: 'LEAD-803',
    clientId: 'CLI-MEHTA-03',
    clientName: 'Shri Dinesh Mehta',
    eventTitle: 'Shri Arvind Mehta Golden Milestone Banquet',
    eventDate: '2026-12-22',
    venue: 'Sheesh Mahal Pavilion',
    guestPax: 350,
    targetRatePerPlate: 1850,
    stage: 'Tasting Scheduled',
    phone: '+91 98330 56789',
    dietaryPreference: 'Pure Veg · Swaminarayan Strictly',
  },
  {
    id: 'lead-4',
    code: 'LEAD-804',
    clientId: 'CLI-SHARMA-04',
    clientName: 'Dr. Alok Sharma',
    eventTitle: 'Sharma Ji Shubh Vivah & Vedic Pheras',
    eventDate: '2026-12-25',
    venue: 'Vedic Poolside Courtyard',
    guestPax: 650,
    targetRatePerPlate: 2400,
    stage: 'Advance Received',
    phone: '+91 98440 98765',
    dietaryPreference: 'Pure Veg · 100% Pure Jain No-Onion No-Garlic',
  },
];

export const INITIAL_PROPOSALS: ProposalQuote[] = [
  {
    id: 'prop-1',
    quoteNo: 'PROP-2026-091',
    clientId: 'CLI-SINGHANIA-01',
    clientName: 'Mr. Arvind Singhania',
    eventTitle: 'Singhania & Somani Grand Varmala & Reception',
    tier: 'Royal Platinum',
    guestPax: 850,
    ratePerPlate: 2650,
    gstPercent: 18,
    validUntil: '2026-11-30',
    status: 'Approved',
    highlights:
      '14 Live Counters, Handi Dal Makhani, Zafrani Paneer, Kesar Jamun, 100% Silver Plating Service.',
  },
  {
    id: 'prop-2',
    quoteNo: 'PROP-2026-092',
    clientId: 'CLI-KAPOOR-02',
    clientName: 'Mrs. Rohini Kapoor',
    eventTitle: 'Kapoor & Oberoi Sangeet & Cocktail Evening',
    tier: 'Heritage Gold',
    guestPax: 500,
    ratePerPlate: 2200,
    gstPercent: 5,
    validUntil: '2026-12-05',
    status: 'Sent via WhatsApp',
    highlights:
      'Gourmet Chaat Studio, Subz Dum Biryani, Artisanal Mithai Cart, Welcome Mocktails.',
  },
  {
    id: 'prop-3',
    quoteNo: 'PROP-2026-093',
    clientId: 'CLI-MEHTA-03',
    clientName: 'Shri Dinesh Mehta',
    eventTitle: 'Shri Arvind Mehta Golden Milestone Banquet',
    tier: 'Classic Silver',
    guestPax: 350,
    ratePerPlate: 1850,
    gstPercent: 5,
    validUntil: '2026-12-10',
    status: 'Draft',
    highlights:
      'Pure Swaminarayan Kitchen, Traditional Rajasthani Thali elements, Malai Rabri.',
  },
  {
    id: 'prop-4',
    quoteNo: 'PROP-2026-094',
    clientId: 'CLI-SHARMA-04',
    clientName: 'Dr. Alok Sharma',
    eventTitle: 'Sharma Ji Shubh Vivah & Vedic Pheras',
    tier: 'Royal Platinum',
    guestPax: 650,
    ratePerPlate: 2400,
    gstPercent: 18,
    validUntil: '2026-12-12',
    status: 'Approved',
    highlights:
      'Zero Onion Zero Garlic, Desi Ghee preparation, 12 Royal Starters, Royal Dum Biryani.',
  },
];

export const INITIAL_BANQUET_EVENTS: BanquetEvent[] = [
  {
    id: 'ev-1',
    bookingCode: 'EV-2026-441',
    clientId: 'CLI-SINGHANIA-01',
    eventName: 'Singhania & Somani Grand Varmala & Reception',
    clientName: 'Mr. Arvind Singhania',
    eventDate: '2026-12-18',
    shift: 'Evening Reception (7 PM - 11:30 PM)',
    venueHall: 'Grand Imperial Lawns',
    guaranteedPax: 850,
    headMaharaj: 'Maharaj Ramswaroop Joshi',
    status: 'Confirmed',
  },
  {
    id: 'ev-2',
    bookingCode: 'EV-2026-442',
    clientId: 'CLI-KAPOOR-02',
    eventName: 'Kapoor & Oberoi Sangeet & Cocktail Evening',
    clientName: 'Mrs. Rohini Kapoor',
    eventDate: '2026-12-20',
    shift: 'Evening Reception (7 PM - 11:30 PM)',
    venueHall: 'Kohinoor Crystal Ballroom',
    guaranteedPax: 500,
    headMaharaj: 'Ustad Shaukat Ali',
    status: 'Kitchen Prep Active',
  },
  {
    id: 'ev-3',
    bookingCode: 'EV-2026-443',
    clientId: 'CLI-MEHTA-03',
    eventName: 'Shri Arvind Mehta Golden Milestone Banquet',
    clientName: 'Shri Dinesh Mehta',
    eventDate: '2026-12-22',
    shift: 'Morning Muhurat (11 AM - 4 PM)',
    venueHall: 'Sheesh Mahal Pavilion',
    guaranteedPax: 350,
    headMaharaj: 'Maharaj Harinarayan Vyas',
    status: 'Tentative Hold',
  },
  {
    id: 'ev-4',
    bookingCode: 'EV-2026-444',
    clientId: 'CLI-SHARMA-04',
    eventName: 'Sharma Ji Shubh Vivah & Vedic Pheras',
    clientName: 'Dr. Alok Sharma',
    eventDate: '2026-12-25',
    shift: 'Full Day Royal (9 AM - 11 PM)',
    venueHall: 'Vedic Poolside Courtyard',
    guaranteedPax: 650,
    headMaharaj: 'Maharaj Ramswaroop Joshi',
    status: 'Confirmed',
  },
];

export const INITIAL_KOT_TICKETS: KotTicket[] = [
  {
    id: 'kot-101',
    kotNumber: 'KOT-8821',
    clientId: 'CLI-SINGHANIA-01',
    eventName: 'Singhania & Somani Grand Varmala & Reception',
    station: 'Live Chaat Counter',
    dishId: 'dish-1',
    batchPax: 250,
    dispatchTime: '18:45 IST',
    assignedUstad: 'Chaat Master Kanhaiya',
    status: 'Plated & Dispatched',
    stockDeducted: true,
  },
  {
    id: 'kot-102',
    kotNumber: 'KOT-8822',
    clientId: 'CLI-SINGHANIA-01',
    eventName: 'Singhania & Somani Grand Varmala & Reception',
    station: 'Tandoor Station',
    dishId: 'dish-2',
    batchPax: 300,
    dispatchTime: '19:15 IST',
    assignedUstad: 'Tandoor Ustad Aslam',
    status: 'Firing on Range',
    stockDeducted: true,
  },
  {
    id: 'kot-103',
    kotNumber: 'KOT-8823',
    clientId: 'CLI-SINGHANIA-01',
    eventName: 'Singhania & Somani Grand Varmala & Reception',
    station: 'Handi & Curry',
    dishId: 'dish-3',
    batchPax: 400,
    dispatchTime: '20:00 IST',
    assignedUstad: 'Maharaj Ramswaroop',
    status: 'Queued',
    stockDeducted: false,
  },
  {
    id: 'kot-104',
    kotNumber: 'KOT-8824',
    clientId: 'CLI-KAPOOR-02',
    eventName: 'Kapoor & Oberoi Sangeet & Cocktail Evening',
    station: 'Dum & Bakery',
    dishId: 'dish-4',
    batchPax: 350,
    dispatchTime: '20:30 IST',
    assignedUstad: 'Ustad Shaukat Ali',
    status: 'Queued',
    stockDeducted: false,
  },
  {
    id: 'kot-105',
    kotNumber: 'KOT-8825',
    clientId: 'CLI-SHARMA-04',
    eventName: 'Sharma Ji Shubh Vivah & Vedic Pheras',
    station: 'Halwai Mithai Station',
    dishId: 'dish-5',
    batchPax: 500,
    dispatchTime: '21:00 IST',
    assignedUstad: 'Halwai Keshav Maharaj',
    status: 'Queued',
    stockDeducted: false,
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-101',
    sku: 'SKU-DAIRY-01',
    itemName: 'Fresh Malai Paneer (Cow Milk Block)',
    category: 'Dairy & Milk',
    inStockQty: 180,
    reorderLevel: 50,
    unit: 'kg',
    unitPrice: 380,
    preferredVendor: 'Gokul Dairy & Chilling Plant',
    imageUrl: '/images/dish_paneer_tikka_1791316793179.jpg',
  },
  {
    id: 'inv-102',
    sku: 'SKU-GRAIN-02',
    itemName: 'Whole Black Sabut Urad Dal (Bukhara Grade)',
    category: 'Grains, Dals & Flours',
    inStockQty: 240,
    reorderLevel: 60,
    unit: 'kg',
    unitPrice: 180,
    preferredVendor: 'Khari Baoli Dal Mill Syndicate',
    imageUrl: '/images/dish_dal_makhani_1791316806403.jpg',
  },
  {
    id: 'inv-103',
    sku: 'SKU-RICE-03',
    itemName: '2-Year Aged Royal XXL Basmati Rice',
    category: 'Grains, Dals & Flours',
    inStockQty: 320,
    reorderLevel: 80,
    unit: 'kg',
    unitPrice: 220,
    preferredVendor: 'Kohinoor Grain Logistics Karnal',
    imageUrl: '/images/dish_dum_biryani_1791316820010.jpg',
  },
  {
    id: 'inv-104',
    sku: 'SKU-DAIRY-04',
    itemName: 'Artisanal White Makkhan & Desi Ghee',
    category: 'Dairy & Milk',
    inStockQty: 95,
    reorderLevel: 40,
    unit: 'kg',
    unitPrice: 650,
    preferredVendor: 'Vrindavan Bilona Ghee Trust',
    imageUrl: '/images/dish_dal_makhani_1791316806403.jpg',
  },
  {
    id: 'inv-105',
    sku: 'SKU-SPICE-05',
    itemName: 'Kashmiri Mogra Saffron (Lacha Grade-A)',
    category: 'Spices & Condiments',
    inStockQty: 2.4,
    reorderLevel: 0.8,
    unit: 'kg',
    unitPrice: 210000,
    preferredVendor: 'Pampore Royal Saffron Growers',
    imageUrl: '/images/dish_gulab_jamun_1791316830012.jpg',
  },
  {
    id: 'inv-106',
    sku: 'SKU-PROD-06',
    itemName: 'Baby Spinach & Besan Batter',
    category: 'Fresh Vegetables & Produce',
    inStockQty: 85,
    reorderLevel: 30,
    unit: 'kg',
    unitPrice: 145,
    preferredVendor: 'Delhi NCR Green Hydroponics',
    imageUrl: '/images/dish_chaat_counter_1791316841675.jpg',
  },
  {
    id: 'inv-107',
    sku: 'SKU-DAIRY-07',
    itemName: 'Fresh Khoya / Mawa & Paneer',
    category: 'Dairy & Milk',
    inStockQty: 110,
    reorderLevel: 35,
    unit: 'kg',
    unitPrice: 320,
    preferredVendor: 'Gokul Dairy & Chilling Plant',
    imageUrl: '/images/dish_gulab_jamun_1791316830012.jpg',
  },
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-1001',
    poNumber: 'PO-2026-781',
    vendorName: 'Gokul Dairy & Chilling Plant',
    itemsSummary:
      '150 kg Fresh Malai Paneer, 80 kg Buffalo Mawa, 60 kg Cow Butter',
    deliveryDate: '2026-12-17',
    totalAmount: 114500,
    status: 'Received & Verified',
  },
  {
    id: 'po-1002',
    poNumber: 'PO-2026-782',
    vendorName: 'Khari Baoli Dal Mill Syndicate',
    itemsSummary:
      '200 kg Whole Urad Sabut, 150 kg Kabuli Chana, 100 kg Desi Besan',
    deliveryDate: '2026-12-18',
    totalAmount: 68400,
    status: 'Partially Delivered',
  },
  {
    id: 'po-1003',
    poNumber: 'PO-2026-783',
    vendorName: 'Kohinoor Grain Logistics Karnal',
    itemsSummary: '400 kg Aged XXL Royal Basmati Rice (25kg bags)',
    deliveryDate: '2026-12-19',
    totalAmount: 88000,
    status: 'Issued',
  },
  {
    id: 'po-1004',
    poNumber: 'PO-2026-784',
    vendorName: 'Pampore Royal Saffron Growers',
    itemsSummary:
      '1.5 kg Pure Kashmiri Mogra Saffron, 10 kg Green Cardamom 8mm',
    deliveryDate: '2026-12-20',
    totalAmount: 345000,
    status: 'Issued',
  },
];

export const INITIAL_STAFF_ROSTER: StaffMember[] = [
  {
    id: 'stf-1',
    empCode: 'EMP-01',
    clientId: 'CLI-SINGHANIA-01',
    fullName: 'Maharaj Ramswaroop Joshi',
    roleTitle: 'Head Maharaj',
    specialty: 'Marwari Royal Dal Bukhara & Heritage Gravies',
    assignedEvent: 'Singhania & Somani Grand Varmala & Reception',
    shiftRate: 15000,
    attendance: 'On Duty',
    phone: '+91 98101 22334',
  },
  {
    id: 'stf-2',
    empCode: 'EMP-02',
    clientId: 'CLI-SINGHANIA-01',
    fullName: 'Ustad Aslam Mansoori',
    roleTitle: 'Tandoor Ustad',
    specialty: 'Live Charcoal Bhatti Zafrani Paneer & Stuffed Naans',
    assignedEvent: 'Singhania & Somani Grand Varmala & Reception',
    shiftRate: 8500,
    attendance: 'On Duty',
    phone: '+91 98102 33445',
  },
  {
    id: 'stf-3',
    empCode: 'EMP-03',
    clientId: 'CLI-KAPOOR-02',
    fullName: 'Keshav Maharaj Halwai',
    roleTitle: 'Halwai Specialist',
    specialty: 'Live Kesar Jamun, Jalebi & Slow-Reduced Malai Rabri',
    assignedEvent: 'Kapoor & Oberoi Sangeet & Cocktail Evening',
    shiftRate: 9500,
    attendance: 'Confirmed Shift',
    phone: '+91 98103 44556',
  },
  {
    id: 'stf-4',
    empCode: 'EMP-04',
    clientId: 'CLI-SHARMA-04',
    fullName: 'Kanhaiya Lal Chaatwala',
    roleTitle: 'Chaat Master',
    specialty: 'Banarasi Palak Patta & Agra Bhalla Papdi',
    assignedEvent: 'Sharma Ji Shubh Vivah & Vedic Pheras',
    shiftRate: 7500,
    attendance: 'Confirmed Shift',
    phone: '+91 98104 55667',
  },
  {
    id: 'stf-5',
    empCode: 'EMP-05',
    clientId: 'CLI-SINGHANIA-01',
    fullName: 'Capt. Rajeshwar Rana',
    roleTitle: 'Banquet Captain',
    specialty: 'VIP Silver Dining & White Glove Banquet Service',
    assignedEvent: 'Singhania & Somani Grand Varmala & Reception',
    shiftRate: 6000,
    attendance: 'On Duty',
    phone: '+91 98105 66778',
  },
];

export const INITIAL_GST_INVOICES: GstInvoice[] = [
  {
    id: 'inv-901',
    invoiceNo: 'TC-GST-2026-101',
    clientId: 'CLI-SINGHANIA-01',
    clientName: 'Singhania Heritage Wedding (Arvind Singhania)',
    gstin: '07AAAAA0000A1Z5',
    eventName: 'Singhania & Somani Grand Varmala & Reception',
    sacCode: 'SAC 996333',
    billingDate: '2026-12-19',
    taxableAmount: 2252500,
    gstRate: 18,
    amountPaid: 1500000,
    paymentStatus: 'Part Advance',
    paymentMethod: 'RTGS / Bank Transfer',
    transactionRef: 'HDFCR520261219001',
  },
  {
    id: 'inv-902',
    invoiceNo: 'TC-GST-2026-102',
    clientId: 'CLI-KAPOOR-02',
    clientName: 'Kapoor Sangeet Gala (Rohini Kapoor)',
    gstin: '07BBBBA1111B1Z2',
    eventName: 'Kapoor & Oberoi Sangeet & Cocktail Evening',
    sacCode: 'SAC 996333',
    billingDate: '2026-12-21',
    taxableAmount: 1100000,
    gstRate: 5,
    amountPaid: 1155000,
    paymentStatus: 'Paid in Full',
    paymentMethod: 'UPI / Razorpay',
    transactionRef: 'UPI/2026/KAPOOR/991',
  },
  {
    id: 'inv-903',
    invoiceNo: 'TC-GST-2026-103',
    clientId: 'CLI-MEHTA-03',
    clientName: 'Mehta 50th Golden Jubilee (Dinesh Mehta)',
    gstin: '07CCCCA2222C1Z8',
    eventName: 'Shri Arvind Mehta Golden Milestone Banquet',
    sacCode: 'SAC 996333',
    billingDate: '2026-12-23',
    taxableAmount: 647500,
    gstRate: 5,
    amountPaid: 300000,
    paymentStatus: 'Part Advance',
    paymentMethod: 'Cheque / NEFT',
    transactionRef: 'NEFT-ICICI-92019',
  },
  {
    id: 'inv-904',
    invoiceNo: 'TC-GST-2026-104',
    clientId: 'CLI-SHARMA-04',
    clientName: 'Sharma Ji Shubh Vivah (Dr. Alok Sharma)',
    gstin: '07DDDDA3333D1Z4',
    eventName: 'Sharma Ji Shubh Vivah & Vedic Pheras',
    sacCode: 'SAC 996333',
    billingDate: '2026-12-26',
    taxableAmount: 1560000,
    gstRate: 18,
    amountPaid: 0,
    paymentStatus: 'Payment Due',
    paymentMethod: 'Payment Due',
    transactionRef: 'Pending Final Settlement',
  },
];

export const INITIAL_TASTING_NOTES: ClientTastingNote[] = [
  {
    id: 'tst-01',
    clientId: 'CLI-SINGHANIA-01',
    clientName: 'Mr. Arvind Singhania',
    courseName: 'Zafrani Malai Paneer Tikka',
    feedbackText:
      'Saffron aroma is magnificent. Requested slightly crispier edges from charcoal tandoor.',
    spicePreference: 'Medium Traditional',
    approved: true,
  },
  {
    id: 'tst-02',
    clientId: 'CLI-SINGHANIA-01',
    clientName: 'Mr. Arvind Singhania',
    courseName: '24-Hour Copper Handi Dal Makhani',
    feedbackText:
      'Creamy texture and smokiness are unmatched. Perfect for royal banquet.',
    spicePreference: 'Mild Royal',
    approved: true,
  },
  {
    id: 'tst-03',
    clientId: 'CLI-KAPOOR-02',
    clientName: 'Mrs. Rohini Kapoor',
    courseName: 'Banarasi Crispy Palak Patta Chaat',
    feedbackText:
      'Extremely crunchy and sweet dahi balance is spot on. Guests will love it.',
    spicePreference: 'Chatpata Marwari',
    approved: true,
  },
  {
    id: 'tst-04',
    clientId: 'CLI-SHARMA-04',
    clientName: 'Dr. Alok Sharma',
    courseName: 'Warm Kesar Gulab Jamun with Malai Rabri',
    feedbackText:
      'Chilled rabri with warm soft gulab jamun is divine. 100% pure desi ghee taste confirmed.',
    spicePreference: 'Mild Royal',
    approved: true,
  },
];

/* ============================================================================
   HELPER UTILITIES & BUSINESS LOGIC FUNCTIONS
   ============================================================================ */

export function normalizePhoneDigits(phone: string): string {
  return (phone || '').replace(/\D/g, '').slice(-10);
}

export function findMatchingTenantOrAdmin(
  identifier: string,
  clientTenants: ClientTenant[] = []
): { kind: 'client'; tenant: ClientTenant } | { kind: 'admin' } | null {
  const clean = (identifier || '').trim().toUpperCase();
  if (!clean) return null;
  if (
    clean === 'ADMIN-MASTER' ||
    clean === 'ADMIN' ||
    clean === 'MASTER' ||
    clean === 'DEVELOPER'
  ) {
    return { kind: 'admin' };
  }
  const digits = normalizePhoneDigits(identifier);
  const found = clientTenants.find(
    (t) =>
      t.clientId.toUpperCase() === clean ||
      t.tenantId.toUpperCase() === clean ||
      (digits.length === 10 && normalizePhoneDigits(t.mobileNumber) === digits)
  );
  if (found) {
    return { kind: 'client', tenant: found };
  }
  return null;
}

export function getNextAvailableClientTenantIds(
  clientTenants: ClientTenant[] = []
): { clientId: string; tenantId: string } {
  const nextNum = (clientTenants.length + 1).toString().padStart(2, '0');
  return {
    clientId: `CLI-CLIENT-${nextNum}`,
    tenantId: `TEN-OPS-${nextNum}`,
  };
}

export function validateUniqueClientTenantRegistration(
  clientId: string,
  tenantId: string,
  mobile: string,
  clientTenants: ClientTenant[] = []
): string | null {
  const cId = (clientId || '').trim().toUpperCase();
  const tId = (tenantId || '').trim().toUpperCase();
  const mob = normalizePhoneDigits(mobile);

  if (!cId || !tId) {
    return 'Client ID and Tenant ID are required.';
  }
  if (mob.length !== 10) {
    return 'Mobile number must be exactly 10 digits.';
  }
  if (clientTenants.some((t) => t.clientId.toUpperCase() === cId)) {
    return `Client ID "${cId}" is already registered. Please choose a unique Client ID.`;
  }
  if (clientTenants.some((t) => t.tenantId.toUpperCase() === tId)) {
    return `Tenant ID "${tId}" is already registered. Please choose a unique Tenant ID.`;
  }
  if (clientTenants.some((t) => normalizePhoneDigits(t.mobileNumber) === mob)) {
    return 'Mobile number is already registered under another client account.';
  }
  return null;
}

export function autoCategorizeIngredient(name: string): string {
  const lower = (name || '').toLowerCase();
  if (
    lower.includes('paneer') ||
    lower.includes('milk') ||
    lower.includes('curd') ||
    lower.includes('dahi') ||
    lower.includes('butter') ||
    lower.includes('makhan') ||
    lower.includes('makkhan') ||
    lower.includes('cream') ||
    lower.includes('mawa') ||
    lower.includes('khoya') ||
    lower.includes('rabri')
  ) {
    return 'Dairy & Milk';
  }
  if (
    lower.includes('rice') ||
    lower.includes('basmati') ||
    lower.includes('dal') ||
    lower.includes('urad') ||
    lower.includes('chana') ||
    lower.includes('besan') ||
    lower.includes('atta') ||
    lower.includes('flour') ||
    lower.includes('wheat') ||
    lower.includes('maida')
  ) {
    return 'Grains, Dals & Flours';
  }
  if (
    lower.includes('saffron') ||
    lower.includes('kesar') ||
    lower.includes('cardamom') ||
    lower.includes('elaichi') ||
    lower.includes('masala') ||
    lower.includes('chilli') ||
    lower.includes('chili') ||
    lower.includes('spices') ||
    lower.includes('methi') ||
    lower.includes('kewra') ||
    lower.includes('jeera')
  ) {
    return 'Spices & Condiments';
  }
  if (
    lower.includes('spinach') ||
    lower.includes('palak') ||
    lower.includes('tomato') ||
    lower.includes('potato') ||
    lower.includes('pomegranate') ||
    lower.includes('mint') ||
    lower.includes('vegetable') ||
    lower.includes('jackfruit')
  ) {
    return 'Fresh Vegetables & Produce';
  }
  if (
    lower.includes('ghee') ||
    lower.includes('oil') ||
    lower.includes('mustard') ||
    lower.includes('refined')
  ) {
    return 'Oils & Fats';
  }
  return 'Commissary Raw Material';
}

export function getAccurateRecipeForDish(
  dishName: string,
  category: string,
  cost: number = 45,
  dishId: string = 'dish-gen'
): RecipeIngredient[] {
  const nameLower = (dishName || '').toLowerCase();
  const catLower = (category || '').toLowerCase();

  if (
    catLower.includes('starter') ||
    nameLower.includes('paneer') ||
    nameLower.includes('tikka') ||
    nameLower.includes('kebab')
  ) {
    return [
      {
        id: `${dishId}-ing-1`,
        name: 'Fresh Malai Paneer (Cow Milk Block)',
        qtyPer100Pax: 14,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 58),
      },
      {
        id: `${dishId}-ing-2`,
        name: 'Kashmiri Saffron & Yellow Chilli Marinade',
        qtyPer100Pax: 3,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 25),
      },
      {
        id: `${dishId}-ing-3`,
        name: 'Artisanal White Makkhan & Desi Ghee',
        qtyPer100Pax: 2,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 17),
      },
    ];
  }

  if (
    catLower.includes('main') ||
    nameLower.includes('dal') ||
    nameLower.includes('curry') ||
    nameLower.includes('makhani')
  ) {
    return [
      {
        id: `${dishId}-ing-1`,
        name: 'Whole Black Sabut Urad Dal (Bukhara Grade)',
        qtyPer100Pax: 9,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 32),
      },
      {
        id: `${dishId}-ing-2`,
        name: 'Artisanal White Makkhan & Desi Ghee',
        qtyPer100Pax: 5.5,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 52),
      },
      {
        id: `${dishId}-ing-3`,
        name: 'Desi Tomato Puree & Methi',
        qtyPer100Pax: 11,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 16),
      },
    ];
  }

  if (
    catLower.includes('biryani') ||
    catLower.includes('bread') ||
    nameLower.includes('biryani') ||
    nameLower.includes('pukht')
  ) {
    return [
      {
        id: `${dishId}-ing-1`,
        name: '2-Year Aged Royal XXL Basmati Rice',
        qtyPer100Pax: 12,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 38),
      },
      {
        id: `${dishId}-ing-2`,
        name: 'Pure Cow Ghee & Shahi Masala',
        qtyPer100Pax: 3.5,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 36),
      },
      {
        id: `${dishId}-ing-3`,
        name: 'Assorted Vegetables, Cashews & Saffron',
        qtyPer100Pax: 9,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 26),
      },
    ];
  }

  if (
    catLower.includes('dessert') ||
    nameLower.includes('jamun') ||
    nameLower.includes('halwa') ||
    nameLower.includes('rabri')
  ) {
    return [
      {
        id: `${dishId}-ing-1`,
        name: 'Fresh Khoya / Mawa & Paneer',
        qtyPer100Pax: 7,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 45),
      },
      {
        id: `${dishId}-ing-2`,
        name: 'Kashmiri Mogra Saffron (Lacha Grade-A)',
        qtyPer100Pax: 0.05,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 32),
      },
      {
        id: `${dishId}-ing-3`,
        name: 'Reduced Buffalo Milk Rabri & Pistachio',
        qtyPer100Pax: 5,
        unit: 'kg',
        costPer100Pax: Math.round(cost * 23),
      },
    ];
  }

  // Welcome & Chaat default
  return [
    {
      id: `${dishId}-ing-1`,
      name: 'Baby Spinach & Besan Batter',
      qtyPer100Pax: 6.5,
      unit: 'kg',
      costPer100Pax: Math.round(cost * 25),
    },
    {
      id: `${dishId}-ing-2`,
      name: 'Chilled Hung Curd (Dahi)',
      qtyPer100Pax: 8,
      unit: 'kg',
      costPer100Pax: Math.round(cost * 35),
    },
    {
      id: `${dishId}-ing-3`,
      name: 'Kandhari Pomegranate & Mint Chutney',
      qtyPer100Pax: 4,
      unit: 'kg',
      costPer100Pax: Math.round(cost * 40),
    },
  ];
}

export function getProductRelatedDescription(
  name: string,
  category?: string,
  station?: string,
  fallback?: string
): string {
  if (fallback && fallback.trim().length > 15) {
    return fallback.trim();
  }
  const cleanCat = category || 'Royal Culinary Selection';
  const cleanStation = station || 'Live Banquet Counter';
  return `Authentically crafted ${name} curated for grand banquets (${cleanCat}). Prepared fresh at our ${cleanStation} with pure desi ghee, slow-simmered aromatic spices, and traditional recipes.`;
}

export function syncDishesIngredientsToInventory(
  dishes: DishItem[],
  prevInventory: InventoryItem[]
): InventoryItem[] {
  const existingNames = new Set(
    prevInventory.map((item) => item.itemName.trim().toLowerCase())
  );
  const newItems: InventoryItem[] = [];

  dishes.forEach((dish) => {
    (dish.ingredients || []).forEach((ing) => {
      const lower = ing.name.trim().toLowerCase();
      if (!existingNames.has(lower)) {
        existingNames.add(lower);
        newItems.push({
          id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sku: `SKU-${ing.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          itemName: ing.name.trim(),
          category: autoCategorizeIngredient(ing.name),
          inStockQty: 100,
          reorderLevel: 25,
          unit: ing.unit || 'kg',
          unitPrice: Math.round(ing.costPer100Pax / (ing.qtyPer100Pax || 1)) || 150,
          preferredVendor: 'Apex Fresh Agro / Khari Baoli Spices',
          imageUrl: dish.imageUrl || undefined,
        });
      }
    });
  });

  return newItems.length > 0 ? [...prevInventory, ...newItems] : prevInventory;
}