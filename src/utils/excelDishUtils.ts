import * as XLSX from 'xlsx';
import {
  DishItem,
  STUDIO_CULINARY_GALLERY,
  getProductRelatedDescription,
  getAccurateRecipeForDish,
  RecipeIngredient,
} from '../data/initialData';

export const VALID_CATEGORIES: DishItem['category'][] = [
  'Welcome & Chaat',
  'Royal Starters',
  'Signature Mains',
  'Biryani & Breads',
  'Artisanal Desserts',
];

export const VALID_STATIONS: DishItem['station'][] = [
  'Tandoor Station',
  'Handi & Curry',
  'Live Chaat Counter',
  'Halwai Mithai Station',
  'Dum & Bakery',
];

export const VALID_DIETARY: DishItem['dietary'][] = [
  'Pure Veg · Jain Available',
  'Pure Veg',
  'Pure Veg · Swaminarayan',
];

/**
 * Downloads the current list of dishes as an Excel (.xlsx) workbook.
 */
export function downloadDishesToExcel(
  dishes: DishItem[],
  customFilename?: string
): void {
  const exportData = dishes.map((dish, idx) => {
    const ingredientsStr =
      dish.ingredients && dish.ingredients.length > 0
        ? dish.ingredients
            .map(
              (ing) =>
                `${ing.name} (${ing.qtyPer100Pax} ${ing.unit} @ ₹${ing.costPer100Pax})`
            )
            .join('; ')
        : '';

    return {
      'S.No': idx + 1,
      'Dish Code': dish.code,
      'Dish Name': dish.name,
      Category: dish.category,
      'Kitchen Station': dish.station,
      'Dietary Type': dish.dietary,
      'Selling Price (₹ / Plate)': dish.sellingPricePerPlate,
      'Food Cost (₹ / Plate)': dish.foodCostPerPlate,
      'Gross Margin (%)': Math.round(
        ((dish.sellingPricePerPlate - dish.foodCostPerPlate) /
          dish.sellingPricePerPlate) *
          100
      ),
      'Prep Time (Mins)': dish.prepTimeMins,
      'Included In Menu': dish.includedInMenu ? 'YES' : 'NO',
      'Image URL': dish.imageUrl || '',
      'Culinary Description': dish.description,
      'Recipe BOM Ingredients': ingredientsStr,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 6 }, // S.No
    { wch: 12 }, // Dish Code
    { wch: 32 }, // Dish Name
    { wch: 20 }, // Category
    { wch: 22 }, // Kitchen Station
    { wch: 25 }, // Dietary
    { wch: 22 }, // Selling Price
    { wch: 20 }, // Food Cost
    { wch: 16 }, // Gross Margin
    { wch: 16 }, // Prep Time
    { wch: 18 }, // Included In Menu
    { wch: 45 }, // Image URL
    { wch: 50 }, // Culinary Description
    { wch: 60 }, // Recipe BOM
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Catalog');

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')}`;
  const filename =
    customFilename || `TheCaterings_Product_Catalog_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Downloads a sample blank / template Excel file with guidelines and example dishes.
 */
export function downloadSampleDishExcelTemplate(): void {
  const sampleRows = [
    {
      'Dish Code': 'DSH-201',
      'Dish Name': 'Royal Paneer Angara Tikka',
      Category: 'Royal Starters',
      'Kitchen Station': 'Tandoor Station',
      'Dietary Type': 'Pure Veg · Jain Available',
      'Selling Price (₹ / Plate)': 180,
      'Food Cost (₹ / Plate)': 55,
      'Prep Time (Mins)': 25,
      'Included In Menu': 'YES',
      'Image URL':
        'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80',
      'Culinary Description':
        'Charcoal smoked malai paneer cubes marinated in Deggi mirch, hung curd, and roasted gram flour.',
      'Recipe BOM Ingredients':
        'Fresh Malai Paneer (8 kg @ ₹2800); Hung Curd (3 kg @ ₹450); Spices & Mustard Oil (1.5 kg @ ₹300)',
    },
    {
      'Dish Code': 'DSH-202',
      'Dish Name': 'Shahi Awadhi Dum Biryani',
      Category: 'Biryani & Breads',
      'Kitchen Station': 'Dum & Bakery',
      'Dietary Type': 'Pure Veg · Jain Available',
      'Selling Price (₹ / Plate)': 220,
      'Food Cost (₹ / Plate)': 68,
      'Prep Time (Mins)': 45,
      'Included In Menu': 'YES',
      'Image URL':
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      'Culinary Description':
        'Aged long-grain basmati cooked on dum with saffron, organic kewra water, and caramelized spices.',
      'Recipe BOM Ingredients':
        'Aged Basmati Rice (12 kg @ ₹1800); Pure Desi Cow Ghee (3.5 kg @ ₹2100); Saffron & Awadhi Potli (1 set @ ₹800)',
    },
    {
      'Dish Code': 'DSH-203',
      'Dish Name': 'Kesari Rajbhog Rasmalai',
      Category: 'Artisanal Desserts',
      'Kitchen Station': 'Halwai Mithai Station',
      'Dietary Type': 'Pure Veg',
      'Selling Price (₹ / Plate)': 140,
      'Food Cost (₹ / Plate)': 42,
      'Prep Time (Mins)': 30,
      'Included In Menu': 'YES',
      'Image URL':
        'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80',
      'Culinary Description':
        'Fresh chenna patties soaked in thick clotted rabdi scented with Kashmiri saffron and Iranian pistachios.',
      'Recipe BOM Ingredients':
        'Fresh Cow Milk Chenna (6 kg @ ₹1600); Condensed Rabdi (8 L @ ₹1900); Kashmiri Saffron & Pistachio (250 g @ ₹900)',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 20 },
    { wch: 22 },
    { wch: 25 },
    { wch: 24 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 45 },
    { wch: 50 },
    { wch: 50 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dish Import Template');

  XLSX.writeFile(workbook, 'TheCaterings_Dish_Upload_Template.xlsx');
}

/**
 * Standardizes a string for header comparison.
 */
function cleanKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Matches an extracted value to valid Dish category.
 */
function matchCategory(val: string, fallbackIdx = 0): DishItem['category'] {
  const cleaned = val.toLowerCase().trim();
  if (cleaned.includes('chaat') || cleaned.includes('welcome')) {
    return 'Welcome & Chaat';
  }
  if (cleaned.includes('starter') || cleaned.includes('appetizer') || cleaned.includes('snack')) {
    return 'Royal Starters';
  }
  if (cleaned.includes('main') || cleaned.includes('curry') || cleaned.includes('gravy') || cleaned.includes('sabzi')) {
    return 'Signature Mains';
  }
  if (cleaned.includes('biryani') || cleaned.includes('bread') || cleaned.includes('rice') || cleaned.includes('roti') || cleaned.includes('naan')) {
    return 'Biryani & Breads';
  }
  if (cleaned.includes('dessert') || cleaned.includes('sweet') || cleaned.includes('mithai') || cleaned.includes('halwa')) {
    return 'Artisanal Desserts';
  }
  const direct = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === cleaned
  );
  if (direct) return direct;
  return VALID_CATEGORIES[fallbackIdx % VALID_CATEGORIES.length];
}

/**
 * Matches an extracted value to valid kitchen station.
 */
function matchStation(val: string, category: DishItem['category']): DishItem['station'] {
  const cleaned = val.toLowerCase().trim();
  if (cleaned.includes('tandoor') || cleaned.includes('tikka') || cleaned.includes('kebab')) {
    return 'Tandoor Station';
  }
  if (cleaned.includes('handi') || cleaned.includes('curry') || cleaned.includes('dal')) {
    return 'Handi & Curry';
  }
  if (cleaned.includes('chaat') || cleaned.includes('live')) {
    return 'Live Chaat Counter';
  }
  if (cleaned.includes('halwai') || cleaned.includes('mithai') || cleaned.includes('sweet') || cleaned.includes('dessert')) {
    return 'Halwai Mithai Station';
  }
  if (cleaned.includes('dum') || cleaned.includes('bakery') || cleaned.includes('biryani') || cleaned.includes('bread')) {
    return 'Dum & Bakery';
  }
  // Default according to category
  switch (category) {
    case 'Welcome & Chaat':
      return 'Live Chaat Counter';
    case 'Royal Starters':
      return 'Tandoor Station';
    case 'Signature Mains':
      return 'Handi & Curry';
    case 'Biryani & Breads':
      return 'Dum & Bakery';
    case 'Artisanal Desserts':
      return 'Halwai Mithai Station';
    default:
      return 'Tandoor Station';
  }
}

/**
 * Matches an extracted value to valid dietary.
 */
function matchDietary(val: string): DishItem['dietary'] {
  const cleaned = val.toLowerCase().trim();
  if (cleaned.includes('swaminarayan')) {
    return 'Pure Veg · Swaminarayan';
  }
  if (cleaned.includes('jain')) {
    return 'Pure Veg · Jain Available';
  }
  return 'Pure Veg · Jain Available';
}

/**
 * Parses ingredients from string format: "Ing1 (5 kg @ ₹200); Ing2 (2 L @ ₹150)"
 * or comma separated.
 */
function parseIngredients(
  rawStr: string,
  dishName: string,
  category: DishItem['category'],
  cost: number,
  dishId: string
): RecipeIngredient[] {
  if (!rawStr || !rawStr.trim()) {
    return getAccurateRecipeForDish(dishName, category, cost, dishId);
  }

  const items = rawStr.split(/[;|\n]+/).map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) {
    return getAccurateRecipeForDish(dishName, category, cost, dishId);
  }

  const parsed = items.map((item, idx) => {
    // Try to match name (qty unit @ cost)
    const match = item.match(/^(.*?)(?:\(([^@)]+)(?:@\s*(?:₹|INR)?\s*([0-9.]+))?\))?$/i);
    if (match) {
      const name = (match[1] || item).trim();
      const qtyStr = (match[2] || '').trim();
      const costStr = (match[3] || '').trim();

      let qty = 5;
      let unit: 'kg' | 'L' | 'g' | 'pcs' = 'kg';
      if (qtyStr) {
        const numMatch = qtyStr.match(/([0-9.]+)\s*(kg|l|g|pcs|packets)?/i);
        if (numMatch) {
          qty = parseFloat(numMatch[1]) || 5;
          const u = (numMatch[2] || 'kg').toLowerCase();
          if (u === 'l' || u === 'liter' || u === 'litre') unit = 'L';
          else if (u === 'g' || u === 'gram') unit = 'g';
          else if (u === 'pcs' || u === 'pc') unit = 'pcs';
          else unit = 'kg';
        }
      }

      const costVal = costStr ? parseFloat(costStr) || Math.round(cost * 15) : Math.round(cost * 15);

      return {
        id: `ing-${dishId}-${idx + 1}`,
        name: name || `Ingredient #${idx + 1}`,
        qtyPer100Pax: qty,
        unit,
        costPer100Pax: costVal,
      };
    }

    return {
      id: `ing-${dishId}-${idx + 1}`,
      name: item,
      qtyPer100Pax: 5,
      unit: 'kg' as const,
      costPer100Pax: Math.round(cost * 12),
    };
  });

  return parsed.length > 0
    ? parsed
    : getAccurateRecipeForDish(dishName, category, cost, dishId);
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file into an array of DishItems.
 */
