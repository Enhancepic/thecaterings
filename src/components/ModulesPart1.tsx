import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ImagePlus,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Utensils,
  Calculator,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Crown,
  Briefcase,
  PartyPopper,
  Flame,
  Sparkles,
} from 'lucide-react';
import {
  DishItem,
  OverviewTask,
  BanquetEvent,
  INITIAL_VENUE_HALLS,
  STUDIO_CULINARY_GALLERY,
  getAccurateRecipeForDish,
  getProductRelatedDescription,
  autoCategorizeIngredient,
} from '../data/initialData';
import {
  DishThumbnail,
  EditableDishPrice,
  ProductDetailInteractive,
  getShortIngredientName,
} from './DishImageComponents';
import { playAlarmSound } from '../utils/audioAlert';
import { ExcelProductModal } from './ExcelProductModal';
import { downloadDishesToExcel } from '../utils/excelDishUtils';

/* ============================================================================
   OPERATIONS OVERVIEW
   ============================================================================ */
interface Module01OverviewProps {
  tasks: OverviewTask[];
  events: BanquetEvent[];
  venueHalls?: string[];
  dishes: DishItem[];
  onDeleteTask: (id: string, title: string) => void;
  onAddTask: (task: Omit<OverviewTask, 'id'>) => void;
  onToggleTaskStatus: (id: string) => void;
  onDeleteEvent: (id: string, name: string) => void;
  onAddVenueHall?: (hallName: string) => void;
  onUpdateEventVenue?: (eventId: string, venueHall: string) => void;
}

