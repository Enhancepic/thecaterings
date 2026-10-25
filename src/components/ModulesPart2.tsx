import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Check,
  Calendar,
  Flame,
  Scale,
  MessageSquare,
  X,
} from 'lucide-react';
import {
  CrmLead,
  ProposalQuote,
  BanquetEvent,
  KotTicket,
  DishItem,
  INITIAL_VENUE_HALLS,
} from '../data/initialData';

/* ============================================================================
   LEAD & INQUIRY CRM
   ============================================================================ */
interface Module04CrmLeadsProps {
  leads: CrmLead[];
  onAddLead: (lead: Omit<CrmLead, 'id'>) => void;
  onDeleteLead: (id: string, clientName: string) => void;
  onUpdateLeadStage: (id: string, stage: CrmLead['stage']) => void;
}

export const Module04CrmLeads: React.FC<Module04CrmLeadsProps> = ({
  leads,
  onAddLead,
  onDeleteLead,
  onUpdateLeadStage,
}) => {
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [showAddForm, setShowAddForm] = useState(false);

  const [clientName, setClientName] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-12-14');
  const [venue, setVenue] = useState('Grand Imperial Lawns');
  const [guestPax, setGuestPax] = useState(400);
  const [targetRate, setTargetRate] = useState(1050);
  const [phone, setPhone] = useState('+91 98111 00234');
  const [dietaryPreference] = useState('Pure Veg · Jain Counter');

  const filteredLeads = leads.filter(
    (l) => stageFilter === 'All' || l.stage === stageFilter
  );

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !eventTitle.trim()) return;
    onAddLead({
      code: `LD-2026-0${leads.length + 1}`,
      clientName: clientName.trim(),
      eventTitle: eventTitle.trim(),
      eventDate,
      venue: venue.trim(),
      guestPax: Number(guestPax) || 300,
      targetRatePerPlate: Number(targetRate) || 950,
      stage: 'New Inquiry',
      phone: phone.trim(),
      dietaryPreference: dietaryPreference.trim(),
    });
    setClientName('');
    setEventTitle('');
    setShowAddForm(false);
  };

  const totalPipelineValue = filteredLeads.reduce(
    (acc, l) => acc + l.guestPax * l.targetRatePerPlate,
    0
  );

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {(
            [
              'All',
              'New Inquiry',
              'Tasting Scheduled',
              'Quote Sent',
              'Advance Received',
            ] as const
          ).map((st) => {
            const isActive = stageFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStageFilter(st)}
                className="px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                style={
                  isActive
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
                {st}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-mono tabular-nums text-slate-600">
            Pipeline:{' '}
            <strong className="text-slate-900">
              ₹{totalPipelineValue.toLocaleString('en-IN')}
            </strong>
          </span>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            aria-label={showAddForm ? 'Close Lead Form' : 'Add Inquiry Lead'}
            title={showAddForm ? 'Close Lead Form' : 'Add Inquiry Lead'}
            className="inline-flex items-center justify-center w-8 h-8 text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {showAddForm ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreateLead}
          className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Client / Family Name
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Vikram & Neha Bansal"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Event Occasion
            </label>
            <input
              type="text"
              required
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g. Royal Sangeet & Dinner"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Event Date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Venue / Lawn
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Expected Guests (Pax)
            </label>
            <input
              type="number"
              value={guestPax}
              onChange={(e) => setGuestPax(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Rate / Plate (₹)
            </label>
            <input
              type="number"
              value={targetRate}
              onChange={(e) => setTargetRate(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full px-4 py-1.5 text-xs font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 cursor-pointer"
            >
              Save Inquiry Lead
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Lead Code &amp; client_id</th>
                <th className="py-3 px-4">Client &amp; Occasion</th>
                <th className="py-3 px-4">Venue &amp; Dietary</th>
                <th className="py-3 px-4 text-right">Pax &amp; Rate</th>
                <th className="py-3 px-4 text-right">Est. Revenue</th>
                <th className="py-3 px-4">CRM Stage</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredLeads.map((lead) => {
                const estTotal = lead.guestPax * lead.targetRatePerPlate;
                return (
                  <tr
                    key={lead.id}
                    className="crm-lead-row hover-highlight-row transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                      <div>{lead.code}</div>
                      {lead.clientId && (
                        <div className="font-bold text-amber-800">
                          {lead.clientId}
                        </div>
                      )}
                      <div className="text-slate-400">{lead.eventDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">
                        {lead.clientName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lead.eventTitle} · {lead.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <p className="text-slate-800">{lead.venue}</p>
                      <p className="text-slate-500">{lead.dietaryPreference}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                      <div>{lead.guestPax} Pax</div>
                      <div className="text-slate-500">
                        @ ₹{lead.targetRatePerPlate}/plate
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      ₹{estTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={lead.stage}
                        onChange={(e) =>
                          onUpdateLeadStage(
                            lead.id,
                            e.target.value as CrmLead['stage']
                          )
                        }
                        aria-label={`Stage for ${lead.clientName}`}
                        className="crm-stage-select px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer"
                      >
                        <option value="New Inquiry">New Inquiry</option>
                        <option value="Tasting Scheduled">
                          Tasting Scheduled
                        </option>
                        <option value="Quote Sent">Quote Sent</option>
                        <option value="Advance Received">
                          Advance Received
                        </option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteLead(lead.id, lead.clientName)}
                        aria-label={`Delete lead ${lead.clientName}`}
                        title="Delete Lead"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   PROPOSALS & WHATSAPP QUOTE
   ============================================================================ */
interface Module05ProposalsWhatsappProps {
  proposals: ProposalQuote[];
  onAddProposal: (proposal: Omit<ProposalQuote, 'id'>) => void;
  onDeleteProposal: (id: string, quoteNo: string) => void;
}

export const Module05ProposalsWhatsapp: React.FC<
  Module05ProposalsWhatsappProps
> = ({ proposals, onAddProposal, onDeleteProposal }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [clientName, setClientName] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [tier, setTier] = useState<ProposalQuote['tier']>('Royal Platinum');
  const [guestPax, setGuestPax] = useState(500);
  const [ratePerPlate, setRatePerPlate] = useState(1180);
  const [gstPercent] = useState<5 | 18>(5);
  const [highlights] = useState(
    '5 Live Counters · 7 Starters · Copper Handi Dal Makhani · Live Rabri Jalebi'
  );

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    onAddProposal({
      quoteNo: `QT-2026-${885 + proposals.length}`,
      clientName: clientName.trim(),
      eventTitle: eventTitle.trim() || 'Royal Wedding Banquet',
      tier,
      guestPax: Number(guestPax) || 400,
      ratePerPlate: Number(ratePerPlate) || 1000,
      gstPercent,
      validUntil: '2026-11-15',
      status: 'Sent via WhatsApp',
      highlights: highlights.trim(),
    });
    setClientName('');
    setEventTitle('');
    setShowForm(false);
  };

  const buildWhatsappText = (p: ProposalQuote) => {
    const subtotal = p.guestPax * p.ratePerPlate;
    const gstAmt = Math.round((subtotal * p.gstPercent) / 100);
    const grandTotal = subtotal + gstAmt;
    return `*THECATERINGS ROYAL CATERING PROPOSAL (${p.quoteNo})*\nNamaste ${
      p.clientName
    },\nEvent: ${p.eventTitle}\nPackage Tier: ${p.tier}\nGuaranteed Pax: ${
      p.guestPax
    } Guests\nRate: ₹${p.ratePerPlate}/plate\nMenu Highlights: ${
      p.highlights
    }\nTaxable Subtotal: ₹${subtotal.toLocaleString('en-IN')}\nGST (${
      p.gstPercent
    }% SAC 996333): ₹${gstAmt.toLocaleString(
      'en-IN'
    )}\n*Grand Total: ₹${grandTotal.toLocaleString(
      'en-IN'
    )}*\nPay via Indian UPI: payments@thecaterings.upi | Razorpay | PayPal: paypal.me/TheCaterings`;
  };

  const handleCopyQuote = (p: ProposalQuote) => {
    const text = buildWhatsappText(p);
    navigator.clipboard?.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            TheCaterings Proposals &amp; Instant WhatsApp Quote Generator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate tiered per-plate quotes with SAC 996333 GST breakdown and copy formatted WhatsApp messages.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            aria-label={showForm ? 'Close Form' : 'Create Proposal Quote'}
            title={showForm ? 'Close Form' : 'Create Proposal Quote'}
            className="inline-flex items-center justify-center w-8 h-8 text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {showForm ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateProposal}
          className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Client Name
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Rajeshwar Jindal Family"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g. Grand Reception Dinner"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Package Tier
            </label>
            <select
              value={tier}
              onChange={(e) =>
                setTier(e.target.value as ProposalQuote['tier'])
              }
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            >
              <option value="Royal Platinum">Royal Platinum</option>
              <option value="Heritage Gold">Heritage Gold</option>
              <option value="Classic Silver">Classic Silver</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Guest Pax
            </label>
            <input
              type="number"
              value={guestPax}
              onChange={(e) => setGuestPax(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Rate / Plate (₹)
            </label>
            <input
              type="number"
              value={ratePerPlate}
              onChange={(e) => setRatePerPlate(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full px-4 py-1.5 text-xs font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 cursor-pointer"
            >
              Save Proposal
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {proposals.map((prop) => {
          const subtotal = prop.guestPax * prop.ratePerPlate;
          const gstAmt = Math.round((subtotal * prop.gstPercent) / 100);
          const grandTotal = subtotal + gstAmt;

          return (
            <div
              key={prop.id}
              className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono">{prop.quoteNo}</span>
                      {prop.clientId && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono font-bold text-amber-800">
                            {prop.clientId}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{prop.tier}</span>
                      <span aria-hidden="true">·</span>
                      <span>{prop.status}</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mt-1">
                      {prop.clientName} — {prop.eventTitle}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteProposal(prop.id, prop.quoteNo)}
                    aria-label={`Delete proposal ${prop.quoteNo}`}
                    title="Delete Proposal"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600">{prop.highlights}</p>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono tabular-nums text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {prop.guestPax} Pax × ₹{prop.ratePerPlate}/plate:
                    </span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST ({prop.gstPercent}% SAC 996333):</span>
                    <span>₹{gstAmt.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-semibold pt-1 border-t border-slate-200">
                    <span>Total Proposal Value:</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-mono">
                  Valid till {prop.validUntil}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyQuote(prop)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  {copiedId === prop.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>WhatsApp Text Copied</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Copy WhatsApp Quote</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   BANQUET & EVENT CALENDAR
   ============================================================================ */
interface Module06BanquetCalendarProps {
  events: BanquetEvent[];
  venueHalls?: string[];
  onAddEvent: (ev: Omit<BanquetEvent, 'id'>) => void;
  onDeleteEvent: (id: string, eventName: string) => void;
  onAddVenueHall?: (hallName: string) => void;
  onDeleteVenueHall?: (hallName: string) => void;
  onUpdateEventVenue?: (eventId: string, venueHall: string) => void;
  onUpdateEventStatus?: (eventId: string, status: BanquetEvent['status']) => void;
}

export const Module06BanquetCalendar: React.FC<
  Module06BanquetCalendarProps
> = ({
  events,
  venueHalls = INITIAL_VENUE_HALLS,
  onAddEvent,
  onDeleteEvent,
  onAddVenueHall,
  onDeleteVenueHall,
  onUpdateEventVenue,
  onUpdateEventStatus,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showAddHallBar, setShowAddHallBar] = useState(true);
  const [newHallName, setNewHallName] = useState('');
  const [showInlineHallInput, setShowInlineHallInput] = useState(false);
  const [inlineHallName, setInlineHallName] = useState('');
  const [addingHallForEventId, setAddingHallForEventId] = useState<string | null>(
    null
  );
  const [eventCardNewHallName, setEventCardNewHallName] = useState('');
  const [selectedHallFilter, setSelectedHallFilter] = useState<string>('All');

  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState('2026-12-18');
  const [venueHall, setVenueHall] = useState(
    venueHalls[0] || 'Grand Imperial Lawns'
  );
  const [shift, setShift] = useState<BanquetEvent['shift']>(
    'Evening Reception (7 PM - 11:30 PM)'
  );
  const [guaranteedPax, setGuaranteedPax] = useState(550);
  const [headMaharaj, setHeadMaharaj] = useState('Maharaj Brijmohan Sharma');

  // Merge configured venueHalls with any custom halls already present on events
  const allVenueHalls = Array.from(
    new Set([
      ...venueHalls,
      ...events.map((ev) => ev.venueHall).filter(Boolean),
    ])
  );

  const handleAddHallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newHallName.trim();
    if (!trimmed) return;
    if (onAddVenueHall) {
      onAddVenueHall(trimmed);
    }
    setVenueHall(trimmed);
    setNewHallName('');
  };

  const handleInlineAddHall = () => {
    const trimmed = inlineHallName.trim();
    if (!trimmed) return;
    if (onAddVenueHall) {
      onAddVenueHall(trimmed);
    }
    setVenueHall(trimmed);
    setInlineHallName('');
    setShowInlineHallInput(false);
  };

  const handleEventCardAddHall = (eventId: string) => {
    const trimmed = eventCardNewHallName.trim();
    if (!trimmed) return;
    if (onAddVenueHall) {
      onAddVenueHall(trimmed);
    }
    if (onUpdateEventVenue) {
      onUpdateEventVenue(eventId, trimmed);
    }
    setEventCardNewHallName('');
    setAddingHallForEventId(null);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;
    const resolvedHall =
      showInlineHallInput && inlineHallName.trim()
        ? inlineHallName.trim()
        : venueHall || allVenueHalls[0] || 'Grand Imperial Lawns';
    if (showInlineHallInput && inlineHallName.trim() && onAddVenueHall) {
      onAddVenueHall(inlineHallName.trim());
    }
    onAddEvent({
      bookingCode: `BNQ-${501 + events.length}`,
      eventName: eventName.trim(),
      clientName: clientName.trim() || 'Royal Host Family',
      eventDate,
      shift,
      venueHall: resolvedHall,
      guaranteedPax: Number(guaranteedPax) || 350,
      headMaharaj,
      status: 'Confirmed',
    });
    setEventName('');
    setClientName('');
    setInlineHallName('');
    setShowInlineHallInput(false);
    setShowForm(false);
  };

  const filteredEvents =
    selectedHallFilter === 'All'
      ? events
      : events.filter((ev) => ev.venueHall === selectedHallFilter);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-amber-700" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              TheCaterings Muhurat &amp; Banquet Hall Allocation Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Manage venue hall shifts, guaranteed guest pax, and Head Maharaj assignments.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddHallBar((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Venue Hall</span>
          </button>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            aria-label={showForm ? 'Close Form' : 'Book Banquet Event'}
            title={showForm ? 'Close Form' : 'Book Banquet Event'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {showForm ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Book Event</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Venue Hall Directory & Quick Add Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Venue Hall Allocation &amp; Add New Hall ({allVenueHalls.length} Halls)
            </h3>
            <p className="text-[11px] text-slate-500">
              Add new Banquet Halls, Lawns, Ballrooms, or Mandaps below and filter schedule by hall.
            </p>
          </div>

          {showAddHallBar && (
            <form
              onSubmit={handleAddHallSubmit}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <input
                type="text"
                value={newHallName}
                onChange={(e) => setNewHallName(e.target.value)}
                placeholder="Enter new Venue Hall name (e.g. Royal Sheesh Mahal)..."
                className="w-full sm:w-64 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-amber-600"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Venue Hall</span>
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setSelectedHallFilter('All')}
            className="px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer"
            style={
              selectedHallFilter === 'All'
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
            All Venue Halls ({events.length})
          </button>

          {allVenueHalls.map((hall) => {
            const count = events.filter((ev) => ev.venueHall === hall).length;
            const isSelected = selectedHallFilter === hall;
            return (
              <div
                key={hall}
                className="inline-flex items-center rounded-md text-xs font-bold transition-colors"
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
                <button
                  type="button"
                  onClick={() => setSelectedHallFilter(hall)}
                  className="px-2.5 py-1 font-bold cursor-pointer"
                  style={{ color: isSelected ? '#091e3a' : '#ffffff' }}
                >
                  {hall}{' '}
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: isSelected ? '#7a003c' : '#ffd700' }}
                  >
                    ({count})
                  </span>
                </button>
                {onDeleteVenueHall && allVenueHalls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedHallFilter === hall) {
                        setSelectedHallFilter('All');
                      }
                      onDeleteVenueHall(hall);
                    }}
                    title={`Remove Venue Hall "${hall}"`}
                    className="pr-2 pl-1 py-1 hover:opacity-100 opacity-90 cursor-pointer"
                    style={{ color: isSelected ? '#7a003c' : '#ffff00' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateEvent}
          className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Agarwal Royal Baraat & Dinner"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Host Client Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Kamal Agarwal"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Muhurat Date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Venue Hall
              </label>
              <button
                type="button"
                onClick={() => setShowInlineHallInput((prev) => !prev)}
                className="text-[11px] font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{showInlineHallInput ? 'Select Existing' : 'Add New Hall'}</span>
              </button>
            </div>
            {showInlineHallInput ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={inlineHallName}
                  onChange={(e) => setInlineHallName(e.target.value)}
                  placeholder="New Venue Hall name..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-400 rounded-md"
                />
                <button
                  type="button"
                  onClick={handleInlineAddHall}
                  className="px-2.5 py-1.5 text-xs font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 shrink-0 cursor-pointer"
                >
                  Add
                </button>
              </div>
            ) : (
              <select
                value={venueHall}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW_HALL__') {
                    setShowInlineHallInput(true);
                  } else {
                    setVenueHall(e.target.value);
                  }
                }}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              >
                {allVenueHalls.map((hall) => (
                  <option key={hall} value={hall}>
                    {hall}
                  </option>
                ))}
                <option value="__ADD_NEW_HALL__">+ Add New Venue Hall...</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Shift Timing
            </label>
            <select
              value={shift}
              onChange={(e) =>
                setShift(e.target.value as BanquetEvent['shift'])
              }
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            >
              <option value="Morning Muhurat (11 AM - 4 PM)">
                Morning Muhurat (11 AM - 4 PM)
              </option>
              <option value="Evening Reception (7 PM - 11:30 PM)">
                Evening Reception (7 PM - 11:30 PM)
              </option>
              <option value="Full Day Royal (9 AM - 11 PM)">
                Full Day Royal (9 AM - 11 PM)
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Guaranteed Pax
            </label>
            <input
              type="number"
              value={guaranteedPax}
              onChange={(e) => setGuaranteedPax(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Assigned Head Maharaj
            </label>
            <input
              type="text"
              value={headMaharaj}
              onChange={(e) => setHeadMaharaj(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full px-4 py-1.5 text-xs font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 cursor-pointer"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((ev) => {
          const isAddingHallHere = addingHallForEventId === ev.id;
          return (
            <div
              key={ev.id}
              className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-800">
                      {ev.bookingCode}
                    </span>
                    {ev.clientId && (
                      <>
                        <span className="mx-1.5">·</span>
                        <span className="font-mono font-bold text-amber-800">
                          {ev.clientId}
                        </span>
                      </>
                    )}
                    <span className="mx-1.5">·</span>
                    <span className="font-mono">{ev.eventDate}</span>
                    <span className="mx-1.5">·</span>
                    {onUpdateEventStatus ? (
                      <select
                        value={ev.status}
                        onChange={(e) => onUpdateEventStatus(ev.id, e.target.value as BanquetEvent['status'])}
                        className="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-900 border border-amber-300 cursor-pointer"
                        title="Change Event Status (Completed sets staff to Standby)"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Tentative Hold">Tentative Hold</option>
                        <option value="Kitchen Prep Active">Kitchen Prep Active</option>
                        <option value="Completed">Completed (Event Finished)</option>
                      </select>
                    ) : (
                      <span>{ev.status}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteEvent(ev.id, ev.eventName)}
                    aria-label={`Delete event ${ev.eventName}`}
                    title="Delete Event"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-semibold text-slate-900">
                  {ev.eventName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span>Host: {ev.clientName}</span>
                  <span>·</span>
                  <div className="inline-flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-500">Venue Hall:</span>
                    {isAddingHallHere ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={eventCardNewHallName}
                          onChange={(e) =>
                            setEventCardNewHallName(e.target.value)
                          }
                          placeholder="Enter new Venue Hall..."
                          className="px-2 py-0.5 text-xs bg-white border border-amber-400 rounded focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleEventCardAddHall(ev.id)}
                          className="px-2 py-0.5 text-[11px] font-medium text-white bg-amber-700 rounded hover:bg-amber-800 cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingHallForEventId(null);
                            setEventCardNewHallName('');
                          }}
                          className="px-1.5 py-0.5 text-[11px] text-slate-500 hover:text-slate-700 border border-slate-200 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : onUpdateEventVenue ? (
                      <div className="inline-flex items-center gap-1">
                        <select
                          value={ev.venueHall}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW_HALL__') {
                              setAddingHallForEventId(ev.id);
                              setEventCardNewHallName('');
                            } else {
                              onUpdateEventVenue(ev.id, e.target.value);
                            }
                          }}
                          className="px-2 py-0.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded hover:border-amber-500 focus:outline-none focus:border-amber-600 cursor-pointer"
                        >
                          {allVenueHalls.map((hall) => (
                            <option key={hall} value={hall}>
                              {hall}
                            </option>
                          ))}
                          <option value="__ADD_NEW_HALL__">
                            + Add New Venue Hall...
                          </option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingHallForEventId(ev.id);
                            setEventCardNewHallName('');
                          }}
                          title="Add new Venue Hall for this event"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Hall</span>
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium text-slate-800">
                        {ev.venueHall}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">{ev.shift}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Lead Culinary: <strong>{ev.headMaharaj}</strong>
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {ev.guaranteedPax.toLocaleString('en-IN')} Guaranteed Pax
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   KITCHEN KOT & SCALING
   ============================================================================ */
interface Module07KitchenKotProps {
  kots: KotTicket[];
  dishes: DishItem[];
  onAddKot: (kot: Omit<KotTicket, 'id'>) => void;
  onDeleteKot: (id: string, kotNumber: string) => void;
  onUpdateKotStatus: (id: string, status: KotTicket['status']) => void;
  onConsumeKotIngredients?: (kotId: string) => void;
  onOpenImageModal: (dish: DishItem) => void;
  onDeleteDishImage: (dishId: string, dishName: string) => void;
}

export const Module07KitchenKot: React.FC<Module07KitchenKotProps> = ({
  kots,
  dishes,
  onAddKot,
  onDeleteKot,
  onUpdateKotStatus,
  onConsumeKotIngredients,
  onOpenImageModal,
  onDeleteDishImage,
}) => {
  const [scalingPax, setScalingPax] = useState<number>(650);
  const [showKotForm, setShowKotForm] = useState(false);

  const [eventName, setEventName] = useState(
    'Singhania Royal Wedding Reception'
  );
  const [selectedDishId, setSelectedDishId] = useState<string>(
    dishes[0]?.id || 'dish-1'
  );
  const [batchPax, setBatchPax] = useState<number>(650);
  const [dispatchTime] = useState('21:00 IST');
  const [assignedUstad, setAssignedUstad] = useState('Maharaj Brijmohan Sharma');

  const scaleMultiplier = scalingPax / 100;

  const handleCreateKot = (e: React.FormEvent) => {
    e.preventDefault();
    const dish = dishes.find((d) => d.id === selectedDishId) || dishes[0];
    onAddKot({
      kotNumber: `KOT-2026-${301 + kots.length}`,
      eventName: eventName.trim() || 'Royal Banquet Dispatch',
      station: dish ? dish.station : 'Tandoor Station',
      dishId: dish ? dish.id : 'dish-1',
      batchPax: Number(batchPax) || 500,
      dispatchTime,
      assignedUstad: assignedUstad.trim() || 'Kitchen Brigade',
      status: 'Queued',
    });
    setShowKotForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Live Kitchen Order Tickets Section */}
      <section
        className="kot-active-station-section bg-white rounded-lg p-5 space-y-4"
        style={{ border: 'none', boxShadow: 'none' }}
      >
        <div
          className="kot-active-station-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2"
          style={{ border: 'none', borderBottom: 'none', textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-amber-700" />
            <div>
              <h2
                className="text-base font-semibold text-slate-900"
                style={{ textDecoration: 'none', border: 'none' }}
              >
                TheCaterings Active Station Kitchen Order Tickets (KOT)
              </h2>
              <p
                className="text-xs text-slate-500"
                style={{ textDecoration: 'none', border: 'none' }}
              >
                Station-wise firing tickets with dish plating photos and icon-only controls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowKotForm((prev) => !prev)}
              aria-label={showKotForm ? 'Close KOT Form' : 'Issue Station KOT'}
              title={showKotForm ? 'Close KOT Form' : 'Issue Station KOT'}
              className="inline-flex items-center justify-center w-8 h-8 text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {showKotForm ? (
                <X className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {showKotForm && (
          <form
            onSubmit={handleCreateKot}
            className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dish to Fire
              </label>
              <select
                value={selectedDishId}
                onChange={(e) => setSelectedDishId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
              >
                {dishes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.station})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Batch Pax
              </label>
              <input
                type="number"
                value={batchPax}
                onChange={(e) => setBatchPax(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assigned Ustad / Maharaj
              </label>
              <input
                type="text"
                value={assignedUstad}
                onChange={(e) => setAssignedUstad(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="w-full px-3 py-1.5 text-xs font-medium text-white bg-amber-700 rounded hover:bg-amber-800 cursor-pointer"
              >
                Dispatch KOT
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kots.map((kot) => {
            const linkedDish = dishes.find((d) => d.id === kot.dishId);
            return (
              <div
                key={kot.id}
                className="border-2 rounded-lg p-4 flex flex-col justify-between gap-4 bg-white overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2 border-b border-amber-400/30">
                    <span className="font-mono font-bold text-slate-900">
                      {kot.kotNumber} · {kot.dispatchTime}
                    </span>
                    {kot.clientId && (
                      <span className="font-mono text-[11px] font-bold text-amber-800">
                        {kot.clientId}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      {kot.station} · {kot.eventName}
                    </p>
                    <h3 className="product-title mt-0.5">
                      {linkedDish ? linkedDish.name : 'Custom Banquet Batch'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Lead: {kot.assignedUstad} ·{' '}
                      <strong className="font-mono">
                        {kot.batchPax} Pax Batch
                      </strong>
                    </p>
                  </div>

                  {/* Live KOT Ingredient Consumption Breakdown — Pending Deduction Adjusted cleanly inside box */}
                  {linkedDish && linkedDish.ingredients.length > 0 && (
                    <div
                      className="rounded-lg p-3 space-y-2.5 overflow-hidden"
                      style={{
                        backgroundColor: '#0f2942',
                        border: '1.5px solid #38bdf8',
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#38bdf8]/35">
                        <span
                          className="font-bold uppercase tracking-wider"
                          style={{ color: '#ffd700' }}
                        >
                          KOT Ingredient Consumption
                        </span>
                        {kot.stockDeducted ? (
                          <span
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-md font-bold w-fit max-w-full"
                            style={{
                              backgroundColor: '#064e3b',
                              color: '#4ade80',
                              border: '1.5px solid #34d399',
                            }}
                          >
                            ✓ Stock Deducted
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-md font-bold w-fit max-w-full"
                            style={{
                              backgroundColor: '#091e3a',
                              color: '#ffff00',
                              border: '1.5px solid #ffd700',
                            }}
                          >
                            Pending Deduction
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 font-mono">
                        {linkedDish.ingredients.map((ing) => {
                          const reqQty = Number(
                            ((ing.qtyPer100Pax * kot.batchPax) / 100).toFixed(1)
                          );
                          return (
                            <div
                              key={ing.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="truncate font-sans text-slate-600">
                                {ing.name}
                              </span>
                              <span
                                className="font-bold shrink-0"
                                style={{ color: '#ffd700' }}
                              >
                                -{reqQty} {ing.unit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {onConsumeKotIngredients && (
                        <button
                          type="button"
                          onClick={() => onConsumeKotIngredients(kot.id)}
                          className="w-full mt-1 py-1.5 px-2.5 rounded-md font-bold border transition-colors cursor-pointer text-center"
                          style={
                            kot.stockDeducted
                              ? {
                                  backgroundColor: '#064e3b',
                                  color: '#ffffff',
                                  borderColor: '#34d399',
                                }
                              : {
                                  backgroundColor: '#ffd700',
                                  color: '#091e3a',
                                  borderColor: '#ffffff',
                                }
                          }
                        >
                          {kot.stockDeducted
                            ? 'Deducted from Ledger (Click to Re-Fire Batch)'
                            : 'Fire KOT & Deduct from Stock Ledger'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* KOT Status: Queued Adjusted cleanly inside box */}
                <div
                  className="p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2 w-full overflow-hidden"
                  style={{
                    backgroundColor: '#0f2942',
                    border: '1.5px solid #38bdf8',
                  }}
                >
                  <span
                    className="font-bold shrink-0"
                    style={{ color: '#ffd700' }}
                  >
                    KOT Status:
                  </span>
                  <select
                    value={kot.status}
                    onChange={(e) =>
                      onUpdateKotStatus(
                        kot.id,
                        e.target.value as KotTicket['status']
                      )
                    }
                    aria-label={`Status for ${kot.kotNumber}`}
                    className="flex-1 min-w-[140px] max-w-full px-2.5 py-1.5 font-bold rounded-md cursor-pointer"
                    style={{
                      backgroundColor: '#091e3a',
                      color: '#ffff00',
                      border: '1.5px solid #ffd700',
                    }}
                  >
                    <option value="Queued">Queued</option>
                    <option value="Firing on Range">Firing on Range</option>
                    <option value="Plated & Dispatched">
                      Plated &amp; Dispatched
                    </option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Automated Batch Ingredient Scaling Matrix */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-amber-700" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Automated Maharaj Indent &amp; Batch Scaling Calculator
              </h3>
              <p className="text-xs text-slate-500">
                Dynamically scales 100-pax baseline recipes to any banquet guest count.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="kot-scaling-pax"
              className="text-xs font-medium text-slate-700"
            >
              Target Guest Count (Pax):
            </label>
            <input
              id="kot-scaling-pax"
              type="number"
              min={50}
              step={50}
              value={scalingPax}
              onChange={(e) =>
                setScalingPax(Math.max(10, Number(e.target.value) || 100))
              }
              className="w-28 px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-md"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-4">Dish &amp; Station</th>
                <th className="py-2.5 px-4">
                  Scaled Raw Material Indent ({scalingPax} Pax)
                </th>
                <th className="py-2.5 px-4 text-right">Scaled Batch Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {dishes.slice(0, 12).map((dish) => {
                const scaledCost = Math.round(
                  dish.ingredients.reduce(
                    (s, i) => s + i.costPer100Pax * scaleMultiplier,
                    0
                  )
                );
                return (
                  <tr
                    key={dish.id}
                    className="scaling-indent-row hover-highlight-row transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="product-title">
                        {dish.name}
                      </div>
                      <p className="text-slate-500">
                        {dish.code} · {dish.station}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {dish.ingredients.map((ing, idx) => (
                        <span key={ing.id}>
                          {ing.name}:{' '}
                          <strong>
                            {(ing.qtyPer100Pax * scaleMultiplier).toFixed(1)}{' '}
                            {ing.unit}
                          </strong>
                          {idx < dish.ingredients.length - 1 ? ' · ' : ''}
                        </span>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ₹{scaledCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
