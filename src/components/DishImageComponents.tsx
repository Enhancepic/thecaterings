import React, { useState } from 'react';
import {
  ImagePlus,
  Trash2,
  Upload,
  Check,
  Plus,
  X,
  UtensilsCrossed,
  Pencil,
  ExternalLink,
  Camera,
} from 'lucide-react';
import {
  DishItem,
  STUDIO_CULINARY_GALLERY,
  getProductRelatedDescription,
  getAccurateRecipeForDish,
} from '../data/initialData';

export interface BoxTextPalette {
  codeColor: string;
  titleColor: string;
  metaColor: string;
  linkColor: string;
  priceColor: string;
  dividerColor: string;
}

/**
 * Automatically computes a high-contrast, harmonious text colour palette
 * based on the product box background colour (e.g. Sky Blue #87ceeb).
 */
export function getAutoBoxTextPalette(
  boxBgHex: string = '#87ceeb'
): BoxTextPalette {
  const cleanHex = boxBgHex.replace('#', '').trim();
  const r = parseInt(cleanHex.substring(0, 2) || '87', 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4) || 'ce', 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6) || 'eb', 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // For light product boxes such as Sky Blue (#87ceeb), return deep high-contrast navy & royal crimson colours
  if (luminance > 0.35) {
    return {
      codeColor: '#0f2942', // Deep Navy Blue for "DSH-141 / WELCOME & CHAAT"
      titleColor: '#7a003c', // Deep Royal Berry-Crimson for "Rajwadi Dahi Gujiya Chaat"
      metaColor: '#0a192f', // Deep Midnight Navy for "Pure Veg · Jain Available · Prep: 30 mins"
      linkColor: '#6b0f4a', // Deep Royal Burgundy for "View Product Details →"
      priceColor: '#091e3a', // Deep Midnight Navy for "₹150 / plate"
      dividerColor: 'rgba(15, 41, 66, 0.25)',
    };
  }

  return {
    codeColor: '#ffffff',
    titleColor: '#ff69b4',
    metaColor: '#ffffff',
    linkColor: '#ff69b4',
    priceColor: '#ffffff',
    dividerColor: 'rgba(255, 255, 255, 0.2)',
  };
}

export const SKY_BLUE_BOX_PALETTE = getAutoBoxTextPalette('#87ceeb');

/**
 * Returns a simplified base ingredient name for unauthenticated/guest users,
 * reserving full commercial batch formulation names strictly for client & admin logins.
 */
export function getShortIngredientName(fullName: string): string {
  if (!fullName) return '';
  const lower = fullName.toLowerCase();
  if (lower.includes('paneer')) return 'Paneer (Base)';
  if (lower.includes('milk')) return 'Milk (Dairy Base)';
  if (lower.includes('khoya') || lower.includes('chenna')) return 'Khoya & Dairy';
  if (lower.includes('rice') || lower.includes('basmati')) return 'Basmati Rice';
  if (lower.includes('ghee') || lower.includes('butter')) return 'Dairy Fat / Ghee';
  if (lower.includes('potato') || lower.includes('garadu')) return 'Vegetable Base';
  if (lower.includes('tomato')) return 'Tomato Base';
  if (lower.includes('curd') || lower.includes('dahi')) return 'Yogurt / Dahi';
  if (lower.includes('saffron') || lower.includes('pistachio') || lower.includes('cashew'))
    return 'Dry Fruits / Aromatics';
  if (
    lower.includes('dal') ||
    lower.includes('flour') ||
    lower.includes('atta') ||
    lower.includes('besan')
  )
    return 'Grain / Pulse Base';
  if (lower.includes('spinach') || lower.includes('vegetable')) return 'Fresh Produce';
  if (lower.includes('mushroom') || lower.includes('kathal')) return 'Produce Base';
  if (lower.includes('chutney') || lower.includes('syrup')) return 'Sauce / Dressing';

  const words = fullName.trim().split(/\s+/);
  if (words.length <= 2) return words.join(' ');
  return `${words.slice(0, 2).join(' ')}...`;
}

