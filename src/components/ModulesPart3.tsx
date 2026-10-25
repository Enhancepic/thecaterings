import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ImagePlus,
  Check,
  Package,
  Users,
  Receipt,
  Sparkles,
  BookOpen,
  FileDown,
  CreditCard,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  FileSpreadsheet,
  Upload,
  Download,
} from 'lucide-react';
import {
  InventoryItem,
  PurchaseOrder,
  StaffMember,
  BanquetEvent,
  GstInvoice,
  DishItem,
  ClientTastingNote,
  ClientTenant,
  AdminOtpDispatchRecord,
  INITIAL_CLIENT_TENANTS,
  INITIAL_ADMIN_OTP_DISPATCH_LOGS,
  validateUniqueClientTenantRegistration,
} from '../data/initialData';
import {
  DishThumbnail,
  EditableDishPrice,
  ProductDetailInteractive,
} from './DishImageComponents';
import { TheCateringsLogo } from './TheCateringsLogo';
import { ExcelProductModal } from './ExcelProductModal';
import { downloadDishesToExcel } from '../utils/excelDishUtils';
import {
  generateSingleInvoicePdf,
  generateFullGstLedgerPdf,
  DEFAULT_GST_TERMS_AND_CONDITIONS,
  generateSinglePurchaseOrderPdf,
  generateAllPurchaseOrdersPdf,
  parsePoItemsSummary,
  DEFAULT_PO_TERMS_AND_CONDITIONS,
  numberToIndianWords,
} from '../utils/pdfGenerator';

const formatINR = (amount: number) =>
  '₹' + Math.round(amount).toLocaleString('en-IN');

// ============================================================================
// MODULE INVENTORY & VENDOR POs
// ============================================================================
interface Module08Props {
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  onAddInventory: (item: Omit<InventoryItem, 'id'>) => void;
  onDeleteInventory: (id: string, itemName: string) => void;
  onUpdateInventoryQty?: (id: string, newQty: number) => void;
  onUpdateInventoryItem?: (id: string, updatedFields: Partial<InventoryItem>) => void;
  onAddPo: (po: Omit<PurchaseOrder, 'id'>) => void;
  onDeletePo: (id: string, poNumber: string) => void;
  onUpdatePoStatus?: (
    id: string,
    status: PurchaseOrder['status']
  ) => void;
}

const DEFAULT_INVENTORY_CATEGORIES = [
  'Dairy & Paneer',
  'Basmati & Grains',
  'Dry Fruits & Saffron',
  'Spices & Ghee',
  'Fresh Vegetables & Fruits',
  'Oils & Vanaspati',
  'Beverages & Syrups',
  'Halwai & Mithai Raw Material',
  'Disposables & Packaging',
];

