import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  FileText,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { DishItem } from '../data/initialData';
import {
  downloadDishesToExcel,
  downloadSampleDishExcelTemplate,
  parseDishesFromExcel,
} from '../utils/excelDishUtils';

interface ExcelProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishes: DishItem[];
  onBulkAddDishes: (dishes: Omit<DishItem, 'id'>[]) => void;
  onReplaceByDishCode?: (dishes: Omit<DishItem, 'id'>[]) => void;
  onReplaceAllDishes?: (dishes: Omit<DishItem, 'id'>[]) => void;
  onDeleteAllDishes: () => void;
  onBulkDeleteDishes: (dishIds: string[]) => void;
  activeRoleLabel?: string;
}

export const ExcelProductModal: React.FC<ExcelProductModalProps> = ({
  isOpen,
  onClose,
  dishes,
  onBulkAddDishes,
  onReplaceByDishCode,
  onReplaceAllDishes,
  onDeleteAllDishes,
  onBulkDeleteDishes,
  activeRoleLabel = 'Admin & Client Access',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'download' | 'bulk-delete'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Omit<DishItem, 'id'>[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importMode, setImportMode] = useState<'replace-code' | 'append' | 'replace-all'>('replace-code');
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);
  const [selectedIdsToDelete, setSelectedIdsToDelete] = useState<string[]>([]);
  const [searchDeleteQuery, setSearchDeleteQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const normalizeCode = (c: string) => (c || '').trim().toLowerCase();

  const matchingRows = parsedRows.filter((r) =>
    dishes.some((d) => normalizeCode(d.code) === normalizeCode(r.code))
  );
  const newCodeRows = parsedRows.filter(
    (r) => !dishes.some((d) => normalizeCode(d.code) === normalizeCode(r.code))
  );
  const preservedDishes = dishes.filter(
    (d) => !parsedRows.some((r) => normalizeCode(r.code) === normalizeCode(d.code))
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setParseError(null);
    setIsParsing(true);

    try {
      const rows = await parseDishesFromExcel(file, dishes.length);
      setParsedRows(rows);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse Excel file.';
      setParseError(msg);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;
    if (importMode === 'replace-code') {
      if (onReplaceByDishCode) {
        onReplaceByDishCode(parsedRows);
      } else if (onReplaceAllDishes) {
        // Fallback: merge by code and preserve remaining dishes
        const norm = (c: string) => (c || '').trim().toLowerCase();
        const incomingMap = new Map<string, Omit<DishItem, 'id'>>();
        parsedRows.forEach((r) => r.code && incomingMap.set(norm(r.code), r));
        const matchedCodes = new Set<string>();
        const updatedExisting = dishes.map((d) => {
          const match = incomingMap.get(norm(d.code));
          if (match) {
            matchedCodes.add(norm(d.code));
            return {
              ...match,
              id: d.id,
              imageUrl: match.imageUrl || d.imageUrl,
              includedInMenu: d.includedInMenu,
            };
          }
          return d;
        });
        const newlyAdded: DishItem[] = [];
        parsedRows.forEach((r, idx) => {
          if (!matchedCodes.has(norm(r.code))) {
            newlyAdded.push({
              ...r,
              id: `dish-excel-${Date.now()}-${idx}`,
            });
          }
        });
        onReplaceAllDishes([...updatedExisting, ...newlyAdded]);
      } else {
        onBulkAddDishes(parsedRows);
      }
    } else if (importMode === 'replace-all') {
      if (onReplaceAllDishes) {
        onReplaceAllDishes(parsedRows);
      } else {
        onBulkAddDishes(parsedRows);
      }
    } else {
      onBulkAddDishes(parsedRows);
    }
    // Reset state & close
    setUploadedFile(null);
    setParsedRows([]);
    onClose();
  };

  const filteredDishesForDelete = dishes.filter(
    (d) =>
      d.name.toLowerCase().includes(searchDeleteQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchDeleteQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchDeleteQuery.toLowerCase())
  );

  const toggleSelectDelete = (id: string) => {
    setSelectedIdsToDelete((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllFilteredForDelete = () => {
    setSelectedIdsToDelete(filteredDishesForDelete.map((d) => d.id));
  };

  const clearSelectionForDelete = () => {
    setSelectedIdsToDelete([]);
  };

  const handleExecuteBulkDelete = () => {
    if (selectedIdsToDelete.length === 0) return;
    onBulkDeleteDishes(selectedIdsToDelete);
    setSelectedIdsToDelete([]);
  };

  const handleExecuteDeleteAll = () => {
    onDeleteAllDishes();
    setShowConfirmDeleteAll(false);
    setSelectedIdsToDelete([]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
    >
      <div className="bg-white border-2 border-[#1B1B1B] rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#0f2942] text-white p-4 sm:p-5 border-b-2 border-[#ffd700] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 text-[#ffd700]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-display text-white m-0">
                  Product Catalog Excel Manager
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ffd700] text-[#0f2942]">
                  {activeRoleLabel}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Bulk Upload, Download and Delete products via Excel (.xlsx / .csv) for Admin &amp; Client Logins
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Excel Manager Modal"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-[#1B1B1B] bg-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 text-xs font-mono font-bold flex items-center justify-center gap-2 border-r border-slate-300 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#0f2942] border-b-2 border-b-[#0f2942]'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Upload by Excel Sheet</span>
            {parsedRows.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
                {parsedRows.length} Ready
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-3 px-4 text-xs font-mono font-bold flex items-center justify-center gap-2 border-r border-slate-300 transition-colors cursor-pointer ${
              activeTab === 'download'
                ? 'bg-white text-[#0f2942] border-b-2 border-b-[#0f2942]'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Download Product Excel</span>
            <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px]">
              {dishes.length} Items
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bulk-delete')}
            className={`flex-1 py-3 px-4 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'bulk-delete'
                ? 'bg-white text-rose-700 border-b-2 border-b-rose-700'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Bulk Product Delete</span>
            {selectedIdsToDelete.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-full text-[10px]">
                {selectedIdsToDelete.length} Selected
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-white">
          {/* TAB 1: UPLOAD BY EXCEL SHEET */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              {/* Dropzone & Template Download */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                <div className="md:col-span-2 border-2 border-dashed border-[#0f2942]/40 rounded-xl p-6 bg-slate-50/70 hover:bg-slate-100/70 transition-colors flex flex-col items-center justify-center text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-product-upload-input"
                  />
                  <div className="p-3 bg-white border-2 border-[#1B1B1B] rounded-2xl shadow-xs mb-3 text-emerald-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {uploadedFile ? uploadedFile.name : 'Select or Drop your Excel Sheet (.xlsx / .csv)'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    {uploadedFile
                      ? `File size: ${(uploadedFile.size / 1024).toFixed(1)} KB. Ready for catalog verification.`
                      : 'Upload bulk products with dish names, categories, selling rates, kitchen stations, and recipes.'}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-black text-xs py-2 px-4 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#ffd700]" />
                      <span>{uploadedFile ? 'Choose Different File' : 'Browse Excel File'}</span>
                    </button>
                    {uploadedFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setParsedRows([]);
                          setParseError(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs font-mono font-bold text-rose-700 hover:underline px-2 py-1 cursor-pointer"
                      >
                        Clear File
                      </button>
                    )}
                  </div>
                </div>

                {/* Template Download Card */}
                <div className="border-2 border-[#1B1B1B] rounded-xl p-5 bg-[#0f2942]/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0f2942] uppercase tracking-wider mb-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Excel Template</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Download the standardized TheCaterings template with pre-formatted column headers and sample royal banquet recipes.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-300">
                    <button
                      type="button"
                      onClick={downloadSampleDishExcelTemplate}
                      className="w-full py-2 px-3 text-xs font-mono font-bold rounded-lg border-2 border-[#0f2942] bg-white hover:bg-slate-100 text-[#0f2942] shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Download className="w-4 h-4 text-emerald-700" />
                      <span>Download Template (.xlsx)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {parseError && (
                <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                  <div>
                    <strong>Excel Parse Error:</strong> {parseError}
                  </div>
                </div>
              )}

              {/* Parsed Rows Preview */}
              {isParsing && (
                <div className="p-8 text-center space-y-2 text-slate-600">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700" />
                  <p className="text-xs font-mono">Parsing Excel spreadsheet sheets and columns...</p>
                </div>
              )}

              {parsedRows.length > 0 && !isParsing && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-emerald-950 block font-mono">
                            Successfully Extracted {parsedRows.length} Product Records from Excel
                          </span>
                          <span className="text-[11px] text-emerald-800">
                            Comparison against existing {dishes.length} products in Dishes Selection:
                          </span>
                        </div>
                      </div>

                      {/* Stat badges */}
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-bold">
                          🔄 {matchingRows.length} Match Same Dish Code
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-200 border border-emerald-400 text-emerald-950 font-bold">
                          🛡️ {preservedDishes.length} Kept Safe (Not Deleted)
                        </span>
                        {newCodeRows.length > 0 && (
                          <span className="px-2 py-0.5 rounded bg-blue-100 border border-blue-300 text-blue-900 font-bold">
                            ➕ {newCodeRows.length} New Codes
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mode Choice */}
                    <div className="pt-2 border-t border-emerald-200/80">
                      <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Choose Catalog Import Mode:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setImportMode('replace-code')}
                          className={`p-2.5 text-left rounded-lg border-2 transition-all cursor-pointer ${
                            importMode === 'replace-code'
                              ? 'bg-[#0f2942] border-[#ffd700] text-white shadow-md'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                            <span>🔄 Replace Same Dish Code</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500 text-white font-bold">
                              SAFE
                            </span>
                          </div>
                          <p className={`text-[10px] mt-1 line-clamp-2 ${importMode === 'replace-code' ? 'text-slate-200' : 'text-slate-500'}`}>
                            Replaces only products with matching Dish Codes. Baaki {preservedDishes.length} products delete nahi honge!
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setImportMode('append')}
                          className={`p-2.5 text-left rounded-lg border-2 transition-all cursor-pointer ${
                            importMode === 'append'
                              ? 'bg-[#0f2942] border-[#ffd700] text-white shadow-md'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-xs font-bold font-mono">
                            + Append to Catalog
                          </div>
                          <p className={`text-[10px] mt-1 line-clamp-2 ${importMode === 'append' ? 'text-slate-200' : 'text-slate-500'}`}>
                            Adds all {parsedRows.length} items without replacing existing codes ({dishes.length} + {parsedRows.length}).
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setImportMode('replace-all')}
                          className={`p-2.5 text-left rounded-lg border-2 transition-all cursor-pointer ${
                            importMode === 'replace-all'
                              ? 'bg-rose-700 border-rose-900 text-white shadow-md'
                              : 'bg-white border-rose-300 text-rose-800 hover:bg-rose-50'
                          }`}
                        >
                          <div className="text-xs font-bold font-mono text-rose-300">
                            ⚠️ Wipe &amp; Replace All
                          </div>
                          <p className={`text-[10px] mt-1 line-clamp-2 ${importMode === 'replace-all' ? 'text-rose-100' : 'text-rose-600'}`}>
                            Deletes all {dishes.length} existing products, keeping only {parsedRows.length} from Excel.
                          </p>
                        </button>
                      </div>
                    </div>

                    {importMode === 'replace-code' && (
                      <div className="text-[11px] text-emerald-900 bg-white/80 p-2.5 rounded-lg border border-emerald-300 font-mono">
                        💡 <strong>Dish Code Matching Policy:</strong> Sirf wahi products replace honge jinka Dish Code match karega ({matchingRows.length} items). Dishes Selection module ke baaki saare <strong>{preservedDishes.length} products surakshit rahenge aur delete nahi honge</strong>.
                      </div>
                    )}
                  </div>

                  {/* Table Preview (first 10 items) */}
                  <div className="border-2 border-[#1B1B1B] rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                      <span>Previewing First {Math.min(10, parsedRows.length)} of {parsedRows.length} Products</span>
                      <span>Total Extracted: {parsedRows.length}</span>
                    </div>
                    <div className="overflow-x-auto max-h-60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0f2942] text-white font-mono uppercase text-[10px] tracking-wider sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Dish Code</th>
                            <th className="py-2 px-3">Dish Name</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3">Kitchen Station</th>
                            <th className="py-2 px-3 text-right">Selling ₹</th>
                            <th className="py-2 px-3 text-right">Cost ₹</th>
                            <th className="py-2 px-3">Dietary</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono">
                          {parsedRows.slice(0, 10).map((row, idx) => {
                            const isMatch = dishes.some(
                              (d) => normalizeCode(d.code) === normalizeCode(row.code)
                            );
                            return (
                              <tr key={idx} className="hover:bg-amber-50/50">
                                <td className="py-2 px-3">
                                  {isMatch ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap">
                                      🔄 Replaces Existing
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 whitespace-nowrap">
                                      ➕ New Product
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-bold text-slate-900">{row.code}</td>
                                <td className="py-2 px-3 font-semibold text-slate-800">{row.name}</td>
                                <td className="py-2 px-3 text-amber-800">{row.category}</td>
                                <td className="py-2 px-3 text-slate-600">{row.station}</td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-700">₹{row.sellingPricePerPlate}</td>
                                <td className="py-2 px-3 text-right text-slate-600">₹{row.foodCostPerPlate}</td>
                                <td className="py-2 px-3 text-[11px] text-slate-500">{row.dietary}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Confirm Action Button */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setParsedRows([]);
                      }}
                      className="btn bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs py-2.5 px-4 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      className={`btn text-xs py-2.5 px-5 inline-flex items-center gap-2 cursor-pointer font-bold ${
                        importMode === 'replace-all'
                          ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-md'
                          : 'btn-accent shadow-md'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>
                        {importMode === 'replace-code'
                          ? `Confirm & Replace ${matchingRows.length} Products by Dish Code (${preservedDishes.length} Preserved Safe)`
                          : importMode === 'replace-all'
                          ? `Confirm & Wipe All Catalog with ${parsedRows.length} Products Only`
                          : `Confirm & Add ${parsedRows.length} Products to Catalog`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOWNLOAD PRODUCT EXCEL */}
          {activeTab === 'download' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border-2 border-[#1B1B1B] bg-gradient-to-br from-blue-50/60 to-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                    Excel Spreadsheet Export (.xlsx)
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 font-display">
                    Export All {dishes.length} Products to Excel
                  </h3>
                  <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                    Downloads an official spreadsheet with product codes, names, course categories, kitchen stations, selling rates, recipe BOM costs, gross margins, and image links.
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadDishesToExcel(dishes)}
                    className="btn btn-black text-xs py-3 px-6 inline-flex items-center gap-2.5 shadow-lg cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-[#ffd700]" />
                    <span className="text-sm font-bold">Download Excel File (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Dishes</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{dishes.length}</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Selected in Menu</span>
                  <span className="text-lg font-bold font-mono text-emerald-700">
                    {dishes.filter((d) => d.includedInMenu).length}
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Avg Selling Rate</span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    ₹
                    {dishes.length > 0
                      ? Math.round(
                          dishes.reduce((acc, d) => acc + d.sellingPricePerPlate, 0) / dishes.length
                        )
                      : 0}
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Avg Food Cost</span>
                  <span className="text-lg font-bold font-mono text-amber-800">
                    ₹
                    {dishes.length > 0
                      ? Math.round(
                          dishes.reduce((acc, d) => acc + d.foodCostPerPlate, 0) / dishes.length
                        )
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BULK PRODUCT DELETE */}
          {activeTab === 'bulk-delete' && (
            <div className="space-y-5">
              {/* Red Danger Warning Card for Delete All */}
              <div className="p-5 rounded-xl border-2 border-rose-300 bg-rose-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>Delete All Products in Catalog ({dishes.length} Items)</span>
                  </div>
                  <p className="text-xs text-rose-700 max-w-xl">
                    Permanently removes all {dishes.length} products from the catalog. Useful when replacing with a completely new menu catalog.
                  </p>
                </div>
                <div>
                  {!showConfirmDeleteAll ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmDeleteAll(true)}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-mono font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete All Products</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border-2 border-rose-600 shadow-md">
                      <span className="text-xs font-bold text-rose-800">Confirm delete ALL?</span>
                      <button
                        type="button"
                        onClick={handleExecuteDeleteAll}
                        className="px-3 py-1 bg-rose-700 text-white rounded text-xs font-bold hover:bg-rose-800 cursor-pointer"
                      >
                        Yes, Delete All
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmDeleteAll(false)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs hover:bg-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Selective Bulk Delete */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                      Or Select Specific Products to Delete ({selectedIdsToDelete.length} selected)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Check products to delete in bulk from the catalog.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllFilteredForDelete}
                      className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer"
                    >
                      Select All Filtered ({filteredDishesForDelete.length})
                    </button>
                    <button
                      type="button"
                      onClick={clearSelectionForDelete}
                      className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer"
                    >
                      Clear Selection
                    </button>
                    {selectedIdsToDelete.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExecuteBulkDelete}
                        className="px-3 py-1 text-xs font-mono font-bold rounded bg-rose-700 hover:bg-rose-800 text-white inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete {selectedIdsToDelete.length} Selected</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Search */}
                <input
                  type="text"
                  value={searchDeleteQuery}
                  onChange={(e) => setSearchDeleteQuery(e.target.value)}
                  placeholder="Filter products by name, code or category..."
                  className="w-full px-3 py-2 text-xs font-mono border-2 border-slate-300 rounded-lg focus:outline-none focus:border-[#0f2942]"
                />

                {/* Selectable List */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-mono text-[11px] text-slate-700 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 w-10">Select</th>
                        <th className="py-2 px-3">Code</th>
                        <th className="py-2 px-3">Dish Name</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Selling Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {filteredDishesForDelete.map((dish) => {
                        const isSelected = selectedIdsToDelete.includes(dish.id);
                        return (
                          <tr
                            key={dish.id}
                            onClick={() => toggleSelectDelete(dish.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-rose-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectDelete(dish.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded text-rose-600 cursor-pointer"
                              />
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900">{dish.code}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{dish.name}</td>
                            <td className="py-2 px-3 text-amber-800">{dish.category}</td>
                            <td className="py-2 px-3 text-right text-slate-700">₹{dish.sellingPricePerPlate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-3 sm:p-4 border-t-2 border-[#1B1B1B] flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-mono">
            TheCaterings Catalog Status: <strong>{dishes.length}</strong> Products Active
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-black text-xs py-2 px-4 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
