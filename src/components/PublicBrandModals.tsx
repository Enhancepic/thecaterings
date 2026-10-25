import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Utensils,
  Truck,
  PartyPopper,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Calendar,
  Users,
  Award,
  ShieldCheck,
  HeartHandshake,
  MessageSquare,
} from 'lucide-react';
import { STUDIO_CULINARY_GALLERY } from '../data/initialData';

/* ============================================================================
   1. ABOUT US MODAL
   ============================================================================ */
interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInquiry: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  isOpen,
  onClose,
  onOpenInquiry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-3xl my-8 rounded-2xl border-2 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: '#091e3a',
          borderColor: '#ffd700',
          color: '#ffffff',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close About Us Modal"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#ffd700] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Award className="w-6 h-6 text-[#ffd700]" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#ffd700] font-bold">
            Legacy of Royal Hospitality
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
          About <span style={{ color: '#ffd700' }}>TheCaterings</span>
        </h2>

        <div className="space-y-4 text-sm text-slate-200 leading-relaxed">
          <p>
            Established as Delhi NCR’s premier banquet and bespoke catering atelier, <strong>TheCaterings</strong> has transformed grand weddings, corporate galas, and intimate celebrations into unforgettable culinary experiences for over <strong>18 years</strong>.
          </p>
          <p>
            Rooted in authentic Shahi Khansama traditions and elevated by modern gastronomy, our team of seasoned culinary masters, banquet directors, and Maharaj specialists bring passion and military-grade precision to every plate.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-white/15 bg-white/5 text-center">
              <div className="text-2xl font-black text-[#ffd700] font-mono">18+</div>
              <div className="text-xs text-slate-300 font-bold uppercase mt-1">Years of Excellence</div>
            </div>
            <div className="p-4 rounded-xl border border-white/15 bg-white/5 text-center">
              <div className="text-2xl font-black text-[#ffd700] font-mono">50,000+</div>
              <div className="text-xs text-slate-300 font-bold uppercase mt-1">Pax Max Event Capacity</div>
            </div>
            <div className="p-4 rounded-xl border border-white/15 bg-white/5 text-center">
              <div className="text-2xl font-black text-[#ffd700] font-mono">100%</div>
              <div className="text-xs text-slate-300 font-bold uppercase mt-1">FSSAI &amp; ISO 22000 Certified</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-[#ffd700]/50 bg-[#0f2942]/80 space-y-2 mt-4">
            <h3 className="text-base font-bold text-[#ffd700] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Our Culinary &amp; Hygiene Standards
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-mono">
              <li>Central state-of-the-art HACCP compliant commissary kitchen in Delhi NCR.</li>
              <li>Pure Cow Desi Ghee, handpicked Kashmiri Saffron, and certified A-grade spices.</li>
              <li>Dedicated Jain, Swaminarayan, and dietary segregation with zero cross-contamination.</li>
              <li>Uniformed service brigade trained in 5-star banquet protocol &amp; live interactive counters.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline py-2.5 px-5 text-xs font-bold"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInquiry();
            }}
            className="btn py-2.5 px-6 text-xs font-bold"
            style={{ backgroundColor: '#ffd700', color: '#091e3a' }}
          >
            Request Event Quote →
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. SERVICES MODAL (With SEPARATE BUTTONS: Full-Service Catering, Drop-off Delivery, Theme Catering)
   ============================================================================ */
export type ServiceTabType = 'full-service' | 'drop-off' | 'theme-catering';

interface ServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ServiceTabType;
  onOpenInquiryWithService?: (service: string) => void;
}

