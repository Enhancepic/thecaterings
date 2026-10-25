import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  ShieldCheck,
  FileJson,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  ClientTenant,
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
} from '../data/initialData';

export interface AppBackupPayload {
  version: string;
  timestamp: string;
  portalType: 'admin' | 'client';
  clientTenants: ClientTenant[];
  dishes: DishItem[];
  tasks: OverviewTask[];
  leads: CrmLead[];
  proposals: ProposalQuote[];
  events: BanquetEvent[];
  kots: KotTicket[];
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  staff: StaffMember[];
  gstInvoices: GstInvoice[];
  invoices?: GstInvoice[];
  tastingNotes: ClientTastingNote[];
  masterOtp: string;
}

interface BackupSystemModalProps {
  portalType: 'admin' | 'client';
  currentClientTenant?: ClientTenant | null;
  clientTenants: ClientTenant[];
  dishes: DishItem[];
  tasks: OverviewTask[];
  leads: CrmLead[];
  proposals: ProposalQuote[];
  events: BanquetEvent[];
  kots: KotTicket[];
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  staff: StaffMember[];
  gstInvoices: GstInvoice[];
  tastingNotes: ClientTastingNote[];
  masterOtp: string;
  onRestoreBackup: (payload: AppBackupPayload) => void;
  onClose: () => void;
}

export const BackupSystemModal: React.FC<BackupSystemModalProps> = ({
  portalType,
  currentClientTenant,
  clientTenants,
  dishes,
  tasks,
  leads,
  proposals,
  events,
  kots,
  inventory,
  purchaseOrders,
  staff,
  gstInvoices,
  tastingNotes,
  masterOtp,
  onRestoreBackup,
  onClose,
}) => {
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [localStorageSnapshots, setLocalStorageSnapshots] = useState<
    { key: string; date: string; size: string }[]
  >(() => {
    try {
      const list = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('THE_CATERINGS_BACKUP_')) {
          const val = localStorage.getItem(k) || '';
          list.push({
            key: k,
            date: k.replace('THE_CATERINGS_BACKUP_', '').replace(/_/g, ':'),
            size: `${Math.round(val.length / 1024)} KB`,
          });
        }
      }
      return list.sort().reverse();
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    try {
      const payload: AppBackupPayload = {
        version: '2.6.0',
        timestamp: new Date().toISOString(),
        portalType,
        clientTenants,
        dishes,
        tasks,
        leads,
        proposals,
        events,
        kots,
        inventory,
        purchaseOrders,
        staff,
        gstInvoices,
        invoices: gstInvoices,
        tastingNotes,
        masterOtp,
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TheCaterings_Backup_${portalType}_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({
        type: 'success',
        text: `Successfully exported full database backup JSON (${portalType.toUpperCase()} portal).`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Failed to export backup: ${err?.message || 'Unknown error'}`,
      });
    }
  };

  const handleSaveToLocalStorage = () => {
    try {
      const payload: AppBackupPayload = {
        version: '2.6.0',
        timestamp: new Date().toISOString(),
        portalType,
        clientTenants,
        dishes,
        tasks,
        leads,
        proposals,
        events,
        kots,
        inventory,
        purchaseOrders,
        staff,
        gstInvoices,
        invoices: gstInvoices,
        tastingNotes,
        masterOtp,
      };
      const keyName = `THE_CATERINGS_BACKUP_${new Date()
        .toISOString()
        .replace(/[:.]/g, '_')}`;
      localStorage.setItem(keyName, JSON.stringify(payload));

      const list = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('THE_CATERINGS_BACKUP_')) {
          const val = localStorage.getItem(k) || '';
          list.push({
            key: k,
            date: k.replace('THE_CATERINGS_BACKUP_', '').replace(/_/g, ':'),
            size: `${Math.round(val.length / 1024)} KB`,
          });
        }
      }
      setLocalStorageSnapshots(list.sort().reverse());
      setStatusMsg({
        type: 'success',
        text: 'Encrypted local database snapshot saved successfully to browser storage.',
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Failed to save local backup: ${err?.message}`,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as AppBackupPayload;
        if (!parsed.version || !Array.isArray(parsed.inventory)) {
          throw new Error('Invalid backup schema or missing database tables.');
        }
        onRestoreBackup(parsed);
        setStatusMsg({
          type: 'success',
          text: `Successfully restored database backup from file (${parsed.timestamp || 'Unknown date'}). All modules updated!`,
        });
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: `Failed to parse backup file: ${err?.message}`,
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestoreLocalStorage = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) throw new Error('Snapshot not found in storage.');
      const parsed = JSON.parse(raw) as AppBackupPayload;
      onRestoreBackup(parsed);
      setStatusMsg({
        type: 'success',
        text: `Successfully restored snapshot from ${key.replace('THE_CATERINGS_BACKUP_', '')}`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Restoration failed: ${err?.message}`,
      });
    }
  };

  const handleDeleteLocalStorage = (key: string) => {
    try {
      localStorage.removeItem(key);
      setLocalStorageSnapshots((prev) => prev.filter((s) => s.key !== key));
      setStatusMsg({
        type: 'success',
        text: 'Snapshot removed from browser storage.',
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Failed to delete snapshot: ${err?.message}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-stone-300 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-800">
                TheCaterings Enterprise Backup &amp; Recovery System
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {portalType === 'admin' ? 'Admin Portal • DB Backup Center' : `Client Portal • ${currentClientTenant?.clientName || 'Client'} Data Backup`}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Backup Center"
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 text-xs font-medium ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{statusMsg.text}</div>
          </div>
        )}

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <Download className="w-4 h-4" />
                <span>Export JSON Backup File</span>
              </div>
              <p className="text-xs text-slate-600">
                Download a complete JSON backup of all leads, proposals, banquet events, KOTs, inventory, purchase orders, staff, invoices, and tenant settings.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportJson}
              className="w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>Download Backup JSON</span>
            </button>
          </div>

          {/* Import / Restore JSON */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
                <Upload className="w-4 h-4" />
                <span>Restore from Backup File</span>
              </div>
              <p className="text-xs text-slate-600">
                Upload a previously saved `.json` backup file to instantly restore all enterprise data and sync live system state.
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Upload &amp; Restore JSON</span>
            </button>
          </div>
        </div>

        {/* Local Browser Snapshot section */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <HardDrive className="w-4 h-4 text-amber-700" />
              <span>Browser Local Storage Snapshots ({localStorageSnapshots.length})</span>
            </div>
            <button
              type="button"
              onClick={handleSaveToLocalStorage}
              className="py-1.5 px-3 bg-amber-800 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Create Instant Snapshot</span>
            </button>
          </div>

          {localStorageSnapshots.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No local snapshots found yet. Click 'Create Instant Snapshot' to save a backup in your browser.
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {localStorageSnapshots.map((snap) => (
                <div
                  key={snap.key}
                  className="bg-white border border-stone-200 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 font-mono text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>{snap.date}</span>
                    <span className="text-[10px] text-slate-400 bg-stone-100 px-1.5 py-0.5 rounded">
                      {snap.size}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRestoreLocalStorage(snap.key)}
                      className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded font-semibold text-[11px] cursor-pointer"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocalStorage(snap.key)}
                      className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded cursor-pointer"
                      title="Delete Snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-200 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Client-Side Backup &amp; Recovery</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-stone-200 hover:bg-stone-300 text-slate-800 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
