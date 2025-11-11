import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';

/**
 * Text replacement configuration for PDF templates
 */
export interface TextReplacement {
  placeholder: string;
  value: string;
  x: number; // X coordinate where text should be placed
  y: number; // Y coordinate where text should be placed (from top)
  fontSize?: number;
  fontColor?: { r: number; g: number; b: number };
  coverWidth?: number; // Width of white rectangle to cover old text
  coverHeight?: number; // Height of white rectangle to cover old text
}

/**
 * Replace text placeholders in a PDF by drawing over them
 * @param pdfDoc The PDF document to modify
 * @param replacements Array of text replacements
 */
export async function replaceTextInPDF(
  pdfDoc: PDFDocument,
  replacements: TextReplacement[]
): Promise<void> {
  const pages = pdfDoc.getPages();
  const page = pages[0]; // Work with first page
  const { height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const replacement of replacements) {
    if (!replacement.value) continue; // Skip empty values

    // Cover the old text with a white rectangle if dimensions provided
    if (replacement.coverWidth && replacement.coverHeight) {
      page.drawRectangle({
        x: replacement.x - 2,
        y: height - replacement.y - replacement.coverHeight + 2,
        width: replacement.coverWidth,
        height: replacement.coverHeight,
        color: rgb(1, 1, 1), // White
      });
    }

    // Draw the replacement text
    page.drawText(replacement.value, {
      x: replacement.x,
      y: height - replacement.y,
      size: replacement.fontSize || 12,
      font: font,
      color: replacement.fontColor 
        ? rgb(replacement.fontColor.r, replacement.fontColor.g, replacement.fontColor.b)
        : rgb(0, 0, 0),
    });
  }
}

/**
 * Default coordinates for the card template placeholders
 * These should match the positions in card_template.pdf
 * You may need to adjust these based on your actual template
 */
export const TEMPLATE_FIELD_POSITIONS: Record<string, Omit<TextReplacement, 'placeholder' | 'value'>> = {
  firstName: {
    x: 150,
    y: 200,
    fontSize: 14,
    coverWidth: 200,
    coverHeight: 20,
  },
  lastName: {
    x: 150,
    y: 230,
    fontSize: 14,
    coverWidth: 200,
    coverHeight: 20,
  },
  dateOfBirth: {
    x: 150,
    y: 260,
    fontSize: 12,
    coverWidth: 200,
    coverHeight: 20,
  },
  major: {
    x: 150,
    y: 290,
    fontSize: 12,
    coverWidth: 200,
    coverHeight: 20,
  },
  branch: {
    x: 150,
    y: 320,
    fontSize: 12,
    coverWidth: 200,
    coverHeight: 20,
  },
};