export const ServicesModal: React.FC<ServicesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'full-service',
  onOpenInquiryWithService,
}) => {
  const [activeTab, setActiveTab] = useState<ServiceTabType>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-4xl my-8 rounded-2xl border-2 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: '#091e3a',
          borderColor: '#ffd700',
          color: '#ffffff',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Services Modal"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#ffd700] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-[#ffd700]" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#ffd700] font-bold">
            Bespoke Hospitality Solutions
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
          Our Catering Services
        </h2>

        {/* 3 SEPARATE BUTTONS REQUESTED BY USER */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6 p-1.5 rounded-xl bg-black/30 border border-white/20">
          <button
            type="button"
            onClick={() => setActiveTab('full-service')}
            className={`py-3 px-4 rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'full-service'
                ? 'bg-[#ffd700] text-[#091e3a] shadow-md border-2 border-white'
                : 'bg-transparent text-white hover:bg-white/10 border-2 border-transparent'
            }`}
          >
            <Utensils className="w-4 h-4 shrink-0" />
            <span>Full-Service Catering</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drop-off')}
            className={`py-3 px-4 rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'drop-off'
                ? 'bg-[#ffd700] text-[#091e3a] shadow-md border-2 border-white'
                : 'bg-transparent text-white hover:bg-white/10 border-2 border-transparent'
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span>Drop-off Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme-catering')}
            className={`py-3 px-4 rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'theme-catering'
                ? 'bg-[#ffd700] text-[#091e3a] shadow-md border-2 border-white'
                : 'bg-transparent text-white hover:bg-white/10 border-2 border-transparent'
            }`}
          >
            <PartyPopper className="w-4 h-4 shrink-0" />
            <span>Theme Catering</span>
          </button>
        </div>

        {/* Tab 1: Full-Service Catering */}
        {activeTab === 'full-service' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-5 rounded-xl border border-white/15 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#ffd700] flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-300" />
                  Full-Service Royal Catering
                </h3>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-400">
                  Ideal for 100 to 5,000+ Guests
                </span>
              </div>
              <p className="text-sm text-slate-200">
                Turnkey banquet management with royal culinary flair. Our executive chefs, banquet captains, and uniformed hospitality stewards handle complete food production, live action stations, chafing display, chinaware, and flawless table service.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                  <div className="font-bold text-[#ffd700] text-xs uppercase mb-1">What’s Included:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Master Maharaj &amp; Specialized Tandoor Chefs</li>
                    <li>Uniformed Banquet Stewards &amp; Bartenders</li>
                    <li>Gold/Silver Chafing Dishes &amp; Chinaware</li>
                    <li>Interactive Live Tandoor &amp; Chaat Counters</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                  <div className="font-bold text-[#ffd700] text-xs uppercase mb-1">Recommended For:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Royal Indian Weddings &amp; Sangeet Nights</li>
                    <li>Corporate Annual Galas &amp; Summits</li>
                    <li>Milestone Anniversaries &amp; Farmhouse Receptions</li>
                    <li>VVIP Diplomatic Gatherings</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Drop-off Delivery */}
        {activeTab === 'drop-off' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-5 rounded-xl border border-white/15 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#ffd700] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-300" />
                  Drop-off Executive Catering Delivery
                </h3>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-sky-900/80 text-sky-300 border border-sky-400">
                  Ideal for 25 to 250 Guests
                </span>
              </div>
              <p className="text-sm text-slate-200">
                Piping-hot, ready-to-serve gourmet food dispatched in temperature-controlled insulated hot-boxes straight from our commissary to your office or private residence. Zero fuss, high convenience, and restaurant-grade presentation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                  <div className="font-bold text-[#ffd700] text-xs uppercase mb-1">What’s Included:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Thermal Insulated Heated Container Dispatch</li>
                    <li>Bio-degradable Premium Cutlery &amp; Napkins</li>
                    <li>Pre-portioned Buffet Trays with Sterno Cans</li>
                    <li>On-time Guaranteed Doorstep Arrival</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                  <div className="font-bold text-[#ffd700] text-xs uppercase mb-1">Recommended For:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Corporate Board Meetings &amp; Office Lunches</li>
                    <li>Home Puja &amp; Griha Pravesh Brunches</li>
                    <li>Private Birthday &amp; Kitty Parties</li>
                    <li>Casual Weekend Get-Togethers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Theme Catering */}
        {activeTab === 'theme-catering' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-5 rounded-xl border border-white/15 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#ffd700] flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-amber-300" />
                  Customized Theme Catering &amp; Experiential Buffets
                </h3>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-purple-900/80 text-purple-300 border border-purple-400">
                  Custom Curated Experiences
                </span>
              </div>
              <p className="text-sm text-slate-200">
                Immersive culinary environments tailored to your theme. From Chandni Chowk street food bazaars to Royal Rajasthani Thali setups and Mediterranean Mezze gardens, we harmonize decor, staff attire, and signature culinary creations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                  <div className="font-bold text-[#ffd700] text-xs uppercase mb-1">Popular Themes:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li><strong>Delhi 6 Khau Gali:</strong> Authentic street chaat &amp; live paranthas</li>
                    <li><strong>Royal Rajputana:</strong> Silverware service with Dal Baati &amp; Laal Maas</li>
                    <li><strong>Sufi &amp; Qawwali Night:</strong> Dum Biryanis, Kakori Kebabs &amp; Phirni</li>
                    <li><strong>Artisanal European:</strong> Live Woodfired Pizzas &amp; Gelato Bar</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                  <div className="font-bold text-[#ffd700] text-xs uppercase mb-1">What’s Included:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Thematic Counter Props &amp; Signboards</li>
                    <li>Custom Printed Menu Placards</li>
                    <li>Themed Uniforms for Chefs &amp; Stewards</li>
                    <li>Dedicated Sensory Experience Supervisor</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-300">
            Selected: <strong className="text-[#ffd700] uppercase">{activeTab.replace('-', ' ')}</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline py-2.5 px-5 text-xs font-bold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenInquiryWithService) {
                  onOpenInquiryWithService(activeTab);
                }
              }}
              className="btn py-2.5 px-6 text-xs font-bold"
              style={{ backgroundColor: '#ffd700', color: '#091e3a' }}
            >
              Inquire for This Service →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   3. GALLERY MODAL
   ============================================================================ */
interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInquiry?: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [filterCat, setFilterCat] = useState<string>('All');
  if (!isOpen) return null;

  const categories = ['All', 'Signature Mains', 'Royal Starters', 'Welcome & Chaat', 'Artisanal Desserts'];
  const filtered =
    filterCat === 'All'
      ? STUDIO_CULINARY_GALLERY
      : STUDIO_CULINARY_GALLERY.filter((item) => item.category === filterCat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-5xl my-8 rounded-2xl border-2 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: '#091e3a',
          borderColor: '#ffd700',
          color: '#ffffff',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Gallery Modal"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#ffd700] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-[#ffd700]" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#ffd700] font-bold">
            Visual Culinary Art
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
          Catering &amp; Plating Gallery
        </h2>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCat(cat)}
              className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filterCat === cat
                  ? 'bg-[#ffd700] text-[#091e3a] border-2 border-white'
                  : 'bg-white/10 text-white hover:bg-white/20 border-2 border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of gallery pictures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-xl overflow-hidden border-2 border-[#1B1B1B] bg-black/40 shadow-md aspect-4/3 flex flex-col justify-end"
            >
              <img
                src={item.url}
                alt={item.label}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                <span className="text-[10px] font-mono text-[#ffd700] uppercase font-bold">
                  {item.category}
                </span>
                <span className="text-sm font-bold text-white leading-tight">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline py-2 px-5 text-xs font-bold"
          >
            Close Gallery
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   4. CLIENT STORIES (TESTIMONIALS) MODAL
   ============================================================================ */
interface ClientStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInquiry: () => void;
}

export const ClientStoriesModal: React.FC<ClientStoriesModalProps> = ({
  isOpen,
  onClose,
  onOpenInquiry,
}) => {
  if (!isOpen) return null;

  const stories = [
    {
      client: 'Sunil & Shweta Singhania',
      event: 'Royal Wedding (1,200 Pax) — Chhatarpur Farms',
      rating: 5,
      date: 'February 2026',
      review:
        'The live chaat counter and Kashmiri Wazwan mains were discussed by our relatives for weeks! The team managed 1,200 guests with zero waiting time. Master Maharaj’s Dal Bukhara was world class.',
      highlight: '“Zero waiting time for 1,200 guests. Legendary hospitality!”',
    },
    {
      client: 'Aditya Birla Group (DLF Horizon)',
      event: 'Corporate Annual Summit (450 Pax)',
      rating: 5,
      date: 'January 2026',
      review:
        'Prompt drop-off setup, pristine hot boxes, and flawless live sushi & kebab counters. Everything was compliant with our strict corporate ESG and food hygiene guidelines.',
      highlight: '“Impeccable corporate service and 5-star culinary standards.”',
    },
    {
      client: 'Dr. Meenakshi & Vikram Oberoi',
      event: '50th Jubilee Celebration (180 Pax) — Sainik Farms',
      rating: 5,
      date: 'November 2025',
      review:
        'The bespoke dessert salon featuring Laccha Rabri and Saffron Gujiya Chaat was out of this world. Highly recommend their Theme Catering experience!',
      highlight: '“The dessert salon was the talk of the entire evening.”',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-3xl my-8 rounded-2xl border-2 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: '#091e3a',
          borderColor: '#ffd700',
          color: '#ffffff',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Client Stories Modal"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#ffd700] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <HeartHandshake className="w-6 h-6 text-[#ffd700]" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#ffd700] font-bold">
            Real Host Experiences
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Client Stories &amp; Reviews
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          Discover why discerning families and corporate leaders trust TheCaterings for their most sacred and high-stakes milestones.
        </p>

        <div className="space-y-4">
          {stories.map((s, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-white/15 bg-white/5 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-white">{s.client}</h3>
                  <div className="text-xs font-mono text-[#ffd700]">{s.event}</div>
                </div>
                <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/10">
                  {Array.from({ length: s.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#ffd700] text-[#ffd700]" />
                  ))}
                  <span className="text-[10px] font-mono text-slate-300 ml-1">
                    {s.date}
                  </span>
                </div>
              </div>

              <div className="text-xs font-bold text-amber-300 italic">
                {s.highlight}
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                {s.review}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>4.9 / 5.0 Rated Across 650+ Banquet Reviews</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline py-2.5 px-5 text-xs font-bold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInquiry();
              }}
              className="btn py-2.5 px-6 text-xs font-bold"
              style={{ backgroundColor: '#ffd700', color: '#091e3a' }}
            >
              Book Your Story →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   5. INQUIRY FORM MODAL
   ============================================================================ */
interface InquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: string;
  onSubmitInquiry: (inquiryData: {
    clientName: string;
    contactNumber: string;
    email: string;
    eventType: string;
    guestCount: number;
    eventDate: string;
    serviceType: string;
    venueLocation: string;
    notes: string;
  }) => void;
}

export const InquiryFormModal: React.FC<InquiryFormModalProps> = ({
  isOpen,
  onClose,
  defaultService = 'Full-Service Catering',
  onSubmitInquiry,
}) => {
  const [clientName, setClientName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [eventType, setEventType] = useState('Royal Wedding');
  const [guestCount, setGuestCount] = useState(300);
  const [eventDate, setEventDate] = useState('2026-11-20');
  const [serviceType, setServiceType] = useState(defaultService);
  const [venueLocation, setVenueLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitInquiry({
      clientName,
      contactNumber,
      email,
      eventType,
      guestCount,
      eventDate,
      serviceType,
      venueLocation,
      notes,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-2xl my-8 rounded-2xl border-2 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: '#091e3a',
          borderColor: '#ffd700',
          color: '#ffffff',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Inquiry Modal"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#ffd700] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-6 h-6 text-[#ffd700]" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#ffd700] font-bold">
            Instant Banquet Inquiry
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Request Catering Quotation
        </h2>
        <p className="text-xs text-slate-300 mb-5">
          Share your celebration details and our Senior Banquet Director will connect within 15 minutes with customized menus &amp; costing.
        </p>

        {submitted ? (
          <div className="p-8 text-center space-y-3 bg-emerald-950/80 border-2 border-emerald-400 rounded-xl animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Inquiry Successfully Dispatched!</h3>
            <p className="text-sm text-slate-200">
              Your inquiry has been logged into the CRM Leads desk. Our culinary manager is reviewing your requirements now.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  Full Name / Host Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Rajesh Singhania"
                  className="w-full px-3 py-2 bg-white text-black rounded-lg border-2 border-white focus:outline-none font-sans text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  Contact Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 98110 44210"
                  className="w-full px-3 py-2 bg-white text-black rounded-lg border-2 border-white focus:outline-none font-sans text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-2 bg-white text-black rounded-lg border-2 border-white focus:outline-none font-sans text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  Occasion Type *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black rounded-lg border-2 border-white focus:outline-none font-sans text-xs font-bold"
                >
                  <option value="Royal Wedding">Wedding &amp; Sangeet</option>
                  <option value="Corporate Gala">Corporate Conference</option>
                  <option value="Kitty Party / Birthday">Kitty / Birthday Party</option>
                  <option value="Housewarming & Puja">Housewarming / Puja</option>
                  <option value="Cocktail & Reception">Cocktail &amp; Reception</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  Service Category *
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black rounded-lg border-2 border-white focus:outline-none font-sans text-xs font-bold"
                >
                  <option value="Full-Service Catering">Full-Service Catering</option>
                  <option value="Drop-off Delivery">Drop-off Delivery</option>
                  <option value="Theme Catering">Theme Catering</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  Estimated Guest Pax *
                </label>
                <input
                  type="number"
                  min={25}
                  required
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(25, Number(e.target.value) || 100))}
                  className="w-full px-3 py-2 bg-white text-black rounded-lg border-2 border-white focus:outline-none font-sans text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-bold mb-1">
                  Celebration Date *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black rounded-lg border-2 border-white focus:outline-none font-sans text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-200 font-bold mb-1">
                Venue Location / City *
              </label>
              <input
                type="text"
                required
                value={venueLocation}
                onChange={(e) => setVenueLocation(e.target.value)}
                placeholder="e.g. Radisson Blu / Chhatarpur Farms / DLF Cyber City"
                className="w-full px-3 py-2 bg-white text-black rounded-lg border-2 border-white focus:outline-none font-sans text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-200 font-bold mb-1">
                Special Dietary or Menu Preferences
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 50% Jain guests, live tandoor counter, Laccha Rabri dessert required..."
                className="w-full px-3 py-2 bg-white text-black rounded-lg border-2 border-white focus:outline-none font-sans text-xs"
              />
            </div>

            <div className="pt-3 border-t border-white/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline py-2.5 px-5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn py-2.5 px-6 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                style={{ backgroundColor: '#ffd700', color: '#091e3a' }}
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   6. CONTACT US MODAL
   ============================================================================ */
interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInquiry: () => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({
  isOpen,
  onClose,
  onOpenInquiry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-2xl my-8 rounded-2xl border-2 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: '#091e3a',
          borderColor: '#ffd700',
          color: '#ffffff',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Contact Us Modal"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#ffd700] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-6 h-6 text-[#ffd700]" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#ffd700] font-bold">
            Direct Concierge Desk
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Contact TheCaterings
        </h2>
        <p className="text-xs text-slate-300 mb-6">
          Reach out directly to our central banquet operations desk for immediate date checks, custom food tastings, and venue site visits.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-white/15 bg-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[#ffd700] font-bold text-sm">
              <Phone className="w-4 h-4" />
              <span>Call / WhatsApp Helpline</span>
            </div>
            <div className="text-xs font-mono space-y-1 text-slate-200">
              <p>Banquet Desk: <strong>+91 98110 44210</strong></p>
              <p>Corporate Line: <strong>+91 98110 44211</strong></p>
              <p className="text-[11px] text-emerald-400 font-bold">● Available 24×7 for booked functions</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/15 bg-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[#ffd700] font-bold text-sm">
              <Mail className="w-4 h-4" />
              <span>Official Email</span>
            </div>
            <div className="text-xs font-mono space-y-1 text-slate-200">
              <p>banquets@thecaterings.in</p>
              <p>corporate@thecaterings.in</p>
              <p className="text-[11px] text-slate-400">Response guaranteed within 30 mins</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/15 bg-white/5 space-y-2 sm:col-span-2">
            <div className="flex items-center gap-2 text-[#ffd700] font-bold text-sm">
              <MapPin className="w-4 h-4" />
              <span>Central Commissary &amp; Tasting Salon</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-mono">
              TheCaterings Culinary Estate, Plot 42-A, MG Road Commercial Belt, Near Sultanpur Metro, New Delhi 110030, India.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
          <a
            href="https://wa.me/919811044210?text=Hi%20TheCaterings,%20I%20would%20like%20to%20inquire%20about%20catering%20services."
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 underline"
          >
            Chat directly on WhatsApp →
          </a>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline py-2.5 px-5 text-xs font-bold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInquiry();
              }}
              className="btn py-2.5 px-6 text-xs font-bold"
              style={{ backgroundColor: '#ffd700', color: '#091e3a' }}
            >
              Send Online Inquiry →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