interface EditableDishPriceProps {
  dishId: string;
  dishName: string;
  price: number;
  onUpdatePrice?: (dishId: string, newPrice: number) => void;
  className?: string;
  badgeMode?: boolean;
  boxBgHex?: string;
}

export const EditableDishPrice: React.FC<EditableDishPriceProps> = ({
  dishId,
  dishName,
  price,
  onUpdatePrice,
  className = '',
  badgeMode = false,
  boxBgHex = '#87ceeb',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftPrice, setDraftPrice] = useState<string>(String(price));
  const palette = getAutoBoxTextPalette(boxBgHex);

  const handleSave = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    const parsed = Math.max(1, Math.round(Number(draftPrice) || price));
    if (onUpdatePrice && parsed !== price) {
      onUpdatePrice(dishId, parsed);
    }
    setIsEditing(false);
  };

  const isDarkBox = palette.priceColor === '#ffffff';

  if (!onUpdatePrice) {
    return (
      <span
        className={`dish-price-text ${isDarkBox ? 'dark-box-price' : ''} font-bold ${
          badgeMode ? 'price-badge' : className
        }`}
        style={{ color: isDarkBox ? '#ffff00' : palette.priceColor, fontWeight: 700 }}
      >
        ₹{price} / plate
      </span>
    );
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1 z-20 ${
          badgeMode ? 'price-badge' : className
        }`}
      >
        <span
          className="font-bold"
          style={{ color: isDarkBox ? '#ffff00' : palette.priceColor }}
        >
          ₹
        </span>
        <input
          type="number"
          min={1}
          step={1}
          value={draftPrice}
          onChange={(e) => setDraftPrice(e.target.value)}
          aria-label={`Edit selling price for ${dishName}`}
          autoFocus
          className="w-20 px-1.5 py-0.5 font-mono font-bold rounded"
          style={{
            backgroundColor: '#0a192f',
            color: '#ffffff',
            border: '2px solid #ffd700',
          }}
        />
        <button
          type="submit"
          title="Save Price"
          aria-label={`Save price for ${dishName}`}
          className="p-1 rounded cursor-pointer"
          style={{ backgroundColor: '#0f2942', color: '#ffd700' }}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDraftPrice(String(price));
            setIsEditing(false);
          }}
          title="Cancel Price Edit"
          aria-label="Cancel price edit"
          className="p-1 rounded cursor-pointer"
          style={{ backgroundColor: '#7a003c', color: '#ffffff' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </form>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setDraftPrice(String(price));
        setIsEditing(true);
      }}
      title={`Click to edit price for ${dishName}`}
      className={`dish-price-text ${isDarkBox ? 'dark-box-price' : ''} inline-flex items-center gap-1.5 cursor-pointer font-bold ${
        badgeMode ? 'price-badge' : className
      }`}
      style={{ color: isDarkBox ? '#ffff00' : palette.priceColor, fontWeight: 700 }}
    >
      <span style={{ color: isDarkBox ? '#ffff00' : palette.priceColor, fontWeight: 700 }}>
        ₹{price} / plate
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDraftPrice(String(price));
          setIsEditing(true);
        }}
        title={`Edit Price for ${dishName}`}
        aria-label={`Edit price for ${dishName}`}
        className="inline-flex items-center justify-center p-0.5 rounded opacity-90 hover:opacity-100 cursor-pointer"
        style={{ color: isDarkBox ? '#ffff00' : palette.priceColor }}
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface DishThumbnailProps {
  dish: DishItem;
  onOpenImageModal: (dish: DishItem) => void;
  onDeleteImage: (dishId: string, dishName: string) => void;
  onDeleteDish?: (dishId: string, dishName: string) => void;
  onUpdatePrice?: (dishId: string, newPrice: number) => void;
  onToggleSelect?: (dishId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  canEditImage?: boolean;
}

export const DishThumbnail: React.FC<DishThumbnailProps> = ({
  dish,
  onOpenImageModal,
  onDeleteImage,
  onDeleteDish,
  onUpdatePrice,
  onToggleSelect,
  size = 'md',
  readOnly = false,
  canEditImage,
}) => {
  const [imgError, setImgError] = useState(false);
  const hasValidImage = Boolean(dish.imageUrl) && !imgError;
  const isSelected = Boolean(dish.includedInMenu);

  // Product image icon is visible ONLY on client login and admin login
  const isImageEditable = canEditImage !== undefined ? canEditImage : !readOnly;

  const dimensions =
    size === 'sm'
      ? 'w-20 h-16'
      : size === 'lg'
      ? 'w-full h-48'
      : 'w-full h-40';

  const handleToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(dish.id);
    }
  };

  return (
    <div className="flex flex-col">
      <div
        onClick={() => {
          if (isImageEditable) {
            setImgError(false);
            onOpenImageModal(dish);
          } else {
            handleToggle();
          }
        }}
        title={
          isImageEditable
            ? hasValidImage
              ? `Change / Update Dish Image — ${dish.name}`
              : `Add Dish Image — ${dish.name}`
            : isSelected
            ? `Selected for Menu — Click to Deselect ${dish.name}`
            : `Click to Select ${dish.name} for Menu`
        }
        className={`relative ${dimensions} bg-white border-2 border-[#1B1B1B] flex items-center justify-center group cursor-pointer shadow-xs overflow-hidden transition-all`}
      >
        {hasValidImage ? (
          <img
            src={dish.imageUrl!}
            alt={`${dish.name} plating presentation`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-white flex flex-col items-center justify-center p-2 text-center">
            <div className="p-2 bg-white border-2 border-[#1B1B1B] text-[#1B1B1B] shadow-[2px_2px_0_#1B1B1B] mb-1">
              <ImagePlus className="w-4 h-4 text-amber-800" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-700">
              {dish.code}
            </span>
          </div>
        )}

        {/* Product Image Icon button — visible ONLY on client login and admin login */}
        {isImageEditable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setImgError(false);
              onOpenImageModal(dish);
            }}
            title={
              hasValidImage
                ? `Change Product Image (${dish.name})`
                : `Add Product Image (${dish.name})`
            }
            aria-label={`Change product image for ${dish.name}`}
            className={`absolute z-10 inline-flex items-center justify-center rounded-md border-2 border-[#ffff00]/80 bg-[#0f2942]/90 hover:bg-[#0f2942] text-[#ffff00] hover:text-white shadow-md backdrop-blur-xs transition-all hover:scale-110 active:scale-95 cursor-pointer ${
              size === 'sm' ? 'top-1 right-1 p-1' : 'top-2 right-2 p-1.5'
            }`}
          >
            <Camera className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            <span className="sr-only">Change Product Image</span>
          </button>
        )}
      </div>

      {/* Action bar below product image: Always Select / Unselect button */}
      <div className="flex items-center justify-between gap-1.5 mt-1.5 px-0.5">
        <button
          type="button"
          onClick={handleToggle}
          title={
            isSelected
              ? `Selected — Click to Deselect ${dish.name}`
              : `Click to Select ${dish.name}`
          }
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold border-2 rounded shadow-2xs cursor-pointer transition-all select-none ${
            isSelected
              ? 'bg-[#0f2942] hover:bg-[#19466f] text-[#ffff00] border-[#0f2942]'
              : 'bg-white hover:bg-amber-50 text-[#0f2942] border-[#0f2942]'
          }`}
        >
          <Check
            className={`w-3.5 h-3.5 ${
              isSelected ? 'text-[#ffff00]' : 'text-[#0f2942] opacity-40'
            }`}
          />
          <span>{isSelected ? 'Selected' : 'Select'}</span>
        </button>
        {onDeleteDish && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDish(dish.id, dish.name);
            }}
            title={`Delete dish "${dish.name}"`}
            aria-label={`Delete dish ${dish.name}`}
            className="inline-flex items-center justify-center p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

interface ProductDetailInteractiveProps {
  dish: DishItem;
  onUpdatePrice?: (dishId: string, newPrice: number) => void;
  isAdmin?: boolean;
  compact?: boolean;
  boxBgHex?: string;
  onToggleSelect?: (dishId: string) => void;
}

export const ProductDetailInteractive: React.FC<
  ProductDetailInteractiveProps
> = ({ dish, boxBgHex = '#87ceeb', onToggleSelect, isAdmin = false }) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const palette = getAutoBoxTextPalette(boxBgHex);

  const isOpen = isDescriptionOpen || isHovered;

  const productDescription = getProductRelatedDescription(
    dish.name,
    dish.category,
    dish.station,
    dish.description
  );

  const ingredients =
    dish.ingredients && dish.ingredients.length > 0
      ? dish.ingredients
      : getAccurateRecipeForDish(
          dish.name,
          dish.category,
          dish.foodCostPerPlate || 45,
          dish.id
        );

  return (
    <div className="relative space-y-1 text-left">
      <div
        className="label product-code product-text font-bold"
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: palette.codeColor,
        }}
      >
        {dish.code} / {dish.category.toUpperCase()}
      </div>

      <h3
        className="product-title"
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: palette.titleColor,
        }}
      >
        {dish.name}
      </h3>

      <div
        className="product-text"
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: palette.metaColor,
        }}
      >
        {dish.dietary} · Prep: {dish.prepTimeMins} mins
      </div>

      <div
        className="pt-1.5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDescriptionOpen((prev) => !prev);
          }}
          aria-expanded={isOpen}
          className="product-detail-link inline-block text-left bg-transparent border-0 p-0 cursor-pointer hover:opacity-85 transition-opacity"
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: palette.linkColor,
            textDecoration: 'underline',
          }}
        >
          {isOpen ? 'Hide Product Details ↑' : 'View Product Details & Full Recipe BOM →'}
        </button>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider shadow-xs"
            style={{
              backgroundColor: '#0f2942',
              color: '#ffff00',
              border: '1px solid #ffff00',
            }}
            title="Formulation benchmark for Standard 100-Pax batch"
          >
            Standard 100-Pax
          </span>
        </div>

        {/* Product Description & Detailed Recipe BOM viewed on hover or click of View Product Details */}
        {isOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-2.5 p-3.5 rounded-lg border-2 space-y-3"
            style={{
              backgroundColor: '#0f2942',
              borderColor: '#ffff00',
            }}
          >
          <div>
            <div
              className="text-[11px] font-mono uppercase font-bold tracking-wider mb-1"
              style={{ color: '#ffd700' }}
            >
              Culinary Description
            </div>
            <p
              className="product-description leading-snug m-0"
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#ffff00',
              }}
            >
              {productDescription}
            </p>
          </div>

          <div className="pt-2 border-t border-white/15">
            <div className="mb-2 space-y-0.5">
              <div
                className="text-[11px] font-mono uppercase font-bold tracking-wider flex items-center gap-1.5"
                style={{ color: '#ffd700' }}
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="leading-tight">Raw Ingredients &amp; Batch Formulation</span>
              </div>
              <div className="text-[10px] font-mono text-amber-300 font-semibold normal-case pl-5">
                (Full Formulation &amp; Qty / 100 Pax)
              </div>
            </div>
            <div className="space-y-1.5">
              {ingredients.map((ing) => (
                <div
                  key={ing.id || ing.name}
                  className="flex items-center justify-between gap-2 text-xs font-mono py-1.5 px-2.5 rounded bg-black/40 border border-white/10"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    {isAdmin ? (
                      <span className="text-white font-medium break-words leading-tight">
                        {ing.name}
                      </span>
                    ) : (
                      <span
                        className="text-white/80 font-medium truncate italic"
                        title="Full formulation item name visible only on client and admin login"
                      >
                        {getShortIngredientName(ing.name)}
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <span className="text-amber-300 font-bold shrink-0 text-[11px] px-1.5 py-0.5 rounded bg-white/10 border border-amber-300/30 whitespace-nowrap">
                      {ing.qtyPer100Pax} {ing.unit}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>


        </div>
      )}
      </div>
    </div>
  );
};

interface DishImageModalProps {
  dish: DishItem | null;
  onClose: () => void;
  onSaveImage: (dishId: string, imageUrl: string) => void;
  onDeleteImage: (dishId: string, dishName: string) => void;
}

export const DishImageModal: React.FC<DishImageModalProps> = ({
  dish,
  onClose,
  onSaveImage,
  onDeleteImage,
}) => {
  const [customUrl, setCustomUrl] = useState(dish?.imageUrl || '');
  const [selectedUrl, setSelectedUrl] = useState(
    dish?.imageUrl || STUDIO_CULINARY_GALLERY[0].url
  );
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  if (!dish) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedUrl(reader.result);
        setCustomUrl(reader.result);
        setUploadStatus(`Loaded "${file.name}"`);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-image-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <p className="text-xs font-mono text-slate-500">
              {dish.code} · {dish.category}
            </p>
            <h2
              id="dish-image-modal-title"
              className="text-xl font-semibold text-slate-900 mt-0.5"
            >
              Manage Dish Image — {dish.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dish image manager"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-5">
          {/* Current / Preview Image */}
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg border-2 border-[#1B1B1B]">
            <div className="w-40 h-28 rounded-lg overflow-hidden bg-white border-2 border-[#1B1B1B] shrink-0 flex items-center justify-center">
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt={`Preview for ${dish.name}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UtensilsCrossed className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1 space-y-2 w-full">
              <label
                htmlFor="dish-file-upload"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-700" />
                <span>Upload Local Dish Photo (JPG/PNG/WebP)</span>
                <input
                  id="dish-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              {uploadStatus && (
                <p className="text-xs text-emerald-700 font-medium">
                  {uploadStatus}
                </p>
              )}
              <div>
                <label
                  htmlFor="custom-dish-image-url"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Or Paste Direct Image URL
                </label>
                <input
                  id="custom-dish-image-url"
                  type="url"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setSelectedUrl(e.target.value);
                  }}
                  placeholder="https://example.com/banquet-dish.jpg"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Curated Studio Culinary Presets */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 mb-2.5">
              Select from TheCaterings Studio Culinary Gallery
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {STUDIO_CULINARY_GALLERY.map((preset) => {
                const isSelected = selectedUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedUrl(preset.url);
                      setCustomUrl(preset.url);
                    }}
                    className={`group text-left rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-white ${
                      isSelected
                        ? 'border-[#1B1B1B] shadow-[3px_3px_0_#1B1B1B]'
                        : 'border-slate-300 hover:border-[#1B1B1B]'
                    }`}
                  >
                    <div className="h-20 w-full overflow-hidden bg-white relative">
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-[#1B1B1B] border-2 border-[#1B1B1B] flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-medium text-slate-800 line-clamp-2 leading-snug">
                        {preset.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div>
            {dish.imageUrl && (
              <button
                type="button"
                onClick={() => {
                  onDeleteImage(dish.id, dish.name);
                  onClose();
                }}
                title="Delete Dish Image"
                aria-label="Delete Dish Image"
                className="p-2.5 text-red-700 bg-white border-2 border-[#1B1B1B] rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              title="Cancel"
              aria-label="Cancel"
              className="p-2.5 text-[#1B1B1B] bg-white border-2 border-[#1B1B1B] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedUrl.trim()) {
                  onSaveImage(dish.id, selectedUrl.trim());
                  onClose();
                }
              }}
              title="Save Dish Image"
              aria-label="Save Dish Image"
              className="p-2.5 text-[#1B1B1B] bg-white border-2 border-[#1B1B1B] rounded-lg transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