export const Module01Overview: React.FC<Module01OverviewProps> = ({
  tasks,
  events,
  venueHalls = INITIAL_VENUE_HALLS,
  dishes,
  onDeleteTask,
  onAddTask,
  onToggleTaskStatus,
  onDeleteEvent,
  onAddVenueHall,
  onUpdateEventVenue,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDept, setNewTaskDept] = useState('Banquet Logistics');
  const [newTaskOwner] = useState('Maharaj Brijmohan');


  const totalGuaranteedPax = events.reduce(
    (acc, ev) => acc + ev.guaranteedPax,
    0
  );
  const activeMenuDishes = dishes.filter((d) => d.includedInMenu);
  const menuPerPlateTotal = activeMenuDishes.reduce(
    (acc, d) => acc + d.sellingPricePerPlate,
    0
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask({
      code: `OPS-0${tasks.length + 1}`,
      title: newTaskTitle.trim(),
      department: newTaskDept,
      dueTime: 'Today · 18:00 IST',
      status: 'In Progress',
      owner: newTaskOwner.trim() || 'Operations Desk',
    });
    setNewTaskTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Strip — Variation 14 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="lbl">Scheduled Events</div>
          <div className="val">{events.length} Events</div>
          <div className="lbl">
            {totalGuaranteedPax.toLocaleString('en-IN')} Pax Total
          </div>
        </div>

        <div className="stat-card">
          <div className="lbl">Menu Rate</div>
          <div className="val">
            ₹{menuPerPlateTotal.toLocaleString('en-IN')}
          </div>
          <div className="lbl">
            {activeMenuDishes.length} Dishes Select
          </div>
        </div>

        <div className="stat-card">
          <div className="lbl">Catalog Status</div>
          <div className="val">
            {dishes.filter((d) => Boolean(d.imageUrl)).length} / {dishes.length}
          </div>
          <div className="lbl">{activeMenuDishes.length} Active in Menu</div>
        </div>

        <div className="stat-card">
          <div className="lbl">Checkpoints</div>
          <div className="val">{tasks.length} Active</div>
          <div className="lbl">
            {tasks.filter((t) => t.status === 'Action Required').length} Urgent
            Item
          </div>
        </div>
      </div>
      {/* Section 2: Operational Checkpoints with Add / Delete */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-semibold">
              Module 01 Execution Control
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Operational Checkpoints &amp; Task Assignments
            </h3>
          </div>
          <form onSubmit={handleCreateTask} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="New Task Title..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
            <select
              value={newTaskDept}
              onChange={(e) => setNewTaskDept(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="Banquet Logistics">Banquet Logistics</option>
              <option value="Kitchen Culinary">Kitchen Culinary</option>
              <option value="Guest Hospitality">Guest Hospitality</option>
              <option value="Billing &amp; Audit">Billing &amp; Audit</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Checkpoint</span>
            </button>
          </form>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Task / Checkpoint</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Due Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-amber-800">
                    {task.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {task.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{task.department}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{task.dueTime}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        task.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'Action Required'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {task.status === 'Completed' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{task.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{task.owner}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleTaskStatus(task.id)}
                        title="Toggle Status"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id, task.title)}
                        title="Delete Checkpoint"
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No operational checkpoints found. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Scheduled Banquet Events & Hall Allocation */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-semibold">
              Banquet Schedule &amp; Allocation
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Upcoming Royal Banquets ({events.length} Events)
            </h3>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Venue Halls: {venueHalls.join(', ')}
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Event Name</th>
                <th className="px-4 py-3">Client / Host</th>
                <th className="px-4 py-3">Date &amp; Time</th>
                <th className="px-4 py-3">Guaranteed Pax</th>
                <th className="px-4 py-3">Assigned Hall</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {ev.eventName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{ev.clientName}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {ev.eventDate} · {ev.shift}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-800">
                    {ev.guaranteedPax.toLocaleString('en-IN')} Pax
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={ev.venueHall}
                      onChange={(e) => {
                        if (onUpdateEventVenue) {
                          onUpdateEventVenue(ev.id, e.target.value);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-800"
                    >
                      {venueHalls.map((hall) => (
                        <option key={hall} value={hall}>
                          {hall}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteEvent(ev.id, ev.eventName)}
                      title="Cancel / Delete Event"
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

/* ============================================================================
   CUSTOM MENU BUILDER & BULK PRODUCT LISTING
   ============================================================================ */
interface Module02MenuBuilderProps {
  dishes: DishItem[];
  onAddDish: (dish: Omit<DishItem, 'id'>) => void;
  onBulkAddDishes: (newDishes: Omit<DishItem, 'id'>[]) => void;
  onReplaceByDishCode?: (newDishes: Omit<DishItem, 'id'>[]) => void;
  onReplaceAllDishes?: (newDishes: Omit<DishItem, 'id'>[]) => void;
  onDeleteAllDishes?: () => void;
  onBulkDeleteDishes?: (dishIds: string[]) => void;
  onDeleteDish: (id: string, name: string) => void;
  onToggleDishInMenu: (id: string) => void;
  onBatchSelectDishes?: (dishIds: string[], select: boolean) => void;
  onOpenImageModal: (dish: DishItem) => void;
  onDeleteDishImage: (dishId: string, dishName: string) => void;
  onUpdateDishPrice?: (dishId: string, newPrice: number) => void;
  isAdmin?: boolean;
  onOpenCustomerOrderModal?: (pax: number) => void;
  // Transferred bottom panels
  visibleModules?: { id: string; title: string; subtitle?: string }[];
  activeModuleId?: string;
  onSelectModule?: (moduleId: string) => void;
  isDeveloper2FALoggedIn?: boolean;
  activeClientTenantId?: string | null;
  selectedOrderCount?: number;
  onPlaceOrder?: () => void;
}

export type OccasionMenuType =
  | 'all'
  | 'wedding'
  | 'corporate'
  | 'kitty-birthday'
  | 'live-stalls';

export const isDishInMenuType = (
  dish: DishItem,
  type: OccasionMenuType
): boolean => {
  if (type === 'all') return true;
  if (type === 'wedding') {
    return (
      dish.category === 'Signature Mains' ||
      dish.category === 'Royal Starters' ||
      dish.category === 'Biryani & Breads' ||
      dish.category === 'Artisanal Desserts' ||
      dish.station === 'Handi & Curry' ||
      dish.station === 'Halwai Mithai Station' ||
      dish.name.toLowerCase().includes('shahi') ||
      dish.name.toLowerCase().includes('royal') ||
      dish.name.toLowerCase().includes('paneer') ||
      dish.name.toLowerCase().includes('dal makhani')
    );
  }
  if (type === 'corporate') {
    return (
      dish.category === 'Royal Starters' ||
      dish.category === 'Signature Mains' ||
      dish.station === 'Tandoor Station' ||
      dish.station === 'Dum & Bakery' ||
      dish.name.toLowerCase().includes('tikka') ||
      dish.name.toLowerCase().includes('salad') ||
      dish.name.toLowerCase().includes('dal') ||
      dish.name.toLowerCase().includes('roti') ||
      dish.name.toLowerCase().includes('biryani')
    );
  }
  if (type === 'kitty-birthday') {
    return (
      dish.category === 'Welcome & Chaat' ||
      dish.station === 'Live Chaat Counter' ||
      dish.category === 'Artisanal Desserts' ||
      dish.name.toLowerCase().includes('chaat') ||
      dish.name.toLowerCase().includes('roll') ||
      dish.name.toLowerCase().includes('tikki') ||
      dish.name.toLowerCase().includes('bhalla') ||
      dish.name.toLowerCase().includes('kulfi') ||
      dish.name.toLowerCase().includes('halwa')
    );
  }
  if (type === 'live-stalls') {
    return (
      dish.station === 'Live Chaat Counter' ||
      dish.station === 'Tandoor Station' ||
      dish.station === 'Halwai Mithai Station' ||
      dish.name.toLowerCase().includes('live') ||
      dish.name.toLowerCase().includes('chaat') ||
      dish.name.toLowerCase().includes('tandoor') ||
      dish.name.toLowerCase().includes('vada')
    );
  }
  return true;
};

const COURSE_CATEGORIES = [
  'All Courses',
  'Welcome & Chaat',
  'Royal Starters',
  'Signature Mains',
  'Biryani & Breads',
  'Artisanal Desserts',
] as const;

export const Module02MenuBuilder: React.FC<Module02MenuBuilderProps> = ({
  dishes,
  onAddDish,
  onBulkAddDishes,
  onReplaceByDishCode,
  onReplaceAllDishes,
  onDeleteAllDishes,
  onBulkDeleteDishes,
  onDeleteDish,
  onToggleDishInMenu,
  onBatchSelectDishes,
  onOpenImageModal,
  onDeleteDishImage,
  onUpdateDishPrice,
  isAdmin = true,
  onOpenCustomerOrderModal,
  visibleModules,
  activeModuleId,
  onSelectModule,
  isDeveloper2FALoggedIn,
  activeClientTenantId,
  selectedOrderCount,
  onPlaceOrder,
}) => {
  const [selectedMenuType, setSelectedMenuType] =
    useState<OccasionMenuType>('all');
  const [selectedCategory, setSelectedCategory] =
    useState<string>('All Courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestPaxCount, setGuestPaxCount] = useState<number>(500);
  const [showNewDishForm, setShowNewDishForm] = useState(false);
  const [showBulkListingModal, setShowBulkListingModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [, setExcelModalInitialTab] = useState<'upload' | 'download' | 'bulk-delete'>('upload');

  // Pagination: 4 dish images per row, 40 dish images per page default (or 160 = 4×40 vertical rows)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(40);

  // Bulk Product Listing Textarea State
  const [bulkTextInput, setBulkTextInput] = useState(
    `Rajwadi Dahi Gujiya Chaat | Welcome & Chaat | Live Chaat Counter | 150 | 45\nAfghani Subz Seekh Skewers | Royal Starters | Tandoor Station | 190 | 60\nHandi Paneer Mirchwani | Signature Mains | Handi & Curry | 195 | 62\nZafrani Moti Pulao | Biryani & Breads | Dum & Bakery | 210 | 66\nHot Moong Dal Halwa | Artisanal Desserts | Halwai Mithai Station | 170 | 52`
  );
  const [bulkDefaultImage, setBulkDefaultImage] = useState<string>(
    STUDIO_CULINARY_GALLERY[0].url
  );

  // Single New dish form state
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] =
    useState<DishItem['category']>('Royal Starters');
  const [dishDietary, setDishDietary] =
    useState<DishItem['dietary']>('Pure Veg · Jain Available');
  const [dishStation, setDishStation] =
    useState<DishItem['station']>('Tandoor Station');
  const [sellingPrice, setSellingPrice] = useState<number>(180);
  const [foodCost, setFoodCost] = useState<number>(58);
  const [dishDescription, setDishDescription] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState<string>(
    STUDIO_CULINARY_GALLERY[0].url
  );

  const filteredDishes = dishes.filter((dish) => {
    const matchesMenuType = isDishInMenuType(dish, selectedMenuType);
    const matchesCat =
      selectedCategory === 'All Courses' || dish.category === selectedCategory;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.station.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMenuType && matchesCat && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDishes.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDishes = filteredDishes.slice(
    (safePage - 1) * perPage,
    safePage * perPage
  );

  const activeMenuDishes = dishes.filter((d) => d.includedInMenu);
  const perPlateSelling = activeMenuDishes.reduce(
    (sum, d) => sum + d.sellingPricePerPlate,
    0
  );
  const perPlateFoodCost = activeMenuDishes.reduce(
    (sum, d) => sum + d.foodCostPerPlate,
    0
  );
  const totalEventQuote = perPlateSelling * guestPaxCount;

  const handleSelectAllFiltered = () => {
    const ids = filteredDishes.map((d) => d.id);
    if (onBatchSelectDishes) {
      onBatchSelectDishes(ids, true);
    } else {
      filteredDishes.forEach((d) => {
        if (!d.includedInMenu) onToggleDishInMenu(d.id);
      });
    }
  };

  const handleUnselectAllFiltered = () => {
    const ids = filteredDishes.map((d) => d.id);
    if (onBatchSelectDishes) {
      onBatchSelectDishes(ids, false);
    } else {
      filteredDishes.forEach((d) => {
        if (d.includedInMenu) onToggleDishInMenu(d.id);
      });
    }
  };

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;
    onAddDish({
      code: `DSH-${101 + dishes.length}`,
      name: dishName.trim(),
      category: dishCategory,
      dietary: dishDietary,
      station: dishStation,
      sellingPricePerPlate: Number(sellingPrice) || 160,
      foodCostPerPlate: Number(foodCost) || 50,
      prepTimeMins: 35,
      includedInMenu: true,
      imageUrl: dishImageUrl.trim() ? dishImageUrl.trim() : null,
      description: getProductRelatedDescription(
        dishName.trim(),
        dishCategory,
        dishStation,
        dishDescription.trim()
      ),
      ingredients: getAccurateRecipeForDish(
        dishName.trim(),
        dishCategory,
        Number(foodCost) || 50,
        `ing-${Date.now()}`
      ),
    });
    setDishName('');
    setDishDescription('');
    setShowNewDishForm(false);
  };

  const handleBulkImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkTextInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const validCategories: DishItem['category'][] = [
      'Welcome & Chaat',
      'Royal Starters',
      'Signature Mains',
      'Biryani & Breads',
      'Artisanal Desserts',
    ];
    const validStations: DishItem['station'][] = [
      'Tandoor Station',
      'Handi & Curry',
      'Live Chaat Counter',
      'Halwai Mithai Station',
      'Dum & Bakery',
    ];

    const parsedDishes: Omit<DishItem, 'id'>[] = lines.map((line, idx) => {
      const parts = line.split('|').map((p) => p.trim());
      const name = parts[0] || `Royal Banquet Dish #${idx + 1}`;
      const rawCat = parts[1] as DishItem['category'];
      const category = validCategories.includes(rawCat)
        ? rawCat
        : validCategories[idx % validCategories.length];
      const rawSt = parts[2] as DishItem['station'];
      const station = validStations.includes(rawSt)
        ? rawSt
        : validStations[idx % validStations.length];
      const sell = Number(parts[3]) || 175;
      const cost = Number(parts[4]) || 55;
      const galleryUrl =
        bulkDefaultImage ||
        STUDIO_CULINARY_GALLERY[idx % STUDIO_CULINARY_GALLERY.length].url;

      return {
        code: `DSH-${101 + dishes.length + idx}`,
        name,
        category,
        dietary: 'Pure Veg · Jain Available',
        station,
        sellingPricePerPlate: sell,
        foodCostPerPlate: cost,
        prepTimeMins: 30,
        includedInMenu: true,
        imageUrl: galleryUrl,
        description: getProductRelatedDescription(name, category, station),
        ingredients: getAccurateRecipeForDish(
          name,
          category,
          cost,
          `ing-bulk-${Date.now()}-${idx}`
        ),
      };
    });

    onBulkAddDishes(parsedDishes);
    setShowBulkListingModal(false);
  };

  const handleBulkGenerateCount = (count: number) => {
    const generated: Omit<DishItem, 'id'>[] = Array.from({ length: count }).map(
      (_, idx) => {
        const preset =
          STUDIO_CULINARY_GALLERY[idx % STUDIO_CULINARY_GALLERY.length];
        const codeNum = 101 + dishes.length + idx;
        const dishTitle = `${preset.label} — Edition #${codeNum}`;
        const costVal = 50 + (idx % 6) * 5;
        return {
          code: `DSH-${codeNum}`,
          name: dishTitle,
          category: preset.category as DishItem['category'],
          dietary: 'Pure Veg · Jain Available',
          station: 'Tandoor Station',
          sellingPricePerPlate: 160 + (idx % 6) * 15,
          foodCostPerPlate: costVal,
          prepTimeMins: 30,
          includedInMenu: true,
          imageUrl: preset.url,
          description: getProductRelatedDescription(
            preset.label,
            preset.category as DishItem['category'],
            'Tandoor Station'
          ),
          ingredients: getAccurateRecipeForDish(
            dishTitle,
            preset.category as DishItem['category'],
            costVal,
            `ing-gen-${Date.now()}-${idx}`
          ),
        };
      }
    );
    onBulkAddDishes(generated);
  };

  return (
    <div className="space-y-4">
      {/* SEPARATE BUTTONS UNDER DISHES MENU (SELECTION): Wedding Menu, Corporate Menu, Kitty Party/Birthday Menu, Live Stalls/Counters */}
      <div className="panel p-3.5 bg-white border-2 border-[#1B1B1B] space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedMenuType('all');
              setCurrentPage(1);
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 border-2 cursor-pointer shadow-xs ${
              selectedMenuType === 'all'
                ? 'bg-[#0f2942] text-[#ffff00] border-[#ffd700] shadow-[2px_2px_0_#0f2942]'
                : 'bg-slate-50 text-[#1B1B1B] border-[#1B1B1B] hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>All Menus</span>
            <span className="text-[10px] opacity-80">({dishes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMenuType('wedding');
              setCurrentPage(1);
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 border-2 cursor-pointer shadow-xs ${
              selectedMenuType === 'wedding'
                ? 'bg-[#0f2942] text-[#ffff00] border-[#ffd700] shadow-[2px_2px_0_#0f2942]'
                : 'bg-slate-50 text-[#1B1B1B] border-[#1B1B1B] hover:bg-slate-100'
            }`}
          >
            <Crown className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Wedding Menu</span>
            <span className="text-[10px] opacity-80">
              ({dishes.filter((d) => isDishInMenuType(d, 'wedding')).length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMenuType('corporate');
              setCurrentPage(1);
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 border-2 cursor-pointer shadow-xs ${
              selectedMenuType === 'corporate'
                ? 'bg-[#0f2942] text-[#ffff00] border-[#ffd700] shadow-[2px_2px_0_#0f2942]'
                : 'bg-slate-50 text-[#1B1B1B] border-[#1B1B1B] hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0 text-blue-600" />
            <span>Corporate Menu</span>
            <span className="text-[10px] opacity-80">
              ({dishes.filter((d) => isDishInMenuType(d, 'corporate')).length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMenuType('kitty-birthday');
              setCurrentPage(1);
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 border-2 cursor-pointer shadow-xs ${
              selectedMenuType === 'kitty-birthday'
                ? 'bg-[#0f2942] text-[#ffff00] border-[#ffd700] shadow-[2px_2px_0_#0f2942]'
                : 'bg-slate-50 text-[#1B1B1B] border-[#1B1B1B] hover:bg-slate-100'
            }`}
          >
            <PartyPopper className="w-4 h-4 shrink-0 text-rose-500" />
            <span>Kitty Party/Birthday Menu</span>
            <span className="text-[10px] opacity-80">
              ({dishes.filter((d) => isDishInMenuType(d, 'kitty-birthday')).length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMenuType('live-stalls');
              setCurrentPage(1);
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 border-2 cursor-pointer shadow-xs col-span-2 sm:col-span-1 ${
              selectedMenuType === 'live-stalls'
                ? 'bg-[#0f2942] text-[#ffff00] border-[#ffd700] shadow-[2px_2px_0_#0f2942]'
                : 'bg-slate-50 text-[#1B1B1B] border-[#1B1B1B] hover:bg-slate-100'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0 text-orange-500" />
            <span>Live Stalls/Counters</span>
            <span className="text-[10px] opacity-80">
              ({dishes.filter((d) => isDishInMenuType(d, 'live-stalls')).length})
            </span>
          </button>
        </div>
      </div>

      {/* Variation 18: Course Filter Tags & Search Controls */}
      <div className="panel p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white">
        <div className="flex flex-wrap items-center gap-1.5">
          {COURSE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category);
                setCurrentPage(1);
              }}
              className={`tag m-0 text-xs font-semibold px-3 py-1.5 border-2 transition-all cursor-pointer ${
                selectedCategory === category
                  ? 'bg-[#0f2942] text-[#ffff00] border-[#ffd700] shadow-[2px_2px_0_#0f2942]'
                  : 'bg-white text-[#1B1B1B] border-[#1B1B1B] hover:bg-slate-100'
              }`}
            >
              {category}
              <span className="ml-1 opacity-70 text-[10px]">
                ({category === 'All Courses' ? dishes.length : dishes.filter((d) => d.category === category).length})
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#1B1B1B]/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search dishes, code, station..."
              aria-label="Search dishes in dishes menu selection"
              className="pl-8 pr-3 py-1.5 text-xs font-mono bg-white border-2 border-[#1B1B1B] text-[#1B1B1B] focus:outline-none w-52"
            />
          </div>
        </div>
      </div>
      {isAdmin && showBulkListingModal && (
        <section className="panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1B1B1B] pb-3">
            <div>
              <h3 className="text-base font-bold font-mono text-[#1B1B1B] flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>
                  TheCaterings — Bulk Product Listing &amp; Batch Catalog Importer
                </span>
              </h3>
              <p className="text-xs text-[#1B1B1B]/75 mt-0.5">
                Paste multiple dishes (one per line:{' '}
                <code className="font-mono">
                  Dish Name | Category | Station | Selling ₹ | Cost ₹
                </code>
                ) or use 1-click bulk presets.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkGenerateCount(40)}
                className="tag m-0 bg-white"
              >
                + Auto-List 40 Dishes (1 Full Page)
              </button>
              <button
                type="button"
                onClick={() => handleBulkGenerateCount(160)}
                className="tag m-0"
              >
                + Auto-List 160 Dishes (4×40 Vertical)
              </button>
              <button
                type="button"
                onClick={() => setShowBulkListingModal(false)}
                className="tag m-0 p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleBulkImportSubmit} className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                  Bulk Product Lines (Dish Name | Course Category | Kitchen Station | Selling Rate | Food Cost)
                </label>
                <textarea
                  rows={5}
                  value={bulkTextInput}
                  onChange={(e) => setBulkTextInput(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-white border-2 border-[#1B1B1B] text-[#1B1B1B]"
                />
              </div>
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                    Default Studio Dish Image for Bulk Listed Products
                  </label>
                  <select
                    value={bulkDefaultImage}
                    onChange={(e) => setBulkDefaultImage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border-2 border-[#1B1B1B] text-[#1B1B1B]"
                  >
                    {STUDIO_CULINARY_GALLERY.map((g) => (
                      <option key={g.id} value={g.url}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#1B1B1B]/75 mt-2">
                    Every bulk-listed product automatically receives a studio dish photo and 100-pax BOM entry, ready for the 4×40 dish grid.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 btn btn-black text-xs py-2.5"
                  >
                    Import Bulk Products to TheCaterings
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Collapsible Single Dish Creation Panel (Admin Only) */}
      {isAdmin && showNewDishForm && (
        <form
          onSubmit={handleCreateDish}
          className="panel space-y-4"
        >
          <div className="flex items-center justify-between border-b-2 border-[#1B1B1B] pb-3">
            <h3 className="text-sm font-bold font-mono text-[#1B1B1B]">
              Add New Banquet Dish to TheCaterings Master Menu
            </h3>
            <button
              type="button"
              onClick={() => setShowNewDishForm(false)}
              title="Close Form"
              className="tag m-0 p-1.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                Dish Name
              </label>
              <input
                type="text"
                required
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="e.g. Jodhpuri Mirchi Vada Counter"
                className="w-full px-3 py-2 text-xs leading-normal bg-white border-2 border-[#1B1B1B] text-[#1B1B1B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                Course Category
              </label>
              <select
                value={dishCategory}
                onChange={(e) =>
                  setDishCategory(e.target.value as DishItem['category'])
                }
                className="w-full px-3 py-2 text-xs leading-normal bg-white border-2 border-[#1B1B1B] text-[#1B1B1B]"
              >
                <option value="Welcome & Chaat">Welcome &amp; Chaat</option>
                <option value="Royal Starters">Royal Starters</option>
                <option value="Signature Mains">Signature Mains</option>
                <option value="Biryani & Breads">Biryani &amp; Breads</option>
                <option value="Artisanal Desserts">Artisanal Desserts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                Kitchen Station
              </label>
              <select
                value={dishStation}
                onChange={(e) =>
                  setDishStation(e.target.value as DishItem['station'])
                }
                className="w-full px-3 py-2 text-xs leading-normal bg-white border-2 border-[#1B1B1B] text-[#1B1B1B]"
              >
                <option value="Tandoor Station">Tandoor Station</option>
                <option value="Handi & Curry">Handi &amp; Curry</option>
                <option value="Live Chaat Counter">Live Chaat Counter</option>
                <option value="Halwai Mithai Station">
                  Halwai Mithai Station
                </option>
                <option value="Dum & Bakery">Dum &amp; Bakery</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                Dietary Specification
              </label>
              <select
                value={dishDietary}
                onChange={(e) =>
                  setDishDietary(e.target.value as DishItem['dietary'])
                }
                className="w-full px-3 py-2 text-xs leading-normal bg-white border-2 border-[#1B1B1B] text-[#1B1B1B]"
              >
                <option value="Pure Veg · Jain Available">
                  Pure Veg · Jain Available
                </option>
                <option value="Pure Veg">Pure Veg</option>
                <option value="Pure Veg · Swaminarayan">
                  Pure Veg · Swaminarayan
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                Selling Rate / Plate (₹)
              </label>
              <input
                type="number"
                min={20}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs leading-normal font-mono bg-white border-2 border-[#1B1B1B] text-[#1B1B1B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                Food Cost / Plate (₹)
              </label>
              <input
                type="number"
                min={10}
                value={foodCost}
                onChange={(e) => setFoodCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs leading-normal font-mono bg-white border-2 border-[#1B1B1B] text-[#1B1B1B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                Initial Dish Image Preset
              </label>
              <select
                value={dishImageUrl}
                onChange={(e) => setDishImageUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs leading-normal bg-white border-2 border-[#1B1B1B] text-[#1B1B1B]"
              >
                {STUDIO_CULINARY_GALLERY.map((g) => (
                  <option key={g.id} value={g.url}>
                    {g.label}
                  </option>
                ))}
                <option value="">No Image (Add Later)</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                title="Save Dish"
                className="w-full py-2 px-4 flex items-center justify-center gap-1.5 text-xs btn btn-accent"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}


      {/* 4 Products in One Row Grid (Dishes Menu (Selection)) */}
      <div className="dish-grid">
          {paginatedDishes.map((dish) => {
            return (
              <div
                key={dish.id}
                className="dish-card flex flex-col justify-between"
                style={{ backgroundColor: '#87ceeb' }}
              >
                <div>
                  <div className="mb-3">
                    <DishThumbnail
                      dish={dish}
                      onOpenImageModal={onOpenImageModal}
                      onDeleteImage={onDeleteDishImage}
                      onDeleteDish={onDeleteDish}
                      readOnly={!isAdmin}
                      canEditImage={isAdmin}
                      onToggleSelect={onToggleDishInMenu}
                    />
                  </div>

                  <ProductDetailInteractive
                    dish={dish}
                    onUpdatePrice={isAdmin ? onUpdateDishPrice : undefined}
                    isAdmin={isAdmin}
                    onToggleSelect={onToggleDishInMenu}
                  />
                </div>

                <div className="mt-3 pt-2.5 border-t-2 border-[#0f2942]/30 flex items-center justify-between gap-2">
                  <div className="font-mono tabular-nums text-xs flex items-center gap-1">
                    <EditableDishPrice
                      dishId={dish.id}
                      dishName={dish.name}
                      price={dish.sellingPricePerPlate}
                      onUpdatePrice={isAdmin ? onUpdateDishPrice : undefined}
                      className="font-bold"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      {/* Search, Page Size & Pagination Bar — At bottom after product */}
      <div className="panel px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#1B1B1B]">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Displaying <strong>{paginatedDishes.length}</strong> of{' '}
            <strong>{filteredDishes.length}</strong> Dishes
          </span>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#1B1B1B]/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search dish or station..."
              aria-label="Search dishes in menu builder"
              className="pl-8 pr-3 py-2 text-xs leading-normal font-mono bg-white border-2 border-[#1B1B1B] shadow-[2px_2px_0_#1B1B1B] text-[#1B1B1B] focus:outline-none w-48"
            />
          </div>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Grid dishes per page"
            className="px-2.5 py-2 text-xs leading-normal bg-white border-2 border-[#1B1B1B] shadow-[2px_2px_0_#1B1B1B] text-[#1B1B1B] font-mono font-bold"
          >
            <option value={40}>40 Images / Page (4/Row)</option>
            <option value={160}>160 Images / Page (4×40 Vertical)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Previous Page"
            className="tag m-0 p-1.5 disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono font-bold">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Next Page"
            className="tag m-0 p-1.5 disabled:opacity-40"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Admin Action Buttons Below Last Product */}
      {isAdmin && (
        <div className="panel p-4 bg-white border-2 border-[#1B1B1B] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#0f2942]">
            Catalog &amp; Product Management Actions
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setExcelModalInitialTab('upload');
                setShowExcelModal(true);
              }}
              className="btn text-xs py-2 px-3.5 inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
              title="Upload products by Excel Sheet (.xlsx / .csv)"
            >
              <Upload className="w-4 h-4 text-[#ffd700]" />
              <span>Upload Excel</span>
            </button>

            <button
              type="button"
              onClick={() => downloadDishesToExcel(dishes)}
              className="btn text-xs py-2 px-3.5 inline-flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 text-white cursor-pointer shadow-xs"
              title="Download all products as Excel (.xlsx) sheet"
            >
              <Download className="w-4 h-4 text-[#ffd700]" />
              <span>Download Excel ({dishes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setExcelModalInitialTab('bulk-delete');
                setShowExcelModal(true);
              }}
              className="btn text-xs py-2 px-3.5 inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white cursor-pointer shadow-xs"
              title="Bulk Product Delete or Clear Catalog"
            >
              <Trash2 className="w-4 h-4 text-white" />
              <span>Bulk Delete</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNewDishForm((prev) => !prev)}
              className="btn text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>SINGLE DISH</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBulkListingModal((prev) => !prev)}
              className="btn text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
              style={{ backgroundColor: '#0f2942', color: '#ffd700' }}
            >
              <Layers className="w-4 h-4" />
              <span>BULK LIST</span>
            </button>
          </div>
        </div>
      )}

      {showExcelModal && (
        <ExcelProductModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
          dishes={dishes}
          onBulkAddDishes={onBulkAddDishes}
          onReplaceByDishCode={onReplaceByDishCode || onReplaceAllDishes || onBulkAddDishes}
          onReplaceAllDishes={onReplaceAllDishes || onBulkAddDishes}
          onDeleteAllDishes={onDeleteAllDishes || (() => {})}
          onBulkDeleteDishes={onBulkDeleteDishes || (() => {})}
          activeRoleLabel={isAdmin ? 'Admin / Client Manager' : 'Product Catalog'}
        />
      )}
    </div>
  );
};

/* ============================================================================
   DISH & RECIPE COSTING
   ============================================================================ */
interface Module03RecipeCostingProps {
  dishes: DishItem[];
  onDeleteDish: (id: string, name: string) => void;
  onOpenImageModal: (dish: DishItem) => void;
  onDeleteDishImage: (dishId: string, dishName: string) => void;
  onUpdateDishPrice?: (dishId: string, newPrice: number) => void;
  onAddIngredient: (
    dishId: string,
    ingredient: {
      name: string;
      qtyPer100Pax: number;
      unit: 'kg' | 'L' | 'g' | 'pcs';
      costPer100Pax: number;
    }
  ) => void;
  onDeleteIngredient: (
    dishId: string,
    ingredientId: string,
    ingredientName: string
  ) => void;
  isAdmin?: boolean;
  onToggleDishInMenu?: (id: string) => void;
  onOpenCustomerOrderModal?: (pax: number) => void;
}

export const Module03RecipeCosting: React.FC<Module03RecipeCostingProps> = ({
  dishes,
  onDeleteDish,
  onOpenImageModal,
  onDeleteDishImage,
  onUpdateDishPrice,
  onAddIngredient,
  onDeleteIngredient,
  isAdmin = true,
  onToggleDishInMenu,
  onOpenCustomerOrderModal,
}) => {
  const [activeDishIdForIng, setActiveDishIdForIng] = useState<string | null>(
    null
  );
  const [ingName, setIngName] = useState('');
  const [ingQty, setIngQty] = useState<number>(5);
  const [ingUnit, setIngUnit] = useState<'kg' | 'L' | 'g' | 'pcs'>('kg');
  const [ingCost, setIngCost] = useState<number>(850);

  const handleAddIngSubmit = (e: React.FormEvent, dishId: string) => {
    e.preventDefault();
    if (!ingName.trim()) return;
    onAddIngredient(dishId, {
      name: ingName.trim(),
      qtyPer100Pax: Number(ingQty) || 1,
      unit: ingUnit,
      costPer100Pax: Number(ingCost) || 100,
    });
    setIngName('');
    setActiveDishIdForIng(null);
  };

  return (
    <div className="space-y-6">
      <div className="panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="label mb-1.5">Recipe &amp; Costing Matrix</div>
          <h2 className="text-3xl font-bold text-[#1B1B1B] font-display m-0">
            TheCaterings Standard 100-Pax Recipe BOM &amp; Dish Costing Matrix
          </h2>
          <p className="text-xs text-[#1B1B1B]/75 mt-1">
            {isAdmin
              ? 'Manage dish images, ingredients, and product costing with icon actions.'
              : 'View dish specifications and per-plate banquet pricing, and select dishes for your catering order.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2 font-mono tabular-nums text-xs font-bold">
              <Calculator className="w-4 h-4 text-[#1B1B1B]" />
              <span>
                Avg Food Cost:{' '}
                <strong className="bg-white px-1.5 py-0.5 border border-[#1B1B1B]">
                  {dishes.length > 0
                    ? Math.round(
                        dishes.reduce(
                          (acc, d) =>
                            acc +
                            (d.foodCostPerPlate / d.sellingPricePerPlate) * 100,
                          0
                        ) / dishes.length
                      )
                    : 0}
                  %
                </strong>
              </span>
            </div>
          )}
          {onOpenCustomerOrderModal && (
            <button
              type="button"
              onClick={() => onOpenCustomerOrderModal(500)}
              className="btn btn-black text-xs px-4 py-2.5"
            >
              Place Order Now ({dishes.filter((d) => d.includedInMenu).length}{' '}
              Dishes)
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {dishes.map((dish) => {
          const ingredients =
            dish.ingredients && dish.ingredients.length > 0
              ? dish.ingredients
              : getAccurateRecipeForDish(
                  dish.name,
                  dish.category,
                  dish.foodCostPerPlate || 45,
                  dish.id
                );
          const totalBatch100Cost = ingredients.reduce(
            (sum, ing) => sum + (ing.costPer100Pax || 0),
            0
          );
          const computedPlateCost = Math.round(totalBatch100Cost / 100);
          const grossMarginPct = Math.round(
            ((dish.sellingPricePerPlate - computedPlateCost) /
              dish.sellingPricePerPlate) *
              100
          );

          return (
            <div
              key={dish.id}
              className="dish-card panel space-y-4"
              style={{ backgroundColor: '#87ceeb' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
                {/* Dish Image Column (Add Image & Delete Image Hidden for Customer, Visible for Admin Login) */}
                <div className="lg:col-span-1">
                  <DishThumbnail
                    dish={dish}
                    onOpenImageModal={onOpenImageModal}
                    onDeleteImage={onDeleteDishImage}
                    onDeleteDish={onDeleteDish}
                    readOnly={!isAdmin}
                    canEditImage={isAdmin}
                    onToggleSelect={onToggleDishInMenu}
                  />
                </div>

                {/* Dish Header & BOM Table */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b-2 border-[#1B1B1B]">
                    <div className="space-y-1">
                      <ProductDetailInteractive
                        dish={dish}
                        onUpdatePrice={isAdmin ? onUpdateDishPrice : undefined}
                        isAdmin={isAdmin}
                        onToggleSelect={onToggleDishInMenu}
                      />
                      <div className="pt-1">
                        <EditableDishPrice
                          dishId={dish.id}
                          dishName={dish.name}
                          price={dish.sellingPricePerPlate}
                          onUpdatePrice={
                            isAdmin ? onUpdateDishPrice : undefined
                          }
                          className="inline-flex items-center px-2.5 py-0.5 text-xs font-mono font-bold border-2 border-[#0f2942]"
                        />
                      </div>
                    </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveDishIdForIng(
                                activeDishIdForIng === dish.id ? null : dish.id
                              )
                            }
                            title={
                              activeDishIdForIng === dish.id
                                ? 'Close Ingredient Form'
                                : 'Add Ingredient'
                            }
                            aria-label="Add Ingredient"
                            className="p-2 rounded cursor-pointer"
                            style={{
                              backgroundColor: '#0f2942',
                              color: '#ffd700',
                              border: '2px solid #091e3a',
                            }}
                          >
                            {activeDishIdForIng === dish.id ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                      )}
                    </div>
                  </div>

                  {/* Cost Metrics Strip */}
                  {isAdmin ? (
                    <div
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 border-2 font-mono tabular-nums text-xs rounded-lg"
                      style={{
                        backgroundColor: '#0f2942',
                        borderColor: '#091e3a',
                        color: '#ffffff',
                      }}
                    >
                      <div>
                        <span
                          className="block mb-1 font-bold uppercase"
                          style={{ color: '#ffd700' }}
                        >
                          100-Pax Raw Cost
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: '#ffffff' }}
                        >
                          ₹{totalBatch100Cost.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span
                          className="block mb-1 font-bold uppercase"
                          style={{ color: '#ffd700' }}
                        >
                          Cost / Plate
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: '#ffffff' }}
                        >
                          ₹{computedPlateCost}
                        </span>
                      </div>
                      <div>
                        <span
                          className="block mb-1 font-bold uppercase"
                          style={{ color: '#ffd700' }}
                        >
                          Menu Selling / Plate
                        </span>
                        <EditableDishPrice
                          dishId={dish.id}
                          dishName={dish.name}
                          price={dish.sellingPricePerPlate}
                          onUpdatePrice={
                            isAdmin ? onUpdateDishPrice : undefined
                          }
                          boxBgHex="#0f2942"
                          className="text-sm font-bold"
                        />
                      </div>
                      <div>
                        <span
                          className="block mb-1 font-bold uppercase"
                          style={{ color: '#ffd700' }}
                        >
                          Gross Margin
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: '#4ade80' }}
                        >
                          {grossMarginPct}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 border-2 font-mono tabular-nums text-xs rounded-lg"
                      style={{
                        backgroundColor: '#0f2942',
                        borderColor: '#091e3a',
                        color: '#ffffff',
                      }}
                    >
                      <div>
                        <span
                          className="block mb-1 font-bold uppercase"
                          style={{ color: '#ffd700' }}
                        >
                          Dietary Specification
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: '#ffffff' }}
                        >
                          {dish.dietary}
                        </span>
                      </div>
                      <div>
                        <span
                          className="block mb-1 font-bold uppercase"
                          style={{ color: '#ffd700' }}
                        >
                          Live Banquet Station
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: '#ffffff' }}
                        >
                          {dish.station}
                        </span>
                      </div>
                      <div>
                        <span
                          className="block mb-1 font-bold uppercase"
                          style={{ color: '#ffd700' }}
                        >
                          Menu Rate / Plate
                        </span>
                        <EditableDishPrice
                          dishId={dish.id}
                          dishName={dish.name}
                          price={dish.sellingPricePerPlate}
                          onUpdatePrice={undefined}
                          boxBgHex="#0f2942"
                          className="text-sm font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Add Ingredient Inline Form (Visible ONLY for Admin Login) */}
                  {isAdmin && activeDishIdForIng === dish.id && (
                    <form
                      onSubmit={(e) => handleAddIngSubmit(e, dish.id)}
                      className="p-3 bg-white border border-slate-300 rounded-lg flex flex-wrap items-end gap-3"
                    >
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Raw Ingredient Name
                        </label>
                        <input
                          type="text"
                          required
                          value={ingName}
                          onChange={(e) => setIngName(e.target.value)}
                          placeholder="e.g. Roasted Kasuri Methi & Mace"
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Qty (100 Pax)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={ingQty}
                          onChange={(e) => setIngQty(Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Unit
                        </label>
                        <select
                          value={ingUnit}
                          onChange={(e) =>
                            setIngUnit(
                              e.target.value as 'kg' | 'L' | 'g' | 'pcs'
                            )
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                        >
                          <option value="kg">kg</option>
                          <option value="L">L</option>
                          <option value="g">g</option>
                          <option value="pcs">pcs</option>
                        </select>
                      </div>
                      <div className="w-28">
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Batch Cost (₹)
                        </label>
                        <input
                          type="number"
                          value={ingCost}
                          onChange={(e) => setIngCost(Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <button
                        type="submit"
                        title="Save Ingredient"
                        className="p-2 text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* Ingredients Items BOM Table */}
                  {ingredients.length > 0 && (
                    <div className="overflow-x-auto rounded border border-slate-300 bg-white mt-3">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 font-mono text-[11px] text-slate-700 uppercase">
                          <tr>
                            <th className="px-3 py-2">Raw Ingredient</th>
                            <th className="px-3 py-2">Qty (100 Pax)</th>
                            <th className="px-3 py-2">Unit</th>
                            <th className="px-3 py-2">Batch Cost</th>
                            {isAdmin && (
                              <th className="px-3 py-2 text-right">Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {ingredients.map((ing) => (
                            <tr key={ing.id} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 font-medium text-slate-900">
                                {isAdmin ? (
                                  ing.name
                                ) : (
                                  <span
                                    className="italic text-slate-600"
                                    title="Full formulation item name visible only on client and admin login"
                                  >
                                    {getShortIngredientName(ing.name)}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-slate-700">
                                {isAdmin ? ing.qtyPer100Pax : '—'}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-slate-500">
                                {isAdmin ? ing.unit : '—'}
                              </td>
                              <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">
                                {isAdmin
                                  ? `₹${ing.costPer100Pax.toLocaleString('en-IN')}`
                                  : '—'}
                              </td>
                              {isAdmin && (
                                <td className="px-3 py-1.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onDeleteIngredient(
                                        dish.id,
                                        ing.id,
                                        ing.name
                                      )
                                    }
                                    title="Delete Ingredient"
                                    className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