export const Module08InventoryPo: React.FC<Module08Props> = ({
  inventory,
  purchaseOrders,
  onAddInventory,
  onDeleteInventory,
  onUpdateInventoryQty,
  onUpdateInventoryItem,
  onAddPo,
  onDeletePo,
  onUpdatePoStatus,
}) => {
  const [showAddStock, setShowAddStock] = useState(false);
  const [showAddPO, setShowAddPO] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editReorderLevel, setEditReorderLevel] = useState(0);
  const [editUnitPrice, setEditUnitPrice] = useState(0);
  const [editPreferredVendor, setEditPreferredVendor] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const handleSaveInventoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInventoryItem || !onUpdateInventoryItem) return;
    onUpdateInventoryItem(editingInventoryItem.id, {
      itemName: editItemName,
      category: editCategory,
      reorderLevel: Number(editReorderLevel),
      unitPrice: Number(editUnitPrice),
      preferredVendor: editPreferredVendor,
      unit: editUnit,
      imageUrl: editImageUrl,
    });
    setEditingInventoryItem(null);
  };
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>('All');

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('thecaterings_custom_inv_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const allCategories = Array.from(
    new Set([
      ...DEFAULT_INVENTORY_CATEGORIES,
      ...customCategories,
      ...inventory.map((i) => i.category).filter(Boolean),
    ])
  );

  const [sku, setSku] = useState('INV-885');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] =
    useState<InventoryItem['category']>('Basmati & Grains');
  const [inStockQty, setInStockQty] = useState(100);
  const [reorderLevel, setReorderLevel] = useState(40);
  const [unit, setUnit] = useState<InventoryItem['unit']>('kg');
  const [unitPrice, setUnitPrice] = useState(145);
  const [preferredVendor, setPreferredVendor] = useState('');

  const [poNumber, setPoNumber] = useState('PO-2026-445');
  const [poVendor, setPoVendor] = useState('');
  const [poSummary, setPoSummary] = useState('');
  const [totalAmount, setTotalAmount] = useState(65000);
  const [deliveryDate, setDeliveryDate] = useState('2026-10-16');

  // Boxed PO Bill Format & PDF State
  const [selectedPoIdForBill, setSelectedPoIdForBill] = useState<string>(
    () =>
      purchaseOrders.find((p) => p.status === 'Issued')?.id ||
      purchaseOrders[0]?.id ||
      ''
  );
  const [preventPoFileOverwrite, setPreventPoFileOverwrite] = useState(true);
  const [lastDownloadedPoPdf, setLastDownloadedPoPdf] = useState<string | null>(
    null
  );
  const [poTermsList, setPoTermsList] = useState<string[]>(
    DEFAULT_PO_TERMS_AND_CONDITIONS
  );
  const [isEditingPoTerms, setIsEditingPoTerms] = useState(false);

  const activePreviewPo =
    purchaseOrders.find((p) => p.id === selectedPoIdForBill) ||
    purchaseOrders.find((p) => p.status === 'Issued') ||
    purchaseOrders[0] ||
    null;

  const handleDownloadSinglePoBillPdf = (po: PurchaseOrder) => {
    const filename = generateSinglePurchaseOrderPdf(
      po,
      preventPoFileOverwrite,
      poTermsList
    );
    setSelectedPoIdForBill(po.id);
    setLastDownloadedPoPdf(filename);
  };

  const handleDownloadIssuedPosBillPdf = (onlyIssued: boolean) => {
    if (purchaseOrders.length === 0) return;
    const filename = generateAllPurchaseOrdersPdf(
      purchaseOrders,
      preventPoFileOverwrite,
      poTermsList,
      onlyIssued
    );
    setLastDownloadedPoPdf(filename);
  };

  const handleGenerateNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    const updated = Array.from(new Set([...customCategories, trimmed]));
    setCustomCategories(updated);
    try {
      localStorage.setItem(
        'thecaterings_custom_inv_categories',
        JSON.stringify(updated)
      );
    } catch {
      // ignore storage errors
    }
    setCategory(trimmed);
    setNewCategoryInput('');
    setIsCreatingCategory(false);
  };

  const handleCreateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    // If user typed a new category in the input field without clicking Generate first, use it automatically
    let finalCategory = category.trim() || 'Basmati & Grains';
    if (isCreatingCategory && newCategoryInput.trim()) {
      finalCategory = newCategoryInput.trim();
      const updated = Array.from(new Set([...customCategories, finalCategory]));
      setCustomCategories(updated);
      try {
        localStorage.setItem(
          'thecaterings_custom_inv_categories',
          JSON.stringify(updated)
        );
      } catch {
        // ignore
      }
    }

    onAddInventory({
      sku: sku.trim() || `INV-${885 + inventory.length}`,
      itemName: itemName.trim(),
      category: finalCategory,
      inStockQty: Number(inStockQty) || 0,
      reorderLevel: Number(reorderLevel) || 10,
      unit: unit || 'kg',
      unitPrice: Number(unitPrice) || 100,
      preferredVendor: preferredVendor.trim() || 'Delhi Khari Baoli Traders',
    });
    setItemName('');
    setNewCategoryInput('');
    setIsCreatingCategory(false);
    setSku(`INV-${886 + inventory.length}`);
    setShowAddStock(false);
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poVendor.trim() || !poSummary.trim()) return;
    onAddPo({
      poNumber: poNumber.trim() || 'PO-2026-500',
      vendorName: poVendor.trim(),
      itemsSummary: poSummary.trim(),
      totalAmount: Number(totalAmount) || 25000,
      deliveryDate,
      status: 'Issued',
    });
    setPoVendor('');
    setPoSummary('');
    setShowAddPO(false);
  };

  const handleQuickReorderFromItem = (item: InventoryItem) => {
    const orderQty = Math.max(50, item.reorderLevel * 2);
    setPoNumber(`PO-2026-${450 + purchaseOrders.length}`);
    setPoVendor(item.preferredVendor);
    setPoSummary(`${orderQty} ${item.unit} ${item.itemName} (${item.sku})`);
    setTotalAmount(orderQty * item.unitPrice);
    setShowAddPO(true);
  };

  const cyclePoStatus = (current: PurchaseOrder['status']): PurchaseOrder['status'] => {
    if (current === 'Issued') return 'Partially Delivered';
    if (current === 'Partially Delivered') return 'Received & Verified';
    return 'Issued';
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto px-2 sm:px-4">
      <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-800">
            TheCaterings Raw Material Store &amp; Cold-Chain
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Inventory Ledger &amp; Vendor Purchase Orders
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddStock(true)}
            aria-label="Add Raw Material SKU"
            title="Add Raw Material SKU"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>Add Stock SKU</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddPO(true)}
            aria-label="Issue Vendor PO"
            title="Issue Vendor PO"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-600 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Issue Vendor PO</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-stone-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Central Commissary Raw Material Stock Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Monitor live stock quantities, filter or generate categories, adjust stock in/out, and issue instant reorder POs
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600">
              Total SKUs: {inventory.length}
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('All')}
              className="px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
              style={
                selectedCategoryFilter === 'All'
                  ? {
                      backgroundColor: '#ffd700',
                      color: '#091e3a',
                      border: '2px solid #ffffff',
                    }
                  : {
                      backgroundColor: '#0f2942',
                      color: '#ffffff',
                      border: '1.5px solid #38bdf8',
                    }
              }
            >
              All Categories ({inventory.length})
            </button>
            {allCategories.map((cat) => {
              const count = inventory.filter((i) => i.category === cat).length;
              const isSelected = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className="px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
                  style={
                    isSelected
                      ? {
                          backgroundColor: '#ffd700',
                          color: '#091e3a',
                          border: '2px solid #ffffff',
                        }
                      : {
                          backgroundColor: '#0f2942',
                          color: '#ffffff',
                          border: '1.5px solid #38bdf8',
                        }
                  }
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">SKU / Raw Material</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Supplier / Mandi Vendor</th>
                <th className="py-3 px-3 text-right">In-Stock Qty</th>
                <th className="py-3 px-3 text-right">Reorder Min</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3">Stock Alert</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 text-xs">
              {inventory
                .filter(
                  (item) =>
                    selectedCategoryFilter === 'All' ||
                    item.category === selectedCategoryFilter
                )
                .map((item) => {
                const isLow = item.inStockQty <= item.reorderLevel;
                return (
                  <tr
                    key={item.id}
                    className={`inventory-stock-row hover-highlight-row transition-colors ${
                      isLow ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => {
                            setEditingInventoryItem(item);
                            setEditItemName(item.itemName);
                            setEditCategory(item.category);
                            setEditReorderLevel(item.reorderLevel);
                            setEditUnitPrice(item.unitPrice);
                            setEditPreferredVendor(item.preferredVendor);
                            setEditUnit(item.unit);
                            setEditImageUrl(item.imageUrl || '');
                          }}
                          className="w-10 h-10 rounded border-2 border-slate-800 overflow-hidden bg-stone-100 flex items-center justify-center shrink-0 cursor-pointer group shadow-xs relative"
                          title="Click to edit product image & details"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.itemName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <span className="text-xs">📦</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px]">
                            📷
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {item.sku}
                          </span>
                          <span className="product-title font-bold text-slate-900">
                            {item.itemName}
                          </span>
                        </div>
                      </div>
                      {item.lastKotDeduction && (
                        <span className="block mt-1 ml-13 text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 w-fit">
                          KOT Consumed: {item.lastKotDeduction}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span
                        className="category-badge inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold"
                        style={{
                          backgroundColor: '#7a003c',
                          color: '#ffff00',
                          border: '1.5px solid #ffd700',
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {item.preferredVendor}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {onUpdateInventoryQty && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateInventoryQty(
                                item.id,
                                Math.max(
                                  0,
                                  Number((item.inStockQty - 10).toFixed(2))
                                )
                              )
                            }
                            title="Deduct 10 units (Stock Out)"
                            className="w-6 h-6 rounded border border-stone-300 bg-white hover:bg-stone-100 text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                        )}
                        <span>
                          {item.inStockQty} {item.unit}
                        </span>
                        {onUpdateInventoryQty && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateInventoryQty(
                                item.id,
                                Number((item.inStockQty + 25).toFixed(2))
                              )
                            }
                            title="Add 25 units (Stock In)"
                            className="w-6 h-6 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      <div
                        onClick={() => {
                          setEditingInventoryItem(item);
                          setEditItemName(item.itemName);
                          setEditCategory(item.category);
                          setEditReorderLevel(item.reorderLevel);
                          setEditUnitPrice(item.unitPrice);
                          setEditPreferredVendor(item.preferredVendor);
                          setEditUnit(item.unit);
                        }}
                        className="inline-flex items-center gap-1.5 justify-end cursor-pointer group"
                        title="Click to edit Reorder Min & Unit Price"
                      >
                        <span className="group-hover:text-amber-700 group-hover:underline">{item.reorderLevel} {item.unit}</span>
                        <Pencil className="w-3 h-3 text-stone-400 group-hover:text-amber-700" />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800 tabular-nums">
                      <div
                        onClick={() => {
                          setEditingInventoryItem(item);
                          setEditItemName(item.itemName);
                          setEditCategory(item.category);
                          setEditReorderLevel(item.reorderLevel);
                          setEditUnitPrice(item.unitPrice);
                          setEditPreferredVendor(item.preferredVendor);
                          setEditUnit(item.unit);
                        }}
                        className="inline-flex items-center gap-1.5 justify-end cursor-pointer group"
                        title="Click to edit Reorder Min & Unit Price"
                      >
                        <span className="group-hover:text-amber-700 group-hover:underline">{formatINR(item.unitPrice)}/{item.unit}</span>
                        <Pencil className="w-3 h-3 text-stone-400 group-hover:text-amber-700" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {isLow ? (
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 w-fit">
                            ⚡ Low Stock · Auto-PO Issued
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickReorderFromItem(item)}
                            title="Click to issue an additional custom PO for this Vendor"
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white hover:bg-red-50 text-red-700 border border-red-200 cursor-pointer w-fit"
                          >
                            + Custom Reorder PO
                          </button>
                        </div>
                      ) : (
                        <span className="stock-status-badge inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors">
                          Sufficient Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingInventoryItem(item);
                            setEditItemName(item.itemName);
                            setEditCategory(item.category);
                            setEditReorderLevel(item.reorderLevel);
                            setEditUnitPrice(item.unitPrice);
                            setEditPreferredVendor(item.preferredVendor);
                            setEditUnit(item.unit);
                          }}
                          aria-label={`Edit ${item.itemName}`}
                          title="Edit Reorder Min, Unit Price & Details"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInventory(item.id, item.itemName)}
                          aria-label={`Delete ${item.itemName}`}
                          title="Delete SKU"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Inventory SKU Modal */}
      {editingInventoryItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Edit Raw Material SKU</h3>
                <p className="text-xs text-slate-300 font-mono">SKU: {editingInventoryItem.sku}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingInventoryItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveInventoryEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Image URL / Photo</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://... or photo URL"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Vendor</label>
                  <input
                    type="text"
                    value={editPreferredVendor}
                    onChange={(e) => setEditPreferredVendor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-amber-50/50 p-4 rounded-lg border border-amber-200">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Reorder Min (Alert)</label>
                  <input
                    type="number"
                    step="any"
                    value={editReorderLevel}
                    onChange={(e) => setEditReorderLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-amber-300 rounded-md bg-white focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={editUnitPrice}
                    onChange={(e) => setEditUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-amber-300 rounded-md bg-white focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Unit</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-md bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="packets">packets</option>
                    <option value="boxes">boxes</option>
                    <option value="tins">tins</option>
                    <option value="bundles">bundles</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingInventoryItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-stone-100 hover:bg-stone-200 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-md cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Orders */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Active Vendor Purchase Orders (POs) &amp; Boxed Bill PDF Export
            </h3>
            <p className="text-xs text-slate-500">
              Click any PO status badge to update GRN stage, or download the official Boxed Purchase Order Bill PDF
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-stone-100 px-2.5 py-1.5 rounded-lg border border-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={preventPoFileOverwrite}
                onChange={(e) => setPreventPoFileOverwrite(e.target.checked)}
                className="rounded border-stone-300 text-amber-700 focus:ring-amber-600"
              />
              <span>Unique Filename (_001)</span>
            </label>
            <button
              type="button"
              onClick={() => handleDownloadIssuedPosBillPdf(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
              title="Download Boxed Bill Format PDF for all Issued POs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Issued POs Bill PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadIssuedPosBillPdf(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
              title="Download Boxed Bill Format PDF for all Vendor POs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>All POs Bill Register PDF ({purchaseOrders.length})</span>
            </button>
          </div>
        </div>

        {lastDownloadedPoPdf && (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Downloaded Boxed PO Bill PDF:{' '}
                <strong className="font-mono">{lastDownloadedPoPdf}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLastDownloadedPoPdf(null)}
              className="text-emerald-700 hover:text-emerald-950 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {purchaseOrders.map((po) => {
            const statuses: PurchaseOrder['status'][] = [
              'Issued',
              'Partially Delivered',
              'Received & Verified',
            ];
            const isSelectedForPreview = activePreviewPo?.id === po.id;
            return (
              <div
                key={po.id}
                className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                  isSelectedForPreview
                    ? 'border-amber-600 bg-amber-50/25 ring-1 ring-amber-500/30'
                    : 'border-stone-200/90 bg-stone-50/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-amber-800">
                      {po.poNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePoStatus &&
                        onUpdatePoStatus(po.id, cyclePoStatus(po.status))
                      }
                      title="Click to cycle PO Delivery / GRN Status"
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        po.status === 'Received & Verified'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : po.status === 'Issued'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          : 'bg-stone-100 text-slate-700 border-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {po.status} ↻
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {po.vendorName}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {po.itemsSummary}
                  </p>

                  {/* Direct GRN Status Stage Buttons */}
                  <div className="mt-3 pt-2.5 border-t border-stone-200/60">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Update GRN / Delivery Status:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {statuses.map((st) => {
                        const isActive = po.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              onUpdatePoStatus && onUpdatePoStatus(po.id, st)
                            }
                            className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                              isActive
                                ? st === 'Received & Verified'
                                  ? 'bg-emerald-700 text-white border-emerald-700'
                                  : st === 'Issued'
                                  ? 'bg-amber-700 text-white border-amber-700'
                                  : 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-100 hover:text-slate-900'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">
                        ETA: {po.deliveryDate}
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                        {formatINR(po.totalAmount)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeletePo(po.id, po.poNumber)}
                      aria-label={`Delete PO ${po.poNumber}`}
                      title="Delete PO"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* PO Bill Format Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadSinglePoBillPdf(po)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-700 hover:bg-amber-600 text-white transition-colors cursor-pointer shadow-2xs"
                      title={`Download Boxed Bill PDF for ${po.poNumber}`}
                    >
                      <FileDown className="w-3.5 h-3.5 shrink-0" />
                      <span>Download PO Bill PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPoIdForBill(po.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                        isSelectedForPreview
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-stone-300 hover:bg-stone-100'
                      }`}
                      title="View in Boxed Bill Format below"
                    >
                      {isSelectedForPreview ? 'Viewing Bill' : 'Bill Format'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Official Boxed Purchase Order Bill Format Live Preview */}
        {activePreviewPo && (() => {
          const parsedPo = parsePoItemsSummary(activePreviewPo);
          return (
            <div className="mt-6 pt-5 border-t border-stone-200">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-800" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Issued PO — Official Boxed Bill Format Preview (A4 Print &amp; PDF Layout)
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={activePreviewPo.id}
                    onChange={(e) => setSelectedPoIdForBill(e.target.value)}
                    aria-label="Select PO for Bill Format Preview"
                    className="px-2.5 py-1.5 text-xs font-mono font-semibold border border-stone-300 rounded-lg bg-white text-slate-800"
                  >
                    {purchaseOrders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.poNumber} • {p.vendorName} ({p.status})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsEditingPoTerms((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-stone-50 hover:bg-stone-100 text-slate-700 cursor-pointer"
                  >
                    {isEditingPoTerms ? 'Done Editing Terms' : 'Edit PO Terms'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSinglePoBillPdf(activePreviewPo)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>
                      Download {activePreviewPo.poNumber} Bill PDF
                    </span>
                  </button>
                </div>
              </div>

              {/* Boxed Bill Sheet */}
              <div className="border-2 border-slate-800 rounded-none bg-white text-slate-900 shadow-sm overflow-hidden text-xs">
                {/* 1. Top Banner */}
                <div className="bg-amber-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-800">
                  <span className="font-bold tracking-wider uppercase text-[11px]">
                    OFFICIAL VENDOR PURCHASE ORDER &amp; MANDI INDENT BILL (TAX INPUT DOCUMENT)
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-amber-200">
                    STATUS: {activePreviewPo.status.toUpperCase()}
                  </span>
                </div>

                {/* 2. Company Header with Logo & 2x2 PO Metadata Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-800">
                  <div className="lg:col-span-7 p-4 flex flex-col items-center text-center bg-amber-50/20 border-b lg:border-b-0 lg:border-r border-slate-800">
                    <TheCateringsLogo
                      className="h-14 w-auto mb-2 shrink-0"
                      imgClassName="h-14 w-auto object-contain"
                    />
                    <div className="space-y-0.5 w-full">
                      <div className="text-base font-extrabold tracking-tight text-slate-900 font-display">
                        THECATERINGS
                      </div>
                      <div className="text-xs font-bold text-amber-800">
                        Royal Banquet, Outdoor Catering &amp; Luxury Hospitality Operations
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Regd. Commissary: MG Road, Sultanpur, New Delhi - 110030 | Tel: +91 98111 44200
                      </div>
                      <div className="text-[11px] font-mono font-bold text-slate-900">
                        GSTIN: 07AABCT2026B1Z8 &nbsp;|&nbsp; PAN: AABCT2026B &nbsp;|&nbsp; FSSAI: 10026011004829
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-5 grid grid-cols-2 divide-x divide-y divide-slate-800">
                    <div className="p-2.5">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Purchase Order No.
                      </div>
                      <div className="font-mono font-bold text-sm text-amber-800 mt-0.5">
                        {activePreviewPo.poNumber}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Delivery ETA Date
                      </div>
                      <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                        {activePreviewPo.deliveryDate}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Indent / Payment Terms
                      </div>
                      <div className="font-semibold text-xs text-slate-800 mt-0.5">
                        Credit / 7-Day GRN
                      </div>
                    </div>
                    <div className="p-2.5 bg-amber-50/30">
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        GRN / PO Status
                      </div>
                      <div className="font-bold text-xs text-amber-900 mt-0.5">
                        {activePreviewPo.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Billed From Supplier & Ship To Commissary */}
                <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-800">
                  <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-800">
                    <div className="bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-800">
                      Issued To Supplier / Mandi Vendor (Billed From)
                    </div>
                    <div className="p-3 space-y-0.5">
                      <div className="font-bold text-sm text-slate-900">
                        {activePreviewPo.vendorName}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Authorized Wholesale Mandi &amp; Cold-Chain Raw Material Supplier
                      </div>
                      <div className="text-[11px] font-mono text-amber-900">
                        Supply Category: FSSAI Grade-A Commissary Stock &nbsp;|&nbsp; State Code: 07 / 06
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-5">
                    <div className="bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-800">
                      Delivery Consignee (Ship To Commissary)
                    </div>
                    <div className="p-3 space-y-0.5">
                      <div className="font-bold text-xs text-slate-900">
                        TheCaterings Central Store &amp; Cold-Chain
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Receiving Gate #2, Okhla Industrial Area, New Delhi
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-800">
                        Quality Check: Head Maharaj &amp; Store In-Charge
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Boxed Line Items Table */}
                <div className="overflow-x-auto border-b border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider divide-x divide-slate-700">
                        <th className="py-2 px-3 text-center w-12">Sr.</th>
                        <th className="py-2 px-3">Raw Material / SKU Description</th>
                        <th className="py-2 px-3 text-center w-20">HSN</th>
                        <th className="py-2 px-3 text-right w-28">Ordered Qty</th>
                        <th className="py-2 px-3 text-right w-28">Est. Rate</th>
                        <th className="py-2 px-3 text-right w-32">Taxable (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 text-xs">
                      {parsedPo.items.map((item) => (
                        <tr
                          key={item.srNo}
                          className="po-bill-item-row hover-highlight-row divide-x divide-slate-300 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                            {item.srNo}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">
                              {item.description}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              PO Ref: {activePreviewPo.poNumber} • Grade-A Commissary Spec
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {item.hsnCode}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {item.qtyText}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {formatINR(item.unitRate)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatINR(item.taxableValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 5. Consolidated PO Indent Strip */}
                <div className="bg-amber-50/70 px-3.5 py-2 border-b border-slate-800 text-[11px] font-semibold text-amber-950">
                  CONSOLIDATED PO INDENT SUMMARY: {activePreviewPo.itemsSummary}
                </div>

                {/* 6. Amount in Words & Tax Calculation Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-800">
                  <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-800">
                        Total PO Bill Amount in Words (Indian Rupees)
                      </div>
                      <div className="p-3 font-bold text-slate-900 text-xs">
                        Rupees {numberToIndianWords(parsedPo.grandTotal)} Only
                      </div>
                    </div>
                    <div className="border-t border-slate-300 p-3 bg-stone-50/60 space-y-1 text-[11px] text-slate-600">
                      <div className="font-bold text-emerald-800 uppercase text-[10px]">
                        Commissary Receiving &amp; Vendor Payout Desk
                      </div>
                      <div>• GRN Weight Check: Net weight after tare deduction only.</div>
                      <div>• Payout Mode: NEFT / RTGS / Corporate UPI within 7 days of GRN.</div>
                    </div>
                  </div>
                  <div className="lg:col-span-5 divide-y divide-slate-300">
                    <div className="flex justify-between px-3 py-2">
                      <span className="font-semibold text-slate-700">
                        Taxable Raw Material Value
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatINR(parsedPo.taxableSubtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-slate-600">Add: Input CGST @ 2.5%</span>
                      <span className="font-mono text-slate-800">
                        {formatINR(parsedPo.cgstAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-slate-600">Add: Input SGST @ 2.5%</span>
                      <span className="font-mono text-slate-800">
                        {formatINR(parsedPo.sgstAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-slate-600">
                        Freight / Cold-Chain Unloading
                      </span>
                      <span className="font-mono text-emerald-800 font-semibold">
                        Included
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2.5 bg-amber-900 text-white">
                      <span className="font-bold uppercase tracking-wider text-[11px]">
                        Grand Total PO Value
                      </span>
                      <span className="font-mono text-sm font-extrabold text-amber-200">
                        {formatINR(parsedPo.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7. Terms & Conditions + Signatory Box */}
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-800">
                    <div className="bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-800">
                      Purchase Order Terms &amp; Mandi Receiving Conditions
                    </div>
                    <div className="p-3 space-y-1.5">
                      {isEditingPoTerms ? (
                        <div className="space-y-1.5">
                          {poTermsList.map((term, idx) => (
                            <input
                              key={idx}
                              type="text"
                              value={term}
                              onChange={(e) => {
                                const next = [...poTermsList];
                                next[idx] = e.target.value;
                                setPoTermsList(next);
                              }}
                              className="w-full px-2 py-1 text-[11px] border border-amber-400 rounded bg-amber-50/20"
                            />
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-1 text-[11px] text-slate-600">
                          {poTermsList.map((term, idx) => (
                            <li key={idx}>{term}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-5 p-3 flex flex-col justify-between items-center text-center bg-stone-50/40">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        For TheCaterings Hospitality Pvt. Ltd.
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Central Commissary &amp; Procurement Division
                      </div>
                    </div>
                    <div className="my-3 px-4 py-2 border border-amber-700 bg-amber-50/70 rounded text-[11px]">
                      <div className="font-bold text-amber-900 uppercase">
                        Approved Commissary PO
                      </div>
                      <div className="font-mono text-[10px] text-slate-700">
                        Ref: {activePreviewPo.poNumber} • {activePreviewPo.status}
                      </div>
                    </div>
                    <div className="w-full pt-2 border-t border-slate-400 text-[11px] font-semibold text-slate-800">
                      Head Maharaj / Procurement Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-slate-900">
                Add Commissary Raw Material SKU
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStock(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStock} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory((prev) => !prev)}
                      className="text-[11px] font-semibold text-amber-800 hover:text-amber-600 cursor-pointer"
                    >
                      {isCreatingCategory
                        ? 'Select Existing Category'
                        : '+ Generate New Category'}
                    </button>
                  </div>

                  {!isCreatingCategory ? (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        placeholder="Type new category (e.g. Chaat Masala)"
                        className="flex-1 px-2.5 py-2 text-xs border border-amber-400 rounded-lg bg-amber-50/30"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateNewCategory}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shrink-0 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Mathura Pure Cow Ghee Tin"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Stock
                  </label>
                  <input
                    type="number"
                    value={inStockQty}
                    onChange={(e) => setInStockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reorder Min
                  </label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="tin">tin</option>
                    <option value="box">box</option>
                    <option value="pkt">pkt</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier / Mandi Vendor
                </label>
                <input
                  type="text"
                  value={preferredVendor}
                  onChange={(e) => setPreferredVendor(e.target.value)}
                  placeholder="e.g. Bikaner Dairy Guild"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddStock(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-600 text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save SKU</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add PO Modal */}
      {showAddPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-200 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-slate-900">
                Issue Vendor Purchase Order
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPO(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Delivery
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={poVendor}
                  onChange={(e) => setPoVendor(e.target.value)}
                  placeholder="e.g. Karnal Agro Mills"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Items Summary *
                </label>
                <input
                  type="text"
                  required
                  value={poSummary}
                  onChange={(e) => setPoSummary(e.target.value)}
                  placeholder="e.g. 500 kg Basmati Rice + 80 L Mustard Oil"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total PO Amount (₹)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddPO(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-600 text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue PO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MODULE MAHARAJ & STAFF ROSTER
// ============================================================================
interface Module09Props {
  staff: StaffMember[];
  events?: BanquetEvent[];
  onAddStaff: (member: Omit<StaffMember, 'id'>) => void;
  onDeleteStaff: (id: string, fullName: string) => void;
  onUpdateStaffAttendance?: (
    id: string,
    attendance: StaffMember['attendance']
  ) => void;
  onUpdateStaffMember?: (id: string, updated: Partial<StaffMember>) => void;
}

const DEFAULT_BRIGADE_ROLES: StaffMember['roleTitle'][] = [
  'Head Maharaj',
  'Halwai Specialist',
  'Tandoor Ustad',
  'Chaat Master',
  'Banquet Captain',
  'Manager',
  'Counter Crew',
  'Supporting Staff',
  'Waiter',
  'Labour',
  'Supplement Staff',
];

export const Module09StaffRoster: React.FC<Module09Props> = ({
  staff,
  events,
  onAddStaff,
  onDeleteStaff,
  onUpdateStaffAttendance,
  onUpdateStaffMember,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');

  const [empCode, setEmpCode] = useState('STF-210');
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] =
    useState<StaffMember['roleTitle']>('Head Maharaj');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('+91 98111 44290');
  const [assignedEvent, setAssignedEvent] = useState(
    'Royal Durbar Hall (14 Oct)'
  );
  const [shiftRate, setShiftRate] = useState(4500);
  const [attendance, setAttendance] =
    useState<StaffMember['attendance']>('On Duty');

  const allBrigadeRoles = Array.from(
    new Set([
      ...DEFAULT_BRIGADE_ROLES,
      ...staff.map((s) => s.roleTitle).filter(Boolean),
    ])
  );

  const filteredStaff = staff.filter(
    (s) =>
      (attendanceFilter === 'All' || s.attendance === attendanceFilter) &&
      (roleFilter === 'All Roles' || s.roleTitle === roleFilter)
  );

  const totalShiftPayroll = filteredStaff.reduce(
    (acc, s) => acc + s.shiftRate,
    0
  );

  const cycleAttendance = (
    current: StaffMember['attendance']
  ): StaffMember['attendance'] => {
    if (current === 'On Duty') return 'Confirmed Shift';
    if (current === 'Confirmed Shift') return 'Standby';
    return 'On Duty';
  };

  const handleRoleChange = (newRole: StaffMember['roleTitle']) => {
    setRoleTitle(newRole);
    if (!editingMemberId) {
      const rolePresets: Record<
        string,
        { prefix: string; rate: number; defaultSpecialty: string }
      > = {
        'Head Maharaj': {
          prefix: 'MHJ',
          rate: 8500,
          defaultSpecialty: 'Royal Marwari, Jain & Copper Handi Gravies',
        },
        'Halwai Specialist': {
          prefix: 'HLW',
          rate: 5800,
          defaultSpecialty: 'Live Jalebi, Malai Rabri & Khoya Mithai',
        },
        'Tandoor Ustad': {
          prefix: 'UST',
          rate: 6200,
          defaultSpecialty: 'Charcoal Tandoor, Seekh & Zafrani Tikka',
        },
        'Chaat Master': {
          prefix: 'CHT',
          rate: 4500,
          defaultSpecialty: 'Banarasi Chaat, Dahi Bhalla & Golgappa Counter',
        },
        'Banquet Captain': {
          prefix: 'CPT',
          rate: 5000,
          defaultSpecialty: 'Silver Plated VIP Sit-Down & Steward Supervision',
        },
        Manager: {
          prefix: 'MGR',
          rate: 6500,
          defaultSpecialty:
            'End-to-End Event Execution, VIP Host Coordination & Brigade Command',
        },
        'Counter Crew': {
          prefix: 'CCR',
          rate: 2200,
          defaultSpecialty:
            'Live Chaat, Tawa & Mithai Counter Plating, Garnish & Guest Serving',
        },
        'Supporting Staff': {
          prefix: 'SPT',
          rate: 1600,
          defaultSpecialty:
            'Kitchen Prep Assistance, Pantry Runner & Water Station Refill',
        },
        Waiter: {
          prefix: 'WTR',
          rate: 1800,
          defaultSpecialty: 'Uniformed VIP Table Service & Pass-Around Starters',
        },
        Labour: {
          prefix: 'LBR',
          rate: 1200,
          defaultSpecialty: 'Handi Utensil Loading, Chafing Setup & Scullery',
        },
        'Supplement Staff': {
          prefix: 'SUP',
          rate: 1500,
          defaultSpecialty: 'Peak-Hour Buffet Refill & Live Counter Support',
        },
      };
      const preset = rolePresets[newRole];
      if (preset) {
        setEmpCode(`${preset.prefix}-${201 + staff.length}`);
        setShiftRate(preset.rate);
        if (!specialty.trim()) {
          setSpecialty(preset.defaultSpecialty);
        }
      }
    }
  };

  const openAddModal = () => {
    setEditingMemberId(null);
    const initialRole =
      roleFilter !== 'All Roles' ? roleFilter : 'Head Maharaj';
    setEmpCode(`STF-${210 + staff.length}`);
    setFullName('');
    setRoleTitle(initialRole);
    setSpecialty('');
    setPhone('+91 98111 44290');
    setAssignedEvent('Grand Imperial Lawns');
    setShiftRate(
      initialRole === 'Manager'
        ? 6500
        : initialRole === 'Counter Crew'
        ? 2200
        : initialRole === 'Supporting Staff'
        ? 1600
        : initialRole === 'Waiter'
        ? 1800
        : initialRole === 'Labour'
        ? 1200
        : initialRole === 'Supplement Staff'
        ? 1500
        : 5500
    );
    setAttendance('On Duty');
    setShowAddModal(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingMemberId(member.id);
    setEmpCode(member.empCode);
    setFullName(member.fullName);
    setRoleTitle(member.roleTitle);
    setSpecialty(member.specialty);
    setPhone(member.phone);
    setAssignedEvent(member.assignedEvent);
    setShiftRate(member.shiftRate);
    setAttendance(member.attendance);
    setShowAddModal(true);
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    if (editingMemberId && onUpdateStaffMember) {
      onUpdateStaffMember(editingMemberId, {
        empCode: empCode.trim() || 'STF-250',
        fullName: fullName.trim(),
        roleTitle,
        specialty: specialty.trim() || 'Royal Banquet Production',
        phone: phone.trim(),
        assignedEvent: assignedEvent.trim() || 'Main Commissary',
        shiftRate: Number(shiftRate) || 2000,
        attendance,
      });
    } else {
      onAddStaff({
        empCode: empCode.trim() || 'STF-250',
        fullName: fullName.trim(),
        roleTitle,
        specialty: specialty.trim() || 'Royal Banquet Production',
        phone: phone.trim(),
        assignedEvent: assignedEvent.trim() || 'Main Commissary',
        shiftRate: Number(shiftRate) || 2000,
        attendance,
      });
    }
    setFullName('');
    setSpecialty('');
    setEditingMemberId(null);
    setShowAddModal(false);
  };

  const attendanceOptions: StaffMember['attendance'][] = [
    'On Duty',
    'Confirmed Shift',
    'Standby',
  ];

  return (
    <div className="space-y-2.5 max-w-5xl mx-auto px-2 sm:px-4">
      <div className="bg-white border border-stone-200/80 rounded-xl p-2 sm:p-2.5 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-800">
              Culinary Brigade &amp; Service Captains
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Maharaj, Halwai &amp; Banquet Service Roster
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click any status button on a card to update shift status immediately
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-stone-100 px-2.5 py-1 rounded-lg text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 block">
                Per-Event Shift Payout
              </span>
              <span className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                {formatINR(totalShiftPayroll)}
              </span>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              aria-label="Assign Brigade Staff"
              title="Assign Brigade Staff"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-700 hover:bg-amber-600 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Staff</span>
            </button>
          </div>
        </div>

        {/* Attendance Status & Brigade Role Filter Bars */}
        <div className="space-y-1.5 pt-1.5 border-t border-stone-200/70">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(['All', 'On Duty', 'Confirmed Shift', 'Standby'] as const).map(
              (st) => {
                const count =
                  st === 'All'
                    ? staff.length
                    : staff.filter((m) => m.attendance === st).length;
                const isSelected = attendanceFilter === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAttendanceFilter(st)}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shadow-xs"
                    style={
                      isSelected
                        ? {
                            backgroundColor: '#ffd700',
                            color: '#091e3a',
                            border: '1.5px solid #ffffff',
                          }
                        : {
                            backgroundColor: '#0f2942',
                            color: '#ffffff',
                            border: '1px solid #38bdf8',
                          }
                    }
                  >
                    {st === 'All' ? 'All Duty Status' : st} ({count})
                  </button>
                );
              }
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setRoleFilter('All Roles')}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shadow-xs"
              style={
                roleFilter === 'All Roles'
                  ? {
                      backgroundColor: '#ffd700',
                      color: '#091e3a',
                      border: '1.5px solid #ffffff',
                    }
                  : {
                      backgroundColor: '#0f2942',
                      color: '#ffffff',
                      border: '1px solid #38bdf8',
                    }
              }
            >
              All Brigade Roles ({staff.length})
            </button>
            {allBrigadeRoles.map((role) => {
              const count = staff.filter((m) => m.roleTitle === role).length;
              const isSelected = roleFilter === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shadow-xs"
                  style={
                    isSelected
                      ? {
                          backgroundColor: '#ffd700',
                          color: '#091e3a',
                          border: '1.5px solid #ffffff',
                        }
                      : {
                          backgroundColor: '#0f2942',
                          color: '#ffffff',
                          border: '1px solid #38bdf8',
                        }
                  }
                >
                  {role} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-5xl mx-auto">
        {filteredStaff.map((member) => {
          return (
            <div
              key={member.id}
              className="bg-white border border-stone-200/90 rounded-xl p-2 sm:p-2.5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/70">
                    {member.roleTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStaffAttendance &&
                      onUpdateStaffAttendance(
                        member.id,
                        cycleAttendance(member.attendance)
                      )
                    }
                    title="Click to cycle shift status (On Duty → Confirmed Shift → Standby)"
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      member.attendance === 'On Duty'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : member.attendance === 'Standby'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : 'bg-stone-100 text-slate-700 border-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {member.attendance} ↻
                  </button>
                </div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  {member.empCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {member.fullName}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {member.specialty}
                </p>
                <div className="mt-3 pt-3 border-t border-stone-200/60 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Assigned Event:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]" title={member.assignedEvent}>
                      {member.assignedEvent}
                    </span>
                  </div>
                  {events && (() => {
                    const matchedEvent = events.find(
                      (ev) =>
                        member.assignedEvent.toLowerCase().includes(ev.eventName.toLowerCase()) ||
                        ev.eventName.toLowerCase().includes(member.assignedEvent.toLowerCase())
                    );
                    if (!matchedEvent) return null;
                    return (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Event Status:</span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            matchedEvent.status === 'Completed'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {matchedEvent.status === 'Completed' ? 'Completed (Standby)' : `Active (${matchedEvent.status})`}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact:</span>
                    <span className="font-mono text-slate-700">
                      {member.phone}
                    </span>
                  </div>
                </div>

                {/* Direct Shift / Attendance Status Buttons */}
                <div className="mt-3 pt-2.5 border-t border-stone-200/60">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Change Shift Status:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {attendanceOptions.map((opt) => {
                      const isActive = member.attendance === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            onUpdateStaffAttendance &&
                            onUpdateStaffAttendance(member.id, opt)
                          }
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                            isActive
                              ? opt === 'On Duty'
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : opt === 'Standby'
                                ? 'bg-amber-700 text-white border-amber-700'
                                : 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white text-slate-600 border-stone-200 hover:bg-stone-100 hover:text-slate-900'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                    Shift Allowance
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                    {formatINR(member.shiftRate)} / shift
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(member)}
                    title="Edit Staff Details & Shift Status"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-stone-100 border border-stone-200 hover:bg-stone-200 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteStaff(member.id, member.fullName)}
                    aria-label={`Delete staff ${member.fullName}`}
                    title="Remove Staff Member"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-xl max-w-md w-full p-6 shadow-xl my-auto" style={{ overflow: 'auto', height: 'auto', maxHeight: '90vh' }}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingMemberId
                  ? 'Edit Staff & Shift Status'
                  : 'Assign Maharaj or Brigade Member'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingMemberId(null);
                  setShowAddModal(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emp Code
                  </label>
                  <input
                    type="text"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brigade Role
                  </label>
                  <select
                    value={roleTitle}
                    onChange={(e) =>
                      handleRoleChange(e.target.value as StaffMember['roleTitle'])
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    {allBrigadeRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maharaj Brijmohan Sharma"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Culinary Specialty
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Marwari Royal Thali & Dal Baati"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Hall / Event
                  </label>
                  <input
                    type="text"
                    value={assignedEvent}
                    onChange={(e) => setAssignedEvent(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={shiftRate}
                    onChange={(e) => setShiftRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift / Duty Status
                  </label>
                  <select
                    value={attendance}
                    onChange={(e) =>
                      setAttendance(
                        e.target.value as StaffMember['attendance']
                      )
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="On Duty">On Duty</option>
                    <option value="Confirmed Shift">Confirmed Shift</option>
                    <option value="Standby">Standby</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMemberId(null);
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-600 text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {editingMemberId ? 'Save Changes' : 'Assign to Roster'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MODULE GST INVOICING & LEDGER + INDIAN PAYMENT & PAYPAL + PDF EXPORT
// ============================================================================
interface Module10Props {
  invoices: GstInvoice[];
  purchaseOrders?: PurchaseOrder[];
  onAddInvoice: (inv: Omit<GstInvoice, 'id'>) => void;
  onDeleteInvoice: (id: string, invoiceNo: string) => void;
  onRecordPayment: (
    invoiceId: string,
    amount: number,
    method: string,
    txRef: string
  ) => void;
  onRequire2FA?: (actionLabel: string, callback: () => void) => void;
}

export const Module10GstInvoicing: React.FC<Module10Props> = ({
  invoices,
  purchaseOrders = [],
  onAddInvoice,
  onDeleteInvoice,
  onRecordPayment,
  onRequire2FA,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('TC-GST-2026-092');
  const [clientName, setClientName] = useState('');
  const [gstin, setGstin] = useState('07AAACR5055K1Z2');
  const [eventName, setEventName] = useState('Royal Wedding Reception');
  const [billingDate, setBillingDate] = useState('2026-10-18');
  const [sacCode, setSacCode] = useState('996333');
  const [taxableAmount, setTaxableAmount] = useState(500000);
  const [gstRate, setGstRate] = useState<5 | 18>(5);
  const [amountPaid, setAmountPaid] = useState(200000);

  // Payment Gateway Modal State (Indian UPI / Razorpay / PayPal)
  const [activePayInvoice, setActivePayInvoice] = useState<GstInvoice | null>(
    null
  );
  const [selectedGateway, setSelectedGateway] = useState<
    'UPI' | 'RAZORPAY' | 'PAYPAL'
  >('UPI');
  const [upiId, setUpiId] = useState('client@okicici');
  const [payAmountInr, setPayAmountInr] = useState(100000);
  const [pdfFeedback, setPdfFeedback] = useState<string | null>(null);

  // Boxed Bill & Ledger Format Preview + Editable Footer Terms & Conditions
  const [previewMode, setPreviewMode] = useState<'BILL' | 'LEDGER'>('BILL');
  const [selectedPreviewInvId, setSelectedPreviewInvId] = useState<string>(
    invoices[0]?.id || ''
  );
  const [termsList, setTermsList] = useState<string[]>(
    DEFAULT_GST_TERMS_AND_CONDITIONS
  );
  const [editingTerms, setEditingTerms] = useState(false);
  const [preventPdfOverwrite, setPreventPdfOverwrite] = useState(true);

  // View switch & Financial Statements Frequency
  const [activeViewTab, setActiveViewTab] = useState<'LEDGER' | 'STATEMENTS'>('LEDGER');
  const [statementFreq, setStatementFreq] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'>('MONTHLY');

  const previewInvoice =
    invoices.find((i) => i.id === selectedPreviewInvId) || invoices[0] || null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    onAddInvoice({
      invoiceNo: invoiceNo.trim() || 'TC-GST-2026-100',
      clientName: clientName.trim(),
      gstin: gstin.trim() || 'Unregistered (B2C)',
      eventName: eventName.trim() || 'Banquet Event',
      billingDate,
      sacCode,
      taxableAmount: Number(taxableAmount) || 0,
      gstRate,
      amountPaid: Number(amountPaid) || 0,
      paymentStatus: 'Part Advance',
      paymentMethod: 'Indian UPI (payments@thecaterings.upi)',
    });
    setClientName('');
    setShowAddModal(false);
  };

  const openPaymentModal = (inv: GstInvoice) => {
    const gst = Math.round((inv.taxableAmount * inv.gstRate) / 100);
    const total = inv.taxableAmount + gst;
    const due = Math.max(0, total - inv.amountPaid);
    setActivePayInvoice(inv);
    setPayAmountInr(due > 0 ? due : 50000);
    setSelectedGateway('UPI');
  };

  const handleProcessGatewayPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayInvoice) return;
    const added = Math.max(1, Number(payAmountInr) || 0);
    const gatewayLabel =
      selectedGateway === 'UPI'
        ? `Indian UPI (${upiId || 'BHIM/GPay'})`
        : selectedGateway === 'RAZORPAY'
        ? 'Razorpay / PayU India (Cards / NetBanking)'
        : 'PayPal Global ($' + (added / 84).toFixed(2) + ' USD)';
    const txRef = `${selectedGateway}-${Date.now().toString().slice(-6)}`;
    onRecordPayment(activePayInvoice.id, added, gatewayLabel, txRef);
    setActivePayInvoice(null);
  };

  const runDownloadFullLedgerPdf = () => {
    const fileName = generateFullGstLedgerPdf(
      invoices,
      termsList,
      preventPdfOverwrite
    );
    setPdfFeedback(
      `Generated & Downloaded Boxed ${fileName} (Non-Overwriting Layout & File Control)`
    );
    setTimeout(() => setPdfFeedback(null), 4000);
  };

  const handleDownloadFullLedgerPdf = () => {
    if (onRequire2FA) {
      onRequire2FA(
        'Generate & Download PDF GST Invoicing & Ledger',
        runDownloadFullLedgerPdf
      );
    } else {
      runDownloadFullLedgerPdf();
    }
  };

  const runDownloadSinglePdf = (inv: GstInvoice) => {
    const fileName = generateSingleInvoicePdf(
      inv,
      termsList,
      preventPdfOverwrite
    );
    setPdfFeedback(
      `Generated & Downloaded Boxed ${fileName} (Non-Overwriting Layout & File Control)`
    );
    setTimeout(() => setPdfFeedback(null), 4000);
  };

  const handleDownloadSinglePdf = (inv: GstInvoice) => {
    if (onRequire2FA) {
      onRequire2FA(
        `Generate & Download GST Tax Invoice PDF (${inv.invoiceNo})`,
        () => runDownloadSinglePdf(inv)
      );
    } else {
      runDownloadSinglePdf(inv);
    }
  };

  const totalTaxable = invoices.reduce((s, i) => s + i.taxableAmount, 0);
  const totalGst = invoices.reduce(
    (s, i) => s + Math.round((i.taxableAmount * i.gstRate) / 100),
    0
  );
  const totalBilled = totalTaxable + totalGst;
  const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalBalanceDue = Math.max(0, totalBilled - totalCollected);

  // Financial Statements Helper & Calculations
  const getPeriodKey = (dateStr: string, freq: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY') => {
    if (!dateStr) return freq === 'ANNUALLY' ? '2026' : freq === 'QUARTERLY' ? '2026-Q4' : '2026-10';
    if (freq === 'ANNUALLY') return dateStr.slice(0, 4);
    if (freq === 'QUARTERLY') {
      const m = parseInt(dateStr.slice(5, 7), 10) || 10;
      return `${dateStr.slice(0, 4)}-Q${Math.ceil(m / 3)}`;
    }
    return dateStr.slice(0, 7);
  };

  const allPeriodsSet = new Set<string>();
  invoices.forEach(inv => allPeriodsSet.add(getPeriodKey(inv.billingDate, statementFreq)));
  purchaseOrders.forEach(po => allPeriodsSet.add(getPeriodKey(po.deliveryDate, statementFreq)));
  if (allPeriodsSet.size === 0) {
    allPeriodsSet.add(statementFreq === 'ANNUALLY' ? '2026' : statementFreq === 'QUARTERLY' ? '2026-Q4' : '2026-10');
  }

  const sortedPeriods = Array.from(allPeriodsSet).sort().reverse();

  const statementRows = sortedPeriods.map(period => {
    const periodInvoices = invoices.filter(inv => getPeriodKey(inv.billingDate, statementFreq) === period);
    const periodPos = purchaseOrders.filter(po => getPeriodKey(po.deliveryDate, statementFreq) === period);

    const taxableSales = periodInvoices.reduce((s, i) => s + i.taxableAmount, 0);
    const gstCollected = periodInvoices.reduce((s, i) => s + Math.round((i.taxableAmount * i.gstRate) / 100), 0);
    const totalBilledSales = taxableSales + gstCollected;
    const collectionsReceived = periodInvoices.reduce((s, i) => s + i.amountPaid, 0);
    const totalPurchases = periodPos.reduce((s, p) => s + p.totalAmount, 0);
    const serviceCount = periodInvoices.length;
    const netOperatingProfit = totalBilledSales - totalPurchases;
    const marginPercent = totalBilledSales > 0 ? Math.round((netOperatingProfit / totalBilledSales) * 100) : 0;

    return {
      period,
      serviceCount,
      taxableSales,
      gstCollected,
      totalBilledSales,
      collectionsReceived,
      totalPurchases,
      netOperatingProfit,
      marginPercent,
      invoicesCount: periodInvoices.length,
      poCount: periodPos.length,
    };
  });

  const grandTotalSalesTaxable = statementRows.reduce((s, r) => s + r.taxableSales, 0);
  const grandTotalGst = statementRows.reduce((s, r) => s + r.gstCollected, 0);
  const grandTotalBilledSales = statementRows.reduce((s, r) => s + r.totalBilledSales, 0);
  const grandTotalPurchases = statementRows.reduce((s, r) => s + r.totalPurchases, 0);
  const grandTotalNetProfit = grandTotalBilledSales - grandTotalPurchases;

  return (
    <div className="space-y-6">
      {/* Header with View Switcher */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-800">
            TheCaterings Tax Compliance &amp; Financial Statements
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            GST Invoicing &amp; Financial Statements (Purchase, Sales &amp; Services)
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-stone-300 bg-stone-100 p-0.5">
            <button
              type="button"
              onClick={() => setActiveViewTab('LEDGER')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeViewTab === 'LEDGER'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoice Ledger
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('STATEMENTS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeViewTab === 'STATEMENTS'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Financial Statements (M/Q/A)
            </button>
          </div>

          {activeViewTab === 'LEDGER' && (
            <>
              <button
                type="button"
                onClick={() => setPreventPdfOverwrite((prev) => !prev)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  preventPdfOverwrite
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-stone-100 text-slate-700 border-stone-300 hover:bg-stone-200'
                }`}
                title="Control file overwrite when generating PDF bills and ledgers"
              >
                {preventPdfOverwrite
                  ? 'PDF Overwrite Control: Protected'
                  : 'PDF Overwrite Control: Standard'}
              </button>
              <button
                type="button"
                onClick={handleDownloadFullLedgerPdf}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Generate PDF Ledger</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                aria-label="Generate GST Invoice"
                title="Generate New GST Invoice"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-700 hover:bg-amber-600 text-white transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {pdfFeedback && (
        <div className="bg-emerald-950 text-amber-200 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{pdfFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfFeedback(null)}
            className="text-stone-400 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
          FINANCIAL STATEMENTS VIEW (MONTHLY, QUARTERLY, ANNUALLY)
         ===================================================================== */}
      {activeViewTab === 'STATEMENTS' && (
        <div className="space-y-6">
          {/* Frequency Selector & Export Actions */}
          <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">
                Statement Frequency:
              </span>
              <div className="inline-flex rounded-lg border border-stone-300 bg-stone-100 p-0.5">
                {(['MONTHLY', 'QUARTERLY', 'ANNUALLY'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setStatementFreq(freq)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      statementFreq === freq
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {freq.charAt(0) + freq.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const csvContent = [
                    ['Period', 'Services Count', 'Taxable Sales (₹)', 'GST Output (₹)', 'Total Billed Sales (₹)', 'Collections (₹)', 'Purchase Expenses (₹)', 'Net Operating Profit (₹)', 'Margin %'].join(','),
                    ...statementRows.map(r => [
                      r.period,
                      r.serviceCount,
                      r.taxableSales,
                      r.gstCollected,
                      r.totalBilledSales,
                      r.collectionsReceived,
                      r.totalPurchases,
                      r.netOperatingProfit,
                      r.marginPercent + '%'
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `TheCaterings_Financial_Statement_${statementFreq}_${Date.now()}.csv`;
                  a.click();
                  setPdfFeedback(`Successfully exported ${statementFreq} Financial Statement as CSV.`);
                  setTimeout(() => setPdfFeedback(null), 4000);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-amber-400" />
                <span>Export {statementFreq} Statement CSV</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Sales Revenue (Billed)
              </span>
              <div className="text-xl font-bold font-mono text-emerald-800 mt-1 tabular-nums">
                {formatINR(grandTotalBilledSales)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Taxable: {formatINR(grandTotalSalesTaxable)} + GST: {formatINR(grandTotalGst)}
              </span>
            </div>

            <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Purchase Expenses
              </span>
              <div className="text-xl font-bold font-mono text-amber-800 mt-1 tabular-nums">
                {formatINR(grandTotalPurchases)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Vendor PO Procurement Cost
              </span>
            </div>

            <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Catering Services Billed
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {invoices.length} Events (SAC 996333)
              </div>
              <span className="text-[11px] text-emerald-700 mt-1 block font-semibold">
                Collections: {formatINR(totalCollected)}
              </span>
            </div>

            <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Net Operating Profit
              </span>
              <div className={`text-xl font-bold font-mono mt-1 tabular-nums ${grandTotalNetProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatINR(grandTotalNetProfit)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Sales Revenue minus Purchases
              </span>
            </div>
          </div>

          {/* Financial Statement Breakdown Table */}
          <div className="bg-white border border-stone-200/80 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {statementFreq.charAt(0) + statementFreq.slice(1).toLowerCase()} Financial Statement — Purchase, Sales &amp; Services
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Consolidated breakdown categorized by {statementFreq.toLowerCase()} period for tax compliance and margin auditing.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-100/70 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-3 text-center">Services / Events</th>
                    <th className="py-3 px-3 text-right">Taxable Sales (₹)</th>
                    <th className="py-3 px-3 text-right">GST Output (₹)</th>
                    <th className="py-3 px-3 text-right">Total Billed Sales (₹)</th>
                    <th className="py-3 px-3 text-right">Purchase Expenses (₹)</th>
                    <th className="py-3 px-3 text-right">Net Profit (₹)</th>
                    <th className="py-3 px-4 text-center">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 text-xs">
                  {statementRows.map((row) => (
                    <tr key={row.period} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {row.period}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {row.serviceCount} Events ({row.poCount} POs)
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800 tabular-nums">
                        {formatINR(row.taxableSales)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800 tabular-nums">
                        {formatINR(row.gstCollected)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 tabular-nums">
                        {formatINR(row.totalBilledSales)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-900 tabular-nums">
                        {formatINR(row.totalPurchases)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        <span className={row.netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {formatINR(row.netOperatingProfit)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${row.marginPercent >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {row.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          INVOICE LEDGER VIEW (DEFAULT)
         ===================================================================== */}
      {activeViewTab === 'LEDGER' && (
        <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Taxable Value
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {formatINR(totalTaxable)}
          </div>
        </div>
        <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total CGST + SGST
          </span>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1 tabular-nums">
            {formatINR(totalGst)}
          </div>
        </div>
        <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Advance Collected
          </span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {formatINR(totalCollected)}
          </div>
        </div>
        <div className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Outstanding Balance Due
          </span>
          <div className="text-xl font-bold font-mono text-red-700 mt-1 tabular-nums">
            {formatINR(totalBalanceDue)}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-stone-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Invoice No &amp; client_id</th>
                <th className="py-3.5 px-3">Client &amp; GSTIN</th>
                <th className="py-3.5 px-3">SAC</th>
                <th className="py-3.5 px-3 text-right">Taxable</th>
                <th className="py-3.5 px-3 text-right">CGST + SGST</th>
                <th className="py-3.5 px-3 text-right">Grand Total</th>
                <th className="py-3.5 px-3 text-right">Advance Paid</th>
                <th className="py-3.5 px-3 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 text-xs">
              {invoices.map((inv) => {
                const gstAmount = Math.round(
                  (inv.taxableAmount * inv.gstRate) / 100
                );
                const grandTotal = inv.taxableAmount + gstAmount;
                const balanceDue = Math.max(0, grandTotal - inv.amountPaid);
                return (
                  <tr
                    key={inv.id}
                    className="gst-invoice-row hover-highlight-row transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {inv.invoiceNo}
                      </span>
                      {inv.clientId && (
                        <span className="text-[11px] font-mono font-bold text-amber-800 block">
                          {inv.clientId}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-mono">
                        Billing: {inv.billingDate}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900">
                        {inv.clientName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        GSTIN: {inv.gstin}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {inv.sacCode} ({inv.gstRate}%)
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-800 tabular-nums">
                      {formatINR(inv.taxableAmount)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-amber-900 tabular-nums">
                      {formatINR(gstAmount)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatINR(grandTotal)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-800 tabular-nums">
                      {formatINR(inv.amountPaid)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums">
                      <span
                        className={
                          balanceDue === 0 ? 'text-emerald-700' : 'text-red-700'
                        }
                      >
                        {formatINR(balanceDue)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreviewInvId(inv.id);
                            setPreviewMode('BILL');
                            handleDownloadSinglePdf(inv);
                          }}
                          aria-label={`Download PDF Bill for ${inv.invoiceNo}`}
                          title="Download Boxed Tax Invoice PDF with Logo & Terms"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-stone-100 hover:bg-stone-200 text-slate-800 transition-colors cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openPaymentModal(inv)}
                          aria-label={`Collect payment for ${inv.invoiceNo}`}
                          title="Collect via Indian UPI / Razorpay / PayPal"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-amber-800" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInvoice(inv.id, inv.invoiceNo)}
                          aria-label={`Delete invoice ${inv.invoiceNo}`}
                          title="Delete Invoice"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          PROPER COLUMN & ROW BOX GST BILL & LEDGER FORMAT WITH COMPANY LOGO
          AND FOOTER TERMS & CONDITIONS
         ===================================================================== */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-800 block">
              Official Boxed GST Bill &amp; Ledger Format (With Company Logo &amp; Footer Terms)
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Proper Column &amp; Row Box Tax Invoice &amp; Ledger Sheet
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode('BILL')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                previewMode === 'BILL'
                  ? 'bg-emerald-950 text-white border-emerald-950'
                  : 'bg-stone-100 text-slate-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>GST Tax Bill Box Format</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewMode('LEDGER')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                previewMode === 'LEDGER'
                  ? 'bg-emerald-950 text-white border-emerald-950'
                  : 'bg-stone-100 text-slate-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>GST Ledger Box Format</span>
            </button>

            {previewMode === 'BILL' && invoices.length > 0 && (
              <select
                value={previewInvoice?.id || ''}
                onChange={(e) => setSelectedPreviewInvId(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono font-semibold border border-stone-300 rounded-lg bg-white text-slate-900"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNo} — {inv.clientName}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setEditingTerms(!editingTerms)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
            >
              <span>
                {editingTerms
                  ? 'Done Editing Terms'
                  : 'Edit Footer Terms & Conditions'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                previewMode === 'BILL' && previewInvoice
                  ? handleDownloadSinglePdf(previewInvoice)
                  : handleDownloadFullLedgerPdf()
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>
                {previewMode === 'BILL'
                  ? `Download ${previewInvoice?.invoiceNo || 'Bill'} PDF`
                  : 'Download Full Ledger PDF'}
              </span>
            </button>
          </div>
        </div>

        {/* Optional Editable Terms & Conditions Box */}
        {editingTerms && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">
                Customize PDF Bill &amp; Ledger Footer Terms &amp; Conditions (One clause per line)
              </span>
              <button
                type="button"
                onClick={() => setTermsList(DEFAULT_GST_TERMS_AND_CONDITIONS)}
                className="text-[11px] font-semibold text-amber-800 hover:underline cursor-pointer"
              >
                Reset Default Terms
              </button>
            </div>
            <textarea
              rows={5}
              value={termsList.join('\n')}
              onChange={(e) =>
                setTermsList(
                  e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              className="w-full p-3 text-xs font-mono border border-amber-300 rounded-lg bg-white text-slate-800"
            />
          </div>
        )}

        {/* ===================================================================
            BOXED SHEET 1: SINGLE GST TAX INVOICE BILL FORMAT
           =================================================================== */}
        {previewMode === 'BILL' && previewInvoice && (() => {
          const gstAmt = Math.round(
            (previewInvoice.taxableAmount * previewInvoice.gstRate) / 100
          );
          const halfRate = (previewInvoice.gstRate / 2).toFixed(1);
          const halfGst = Math.round(gstAmt / 2);
          const grandTot = previewInvoice.taxableAmount + gstAmt;
          const balDue = Math.max(0, grandTot - previewInvoice.amountPaid);

          return (
            <div className="border-2 border-slate-900 bg-white text-slate-900 rounded-none shadow-sm overflow-hidden text-xs">
              {/* 1. Top Boxed Header with Company Logo */}
              <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900 bg-white">
                <div className="md:col-span-8 p-4 flex flex-col items-center text-center border-b md:border-b-0 md:border-r-2 border-slate-900">
                  {/* Company Logo Emblem on Top */}
                  <TheCateringsLogo
                    className="h-14 w-auto mb-2 shrink-0"
                    imgClassName="h-14 w-auto object-contain"
                  />

                  <div className="space-y-0.5 w-full">
                    <div className="text-lg font-extrabold tracking-tight text-emerald-950 font-display">
                      THECATERINGS
                    </div>
                    <div className="text-xs font-bold text-amber-800">
                      Royal Banquet, Outdoor Catering &amp; Luxury Hospitality Operations
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Regd. Commissary: MG Road, Sultanpur, New Delhi - 110030 | Tel: +91 98111 44200
                    </div>
                    <div className="text-[11px] font-mono font-bold text-slate-900">
                      GSTIN: 07AABCT2026B1Z8 &nbsp;|&nbsp; PAN: AABCT2026B &nbsp;|&nbsp; FSSAI: 10026011004829
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 p-4 flex flex-col items-center justify-center text-center bg-stone-50">
                  <div className="px-4 py-1.5 bg-emerald-950 text-white border border-amber-600 font-bold text-xs tracking-wider uppercase">
                    GST TAX INVOICE
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-1.5">
                    Original For Recipient
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-900 mt-0.5">
                    SAC CODE: {previewInvoice.sacCode} ({previewInvoice.gstRate}% GST)
                  </span>
                </div>
              </div>

              {/* 2. Two-Column Boxed Billed To & Invoice Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-slate-900">
                <div
                  className="border-b md:border-b-0 md:border-r-2 border-slate-900"
                  style={{ backgroundColor: '#0f2942', color: '#ffffff' }}
                >
                  <div
                    className="px-3 py-2 font-bold text-[11px] uppercase tracking-wider border-b-2"
                    style={{
                      backgroundColor: '#091e3a',
                      color: '#ffd700',
                      borderColor: '#ffd700',
                    }}
                  >
                    Billed To (Client / Host Details)
                  </div>
                  <div className="divide-y divide-[#38bdf8]/35">
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span
                        className="font-bold"
                        style={{ color: '#ffd700' }}
                      >
                        Client / Host Name:
                      </span>
                      <span
                        className="col-span-2 font-bold"
                        style={{ color: '#ffffff' }}
                      >
                        {previewInvoice.clientName}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span
                        className="font-bold"
                        style={{ color: '#ffd700' }}
                      >
                        Customer GSTIN:
                      </span>
                      <span
                        className="col-span-2 font-mono font-bold"
                        style={{ color: '#ffff00' }}
                      >
                        {previewInvoice.gstin}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span
                        className="font-bold"
                        style={{ color: '#ffd700' }}
                      >
                        Event / Function:
                      </span>
                      <span
                        className="col-span-2 font-bold"
                        style={{ color: '#ffffff' }}
                      >
                        {previewInvoice.eventName}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span
                        className="font-bold"
                        style={{ color: '#ffd700' }}
                      >
                        Place of Supply:
                      </span>
                      <span
                        className="col-span-2 font-bold"
                        style={{ color: '#ffffff' }}
                      >
                        07 - Delhi (Intra-State CGST + SGST)
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#0f2942', color: '#ffffff' }}>
                  <div
                    className="px-3 py-2 font-bold text-[11px] uppercase tracking-wider border-b-2"
                    style={{
                      backgroundColor: '#091e3a',
                      color: '#ffd700',
                      borderColor: '#ffd700',
                    }}
                  >
                    Invoice &amp; Settlement Metadata
                  </div>
                  <div className="divide-y divide-[#38bdf8]/35">
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span
                        className="font-bold"
                        style={{ color: '#ffd700' }}
                      >
                        Invoice No:
                      </span>
                      <span
                        className="col-span-2 font-mono font-bold"
                        style={{ color: '#ffff00' }}
                      >
                        {previewInvoice.invoiceNo}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span
                        className="font-bold"
                        style={{ color: '#ffd700' }}
                      >
                        Billing Date:
                      </span>
                      <span
                        className="col-span-2 font-mono font-bold"
                        style={{ color: '#ffffff' }}
                      >
                        {previewInvoice.billingDate}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span
                        className="font-bold"
                        style={{ color: '#ffd700' }}
                      >
                        Payment Status:
                      </span>
                      <span
                        className="col-span-2 font-bold"
                        style={{ color: '#4ade80' }}
                      >
                        {previewInvoice.paymentStatus}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2">
                      <span
                        className="font-bold"
                        style={{ color: '#ffd700' }}
                      >
                        Payment Mode:
                      </span>
                      <span
                        className="col-span-2 font-bold"
                        style={{ color: '#ffffff' }}
                      >
                        {previewInvoice.paymentMethod ||
                          'Indian UPI / Razorpay / PayPal'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Proper Column & Row Boxed Item Table */}
              <div className="overflow-x-auto border-b-2 border-slate-900">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-emerald-950 text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-2.5 border-r border-slate-600 text-center w-12">
                        S.No
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-600 text-left">
                        Particulars / Description of Catering Services
                      </th>
                      <th className="py-2.5 px-2.5 border-r border-slate-600 text-center w-20">
                        SAC Code
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-600 text-right w-28">
                        Taxable (₹)
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-600 text-right w-28">
                        CGST ({halfRate}%)
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-600 text-right w-28">
                        SGST ({halfRate}%)
                      </th>
                      <th className="py-2.5 px-3 text-right w-32">
                        Total (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    <tr>
                      <td className="py-3 px-2.5 border-r border-slate-900 text-center font-mono font-bold">
                        01
                      </td>
                      <td className="py-3 px-3 border-r border-slate-900">
                        <div className="font-bold text-slate-900">
                          {previewInvoice.eventName} — Royal Banquet &amp; Outdoor Catering
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Full-Course Live Counters, Maharaj Culinary Brigade, Bone-China Crockery &amp; Uniformed Stewards
                        </div>
                      </td>
                      <td className="py-3 px-2.5 border-r border-slate-900 text-center font-mono">
                        {previewInvoice.sacCode}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-900 text-right font-mono tabular-nums">
                        {formatINR(previewInvoice.taxableAmount)}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-900 text-right font-mono tabular-nums">
                        {formatINR(halfGst)}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-900 text-right font-mono tabular-nums">
                        {formatINR(halfGst)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        {formatINR(grandTot)}
                      </td>
                    </tr>
                    <tr className="bg-stone-50/60">
                      <td className="py-2.5 px-2.5 border-r border-slate-900 text-center font-mono">
                        02
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-900">
                        <div className="font-semibold text-slate-800">
                          Dedicated Pure Jain / Satvik Counter &amp; Welcome Mocktail Bar
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 border-r border-slate-900 text-center font-mono">
                        {previewInvoice.sacCode}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono font-semibold text-emerald-800">
                        INCLUDED
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono">
                        ₹0
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono">
                        ₹0
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-800">
                        INCLUDED
                      </td>
                    </tr>
                    <tr className="bg-amber-50/80 font-bold">
                      <td
                        colSpan={3}
                        className="py-2.5 px-3 border-r border-slate-900 text-right uppercase tracking-wider"
                      >
                        Total Invoice Value (Incl. CGST + SGST)
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono tabular-nums">
                        {formatINR(previewInvoice.taxableAmount)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono tabular-nums">
                        {formatINR(halfGst)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono tabular-nums">
                        {formatINR(halfGst)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-950 tabular-nums">
                        {formatINR(grandTot)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. Amount in Words + Bank/Gateways (Left) & Boxed Financial Breakdown (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900">
                <div className="md:col-span-7 border-b md:border-b-0 md:border-r-2 border-slate-900 flex flex-col justify-between">
                  <div className="p-3 bg-stone-50 border-b border-slate-900">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Total Invoice Amount in Words (INR):
                    </span>
                    <span className="font-bold text-slate-900">
                      Rupees {numberToIndianWords(grandTot)} Only
                    </span>
                  </div>
                  <div className="p-3 space-y-1 text-[11px]">
                    <div className="font-bold text-emerald-950 uppercase tracking-wider">
                      Company Bank, Indian UPI &amp; PayPal Settlement Box:
                    </div>
                    <div>
                      <span className="font-semibold">Bank Name:</span> HDFC Bank Ltd., Connaught Place, New Delhi
                    </div>
                    <div>
                      <span className="font-semibold">A/C Name:</span> TheCaterings Hospitality Pvt. Ltd. |{' '}
                      <span className="font-mono font-bold">
                        A/C: 50200084921044 | IFSC: HDFC0000003
                      </span>
                    </div>

                  </div>
                </div>

                <div
                  className="md:col-span-5 divide-y divide-[#38bdf8]/40"
                  style={{ backgroundColor: '#0f2942', color: '#ffffff' }}
                >
                  <div className="flex justify-between px-3 py-2">
                    <span className="font-bold" style={{ color: '#ffffff' }}>
                      1. Taxable Catering Value
                    </span>
                    <span
                      className="font-mono font-bold tabular-nums"
                      style={{ color: '#ffffff' }}
                    >
                      {formatINR(previewInvoice.taxableAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="font-bold" style={{ color: '#ffffff' }}>
                      2. Add: CGST @ {halfRate}%
                    </span>
                    <span
                      className="font-mono font-bold tabular-nums"
                      style={{ color: '#ffffff' }}
                    >
                      {formatINR(halfGst)}
                    </span>
                  </div>
                  <div className="flex justify-between px-3 py-2">
                    <span className="font-bold" style={{ color: '#ffffff' }}>
                      3. Add: SGST @ {halfRate}%
                    </span>
                    <span
                      className="font-mono font-bold tabular-nums"
                      style={{ color: '#ffffff' }}
                    >
                      {formatINR(halfGst)}
                    </span>
                  </div>
                  <div
                    className="flex justify-between px-3 py-2.5 font-extrabold"
                    style={{
                      backgroundColor: '#091e3a',
                      color: '#ffd700',
                      borderTop: '2px solid #ffd700',
                      borderBottom: '2px solid #ffd700',
                    }}
                  >
                    <span style={{ color: '#ffd700' }}>
                      4. GRAND TOTAL (INCL. GST)
                    </span>
                    <span
                      className="font-mono tabular-nums"
                      style={{ color: '#ffff00' }}
                    >
                      {formatINR(grandTot)}
                    </span>
                  </div>
                  <div
                    className="flex justify-between px-3 py-2.5 font-extrabold"
                    style={{
                      backgroundColor: '#064e3b',
                      color: '#ffff00',
                      borderBottom: '1.5px solid #34d399',
                    }}
                  >
                    <span style={{ color: '#ffffff' }}>
                      5. Less: Advance / Amount Paid
                    </span>
                    <span
                      className="font-mono tabular-nums"
                      style={{ color: '#ffff00' }}
                    >
                      {formatINR(previewInvoice.amountPaid)}
                    </span>
                  </div>
                  <div
                    className="flex justify-between px-3 py-2.5 font-extrabold"
                    style={{
                      backgroundColor: '#7a003c',
                      color: '#ffff00',
                    }}
                  >
                    <span style={{ color: '#ffffff' }}>
                      6. NET BALANCE DUE (INR)
                    </span>
                    <span
                      className="font-mono tabular-nums"
                      style={{ color: '#ffff00' }}
                    >
                      {formatINR(balDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Boxed Footer: Terms & Conditions (Left) + Authorized Signatory (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-8 border-b md:border-b-0 md:border-r-2 border-slate-900">
                  <div className="bg-amber-50 px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider border-b border-slate-900">
                    Terms &amp; Conditions (Catering &amp; Banquet Contract)
                  </div>
                  <div className="p-3 space-y-1 text-[11px] text-slate-700">
                    {termsList.map((line, idx) => (
                      <div key={idx} className="leading-snug">
                        {line}
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-slate-300 font-semibold text-slate-800">
                      Customer / Host Acceptance Signature: ___________________________ &nbsp; Date: ____________
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col justify-between">
                  <div className="bg-amber-50 px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider border-b border-slate-900 text-center text-emerald-950">
                    For THECATERINGS
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="border-2 border-emerald-900 bg-emerald-50/40 px-4 py-2 mb-3">
                      <div className="font-bold text-emerald-950 text-xs">
                        THECATERINGS
                      </div>
                      <div className="font-mono text-[10px] text-amber-900 font-semibold">
                        GST VERIFIED SEAL
                      </div>
                      <div className="font-mono text-[9px] text-slate-600">
                        07AABCT2026B1Z8
                      </div>
                    </div>
                    <div className="w-40 border-t border-slate-900 pt-1 font-bold text-slate-900">
                      Authorized Signatory
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Accounts &amp; GST Compliance Desk
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ===================================================================
            BOXED SHEET 2: CONSOLIDATED GST LEDGER BOX FORMAT
           =================================================================== */}
        {previewMode === 'LEDGER' && (
          <div className="border-2 border-slate-900 bg-white text-slate-900 rounded-none shadow-sm overflow-hidden text-xs">
            {/* 1. Top Boxed Header with Company Logo */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-900 bg-white">
              <div className="md:col-span-8 p-4 flex flex-col items-center text-center border-b md:border-b-0 md:border-r-2 border-slate-900">
                <TheCateringsLogo
                  className="h-14 w-auto mb-2 shrink-0"
                  imgClassName="h-14 w-auto object-contain"
                />
                <div className="space-y-0.5 w-full">
                  <div className="text-lg font-extrabold tracking-tight text-emerald-950 font-display">
                    THECATERINGS — GST INVOICING &amp; CLIENT LEDGER
                  </div>
                  <div className="text-xs font-bold text-amber-800">
                    Royal Banquet, Outdoor Catering &amp; Luxury Hospitality Operations
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Regd. Commissary: MG Road, Sultanpur, New Delhi - 110030 | Tel: +91 98111 44200
                  </div>
                  <div className="text-[11px] font-mono font-bold text-slate-900">
                    GSTIN: 07AABCT2026B1Z8 &nbsp;|&nbsp; PAN: AABCT2026B &nbsp;|&nbsp; FSSAI: 10026011004829
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 p-4 flex flex-col items-center justify-center text-center bg-stone-50">
                <div className="px-4 py-1.5 bg-emerald-950 text-white border border-amber-600 font-bold text-xs tracking-wider uppercase">
                  GST LEDGER STATEMENT
                </div>
                <span className="text-[11px] font-mono text-slate-600 mt-1.5">
                  Total Recorded Bills: {invoices.length}
                </span>
              </div>
            </div>

            {/* 2. Boxed Column & Row Ledger Table */}
            <div className="overflow-x-auto border-b-2 border-slate-900">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-950 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-2 border-r border-slate-600 text-center w-10">
                      #
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-600 text-left">
                      Invoice No &amp; Date
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-600 text-left">
                      Client Name &amp; GSTIN
                    </th>
                    <th className="py-2.5 px-2 border-r border-slate-600 text-center">
                      SAC / Rate
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-600 text-right">
                      Taxable (₹)
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-600 text-right">
                      CGST+SGST (₹)
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-600 text-right">
                      Grand Total (₹)
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-600 text-right">
                      Advance Paid (₹)
                    </th>
                    <th className="py-2.5 px-3 text-right">
                      Balance Due (₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {invoices.map((inv, idx) => {
                    const gst = Math.round(
                      (inv.taxableAmount * inv.gstRate) / 100
                    );
                    const grand = inv.taxableAmount + gst;
                    const bal = Math.max(0, grand - inv.amountPaid);
                    return (
                      <tr
                        key={inv.id}
                        className={`gst-invoice-row hover-highlight-row transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/70'
                        }`}
                      >
                        <td className="py-2.5 px-2 border-r border-slate-900 text-center font-mono font-bold">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-900">
                          <div className="font-mono font-bold text-slate-900">
                            {inv.invoiceNo}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {inv.billingDate}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-900">
                          <div className="font-bold text-slate-900">
                            {inv.clientName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            GSTIN: {inv.gstin}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 border-r border-slate-900 text-center font-mono">
                          {inv.sacCode} ({inv.gstRate}%)
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono tabular-nums">
                          {formatINR(inv.taxableAmount)}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono tabular-nums">
                          {formatINR(gst)}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono font-bold tabular-nums">
                          {formatINR(grand)}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono font-semibold text-emerald-800 tabular-nums">
                          {formatINR(inv.amountPaid)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-red-800 tabular-nums">
                          {formatINR(bal)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-amber-50 font-extrabold">
                    <td
                      colSpan={4}
                      className="py-2.5 px-3 border-r border-slate-900 text-right uppercase tracking-wider"
                    >
                      Consolidated Ledger Total (INR)
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono tabular-nums">
                      {formatINR(totalTaxable)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono tabular-nums">
                      {formatINR(totalGst)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono text-emerald-950 tabular-nums">
                      {formatINR(totalBilled)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-900 text-right font-mono text-emerald-800 tabular-nums">
                      {formatINR(totalCollected)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-red-800 tabular-nums">
                      {formatINR(totalBalanceDue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Boxed Footer: Terms & Conditions + Authorized Signatory */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-8 border-b md:border-b-0 md:border-r-2 border-slate-900">
                <div className="bg-amber-50 px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider border-b border-slate-900">
                  Terms &amp; Conditions &amp; GST Ledger Reconciliation Notes
                </div>
                <div className="p-3 space-y-1 text-[11px] text-slate-700">
                  {termsList.map((line, idx) => (
                    <div key={idx} className="leading-snug">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-4 flex flex-col justify-between">
                <div className="bg-amber-50 px-3 py-1.5 font-bold text-[11px] uppercase tracking-wider border-b border-slate-900 text-center text-emerald-950">
                  For THECATERINGS
                </div>
                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="border-2 border-emerald-900 bg-emerald-50/40 px-4 py-2 mb-3">
                    <div className="font-bold text-emerald-950 text-xs">
                      THECATERINGS
                    </div>
                    <div className="font-mono text-[10px] text-amber-900 font-semibold">
                      AUDIT &amp; GST LEDGER SEAL
                    </div>
                  </div>
                  <div className="w-44 border-t border-slate-900 pt-1 font-bold text-slate-900">
                    Authorized Signatory (GST Desk)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )}

      {/* Indian UPI / Razorpay / PayPal Checkout Modal */}
      {activePayInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 block">
                  TheCaterings Payment Checkout
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Collect Payment for {activePayInvoice.invoiceNo} (
                  {activePayInvoice.clientName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePayInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleProcessGatewayPayment}
              className="space-y-4 mt-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Payment Gateway Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('UPI')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer flex items-start gap-1.5 ${
                      selectedGateway === 'UPI'
                        ? 'bg-emerald-950 text-white border-emerald-950'
                        : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div>Indian UPI</div>
                      <div className="text-[10px] opacity-75 font-normal">
                        GPay / PhonePe / BHIM
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('RAZORPAY')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer flex items-start gap-1.5 ${
                      selectedGateway === 'RAZORPAY'
                        ? 'bg-emerald-950 text-white border-emerald-950'
                        : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div>Razorpay India</div>
                      <div className="text-[10px] opacity-75 font-normal">
                        Cards / NetBanking / NEFT
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('PAYPAL')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer flex items-start gap-1.5 ${
                      selectedGateway === 'PAYPAL'
                        ? 'bg-emerald-950 text-white border-emerald-950'
                        : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div>PayPal Global</div>
                      <div className="text-[10px] opacity-75 font-normal">
                        USD / EUR / NRI Cards
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount to Collect &amp; Credit (INR ₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmountInr}
                  onChange={(e) => setPayAmountInr(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-stone-300 rounded-lg"
                />
                {selectedGateway === 'PAYPAL' && (
                  <p className="text-[11px] font-mono text-blue-800 mt-1">
                    PayPal International Equivalent: approx. $
                    {(payAmountInr / 84).toFixed(2)} USD (1 USD = ₹84.00)
                  </p>
                )}
              </div>

              {selectedGateway === 'UPI' && (
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Merchant UPI VPA:
                    </span>
                    <span className="font-mono font-bold text-emerald-800">
                      payments@thecaterings.upi
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Client Payer UPI ID (BHIM / GPay / PhonePe / Paytm)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. singhania@okhdfcbank"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-stone-300 rounded-md bg-white"
                    />
                  </div>
                </div>
              )}

              {selectedGateway === 'RAZORPAY' && (
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 text-xs text-slate-700 space-y-1">
                  <div className="font-semibold text-slate-900">
                    Razorpay / PayU India Domestic Checkout
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Supports RuPay Platinum, Visa/Mastercard Corporate Cards,
                    HDFC/ICICI/SBI NetBanking, and instant IMPS/NEFT Virtual
                    Account reconciliation.
                  </p>
                </div>
              )}

              {selectedGateway === 'PAYPAL' && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-950 space-y-1">
                  <div className="font-semibold">
                    PayPal International &amp; NRI Banquet Escrow
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Processes international USD, GBP, EUR, and CAD payments via{' '}
                    <span className="font-mono font-semibold">
                      paypal.me/TheCaterings
                    </span>{' '}
                    with FIRC certificate support for NRI wedding hosts.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setActivePayInvoice(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-600 text-white cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Record {formatINR(payAmountInr)} via {selectedGateway}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate New GST Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-200 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-slate-900">
                Generate New GST Tax Invoice
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Date
                  </label>
                  <input
                    type="date"
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client / Corporate Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Oberoi Corporate Gala"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client GSTIN
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SAC &amp; GST Slab
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => {
                      const rate = Number(e.target.value) as 5 | 18;
                      setGstRate(rate);
                      setSacCode(rate === 5 ? '996333' : '996332');
                    }}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    <option value={5}>5% GST (SAC 996333 Outdoor)</option>
                    <option value={18}>18% GST (SAC 996332 Luxury Venue)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Taxable Value (₹)
                  </label>
                  <input
                    type="number"
                    value={taxableAmount}
                    onChange={(e) => setTaxableAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Advance Received (₹)
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-600 text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue Tax Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MODULE LIVE CLIENT E-MENU VIEW (4 DISHES PER ROW, 40 PER PAGE)
// ============================================================================
interface Module11Props {
  dishes: DishItem[];
  tastingNotes: ClientTastingNote[];
  onBulkAddDishes?: (newDishes: Omit<DishItem, 'id'>[]) => void;
  onReplaceByDishCode?: (newDishes: Omit<DishItem, 'id'>[]) => void;
  onReplaceAllDishes?: (newDishes: Omit<DishItem, 'id'>[]) => void;
  onDeleteAllDishes?: () => void;
  onBulkDeleteDishes?: (dishIds: string[]) => void;
  onDeleteDish: (id: string, name: string) => void;
  onToggleDishInMenu: (id: string) => void;
  onOpenImageModal: (dish: DishItem) => void;
  onDeleteDishImage: (dishId: string, dishName: string) => void;
  onUpdateDishPrice?: (dishId: string, newPrice: number) => void;
  isAdmin?: boolean;
  onAddTastingNote: (note: Omit<ClientTastingNote, 'id'>) => void;
  onDeleteTastingNote: (id: string, clientName: string) => void;
}

export const Module11ClientEMenu: React.FC<Module11Props> = ({
  dishes,
  tastingNotes,
  isAdmin = false,
  onBulkAddDishes,
  onReplaceByDishCode,
  onReplaceAllDishes,
  onDeleteAllDishes,
  onBulkDeleteDishes,
  onDeleteDish,
  onToggleDishInMenu,
  onOpenImageModal,
  onDeleteDishImage,
  onUpdateDishPrice,
  onAddTastingNote,
  onDeleteTastingNote,
}) => {
  const [spicePreference, setSpicePreference] = useState<
    'Mild Royal' | 'Medium Traditional' | 'Chatpata Marwari'
  >('Medium Traditional');
  const [jainCounterIncluded, setJainCounterIncluded] = useState(true);
  const [clientNameInput] = useState('Singhania Royal Wedding Host');
  const [feedbackText, setFeedbackText] = useState(
    'Ensure pure cow ghee on Dal Makhani and crispier edges on Jalebi counter.'
  );
  const [isApprovedByClient, setIsApprovedByClient] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [, setExcelModalInitialTab] = useState<'upload' | 'download' | 'bulk-delete'>('upload');

  // 4 per row x 10 rows = 40 dishes per page
  const DISHES_PER_PAGE = 40;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(dishes.length / DISHES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDishes = dishes.slice(
    (safePage - 1) * DISHES_PER_PAGE,
    safePage * DISHES_PER_PAGE
  );

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    onAddTastingNote({
      clientName: clientNameInput.trim() || 'Banquet Host',
      courseName: 'Full Tasting Menu',
      feedbackText: feedbackText.trim(),
      spicePreference,
      approved: true,
    });
    setFeedbackText('');
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-800">
            Interactive Digital Tasting Brochure (TheCaterings)
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Live Client E-Menu Preview (4 per Row • 40 Dishes per Page)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setExcelModalInitialTab('upload');
              setShowExcelModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
            title="Upload products by Excel Sheet (.xlsx / .csv)"
          >
            <Upload className="w-3.5 h-3.5 text-[#ffd700]" />
            <span>Upload Excel</span>
          </button>

          <button
            type="button"
            onClick={() => downloadDishesToExcel(dishes)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-800 hover:bg-blue-900 text-white shadow-xs transition-colors cursor-pointer"
            title="Download all products as Excel (.xlsx) spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-[#ffd700]" />
            <span>Download Excel ({dishes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExcelModalInitialTab('bulk-delete');
              setShowExcelModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition-colors cursor-pointer"
            title="Bulk Product Delete or Clear Catalog"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
            <span>Bulk Delete</span>
          </button>

          <button
            type="button"
            onClick={() => setIsApprovedByClient(!isApprovedByClient)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isApprovedByClient
                ? 'bg-emerald-700 text-white'
                : 'bg-amber-700 hover:bg-amber-600 text-white'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {isApprovedByClient
                ? 'Client Signed Off E-Menu'
                : 'Simulate Client E-Sign Off'}
            </span>
          </button>
        </div>
      </div>

      {/* Royal E-Menu Brochure Card */}
      <div className="bg-white border-2 border-amber-800/20 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-stone-200 pb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-amber-800 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TheCaterings Bespoke Banquet Showcase</span>
            </div>
            <h3
              className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Royal Wedding Grand Reception Menu
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              4 Dish Images per Row • 40 Dish Images per Page • Icon Controls for Product &amp; Image Add/Delete
            </p>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-xl p-3.5 text-right">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block">
              Curated Dishes in Catalog
            </span>
            <span className="text-xl font-bold font-mono text-amber-800 tabular-nums">
              {dishes.filter((d) => d.includedInMenu).length} / {dishes.length}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Showing {paginatedDishes.length} of {dishes.length} (4x10 Grid)
            </span>
          </div>
        </div>

        {/* Client Dietary & Spice Customization Bar */}
        <form
          onSubmit={handleSaveNote}
          className="bg-white border border-stone-200/80 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Guest Spice Profile
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  'Mild Royal',
                  'Medium Traditional',
                  'Chatpata Marwari',
                ] as const
              ).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSpicePreference(level)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    spicePreference === level
                      ? 'bg-emerald-950 text-white'
                      : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                  }`}
                >
                  <span>{level}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Dedicated Pure Jain Counter
            </label>
            <button
              type="button"
              onClick={() => setJainCounterIncluded(!jainCounterIncluded)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                jainCounterIncluded
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-stone-100 text-slate-600'
              }`}
            >
              <span>
                {jainCounterIncluded
                  ? 'Separate No-Onion No-Garlic Counter Active'
                  : 'Standard Shared Counter'}
              </span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Host Family Tasting Instructions
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-stone-50/50"
              />
              <button
                type="submit"
                aria-label="Save Tasting Note"
                title="Save Tasting Note"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-800 text-white cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Client-Tagged Tasting Notes List */}
        {tastingNotes.length > 0 && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Saved Host Tasting Instructions (Isolated by client_id)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tastingNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white border border-stone-200 rounded-lg p-3 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                      {note.clientId && (
                        <span className="font-bold text-amber-800">
                          {note.clientId}
                        </span>
                      )}
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-800">
                        {note.clientName}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-emerald-800 font-semibold">
                        {note.spicePreference}
                      </span>
                    </div>
                    <p className="text-slate-700">{note.feedbackText}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteTastingNote(note.id, note.clientName)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer shrink-0"
                    title="Delete Tasting Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 Dish Images Per Row, 40 Per Page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {paginatedDishes.map((dish, idx) => (
            <div
              key={dish.id}
              className="dish-card bg-white border border-stone-200/90 rounded-xl p-3.5 shadow-xs flex flex-col justify-between"
              style={{ backgroundColor: '#87ceeb' }}
            >
              <div>
                <div
                  className="flex items-center justify-between text-[10px] font-mono font-bold mb-1.5"
                  style={{ color: '#0f2942' }}
                >
                  <span style={{ color: '#0f2942' }}>
                    #{(safePage - 1) * DISHES_PER_PAGE + idx + 1} • {dish.code}
                  </span>
                  <span
                    className="font-bold"
                    style={{ color: '#7a003c' }}
                  >
                    {dish.category}
                  </span>
                </div>
                <DishThumbnail
                  dish={dish}
                  size="lg"
                  onOpenImageModal={onOpenImageModal}
                  onDeleteImage={onDeleteDishImage}
                  onDeleteDish={onDeleteDish}
                  readOnly={!isAdmin}
                  canEditImage={isAdmin}
                  onToggleSelect={onToggleDishInMenu}
                />
                <div className="mt-3">
                  <ProductDetailInteractive
                    dish={dish}
                    onUpdatePrice={isAdmin ? onUpdateDishPrice : undefined}
                    isAdmin={isAdmin}
                    onToggleSelect={onToggleDishInMenu}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#0f2942]/25 flex items-center justify-between gap-2">
                <EditableDishPrice
                  dishId={dish.id}
                  dishName={dish.name}
                  price={dish.sellingPricePerPlate}
                  onUpdatePrice={isAdmin ? onUpdateDishPrice : undefined}
                  className="text-xs font-mono font-bold"
                />
                <div className="flex items-center gap-1"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Bar */}
        <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-slate-600">
            Page {safePage} of {totalPages} (40 dish images per page)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-white disabled:opacity-40 cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      {showExcelModal && (
        <ExcelProductModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
          dishes={dishes}
          onBulkAddDishes={onBulkAddDishes || (() => {})}
          onReplaceByDishCode={onReplaceByDishCode || onReplaceAllDishes || onBulkAddDishes || (() => {})}
          onReplaceAllDishes={onReplaceAllDishes || onBulkAddDishes || (() => {})}
          onDeleteAllDishes={onDeleteAllDishes || (() => {})}
          onBulkDeleteDishes={onBulkDeleteDishes || (() => {})}
          activeRoleLabel="Client E-Menu Access"
        />
      )}
    </div>
  );
};

// ============================================================================
// MODULE 2FA & DB SECURITY TAB
// MULTI-TENANT CLIENT ID (client_id / tenant_id) + MOBILE + OTP REGISTRY & MASTER OTP
// ============================================================================
interface Module12Props {
  masterOtp: string;
  onUpdateMasterOtp: (newOtp: string) => void;
  clientTenants?: ClientTenant[];
  adminOtpDispatchLogs?: AdminOtpDispatchRecord[];
  onAddClientTenant?: (
    tenant: ClientTenant,
    otpDispatch?: AdminOtpDispatchRecord
  ) => void;
  onUpdateClientTenantOtp?: (clientId: string, newOtp: string) => void;
  onDeleteClientTenant?: (clientId: string) => void;
  onDeleteOtpDispatchLog?: (logId: string, clientId: string) => void;
  onLoginAsClientTenant?: (tenant: ClientTenant) => void;
}

export const Module12SecurityOtp: React.FC<Module12Props> = ({
  masterOtp,
  onUpdateMasterOtp,
  clientTenants = INITIAL_CLIENT_TENANTS,
  adminOtpDispatchLogs = INITIAL_ADMIN_OTP_DISPATCH_LOGS,
  onAddClientTenant,
  onUpdateClientTenantOtp,
  onDeleteClientTenant,
  onDeleteOtpDispatchLog,
  onLoginAsClientTenant,
}) => {
  const [currentOtpInput, setCurrentOtpInput] = useState('');
  const [newOtpInput, setNewOtpInput] = useState('');
  const [confirmOtpInput, setConfirmOtpInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // New Client Tenant registration fields
  const [newClientId, setNewClientId] = useState('');
  const [newTenantId, setNewTenantId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newClientOtp, setNewClientOtp] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newGuestPax, setNewGuestPax] = useState(400);
  const [tenantStatusMsg, setTenantStatusMsg] = useState<string | null>(null);

  const handleUpdateOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentOtpInput !== masterOtp) {
      setStatusMessage({
        type: 'error',
        text: 'Current 6-Digit Developer Master OTP Code does not match.',
      });
      return;
    }
    if (!/^\d{6}$/.test(newOtpInput)) {
      setStatusMessage({
        type: 'error',
        text: 'New Developer Master OTP Code must be an exact 6-digit numeric code.',
      });
      return;
    }
    if (newOtpInput !== confirmOtpInput) {
      setStatusMessage({
        type: 'error',
        text: 'New 6-Digit OTP and Confirm 6-Digit OTP do not match.',
      });
      return;
    }
    onUpdateMasterOtp(newOtpInput);
    setCurrentOtpInput('');
    setNewOtpInput('');
    setConfirmOtpInput('');
    setStatusMessage({
      type: 'success',
      text: 'Private 6-Digit Developer Master OTP Code updated and persisted.',
    });
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddClientTenant) return;
    const cleanId = newClientId.trim().toUpperCase();
    const cleanTenant = newTenantId.trim().toUpperCase();
    const cleanOtp = /^\d{6}$/.test(newClientOtp.trim())
      ? newClientOtp.trim()
      : String(Math.floor(100000 + Math.random() * 900000));
    if (!newClientName.trim() || !newMobile.trim()) return;

    const uniqueError = validateUniqueClientTenantRegistration(
      cleanId,
      cleanTenant,
      newMobile,
      clientTenants
    );
    if (uniqueError) {
      setTenantStatusMsg(uniqueError);
      return;
    }

    const nowStr = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const createdTenant: ClientTenant = {
      clientId: cleanId,
      tenantId: cleanTenant,
      clientName: newClientName.trim(),
      mobileNumber: newMobile.trim(),
      otpCode: cleanOtp,
      eventTitle: newEventTitle.trim() || 'Royal Wedding Banquet',
      eventDate: '2026-12-15',
      venue: 'Grand Imperial Lawns, New Delhi',
      guestPax: Number(newGuestPax) || 400,
      dietaryPreference: 'Pure Veg · Custom Tenant Menu',
      gstin: '07AABCT0000A1Z5',
      selectedDishIds: ['dish-1', 'dish-2', 'dish-3', 'dish-4'],
    };

    const dispatchLog: AdminOtpDispatchRecord = {
      id: `otp-disp-${Date.now()}`,
      clientId: cleanId,
      tenantId: cleanTenant,
      clientName: createdTenant.clientName,
      mobileNumber: createdTenant.mobileNumber,
      otpCode: cleanOtp,
      eventTitle: createdTenant.eventTitle,
      guestPax: createdTenant.guestPax,
      dispatchedAt: `Today · ${nowStr}`,
      isNew: true,
    };

    onAddClientTenant(createdTenant, dispatchLog);
    setNewClientId('');
    setNewTenantId('');
    setNewClientName('');
    setNewMobile('');
    setNewClientOtp('');
    setNewEventTitle('');
    setTenantStatusMsg(
      `Created new client_id (${cleanId}) / tenant_id (${cleanTenant}) — 6-Digit OTP (${cleanOtp}) SENT into Admin 2FA Login Dashboard!`
    );
  };

  return (
    <div className="space-y-8 py-4">
      {/* 0. ADMIN 2FA LOGIN DASHBOARD — INCOMING client_id / tenant_id OTP DISPATCH INBOX */}
      <div
        className="rounded-2xl p-6 sm:p-8 shadow-xl border-2 space-y-4"
        style={{
          backgroundColor: '#06152d',
          borderColor: '#ffd700',
          color: '#ffffff',
        }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2"
          style={{ borderColor: 'rgba(255, 215, 0, 0.4)' }}
        >
          <div>
            <span
              className="text-xs font-mono font-bold uppercase tracking-widest block"
              style={{ color: '#ffd700' }}
            >
              Admin 2FA Login Dashboard • Live OTP Dispatch Inbox
            </span>
            <h2 className="text-lg font-bold" style={{ color: '#ffffff' }}>
              Incoming OTPs Sent Whenever New `client_id` or `tenant_id` is Created
            </h2>
            <p className="text-xs font-bold mt-1" style={{ color: '#a7f3d0' }}>
              Every time a new <code>client_id</code> / <code>tenant_id</code> is created from the New Create Tab under Client Login ID, its 6-digit OTP is delivered directly here in the Admin 2FA Login Dashboard:
            </p>
          </div>
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-extrabold"
            style={{
              backgroundColor: '#ffd700',
              color: '#000000',
            }}
          >
            {adminOtpDispatchLogs.length} Dispatched Client OTPs
          </span>
        </div>

        <div
          className="overflow-x-auto rounded-xl border-2"
          style={{ borderColor: '#38bdf8' }}
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                style={{
                  backgroundColor: '#091e3a',
                  color: '#ffd700',
                  borderBottom: '2px solid #38bdf8',
                }}
              >
                <th className="py-3 px-3 font-mono">client_id</th>
                <th className="py-3 px-3 font-mono">tenant_id</th>
                <th className="py-3 px-3">Client / Host &amp; Event</th>
                <th className="py-3 px-3 font-mono">Mobile Number</th>
                <th className="py-3 px-3 font-mono">
                  OTP Sent to Admin 2FA Dashboard
                </th>
                <th className="py-3 px-3 font-mono">Dispatched Time</th>
                <th className="py-3 px-3 text-right">Login Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {adminOtpDispatchLogs
                .filter(
                  (log) =>
                    ![
                      'otp-disp-1',
                      'otp-disp-2',
                      'otp-disp-3',
                      'otp-disp-4',
                    ].includes(log.id)
                )
                .map((log) => (
                <tr
                  key={log.id}
                  style={{
                    backgroundColor: log.isNew ? '#064e3b' : '#0f2942',
                    color: '#ffffff',
                  }}
                >
                  <td
                    className="py-3 px-3 font-mono font-bold"
                    style={{ color: '#ffff00' }}
                  >
                    {log.clientId}
                    {log.isNew && (
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold"
                        style={{
                          backgroundColor: '#ffd700',
                          color: '#000000',
                        }}
                      >
                        NEW OTP SENT
                      </span>
                    )}
                  </td>
                  <td
                    className="py-3 px-3 font-mono font-bold"
                    style={{ color: '#a7f3d0' }}
                  >
                    {log.tenantId}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold" style={{ color: '#ffffff' }}>
                      {log.clientName}
                    </div>
                    <div className="text-[11px]" style={{ color: '#cbd5e1' }}>
                      {log.eventTitle} · {log.guestPax} Pax
                    </div>
                  </td>
                  <td
                    className="py-3 px-3 font-mono font-bold"
                    style={{ color: '#38bdf8' }}
                  >
                    {log.mobileNumber}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span
                      className="px-2.5 py-1 rounded font-mono font-extrabold text-sm"
                      style={{
                        backgroundColor: '#ffd700',
                        color: '#000000',
                      }}
                    >
                      {log.otpCode}
                    </span>
                  </td>
                  <td
                    className="py-3 px-3 font-mono font-bold"
                    style={{ color: '#fff7e6' }}
                  >
                    {log.dispatchedAt}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      {onLoginAsClientTenant && (
                        <button
                          type="button"
                          onClick={() => {
                            const found = clientTenants.find(
                              (c) => c.clientId === log.clientId
                            );
                            if (found) onLoginAsClientTenant(found);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                          style={{
                            backgroundColor: '#ffd700',
                            color: '#000000',
                            border: '1.5px solid #ffffff',
                          }}
                        >
                          Login Client ID (All 12 Modules)
                        </button>
                      )}
                      {onDeleteOtpDispatchLog && (
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteOtpDispatchLog(log.id, log.clientId)
                          }
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                          style={{
                            backgroundColor: '#7a003c',
                            color: '#ffffff',
                            border: '1px solid #ffd700',
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Multi-Tenant Client ID (client_id / tenant_id), Mobile Number & OTP Registry */}
      <div
        className="rounded-2xl p-6 sm:p-8 shadow-xl border-2 space-y-5"
        style={{
          backgroundColor: '#0f2942',
          borderColor: '#ffd700',
          color: '#ffffff',
        }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2"
          style={{ borderColor: 'rgba(255, 215, 0, 0.4)' }}
        >
          <div>
            <span
              className="text-xs font-mono font-bold uppercase tracking-widest block"
              style={{ color: '#ffd700' }}
            >
              Multi-Tenant Database Isolation (`client_id` / `tenant_id`)
            </span>
            <h2 className="text-lg font-bold" style={{ color: '#ffffff' }}>
              Client Tenant ID, Registered Mobile Number &amp; 6-Digit Client OTP Registry
            </h2>
          </div>
        </div>

        {tenantStatusMsg && (
          <div
            className="p-3 rounded-lg text-xs font-bold border-2"
            style={{
              backgroundColor: '#064e3b',
              color: '#ffff00',
              borderColor: '#34d399',
            }}
          >
            {tenantStatusMsg}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border-2" style={{ borderColor: '#ffd700' }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                style={{
                  backgroundColor: '#091e3a',
                  color: '#ffd700',
                  borderBottom: '2px solid #ffd700',
                }}
              >
                <th className="py-3 px-3 font-mono">client_id</th>
                <th className="py-3 px-3 font-mono">tenant_id</th>
                <th className="py-3 px-3">Client / Host Name &amp; Event</th>
                <th className="py-3 px-3 font-mono">Mobile Number</th>
                <th className="py-3 px-3 font-mono">6-Digit Client OTP</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {clientTenants.map((t) => (
                <tr
                  key={t.clientId}
                  style={{ backgroundColor: '#0f2942', color: '#ffffff' }}
                >
                  <td
                    className="py-3 px-3 font-mono font-bold"
                    style={{ color: '#ffff00' }}
                  >
                    {t.clientId}
                  </td>
                  <td
                    className="py-3 px-3 font-mono font-bold"
                    style={{ color: '#a7f3d0' }}
                  >
                    {t.tenantId}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold" style={{ color: '#ffffff' }}>
                      {t.clientName}
                    </div>
                    <div className="text-[11px]" style={{ color: '#cbd5e1' }}>
                      {t.eventTitle} · {t.guestPax} Pax
                    </div>
                  </td>
                  <td
                    className="py-3 px-3 font-mono font-bold"
                    style={{ color: '#38bdf8' }}
                  >
                    {t.mobileNumber}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <input
                      type="text"
                      maxLength={6}
                      value={t.otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (onUpdateClientTenantOtp) {
                          onUpdateClientTenantOtp(t.clientId, val);
                        }
                      }}
                      aria-label={`OTP for ${t.clientId}`}
                      className="w-24 px-2 py-1 text-center font-mono font-bold rounded"
                      style={{
                        backgroundColor: '#091e3a',
                        color: '#ffff00',
                        border: '1.5px solid #ffd700',
                      }}
                    />
                  </td>
                  <td className="py-3 px-3 text-right">
                    {onDeleteClientTenant && clientTenants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteClientTenant(t.clientId)}
                        className="px-2.5 py-1 rounded text-xs font-bold cursor-pointer"
                        style={{
                          backgroundColor: '#7a003c',
                          color: '#ffffff',
                          border: '1px solid #ffd700',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form to Register a New Client ID / Tenant */}
        {onAddClientTenant && (
          <form
            onSubmit={handleCreateTenant}
            className="p-4 rounded-xl border-2 space-y-3"
            style={{
              backgroundColor: '#091e3a',
              borderColor: '#38bdf8',
            }}
          >
            <div
              className="text-xs font-mono uppercase tracking-wider font-bold"
              style={{ color: '#ffd700' }}
            >
              + Register New Isolated Client Tenant (`client_id` / `tenant_id` + Mobile + OTP)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: '#ffd700' }}>
                  Unique client_id *
                </label>
                <input
                  type="text"
                  required
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  placeholder="e.g. CLI-KAPOOR-05"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg"
                  style={{
                    backgroundColor: '#06152d',
                    color: '#ffff00',
                    border: '1.5px solid #ffd700',
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: '#ffd700' }}>
                  Unique tenant_id *
                </label>
                <input
                  type="text"
                  required
                  value={newTenantId}
                  onChange={(e) => setNewTenantId(e.target.value)}
                  placeholder="e.g. TENANT-KAPOOR-05"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg"
                  style={{
                    backgroundColor: '#06152d',
                    color: '#a7f3d0',
                    border: '1.5px solid #38bdf8',
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: '#ffd700' }}>
                  Registered 10-Digit Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  placeholder="+91 98115 22334"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg"
                  style={{
                    backgroundColor: '#06152d',
                    color: '#ffffff',
                    border: '1.5px solid #38bdf8',
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: '#ffd700' }}>
                  Client / Host Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Vikram & Pooja Kapoor"
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-lg"
                  style={{
                    backgroundColor: '#06152d',
                    color: '#ffffff',
                    border: '1.5px solid #38bdf8',
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: '#ffd700' }}>
                  Event Title &amp; Pax
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Royal Reception"
                    className="flex-1 px-2.5 py-1.5 text-xs font-bold rounded-lg"
                    style={{
                      backgroundColor: '#06152d',
                      color: '#ffffff',
                      border: '1.5px solid #38bdf8',
                    }}
                  />
                  <input
                    type="number"
                    value={newGuestPax}
                    onChange={(e) => setNewGuestPax(Number(e.target.value))}
                    className="w-20 px-2 py-1.5 text-xs font-mono font-bold rounded-lg"
                    style={{
                      backgroundColor: '#06152d',
                      color: '#ffff00',
                      border: '1.5px solid #38bdf8',
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: '#ffd700' }}>
                  6-Digit Client OTP *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={newClientOtp}
                    onChange={(e) =>
                      setNewClientOtp(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="556677"
                    className="flex-1 px-3 py-1.5 text-xs font-mono font-bold rounded-lg"
                    style={{
                      backgroundColor: '#06152d',
                      color: '#ffff00',
                      border: '1.5px solid #ffd700',
                    }}
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0"
                    style={{
                      backgroundColor: '#ffd700',
                      color: '#000000',
                      border: '2px solid #ffffff',
                    }}
                  >
                    + Save Tenant
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* 2. Change Private 6-Digit Developer Master OTP Code */}
      <div className="max-w-xl mx-auto">
        <div
          className="rounded-2xl p-6 sm:p-8 shadow-xl border-2"
          style={{
            backgroundColor: '#0f2942',
            borderColor: '#ffd700',
            color: '#ffffff',
          }}
        >
          <div
            className="flex items-center gap-3 pb-4 border-b-2"
            style={{ borderColor: 'rgba(255, 215, 0, 0.4)' }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2"
              style={{
                backgroundColor: '#ffd700',
                color: '#091e3a',
                borderColor: '#ffffff',
              }}
            >
              <Lock className="w-5 h-5" style={{ color: '#091e3a' }} />
            </div>
            <div>
              <span
                className="text-xs font-bold uppercase tracking-widest block"
                style={{ color: '#ffd700' }}
              >
                TheCaterings • 2FA &amp; DB Security
              </span>
              <h2
                className="text-lg font-bold"
                style={{ color: '#ffffff' }}
              >
                Change Private 6-Digit Developer Master OTP Code
              </h2>
            </div>
          </div>

          <form onSubmit={handleUpdateOtp} className="space-y-4 mt-5">
            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ color: '#ffd700' }}
              >
                Current 6-Digit Developer Master OTP Code *
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={currentOtpInput}
                onChange={(e) =>
                  setCurrentOtpInput(e.target.value.replace(/\D/g, ''))
                }
                placeholder="Enter current 6-digit OTP"
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest rounded-lg focus:outline-none"
                style={{
                  backgroundColor: '#091e3a',
                  color: '#ffff00',
                  border: '2px solid #38bdf8',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ color: '#ffd700' }}
              >
                New Private 6-Digit Developer Master OTP Code *
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={newOtpInput}
                onChange={(e) =>
                  setNewOtpInput(e.target.value.replace(/\D/g, ''))
                }
                placeholder="Enter new 6-digit OTP"
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest rounded-lg focus:outline-none"
                style={{
                  backgroundColor: '#091e3a',
                  color: '#ffff00',
                  border: '2px solid #38bdf8',
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ color: '#ffd700' }}
              >
                Confirm New 6-Digit Developer Master OTP Code *
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                value={confirmOtpInput}
                onChange={(e) =>
                  setConfirmOtpInput(e.target.value.replace(/\D/g, ''))
                }
                placeholder="Re-enter new 6-digit OTP"
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest rounded-lg focus:outline-none"
                style={{
                  backgroundColor: '#091e3a',
                  color: '#ffff00',
                  border: '2px solid #38bdf8',
                }}
              />
            </div>

            {statusMessage && (
              <div
                className="px-3.5 py-2.5 rounded-lg text-xs font-bold border-2"
                style={
                  statusMessage.type === 'success'
                    ? {
                        backgroundColor: '#064e3b',
                        color: '#ffff00',
                        borderColor: '#34d399',
                      }
                    : {
                        backgroundColor: '#5c1111',
                        color: '#ffff00',
                        borderColor: '#f87171',
                      }
                }
              >
                {statusMessage.text}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: '#ffd700',
                  color: '#091e3a',
                  border: '2px solid #ffffff',
                }}
              >
                <Lock className="w-4 h-4" style={{ color: '#091e3a' }} />
                <span style={{ color: '#091e3a', fontWeight: 700 }}>
                  Change Private 6-Digit Developer Master OTP Code
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

