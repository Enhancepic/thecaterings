import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  X,
  CheckCircle2,
  Plus,
  BellRing,
  Sparkles,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  ClientTenant,
  AdminOtpDispatchRecord,
  INITIAL_CLIENT_TENANTS,
  INITIAL_ADMIN_OTP_DISPATCH_LOGS,
  findMatchingTenantOrAdmin,
  normalizePhoneDigits,
  getNextAvailableClientTenantIds,
  validateUniqueClientTenantRegistration,
} from '../data/initialData';

export type LoginPortalTabMode = 'client-login' | 'admin-2fa' | 'create-tenant';

interface Developer2FALoginGateProps {
  masterOtp: string;
  clientTenants?: ClientTenant[];
  adminOtpDispatchLogs?: AdminOtpDispatchRecord[];
  initialMode?: LoginPortalTabMode;
  onSuccessLogin: () => void;
  onSuccessClientLogin?: (tenant: ClientTenant) => void;
  onCreateClientTenant?: (
    newTenant: ClientTenant,
    otpDispatch: AdminOtpDispatchRecord
  ) => void;
  onOpenCustomerPage?: () => void;
  onClose?: () => void;
}

export const StenStudio2FALoginGate: React.FC<Developer2FALoginGateProps> = ({
  masterOtp,
  clientTenants = INITIAL_CLIENT_TENANTS,
  adminOtpDispatchLogs = INITIAL_ADMIN_OTP_DISPATCH_LOGS,
  initialMode = 'client-login',
  onSuccessLogin,
  onSuccessClientLogin,
  onCreateClientTenant,
  onOpenCustomerPage,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LoginPortalTabMode>(initialMode);
  const [hoverClientMenu, setHoverClientMenu] = useState(false);

  const [identifierInput, setIdentifierInput] = useState(
    initialMode === 'admin-2fa' ? 'ADMIN-MASTER' : ''
  );
  const [otpInput, setOtpInput] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Create Tab (`client_id` / `tenant_id`) state
  const initialNextIds = getNextAvailableClientTenantIds(clientTenants);
  const [newClientId, setNewClientId] = useState(initialNextIds.clientId);
  const [newTenantId, setNewTenantId] = useState(initialNextIds.tenantId);
  const [newClientName, setNewClientName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('Royal Wedding Reception');
  const [newEventDate, setNewEventDate] = useState('2026-12-18');
  const [newVenue, setNewVenue] = useState('Grand Imperial Lawns, New Delhi');
  const [newGuestPax, setNewGuestPax] = useState<number>(450);
  const [createdDispatchAlert, setCreatedDispatchAlert] =
    useState<AdminOtpDispatchRecord | null>(null);

  const cleanDraftClientId = newClientId.trim().toUpperCase();
  const cleanDraftTenantId = newTenantId.trim().toUpperCase();
  const draftMobileDigits = normalizePhoneDigits(newMobile);
  const reservedAdminIds = ['ADMIN-MASTER', 'MASTER-ADMIN', 'TENANT-ADMIN'];

  const isDuplicateClientId =
    Boolean(cleanDraftClientId) &&
    (reservedAdminIds.includes(cleanDraftClientId) ||
      clientTenants.some(
        (t) =>
          t.clientId.trim().toUpperCase() === cleanDraftClientId ||
          t.tenantId.trim().toUpperCase() === cleanDraftClientId
      ));

  const isDuplicateTenantId =
    Boolean(cleanDraftTenantId) &&
    (reservedAdminIds.includes(cleanDraftTenantId) ||
      clientTenants.some(
        (t) =>
          t.tenantId.trim().toUpperCase() === cleanDraftTenantId ||
          t.clientId.trim().toUpperCase() === cleanDraftTenantId
      ));

  const isDuplicateMobile =
    draftMobileDigits.length === 10 &&
    (draftMobileDigits === '9810199200' ||
      clientTenants.some(
        (t) => normalizePhoneDigits(t.mobileNumber) === draftMobileDigits
      ));

  useEffect(() => {
    setActiveTab(initialMode);
    if (initialMode === 'admin-2fa') {
      setIdentifierInput('ADMIN-MASTER');
    }
  }, [initialMode]);

  const matchedRecord = findMatchingTenantOrAdmin(
    identifierInput,
    clientTenants
  );

  // Clear OTP input whenever the identifier stops matching or switches to a different tenant
  useEffect(() => {
    setOtpInput('');
    setShowOtp(false);
    setErrorMsg(null);
  }, [
    matchedRecord?.kind,
    matchedRecord?.kind === 'client' ? matchedRecord.tenant.clientId : '',
  ]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedRecord) {
      setErrorMsg(
        'Please enter a valid Unique Client ID (client_id / tenant_id) or Registered Mobile Number first to unlock OTP verification.'
      );
      return;
    }

    const cleanOtp = otpInput.trim();
    if (matchedRecord.kind === 'client') {
      if (
        cleanOtp !== matchedRecord.tenant.otpCode &&
        cleanOtp !== masterOtp
      ) {
        setErrorMsg(
          `Invalid 6-Digit OTP for ${matchedRecord.tenant.clientId} (${matchedRecord.tenant.clientName}). Check the OTP sent into Admin 2FA Login Dashboard (${matchedRecord.tenant.otpCode}).`
        );
        return;
      }
      setErrorMsg(null);
      if (onSuccessClientLogin) {
        onSuccessClientLogin(matchedRecord.tenant);
      } else {
        onSuccessLogin();
      }
      return;
    }

    if (matchedRecord.kind === 'admin') {
      if (cleanOtp !== masterOtp) {
        setErrorMsg(
          'Invalid 6-Digit Master Admin OTP Code. Please enter the valid 6-digit Master OTP.'
        );
        return;
      }
      setErrorMsg(null);
      onSuccessLogin();
    }
  };

  const handleCreateNewTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanClientId = newClientId.trim().toUpperCase();
    const cleanTenantId = newTenantId.trim().toUpperCase();
    if (!newClientName.trim() || !newMobile.trim()) {
      setErrorMsg(
        'Please enter Client / Host Full Name and Registered 10-Digit Mobile Number to create a new client_id / tenant_id.'
      );
      return;
    }

    const uniqueError = validateUniqueClientTenantRegistration(
      cleanClientId,
      cleanTenantId,
      newMobile,
      clientTenants
    );
    if (uniqueError) {
      setErrorMsg(uniqueError);
      return;
    }

    // Generate 6-digit OTP to send into Admin 2FA Login Dashboard
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    const nowStr = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const createdTenant: ClientTenant = {
      clientId: cleanClientId,
      tenantId: cleanTenantId,
      clientName: newClientName.trim(),
      mobileNumber: newMobile.trim(),
      otpCode: generatedOtp,
      eventTitle: newEventTitle.trim() || 'Royal Wedding Banquet',
      eventDate: newEventDate || '2026-12-18',
      venue: newVenue.trim() || 'Grand Imperial Lawns, New Delhi',
      guestPax: Math.max(25, Number(newGuestPax) || 400),
      dietaryPreference: 'Pure Veg · Custom Tenant Protocol',
      gstin: '07AABCT2026C1Z9',
      selectedDishIds: ['dish-1', 'dish-2', 'dish-3', 'dish-4', 'dish-5'],
    };

    const dispatchRecord: AdminOtpDispatchRecord = {
      id: `otp-disp-${Date.now()}`,
      clientId: cleanClientId,
      tenantId: cleanTenantId,
      clientName: createdTenant.clientName,
      mobileNumber: createdTenant.mobileNumber,
      otpCode: generatedOtp,
      eventTitle: createdTenant.eventTitle,
      guestPax: createdTenant.guestPax,
      dispatchedAt: `Today · ${nowStr}`,
      isNew: true,
    };

    if (onCreateClientTenant) {
      onCreateClientTenant(createdTenant, dispatchRecord);
    }

    setCreatedDispatchAlert(dispatchRecord);
    setErrorMsg(null);
    const nextAvailable = getNextAvailableClientTenantIds([
      createdTenant,
      ...clientTenants,
    ]);
    setNewClientId(nextAvailable.clientId);
    setNewTenantId(nextAvailable.tenantId);
    setNewClientName('');
    setNewMobile('');
    setIdentifierInput(cleanClientId);
    setActiveTab('client-login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div
        className="rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl border-2 my-auto"
        style={{
          backgroundColor: '#0f2942',
          borderColor: '#ffd700',
          color: '#ffffff',
        }}
      >
        {/* Top Security Header with Combined Slash Button & Hover/Link New Create Tab */}
        <div
          className="px-6 py-4 border-b-2 flex flex-wrap items-center justify-between gap-3"
          style={{
            backgroundColor: '#091e3a',
            borderColor: '#ffd700',
            color: '#ffffff',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 border-2 flex flex-col items-center justify-center shrink-0 rounded-lg"
              style={{
                backgroundColor: '#ffd700',
                borderColor: '#ffffff',
                color: '#091e3a',
              }}
            >
              <span
                className="text-sm font-extrabold tracking-wider leading-none"
                style={{ color: '#091e3a' }}
              >
                TC
              </span>
              <span
                className="text-[10px] font-mono uppercase tracking-widest mt-0.5 font-bold"
                style={{ color: '#7a003c' }}
              >
                OTP
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#ffffff' }}>
                Client Login ID / Admin 2FA Login &amp; New `client_id` / `tenant_id` Tab
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Login"
                className="p-1.5 rounded hover:opacity-85 cursor-pointer"
                style={{
                  backgroundColor: '#7a003c',
                  color: '#ffffff',
                  border: '1px solid #ffd700',
                }}
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <Lock className="w-5 h-5 shrink-0" style={{ color: '#ffd700' }} />
            )}
          </div>
        </div>

        {/* TAB CONTENT 1: NEW CREATE TAB `client_id` / `tenant_id` */}
        {activeTab === 'create-tenant' ? (
          <form
            onSubmit={handleCreateNewTenantSubmit}
            className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto"
            style={{ backgroundColor: '#0f2942', color: '#ffffff' }}
          >
            <div
              className="rounded-xl p-4 border-2 space-y-3"
              style={{
                backgroundColor: '#091e3a',
                borderColor: '#38bdf8',
              }}
            >
              <div
                className="px-3 py-2 rounded-lg border text-xs font-mono font-bold"
                style={{
                  backgroundColor: '#06152d',
                  borderColor: '#ffd700',
                  color: '#ffff00',
                }}
              >
                One Unique `client_id` * , one Unique `tenant_id` * , one Registered 10-Digit Mobile Number * — can be registered only one time.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-mono font-bold mb-1"
                    style={{ color: '#ffd700' }}
                  >
                    Unique `client_id` *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientId}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setNewClientId(val);
                      setNewTenantId(val.replace(/^CLI-/, 'TENANT-'));
                      setErrorMsg(null);
                    }}
                    placeholder="e.g. CLI-ROYAL-05"
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg"
                    style={{
                      backgroundColor: '#06152d',
                      color: '#ffff00',
                      border: isDuplicateClientId
                        ? '2px solid #f87171'
                        : '2px solid #ffd700',
                    }}
                  />
                  {isDuplicateClientId && (
                    <p
                      className="text-[11px] font-bold mt-1"
                      style={{ color: '#f87171' }}
                    >
                      Already registered — Unique `client_id` * can be registered only one time.
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-mono font-bold mb-1"
                    style={{ color: '#ffd700' }}
                  >
                    Unique `tenant_id` *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTenantId}
                    onChange={(e) => {
                      setNewTenantId(e.target.value.toUpperCase());
                      setErrorMsg(null);
                    }}
                    placeholder="e.g. TENANT-ROYAL-05"
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg"
                    style={{
                      backgroundColor: '#06152d',
                      color: '#a7f3d0',
                      border: isDuplicateTenantId
                        ? '2px solid #f87171'
                        : '2px solid #38bdf8',
                    }}
                  />
                  {isDuplicateTenantId && (
                    <p
                      className="text-[11px] font-bold mt-1"
                      style={{ color: '#f87171' }}
                    >
                      Already registered — Unique `tenant_id` * can be registered only one time.
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-bold mb-1"
                    style={{ color: '#ffd700' }}
                  >
                    Client / Host Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => {
                      setNewClientName(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="e.g. Vikramaditya & Pooja Kapoor"
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg"
                    style={{
                      backgroundColor: '#06152d',
                      color: '#ffffff',
                      border: '2px solid #38bdf8',
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-bold mb-1"
                    style={{ color: '#ffd700' }}
                  >
                    Registered 10-Digit Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMobile}
                    onChange={(e) => {
                      setNewMobile(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="e.g. +91 98115 22334"
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg"
                    style={{
                      backgroundColor: '#06152d',
                      color: '#ffff00',
                      border: isDuplicateMobile
                        ? '2px solid #f87171'
                        : '2px solid #38bdf8',
                    }}
                  />
                  {isDuplicateMobile && (
                    <p
                      className="text-[11px] font-bold mt-1"
                      style={{ color: '#f87171' }}
                    >
                      Already registered — Registered 10-Digit Mobile Number * can be registered only one time.
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-bold mb-1"
                    style={{ color: '#ffd700' }}
                  >
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g. Grand Marwari Sangeet"
                    className="w-full px-3 py-2 text-sm font-bold rounded-lg"
                    style={{
                      backgroundColor: '#06152d',
                      color: '#ffffff',
                      border: '1.5px solid #38bdf8',
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      className="block text-xs font-bold mb-1"
                      style={{ color: '#ffd700' }}
                    >
                      Guest Pax
                    </label>
                    <input
                      type="number"
                      min={25}
                      value={newGuestPax}
                      onChange={(e) =>
                        setNewGuestPax(Math.max(25, Number(e.target.value) || 100))
                      }
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg"
                      style={{
                        backgroundColor: '#06152d',
                        color: '#ffff00',
                        border: '1.5px solid #38bdf8',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-bold mb-1"
                      style={{ color: '#ffd700' }}
                    >
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs font-mono font-bold rounded-lg"
                      style={{
                        backgroundColor: '#06152d',
                        color: '#ffffff',
                        border: '1.5px solid #38bdf8',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-bold mb-1"
                  style={{ color: '#ffd700' }}
                >
                  Banquet Venue / Lawn
                </label>
                <input
                  type="text"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder="e.g. Grand Imperial Lawns, New Delhi"
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg"
                  style={{
                    backgroundColor: '#06152d',
                    color: '#ffffff',
                    border: '1.5px solid #38bdf8',
                  }}
                />
              </div>

              {errorMsg && (
                <div
                  className="p-2.5 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: '#5c1111',
                    border: '1.5px solid #f87171',
                    color: '#ffff00',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: '#ffd700',
                  color: '#000000',
                  border: '2px solid #ffffff',
                }}
              >
                <Sparkles className="w-4 h-4" style={{ color: '#000000' }} />
                <span style={{ color: '#000000', fontWeight: 800 }}>
                  Create New `client_id` / `tenant_id` &amp; Send OTP to Admin 2FA Login Dashboard
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* TAB CONTENT 2: CLIENT LOGIN ID / ADMIN 2FA LOGIN */
          <form
            onSubmit={handleVerify}
            className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto"
            style={{ backgroundColor: '#0f2942', color: '#ffffff' }}
          >
            {/* STEP 1: client_id / tenant_id OR Mobile Number */}
            {activeTab === 'client-login' && (
              <div
                className="rounded-lg p-4 border-2 space-y-3"
                style={{
                  backgroundColor: '#091e3a',
                  borderColor: matchedRecord ? '#34d399' : '#ffd700',
                }}
              >
                <label
                  htmlFor="tenant-client-id-input"
                  className="block text-sm font-bold"
                  style={{ color: '#ffd700' }}
                >
                  Step 1: Enter Unique `client_id` / `tenant_id` or Mobile Number *
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="tenant-client-id-input"
                    type="text"
                    required
                    autoFocus
                    value={identifierInput}
                    onChange={(e) => {
                      setIdentifierInput(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Type client_id (e.g. CLI-SINGHANIA-01) or Mobile (e.g. 9811044291)"
                    className="flex-1 px-3.5 py-2.5 text-sm font-mono font-bold rounded-lg focus:outline-none"
                    style={{
                      backgroundColor: '#06152d',
                      color: '#ffff00',
                      border: '2px solid #38bdf8',
                    }}
                  />
                  {identifierInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifierInput('');
                        setOtpInput('');
                        setErrorMsg(null);
                      }}
                      className="px-3 py-2 text-xs font-bold rounded-lg cursor-pointer shrink-0"
                      style={{
                        backgroundColor: '#7a003c',
                        color: '#ffffff',
                        border: '1px solid #ffd700',
                      }}
                    >
                      Clear ID
                    </button>
                  )}
                </div>

                {!matchedRecord && (
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 text-sm font-bold rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      backgroundColor: '#ffd700',
                      color: '#000000',
                      border: '2px solid #ffffff',
                    }}
                  >
                    <ShieldCheck
                      className="w-4 h-4"
                      style={{ color: '#000000' }}
                    />
                    <span style={{ color: '#000000', fontWeight: 800 }}>
                      Client Login (OTP Dispatched to Admin 2FA)
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* STEP 2: OTP ENTRY OPTION — ONLY RENDERED WHEN VALID ID / MOBILE IS ENTERED */}
            {matchedRecord && (
              <div
                className="rounded-lg p-4 border-2 space-y-3"
                style={{
                  backgroundColor: '#064e3b',
                  borderColor: '#34d399',
                  color: '#ffffff',
                }}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="dev-master-otp"
                      className="block text-sm font-bold"
                      style={{ color: '#ffff00' }}
                    >
                      {matchedRecord.kind === 'client'
                        ? `Step 2: Enter 6-Digit Client OTP Dispatched to Admin 2FA (${matchedRecord.tenant.clientId}) *`
                        : 'Enter 6-Digit OTP Code for ADMIN-MASTER *'}
                    </label>
                    {matchedRecord.kind === 'client' && (
                      <button
                        type="button"
                        onClick={() => setShowOtp((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold cursor-pointer"
                        style={{
                          backgroundColor: '#ffd700',
                          color: '#000000',
                          border: '1.5px solid #ffffff',
                        }}
                      >
                        {showOtp ? (
                          <EyeOff className="w-3.5 h-3.5" style={{ color: '#000000' }} />
                        ) : (
                          <Eye className="w-3.5 h-3.5" style={{ color: '#000000' }} />
                        )}
                        <span>
                          {showOtp
                            ? `Hide OTP (${matchedRecord.tenant.otpCode})`
                            : 'View OTP'}
                        </span>
                      </button>
                    )}
                  </div>

                  {matchedRecord.kind === 'client' && showOtp && (
                    <div
                      className="mb-2 p-2.5 rounded-lg border flex items-center justify-between text-xs font-mono font-bold"
                      style={{
                        backgroundColor: '#091e3a',
                        borderColor: '#ffd700',
                        color: '#ffffff',
                      }}
                    >
                      <span>
                        6-Digit OTP Code:{' '}
                        <strong
                          className="px-2 py-0.5 rounded text-sm ml-1"
                          style={{ backgroundColor: '#ffd700', color: '#000000' }}
                        >
                          {matchedRecord.tenant.otpCode}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpInput(matchedRecord.tenant.otpCode)}
                        className="px-2.5 py-1 rounded text-xs font-bold cursor-pointer"
                        style={{
                          backgroundColor: '#ffd700',
                          color: '#000000',
                        }}
                      >
                        Use OTP
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      id="dev-master-otp"
                      type={showOtp ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoFocus
                      autoComplete="new-password"
                      value={otpInput}
                      onChange={(e) => {
                        setOtpInput(e.target.value.replace(/\D/g, ''));
                        setErrorMsg(null);
                      }}
                      placeholder={showOtp ? '123456' : '••••••'}
                      className="w-full px-3.5 py-2.5 text-lg font-mono font-bold tracking-[0.35em] text-center rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: '#091e3a',
                        color: '#ffff00',
                        border: '2px solid #ffd700',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOtp((prev) => !prev)}
                      aria-label={showOtp ? 'Hide OTP' : 'View OTP'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded cursor-pointer"
                      style={{ color: '#ffd700' }}
                    >
                      {showOtp ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-sm font-bold rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: '#ffd700',
                    color: '#000000',
                    border: '2px solid #ffffff',
                  }}
                >
                  <ShieldCheck
                    className="w-4 h-4"
                    style={{ color: '#000000' }}
                  />
                  <span style={{ color: '#000000', fontWeight: 800 }}>
                    {matchedRecord.kind === 'client'
                      ? `Client Login (OTP Dispatched to Admin 2FA)`
                      : 'Verify Master OTP & Unlock All 12 Admin Modules'}
                  </span>
                </button>
              </div>
            )}

            {errorMsg && (
              <div
                className="p-3 rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: '#5c1111',
                  border: '2px solid #f87171',
                  color: '#ffff00',
                }}
              >
                {errorMsg}
              </div>
            )}

            {onOpenCustomerPage && (
              <div
                className="pt-3 border-t"
                style={{ borderColor: 'rgba(255, 215, 0, 0.35)' }}
              >
                <button
                  type="button"
                  onClick={onOpenCustomerPage}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: '#091e3a',
                    color: '#ffffff',
                    border: '1.5px solid #38bdf8',
                  }}
                >
                  Open Public Menu Catalog (Browse Only)
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

  
interface Developer2FAActionModalProps {
  actionLabel: string;
  masterOtp: string;
  clientTenants?: ClientTenant[];
  onConfirmAction: () => void;
  onCancel: () => void;
}

export const StenStudio2FAActionModal: React.FC<
  Developer2FAActionModalProps
> = ({
  actionLabel,
  masterOtp,
  clientTenants = INITIAL_CLIENT_TENANTS,
  onConfirmAction,
  onCancel,
}) => {
  const [identifierInput, setIdentifierInput] = useState('ADMIN-MASTER');
  const [otpInput, setOtpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const matchedRecord = findMatchingTenantOrAdmin(
    identifierInput,
    clientTenants
  );

  useEffect(() => {
    setOtpInput('');
    setErrorMsg(null);
  }, [actionLabel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedRecord) {
      setErrorMsg('Please enter a valid Admin or Client ID first.');
      return;
    }
    if (otpInput.trim() !== masterOtp) {
      setErrorMsg(
        'Incorrect 6-Digit Developer Master OTP Code. Verification failed.'
      );
      return;
    }
    onConfirmAction();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div
        className="rounded-xl max-w-md w-full overflow-hidden shadow-2xl border-2"
        style={{
          backgroundColor: '#0f2942',
          borderColor: '#ffd700',
          color: '#ffffff',
        }}
      >
        <div
          className="px-5 py-4 border-b-2 flex items-center justify-between gap-3"
          style={{
            backgroundColor: '#091e3a',
            borderColor: '#ffd700',
            color: '#ffffff',
          }}
        >
          <div className="flex items-center gap-2.5">
            <KeyRound
              className="w-5 h-5 shrink-0"
              style={{ color: '#ffd700' }}
            />
            <div>
              <div
                className="text-xs font-mono uppercase tracking-widest font-bold"
                style={{ color: '#ffd700' }}
              >
                Developer 2FA Gate
              </div>
              <h3 className="text-base font-bold" style={{ color: '#ffffff' }}>
                Authorize Protected Developer Action
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel 2FA verification"
            className="p-1.5 rounded hover:opacity-85 cursor-pointer"
            style={{
              backgroundColor: '#7a003c',
              color: '#ffffff',
              border: '1px solid #ffd700',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4"
          style={{ backgroundColor: '#0f2942', color: '#ffffff' }}
        >
          <div
            className="rounded-lg p-3 text-xs border-2"
            style={{
              backgroundColor: '#091e3a',
              borderColor: '#38bdf8',
              color: '#ffffff',
            }}
          >
            <span
              className="text-xs font-mono uppercase tracking-wider font-bold block"
              style={{ color: '#ffd700' }}
            >
              Action Requiring 2FA Login:
            </span>
            <span
              className="font-bold mt-0.5 block"
              style={{ color: '#ffffff' }}
            >
              {actionLabel}
            </span>
          </div>

          <div>
            <label
              htmlFor="dev-action-id"
              className="block text-sm font-bold mb-1"
              style={{ color: '#ffd700' }}
            >
              Admin / Tenant ID (`client_id` / Mobile) *
            </label>
            <input
              id="dev-action-id"
              type="text"
              required
              value={identifierInput}
              onChange={(e) => {
                setIdentifierInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="ADMIN-MASTER or +91 98101 99200"
              className="w-full px-3.5 py-2 text-sm font-mono font-bold rounded-lg focus:outline-none"
              style={{
                backgroundColor: '#091e3a',
                color: '#ffff00',
                border: '2px solid #38bdf8',
              }}
            />
          </div>

          {matchedRecord ? (
            <div>
              <label
                htmlFor="dev-action-otp"
                className="block text-sm font-bold mb-1"
                style={{ color: '#ffd700' }}
              >
                Enter 6-Digit Developer Master OTP Code *
              </label>
              <input
                id="dev-action-otp"
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                autoComplete="new-password"
                value={otpInput}
                onChange={(e) => {
                  setOtpInput(e.target.value.replace(/\D/g, ''));
                  setErrorMsg(null);
                }}
                placeholder="••••••"
                className="w-full px-3.5 py-2 text-lg font-mono font-bold tracking-[0.35em] text-center rounded-lg focus:outline-none"
                style={{
                  backgroundColor: '#091e3a',
                  color: '#ffff00',
                  border: '2px solid #ffd700',
                }}
              />
            </div>
          ) : (
            <div
              className="p-3 rounded-lg text-xs font-bold"
              style={{
                backgroundColor: '#5c1111',
                border: '1.5px solid #f87171',
                color: '#ffff00',
              }}
            >
              Enter a valid Admin ID (e.g. ADMIN-MASTER) or Registered Mobile
              Number above to unlock OTP input.
            </div>
          )}

          {errorMsg && (
            <div
              className="p-3 rounded-lg text-xs font-bold"
              style={{
                backgroundColor: '#5c1111',
                border: '2px solid #f87171',
                color: '#ffff00',
              }}
            >
              {errorMsg}
            </div>
          )}

          <div
            className="flex items-center justify-end gap-2 pt-3 border-t"
            style={{ borderColor: 'rgba(255, 215, 0, 0.35)' }}
          >
            <button
              type="button"
              onClick={onCancel}
              className="text-xs py-2 px-3.5 rounded-lg font-bold cursor-pointer"
              style={{
                backgroundColor: '#7a003c',
                color: '#ffffff',
                border: '1.5px solid #ffffff',
              }}
            >
              Cancel
            </button>
            {matchedRecord && (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-xs py-2 px-4 rounded-lg font-bold cursor-pointer"
                style={{
                  backgroundColor: '#ffd700',
                  color: '#091e3a',
                  border: '2px solid #ffffff',
                }}
              >
                <ShieldCheck className="w-4 h-4" style={{ color: '#091e3a' }} />
                <span style={{ color: '#091e3a', fontWeight: 700 }}>
                  Verify 2FA &amp; Unlock Session
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
