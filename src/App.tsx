import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  RotateCcw,
  Undo2,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  Lock,
  ShoppingBag,
  CheckCircle2,
  Award,
  Sparkles,
  Star,
  MessageSquare,
  Phone,
  Utensils,
  Truck,
  PartyPopper,
  Database,
} from 'lucide-react';
import {
  ADMIN_MODULES,
  INITIAL_DISHES,
  INITIAL_OVERVIEW_TASKS,
  INITIAL_CRM_LEADS,
  INITIAL_PROPOSALS,
  INITIAL_VENUE_HALLS,
  INITIAL_BANQUET_EVENTS,
  INITIAL_KOT_TICKETS,
  INITIAL_INVENTORY,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_STAFF_ROSTER,
  INITIAL_GST_INVOICES,
  INITIAL_TASTING_NOTES,
  ModuleConfig,
  DishItem,
  OverviewTask,
  CrmLead,
  ProposalQuote,
  BanquetEvent,
  KotTicket,
  InventoryItem,
  PurchaseOrder,
  StaffMember,
  GstInvoice,
  ClientTastingNote,
  ClientTenant,
  AdminOtpDispatchRecord,
  INITIAL_CLIENT_TENANTS,
  INITIAL_ADMIN_OTP_DISPATCH_LOGS,
  syncDishesIngredientsToInventory,
  getProductRelatedDescription,
  validateUniqueClientTenantRegistration,
} from './data/initialData';
import { DishImageModal } from './components/DishImageComponents';
import { TheCateringsLogo } from './components/TheCateringsLogo';
import {
  BackupSystemModal,
  AppBackupPayload,
} from './components/BackupSystemModal';
import {
  AboutUsModal,
  ServicesModal,
  GalleryModal,
  ClientStoriesModal,
  InquiryFormModal,
  ContactUsModal,
  ServiceTabType,
} from './components/PublicBrandModals';
import {
  StenStudio2FALoginGate,
  StenStudio2FAActionModal,
  LoginPortalTabMode,
} from './components/StenStudio2FA';
import {
  Module01Overview,
  Module02MenuBuilder,
} from './components/ModulesPart1';
import { playAlarmSound } from './utils/audioAlert';
import {
  Module04CrmLeads,
  Module05ProposalsWhatsapp,
  Module06BanquetCalendar,
  Module07KitchenKot,
} from './components/ModulesPart2';
import {
  Module08InventoryPo,
  Module09StaffRoster,
  Module10GstInvoicing,
  Module11ClientEMenu,
  Module12SecurityOtp,
} from './components/ModulesPart3';

interface UndoSnapshot {
  label: string;
  modules: ModuleConfig[];
  dishes: DishItem[];
  tasks: OverviewTask[];
  leads: CrmLead[];
  proposals: ProposalQuote[];
  venueHalls: string[];
  events: BanquetEvent[];
  kots: KotTicket[];
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  staff: StaffMember[];
  invoices: GstInvoice[];
  tastingNotes: ClientTastingNote[];
}

const STORAGE_KEY = 'thecaterings_portal_state_v11';
const CUSTOMER_ALLOWED_MODULE_IDS = ['02-menu-builder'];
// All modules are available after login with a Client ID (activeClientTenant) or Admin 2FA
const CLIENT_TENANT_ALLOWED_MODULE_IDS = ADMIN_MODULES.map((m) => m.id);