export async function parseDishesFromExcel(
  file: File,
  existingCount: number = 0
): Promise<Omit<DishItem, 'id'>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded Excel file does not contain any worksheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(
    worksheet,
    { defval: '' }
  );

  if (!rawRows || rawRows.length === 0) {
    throw new Error('The worksheet is empty. Please verify your spreadsheet.');
  }

  const results: Omit<DishItem, 'id'>[] = [];

  rawRows.forEach((row, idx) => {
    // Find keys by normalizing
    const entry: Record<string, string> = {};
    for (const [key, val] of Object.entries(row)) {
      entry[cleanKey(key)] = String(val ?? '').trim();
    }

    // Name resolution
    const name =
      entry['dishname'] ||
      entry['name'] ||
      entry['productname'] ||
      entry['dish'] ||
      entry['title'] ||
      entry['itemname'] ||
      entry['item'] ||
      '';

    if (!name) {
      // Skip completely empty rows without dish name
      return;
    }

    // Code resolution
    const code =
      entry['dishcode'] ||
      entry['code'] ||
      entry['sku'] ||
      entry['itemcode'] ||
      `DSH-${101 + existingCount + results.length}`;

    // Category resolution
    const catRaw =
      entry['category'] ||
      entry['coursecategory'] ||
      entry['course'] ||
      entry['type'] ||
      '';
    const category = matchCategory(catRaw, results.length);

    // Station resolution
    const stationRaw =
      entry['kitchenstation'] ||
      entry['station'] ||
      entry['counter'] ||
      '';
    const station = matchStation(stationRaw, category);

    // Dietary resolution
    const dietaryRaw =
      entry['dietarytype'] ||
      entry['dietary'] ||
      entry['diet'] ||
      entry['preference'] ||
      '';
    const dietary = matchDietary(dietaryRaw);

    // Selling price resolution
    const sellRaw =
      entry['sellingpriceperplate'] ||
      entry['sellingprice'] ||
      entry['price'] ||
      entry['rate'] ||
      entry['sellingrate'] ||
      entry['mrp'] ||
      '';
    const sellingPricePerPlate = Math.max(
      10,
      parseFloat(sellRaw.replace(/[^0-9.]/g, '')) || 160
    );

    // Food cost resolution
    const costRaw =
      entry['foodcostperplate'] ||
      entry['foodcost'] ||
      entry['cost'] ||
      entry['rawcost'] ||
      '';
    const foodCostPerPlate = Math.max(
      5,
      parseFloat(costRaw.replace(/[^0-9.]/g, '')) || Math.round(sellingPricePerPlate * 0.3)
    );

    // Prep time
    const prepRaw =
      entry['preptimemins'] ||
      entry['preptime'] ||
      entry['prep'] ||
      '';
    const prepTimeMins = Math.max(
      5,
      parseInt(prepRaw.replace(/[^0-9]/g, ''), 10) || 30
    );

    // Included in menu
    const menuRaw =
      entry['includedinmenu'] ||
      entry['included'] ||
      entry['inmenu'] ||
      entry['active'] ||
      '';
    const includedInMenu =
      menuRaw === '' ||
      menuRaw.toLowerCase() === 'yes' ||
      menuRaw.toLowerCase() === 'true' ||
      menuRaw === '1';

    // Image URL
    let imageUrl: string | null =
      entry['imageurl'] ||
      entry['image'] ||
      entry['photourl'] ||
      entry['photo'] ||
      null;

    if (!imageUrl || !imageUrl.startsWith('http')) {
      // Pick matching preset or fallback
      const matchingPreset = STUDIO_CULINARY_GALLERY.find(
        (g) => g.category === category
      );
      imageUrl =
        matchingPreset?.url ||
        STUDIO_CULINARY_GALLERY[results.length % STUDIO_CULINARY_GALLERY.length].url;
    }

    // Description
    const descRaw =
      entry['culinarydescription'] ||
      entry['description'] ||
      entry['desc'] ||
      entry['notes'] ||
      '';
    const description =
      descRaw || getProductRelatedDescription(name, category, station);

    // Ingredients
    const ingRaw =
      entry['recipebomingredients'] ||
      entry['recipeingredients'] ||
      entry['ingredients'] ||
      entry['recipe'] ||
      entry['bom'] ||
      '';
    const tempId = `temp-excel-${Date.now()}-${results.length}`;
    const ingredients = parseIngredients(
      ingRaw,
      name,
      category,
      foodCostPerPlate,
      tempId
    );

    results.push({
      code,
      name,
      category,
      dietary,
      station,
      sellingPricePerPlate,
      foodCostPerPlate,
      prepTimeMins,
      includedInMenu,
      imageUrl,
      description,
      ingredients,
    });
  });

  if (results.length === 0) {
    throw new Error(
      'Could not extract any valid dish records from the file. Please check that your sheet contains a "Dish Name" or "Name" column.'
    );
  }

  return results;
}
