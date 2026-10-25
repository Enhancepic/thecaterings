import { GstInvoice, PurchaseOrder } from '../data/initialData';

export const DEFAULT_GST_TERMS_AND_CONDITIONS: string[] = [
  '1. GST is levied as per Govt. of India norms under SAC 996333 (5% Outdoor Catering) / SAC 996332 (18% Banquet Venue).',
  '2. 50% booking advance is mandatory upon confirmation; remaining balance is payable 24 hours prior to event dispatch.',
  '3. Guaranteed guest pax count must be finalized 48 hours before the function; extra plates billed at contracted plate rate.',
  '4. Payments accepted via Indian UPI (payments@thecaterings.upi), Razorpay, NEFT/RTGS, or PayPal (paypal.me/TheCaterings).',
  '5. All disputes are subject to New Delhi jurisdiction only. E. & O.E.',
];

export const DEFAULT_PO_TERMS_AND_CONDITIONS: string[] = [
  '1. All raw materials must strictly meet FSSAI Grade-A & Agmark quality standards; substandard lots will be rejected at gate.',
  '2. Delivery must reach TheCaterings Central Commissary Cold-Chain Dock before 08:30 AM on the scheduled ETA date.',
  '3. Certified computerized Dharam-Kanta (Weighbridge) weight slip and GST Tax Invoice must accompany the delivery challan.',
  '4. Payment released within 7 working days post GRN verification & Head Maharaj quality sign-off via NEFT/RTGS/UPI.',
  '5. Quote Purchase Order Number clearly on all packets, tins, and vendor tax bills. Subject to New Delhi jurisdiction.',
];

let pdfDownloadCounter = 1;

/**
 * Converts a positive integer into Indian Rupee words (Lakhs / Crores system)
 */
export function numberToIndianWords(amount: number): string {
  const num = Math.round(Math.abs(amount));
  if (num === 0) return 'Zero';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const twoDigits = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o ? ' ' + ones[o] : '');
  };

  const threeDigits = (n: number): string => {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (h > 0) res += ones[h] + ' Hundred';
    if (rem > 0) res += (res ? ' ' : '') + twoDigits(rem);
    return res;
  };

  const parts: string[] = [];
  let remaining = num;

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  if (crore > 0) parts.push(threeDigits(crore) + ' Crore');

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  if (lakh > 0) parts.push(twoDigits(lakh) + ' Lakh');

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousand > 0) parts.push(twoDigits(thousand) + ' Thousand');

  if (remaining > 0) parts.push(threeDigits(remaining));

  return parts.join(' ').trim();
}

const sanitizeAscii = (str: string): string =>
  str
    .replace(/₹/g, 'Rs. ')
    .replace(/[•·]/g, '|')
    .replace(/—|–/g, '-')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapePdfLiteral = (str: string): string =>
  str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const formatRsPdf = (amount: number): string =>
  `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;

/**
 * Accurate character-by-character width estimation for PDF Type1 standard fonts
 * Prevents any text from overflowing or overwriting adjacent columns
 */
function measurePdfTextWidth(
  rawText: string,
  font: 'F1' | 'F2' | 'F3',
  size: number
): number {
  if (font === 'F3') {
    return rawText.length * size * 0.6;
  }
  const boldMultiplier = font === 'F2' ? 1.07 : 1.0;
  let total = 0;
  for (let i = 0; i < rawText.length; i++) {
    const ch = rawText[i];
    if ('ilI.,:;!|\'` '.includes(ch)) {
      total += size * 0.31 * boldMultiplier;
    } else if ('()-/\\[]{}'.includes(ch)) {
      total += size * 0.36 * boldMultiplier;
    } else if ('MWmw%@&'.includes(ch)) {
      total += size * 0.82 * boldMultiplier;
    } else if (ch >= 'A' && ch <= 'Z') {
      total += size * 0.65 * boldMultiplier;
    } else if (ch >= '0' && ch <= '9') {
      total += size * 0.56 * boldMultiplier;
    } else {
      total += size * 0.53 * boldMultiplier;
    }
  }
  return total;
}

/**
 * Truncates text so its rendered width never exceeds maxWidth
 */