export default function App() {
  const [modules, setModules] = useState<ModuleConfig[]>(ADMIN_MODULES);

  // Admin 2FA & Client Tenant Login State:
  // - When false & no activeClientTenantId (Public Guest View): ONLY Banquet Operations Suite 02 (Dishes Menu (Selection)) is visible.
  // - When activeClientTenantId is set (Authenticated Client Tenant): ALL MODULES are unlocked, showing isolated database records tagged with their clientId. Client A NEVER sees Client B's data.
  // - When true (Master Admin Login): ALL Banquet Operations Suite modules and ALL buttons are visible, with Incoming OTP Dispatch Inbox and Tenant Filter switcher.
  const [isDeveloper2FALoggedIn, setIsDeveloper2FALoggedIn] =
    useState<boolean>(() => {
      try {
        return sessionStorage.getItem('thecaterings_2fa_session') === 'unlocked';
      } catch {
        return false;
      }
    });
  const [activeClientTenantId, setActiveClientTenantId] = useState<
    string | null
  >(() => {
    try {
      return sessionStorage.getItem('thecaterings_client_tenant_id') || null;
    } catch {
      return null;
    }
  });
  const [adminTenantFilter, setAdminTenantFilter] = useState<string>('ALL');
  const [showAdminLoginModal, setShowAdminLoginModal] =
    useState<boolean>(false);
  const [loginModalInitialMode, setLoginModalInitialMode] =
    useState<LoginPortalTabMode>('client-login');
  const [hoverHeaderClientMenu, setHoverHeaderClientMenu] =
    useState<boolean>(false);

  const [activeModuleId, setActiveModuleId] = useState<string>(() => {
    try {
      if (sessionStorage.getItem('thecaterings_2fa_session') === 'unlocked') {
        return '01-overview';
      }
      if (sessionStorage.getItem('thecaterings_client_tenant_id')) {
        return '01-overview';
      }
      return '02-menu-builder';
    } catch {
      return '02-menu-builder';
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Core state across all operational modules on TheCaterings
  const [clientTenants, setClientTenants] = useState<ClientTenant[]>(
    INITIAL_CLIENT_TENANTS
  );
  const [adminOtpDispatchLogs, setAdminOtpDispatchLogs] = useState<
    AdminOtpDispatchRecord[]
  >(INITIAL_ADMIN_OTP_DISPATCH_LOGS);
  const [dishes, setDishes] = useState<DishItem[]>(INITIAL_DISHES);
  const [tasks, setTasks] = useState<OverviewTask[]>(INITIAL_OVERVIEW_TASKS);
  const [leads, setLeads] = useState<CrmLead[]>(INITIAL_CRM_LEADS);
  const [proposals, setProposals] =
    useState<ProposalQuote[]>(INITIAL_PROPOSALS);
  const [venueHalls, setVenueHalls] =
    useState<string[]>(INITIAL_VENUE_HALLS);
  const [events, setEvents] = useState<BanquetEvent[]>(INITIAL_BANQUET_EVENTS);
  const [kots, setKots] = useState<KotTicket[]>(INITIAL_KOT_TICKETS);
  const [inventory, setInventory] =
    useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(
    INITIAL_PURCHASE_ORDERS
  );
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF_ROSTER);
  const [invoices, setInvoices] =
    useState<GstInvoice[]>(INITIAL_GST_INVOICES);
  const [tastingNotes, setTastingNotes] = useState<ClientTastingNote[]>(
    INITIAL_TASTING_NOTES
  );
  const [masterOtp, setMasterOtp] = useState<string>(() =>
    atob('NDgyOTEw')
  );

  // Active logged-in Client Tenant object (if a client logged in via Client ID / Tenant ID / Mobile + OTP)
  const activeClientTenant: ClientTenant | null = activeClientTenantId
    ? clientTenants.find((c) => c.clientId === activeClientTenantId) || null
    : null;

  // Effective clientId filter:
  // - If a Client Tenant is logged in (and not Master Admin), strictly enforce their clientId so Client A NEVER sees Client B's records.
  // - If Master Admin is logged in and selected a specific tenant in the Admin Tenant Filter, filter by that tenantId; otherwise show ALL.
  const effectiveTenantFilterId: string | null = !isDeveloper2FALoggedIn
    ? activeClientTenant?.clientId || null
    : adminTenantFilter !== 'ALL'
    ? adminTenantFilter
    : null;

  const filterByClientId = <T extends { clientId?: string }>(items: T[]): T[] => {
    if (!effectiveTenantFilterId) return items;
    return items.filter((item) => item.clientId === effectiveTenantFilterId);
  };

  // Isolate Dish Menu selections per Client Tenant when a client is logged in
  const effectiveDishes: DishItem[] = dishes.map((d) => ({
    ...d,
    includedInMenu:
      activeClientTenant && !isDeveloper2FALoggedIn
        ? (activeClientTenant.selectedDishIds || []).includes(d.id)
        : !!d.includedInMenu,
  }));

  const visibleTasks = filterByClientId(tasks);
  const visibleLeads = filterByClientId(leads);
  const visibleProposals = filterByClientId(proposals);
  const visibleEvents = filterByClientId(events);
  const visibleKots = filterByClientId(kots);
  const visibleStaff = filterByClientId(staff);
  const visibleInvoices = filterByClientId(invoices);
  const visibleTastingNotes = filterByClientId(tastingNotes);

  const [pending2FAAction, setPending2FAAction] = useState<{
    label: string;
    execute: () => void;
  } | null>(null);

  // Dish image modal state (Admin only)
  const [editingImageDishId, setEditingImageDishId] = useState<string | null>(
    null
  );

  // Public Brand Experience Modals (Request 7: About Us, Services, Gallery, Client Stories, Inquiry Form, Contact Us)
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [servicesModalInitialTab, setServicesModalInitialTab] =
    useState<ServiceTabType>('full-service');
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showClientStoriesModal, setShowClientStoriesModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showContactUsModal, setShowContactUsModal] = useState(false);
  const [inquiryInitialService, setInquiryInitialService] =
    useState<string>('Full-Service Royal Catering');

  // Customer Order Checkout Modal state (for customers ordering from Module 02 & 03)
  const [showCustomerOrderModal, setShowCustomerOrderModal] = useState(false);
  const [orderGuestPax, setOrderGuestPax] = useState<number>(500);
  const [orderCustomerName, setOrderCustomerName] = useState('');
  const [orderCustomerPhone, setOrderCustomerPhone] = useState('');

  // Backup System Modal State (Client & Admin Login)
  const [showBackupModal, setShowBackupModal] = useState(false);
  const handleRestoreBackup = (payload: AppBackupPayload) => {
    if (payload.clientTenants) setClientTenants(payload.clientTenants);
    if (payload.dishes) setDishes(payload.dishes);
    if (payload.tasks) setTasks(payload.tasks);
    if (payload.leads) setLeads(payload.leads);
    if (payload.proposals) setProposals(payload.proposals);
    if (payload.events) setEvents(payload.events);
    if (payload.kots) setKots(payload.kots);
    if (payload.inventory) setInventory(payload.inventory);
    if (payload.purchaseOrders) setPurchaseOrders(payload.purchaseOrders);
    if (payload.staff) setStaff(payload.staff);
    if (payload.gstInvoices || payload.invoices) setInvoices(payload.gstInvoices || payload.invoices);
    if (payload.tastingNotes) setTastingNotes(payload.tastingNotes);
    if (payload.masterOtp) setMasterOtp(payload.masterOtp);
  };
  const [orderEventDate, setOrderEventDate] = useState('2026-11-24');
  const [orderEventVenue, setOrderEventVenue] = useState('');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState(
    'Indian UPI (GPay / PhonePe / BHIM)'
  );

  // Undo notification state
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Load persisted state from localStorage if available
  useEffect(() => {
    try {
      localStorage.removeItem('thecaterings_portal_state_v4');
      localStorage.removeItem('thecaterings_portal_state_v5');
      localStorage.removeItem('thecaterings_portal_state_v6');
      localStorage.removeItem('thecaterings_portal_state_v7');
      localStorage.removeItem('thecaterings_portal_state_v8');
      localStorage.removeItem('thecaterings_portal_state_v9');
      localStorage.removeItem('thecaterings_portal_state_v10');
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setModules(ADMIN_MODULES);
        if (
          Array.isArray(parsed.clientTenants) &&
          parsed.clientTenants.length > 0
        ) {
          setClientTenants(parsed.clientTenants);
        }
        if (
          Array.isArray(parsed.adminOtpDispatchLogs) &&
          parsed.adminOtpDispatchLogs.length > 0
        ) {
          const removedIds = new Set([
            'otp-disp-1',
            'otp-disp-2',
            'otp-disp-3',
            'otp-disp-4',
          ]);
          setAdminOtpDispatchLogs(
            parsed.adminOtpDispatchLogs.filter(
              (log: AdminOtpDispatchRecord) => !removedIds.has(log.id)
            )
          );
        }
        if (Array.isArray(parsed.dishes) && parsed.dishes.length > 0)
          setDishes(
            parsed.dishes.map((d: DishItem) => ({
              ...d,
              description: getProductRelatedDescription(
                d.name,
                d.category,
                d.station,
                d.description
              ),
            }))
          );
        if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
        if (Array.isArray(parsed.leads)) setLeads(parsed.leads);
        if (Array.isArray(parsed.proposals)) setProposals(parsed.proposals);
        if (Array.isArray(parsed.venueHalls) && parsed.venueHalls.length > 0)
          setVenueHalls(parsed.venueHalls);
        if (Array.isArray(parsed.events)) setEvents(parsed.events);
        if (Array.isArray(parsed.kots)) setKots(parsed.kots);
        if (Array.isArray(parsed.inventory)) setInventory(parsed.inventory);
        if (Array.isArray(parsed.purchaseOrders))
          setPurchaseOrders(parsed.purchaseOrders);
        if (Array.isArray(parsed.staff)) {
          const existingIds = new Set(parsed.staff.map((s: StaffMember) => s.id));
          const missingDefaultStaff = INITIAL_STAFF_ROSTER.filter(
            (s) => !existingIds.has(s.id)
          );
          setStaff([...parsed.staff, ...missingDefaultStaff]);
        }
        if (Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
        if (Array.isArray(parsed.tastingNotes))
          setTastingNotes(parsed.tastingNotes);
        if (typeof parsed.encodedOtp === 'string') {
          const decoded = atob(parsed.encodedOtp);
          if (/^\d{6}$/.test(decoded)) setMasterOtp(decoded);
        }
      }
    } catch {
      // fallback to initial state
    }
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          modules,
          clientTenants,
          adminOtpDispatchLogs,
          dishes,
          tasks,
          leads,
          proposals,
          venueHalls,
          events,
          kots,
          inventory,
          purchaseOrders,
          staff,
          invoices,
          tastingNotes,
          encodedOtp: btoa(masterOtp),
        })
      );
    } catch {
      // ignore quota errors
    }
  }, [
    modules,
    clientTenants,
    adminOtpDispatchLogs,
    dishes,
    tasks,
    leads,
    proposals,
    venueHalls,
    events,
    kots,
    inventory,
    purchaseOrders,
    staff,
    invoices,
    tastingNotes,
    masterOtp,
  ]);

  // Ensure non-Admin / non-Client navigation stays on allowed modules
  useEffect(() => {
    if (isDeveloper2FALoggedIn) return;
    if (activeClientTenant) {
      if (activeModuleId === '12-2fa-security') {
        setActiveModuleId('01-overview');
      }
      return;
    }
    if (!CUSTOMER_ALLOWED_MODULE_IDS.includes(activeModuleId)) {
      setActiveModuleId('02-menu-builder');
    }
  }, [isDeveloper2FALoggedIn, activeClientTenant, activeModuleId]);

  // Automatically sync & categorize all Module 03 Dish Recipe Ingredients into Module 08 Inventory SKUs
  useEffect(() => {
    setInventory((prev) => {
      const synced = syncDishesIngredientsToInventory(dishes, prev);
      return synced.length !== prev.length ? synced : prev;
    });
  }, [dishes]);

  // Helper: Consume KOT dish ingredients from Central Commissary Stock Ledger & auto-generate PO when <= reorderLevel
  const consumeKotIngredientsAndAutoPo = (kotToConsume: KotTicket) => {
    const linkedDish = dishes.find((d) => d.id === kotToConsume.dishId);
    if (!linkedDish || linkedDish.ingredients.length === 0) return;

    const scale = kotToConsume.batchPax / 100;
    const deductedSummary: string[] = [];
    const newlyGeneratedPos: PurchaseOrder[] = [];

    // Ensure all dish ingredients exist in inventory before deducting
    const baseInventory = syncDishesIngredientsToInventory(dishes, inventory);

    const updatedInventory = baseInventory.map((item) => {
      const matchingIng = linkedDish.ingredients.find(
        (ing) =>
          ing.name.trim().toLowerCase() === item.itemName.trim().toLowerCase()
      );
      if (!matchingIng) return item;

      const consumedQty = Number(
        (matchingIng.qtyPer100Pax * scale).toFixed(2)
      );
      const newQty = Math.max(
        0,
        Number((item.inStockQty - consumedQty).toFixed(2))
      );

      deductedSummary.push(
        `${item.itemName} (-${consumedQty} ${item.unit} → ${newQty} ${item.unit})`
      );

      // Check if stock dropped to or below minimum reorder level
      if (newQty <= item.reorderLevel) {
        const alreadyHasIssuedPo = purchaseOrders.some(
          (po) =>
            po.status === 'Issued' &&
            (po.itemsSummary.includes(item.sku) ||
              po.itemsSummary
                .toLowerCase()
                .includes(item.itemName.toLowerCase()))
        );
        if (!alreadyHasIssuedPo) {
          const orderQty = Math.max(50, item.reorderLevel * 2);
          const autoPoNumber = `AUTO-PO-2026-${
            401 + purchaseOrders.length + newlyGeneratedPos.length
          }`;
          newlyGeneratedPos.push({
            id: `po-auto-${Date.now()}-${item.id}`,
            poNumber: autoPoNumber,
            vendorName: item.preferredVendor,
            itemsSummary: `Auto-Reorder: ${orderQty} ${item.unit} ${item.itemName} (${item.sku}) — Stock at ${newQty} ${item.unit} (Min: ${item.reorderLevel} ${item.unit})`,
            deliveryDate: '2026-10-18',
            totalAmount: Math.round(orderQty * item.unitPrice),
            status: 'Issued',
          });
        }
      }

      return {
        ...item,
        inStockQty: newQty,
        lastKotDeduction: `-${consumedQty} ${item.unit} (${kotToConsume.kotNumber} · ${kotToConsume.batchPax} Pax)`,
      };
    });

    setInventory(updatedInventory);
    setKots((prev) =>
      prev.map((k) =>
        k.id === kotToConsume.id ? { ...k, stockDeducted: true } : k
      )
    );

    if (newlyGeneratedPos.length > 0) {
      setPurchaseOrders((prev) => [...newlyGeneratedPos, ...prev]);
      setStatusBanner(
        `KOT ${kotToConsume.kotNumber} consumed ingredients [${deductedSummary.join(
          ', '
        )}] & Auto-Generated ${newlyGeneratedPos.length} Purchase Order(s): ${newlyGeneratedPos
          .map((p) => p.poNumber)
          .join(', ')}!`
      );
    } else if (deductedSummary.length > 0) {
      setStatusBanner(
        `KOT ${kotToConsume.kotNumber} deducted from Stock Ledger: ${deductedSummary.join(
          ', '
        )}.`
      );
    }
  };

  // Auto-dismiss informational banners after 4 seconds
  useEffect(() => {
    if (!statusBanner) return;
    const timer = setTimeout(() => {
      if (!undoSnapshot) {
        setStatusBanner(null);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [statusBanner, undoSnapshot]);

  // Universal Developer 2FA / Authenticated Client Gate: Once logged in, editing and navigation across all 12 modules never prompt repeatedly
  const requireDeveloper2FA = (actionLabel: string, callback: () => void) => {
    if (!isDeveloper2FALoggedIn && !activeClientTenant) {
      setPending2FAAction({
        label: actionLabel,
        execute: callback,
      });
    } else {
      callback();
    }
  };

  const handleSelectModule = (modId: string) => {
    if (modId === activeModuleId) return;
    // Both Master Admin (isDeveloper2FALoggedIn) and Authenticated Client Tenants (activeClientTenant) have access to ALL 12 MODULES
    if (isDeveloper2FALoggedIn || activeClientTenant) {
      setActiveModuleId(modId);
      if (!undoSnapshot) {
        setStatusBanner(null);
      }
      return;
    }
    // Public Guests can freely access Module 02 Dishes Menu (Selection) without Login
    if (CUSTOMER_ALLOWED_MODULE_IDS.includes(modId)) {
      setActiveModuleId(modId);
      if (!undoSnapshot) {
        setStatusBanner(null);
      }
      return;
    }

    const targetMod =
      modules.find((m) => m.id === modId) ||
      ADMIN_MODULES.find((m) => m.id === modId);
    requireDeveloper2FA(
      `Open Module: ${targetMod?.title || modId} (Developer 2FA)`,
      () => {
        setActiveModuleId(modId);
        if (!undoSnapshot) {
          setStatusBanner(null);
        }
      }
    );
  };

  const recordSnapshot = (label: string) => {
    setUndoSnapshot({
      label,
      modules,
      dishes,
      tasks,
      leads,
      proposals,
      venueHalls,
      events,
      kots,
      inventory,
      purchaseOrders,
      staff,
      invoices,
      tastingNotes,
    });
    setStatusBanner(label);
  };

  const handleUndo = () => {
    if (!undoSnapshot) return;
    requireDeveloper2FA('Undo Last Operation (Developer 2FA)', () => {
      setModules(undoSnapshot.modules);
      setDishes(undoSnapshot.dishes);
      setTasks(undoSnapshot.tasks);
      setLeads(undoSnapshot.leads);
      setProposals(undoSnapshot.proposals);
      setVenueHalls(undoSnapshot.venueHalls);
      setEvents(undoSnapshot.events);
      setKots(undoSnapshot.kots);
      setInventory(undoSnapshot.inventory);
      setPurchaseOrders(undoSnapshot.purchaseOrders);
      setStaff(undoSnapshot.staff);
      setInvoices(undoSnapshot.invoices);
      setTastingNotes(undoSnapshot.tastingNotes);
      setUndoSnapshot(null);
      setStatusBanner('Restored previous action.');
    });
  };

  const handleResetDemoData = () => {
    requireDeveloper2FA(
      'Reset All TheCaterings Demo Dataset (Developer 2FA)',
      () => {
        recordSnapshot(
          'Reset all TheCaterings modules to default 40-dish dataset'
        );
        setModules(ADMIN_MODULES);
        setClientTenants(INITIAL_CLIENT_TENANTS);
        setAdminOtpDispatchLogs(INITIAL_ADMIN_OTP_DISPATCH_LOGS);
        setDishes(INITIAL_DISHES);
        setTasks(INITIAL_OVERVIEW_TASKS);
        setLeads(INITIAL_CRM_LEADS);
        setProposals(INITIAL_PROPOSALS);
        setVenueHalls(INITIAL_VENUE_HALLS);
        setEvents(INITIAL_BANQUET_EVENTS);
        setKots(INITIAL_KOT_TICKETS);
        setInventory(INITIAL_INVENTORY);
        setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
        setStaff(INITIAL_STAFF_ROSTER);
        setInvoices(INITIAL_GST_INVOICES);
        setTastingNotes(INITIAL_TASTING_NOTES);
        localStorage.removeItem(STORAGE_KEY);
      }
    );
  };

  // Handler when a new client_id / tenant_id is created: saves tenant, seeds isolated records across modules, and sends OTP into Admin 2FA Login Dashboard
  const handleCreateNewClientTenant = (
    newTenant: ClientTenant,
    otpDispatch?: AdminOtpDispatchRecord
  ) => {
    const uniqueErr = validateUniqueClientTenantRegistration(
      newTenant.clientId,
      newTenant.tenantId,
      newTenant.mobileNumber,
      clientTenants
    );
    if (uniqueErr) {
      setStatusBanner(uniqueErr);
      return;
    }

    const nowStr = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const dispatchEntry: AdminOtpDispatchRecord = otpDispatch || {
      id: `otp-disp-${Date.now()}`,
      clientId: newTenant.clientId,
      tenantId: newTenant.tenantId,
      clientName: newTenant.clientName,
      mobileNumber: newTenant.mobileNumber,
      otpCode: newTenant.otpCode,
      eventTitle: newTenant.eventTitle,
      guestPax: newTenant.guestPax,
      dispatchedAt: `Today · ${nowStr}`,
      isNew: true,
    };

    setClientTenants((prev) => [newTenant, ...prev]);
    setAdminOtpDispatchLogs((prev) => [dispatchEntry, ...prev]);

    // Seed isolated initial records tagged with newTenant.clientId so all 12 modules have isolated records ready
    const ratePerPlate = 1150;
    const taxable = newTenant.guestPax * ratePerPlate;
    setTasks((prev) => [
      {
        id: `tsk-${Date.now()}`,
        code: `OPS-${prev.length + 1}`,
        clientId: newTenant.clientId,
        title: `Menu Tasting & Banquet Setup — ${newTenant.eventTitle} (${newTenant.guestPax} Pax)`,
        department: 'Banquet Operations',
        dueTime: 'Tomorrow · 14:00 IST',
        status: 'In Progress',
        owner: 'Maharaj Brijmohan Sharma',
      },
      ...prev,
    ]);
    setLeads((prev) => [
      {
        id: `lead-${Date.now()}`,
        code: `LD-2026-0${prev.length + 1}`,
        clientId: newTenant.clientId,
        clientName: newTenant.clientName,
        eventTitle: newTenant.eventTitle,
        eventDate: newTenant.eventDate,
        venue: newTenant.venue,
        guestPax: newTenant.guestPax,
        targetRatePerPlate: ratePerPlate,
        stage: 'Advance Received',
        phone: newTenant.mobileNumber,
        dietaryPreference: newTenant.dietaryPreference,
      },
      ...prev,
    ]);
    setProposals((prev) => [
      {
        id: `prop-${Date.now()}`,
        quoteNo: `QT-2026-${885 + prev.length}`,
        clientId: newTenant.clientId,
        clientName: newTenant.clientName,
        eventTitle: newTenant.eventTitle,
        tier: 'Royal Platinum',
        guestPax: newTenant.guestPax,
        ratePerPlate,
        gstPercent: 5,
        validUntil: newTenant.eventDate,
        status: 'Approved',
        highlights: 'Live Chaat Counters · Royal Starters · Copper Handi Mains · Halwai Mithai',
      },
      ...prev,
    ]);
    setEvents((prev) => [
      {
        id: `evt-${Date.now()}`,
        bookingCode: `BNQ-${505 + prev.length}`,
        clientId: newTenant.clientId,
        eventName: newTenant.eventTitle,
        clientName: newTenant.clientName,
        eventDate: newTenant.eventDate,
        shift: 'Evening Reception (7 PM - 11:30 PM)',
        venueHall: 'Grand Imperial Lawns',
        guaranteedPax: newTenant.guestPax,
        headMaharaj: 'Maharaj Brijmohan Sharma',
        status: 'Confirmed',
      },
      ...prev,
    ]);
    setInvoices((prev) => [
      {
        id: `inv-${Date.now()}`,
        invoiceNo: `INV-TC-2026-${105 + prev.length}`,
        clientId: newTenant.clientId,
        clientName: newTenant.clientName,
        gstin: newTenant.gstin,
        eventName: `${newTenant.eventTitle} (${newTenant.guestPax} Pax)`,
        sacCode: '996333',
        billingDate: newTenant.eventDate,
        taxableAmount: taxable,
        gstRate: 5,
        amountPaid: Math.round(taxable * 0.5),
        paymentStatus: 'Part Advance',
        paymentMethod: 'Indian UPI / Corporate NetBanking',
        transactionRef: `UTR-${Date.now().toString().slice(-6)}`,
      },
      ...prev,
    ]);

    setStatusBanner(
      `Created new client_id (${newTenant.clientId}) / tenant_id (${newTenant.tenantId}) for ${newTenant.clientName}. 6-Digit OTP (${newTenant.otpCode}) has been SENT into the Admin 2FA Login Dashboard!`
    );
  };

  // Multi-Tenant Client Login & Logout handlers
  const handleSuccessClientTenantLogin = (client: ClientTenant) => {
    try {
      sessionStorage.setItem('thecaterings_client_tenant_id', client.clientId);
      sessionStorage.removeItem('thecaterings_2fa_session');
    } catch {
      // ignore storage errors
    }
    setIsDeveloper2FALoggedIn(false);
    setActiveClientTenantId(client.clientId);
    setOrderGuestPax(client.guestPax);
    setOrderCustomerName(client.clientName);
    setOrderCustomerPhone(client.mobileNumber);
    setOrderEventDate(client.eventDate);
    setOrderEventVenue(client.venue);
    setShowAdminLoginModal(false);
    setActiveModuleId('01-overview');
    setStatusBanner(
      `Logged in as ${client.clientName} (${client.clientId} / ${client.tenantId}). All 12 Modules are now available with isolated database records for ${client.clientId}.`
    );
  };

  const handleLogoutClientTenant = () => {
    try {
      sessionStorage.removeItem('thecaterings_client_tenant_id');
    } catch {
      // ignore storage errors
    }
    setActiveClientTenantId(null);
    setActiveModuleId('02-menu-builder');
    setStatusBanner('Logged out of Client Tenant Portal.');
  };

  // Delete module from sidebar (Admin only)
  const handleDeleteSidebarModule = (mod: ModuleConfig) => {
    if (modules.length <= 1) return;
    requireDeveloper2FA(
      `Remove Sidebar Module "${mod.title}" (Developer 2FA)`,
      () => {
        recordSnapshot(`Removed module "${mod.title}" from sidebar`);
        const remaining = modules.filter((m) => m.id !== mod.id);
        setModules(remaining);
        if (activeModuleId === mod.id && remaining.length > 0) {
          setActiveModuleId(remaining[0].id);
        }
      }
    );
  };

  // Dish & Dish Image handlers gated by Developer 2FA
  const handleSaveDishImage = (dishId: string, imageUrl: string) => {
    const target = dishes.find((d) => d.id === dishId);
    requireDeveloper2FA(
      `Save Dish Image for "${target?.name || 'Dish'}" (Developer 2FA)`,
      () => {
        recordSnapshot(`Updated dish image for "${target?.name || 'Dish'}"`);
        setDishes((prev) =>
          prev.map((d) => (d.id === dishId ? { ...d, imageUrl } : d))
        );
      }
    );
  };

  const handleDeleteDishImage = (dishId: string, dishName: string) => {
    requireDeveloper2FA(
      `Delete Dish Image for "${dishName}" (Developer 2FA)`,
      () => {
        recordSnapshot(`Deleted dish image for "${dishName}"`);
        setDishes((prev) =>
          prev.map((d) => (d.id === dishId ? { ...d, imageUrl: null } : d))
        );
      }
    );
  };

  const handleDeleteDish = (dishId: string, dishName: string) => {
    recordSnapshot(`Deleted dish "${dishName}"`);
    setDishes((prev) => prev.filter((d) => d.id !== dishId));
    if (activeClientTenant) {
      setClientTenants((prev) =>
        prev.map((c) =>
          c.clientId === activeClientTenant.clientId
            ? { ...c, selectedDishIds: (c.selectedDishIds || []).filter((id) => id !== dishId) }
            : c
        )
      );
    }
    setStatusBanner(`Deleted "${dishName}" from dish catalog.`);
  };

  const handleAddDish = (newDish: Omit<DishItem, 'id'>) => {
    requireDeveloper2FA(
      `Add Dish Product "${newDish.name}" (Developer 2FA)`,
      () => {
        const created: DishItem = {
          ...newDish,
          id: `dish-${Date.now()}`,
        };
        setDishes((prev) => [created, ...prev]);
        setUndoSnapshot(null);
        setStatusBanner(
          `Added dish "${created.name}" to TheCaterings catalog.`
        );
      }
    );
  };

  const handleBulkAddDishes = (newDishes: Omit<DishItem, 'id'>[]) => {
    requireDeveloper2FA(
      `Bulk List ${newDishes.length} Dish Products (Developer 2FA)`,
      () => {
        const createdBatch: DishItem[] = newDishes.map((d, idx) => ({
          ...d,
          id: `dish-bulk-${Date.now()}-${idx}`,
        }));
        setDishes((prev) => [...createdBatch, ...prev]);
        setUndoSnapshot(null);
        setStatusBanner(
          `Bulk listed ${createdBatch.length} dishes on TheCaterings.`
        );
      }
    );
  };

  const handleDeleteAllDishes = () => {
    requireDeveloper2FA(
      `Delete All Products (${dishes.length} items)`,
      () => {
        const count = dishes.length;
        recordSnapshot(`Deleted all ${count} dishes from catalog`);
        setDishes([]);
        setUndoSnapshot(null);
        setStatusBanner(
          `All ${count} products have been deleted from TheCaterings catalog.`
        );
      }
    );
  };

  const handleBulkDeleteDishes = (dishIds: string[]) => {
    requireDeveloper2FA(
      `Bulk Delete ${dishIds.length} Products from Catalog`,
      () => {
        recordSnapshot(`Bulk deleted ${dishIds.length} dishes`);
        setDishes((prev) => prev.filter((d) => !dishIds.includes(d.id)));
        setUndoSnapshot(null);
        setStatusBanner(
          `Bulk deleted ${dishIds.length} products from TheCaterings catalog.`
        );
      }
    );
  };

  const handleReplaceAllDishes = (newDishes: Omit<DishItem, 'id'>[]) => {
    requireDeveloper2FA(
      `Replace Catalog with ${newDishes.length} Products from Excel Sheet`,
      () => {
        const createdBatch: DishItem[] = newDishes.map((d, idx) => ({
          ...d,
          id: `dish-excel-${Date.now()}-${idx}`,
        }));
        recordSnapshot(`Replaced catalog with ${createdBatch.length} dishes`);
        setDishes(createdBatch);
        setUndoSnapshot(null);
        setStatusBanner(
          `Replaced catalog with ${createdBatch.length} products from Excel sheet.`
        );
      }
    );
  };

  const handleReplaceByDishCode = (incomingDishes: Omit<DishItem, 'id'>[]) => {
    requireDeveloper2FA(
      `Update Products by Dish Code (${incomingDishes.length} items from Excel)`,
      () => {
        const norm = (c: string) => (c || '').trim().toLowerCase();
        const incomingMap = new Map<string, Omit<DishItem, 'id'>>();
        incomingDishes.forEach((item) => {
          if (item.code) {
            incomingMap.set(norm(item.code), item);
          }
        });

        let replacedCount = 0;
        const matchedCodes = new Set<string>();

        recordSnapshot(`Replaced matching dishes by dish code from Excel`);

        setDishes((prev) => {
          // 1. Replace existing matching dishes by dish code; PRESERVE all other dishes (NOT deleted!)
          const updatedExisting = prev.map((existing) => {
            const codeKey = norm(existing.code);
            const match = incomingMap.get(codeKey);
            if (match) {
              replacedCount++;
              matchedCodes.add(codeKey);
              return {
                ...match,
                id: existing.id, // Retain ID so client selections, menu toggles & carts stay valid!
                imageUrl: match.imageUrl || existing.imageUrl,
                includedInMenu: existing.includedInMenu,
              };
            }
            // All other dishes whose codes are not in incoming are preserved intact!
            return existing;
          });

          // 2. Any incoming dishes with a new dish code (not previously in catalog) are appended
          const newlyAdded: DishItem[] = [];
          incomingDishes.forEach((item, idx) => {
            const codeKey = norm(item.code);
            if (!matchedCodes.has(codeKey)) {
              newlyAdded.push({
                ...item,
                id: `dish-excel-${Date.now()}-${idx}`,
              });
            }
          });

          return [...updatedExisting, ...newlyAdded];
        });

        setUndoSnapshot(null);
        setStatusBanner(
          `Excel Update: Replaced matching dish code products (${replacedCount} updated). All other products in Dishes Selection module kept safe without deletion.`
        );
      }
    );
  };

  // Both Customers (selecting dishes for order), Authenticated Client Tenants (isolated per clientId), and Admins can toggle dish selection in menu
  const handleToggleDishInMenu = (dishId: string) => {
    if (activeClientTenant && !isDeveloper2FALoggedIn) {
      setClientTenants((prev) =>
        prev.map((c) => {
          if (c.clientId !== activeClientTenant.clientId) return c;
          const exists = c.selectedDishIds.includes(dishId);
          return {
            ...c,
            selectedDishIds: exists
              ? c.selectedDishIds.filter((id) => id !== dishId)
              : [...c.selectedDishIds, dishId],
          };
        })
      );
      return;
    }
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dishId ? { ...d, includedInMenu: !d.includedInMenu } : d
      )
    );
  };

  // Bulk / Batch Product Select and Unselect Handler
  const handleBatchSelectDishes = (dishIds: string[], select: boolean) => {
    if (activeClientTenant && !isDeveloper2FALoggedIn) {
      setClientTenants((prev) =>
        prev.map((c) => {
          if (c.clientId !== activeClientTenant.clientId) return c;
          const currentSet = new Set(c.selectedDishIds || []);
          if (select) {
            dishIds.forEach((id) => currentSet.add(id));
          } else {
            dishIds.forEach((id) => currentSet.delete(id));
          }
          return {
            ...c,
            selectedDishIds: Array.from(currentSet),
          };
        })
      );
      return;
    }
    const targetSet = new Set(dishIds);
    setDishes((prev) =>
      prev.map((d) =>
        targetSet.has(d.id) ? { ...d, includedInMenu: select } : d
      )
    );
  };

  // Price editing handler for any product/dish (Admin 2FA Login Only)
  const handleUpdateDishPrice = (dishId: string, newPrice: number) => {
    if (!isDeveloper2FALoggedIn && !activeClientTenant) {
      setShowAdminLoginModal(true);
      return;
    }
    const validPrice = Math.max(1, Math.round(Number(newPrice) || 0));
    const target = dishes.find((d) => d.id === dishId);
    if (!target || target.sellingPricePerPlate === validPrice) return;
    recordSnapshot(
      `Updated price for "${target.name}" from ₹${target.sellingPricePerPlate} to ₹${validPrice}`
    );
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dishId ? { ...d, sellingPricePerPlate: validPrice } : d
      )
    );
    setStatusBanner(
      `Updated price for "${target.name}" to ₹${validPrice} / plate.`
    );
  };

  const handleRecordInvoicePayment = (
    invoiceId: string,
    amount: number,
    method: string,
    txRef: string
  ) => {
    requireDeveloper2FA(
      `Record Payment of ₹${amount.toLocaleString(
        'en-IN'
      )} via ${method} (Developer 2FA)`,
      () => {
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id !== invoiceId) return inv;
            const gst = Math.round((inv.taxableAmount * inv.gstRate) / 100);
            const grand = inv.taxableAmount + gst;
            const updatedPaid = Math.min(grand, inv.amountPaid + amount);
            return {
              ...inv,
              amountPaid: updatedPaid,
              paymentStatus:
                updatedPaid >= grand ? 'Paid in Full' : 'Part Advance',
              paymentMethod: method,
              transactionRef: txRef,
            };
          })
        );
        setUndoSnapshot(null);
        setStatusBanner(
          `Recorded payment of ₹${amount.toLocaleString(
            'en-IN'
          )} via ${method} (${txRef}).`
        );
      }
    );
  };


  const handleCustomerOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOrderDishes = effectiveDishes.filter((d) => d.includedInMenu);
    if (!orderCustomerName.trim() || selectedOrderDishes.length === 0) return;

    const orderNo = `ORD-TC-${Math.floor(100000 + Math.random() * 900000)}`;
    const perPlateRate = selectedOrderDishes.reduce(
      (s, d) => s + d.sellingPricePerPlate,
      0
    );
    const pax = Math.max(25, orderGuestPax);
    const taxableTotal = perPlateRate * pax;
    const gstAmount = Math.round(taxableTotal * 0.05);
    const grandTotal = taxableTotal + gstAmount;
    const taggedClientId =
      activeClientTenant?.clientId ||
      effectiveTenantFilterId ||
      'CLI-SINGHANIA-01';

    setLeads((prev) => [
      {
        id: `lead-cust-${Date.now()}`,
        clientId: taggedClientId,
        code: orderNo,
        clientName: orderCustomerName.trim(),
        eventTitle: `Customer Menu Order (${selectedOrderDishes.length} Dishes)`,
        eventDate: orderEventDate || '2026-11-24',
        venue: orderEventVenue.trim() || 'Royal Banquet Venue',
        guestPax: pax,
        targetRatePerPlate: perPlateRate,
        stage: 'Advance Received',
        phone: orderCustomerPhone.trim() || '+91 98110 00000',
        dietaryPreference: 'Pure Veg · Customer Online Order',
      },
      ...prev,
    ]);

    setInvoices((prev) => [
      {
        id: `inv-cust-${Date.now()}`,
        clientId: taggedClientId,
        invoiceNo: orderNo,
        clientName: orderCustomerName.trim(),
        gstin: activeClientTenant?.gstin || 'URP-CUSTOMER-ORDER',
        eventName: `${orderEventVenue.trim() || 'Banquet Order'} (${pax} Pax · ${
          selectedOrderDishes.length
        } Dishes)`,
        sacCode: '996333',
        billingDate: orderEventDate || '2026-11-24',
        taxableAmount: taxableTotal,
        gstRate: 5,
        amountPaid: 0,
        paymentStatus: 'Payment Due',
        paymentMethod: orderPaymentMethod,
        transactionRef: orderNo,
      },
      ...prev,
    ]);

    setShowCustomerOrderModal(false);
    if (!activeClientTenant) {
      setOrderCustomerName('');
      setOrderCustomerPhone('');
      setOrderEventVenue('');
    }
    setUndoSnapshot(null);
    setStatusBanner(
      `Order ${orderNo} confirmed for ${orderCustomerName.trim()} [client_id: ${taggedClientId}] (${pax} Pax · ₹${grandTotal.toLocaleString(
        'en-IN'
      )} incl. 5% GST).`
    );
  };

  // Show all modules if logged in (Admin or Client Tenant), otherwise hide non-public modules in customer portal without login
  const visibleModules = (isDeveloper2FALoggedIn || activeClientTenant)
    ? ADMIN_MODULES
    : ADMIN_MODULES.filter((m) => m.id === '02-menu-builder');

  const currentModule =
    visibleModules.find((m) => m.id === activeModuleId) ||
    ADMIN_MODULES.find((m) => m.id === activeModuleId) ||
    visibleModules[0];

  const editingDish =
    dishes.find((d) => d.id === editingImageDishId) || null;

  const selectedOrderDishes = effectiveDishes.filter((d) => d.includedInMenu);
  const perPlateSelling = selectedOrderDishes.reduce(
    (s, d) => s + d.sellingPricePerPlate,
    0
  );
  const orderTaxableTotal = perPlateSelling * orderGuestPax;
  const orderGstAmount = Math.round(orderTaxableTotal * 0.05);
  const orderGrandTotal = orderTaxableTotal + orderGstAmount;

  return (
    <div className="tc-shell">
      {/* Variation 14 Top Header */}
      <header className="tc-header">
        <div
          className="brand flex items-center group cursor-pointer select-none py-1"
          onClick={() =>
            handleSelectModule(
              isDeveloper2FALoggedIn || activeClientTenant
                ? '01-overview'
                : '02-menu-builder'
            )
          }
          title="The Catering Operations Portal"
        >
          <TheCateringsLogo
            className="h-10 sm:h-12 md:h-14 w-auto group-hover:scale-105 transition-transform duration-200 shrink-0"
            imgClassName="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            showContainer={false}
          />
        </div>

        <div className="header-meta">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isDeveloper2FALoggedIn && (
              <>
                <button
                  type="button"
                  onClick={() => handleSelectModule('02-menu-builder')}
                  aria-label="Add Dish Product"
                  title="Add Dish Product"
                  className="btn inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Dish</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  aria-label="Reset Demo Data"
                  title="Reset Demo Data"
                  className="btn btn-outline inline-flex items-center justify-center p-2.5"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            {activeClientTenant && !isDeveloper2FALoggedIn && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-[#ffd700]"
                style={{ backgroundColor: '#064e3b', color: '#ffffff' }}
              >
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: '#ffd700' }}
                >
                  {activeClientTenant.clientId}
                </span>
                <span
                  className="text-xs font-bold hidden md:inline"
                  style={{ color: '#ffffff' }}
                >
                  · {activeClientTenant.clientName} (All 12 Modules)
                </span>
                <button
                  type="button"
                  onClick={handleLogoutClientTenant}
                  className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#ffd700] text-black cursor-pointer"
                  style={{ color: '#000000' }}
                >
                  Logout Client
                </button>
              </div>
            )}

            {(isDeveloper2FALoggedIn || activeClientTenant) && (
              <button
                type="button"
                onClick={() => setShowBackupModal(true)}
                aria-label="Launch Database Backup System"
                title="Launch Database Backup & Recovery System"
                className="btn inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer shadow-sm"
              >
                <Database className="w-4 h-4" />
                <span>Backup System</span>
              </button>
            )}

            {/* ONE COMBINED BUTTON BY SLASH: Client Login / Admin Login + Hover for New Create Tab client_id / tenant_id */}
            <div
              className="relative flex flex-col items-end"
              onMouseEnter={() => setHoverHeaderClientMenu(true)}
              onMouseLeave={() => setHoverHeaderClientMenu(false)}
            >
              <div
                className="btn admin-2fa-btn inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: '#ffd700',
                  color: '#000000',
                  border: '2px solid #ffffff',
                }}
              >
                <ShieldCheck
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: '#000000',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setLoginModalInitialMode('client-login');
                    setShowAdminLoginModal(true);
                  }}
                  className="cursor-pointer hover:underline"
                  style={{
                    color: '#000000',
                    fontWeight: 800,
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  Client Login
                </button>
                <span
                  style={{
                    color: '#000000',
                    fontWeight: 900,
                    padding: '0 2px',
                  }}
                >
                  /
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (isDeveloper2FALoggedIn) {
                      try {
                        sessionStorage.removeItem('thecaterings_2fa_session');
                      } catch {
                        // ignore
                      }
                      setIsDeveloper2FALoggedIn(false);
                      setActiveModuleId('02-menu-builder');
                      setStatusBanner(
                        'Exited Admin Mode. Showing Customer / Client Portal View.'
                      );
                    } else {
                      setLoginModalInitialMode('admin-2fa');
                      setShowAdminLoginModal(true);
                    }
                  }}
                  className="cursor-pointer hover:underline"
                  style={{
                    color: '#000000',
                    fontWeight: 800,
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  {isDeveloper2FALoggedIn
                    ? 'Admin Logout (2FA)'
                    : 'Admin Login'}
                </button>
              </div>

              {/* Hover Dropdown Menu under Client Login */}
              {hoverHeaderClientMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-72 rounded-xl border-2 p-2.5 shadow-2xl z-50 space-y-1.5"
                  style={{
                    backgroundColor: '#091e3a',
                    borderColor: '#ffd700',
                    color: '#ffffff',
                  }}
                >
                  <div
                    className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-1 border-b"
                    style={{
                      color: '#ffd700',
                      borderColor: 'rgba(255,215,0,0.35)',
                    }}
                  >
                    Under Client Login ID (Hover / Link)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginModalInitialMode('create-tenant');
                      setShowAdminLoginModal(true);
                      setHoverHeaderClientMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-mono font-bold cursor-pointer flex items-center justify-between"
                    style={{
                      backgroundColor: '#064e3b',
                      color: '#ffff00',
                      border: '1.5px solid #ffd700',
                    }}
                  >
                    <span>+ New Create Tab: client_id / tenant_id</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-extrabold"
                      style={{ backgroundColor: '#ffd700', color: '#000000' }}
                    >
                      OTP → Admin
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginModalInitialMode('client-login');
                      setShowAdminLoginModal(true);
                      setHoverHeaderClientMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"
                    style={{
                      backgroundColor: '#0f2942',
                      color: '#ffffff',
                      border: '1px solid #38bdf8',
                    }}
                  >
                    Client Login ID (All 12 Modules Unlocked)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginModalInitialMode('admin-2fa');
                      setShowAdminLoginModal(true);
                      setHoverHeaderClientMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold cursor-pointer"
                    style={{
                      backgroundColor: '#1e1b4b',
                      color: '#ffd700',
                      border: '1px solid #ffd700',
                    }}
                  >
                    Admin 2FA Login Dashboard ({adminOtpDispatchLogs.length}{' '}
                    OTPs)
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('bottom-modules-nav');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              title="Jump to All Modules at Bottom"
              aria-label="Jump to module navigation"
              className="sm:hidden btn btn-outline inline-flex items-center justify-center p-2.5"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SEPARATE BUTTONS: About Us, Services (Full-Service, Drop-off, Theme), Gallery, Client Stories, Inquiry Form, Contact Us */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#ffd700]/30 mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAboutUsModal(true)}
              className="py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border hover:scale-[1.02]"
              style={{
                backgroundColor: '#0f2942',
                color: '#ffffff',
                borderColor: '#ffd700',
              }}
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>About Us</span>
            </button>

            {/* Services with separate buttons for Full-Service Catering, Drop-off Delivery, Theme Catering */}
            <div className="inline-flex items-center rounded-lg border border-[#ffd700] p-0.5 bg-[#0f2942]">
              <button
                type="button"
                onClick={() => {
                  setServicesModalInitialTab('full-service');
                  setShowServicesModal(true);
                }}
                className="py-1 px-2.5 rounded text-xs font-bold font-mono text-white hover:text-[#ffd700] flex items-center gap-1 cursor-pointer"
                title="Services Overview"
              >
                <Utensils className="w-3.5 h-3.5 text-amber-300" />
                <span>Services</span>
              </button>
              <span className="text-white/30 text-xs px-0.5">|</span>
              <button
                type="button"
                onClick={() => {
                  setServicesModalInitialTab('full-service');
                  setShowServicesModal(true);
                }}
                className="py-1 px-2 rounded text-[11px] font-bold font-mono text-emerald-300 hover:text-white hover:bg-emerald-950/60 cursor-pointer"
                title="Full-Service Royal Catering"
              >
                Full-Service Catering
              </button>
              <span className="text-white/30 text-xs px-0.5">|</span>
              <button
                type="button"
                onClick={() => {
                  setServicesModalInitialTab('drop-off');
                  setShowServicesModal(true);
                }}
                className="py-1 px-2 rounded text-[11px] font-bold font-mono text-sky-300 hover:text-white hover:bg-sky-950/60 cursor-pointer"
                title="Drop-off Delivery"
              >
                Drop-off Delivery
              </button>
              <span className="text-white/30 text-xs px-0.5">|</span>
              <button
                type="button"
                onClick={() => {
                  setServicesModalInitialTab('theme-catering');
                  setShowServicesModal(true);
                }}
                className="py-1 px-2 rounded text-[11px] font-bold font-mono text-pink-300 hover:text-white hover:bg-pink-950/60 cursor-pointer"
                title="Theme Catering"
              >
                Theme Catering
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGalleryModal(true)}
              className="py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border hover:scale-[1.02]"
              style={{
                backgroundColor: '#0f2942',
                color: '#ffffff',
                borderColor: '#ffd700',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClientStoriesModal(true)}
              className="py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border hover:scale-[1.02]"
              style={{
                backgroundColor: '#0f2942',
                color: '#ffffff',
                borderColor: '#ffd700',
              }}
            >
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Client Stories</span>
            </button>

            <button
              type="button"
              onClick={() => setShowInquiryModal(true)}
              className="py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border shadow-sm hover:scale-[1.02]"
              style={{
                backgroundColor: '#ffd700',
                color: '#091e3a',
                borderColor: '#ffffff',
              }}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#091e3a]" />
              <span>Inquiry Form</span>
            </button>

            <button
              type="button"
              onClick={() => setShowContactUsModal(true)}
              className="py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border hover:scale-[1.02]"
              style={{
                backgroundColor: '#0f2942',
                color: '#ffffff',
                borderColor: '#ffd700',
              }}
            >
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span>Contact Us</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page Container — Full Width Layout (All 11 Modules Show Only at Bottom) */}
      <div className="w-full">
        {/* Main View — Variation 14 */}
        <main className="main-content w-full">
          {/* Status / Undo Toast Banner */}
          {statusBanner && (
            <div
              role="status"
              className="panel py-3.5 px-5 flex flex-wrap items-center justify-between gap-3 text-sm"
              style={{
                backgroundColor: '#0f2942',
                borderColor: '#ffd700',
                color: '#ffff00',
              }}
            >
              <span className="font-bold" style={{ color: '#ffff00' }}>
                {statusBanner}
              </span>
              <div className="flex items-center gap-2">
                {isDeveloper2FALoggedIn && undoSnapshot && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="btn inline-flex items-center gap-1 py-1.5 px-3 text-xs"
                  >
                    <Undo2 className="w-4 h-4" />
                    <span>Undo</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setStatusBanner(null);
                    setUndoSnapshot(null);
                  }}
                  aria-label="Dismiss notification"
                  className="btn btn-outline py-1.5 px-3 text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Contextual Module Header when not on Custom Menu */}
          {activeModuleId !== '02-menu-builder' && (
            <div
              className="panel py-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              style={{
                backgroundColor: '#0f2942',
                borderColor: '#ffd700',
              }}
            >
              <div>
                <h2
                  className="section-title m-0"
                  style={{ color: '#ffd700' }}
                >
                  {currentModule.title.replace(/^\d+\.\s*/, '')}
                </h2>
                {activeModuleId !== '12-2fa-security' && (
                  <p
                    className="mt-1 font-bold"
                    style={{ fontSize: '16px', color: '#ffffff' }}
                  >
                    {currentModule.subtitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Active Module Content:
              - Public Guest View (!isDeveloper2FALoggedIn && !activeClientTenant): Can view & order in 02 (Dishes Menu (Selection))
              - Authenticated Client Tenant (activeClientTenant) OR Admin Login (isDeveloper2FALoggedIn): ALL MODULES available! */}
          {(isDeveloper2FALoggedIn || activeClientTenant) &&
            activeModuleId === '01-overview' && (
            <Module01Overview
              tasks={visibleTasks}
              events={visibleEvents}
              venueHalls={venueHalls}
              dishes={effectiveDishes}
              onDeleteTask={(id, title) =>
                requireDeveloper2FA(
                  `Delete Checkpoint "${title}" (Developer 2FA)`,
                  () => {
                    recordSnapshot(`Deleted checkpoint "${title}"`);
                    setTasks((prev) => prev.filter((t) => t.id !== id));
                  }
                )
              }
              onAddTask={(newTask) =>
                requireDeveloper2FA(
                  `Add Checkpoint "${newTask.title}" (Developer 2FA)`,
                  () => {
                    setTasks((prev) => [
                      {
                        ...newTask,
                        id: `tsk-${Date.now()}`,
                        clientId:
                          effectiveTenantFilterId || 'CLI-SINGHANIA-01',
                      },
                      ...prev,
                    ]);
                    setUndoSnapshot(null);
                    setStatusBanner(`Added checkpoint "${newTask.title}".`);
                  }
                )
              }
              onToggleTaskStatus={(id) =>
                requireDeveloper2FA(
                  'Update Checkpoint Status (Developer 2FA)',
                  () => {
                    setTasks((prev) =>
                      prev.map((t) => {
                        if (t.id === id) {
                          const nextStatus =
                            t.status === 'Completed'
                              ? 'In Progress'
                              : 'Completed';
                          if (nextStatus === 'Completed') {
                            playAlarmSound();
                            setStatusBanner(
                              `Checkpoint "${t.title}" marked Completed. 🔔 Alarm sounded.`
                            );
                          } else {
                            setStatusBanner(
                              `Checkpoint "${t.title}" marked In Progress.`
                            );
                          }
                          return {
                            ...t,
                            status: nextStatus,
                          };
                        }
                        return t;
                      })
                    );
                  }
                )
              }
              onDeleteEvent={(id, name) =>
                requireDeveloper2FA(
                  `Delete Banquet Event "${name}" (Developer 2FA)`,
                  () => {
                    recordSnapshot(`Deleted banquet event "${name}"`);
                    setEvents((prev) => prev.filter((e) => e.id !== id));
                  }
                )
              }
              onAddVenueHall={(hallName) =>
                requireDeveloper2FA(
                  `Add Venue Hall "${hallName}" (Developer 2FA)`,
                  () => {
                    setVenueHalls((prev) =>
                      prev.some(
                        (h) => h.toLowerCase() === hallName.toLowerCase()
                      )
                        ? prev
                        : [...prev, hallName]
                    );
                    setUndoSnapshot(null);
                    setStatusBanner(
                      `Added new Venue Hall "${hallName}" to Allocation Schedule.`
                    );
                  }
                )
              }
              onUpdateEventVenue={(eventId, newVenueHall) =>
                requireDeveloper2FA(
                  `Update Event Venue Hall to "${newVenueHall}" (Developer 2FA)`,
                  () => {
                    setEvents((prev) =>
                      prev.map((ev) =>
                        ev.id === eventId
                          ? { ...ev, venueHall: newVenueHall }
                          : ev
                      )
                    );
                    setStatusBanner(
                      `Reallocated event to Venue Hall "${newVenueHall}".`
                    );
                  }
                )
              }
            />
          )}

          {activeModuleId === '02-menu-builder' && (
            <Module02MenuBuilder
              dishes={effectiveDishes}
              onAddDish={handleAddDish}
              onBulkAddDishes={handleBulkAddDishes}
              onReplaceByDishCode={handleReplaceByDishCode}
              onReplaceAllDishes={handleReplaceAllDishes}
              onDeleteAllDishes={handleDeleteAllDishes}
              onBulkDeleteDishes={handleBulkDeleteDishes}
              onDeleteDish={handleDeleteDish}
              onToggleDishInMenu={handleToggleDishInMenu}
              onBatchSelectDishes={handleBatchSelectDishes}
              onOpenImageModal={(dish) => {
                if (isDeveloper2FALoggedIn || activeClientTenant) {
                  setEditingImageDishId(dish.id);
                }
              }}
              onDeleteDishImage={handleDeleteDishImage}
              onUpdateDishPrice={
                (isDeveloper2FALoggedIn || activeClientTenant) ? handleUpdateDishPrice : undefined
              }
              isAdmin={isDeveloper2FALoggedIn || Boolean(activeClientTenant)}
              onOpenCustomerOrderModal={(pax) => {
                setOrderGuestPax(pax);
                setShowCustomerOrderModal(true);
              }}
              visibleModules={visibleModules}
              activeModuleId={activeModuleId}
              onSelectModule={handleSelectModule}
              isDeveloper2FALoggedIn={isDeveloper2FALoggedIn}
              activeClientTenantId={activeClientTenant?.clientId}
              selectedOrderCount={selectedOrderDishes.length}
              onPlaceOrder={() => setShowCustomerOrderModal(true)}
            />
          )}

          {(isDeveloper2FALoggedIn || activeClientTenant) &&
            activeModuleId === '04-crm-leads' && (
            <Module04CrmLeads
              leads={visibleLeads}
              onAddLead={(newLead) =>
                requireDeveloper2FA(
                  `Add Inquiry Lead "${newLead.clientName}" (Developer 2FA)`,
                  () => {
                    setLeads((prev) => [
                      {
                        ...newLead,
                        id: `lead-${Date.now()}`,
                        clientId:
                          newLead.clientId ||
                          effectiveTenantFilterId ||
                          'CLI-SINGHANIA-01',
                      },
                      ...prev,
                    ]);
                    setUndoSnapshot(null);
                    setStatusBanner(
                      `Added inquiry lead "${newLead.clientName}".`
                    );
                  }
                )
              }
              onDeleteLead={(id, clientName) =>
                requireDeveloper2FA(
                  `Delete Inquiry Lead "${clientName}" (Developer 2FA)`,
                  () => {
                    recordSnapshot(`Deleted inquiry lead "${clientName}"`);
                    setLeads((prev) => prev.filter((l) => l.id !== id));
                  }
                )
              }
              onUpdateLeadStage={(id, stage) =>
                requireDeveloper2FA(
                  `Update CRM Stage to "${stage}" (Developer 2FA)`,
                  () => {
                    setLeads((prev) =>
                      prev.map((l) => (l.id === id ? { ...l, stage } : l))
                    );
                  }
                )
              }
            />
          )}

          {(isDeveloper2FALoggedIn || activeClientTenant) &&
            activeModuleId === '05-proposals-whatsapp' && (
              <Module05ProposalsWhatsapp
                proposals={visibleProposals}
                onAddProposal={(newProp) =>
                  requireDeveloper2FA(
                    `Create Proposal Quote "${newProp.quoteNo}" (Developer 2FA)`,
                    () => {
                      setProposals((prev) => [
                        {
                          ...newProp,
                          id: `prop-${Date.now()}`,
                          clientId:
                            newProp.clientId ||
                            effectiveTenantFilterId ||
                            'CLI-SINGHANIA-01',
                        },
                        ...prev,
                      ]);
                      setUndoSnapshot(null);
                      setStatusBanner(`Created proposal "${newProp.quoteNo}".`);
                    }
                  )
                }
                onDeleteProposal={(id, quoteNo) =>
                  requireDeveloper2FA(
                    `Delete Proposal Quote "${quoteNo}" (Developer 2FA)`,
                    () => {
                      recordSnapshot(`Deleted proposal quote "${quoteNo}"`);
                      setProposals((prev) => prev.filter((p) => p.id !== id));
                    }
                  )
                }
              />
            )}

          {(isDeveloper2FALoggedIn || activeClientTenant) &&
            activeModuleId === '06-banquet-calendar' && (
              <Module06BanquetCalendar
                events={visibleEvents}
                venueHalls={venueHalls}
                onAddEvent={(newEv) =>
                  requireDeveloper2FA(
                    `Book Banquet Event "${newEv.eventName}" (Developer 2FA)`,
                    () => {
                      setEvents((prev) => [
                        {
                          ...newEv,
                          id: `evt-${Date.now()}`,
                          clientId:
                            newEv.clientId ||
                            effectiveTenantFilterId ||
                            'CLI-SINGHANIA-01',
                        },
                        ...prev,
                      ]);
                      setVenueHalls((prev) =>
                        prev.includes(newEv.venueHall)
                          ? prev
                          : [...prev, newEv.venueHall]
                      );
                      setUndoSnapshot(null);
                      setStatusBanner(
                        `Booked banquet event "${newEv.eventName}" at ${newEv.venueHall}.`
                      );
                    }
                  )
                }
                onDeleteEvent={(id, eventName) =>
                  requireDeveloper2FA(
                    `Delete Banquet Event "${eventName}" (Developer 2FA)`,
                    () => {
                      recordSnapshot(`Deleted banquet event "${eventName}"`);
                      setEvents((prev) => prev.filter((e) => e.id !== id));
                    }
                  )
                }
                onUpdateEventStatus={(id, status) =>
                  requireDeveloper2FA(
                    `Update Event Status to "${status}" (Developer 2FA)`,
                    () => {
                      const targetEv = events.find((e) => e.id === id);
                      setEvents((prev) =>
                        prev.map((ev) => (ev.id === id ? { ...ev, status } : ev))
                      );
                      if (status === 'Completed' && targetEv) {
                        setStaff((prevStaff) =>
                          prevStaff.map((s) =>
                            s.assignedEvent.toLowerCase().includes(targetEv.eventName.toLowerCase()) ||
                            targetEv.eventName.toLowerCase().includes(s.assignedEvent.toLowerCase())
                              ? { ...s, attendance: 'Standby' }
                              : s
                          )
                        );
                        setStatusBanner(`Event "${targetEv.eventName}" finished. Assigned staff automatically moved to Standby.`);
                      } else if (targetEv) {
                        setStatusBanner(`Updated event "${targetEv.eventName}" status to ${status}.`);
                      }
                    }
                  )
                }
                onAddVenueHall={(hallName) =>
                  requireDeveloper2FA(
                    `Add Venue Hall "${hallName}" (Developer 2FA)`,
                    () => {
                      setVenueHalls((prev) =>
                        prev.some(
                          (h) => h.toLowerCase() === hallName.toLowerCase()
                        )
                          ? prev
                          : [...prev, hallName]
                      );
                      setUndoSnapshot(null);
                      setStatusBanner(
                        `Added new Venue Hall "${hallName}" to Allocation Schedule.`
                      );
                    }
                  )
                }
                onDeleteVenueHall={(hallName) =>
                  requireDeveloper2FA(
                    `Remove Venue Hall "${hallName}" (Developer 2FA)`,
                    () => {
                      recordSnapshot(`Removed Venue Hall "${hallName}"`);
                      setVenueHalls((prev) =>
                        prev.filter((h) => h !== hallName)
                      );
                    }
                  )
                }
                onUpdateEventVenue={(eventId, newVenueHall) =>
                  requireDeveloper2FA(
                    `Update Event Venue Hall to "${newVenueHall}" (Developer 2FA)`,
                    () => {
                      setEvents((prev) =>
                        prev.map((ev) =>
                          ev.id === eventId
                            ? { ...ev, venueHall: newVenueHall }
                            : ev
                        )
                      );
                      setStatusBanner(
                        `Reallocated event to Venue Hall "${newVenueHall}".`
                      );
                    }
                  )
                }
              />
            )}

          {(isDeveloper2FALoggedIn || activeClientTenant) &&
            activeModuleId === '07-kitchen-kot' && (
            <Module07KitchenKot
              kots={visibleKots}
              dishes={effectiveDishes}
              onAddKot={(newKot) =>
                requireDeveloper2FA(
                  `Dispatch Kitchen KOT "${newKot.kotNumber}" (Developer 2FA)`,
                  () => {
                    const createdKot: KotTicket = {
                      ...newKot,
                      id: `kot-${Date.now()}`,
                      clientId:
                        newKot.clientId ||
                        effectiveTenantFilterId ||
                        'CLI-SINGHANIA-01',
                      stockDeducted: true,
                    };
                    setKots((prev) => [createdKot, ...prev]);
                    setUndoSnapshot(null);
                    consumeKotIngredientsAndAutoPo(createdKot);
                  }
                )
              }
              onDeleteKot={(id, kotNumber) =>
                requireDeveloper2FA(
                  `Delete Kitchen KOT "${kotNumber}" (Developer 2FA)`,
                  () => {
                    recordSnapshot(
                      `Deleted Kitchen Order Ticket "${kotNumber}"`
                    );
                    setKots((prev) => prev.filter((k) => k.id !== id));
                  }
                )
              }
              onUpdateKotStatus={(id, status) =>
                requireDeveloper2FA(
                  `Update KOT Status to "${status}" (Developer 2FA)`,
                  () => {
                    const targetKot = kots.find((k) => k.id === id);
                    setKots((prev) =>
                      prev.map((k) => (k.id === id ? { ...k, status } : k))
                    );
                    if (
                      targetKot &&
                      !targetKot.stockDeducted &&
                      (status === 'Firing on Range' ||
                        status === 'Plated & Dispatched')
                    ) {
                      consumeKotIngredientsAndAutoPo({
                        ...targetKot,
                        status,
                      });
                    }
                  }
                )
              }
              onConsumeKotIngredients={(kotId) =>
                requireDeveloper2FA(
                  'Consume KOT Ingredients from Stock Ledger (Developer 2FA)',
                  () => {
                    const targetKot = kots.find((k) => k.id === kotId);
                    if (targetKot) {
                      consumeKotIngredientsAndAutoPo(targetKot);
                    }
                  }
                )
              }
              onOpenImageModal={(dish) => setEditingImageDishId(dish.id)}
              onDeleteDishImage={handleDeleteDishImage}
            />
          )}

          {(isDeveloper2FALoggedIn || activeClientTenant) &&
            activeModuleId === '08-inventory-po' && (
            <Module08InventoryPo
              inventory={inventory}
              purchaseOrders={purchaseOrders}
              onAddInventory={(newItem) =>
                requireDeveloper2FA(
                  `Add Raw Material SKU "${newItem.itemName}" (Developer 2FA)`,
                  () => {
                    setInventory((prev) => [
                      { ...newItem, id: `inv-${Date.now()}` },
                      ...prev,
                    ]);
                    setUndoSnapshot(null);
                    setStatusBanner(`Added SKU "${newItem.itemName}".`);
                  }
                )
              }
              onDeleteInventory={(id, itemName) =>
                requireDeveloper2FA(
                  `Delete Raw Material SKU "${itemName}" (Developer 2FA)`,
                  () => {
                    recordSnapshot(`Deleted inventory item "${itemName}"`);
                    setInventory((prev) => prev.filter((i) => i.id !== id));
                  }
                )
              }
              onUpdateInventoryItem={(id, updatedFields) =>
                requireDeveloper2FA(
                  `Update Raw Material SKU Details (Developer 2FA)`,
                  () => {
                    const target = inventory.find((i) => i.id === id);
                    setInventory((prev) =>
                      prev.map((item) =>
                        item.id === id ? { ...item, ...updatedFields } : item
                      )
                    );
                    if (target) {
                      setStatusBanner(`Updated raw material SKU "${target.itemName}".`);
                    }
                  }
                )
              }
              onUpdateInventoryQty={(id, newQty) =>
                requireDeveloper2FA(
                  'Update Raw Material Stock Quantity (Developer 2FA)',
                  () => {
                    const target = inventory.find((i) => i.id === id);
                    setInventory((prev) =>
                      prev.map((item) =>
                        item.id === id ? { ...item, inStockQty: newQty } : item
                      )
                    );
                    if (target) {
                      if (newQty <= target.reorderLevel) {
                        const alreadyHasIssuedPo = purchaseOrders.some(
                          (po) =>
                            po.status === 'Issued' &&
                            (po.itemsSummary.includes(target.sku) ||
                              po.itemsSummary
                                .toLowerCase()
                                .includes(target.itemName.toLowerCase()))
                        );
                        if (!alreadyHasIssuedPo) {
                          const orderQty = Math.max(
                            50,
                            target.reorderLevel * 2
                          );
                          const autoPo: PurchaseOrder = {
                            id: `po-auto-${Date.now()}`,
                            poNumber: `AUTO-PO-2026-${
                              401 + purchaseOrders.length
                            }`,
                            vendorName: target.preferredVendor,
                            itemsSummary: `Auto-Reorder: ${orderQty} ${target.unit} ${target.itemName} (${target.sku}) — Stock at ${newQty} ${target.unit} (Min: ${target.reorderLevel} ${target.unit})`,
                            deliveryDate: '2026-10-18',
                            totalAmount: Math.round(
                              orderQty * target.unitPrice
                            ),
                            status: 'Issued',
                          };
                          setPurchaseOrders((prev) => [autoPo, ...prev]);
                          setStatusBanner(
                            `Stock for "${target.itemName}" dropped to ${newQty} ${target.unit} (<= Min ${target.reorderLevel} ${target.unit}) → Auto-Generated Purchase Order ${autoPo.poNumber}!`
                          );
                          return;
                        }
                      }
                      setStatusBanner(
                        `Updated stock for "${target.itemName}" to ${newQty} ${target.unit}.`
                      );
                    }
                  }
                )
              }
              onAddPo={(newPo) =>
                requireDeveloper2FA(
                  `Issue Vendor PO "${newPo.poNumber}" (Developer 2FA)`,
                  () => {
                    setPurchaseOrders((prev) => [
                      { ...newPo, id: `po-${Date.now()}` },
                      ...prev,
                    ]);
                    setUndoSnapshot(null);
                    setStatusBanner(
                      `Issued purchase order "${newPo.poNumber}".`
                    );
                  }
                )
              }
              onDeletePo={(id, poNumber) =>
                requireDeveloper2FA(
                  `Delete Vendor PO "${poNumber}" (Developer 2FA)`,
                  () => {
                    recordSnapshot(`Deleted purchase order "${poNumber}"`);
                    setPurchaseOrders((prev) =>
                      prev.filter((p) => p.id !== id)
                    );
                  }
                )
              }
              onUpdatePoStatus={(id, status) =>
                requireDeveloper2FA(
                  `Update PO Status to "${status}" (Developer 2FA)`,
                  () => {
                    setPurchaseOrders((prev) =>
                      prev.map((po) =>
                        po.id === id ? { ...po, status } : po
                      )
                    );
                    const targetPo = purchaseOrders.find((p) => p.id === id);
                    setStatusBanner(
                      `Updated ${targetPo ? targetPo.poNumber : 'PO'} status to "${status}".`
                    );
                  }
                )
              }
            />
          )}

          {(isDeveloper2FALoggedIn || activeClientTenant) &&
            activeModuleId === '09-staff-roster' && (
            <Module09StaffRoster
              staff={visibleStaff}
              events={visibleEvents}
              onAddStaff={(newMember) =>
                requireDeveloper2FA(
                  `Assign Staff "${newMember.fullName}" (Developer 2FA)`,
                  () => {
                    setStaff((prev) => [
                      {
                        ...newMember,
                        id: `stf-${Date.now()}`,
                        clientId:
                          newMember.clientId ||
                          effectiveTenantFilterId ||
                          'CLI-SINGHANIA-01',
                      },
                      ...prev,
                    ]);
                    setUndoSnapshot(null);
                    setStatusBanner(
                      `Added "${newMember.fullName}" to brigade roster.`
                    );
                  }
                )
              }
              onDeleteStaff={(id, fullName) =>
                requireDeveloper2FA(
                  `Remove Staff "${fullName}" (Developer 2FA)`,
                  () => {
                    recordSnapshot(`Removed staff member "${fullName}"`);
                    setStaff((prev) => prev.filter((s) => s.id !== id));
                  }
                )
              }
              onUpdateStaffAttendance={(id, attendance) =>
                requireDeveloper2FA(
                  `Update Staff Shift Status to "${attendance}" (Developer 2FA)`,
                  () => {
                    const target = staff.find((s) => s.id === id);
                    setStaff((prev) =>
                      prev.map((s) =>
                        s.id === id ? { ...s, attendance } : s
                      )
                    );
                    setStatusBanner(
                      `Updated ${
                        target ? target.fullName : 'staff'
                      } status to "${attendance}".`
                    );
                  }
                )
              }
              onUpdateStaffMember={(id, updated) =>
                requireDeveloper2FA(
                  `Update Staff Details for "${
                    updated.fullName || 'Brigade Member'
                  }" (Developer 2FA)`,
                  () => {
                    setStaff((prev) =>
                      prev.map((s) =>
                        s.id === id ? { ...s, ...updated } : s
                      )
                    );
                    setStatusBanner(
                      `Updated roster details for "${
                        updated.fullName || 'staff member'
                      }".`
                    );
                  }
                )
              }
            />
          )}

          {(isDeveloper2FALoggedIn || activeClientTenant) &&
            activeModuleId === '10-gst-invoicing' && (
              <Module10GstInvoicing
                invoices={visibleInvoices}
                onAddInvoice={(newInv) =>
                  requireDeveloper2FA(
                    `Issue GST Tax Invoice "${newInv.invoiceNo}" (Developer 2FA)`,
                    () => {
                      setInvoices((prev) => [
                        {
                          ...newInv,
                          id: `inv-gst-${Date.now()}`,
                          clientId:
                            newInv.clientId ||
                            effectiveTenantFilterId ||
                            'CLI-SINGHANIA-01',
                        },
                        ...prev,
                      ]);
                      setUndoSnapshot(null);
                      setStatusBanner(
                        `Generated GST invoice "${newInv.invoiceNo}".`
                      );
                    }
                  )
                }
                onDeleteInvoice={(id, invoiceNo) =>
                  requireDeveloper2FA(
                    `Delete GST Invoice "${invoiceNo}" (Developer 2FA)`,
                    () => {
                      recordSnapshot(`Deleted GST invoice "${invoiceNo}"`);
                      setInvoices((prev) => prev.filter((i) => i.id !== id));
                    }
                  )
                }
                onRecordPayment={handleRecordInvoicePayment}
                purchaseOrders={purchaseOrders}
                onRequire2FA={requireDeveloper2FA}
              />
            )}

          {(isDeveloper2FALoggedIn || activeClientTenant) &&
            activeModuleId === '11-client-emenu' && (
              <Module11ClientEMenu
                dishes={effectiveDishes}
                tastingNotes={visibleTastingNotes}
                onBulkAddDishes={handleBulkAddDishes}
                onReplaceByDishCode={handleReplaceByDishCode}
                onReplaceAllDishes={handleReplaceAllDishes}
                onDeleteAllDishes={handleDeleteAllDishes}
                onBulkDeleteDishes={handleBulkDeleteDishes}
                onDeleteDish={handleDeleteDish}
                onToggleDishInMenu={handleToggleDishInMenu}
                onOpenImageModal={(dish) => {
                  if (isDeveloper2FALoggedIn || activeClientTenant) {
                    setEditingImageDishId(dish.id);
                  }
                }}
                onDeleteDishImage={handleDeleteDishImage}
                onUpdateDishPrice={
                  (isDeveloper2FALoggedIn || activeClientTenant) ? handleUpdateDishPrice : undefined
                }
                isAdmin={isDeveloper2FALoggedIn || Boolean(activeClientTenant)}
                onAddTastingNote={(newNote) => {
                  if (activeClientTenant && !isDeveloper2FALoggedIn) {
                    setTastingNotes((prev) => [
                      {
                        ...newNote,
                        id: `note-${Date.now()}`,
                        clientId: activeClientTenant.clientId,
                        clientName: activeClientTenant.clientName,
                      },
                      ...prev,
                    ]);
                    setUndoSnapshot(null);
                    setStatusBanner(
                      `Saved tasting feedback for ${activeClientTenant.clientName} (${activeClientTenant.clientId}).`
                    );
                    return;
                  }
                  requireDeveloper2FA(
                    `Save Tasting Note from "${newNote.clientName}" (Developer 2FA)`,
                    () => {
                      setTastingNotes((prev) => [
                        {
                          ...newNote,
                          id: `note-${Date.now()}`,
                          clientId:
                            newNote.clientId ||
                            effectiveTenantFilterId ||
                            'CLI-SINGHANIA-01',
                        },
                        ...prev,
                      ]);
                      setUndoSnapshot(null);
                      setStatusBanner(
                        `Added tasting note from "${newNote.clientName}".`
                      );
                    }
                  );
                }}
                onDeleteTastingNote={(id, clientName) =>
                  requireDeveloper2FA(
                    `Delete Tasting Note from "${clientName}" (Developer 2FA)`,
                    () => {
                      recordSnapshot(
                        `Deleted tasting note from "${clientName}"`
                      );
                      setTastingNotes((prev) =>
                        prev.filter((n) => n.id !== id)
                      );
                    }
                  )
                }
              />
            )}

          {isDeveloper2FALoggedIn &&
            activeModuleId === '12-2fa-security' && (
              <Module12SecurityOtp
                masterOtp={masterOtp}
                onUpdateMasterOtp={(newOtp) => {
                  setMasterOtp(newOtp);
                  setUndoSnapshot(null);
                }}
                clientTenants={
                  effectiveTenantFilterId
                    ? clientTenants.filter(
                        (c) => c.clientId === effectiveTenantFilterId
                      )
                    : clientTenants
                }
                adminOtpDispatchLogs={
                  effectiveTenantFilterId
                    ? adminOtpDispatchLogs.filter(
                        (log) => log.clientId === effectiveTenantFilterId
                      )
                    : adminOtpDispatchLogs
                }
                onAddClientTenant={handleCreateNewClientTenant}
                onUpdateClientTenantOtp={(clientId, newOtp) => {
                  setClientTenants((prev) =>
                    prev.map((c) =>
                      c.clientId === clientId ? { ...c, otpCode: newOtp } : c
                    )
                  );
                  setAdminOtpDispatchLogs((prev) =>
                    prev.map((log) =>
                      log.clientId === clientId
                        ? { ...log, otpCode: newOtp }
                        : log
                    )
                  );
                  setStatusBanner(
                    `Updated 6-digit OTP for ${clientId} to ${newOtp}.`
                  );
                }}
                onDeleteClientTenant={(clientId) => {
                  setClientTenants((prev) =>
                    prev.filter((c) => c.clientId !== clientId)
                  );
                  setAdminOtpDispatchLogs((prev) =>
                    prev.filter((log) => log.clientId !== clientId)
                  );
                  setStatusBanner(`Removed Client Tenant ${clientId}.`);
                }}
                onDeleteOtpDispatchLog={(logId, clientId) => {
                  setAdminOtpDispatchLogs((prev) =>
                    prev.filter((log) => log.id !== logId)
                  );
                  setClientTenants((prev) =>
                    prev.filter((c) => c.clientId !== clientId)
                  );
                  setStatusBanner(`Deleted OTP dispatch record for ${clientId}.`);
                }}
                onLoginAsClientTenant={handleSuccessClientTenantLogin}
              />
            )}

          {/* =========================================================================
              ALL 11 MODULES SHOWN ONLY AT BOTTOM IN ALL MODULE PAGES
              (Customer Portal, Client Login, and Admin Login)
              ========================================================================= */}
          <section
            id="bottom-modules-nav"
            aria-label="Bottom Modules Navigation & Operations Suite"
            className="mt-10 pt-8 border-t-4 border-[#0f2942]/30 space-y-5"
          >
            {/* Unified Order Stats Grid: Total Bill, Guaranteed Pax, Menu Rate, Catalog Status */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="lbl">Total Bill</div>
                <div className="val tabular-nums whitespace-nowrap">
                  ₹{(perPlateSelling * orderGuestPax).toLocaleString('en-IN')}
                </div>
                <div className="lbl">{selectedOrderDishes.length} Dishes Select</div>
              </div>

              <div className="stat-card">
                <div className="lbl">Guaranteed Pax</div>
                <input
                  id="bottom-guaranteed-pax-input"
                  type="number"
                  min={25}
                  step={25}
                  value={orderGuestPax}
                  onChange={(e) =>
                    setOrderGuestPax(Math.max(1, Number(e.target.value) || 100))
                  }
                  aria-label="Guaranteed Guest Pax"
                  className="val w-28 px-2 py-0.5 tabular-nums focus:outline-none"
                />
                <div className="lbl">Guests</div>
              </div>

              <div className="stat-card">
                <div className="lbl">Menu Rate</div>
                <div className="val tabular-nums whitespace-nowrap">
                  ₹{perPlateSelling.toLocaleString('en-IN')} / plate
                </div>
                {isDeveloper2FALoggedIn || activeClientTenant ? (
                  <div className="lbl">
                    Food Cost: ₹{selectedOrderDishes.reduce((s, d) => s + d.foodCostPerPlate, 0).toLocaleString('en-IN')}
                  </div>
                ) : (
                  <div className="lbl">Per Plate Rate</div>
                )}
              </div>

              <div className="stat-card flex flex-col justify-between">
                <div className="lbl">Catalog Status</div>
                <div className="val">
                  {selectedOrderDishes.length} / {effectiveDishes.length}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomerOrderModal(true)}
                  className="btn text-xs py-2 px-3 mt-1 whitespace-nowrap cursor-pointer"
                >
                  Confirm Banquet Order
                </button>
              </div>
            </div>

            {/* Dual Panels: Selection Count with Place Order & All 11 Modules Navigation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              {/* Selection Count Panel with Place Order Button */}
              <div
                className="panel lg:col-span-1 flex flex-col justify-between p-5 rounded-xl border-2 shadow-sm"
                style={{
                  backgroundColor: '#0f2942',
                  borderColor: '#ffd700',
                  color: '#ffffff',
                }}
              >
                <div className="text-center" style={{ margin: 0, padding: 0 }}>
                  <span className="label font-mono uppercase font-bold" style={{ color: '#ffd700', margin: 0, marginLeft: 0, padding: 0 }}>
                    Selection Count
                  </span>
                  <div
                    style={{
                      fontSize: '3.8rem',
                      fontWeight: 800,
                      lineHeight: 1,
                      margin: 0,
                      padding: 0,
                      color: '#ffffff',
                    }}
                  >
                    {selectedOrderDishes.length}
                  </div>
                  <p style={{ fontSize: '15px', color: '#fff7e6', fontWeight: 700, margin: 0, padding: 0 }}>
                    Items listed in current overview.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomerOrderModal(true)}
                  className="btn mt-5 w-full py-3.5 text-base font-bold shadow-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
                  style={{
                    backgroundColor: '#ffd700',
                    color: '#091e3a',
                    border: '2px solid #ffffff',
                  }}
                >
                  Place Order
                </button>
              </div>

              {/* All 11 Modules Navigation Tabs */}
              <div
                className="panel lg:col-span-2 flex flex-col justify-between p-5 rounded-xl border-2 shadow-sm"
                style={{
                  backgroundColor: '#0f2942',
                  borderColor: '#ffd700',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-[#ffd700]/30">
                    <h3
                      className="section-title m-0 text-base font-bold"
                      style={{ color: '#ffd700' }}
                    >
                      Modules ({visibleModules.length})
                    </h3>
                    {isDeveloper2FALoggedIn ? (
                      <span
                        className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-400"
                        style={{ color: '#ffff00' }}
                      >
                        Admin 2FA Active
                      </span>
                    ) : activeClientTenant ? (
                      <span
                        className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/80 border border-amber-400"
                        style={{ color: '#ffff00' }}
                      >
                        {activeClientTenant.clientId} Active
                      </span>
                    ) : (
                      <span
                        className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-600"
                        style={{ color: '#ffff00' }}
                      >
                        Active
                      </span>
                    )}
                  </div>

                  <nav
                    aria-label="Bottom TheCaterings Modules Navigation"
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5"
                  >
                    {visibleModules.map((mod) => {
                      const isActive = mod.id === activeModuleId;
                      const cleanTitle = mod.title.replace(/^\d+\.\s*/, '');
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => {
                            handleSelectModule(mod.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`nav-item text-xs font-bold py-2.5 px-3 rounded-lg border transition-all cursor-pointer text-left ${
                            isActive ? 'active' : ''
                          }`}
                          style={{ fontSize: '13px' }}
                        >
                          {cleanTitle}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Footer — Variation 14 */}
      <footer className="tc-footer">
        <div className="footer-copy">
          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
            © 2026 TheCaterings // reserve all copyright OPS-PROTOCOL
          </div>
        </div>
        <div className="footer-legal">
          <strong>Terms &amp; Conditions:</strong> 1. GST applicable under SAC
          996333 (5%) / SAC 996332 (18%). 2. 50% advance mandatory on booking;
          100% settlement 24 hrs prior to event dispatch. 3. Guaranteed pax
          locked 48 hrs before function. 4. Subject to New Delhi Jurisdiction
          only. E. &amp; O.E.
        </div>
      </footer>

      {/* Dish Image Add / Change / Delete Modal (Admin Only) */}
      {isDeveloper2FALoggedIn && (
        <DishImageModal
          dish={editingDish}
          onClose={() => setEditingImageDishId(null)}
          onSaveImage={handleSaveDishImage}
          onDeleteImage={handleDeleteDishImage}
        />
      )}

      {/* Customer Catering Order Checkout Modal */}
      {showCustomerOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border-2 border-[#1B1B1B] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="bg-white text-[#1B1B1B] px-5 py-4 border-b-2 border-[#1B1B1B] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#1B1B1B]" />
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#1B1B1B] block font-bold">
                    TheCaterings Customer Order
                  </span>
                  <h3 className="text-base font-bold text-[#1B1B1B]">
                    Confirm Your Custom Banquet Menu Order
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerOrderModal(false)}
                className="p-1 text-[#1B1B1B] hover:opacity-75 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCustomerOrderSubmit}
              className="p-5 space-y-4 max-h-[82vh] overflow-y-auto bg-white"
            >
              <div className="bg-white border-2 border-[#1B1B1B] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1B1B1B]">
                  <span>
                    Selected Menu Dishes ({selectedOrderDishes.length})
                  </span>
                  <span className="font-mono">
                    ₹{perPlateSelling.toLocaleString('en-IN')} / plate
                  </span>
                </div>
                <div className="max-h-28 overflow-y-auto divide-y divide-slate-200/70 text-xs">
                  {selectedOrderDishes.map((d) => (
                    <div
                      key={d.id}
                      className="selected-menu-dish py-1 flex items-center justify-between text-[#1B1B1B]"
                    >
                      <span className="product-title truncate pr-2">
                        {d.code} · {d.name}
                      </span>
                      <span className="font-mono shrink-0">
                        ₹{d.sellingPricePerPlate} / plate
                      </span>
                    </div>
                  ))}
                  {selectedOrderDishes.length === 0 && (
                    <p className="text-red-600 py-1">
                      Please select at least 1 dish from the menu to place an
                      order.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderCustomerName}
                    onChange={(e) => setOrderCustomerName(e.target.value)}
                    placeholder="e.g. Vikramaditya Singhania"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#1B1B1B] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
                    Mobile / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={orderCustomerPhone}
                    onChange={(e) => setOrderCustomerPhone(e.target.value)}
                    placeholder="+91 98110 44210"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#1B1B1B] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={orderEventDate}
                    onChange={(e) => setOrderEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#1B1B1B] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
                    Guaranteed Guest Pax *
                  </label>
                  <input
                    type="number"
                    min={25}
                    required
                    value={orderGuestPax}
                    onChange={(e) =>
                      setOrderGuestPax(
                        Math.max(25, Number(e.target.value) || 100)
                      )
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#1B1B1B] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
                  Banquet Venue / Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={orderEventVenue}
                  onChange={(e) => setOrderEventVenue(e.target.value)}
                  placeholder="e.g. Chhatarpur Royal Farms, New Delhi"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#1B1B1B] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
                  Preferred Payment Method
                </label>
                <select
                  value={orderPaymentMethod}
                  onChange={(e) => setOrderPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#1B1B1B] rounded-lg bg-white"
                >
                  <option value="Indian UPI (GPay / PhonePe / BHIM)">
                    Indian UPI (GPay / PhonePe / BHIM)
                  </option>
                  <option value="Razorpay Corporate NetBanking / Card">
                    Razorpay Corporate NetBanking / Card
                  </option>
                  <option value="PayPal International Checkout">
                    PayPal International Checkout
                  </option>
                  <option value="Pay 50% Booking Advance at Venue">
                    Pay 50% Booking Advance at Venue
                  </option>
                </select>
              </div>

              <div className="bg-white border-2 border-[#1B1B1B] rounded-lg p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-[#1B1B1B]">
                  <span>
                    Taxable Catering Amount ({orderGuestPax} Pax × ₹
                    {perPlateSelling}):
                  </span>
                  <span>₹{orderTaxableTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#1B1B1B]">
                  <span>GST (5% SAC 996333):</span>
                  <span>₹{orderGstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1B1B1B] pt-1 border-t border-[#1B1B1B]">
                  <span>Grand Total Order Value:</span>
                  <span>₹{orderGrandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1B1B1B]">
                <button
                  type="button"
                  onClick={() => setShowCustomerOrderModal(false)}
                  className="btn text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedOrderDishes.length === 0}
                  className="btn btn-accent inline-flex items-center gap-1.5 text-xs py-2 px-5 disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#1B1B1B]" />
                  <span>Confirm &amp; Place Catering Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Tenant Client ID / Tenant ID / Mobile Number + 2FA OTP Login & New Create Tab Modal */}
      {showAdminLoginModal && (
        <div className="relative">
          <StenStudio2FALoginGate
            masterOtp={masterOtp}
            clientTenants={clientTenants}
            adminOtpDispatchLogs={adminOtpDispatchLogs}
            initialMode={loginModalInitialMode}
            onClose={() => setShowAdminLoginModal(false)}
            onSuccessClientLogin={handleSuccessClientTenantLogin}
            onCreateClientTenant={handleCreateNewClientTenant}
            onSuccessLogin={() => {
              try {
                sessionStorage.setItem('thecaterings_2fa_session', 'unlocked');
                sessionStorage.removeItem('thecaterings_client_tenant_id');
              } catch {
                // ignore
              }
              setActiveClientTenantId(null);
              setIsDeveloper2FALoggedIn(true);
              setShowAdminLoginModal(false);
              setStatusBanner(
                'Master Admin 2FA Login verified. All Banquet Operations Suite modules and Multi-Tenant Database controls are now unlocked.'
              );
            }}
          />
        </div>
      )}

      {/* Enterprise Database Backup System Modal (Client & Admin Login) */}
      {showBackupModal && (
        <BackupSystemModal
          portalType={isDeveloper2FALoggedIn ? 'admin' : 'client'}
          currentClientTenant={activeClientTenant}
          clientTenants={clientTenants}
          dishes={dishes}
          tasks={tasks}
          leads={leads}
          proposals={proposals}
          events={events}
          kots={kots}
          inventory={inventory}
          purchaseOrders={purchaseOrders}
          staff={staff}
          gstInvoices={invoices}
          tastingNotes={tastingNotes}
          masterOtp={masterOtp}
          onRestoreBackup={handleRestoreBackup}
          onClose={() => setShowBackupModal(false)}
        />
      )}

      {/* Developer 2FA Action-Level Challenge Modal (only if session not logged in) */}
      {!isDeveloper2FALoggedIn && pending2FAAction && (
        <StenStudio2FAActionModal
          actionLabel={pending2FAAction.label}
          masterOtp={masterOtp}
          onConfirmAction={() => {
            try {
              sessionStorage.setItem('thecaterings_2fa_session', 'unlocked');
            } catch {
              // ignore
            }
            setIsDeveloper2FALoggedIn(true);
            const actionToRun = pending2FAAction.execute;
            setPending2FAAction(null);
            actionToRun();
          }}
          onCancel={() => setPending2FAAction(null)}
        />
      )}

      {/* 6 Public Brand Modals (Request 7: About Us, Services, Gallery, Client Stories, Inquiry Form, Contact Us) */}
      <AboutUsModal
        isOpen={showAboutUsModal}
        onClose={() => setShowAboutUsModal(false)}
        onOpenInquiry={() => {
          setShowAboutUsModal(false);
          setShowInquiryModal(true);
        }}
      />

      <ServicesModal
        isOpen={showServicesModal}
        initialTab={servicesModalInitialTab}
        onClose={() => setShowServicesModal(false)}
        onOpenInquiryWithService={(service) => {
          setInquiryInitialService(service);
          setShowServicesModal(false);
          setShowInquiryModal(true);
        }}
      />

      <GalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        onOpenInquiry={() => {
          setShowGalleryModal(false);
          setShowInquiryModal(true);
        }}
      />

      <ClientStoriesModal
        isOpen={showClientStoriesModal}
        onClose={() => setShowClientStoriesModal(false)}
        onOpenInquiry={() => {
          setShowClientStoriesModal(false);
          setShowInquiryModal(true);
        }}
      />

      <InquiryFormModal
        isOpen={showInquiryModal}
        defaultService={inquiryInitialService}
        onClose={() => setShowInquiryModal(false)}
        onSubmitInquiry={(formData) => {
          const newLead: CrmLead = {
            id: `crm-${Date.now()}`,
            code: `INQ-${1001 + leads.length}`,
            clientId: activeClientTenant?.clientId || 'CLI-SINGHANIA-01',
            clientName: formData.clientName || 'New Client Inquiry',
            eventTitle: `${formData.serviceType || 'Bespoke Banquet Catering'} · ${formData.eventType || 'Royal Wedding'}`,
            eventDate:
              formData.eventDate || new Date().toISOString().split('T')[0],
            venue: formData.venueLocation || 'Delhi NCR Banquet Venue',
            guestPax: Number(formData.guestCount) || 300,
            targetRatePerPlate: 1250,
            stage: 'New Inquiry',
            phone: formData.contactNumber || '',
            dietaryPreference: 'Pure Veg · Jain Available',
          };
          setLeads((prev) => [newLead, ...prev]);
          setStatusBanner(
            `Inquiry received from ${formData.clientName}! Our banquet concierge will contact you on WhatsApp / Phone.`
          );
          setShowInquiryModal(false);
        }}
      />

      <ContactUsModal
        isOpen={showContactUsModal}
        onClose={() => setShowContactUsModal(false)}
        onOpenInquiry={() => {
          setShowContactUsModal(false);
          setShowInquiryModal(true);
        }}
      />
    </div>
  );
}