function fitTextToMaxWidth(
  rawText: string,
  maxWidth: number,
  font: 'F1' | 'F2' | 'F3',
  size: number
): string {
  const clean = sanitizeAscii(rawText);
  if (measurePdfTextWidth(clean, font, size) <= maxWidth) {
    return clean;
  }
  let truncated = clean;
  while (
    truncated.length > 1 &&
    measurePdfTextWidth(truncated + '..', font, size) > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.trimEnd() + '..';
}

/**
 * Splits a paragraph into multiple lines that strictly fit within maxWidth
 */
function wrapTextToLines(
  rawText: string,
  maxWidth: number,
  font: 'F1' | 'F2' | 'F3',
  size: number,
  maxLines = 2
): string[] {
  const clean = sanitizeAscii(rawText);
  if (!clean) return [];
  const words = clean.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (measurePdfTextWidth(candidate, font, size) <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(fitTextToMaxWidth(word, maxWidth, font, size));
        currentLine = '';
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    const sliced = lines.slice(0, maxLines);
    sliced[maxLines - 1] = fitTextToMaxWidth(
      sliced[maxLines - 1] + ' ' + lines.slice(maxLines).join(' '),
      maxWidth,
      font,
      size
    );
    return sliced;
  }
  return lines;
}

/**
 * Helper class to construct a vector-drawn %PDF-1.4 page with strict cell clipping
 * so text never overwrites borders or neighboring cells
 */
class PdfPageCanvas {
  private ops: string[] = [];
  private readonly pageHeight = 842;

  private pdfY(topY: number): number {
    return Number((this.pageHeight - topY).toFixed(2));
  }

  /**
   * Push a rectangular clipping region (top-left x, topY, width w, height h)
   */
  pushClipBox(x: number, topY: number, w: number, h: number) {
    const bottomY = this.pdfY(topY + h);
    this.ops.push('q');
    this.ops.push(
      `${x.toFixed(2)} ${bottomY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re W n`
    );
  }

  popClipBox() {
    this.ops.push('Q');
  }

  drawBox(
    x: number,
    topY: number,
    w: number,
    h: number,
    options?: {
      fillRgb?: [number, number, number];
      strokeRgb?: [number, number, number];
      lineWidth?: number;
    }
  ) {
    const bottomY = this.pdfY(topY + h);
    this.ops.push('q');
    this.ops.push(
      `${options?.lineWidth !== undefined ? options.lineWidth : 0.75} w`
    );
    if (options?.strokeRgb) {
      const [r, g, b] = options.strokeRgb;
      this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    } else {
      this.ops.push('0.18 0.22 0.28 RG');
    }

    if (options?.fillRgb) {
      const [fr, fg, fb] = options.fillRgb;
      this.ops.push(`${fr.toFixed(3)} ${fg.toFixed(3)} ${fb.toFixed(3)} rg`);
      this.ops.push(
        `${x.toFixed(2)} ${bottomY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`
      );
      if (options?.strokeRgb !== undefined) {
        this.ops.push('B');
      } else {
        this.ops.push('f');
      }
    } else {
      this.ops.push(
        `${x.toFixed(2)} ${bottomY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`
      );
    }
    this.ops.push('Q');
  }

  drawLine(
    x1: number,
    topY1: number,
    x2: number,
    topY2: number,
    strokeRgb: [number, number, number] = [0.2, 0.24, 0.3],
    lineWidth = 0.65
  ) {
    const y1 = this.pdfY(topY1);
    const y2 = this.pdfY(topY2);
    const [r, g, b] = strokeRgb;
    this.ops.push('q');
    this.ops.push(`${lineWidth} w`);
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    this.ops.push(
      `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
    this.ops.push('Q');
  }

  drawText(
    text: string,
    x: number,
    topY: number,
    options?: {
      font?: 'F1' | 'F2' | 'F3';
      size?: number;
      colorRgb?: [number, number, number];
      align?: 'left' | 'right' | 'center';
      maxWidth?: number;
      clipBox?: [number, number, number, number];
    }
  ) {
    const font = options?.font || 'F1';
    const size = options?.size || 8.5;
    const [r, g, b] = options?.colorRgb || [0.08, 0.1, 0.14];

    const fitted = options?.maxWidth
      ? fitTextToMaxWidth(text, options.maxWidth, font, size)
      : sanitizeAscii(text);

    const estWidth = measurePdfTextWidth(fitted, font, size);
    let drawX = x;
    if (options?.align === 'right') {
      drawX = x - estWidth;
    } else if (options?.align === 'center') {
      drawX = x - estWidth / 2;
    }

    const y = this.pdfY(topY);
    const escaped = escapePdfLiteral(fitted);

    if (options?.clipBox) {
      const [cx, cy, cw, ch] = options.clipBox;
      this.pushClipBox(cx, cy, cw, ch);
    }

    this.ops.push('BT');
    this.ops.push(`/${font} ${size} Tf`);
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    this.ops.push(
      `1 0 0 1 ${drawX.toFixed(2)} ${y.toFixed(2)} Tm (${escaped}) Tj`
    );
    this.ops.push('ET');

    if (options?.clipBox) {
      this.popClipBox();
    }
  }

  /**
   * Draws text strictly confined within a table cell (cellX, cellY, cellW, cellH)
   */
  drawCellText(
    text: string,
    cellX: number,
    cellTopY: number,
    cellW: number,
    cellH: number,
    baselineOffset: number,
    options?: {
      font?: 'F1' | 'F2' | 'F3';
      size?: number;
      colorRgb?: [number, number, number];
      align?: 'left' | 'right' | 'center';
      paddingX?: number;
    }
  ) {
    const padX = options?.paddingX ?? 5;
    const innerW = Math.max(8, cellW - padX * 2);
    const align = options?.align || 'left';
    const anchorX =
      align === 'right'
        ? cellX + cellW - padX
        : align === 'center'
        ? cellX + cellW / 2
        : cellX + padX;

    this.drawText(text, anchorX, cellTopY + baselineOffset, {
      font: options?.font,
      size: options?.size,
      colorRgb: options?.colorRgb,
      align,
      maxWidth: innerW,
      clipBox: [cellX + 1, cellTopY + 1, cellW - 2, cellH - 2],
    });
  }

  drawWrappedTextInBox(
    text: string,
    boxX: number,
    boxTopY: number,
    boxW: number,
    boxH: number,
    options?: {
      font?: 'F1' | 'F2' | 'F3';
      size?: number;
      colorRgb?: [number, number, number];
      paddingX?: number;
      paddingY?: number;
      lineHeight?: number;
    }
  ): number {
    const font = options?.font || 'F1';
    const size = options?.size || 8;
    const padX = options?.paddingX ?? 6;
    const padY = options?.paddingY ?? 12;
    const lineHeight = options?.lineHeight ?? size * 1.3;
    const maxW = Math.max(10, boxW - padX * 2);
    const maxLines = Math.max(1, Math.floor((boxH - 4) / lineHeight));
    const lines = wrapTextToLines(text, maxW, font, size, maxLines);
    lines.forEach((line, idx) => {
      this.drawText(line, boxX + padX, boxTopY + padY + idx * lineHeight, {
        font,
        size,
        colorRgb: options?.colorRgb,
        maxWidth: maxW,
        clipBox: [boxX + 1, boxTopY + 1, boxW - 2, boxH - 2],
      });
    });
    return lines.length;
  }

  /**
   * Draws the official "TheCaterings" Royal Crest Company Logo at (x, topY)
   */
  drawCompanyLogo(x: number, topY: number) {
    this.drawBox(x, topY, 52, 52, {
      fillRgb: [0.024, 0.306, 0.231],
      strokeRgb: [0.851, 0.467, 0.024],
      lineWidth: 1.3,
    });
    this.drawBox(x + 3.5, topY + 3.5, 45, 45, {
      strokeRgb: [0.961, 0.62, 0.043],
      lineWidth: 0.65,
    });
    this.drawBox(x + 11, topY + 8.5, 30, 3.5, {
      fillRgb: [0.961, 0.62, 0.043],
    });
    this.drawText('TC', x + 26, topY + 30, {
      font: 'F2',
      size: 16,
      colorRgb: [0.99, 0.94, 0.78],
      align: 'center',
    });
    this.drawText('THECATERINGS', x + 26, topY + 43, {
      font: 'F2',
      size: 4.8,
      colorRgb: [0.961, 0.62, 0.043],
      align: 'center',
    });
  }

  getStream(): string {
    return this.ops.join('\n');
  }
}

function buildSafeFilename(
  baseName: string,
  preventOverwrite = true
): string {
  const cleanBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!preventOverwrite) {
    return `${cleanBase}.pdf`;
  }
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const rev = String(pdfDownloadCounter++).padStart(2, '0');
  return `${cleanBase}_Rev${rev}_${stamp}.pdf`;
}

function compileAndDownloadPdf(filename: string, pages: PdfPageCanvas[]): void {
  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  const pageObjStart = 6;
  const kidsRefs: string[] = [];
  for (let p = 0; p < pages.length; p++) {
    kidsRefs.push(`${pageObjStart + p * 2} 0 R`);
  }

  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${kidsRefs.join(' ')}] /Count ${pages.length} >>\nendobj`
  );

  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj'
  );
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj'
  );
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj'
  );

  for (let p = 0; p < pages.length; p++) {
    const pageId = pageObjStart + p * 2;
    const contentId = pageId + 1;
    const streamContent = pages[p].getStream();

    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentId} 0 R >>\nendobj`
    );
    objects.push(
      `${contentId} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
    );
  }

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const off = String(offsets[i]).padStart(10, '0');
    pdf += `${off} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Generates a Boxed Column & Row GST Tax Invoice PDF with Company Logo,
 * Strict Non-Overwriting Cell Clipping, and Footer Terms & Conditions
 */
export function generateSingleInvoicePdf(
  inv: GstInvoice,
  customTerms?: string[],
  preventFileOverwrite = true
): string {
  const terms =
    customTerms && customTerms.length > 0
      ? customTerms
      : DEFAULT_GST_TERMS_AND_CONDITIONS;

  const gstAmount = Math.round((inv.taxableAmount * inv.gstRate) / 100);
  const halfRate = (inv.gstRate / 2).toFixed(1);
  const halfGst = Math.round(gstAmount / 2);
  const grandTotal = inv.taxableAmount + gstAmount;
  const balanceDue = Math.max(0, grandTotal - inv.amountPaid);

  const page = new PdfPageCanvas();
  const L = 28;
  const W = 539;
  const R = L + W; // 567

  // 1. OUTER BILL BORDER BOX
  page.drawBox(L, 26, W, 790, {
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 1.2,
  });

  // 2. TOP HEADER BOX WITH COMPANY LOGO (topY = 26..104, height = 78)
  const hdrSplitX = 424; // Left company info: 28..424, Right badge: 424..567
  page.drawBox(L, 26, W, 78, {
    fillRgb: [0.985, 0.98, 0.965],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 1.0,
  });
  page.drawLine(hdrSplitX, 26, hdrSplitX, 104, [0.08, 0.12, 0.18], 0.85);

  // Company Logo Crest
  page.drawCompanyLogo(L + 10, 39);

  // Company Info strictly clipped inside (96..420)
  const infoX = L + 70; // 98
  const infoMaxW = hdrSplitX - infoX - 8; // 318pt
  page.drawText('THECATERINGS', infoX, 46, {
    font: 'F2',
    size: 14.5,
    colorRgb: [0.024, 0.306, 0.231],
    maxWidth: infoMaxW,
    clipBox: [infoX, 30, infoMaxW + 4, 70],
  });
  page.drawText(
    'Royal Banquet, Outdoor Catering & Luxury Hospitality Operations',
    infoX,
    60,
    {
      font: 'F2',
      size: 8.0,
      colorRgb: [0.55, 0.32, 0.04],
      maxWidth: infoMaxW,
      clipBox: [infoX, 30, infoMaxW + 4, 70],
    }
  );
  page.drawText(
    'Regd. Commissary: MG Road, Sultanpur, New Delhi - 110030 | Tel: +91 98111 44200',
    infoX,
    74,
    {
      font: 'F1',
      size: 7.2,
      colorRgb: [0.25, 0.28, 0.32],
      maxWidth: infoMaxW,
      clipBox: [infoX, 30, infoMaxW + 4, 70],
    }
  );
  page.drawText(
    'GSTIN: 07AABCT2026B1Z8  |  PAN: AABCT2026B  |  FSSAI: 10026011004829',
    infoX,
    88,
    {
      font: 'F2',
      size: 7.3,
      colorRgb: [0.1, 0.12, 0.16],
      maxWidth: infoMaxW,
      clipBox: [infoX, 30, infoMaxW + 4, 70],
    }
  );

  // Right Tax Invoice Badge Box (inside 424..567)
  const badgeCenterX = (hdrSplitX + R) / 2; // 495.5
  page.drawBox(hdrSplitX + 10, 35, R - hdrSplitX - 20, 24, {
    fillRgb: [0.024, 0.306, 0.231],
    strokeRgb: [0.851, 0.467, 0.024],
    lineWidth: 0.9,
  });
  page.drawText('GST TAX INVOICE', badgeCenterX, 50.5, {
    font: 'F2',
    size: 9.5,
    colorRgb: [1, 1, 1],
    align: 'center',
    maxWidth: 118,
  });
  page.drawText('ORIGINAL FOR RECIPIENT', badgeCenterX, 73, {
    font: 'F2',
    size: 6.8,
    colorRgb: [0.35, 0.38, 0.42],
    align: 'center',
    maxWidth: 130,
  });
  page.drawText(
    `SAC: ${inv.sacCode} (${inv.gstRate}% GST)`,
    badgeCenterX,
    87,
    {
      font: 'F3',
      size: 7.4,
      colorRgb: [0.55, 0.32, 0.04],
      align: 'center',
      maxWidth: 130,
    }
  );

  // 3. ROW 2: CUSTOMER & INVOICE METADATA GRID (topY = 104..196, height = 92)
  const metaTop = 104;
  const metaH = 92;
  const midX = L + 275; // 303
  const leftLabelSplit = L + 86; // 114
  const rightLabelSplit = midX + 86; // 389

  page.drawBox(L, metaTop, W, metaH, {
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.8,
  });
  // Header strip
  page.drawBox(L, metaTop, W, 18, {
    fillRgb: [0.91, 0.93, 0.95],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.8,
  });

  // Vertical dividers for Customer & Metadata
  page.drawLine(midX, metaTop, midX, metaTop + metaH, [0.08, 0.12, 0.18], 0.8);
  page.drawLine(
    leftLabelSplit,
    metaTop + 18,
    leftLabelSplit,
    metaTop + metaH,
    [0.7, 0.74, 0.78],
    0.5
  );
  page.drawLine(
    rightLabelSplit,
    metaTop + 18,
    rightLabelSplit,
    metaTop + metaH,
    [0.7, 0.74, 0.78],
    0.5
  );

  page.drawCellText(
    'BILLED TO (CLIENT / HOST DETAILS)',
    L,
    metaTop,
    midX - L,
    18,
    12.5,
    { font: 'F2', size: 7.8, colorRgb: [0.08, 0.12, 0.18] }
  );
  page.drawCellText(
    'INVOICE & SETTLEMENT METADATA',
    midX,
    metaTop,
    R - midX,
    18,
    12.5,
    { font: 'F2', size: 7.8, colorRgb: [0.08, 0.12, 0.18] }
  );

  const metaRowsLeft = [
    { label: 'Client / Host', val: inv.clientName, font: 'F2' as const, color: [0.024, 0.306, 0.231] as [number, number, number] },
    { label: 'Customer GSTIN', val: inv.gstin, font: 'F3' as const },
    { label: 'Event / Function', val: inv.eventName, font: 'F1' as const },
    { label: 'Place of Supply', val: '07 - Delhi (Intra-State CGST + SGST)', font: 'F1' as const },
  ];

  const metaRowsRight = [
    { label: 'Invoice No', val: inv.invoiceNo, font: 'F3' as const, color: [0.55, 0.32, 0.04] as [number, number, number] },
    { label: 'Billing Date', val: inv.billingDate, font: 'F3' as const },
    {
      label: 'Payment Status',
      val: inv.paymentStatus.toUpperCase(),
      font: 'F2' as const,
      color:
        inv.paymentStatus === 'Paid in Full'
          ? ([0.024, 0.45, 0.25] as [number, number, number])
          : ([0.7, 0.35, 0.05] as [number, number, number]),
    },
    {
      label: 'Gateway Mode',
      val: inv.paymentMethod || 'Indian UPI / Razorpay / PayPal',
      font: 'F1' as const,
    },
  ];

  for (let r = 0; r < 4; r++) {
    const ry = metaTop + 18 + r * 18.5;
    if (r > 0) {
      page.drawLine(L, ry, R, ry, [0.75, 0.78, 0.82], 0.5);
    }
    const leftItem = metaRowsLeft[r];
    page.drawCellText(
      leftItem.label,
      L,
      ry,
      leftLabelSplit - L,
      18.5,
      12.5,
      { font: 'F2', size: 7.5, colorRgb: [0.3, 0.34, 0.4] }
    );
    page.drawCellText(
      leftItem.val,
      leftLabelSplit,
      ry,
      midX - leftLabelSplit,
      18.5,
      12.5,
      {
        font: leftItem.font,
        size: 8.0,
        colorRgb: leftItem.color || [0.08, 0.1, 0.14],
      }
    );

    const rightItem = metaRowsRight[r];
    page.drawCellText(
      rightItem.label,
      midX,
      ry,
      rightLabelSplit - midX,
      18.5,
      12.5,
      { font: 'F2', size: 7.5, colorRgb: [0.3, 0.34, 0.4] }
    );
    page.drawCellText(
      rightItem.val,
      rightLabelSplit,
      ry,
      R - rightLabelSplit,
      18.5,
      12.5,
      {
        font: rightItem.font,
        size: 8.0,
        colorRgb: rightItem.color || [0.08, 0.1, 0.14],
      }
    );
  }

  // 4. ROW 3: ITEMIZED BOXED TABLE (topY = 196..384)
  // Col 0: S.No (28..54, w=26)
  // Col 1: Particulars (54..258, w=204)
  // Col 2: SAC (258..302, w=44)
  // Col 3: Taxable (302..374, w=72)
  // Col 4: CGST (374..436, w=62)
  // Col 5: SGST (436..498, w=62)
  // Col 6: Total (498..567, w=69)
  const tblTop = 196;
  const colX = [28, 54, 258, 302, 374, 436, 498, 567];
  const headerH = 24;

  page.drawBox(L, tblTop, W, headerH, {
    fillRgb: [0.024, 0.306, 0.231],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.9,
  });

  const colHeaderDefs = [
    { label: 'S.No', align: 'center' as const },
    { label: 'PARTICULARS / DESCRIPTION OF SERVICES', align: 'left' as const },
    { label: 'SAC', align: 'center' as const },
    { label: 'TAXABLE (Rs.)', align: 'right' as const },
    { label: `CGST (${halfRate}%)`, align: 'right' as const },
    { label: `SGST (${halfRate}%)`, align: 'right' as const },
    { label: 'TOTAL (Rs.)', align: 'right' as const },
  ];

  colHeaderDefs.forEach((h, idx) => {
    const cx = colX[idx];
    const cw = colX[idx + 1] - cx;
    page.drawCellText(h.label, cx, tblTop, cw, headerH, 15, {
      font: 'F2',
      size: 7.2,
      colorRgb: [1, 1, 1],
      align: h.align,
      paddingX: 4,
    });
  });

  const rowHeights = [46, 34, 30, 30];
  let curY = tblTop + headerH;

  // Item Row 1
  page.drawBox(L, curY, W, rowHeights[0], {
    fillRgb: [1, 1, 1],
    strokeRgb: [0.25, 0.3, 0.36],
    lineWidth: 0.6,
  });
  page.drawCellText('01', colX[0], curY, colX[1] - colX[0], rowHeights[0], 16, {
    font: 'F3',
    size: 8.2,
    align: 'center',
    paddingX: 2,
  });
  page.drawCellText(
    inv.eventName,
    colX[1],
    curY,
    colX[2] - colX[1],
    rowHeights[0],
    14,
    { font: 'F2', size: 8.2 }
  );
  page.drawCellText(
    'Royal Banquet Catering, Live Chaat & Tandoor Counters,',
    colX[1],
    curY,
    colX[2] - colX[1],
    rowHeights[0],
    26,
    { font: 'F1', size: 7.0, colorRgb: [0.35, 0.38, 0.42] }
  );
  page.drawCellText(
    'Maharaj Culinary Brigade, Crockery & Uniformed Service',
    colX[1],
    curY,
    colX[2] - colX[1],
    rowHeights[0],
    37,
    { font: 'F1', size: 7.0, colorRgb: [0.35, 0.38, 0.42] }
  );
  page.drawCellText(
    inv.sacCode,
    colX[2],
    curY,
    colX[3] - colX[2],
    rowHeights[0],
    16,
    { font: 'F3', size: 8.0, align: 'center', paddingX: 2 }
  );
  page.drawCellText(
    inv.taxableAmount.toLocaleString('en-IN'),
    colX[3],
    curY,
    colX[4] - colX[3],
    rowHeights[0],
    16,
    { font: 'F3', size: 8.0, align: 'right', paddingX: 4 }
  );
  page.drawCellText(
    halfGst.toLocaleString('en-IN'),
    colX[4],
    curY,
    colX[5] - colX[4],
    rowHeights[0],
    16,
    { font: 'F3', size: 8.0, align: 'right', paddingX: 4 }
  );
  page.drawCellText(
    halfGst.toLocaleString('en-IN'),
    colX[5],
    curY,
    colX[6] - colX[5],
    rowHeights[0],
    16,
    { font: 'F3', size: 8.0, align: 'right', paddingX: 4 }
  );
  page.drawCellText(
    grandTotal.toLocaleString('en-IN'),
    colX[6],
    curY,
    colX[7] - colX[6],
    rowHeights[0],
    16,
    { font: 'F2', size: 8.4, align: 'right', paddingX: 4 }
  );
  curY += rowHeights[0];

  // Item Row 2
  page.drawBox(L, curY, W, rowHeights[1], {
    fillRgb: [0.99, 0.99, 0.98],
    strokeRgb: [0.25, 0.3, 0.36],
    lineWidth: 0.6,
  });
  page.drawCellText('02', colX[0], curY, colX[1] - colX[0], rowHeights[1], 15, {
    font: 'F3',
    size: 8.2,
    align: 'center',
    paddingX: 2,
  });
  page.drawCellText(
    'Dedicated Pure Jain / Satvik Counter & Mocktail Bar',
    colX[1],
    curY,
    colX[2] - colX[1],
    rowHeights[1],
    14,
    { font: 'F2', size: 7.8 }
  );
  page.drawCellText(
    'Separate utensils, Maharaj supervision & cold-chain setup',
    colX[1],
    curY,
    colX[2] - colX[1],
    rowHeights[1],
    25,
    { font: 'F1', size: 6.9, colorRgb: [0.35, 0.38, 0.42] }
  );
  page.drawCellText(
    inv.sacCode,
    colX[2],
    curY,
    colX[3] - colX[2],
    rowHeights[1],
    15,
    { font: 'F3', size: 8.0, align: 'center', paddingX: 2 }
  );
  page.drawCellText(
    'INCLUDED',
    colX[3],
    curY,
    colX[4] - colX[3],
    rowHeights[1],
    15,
    { font: 'F2', size: 7.2, colorRgb: [0.024, 0.45, 0.25], align: 'right', paddingX: 4 }
  );
  page.drawCellText('0.00', colX[4], curY, colX[5] - colX[4], rowHeights[1], 15, {
    font: 'F3',
    size: 7.8,
    align: 'right',
    paddingX: 4,
  });
  page.drawCellText('0.00', colX[5], curY, colX[6] - colX[5], rowHeights[1], 15, {
    font: 'F3',
    size: 7.8,
    align: 'right',
    paddingX: 4,
  });
  page.drawCellText(
    'INCLUDED',
    colX[6],
    curY,
    colX[7] - colX[6],
    rowHeights[1],
    15,
    { font: 'F2', size: 7.2, colorRgb: [0.024, 0.45, 0.25], align: 'right', paddingX: 4 }
  );
  curY += rowHeights[1];

  // Item Row 3
  page.drawBox(L, curY, W, rowHeights[2], {
    fillRgb: [1, 1, 1],
    strokeRgb: [0.25, 0.3, 0.36],
    lineWidth: 0.6,
  });
  page.drawCellText('03', colX[0], curY, colX[1] - colX[0], rowHeights[2], 18, {
    font: 'F3',
    size: 8.2,
    align: 'center',
    paddingX: 2,
  });
  page.drawCellText(
    'Copper Handi Chafing Setup, Floral Buffet Styling & Stewards',
    colX[1],
    curY,
    colX[2] - colX[1],
    rowHeights[2],
    18,
    { font: 'F1', size: 7.6 }
  );
  page.drawCellText(
    inv.sacCode,
    colX[2],
    curY,
    colX[3] - colX[2],
    rowHeights[2],
    18,
    { font: 'F3', size: 8.0, align: 'center', paddingX: 2 }
  );
  page.drawCellText(
    'INCLUDED',
    colX[3],
    curY,
    colX[4] - colX[3],
    rowHeights[2],
    18,
    { font: 'F2', size: 7.2, colorRgb: [0.024, 0.45, 0.25], align: 'right', paddingX: 4 }
  );
  page.drawCellText('0.00', colX[4], curY, colX[5] - colX[4], rowHeights[2], 18, {
    font: 'F3',
    size: 7.8,
    align: 'right',
    paddingX: 4,
  });
  page.drawCellText('0.00', colX[5], curY, colX[6] - colX[5], rowHeights[2], 18, {
    font: 'F3',
    size: 7.8,
    align: 'right',
    paddingX: 4,
  });
  page.drawCellText(
    'INCLUDED',
    colX[6],
    curY,
    colX[7] - colX[6],
    rowHeights[2],
    18,
    { font: 'F2', size: 7.2, colorRgb: [0.024, 0.45, 0.25], align: 'right', paddingX: 4 }
  );
  curY += rowHeights[2];

  // Item Row 4 (Blank grid row)
  page.drawBox(L, curY, W, rowHeights[3], {
    fillRgb: [0.99, 0.99, 0.98],
    strokeRgb: [0.25, 0.3, 0.36],
    lineWidth: 0.6,
  });
  curY += rowHeights[3];

  // Total Row at bottom of Item Table (height = 24)
  const totalRowH = 24;
  page.drawBox(L, curY, W, totalRowH, {
    fillRgb: [0.95, 0.92, 0.84],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.9,
  });
  page.drawCellText(
    'TOTAL TAXABLE & GST AMOUNT (INR)',
    colX[1],
    curY,
    colX[3] - colX[1],
    totalRowH,
    15,
    { font: 'F2', size: 8.0, colorRgb: [0.08, 0.12, 0.18] }
  );
  page.drawCellText(
    inv.taxableAmount.toLocaleString('en-IN'),
    colX[3],
    curY,
    colX[4] - colX[3],
    totalRowH,
    15,
    { font: 'F2', size: 8.0, align: 'right', paddingX: 4 }
  );
  page.drawCellText(
    halfGst.toLocaleString('en-IN'),
    colX[4],
    curY,
    colX[5] - colX[4],
    totalRowH,
    15,
    { font: 'F2', size: 8.0, align: 'right', paddingX: 4 }
  );
  page.drawCellText(
    halfGst.toLocaleString('en-IN'),
    colX[5],
    curY,
    colX[6] - colX[5],
    totalRowH,
    15,
    { font: 'F2', size: 8.0, align: 'right', paddingX: 4 }
  );
  page.drawCellText(
    grandTotal.toLocaleString('en-IN'),
    colX[6],
    curY,
    colX[7] - colX[6],
    totalRowH,
    15,
    { font: 'F2', size: 8.6, colorRgb: [0.024, 0.306, 0.231], align: 'right', paddingX: 4 }
  );

  const tblBottom = curY + totalRowH;
  colX.forEach((cx) => {
    page.drawLine(cx, tblTop, cx, tblBottom, [0.15, 0.2, 0.26], 0.75);
  });

  // 5. ROW 4: AMOUNT IN WORDS + BANK/GATEWAYS (Left) & FINANCIAL SUMMARY (Right) (topY = 384..538)
  const sumTop = tblBottom; // 384
  const sumH = 154;
  const sumSplitX = 336; // Left: 28..336 (w=308), Right: 336..567 (w=231)
  const leftW = sumSplitX - L; // 308

  page.drawBox(L, sumTop, W, sumH, {
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.8,
  });
  page.drawLine(
    sumSplitX,
    sumTop,
    sumSplitX,
    sumTop + sumH,
    [0.08, 0.12, 0.18],
    0.8
  );

  // Left Top: Amount in Words (height = 48)
  page.drawBox(L, sumTop, leftW, 48, {
    fillRgb: [0.98, 0.985, 0.99],
    strokeRgb: [0.25, 0.3, 0.36],
    lineWidth: 0.6,
  });
  page.drawCellText(
    'INVOICE AMOUNT IN WORDS (INR):',
    L,
    sumTop,
    leftW,
    16,
    12,
    { font: 'F2', size: 7.4, colorRgb: [0.35, 0.38, 0.42] }
  );
  const wordLines = wrapTextToLines(
    `Rupees ${numberToIndianWords(grandTotal)} Only`,
    leftW - 14,
    'F2',
    8.0,
    2
  );
  wordLines.forEach((wl, idx) => {
    page.drawCellText(wl, L, sumTop + 14 + idx * 13, leftW, 14, 11, {
      font: 'F2',
      size: 8.0,
      colorRgb: [0.08, 0.12, 0.18],
    });
  });

  // Left Bottom: Bank & Payment Gateways (topY = 432..538, height = 106)
  const bankBaseY = sumTop + 48;
  const bankLines = [
    {
      text: 'COMPANY BANK, INDIAN UPI & PAYPAL SETTLEMENT DETAILS:',
      font: 'F2' as const,
      size: 7.6,
      color: [0.024, 0.306, 0.231] as [number, number, number],
    },
    {
      text: 'Bank Name    : HDFC Bank Ltd., Connaught Place, New Delhi',
      font: 'F1' as const,
      size: 7.4,
    },
    {
      text: 'Account Name : TheCaterings Hospitality Pvt. Ltd.',
      font: 'F2' as const,
      size: 7.4,
    },
    {
      text: 'A/C & IFSC   : 50200084921044 | IFSC: HDFC0000003',
      font: 'F3' as const,
      size: 7.4,
    },
    {
      text: 'Indian UPI ID: payments@thecaterings.upi (GPay/PhonePe/BHIM)',
      font: 'F2' as const,
      size: 7.4,
      color: [0.55, 0.32, 0.04] as [number, number, number],
    },
    {
      text: 'Razorpay/PayU: RZP_LIVE_THECATERINGS_IN (Cards/NetBanking)',
      font: 'F1' as const,
      size: 7.2,
    },
    {
      text: 'PayPal Global: paypal.me/TheCaterings (USD / GBP / EUR)',
      font: 'F2' as const,
      size: 7.4,
      color: [0.1, 0.3, 0.65] as [number, number, number],
    },
  ];

  bankLines.forEach((bl, idx) => {
    page.drawCellText(bl.text, L, bankBaseY + 4 + idx * 14, leftW, 14, 10, {
      font: bl.font,
      size: bl.size,
      colorRgb: bl.color || [0.12, 0.15, 0.2],
    });
  });

  // Right Side Boxed Financial Summary Rows (7 rows x 22pt = 154pt)
  // Internal divider at finValX = 474 so labels and amounts never touch
  const finValX = 474;
  const finRows = [
    {
      label: '1. Taxable Value',
      val: `Rs. ${inv.taxableAmount.toLocaleString('en-IN')}`,
      bold: false,
      fill: undefined,
    },
    {
      label: `2. Add: CGST @ ${halfRate}%`,
      val: `Rs. ${halfGst.toLocaleString('en-IN')}`,
      bold: false,
      fill: undefined,
    },
    {
      label: `3. Add: SGST @ ${halfRate}%`,
      val: `Rs. ${halfGst.toLocaleString('en-IN')}`,
      bold: false,
      fill: undefined,
    },
    {
      label: `4. Total GST (${inv.gstRate}%)`,
      val: `Rs. ${gstAmount.toLocaleString('en-IN')}`,
      bold: true,
      fill: [0.96, 0.96, 0.96] as [number, number, number],
    },
    {
      label: '5. GRAND TOTAL',
      val: `Rs. ${grandTotal.toLocaleString('en-IN')}`,
      bold: true,
      fill: [0.95, 0.92, 0.84] as [number, number, number],
    },
    {
      label: '6. Less: Advance Paid',
      val: `Rs. ${inv.amountPaid.toLocaleString('en-IN')}`,
      bold: true,
      fill: [0.92, 0.98, 0.94] as [number, number, number],
    },
    {
      label: '7. NET BALANCE DUE',
      val: `Rs. ${balanceDue.toLocaleString('en-IN')}`,
      bold: true,
      fill:
        balanceDue > 0
          ? ([0.99, 0.92, 0.92] as [number, number, number])
          : ([0.9, 0.97, 0.92] as [number, number, number]),
    },
  ];

  finRows.forEach((row, idx) => {
    const ry = sumTop + idx * 22;
    page.drawBox(sumSplitX, ry, R - sumSplitX, 22, {
      fillRgb: row.fill,
      strokeRgb: [0.25, 0.3, 0.36],
      lineWidth: 0.55,
    });
    page.drawLine(finValX, ry, finValX, ry + 22, [0.75, 0.78, 0.82], 0.5);
    page.drawCellText(
      row.label,
      sumSplitX,
      ry,
      finValX - sumSplitX,
      22,
      14.5,
      {
        font: row.bold ? 'F2' : 'F1',
        size: 7.6,
      }
    );
    page.drawCellText(row.val, finValX, ry, R - finValX, 22, 14.5, {
      font: row.bold ? 'F2' : 'F3',
      size: 7.9,
      align: 'right',
    });
  });

  // 6. ROW 5: HSN / SAC TAX BREAKDOWN BOX (topY = 538..592, height = 54)
  const hsnTop = sumTop + sumH; // 538
  const hsnH = 54;
  page.drawBox(L, hsnTop, W, 16, {
    fillRgb: [0.91, 0.93, 0.95],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.7,
  });
  page.drawCellText('HSN / SAC GST TAX SUMMARY BREAKDOWN', L, hsnTop, W, 16, 11.5, {
    font: 'F2',
    size: 7.4,
  });

  const sacCols = [28, 128, 248, 354, 460, 567];
  page.drawBox(L, hsnTop + 16, W, 18, {
    fillRgb: [0.97, 0.97, 0.97],
    strokeRgb: [0.25, 0.3, 0.36],
    lineWidth: 0.5,
  });
  page.drawBox(L, hsnTop + 34, W, 20, {
    fillRgb: [1, 1, 1],
    strokeRgb: [0.25, 0.3, 0.36],
    lineWidth: 0.5,
  });
  sacCols.forEach((sx) => {
    page.drawLine(sx, hsnTop + 16, sx, hsnTop + hsnH, [0.25, 0.3, 0.36], 0.5);
  });

  const sacHeaders = [
    'SAC Code',
    'Taxable Value (INR)',
    `Central Tax (CGST ${halfRate}%)`,
    `State Tax (SGST ${halfRate}%)`,
    'Total Tax Amount',
  ];
  const sacValues = [
    inv.sacCode,
    `Rs. ${inv.taxableAmount.toLocaleString('en-IN')}`,
    `Rs. ${halfGst.toLocaleString('en-IN')}`,
    `Rs. ${halfGst.toLocaleString('en-IN')}`,
    `Rs. ${gstAmount.toLocaleString('en-IN')}`,
  ];

  for (let c = 0; c < 5; c++) {
    const cx = sacCols[c];
    const cw = sacCols[c + 1] - cx;
    page.drawCellText(sacHeaders[c], cx, hsnTop + 16, cw, 18, 12, {
      font: 'F2',
      size: 7.2,
      align: 'center',
    });
    page.drawCellText(sacValues[c], cx, hsnTop + 34, cw, 20, 13, {
      font: c === 4 ? 'F2' : 'F3',
      size: 7.8,
      align: 'center',
    });
  }

  // 7. ROW 6: FOOTER TERMS & CONDITIONS BOX + AUTHORIZED SIGNATORY BOX (topY = 592..790)
  const footTop = hsnTop + hsnH; // 592
  const footH = 198;
  const footSplitX = L + 355; // 383
  const termsBoxW = footSplitX - L; // 355
  const sigBoxW = R - footSplitX; // 184

  page.drawBox(L, footTop, W, footH, {
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.8,
  });
  page.drawLine(
    footSplitX,
    footTop,
    footSplitX,
    footTop + footH,
    [0.08, 0.12, 0.18],
    0.8
  );

  page.drawBox(L, footTop, termsBoxW, 18, {
    fillRgb: [0.95, 0.92, 0.84],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.7,
  });
  page.drawBox(footSplitX, footTop, sigBoxW, 18, {
    fillRgb: [0.95, 0.92, 0.84],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.7,
  });

  page.drawCellText(
    'TERMS & CONDITIONS (CATERING & BANQUET CONTRACT)',
    L,
    footTop,
    termsBoxW,
    18,
    12.5,
    { font: 'F2', size: 7.5, colorRgb: [0.08, 0.12, 0.18] }
  );
  page.drawCellText(
    'FOR THECATERINGS',
    footSplitX,
    footTop,
    sigBoxW,
    18,
    12.5,
    { font: 'F2', size: 7.8, colorRgb: [0.024, 0.306, 0.231], align: 'center' }
  );

  // Terms Body Clipped Strictly Above Signature Line (topY = 610..754)
  page.pushClipBox(L + 2, footTop + 19, termsBoxW - 4, 136);
  let termY = footTop + 31;
  const maxTermY = footTop + 148;
  terms.forEach((termLine) => {
    if (termY > maxTermY) return;
    const wrapped = wrapTextToLines(termLine, termsBoxW - 16, 'F1', 7.1, 2);
    wrapped.forEach((wl, wIdx) => {
      if (termY > maxTermY) return;
      page.drawText(wIdx > 0 ? '   ' + wl : wl, L + 7, termY, {
        font: 'F1',
        size: 7.1,
        colorRgb: [0.18, 0.2, 0.24],
        maxWidth: termsBoxW - 14,
      });
      termY += 11.5;
    });
    termY += 2;
  });
  page.popClipBox();

  // Customer Acknowledgement sub-box at bottom of Terms box
  page.drawLine(
    L,
    footTop + 158,
    footSplitX,
    footTop + 158,
    [0.3, 0.35, 0.4],
    0.5
  );
  page.drawCellText(
    'Client / Host Acceptance Signature : _______________________  Date: __________',
    L,
    footTop + 158,
    termsBoxW,
    40,
    22,
    { font: 'F2', size: 7.3, colorRgb: [0.25, 0.28, 0.32] }
  );

  // Right Box: Official Stamp & Authorized Signatory
  page.drawBox(footSplitX + 32, footTop + 34, 120, 48, {
    fillRgb: [0.98, 0.99, 0.98],
    strokeRgb: [0.024, 0.306, 0.231],
    lineWidth: 0.8,
  });
  page.drawCellText('THECATERINGS', footSplitX + 32, footTop + 34, 120, 18, 14, {
    font: 'F2',
    size: 8.2,
    colorRgb: [0.024, 0.306, 0.231],
    align: 'center',
  });
  page.drawCellText('GST VERIFIED SEAL', footSplitX + 32, footTop + 50, 120, 14, 11, {
    font: 'F3',
    size: 6.8,
    colorRgb: [0.55, 0.32, 0.04],
    align: 'center',
  });
  page.drawCellText('07AABCT2026B1Z8', footSplitX + 32, footTop + 64, 120, 14, 10, {
    font: 'F3',
    size: 6.6,
    colorRgb: [0.3, 0.35, 0.4],
    align: 'center',
  });

  page.drawLine(
    footSplitX + 24,
    footTop + 148,
    R - 24,
    footTop + 148,
    [0.2, 0.24, 0.3],
    0.7
  );
  page.drawCellText(
    'Authorized Signatory',
    footSplitX,
    footTop + 150,
    sigBoxW,
    16,
    12,
    { font: 'F2', size: 8.0, align: 'center' }
  );
  page.drawCellText(
    'Accounts & GST Compliance Desk',
    footSplitX,
    footTop + 165,
    sigBoxW,
    16,
    11,
    { font: 'F1', size: 7.0, colorRgb: [0.4, 0.42, 0.46], align: 'center' }
  );

  // 8. BOTTOM FOOTER BAR (topY = 790..816, height = 26)
  page.drawBox(L, 790, W, 26, {
    fillRgb: [0.024, 0.306, 0.231],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.9,
  });
  page.drawCellText(
    'COMPUTER GENERATED GST TAX INVOICE FROM THECATERINGS (GST INVOICING & LEDGER)',
    L,
    790,
    W,
    26,
    16,
    {
      font: 'F2',
      size: 7.2,
      colorRgb: [0.99, 0.94, 0.78],
      align: 'center',
    }
  );

  const finalFilename = buildSafeFilename(
    `TheCaterings_GST_Invoice_${inv.invoiceNo}`,
    preventFileOverwrite
  );
  compileAndDownloadPdf(finalFilename, [page]);
  return finalFilename;
}

/**
 * Generates a Boxed Column & Row Full GST Invoicing & Client Balance Ledger PDF
 * with Multi-Page Pagination and Strict Non-Overwriting Cell Clipping
 */
export function generateFullGstLedgerPdf(
  invoices: GstInvoice[],
  customTerms?: string[],
  preventFileOverwrite = true
): string {
  const terms =
    customTerms && customTerms.length > 0
      ? customTerms
      : DEFAULT_GST_TERMS_AND_CONDITIONS;

  const totalTaxable = invoices.reduce((s, i) => s + i.taxableAmount, 0);
  const totalGst = invoices.reduce(
    (s, i) => s + Math.round((i.taxableAmount * i.gstRate) / 100),
    0
  );
  const totalGrand = totalTaxable + totalGst;
  const totalPaid = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalBalance = Math.max(0, totalGrand - totalPaid);

  const ROWS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(invoices.length / ROWS_PER_PAGE));
  const pages: PdfPageCanvas[] = [];

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const page = new PdfPageCanvas();
    const pageInvoices = invoices.slice(
      pIdx * ROWS_PER_PAGE,
      (pIdx + 1) * ROWS_PER_PAGE
    );

    const L = 24;
    const W = 547;
    const R = L + W; // 571

    // 1. OUTER BORDER BOX
    page.drawBox(L, 24, W, 794, {
      strokeRgb: [0.08, 0.12, 0.18],
      lineWidth: 1.2,
    });

    // 2. TOP HEADER BOX WITH COMPANY LOGO (topY = 24..100, height = 76)
    const hdrSplitX = 424;
    page.drawBox(L, 24, W, 76, {
      fillRgb: [0.985, 0.98, 0.965],
      strokeRgb: [0.08, 0.12, 0.18],
      lineWidth: 1.0,
    });
    page.drawLine(hdrSplitX, 24, hdrSplitX, 100, [0.08, 0.12, 0.18], 0.85);

    page.drawCompanyLogo(L + 10, 36);

    const infoX = L + 70; // 94
    const infoMaxW = hdrSplitX - infoX - 8; // 322pt
    page.drawText('THECATERINGS', infoX, 44, {
      font: 'F2',
      size: 14.5,
      colorRgb: [0.024, 0.306, 0.231],
      maxWidth: infoMaxW,
      clipBox: [infoX, 28, infoMaxW + 4, 68],
    });
    page.drawText(
      'Consolidated GST Invoicing & Client Settlement Ledger',
      infoX,
      58,
      {
        font: 'F2',
        size: 8.2,
        colorRgb: [0.55, 0.32, 0.04],
        maxWidth: infoMaxW,
        clipBox: [infoX, 28, infoMaxW + 4, 68],
      }
    );
    page.drawText(
      'Supplier GSTIN: 07AABCT2026B1Z8  |  SAC 996333 (5%) & SAC 996332 (18%)  |  New Delhi',
      infoX,
      72,
      {
        font: 'F1',
        size: 7.2,
        colorRgb: [0.25, 0.28, 0.32],
        maxWidth: infoMaxW,
        clipBox: [infoX, 28, infoMaxW + 4, 68],
      }
    );
    page.drawText(
      'Gateways: Indian UPI (payments@thecaterings.upi) | Razorpay India | PayPal.Me/TheCaterings',
      infoX,
      86,
      {
        font: 'F2',
        size: 7.1,
        colorRgb: [0.1, 0.12, 0.16],
        maxWidth: infoMaxW,
        clipBox: [infoX, 28, infoMaxW + 4, 68],
      }
    );

    const badgeCenterX = (hdrSplitX + R) / 2; // 497.5
    page.drawBox(hdrSplitX + 8, 33, R - hdrSplitX - 16, 24, {
      fillRgb: [0.024, 0.306, 0.231],
      strokeRgb: [0.851, 0.467, 0.024],
      lineWidth: 0.9,
    });
    page.drawText('GST LEDGER STATEMENT', badgeCenterX, 48.5, {
      font: 'F2',
      size: 8.6,
      colorRgb: [1, 1, 1],
      align: 'center',
      maxWidth: 126,
    });
    page.drawText(
      `Date: ${new Date().toISOString().slice(0, 10)} | Page ${pIdx + 1}/${totalPages}`,
      badgeCenterX,
      71,
      {
        font: 'F3',
        size: 7.2,
        align: 'center',
        maxWidth: 135,
      }
    );
    page.drawText(`Total Recorded Bills: ${invoices.length}`, badgeCenterX, 85, {
      font: 'F2',
      size: 7.5,
      colorRgb: [0.55, 0.32, 0.04],
      align: 'center',
      maxWidth: 135,
    });

    // 3. ROW 2: 5 KPI SUMMARY BOXES IN A ROW (topY = 100..146, height = 46)
    const kpiTop = 100;
    const kpiH = 46;
    const kpiW = W / 5;
    const kpis = [
      {
        title: 'TAXABLE TURNOVER',
        val: `Rs. ${totalTaxable.toLocaleString('en-IN')}`,
        color: [0.08, 0.12, 0.18] as [number, number, number],
      },
      {
        title: 'TOTAL CGST + SGST',
        val: `Rs. ${totalGst.toLocaleString('en-IN')}`,
        color: [0.55, 0.32, 0.04] as [number, number, number],
      },
      {
        title: 'GROSS BILLED',
        val: `Rs. ${totalGrand.toLocaleString('en-IN')}`,
        color: [0.024, 0.306, 0.231] as [number, number, number],
      },
      {
        title: 'ADVANCE COLLECTED',
        val: `Rs. ${totalPaid.toLocaleString('en-IN')}`,
        color: [0.024, 0.45, 0.25] as [number, number, number],
      },
      {
        title: 'NET BALANCE DUE',
        val: `Rs. ${totalBalance.toLocaleString('en-IN')}`,
        color: [0.75, 0.15, 0.15] as [number, number, number],
      },
    ];

    kpis.forEach((k, idx) => {
      const kx = L + idx * kpiW;
      page.drawBox(kx, kpiTop, kpiW, kpiH, {
        fillRgb: idx === 4 ? [0.99, 0.95, 0.95] : [0.97, 0.98, 0.99],
        strokeRgb: [0.15, 0.2, 0.26],
        lineWidth: 0.7,
      });
      page.drawCellText(k.title, kx, kpiTop + 2, kpiW, 18, 13, {
        font: 'F2',
        size: 6.6,
        colorRgb: [0.35, 0.38, 0.42],
        align: 'center',
      });
      page.drawCellText(k.val, kx, kpiTop + 20, kpiW, 22, 14, {
        font: 'F2',
        size: 8.2,
        colorRgb: k.color,
        align: 'center',
      });
    });

    // 4. ROW 3: BOXED LEDGER TABLE (topY = 146)
    // Col 0: # (24..46, w=22)
    // Col 1: Invoice No / Date (46..136, w=90)
    // Col 2: Client Name & GSTIN (136..272, w=136)
    // Col 3: SAC/GST (272..318, w=46)
    // Col 4: Taxable (318..380, w=62)
    // Col 5: CGST+SGST (380..438, w=58)
    // Col 6: Grand Total & Paid (438..506, w=68)
    // Col 7: Balance Due & Status (506..571, w=65)
    const tblTop = 146;
    const colX = [24, 46, 136, 272, 318, 380, 438, 506, 571];
    const thH = 24;

    page.drawBox(L, tblTop, W, thH, {
      fillRgb: [0.024, 0.306, 0.231],
      strokeRgb: [0.08, 0.12, 0.18],
      lineWidth: 0.9,
    });

    const headerDefs = [
      { text: '#', align: 'center' as const },
      { text: 'INVOICE NO / DATE', align: 'left' as const },
      { text: 'CLIENT NAME & GSTIN', align: 'left' as const },
      { text: 'SAC/GST', align: 'center' as const },
      { text: 'TAXABLE', align: 'right' as const },
      { text: 'CGST+SGST', align: 'right' as const },
      { text: 'GRAND TOTAL', align: 'right' as const },
      { text: 'BALANCE DUE', align: 'right' as const },
    ];

    headerDefs.forEach((h, idx) => {
      const cx = colX[idx];
      const cw = colX[idx + 1] - cx;
      page.drawCellText(h.text, cx, tblTop, cw, thH, 15, {
        font: 'F2',
        size: 6.9,
        colorRgb: [1, 1, 1],
        align: h.align,
        paddingX: 3,
      });
    });

    let curY = tblTop + thH;
    const rowH = 34;

    for (let i = 0; i < pageInvoices.length; i++) {
      const inv = pageInvoices[i];
      const globalIdx = pIdx * ROWS_PER_PAGE + i + 1;
      const gst = Math.round((inv.taxableAmount * inv.gstRate) / 100);
      const grand = inv.taxableAmount + gst;
      const bal = Math.max(0, grand - inv.amountPaid);

      page.drawBox(L, curY, W, rowH, {
        fillRgb: i % 2 === 0 ? [1, 1, 1] : [0.985, 0.99, 0.985],
        strokeRgb: [0.25, 0.3, 0.36],
        lineWidth: 0.55,
      });

      // Col 0: #
      page.drawCellText(
        String(globalIdx).padStart(2, '0'),
        colX[0],
        curY,
        colX[1] - colX[0],
        rowH,
        19,
        { font: 'F3', size: 7.8, align: 'center', paddingX: 2 }
      );

      // Col 1: Invoice No + Billing Date
      page.drawCellText(
        inv.invoiceNo,
        colX[1],
        curY,
        colX[2] - colX[1],
        18,
        13,
        { font: 'F2', size: 7.5, paddingX: 4 }
      );
      page.drawCellText(
        inv.billingDate,
        colX[1],
        curY + 15,
        colX[2] - colX[1],
        18,
        11,
        { font: 'F3', size: 6.9, colorRgb: [0.4, 0.42, 0.46], paddingX: 4 }
      );

      // Col 2: Client Name + GSTIN
      page.drawCellText(
        inv.clientName,
        colX[2],
        curY,
        colX[3] - colX[2],
        18,
        13,
        { font: 'F2', size: 7.6, paddingX: 4 }
      );
      page.drawCellText(
        `GSTIN: ${inv.gstin}`,
        colX[2],
        curY + 15,
        colX[3] - colX[2],
        18,
        11,
        { font: 'F3', size: 6.7, colorRgb: [0.35, 0.38, 0.42], paddingX: 4 }
      );

      // Col 3: SAC & GST Rate
      page.drawCellText(
        inv.sacCode,
        colX[3],
        curY,
        colX[4] - colX[3],
        18,
        13,
        { font: 'F3', size: 7.5, align: 'center', paddingX: 2 }
      );
      page.drawCellText(
        `${inv.gstRate}% GST`,
        colX[3],
        curY + 15,
        colX[4] - colX[3],
        18,
        11,
        { font: 'F1', size: 6.6, colorRgb: [0.55, 0.32, 0.04], align: 'center', paddingX: 2 }
      );

      // Col 4: Taxable
      page.drawCellText(
        inv.taxableAmount.toLocaleString('en-IN'),
        colX[4],
        curY,
        colX[5] - colX[4],
        rowH,
        19,
        { font: 'F3', size: 7.6, align: 'right', paddingX: 4 }
      );

      // Col 5: CGST + SGST
      page.drawCellText(
        gst.toLocaleString('en-IN'),
        colX[5],
        curY,
        colX[6] - colX[5],
        rowH,
        19,
        { font: 'F3', size: 7.6, align: 'right', paddingX: 4 }
      );

      // Col 6: Grand Total + Paid
      page.drawCellText(
        grand.toLocaleString('en-IN'),
        colX[6],
        curY,
        colX[7] - colX[6],
        18,
        13,
        { font: 'F2', size: 7.8, align: 'right', paddingX: 4 }
      );
      page.drawCellText(
        `Paid: ${inv.amountPaid.toLocaleString('en-IN')}`,
        colX[6],
        curY + 15,
        colX[7] - colX[6],
        18,
        11,
        { font: 'F1', size: 6.3, colorRgb: [0.024, 0.45, 0.25], align: 'right', paddingX: 4 }
      );

      // Col 7: Balance Due + Status
      page.drawCellText(
        bal.toLocaleString('en-IN'),
        colX[7],
        curY,
        colX[8] - colX[7],
        18,
        13,
        {
          font: 'F2',
          size: 7.8,
          colorRgb: bal === 0 ? [0.024, 0.45, 0.25] : [0.75, 0.15, 0.15],
          align: 'right',
          paddingX: 4,
        }
      );
      page.drawCellText(
        inv.paymentStatus,
        colX[7],
        curY + 15,
        colX[8] - colX[7],
        18,
        11,
        { font: 'F1', size: 6.3, colorRgb: [0.35, 0.38, 0.42], align: 'right', paddingX: 4 }
      );

      curY += rowH;
    }

    // Consolidated Total Row at bottom of Ledger Table
    const totH = 26;
    page.drawBox(L, curY, W, totH, {
      fillRgb: [0.95, 0.92, 0.84],
      strokeRgb: [0.08, 0.12, 0.18],
      lineWidth: 0.9,
    });
    page.drawCellText(
      'CONSOLIDATED LEDGER TOTAL (INR)',
      colX[1],
      curY,
      colX[4] - colX[1],
      totH,
      16,
      { font: 'F2', size: 8.0 }
    );
    page.drawCellText(
      totalTaxable.toLocaleString('en-IN'),
      colX[4],
      curY,
      colX[5] - colX[4],
      totH,
      16,
      { font: 'F2', size: 7.8, align: 'right', paddingX: 4 }
    );
    page.drawCellText(
      totalGst.toLocaleString('en-IN'),
      colX[5],
      curY,
      colX[6] - colX[5],
      totH,
      16,
      { font: 'F2', size: 7.8, align: 'right', paddingX: 4 }
    );
    page.drawCellText(
      totalGrand.toLocaleString('en-IN'),
      colX[6],
      curY,
      colX[7] - colX[6],
      totH,
      16,
      { font: 'F2', size: 8.0, colorRgb: [0.024, 0.306, 0.231], align: 'right', paddingX: 4 }
    );
    page.drawCellText(
      totalBalance.toLocaleString('en-IN'),
      colX[7],
      curY,
      colX[8] - colX[7],
      totH,
      16,
      { font: 'F2', size: 8.0, colorRgb: [0.75, 0.15, 0.15], align: 'right', paddingX: 4 }
    );

    const tblBottom = curY + totH;
    colX.forEach((cx) => {
      page.drawLine(cx, tblTop, cx, tblBottom, [0.15, 0.2, 0.26], 0.7);
    });

    // 5. FOOTER TERMS & CONDITIONS + SIGNATORY BOX (topY = 610..792)
    const footTop = Math.max(tblBottom + 10, 610);
    const footH = 792 - footTop;
    const footSplitX = L + 365; // 389
    const termsW = footSplitX - L; // 365
    const sigW = R - footSplitX; // 182

    page.drawBox(L, footTop, W, footH, {
      strokeRgb: [0.08, 0.12, 0.18],
      lineWidth: 0.8,
    });
    page.drawLine(
      footSplitX,
      footTop,
      footSplitX,
      footTop + footH,
      [0.08, 0.12, 0.18],
      0.8
    );

    page.drawBox(L, footTop, termsW, 18, {
      fillRgb: [0.95, 0.92, 0.84],
      strokeRgb: [0.08, 0.12, 0.18],
      lineWidth: 0.7,
    });
    page.drawBox(footSplitX, footTop, sigW, 18, {
      fillRgb: [0.95, 0.92, 0.84],
      strokeRgb: [0.08, 0.12, 0.18],
      lineWidth: 0.7,
    });

    page.drawCellText(
      'TERMS & CONDITIONS & GST LEDGER RECONCILIATION NOTES',
      L,
      footTop,
      termsW,
      18,
      12.5,
      { font: 'F2', size: 7.4 }
    );
    page.drawCellText(
      'FOR THECATERINGS',
      footSplitX,
      footTop,
      sigW,
      18,
      12.5,
      { font: 'F2', size: 7.8, colorRgb: [0.024, 0.306, 0.231], align: 'center' }
    );

    // Strictly clip and word-wrap terms inside left box
    page.pushClipBox(L + 2, footTop + 19, termsW - 4, footH - 22);
    let ty = footTop + 31;
    const maxTy = footTop + footH - 8;
    terms.forEach((tLine) => {
      if (ty > maxTy) return;
      const wrapped = wrapTextToLines(tLine, termsW - 16, 'F1', 7.0, 2);
      wrapped.forEach((wl, wIdx) => {
        if (ty > maxTy) return;
        page.drawText(wIdx > 0 ? '   ' + wl : wl, L + 7, ty, {
          font: 'F1',
          size: 7.0,
          colorRgb: [0.18, 0.2, 0.24],
          maxWidth: termsW - 14,
        });
        ty += 11.5;
      });
      ty += 2;
    });
    page.popClipBox();

    // Stamp & Signatory in Right Box
    page.drawBox(footSplitX + 31, footTop + 28, 120, 42, {
      fillRgb: [0.98, 0.99, 0.98],
      strokeRgb: [0.024, 0.306, 0.231],
      lineWidth: 0.8,
    });
    page.drawCellText(
      'THECATERINGS',
      footSplitX + 31,
      footTop + 28,
      120,
      18,
      14,
      { font: 'F2', size: 8.2, colorRgb: [0.024, 0.306, 0.231], align: 'center' }
    );
    page.drawCellText(
      'AUDIT & GST LEDGER SEAL',
      footSplitX + 31,
      footTop + 46,
      120,
      18,
      11,
      { font: 'F3', size: 6.5, colorRgb: [0.55, 0.32, 0.04], align: 'center' }
    );

    page.drawLine(
      footSplitX + 22,
      footTop + footH - 34,
      R - 22,
      footTop + footH - 34,
      [0.2, 0.24, 0.3],
      0.7
    );
    page.drawCellText(
      'Authorized Signatory (Accounts & GST Desk)',
      footSplitX,
      footTop + footH - 32,
      sigW,
      20,
      12,
      { font: 'F2', size: 7.2, align: 'center' }
    );

    // Bottom Banner
    page.drawBox(L, 792, W, 26, {
      fillRgb: [0.024, 0.306, 0.231],
      strokeRgb: [0.08, 0.12, 0.18],
      lineWidth: 0.9,
    });
    page.drawCellText(
      'OFFICIAL GST INVOICING & LEDGER STATEMENT | THECATERINGS HOSPITALITY PVT. LTD.',
      L,
      792,
      W,
      26,
      16,
      {
        font: 'F2',
        size: 7.2,
        colorRgb: [0.99, 0.94, 0.78],
        align: 'center',
      }
    );

    pages.push(page);
  }

  const finalFilename = buildSafeFilename(
    'TheCaterings_GST_Invoicing_Ledger',
    preventFileOverwrite
  );
  compileAndDownloadPdf(finalFilename, pages);
  return finalFilename;
}

export interface ParsedPoLineItem {
  srNo: number;
  hsnCode: string;
  description: string;
  qtyText: string;
  numericQty: number;
  unitRate: number;
  taxableValue: number;
}

/**
 * Parses a PO's itemsSummary (e.g. "25 kg W240 Cashews · 12 kg Peshawari Pistachio · 10 Boxes Mongra Saffron")
 * into structured bill line items whose total matches po.totalAmount.
 */
export function parsePoItemsSummary(po: PurchaseOrder): {
  items: ParsedPoLineItem[];
  taxableSubtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
} {
  const rawParts = po.itemsSummary
    .split(/\s*(?:·|\+|,|;|\n)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parts = rawParts.length > 0 ? rawParts : [po.itemsSummary || 'Raw Material Consignment'];
  const grandTotal = Math.max(0, Math.round(po.totalAmount || 0));
  // Standard 5% GST Input on Mandi / Catering Raw Materials (2.5% CGST + 2.5% SGST)
  const taxableSubtotal = Math.round(grandTotal / 1.05);
  const totalGst = grandTotal - taxableSubtotal;
  const cgstAmount = Math.round(totalGst / 2);
  const sgstAmount = totalGst - cgstAmount;

  const hsnPool = ['0405', '1006', '0801', '0910', '0713', '1514'];

  // Distribute taxableSubtotal across parts
  let allocated = 0;
  const items: ParsedPoLineItem[] = parts.map((segment, idx) => {
    const qtyMatch = segment.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(.+)$/);
    const numericQty = qtyMatch ? Math.max(1, parseFloat(qtyMatch[1])) : 1;
    const unit = qtyMatch ? qtyMatch[2] : 'Lot';
    const desc = qtyMatch ? qtyMatch[3].trim() : segment;

    const isLast = idx === parts.length - 1;
    const weight = 1 / parts.length;
    const itemTaxable = isLast
      ? Math.max(0, taxableSubtotal - allocated)
      : Math.round(taxableSubtotal * weight);
    allocated += itemTaxable;

    const unitRate = Math.max(1, Math.round(itemTaxable / numericQty));

    return {
      srNo: idx + 1,
      hsnCode: hsnPool[idx % hsnPool.length],
      description: desc,
      qtyText: `${numericQty} ${unit}`,
      numericQty,
      unitRate,
      taxableValue: itemTaxable,
    };
  });

  return {
    items,
    taxableSubtotal,
    cgstAmount,
    sgstAmount,
    grandTotal,
  };
}

function drawPurchaseOrderBillPage(
  po: PurchaseOrder,
  customTerms?: string[],
  pageIndex?: number,
  totalPages?: number
): PdfPageCanvas {
  const page = new PdfPageCanvas();
  const L = 24;
  const W = 547;
  const R = L + W; // 571

  const parsed = parsePoItemsSummary(po);
  const termsToRender =
    customTerms && customTerms.length > 0
      ? customTerms
      : DEFAULT_PO_TERMS_AND_CONDITIONS;

  // Outer Master Frame
  page.drawBox(L, 20, W, 798, {
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 1.2,
  });

  // 1. Top Title Banner (20 -> 46)
  page.drawBox(L, 20, W, 26, {
    fillRgb: [0.47, 0.21, 0.04], // Rich Amber / Royal Commissary Brown
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 1,
  });
  page.drawCellText(
    'OFFICIAL VENDOR PURCHASE ORDER & MANDI INDENT BILL (TAX INPUT DOCUMENT)',
    L,
    20,
    W - 140,
    26,
    16,
    {
      font: 'F2',
      size: 8.8,
      colorRgb: [1, 1, 1],
      paddingX: 8,
    }
  );
  const badgeText =
    totalPages && totalPages > 1
      ? `PO BILL ${pageIndex! + 1} OF ${totalPages} • ${po.status.toUpperCase()}`
      : `STATUS: ${po.status.toUpperCase()}`;
  page.drawCellText(badgeText, R - 165, 20, 157, 26, 16, {
    font: 'F2',
    size: 7.5,
    colorRgb: [0.99, 0.92, 0.72],
    align: 'right',
    paddingX: 8,
  });

  // 2. Company Header & PO Metadata Split (46 -> 132, H = 86)
  const splitX = L + 315;
  const rightW = W - 315;
  page.drawBox(L, 46, 315, 86, {
    fillRgb: [0.99, 0.98, 0.96],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawCellText('TheCaterings Hospitality Pvt. Ltd.', L, 46, 315, 86, 17, {
    font: 'F2',
    size: 12,
    colorRgb: [0.06, 0.09, 0.16],
    paddingX: 8,
  });
  page.drawCellText(
    'Central Commissary & Cold-Chain Receiving Dock, Okhla Phase-III, New Delhi - 110020',
    L,
    46,
    315,
    86,
    31,
    { font: 'F1', size: 7.5, colorRgb: [0.28, 0.33, 0.41], paddingX: 8 }
  );
  page.drawCellText(
    'Buyer GSTIN: 07AABCT1332L1Z5   |   PAN: AABCT1332L',
    L,
    46,
    315,
    86,
    45,
    { font: 'F3', size: 7.6, colorRgb: [0.47, 0.21, 0.04], paddingX: 8 }
  );
  page.drawCellText(
    'FSSAI Central Lic: 10021011000492   |   Mandi Indent Desk: +91 98111 44290',
    L,
    46,
    315,
    86,
    59,
    { font: 'F1', size: 7.3, colorRgb: [0.28, 0.33, 0.41], paddingX: 8 }
  );
  page.drawCellText(
    'Gate Timing: 06:00 AM - 10:00 AM IST (Dharam-Kanta Slip Mandatory)',
    L,
    46,
    315,
    86,
    73,
    { font: 'F2', size: 7.2, colorRgb: [0.02, 0.35, 0.25], paddingX: 8 }
  );

  // Right 2x2 Grid for PO Metadata
  const halfRightW = Math.round(rightW / 2);
  const col2W = rightW - halfRightW;
  // Top-left cell: PO Number
  page.drawBox(splitX, 46, halfRightW, 43, {
    fillRgb: [1, 1, 1],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawCellText('PURCHASE ORDER NO.', splitX, 46, halfRightW, 43, 13, {
    font: 'F2',
    size: 6.8,
    colorRgb: [0.4, 0.45, 0.52],
    paddingX: 6,
  });
  page.drawCellText(po.poNumber, splitX, 46, halfRightW, 43, 28, {
    font: 'F3',
    size: 9.2,
    colorRgb: [0.47, 0.21, 0.04],
    paddingX: 6,
  });

  // Top-right cell: Expected Delivery Date (ETA)
  page.drawBox(splitX + halfRightW, 46, col2W, 43, {
    fillRgb: [1, 1, 1],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawCellText(
    'DELIVERY ETA DATE',
    splitX + halfRightW,
    46,
    col2W,
    43,
    13,
    {
      font: 'F2',
      size: 6.8,
      colorRgb: [0.4, 0.45, 0.52],
      paddingX: 6,
    }
  );
  page.drawCellText(
    po.deliveryDate || 'Immediate',
    splitX + halfRightW,
    46,
    col2W,
    43,
    28,
    {
      font: 'F3',
      size: 8.8,
      colorRgb: [0.06, 0.09, 0.16],
      paddingX: 6,
    }
  );

  // Bottom-left cell: Indent / Voucher Mode
  page.drawBox(splitX, 89, halfRightW, 43, {
    fillRgb: [1, 1, 1],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawCellText('INDENT / PAYMENT TERMS', splitX, 89, halfRightW, 43, 13, {
    font: 'F2',
    size: 6.8,
    colorRgb: [0.4, 0.45, 0.52],
    paddingX: 6,
  });
  page.drawCellText('Credit / 7-Day GRN', splitX, 89, halfRightW, 43, 28, {
    font: 'F2',
    size: 8.2,
    colorRgb: [0.06, 0.09, 0.16],
    paddingX: 6,
  });

  // Bottom-right cell: GRN Status
  const statusColor: [number, number, number] =
    po.status === 'Received & Verified'
      ? [0.02, 0.4, 0.28]
      : po.status === 'Issued'
      ? [0.65, 0.28, 0.04]
      : [0.2, 0.28, 0.4];
  page.drawBox(splitX + halfRightW, 89, col2W, 43, {
    fillRgb: [0.99, 0.98, 0.95],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawCellText(
    'GRN / PO STATUS',
    splitX + halfRightW,
    89,
    col2W,
    43,
    13,
    {
      font: 'F2',
      size: 6.8,
      colorRgb: [0.4, 0.45, 0.52],
      paddingX: 6,
    }
  );
  page.drawCellText(po.status, splitX + halfRightW, 89, col2W, 43, 28, {
    font: 'F2',
    size: 8.2,
    colorRgb: statusColor,
    paddingX: 6,
  });

  // 3. Supplier / Vendor Details & Ship-To Consignee (132 -> 212, H = 80)
  page.drawBox(L, 132, 315, 80, {
    fillRgb: [1, 1, 1],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawBox(L, 132, 315, 18, {
    fillRgb: [0.94, 0.95, 0.97],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.6,
  });
  page.drawCellText(
    'ISSUED TO SUPPLIER / MANDI VENDOR (BILLED FROM)',
    L,
    132,
    315,
    18,
    12,
    { font: 'F2', size: 7.4, colorRgb: [0.15, 0.2, 0.28], paddingX: 8 }
  );
  page.drawCellText(po.vendorName, L, 150, 315, 62, 16, {
    font: 'F2',
    size: 10.2,
    colorRgb: [0.06, 0.09, 0.16],
    paddingX: 8,
  });
  page.drawCellText(
    'Authorized Wholesale Mandi & Cold-Chain Raw Material Supplier',
    L,
    150,
    315,
    62,
    31,
    { font: 'F1', size: 7.5, colorRgb: [0.3, 0.35, 0.42], paddingX: 8 }
  );
  page.drawCellText(
    'Supply Category: FSSAI Grade-A Commissary Stock   |   State Code: 07 / 06',
    L,
    150,
    315,
    62,
    46,
    { font: 'F3', size: 7.3, colorRgb: [0.47, 0.21, 0.04], paddingX: 8 }
  );

  // Right Box: Consignee / Ship To
  page.drawBox(splitX, 132, rightW, 80, {
    fillRgb: [1, 1, 1],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawBox(splitX, 132, rightW, 18, {
    fillRgb: [0.94, 0.95, 0.97],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.6,
  });
  page.drawCellText(
    'DELIVERY CONSIGNEE (SHIP TO COMMISSARY)',
    splitX,
    132,
    rightW,
    18,
    12,
    { font: 'F2', size: 7.4, colorRgb: [0.15, 0.2, 0.28], paddingX: 8 }
  );
  page.drawCellText(
    'TheCaterings Central Store & Cold-Chain',
    splitX,
    150,
    rightW,
    62,
    16,
    { font: 'F2', size: 9.2, colorRgb: [0.06, 0.09, 0.16], paddingX: 8 }
  );
  page.drawCellText(
    'Receiving Gate #2, Okhla Industrial Area, New Delhi',
    splitX,
    150,
    rightW,
    62,
    31,
    { font: 'F1', size: 7.4, colorRgb: [0.3, 0.35, 0.42], paddingX: 8 }
  );
  page.drawCellText(
    'Quality Check: Head Maharaj & Store In-Charge',
    splitX,
    150,
    rightW,
    62,
    46,
    { font: 'F2', size: 7.3, colorRgb: [0.02, 0.35, 0.25], paddingX: 8 }
  );

  // 4. Boxed Purchase Order Line Items Table (Top = 212)
  const tblTop = 212;
  const colW = [32, 235, 55, 75, 70, 80]; // Sum = 547 = W
  const colX = [
    L,
    L + 32,
    L + 267,
    L + 322,
    L + 397,
    L + 467,
  ];
  const headers = [
    'SR.',
    'RAW MATERIAL / SKU DESCRIPTION',
    'HSN',
    'ORDERED QTY',
    'EST. RATE',
    'TAXABLE (INR)',
  ];

  // Table Header Row (212 -> 234, H = 22)
  for (let c = 0; c < colW.length; c++) {
    page.drawBox(colX[c], tblTop, colW[c], 22, {
      fillRgb: [0.12, 0.16, 0.23],
      strokeRgb: [0.08, 0.12, 0.18],
      lineWidth: 0.8,
    });
    page.drawCellText(headers[c], colX[c], tblTop, colW[c], 22, 14, {
      font: 'F2',
      size: 7.2,
      colorRgb: [1, 1, 1],
      align: c === 0 || c === 2 ? 'center' : c >= 3 ? 'right' : 'left',
      paddingX: 5,
    });
  }

  // Render up to 6 boxed item rows (each H = 34, total 204pt -> 234 to 438)
  const maxRows = 6;
  const rowH = 34;
  let curY = tblTop + 22;

  for (let r = 0; r < maxRows; r++) {
    const item = parsed.items[r];
    const rowBg: [number, number, number] =
      r % 2 === 0 ? [1, 1, 1] : [0.99, 0.985, 0.97];

    for (let c = 0; c < colW.length; c++) {
      page.drawBox(colX[c], curY, colW[c], rowH, {
        fillRgb: rowBg,
        strokeRgb: [0.22, 0.27, 0.34],
        lineWidth: 0.6,
      });
    }

    if (item) {
      page.drawCellText(String(item.srNo), colX[0], curY, colW[0], rowH, 20, {
        font: 'F3',
        size: 8,
        align: 'center',
      });
      page.drawCellText(item.description, colX[1], curY, colW[1], rowH, 15, {
        font: 'F2',
        size: 8.5,
        colorRgb: [0.06, 0.09, 0.16],
        paddingX: 6,
      });
      page.drawCellText(
        `PO Ref: ${po.poNumber} • Grade-A Commissary Spec`,
        colX[1],
        curY,
        colW[1],
        rowH,
        27,
        {
          font: 'F1',
          size: 6.8,
          colorRgb: [0.42, 0.47, 0.54],
          paddingX: 6,
        }
      );
      page.drawCellText(item.hsnCode, colX[2], curY, colW[2], rowH, 20, {
        font: 'F3',
        size: 7.8,
        align: 'center',
        colorRgb: [0.25, 0.3, 0.38],
      });
      page.drawCellText(item.qtyText, colX[3], curY, colW[3], rowH, 20, {
        font: 'F3',
        size: 8.2,
        align: 'right',
        paddingX: 6,
        colorRgb: [0.06, 0.09, 0.16],
      });
      page.drawCellText(
        formatRsPdf(item.unitRate),
        colX[4],
        curY,
        colW[4],
        rowH,
        20,
        {
          font: 'F3',
          size: 8,
          align: 'right',
          paddingX: 6,
          colorRgb: [0.2, 0.25, 0.32],
        }
      );
      page.drawCellText(
        formatRsPdf(item.taxableValue),
        colX[5],
        curY,
        colW[5],
        rowH,
        20,
        {
          font: 'F3',
          size: 8.5,
          align: 'right',
          paddingX: 6,
          colorRgb: [0.06, 0.09, 0.16],
        }
      );
    }

    curY += rowH;
  }

  // 5. Complete Order Specification Strip (curY = 438 -> 468, H = 30)
  page.drawBox(L, curY, W, 30, {
    fillRgb: [0.98, 0.96, 0.91],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawCellText(
    `CONSOLIDATED PO INDENT SUMMARY: ${po.itemsSummary}`,
    L,
    curY,
    W,
    30,
    18,
    {
      font: 'F2',
      size: 7.8,
      colorRgb: [0.38, 0.18, 0.04],
      paddingX: 8,
    }
  );
  curY += 30; // 468

  // 6. Amount in Words + Tax & Total Calculation Split (468 -> 608, H = 140)
  const leftBoxW = 322;
  const rightBoxW = W - leftBoxW; // 225
  const rightBoxX = L + leftBoxW;

  // Left: Amount in Words & Quality Verification Box
  page.drawBox(L, curY, leftBoxW, 140, {
    fillRgb: [1, 1, 1],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawBox(L, curY, leftBoxW, 20, {
    fillRgb: [0.94, 0.95, 0.97],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.6,
  });
  page.drawCellText(
    'TOTAL PO BILL AMOUNT IN WORDS (INDIAN RUPEES)',
    L,
    curY,
    leftBoxW,
    20,
    13,
    { font: 'F2', size: 7.2, colorRgb: [0.15, 0.2, 0.28], paddingX: 8 }
  );

  const wordsStr = `Rupees ${numberToIndianWords(parsed.grandTotal)} Only`;
  page.drawWrappedTextInBox(wordsStr, L, curY + 20, leftBoxW, 44, {
    font: 'F2',
    size: 8.6,
    colorRgb: [0.06, 0.09, 0.16],
    paddingX: 8,
    paddingY: 13,
    lineHeight: 12,
  });

  // Sub-box inside left for Quality & Bank Settlement Info
  page.drawBox(L, curY + 64, leftBoxW, 76, {
    fillRgb: [0.99, 0.99, 0.98],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.6,
  });
  page.drawCellText(
    'COMMISSARY RECEIVING & VENDOR PAYOUT DESK',
    L,
    curY + 64,
    leftBoxW,
    76,
    14,
    { font: 'F2', size: 7.3, colorRgb: [0.02, 0.35, 0.25], paddingX: 8 }
  );
  page.drawCellText(
    '• GRN Weight Check: Net weight after tare deduction only.',
    L,
    curY + 64,
    leftBoxW,
    76,
    29,
    { font: 'F1', size: 7.2, colorRgb: [0.25, 0.3, 0.38], paddingX: 8 }
  );
  page.drawCellText(
    '• Payout Mode: NEFT / RTGS / Corporate UPI within 7 days of GRN.',
    L,
    curY + 64,
    leftBoxW,
    76,
    43,
    { font: 'F1', size: 7.2, colorRgb: [0.25, 0.3, 0.38], paddingX: 8 }
  );
  page.drawCellText(
    '• Accounts Desk: accounts@thecaterings.in | +91 11 4052 8800',
    L,
    curY + 64,
    leftBoxW,
    76,
    57,
    { font: 'F3', size: 7.1, colorRgb: [0.47, 0.21, 0.04], paddingX: 8 }
  );

  // Right: Tax & Grand Total Breakdown Rows (H = 140: 4 rows of 26 + Grand Total 36)
  const summaryRows: Array<{ label: string; val: string; bold?: boolean }> = [
    {
      label: 'Taxable Raw Material Value',
      val: formatRsPdf(parsed.taxableSubtotal),
      bold: true,
    },
    {
      label: 'Add: Input CGST @ 2.5%',
      val: formatRsPdf(parsed.cgstAmount),
    },
    {
      label: 'Add: Input SGST @ 2.5%',
      val: formatRsPdf(parsed.sgstAmount),
    },
    {
      label: 'Freight / Cold-Chain Unloading',
      val: 'Included',
    },
  ];

  let sumY = curY;
  const labelW = 135;
  const valW = rightBoxW - labelW; // 90

  for (const sr of summaryRows) {
    page.drawBox(rightBoxX, sumY, labelW, 26, {
      fillRgb: [0.98, 0.98, 0.99],
      strokeRgb: [0.15, 0.2, 0.28],
      lineWidth: 0.6,
    });
    page.drawBox(rightBoxX + labelW, sumY, valW, 26, {
      fillRgb: [1, 1, 1],
      strokeRgb: [0.15, 0.2, 0.28],
      lineWidth: 0.6,
    });
    page.drawCellText(sr.label, rightBoxX, sumY, labelW, 26, 16, {
      font: sr.bold ? 'F2' : 'F1',
      size: 7.4,
      colorRgb: [0.15, 0.2, 0.28],
      paddingX: 6,
    });
    page.drawCellText(sr.val, rightBoxX + labelW, sumY, valW, 26, 16, {
      font: 'F3',
      size: 7.8,
      align: 'right',
      colorRgb: [0.06, 0.09, 0.16],
      paddingX: 6,
    });
    sumY += 26;
  }

  // Grand Total Box (H = 36)
  page.drawBox(rightBoxX, sumY, labelW, 36, {
    fillRgb: [0.47, 0.21, 0.04],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.9,
  });
  page.drawBox(rightBoxX + labelW, sumY, valW, 36, {
    fillRgb: [0.99, 0.95, 0.85],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.9,
  });
  page.drawCellText('GRAND TOTAL PO VALUE', rightBoxX, sumY, labelW, 36, 22, {
    font: 'F2',
    size: 8.2,
    colorRgb: [1, 1, 1],
    paddingX: 6,
  });
  page.drawCellText(
    formatRsPdf(parsed.grandTotal),
    rightBoxX + labelW,
    sumY,
    valW,
    36,
    22,
    {
      font: 'F3',
      size: 9.8,
      align: 'right',
      colorRgb: [0.47, 0.21, 0.04],
      paddingX: 6,
    }
  );

  curY += 140; // 608

  // 7. Terms & Conditions + Signatory Box (608 -> 792, H = 184)
  const footH = 184;
  page.drawBox(L, curY, leftBoxW, footH, {
    fillRgb: [1, 1, 1],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawBox(L, curY, leftBoxW, 20, {
    fillRgb: [0.94, 0.95, 0.97],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.6,
  });
  page.drawCellText(
    'PURCHASE ORDER TERMS & MANDI RECEIVING CONDITIONS',
    L,
    curY,
    leftBoxW,
    20,
    13,
    { font: 'F2', size: 7.2, colorRgb: [0.15, 0.2, 0.28], paddingX: 8 }
  );

  let termY = curY + 26;
  for (let i = 0; i < Math.min(termsToRender.length, 6); i++) {
    const used = page.drawWrappedTextInBox(
      termsToRender[i],
      L,
      termY,
      leftBoxW,
      32,
      {
        font: 'F1',
        size: 6.9,
        colorRgb: [0.22, 0.27, 0.34],
        paddingX: 8,
        paddingY: 7,
        lineHeight: 9.5,
      }
    );
    termY += Math.max(12, used * 10.5 + 3);
    if (termY > curY + footH - 12) break;
  }

  // Right Signatory Box
  page.drawBox(rightBoxX, curY, rightBoxW, footH, {
    fillRgb: [0.99, 0.99, 0.98],
    strokeRgb: [0.15, 0.2, 0.28],
    lineWidth: 0.8,
  });
  page.drawCellText(
    'For TheCaterings Hospitality Pvt. Ltd.',
    rightBoxX,
    curY,
    rightBoxW,
    footH,
    18,
    {
      font: 'F2',
      size: 8.2,
      align: 'center',
      colorRgb: [0.06, 0.09, 0.16],
    }
  );
  page.drawCellText(
    'CENTRAL COMMISSARY & PROCUREMENT DIVISION',
    rightBoxX,
    curY,
    rightBoxW,
    footH,
    31,
    {
      font: 'F1',
      size: 6.6,
      align: 'center',
      colorRgb: [0.4, 0.45, 0.52],
    }
  );

  // Digital Verification Stamp Box inside Signatory
  page.drawBox(rightBoxX + 32, curY + 52, rightBoxW - 64, 54, {
    fillRgb: [0.98, 0.96, 0.9],
    strokeRgb: [0.65, 0.35, 0.08],
    lineWidth: 0.8,
  });
  page.drawCellText(
    'APPROVED COMMISSARY PO',
    rightBoxX + 32,
    curY + 52,
    rightBoxW - 64,
    54,
    18,
    {
      font: 'F2',
      size: 7.4,
      align: 'center',
      colorRgb: [0.47, 0.21, 0.04],
    }
  );
  page.drawCellText(
    `PO Ref: ${po.poNumber}`,
    rightBoxX + 32,
    curY + 52,
    rightBoxW - 64,
    54,
    31,
    {
      font: 'F3',
      size: 7.2,
      align: 'center',
      colorRgb: [0.15, 0.2, 0.28],
    }
  );
  page.drawCellText(
    `Status: ${po.status}`,
    rightBoxX + 32,
    curY + 52,
    rightBoxW - 64,
    54,
    44,
    {
      font: 'F2',
      size: 6.8,
      align: 'center',
      colorRgb: [0.02, 0.38, 0.26],
    }
  );

  // Signature Line at bottom of right box
  page.drawLine(
    rightBoxX + 25,
    curY + footH - 36,
    rightBoxX + rightBoxW - 25,
    curY + footH - 36,
    [0.2, 0.25, 0.32],
    0.7
  );
  page.drawCellText(
    'Head Maharaj / Procurement Signatory',
    rightBoxX,
    curY + footH - 34,
    rightBoxW,
    20,
    12,
    {
      font: 'F2',
      size: 7.2,
      align: 'center',
      colorRgb: [0.15, 0.2, 0.28],
    }
  );
  page.drawCellText(
    'Vendor Seal & Gate Pass Sign on Delivery',
    rightBoxX,
    curY + footH - 20,
    rightBoxW,
    18,
    10,
    {
      font: 'F1',
      size: 6.5,
      align: 'center',
      colorRgb: [0.45, 0.5, 0.56],
    }
  );

  // 8. Bottom Banner (792 -> 818, H = 26)
  page.drawBox(L, 792, W, 26, {
    fillRgb: [0.47, 0.21, 0.04],
    strokeRgb: [0.08, 0.12, 0.18],
    lineWidth: 0.9,
  });
  page.drawCellText(
    'OFFICIAL VENDOR PURCHASE ORDER BILL | THECATERINGS HOSPITALITY PVT. LTD. | NEW DELHI',
    L,
    792,
    W,
    26,
    16,
    {
      font: 'F2',
      size: 7.2,
      colorRgb: [0.99, 0.94, 0.78],
      align: 'center',
    }
  );

  return page;
}

/**
 * Generates and downloads a single-page Boxed Bill Format PDF for an Issued / Active Purchase Order
 */
export function generateSinglePurchaseOrderPdf(
  po: PurchaseOrder,
  preventFileOverwrite: boolean,
  customTerms?: string[]
): string {
  const page = drawPurchaseOrderBillPage(po, customTerms);
  const safePoNo = po.poNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeVendor = po.vendorName
    .split(',')[0]
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const finalFilename = buildSafeFilename(
    `TheCaterings_PO_Bill_${safePoNo}_${safeVendor}`,
    preventFileOverwrite
  );
  compileAndDownloadPdf(finalFilename, [page]);
  return finalFilename;
}

/**
 * Generates and downloads a multi-page Boxed Bill Format PDF for all Issued / Active Purchase Orders
 */
export function generateAllPurchaseOrdersPdf(
  purchaseOrders: PurchaseOrder[],
  preventFileOverwrite: boolean,
  customTerms?: string[],
  onlyIssued = false
): string {
  const targetList = onlyIssued
    ? purchaseOrders.filter((p) => p.status === 'Issued')
    : purchaseOrders;
  const listToRender =
    targetList.length > 0 ? targetList : purchaseOrders;

  const pages = listToRender.map((po, idx) =>
    drawPurchaseOrderBillPage(po, customTerms, idx, listToRender.length)
  );

  const prefix = onlyIssued
    ? 'TheCaterings_Issued_PO_Bills_Register'
    : 'TheCaterings_All_Vendor_PO_Bills_Register';
  const finalFilename = buildSafeFilename(prefix, preventFileOverwrite);
  compileAndDownloadPdf(finalFilename, pages);
  return finalFilename;
}

