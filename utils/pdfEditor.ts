import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { replaceTextInPDF, TEMPLATE_FIELD_POSITIONS, type TextReplacement } from './pdfTextReplacer';

/**
 * PDF Editor utility for editing text in PDF files without ejecting
 * Uses pdf-lib which works seamlessly with Expo
 */

export interface TextField {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontColor?: { r: number; g: number; b: number };
  fontName?: StandardFonts;
}

export interface ImageField {
  x: number;
  y: number;
  width: number;
  height: number;
  imageUri: string;
}

export interface PDFEditOptions {
  textFields?: TextField[];
  imageFields?: ImageField[];
  formFields?: Record<string, string>; // For fillable PDF forms
  textReplacements?: Record<string, string>; // For finding and replacing text
}

/**
 * Load a PDF from assets or file system
 * @param assetModule - The asset module (e.g., require('./assets/pdf/template.pdf'))
 */
async function loadPDFFromAsset(assetModule: any): Promise<Uint8Array> {
  try {
    // For assets bundled with the app
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    
    if (!asset.localUri) {
      throw new Error('Failed to load asset');
    }
    
    const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  } catch (error) {
    console.error('Error loading PDF from asset:', error);
    throw error;
  }
}

/**
 * Load a PDF from a file URI
 */
async function loadPDFFromUri(uri: string): Promise<Uint8Array> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  } catch (error) {
    console.error('Error loading PDF from URI:', error);
    throw error;
  }
}

/**
 * Load an image from URI and convert to PDF format
 */
async function loadImageForPDF(uri: string): Promise<Uint8Array> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  } catch (error) {
    console.error('Error loading image for PDF:', error);
    throw error;
  }
}

/**
 * Edit a PDF by adding text and images
 * @param sourcePath - Path to source PDF (file URI or URL) OR asset module
 * @param options - Editing options (text fields, images, form fields)
 * @param assetModule - Optional: Asset module if loading from bundled assets (e.g., require('./assets/pdf/template.pdf'))
 * @returns Base64 string of the edited PDF
 */
export async function editPDF(
  sourcePath: string | any,
  options: PDFEditOptions,
  assetModule?: any
): Promise<string> {
  try {
    // Load the PDF
    let pdfBytes: Uint8Array;
    
    // If assetModule is provided, use it
    if (assetModule) {
      pdfBytes = await loadPDFFromAsset(assetModule);
    } else if (typeof sourcePath === 'string') {
      if (sourcePath.startsWith('http://') || sourcePath.startsWith('https://')) {
        // Load from URL
        const response = await fetch(sourcePath);
        const arrayBuffer = await response.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
      } else if (sourcePath.startsWith('file://') || sourcePath.startsWith('/')) {
        // Load from file system
        pdfBytes = await loadPDFFromUri(sourcePath);
      } else {
        throw new Error('Invalid source path. Provide assetModule for bundled assets or use file:// URI');
      }
    } else {
      // sourcePath is an asset module
      pdfBytes = await loadPDFFromAsset(sourcePath);
    }

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Add text fields
    if (options.textFields && options.textFields.length > 0) {
      for (const textField of options.textFields) {
        const font = await pdfDoc.embedFont(
          textField.fontName || StandardFonts.Helvetica
        );
        
        firstPage.drawText(textField.text, {
          x: textField.x,
          y: height - textField.y, // PDF coordinates are bottom-up
          size: textField.fontSize || 12,
          font: font,
          color: textField.fontColor 
            ? rgb(textField.fontColor.r, textField.fontColor.g, textField.fontColor.b)
            : rgb(0, 0, 0),
        });
      }
    }

    // Add image fields
    if (options.imageFields && options.imageFields.length > 0) {
      for (const imageField of options.imageFields) {
        try {
          const imageBytes = await loadImageForPDF(imageField.imageUri);
          
          // Determine image type from URI or bytes
          let image;
          if (imageField.imageUri.toLowerCase().endsWith('.png')) {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            image = await pdfDoc.embedJpg(imageBytes);
          }

          firstPage.drawImage(image, {
            x: imageField.x,
            y: height - imageField.y - imageField.height, // PDF coordinates are bottom-up
            width: imageField.width,
            height: imageField.height,
          });
        } catch (error) {
          console.error('Error adding image to PDF:', error);
          // Continue with other images even if one fails
        }
      }
    }

    // Replace text placeholders (if provided)
    if (options.textReplacements) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      for (const [placeholder, replacement] of Object.entries(options.textReplacements)) {
        // This is a simple implementation that adds text at known positions
        // For actual text replacement, you'd need to know the coordinates
        // This is handled better in pdfTextReplacer.ts
      }
    }

    // Fill form fields (for fillable PDFs)
    if (options.formFields) {
      try {
        const form = pdfDoc.getForm();
        const formFields = form.getFields();
        
        for (const [fieldName, value] of Object.entries(options.formFields)) {
          try {
            const field = formFields.find((f) => f.getName() === fieldName);
            if (field) {
              const fieldType = field.constructor.name;
              if (fieldType === 'PDFTextField') {
                (field as any).setText(value);
              } else if (fieldType === 'PDFCheckBox') {
                (field as any).check();
              }
            }
          } catch (error) {
            console.error(`Error filling form field ${fieldName}:`, error);
          }
        }
      } catch (formError) {
        // PDF might not have form fields, that's okay
        console.log('No form fields in PDF or error accessing them');
      }
    }

    // Serialize the PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Convert to base64
    const base64 = btoa(
      String.fromCharCode(...Array.from(modifiedPdfBytes))
    );
    
    return base64;
  } catch (error) {
    console.error('Error editing PDF:', error);
    throw error;
  }
}

/**
 * Save PDF to file system
 * @param base64Pdf - Base64 string of the PDF
 * @param fileName - Name of the file to save
 * @returns URI of the saved file
 */
export async function savePDFToFile(
  base64Pdf: string,
  fileName: string = 'edited.pdf'
): Promise<string> {
  try {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
  } catch (error) {
    console.error('Error saving PDF to file:', error);
    throw error;
  }
}

/**
 * Create a new PDF from scratch
 * @param options - Options for creating the PDF
 * @returns Base64 string of the created PDF
 */
export async function createPDF(
  options: {
    width?: number;
    height?: number;
    textFields?: TextField[];
    imageFields?: ImageField[];
  }
): Promise<string> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([
      options.width || 612, // Default US Letter width
      options.height || 792, // Default US Letter height
    ]);
    
    const { width, height } = page.getSize();

    // Add text fields
    if (options.textFields && options.textFields.length > 0) {
      for (const textField of options.textFields) {
        const font = await pdfDoc.embedFont(
          textField.fontName || StandardFonts.Helvetica
        );
        
        page.drawText(textField.text, {
          x: textField.x,
          y: height - textField.y,
          size: textField.fontSize || 12,
          font: font,
          color: textField.fontColor 
            ? rgb(textField.fontColor.r, textField.fontColor.g, textField.fontColor.b)
            : rgb(0, 0, 0),
        });
      }
    }

    // Add image fields
    if (options.imageFields && options.imageFields.length > 0) {
      for (const imageField of options.imageFields) {
        try {
          const imageBytes = await loadImageForPDF(imageField.imageUri);
          
          let image;
          if (imageField.imageUri.toLowerCase().endsWith('.png')) {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            image = await pdfDoc.embedJpg(imageBytes);
          }

          page.drawImage(image, {
            x: imageField.x,
            y: height - imageField.y - imageField.height,
            width: imageField.width,
            height: imageField.height,
          });
        } catch (error) {
          console.error('Error adding image to PDF:', error);
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...Array.from(pdfBytes)));
    
    return base64;
  } catch (error) {
    console.error('Error creating PDF:', error);
    throw error;
  }
}

/**
 * Edit PDF template with profile data
 * @param templateAsset - The template asset module
 * @param profileData - Profile data to fill in
 * @returns Base64 string of the edited PDF
 */
export async function editPDFTemplate(
  templateAsset: any,
  profileData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    major: string;
    branch: string;
  }
): Promise<string> {
  try {
    // Load the template
    const asset = Asset.fromModule(templateAsset);
    await asset.downloadAsync();
    
    if (!asset.localUri) {
      throw new Error('Failed to load template');
    }

    const pdfBytes = await loadPDFFromAsset(templateAsset);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Prepare text replacements
    const replacements: TextReplacement[] = [];

    if (profileData.firstName) {
      replacements.push({
        placeholder: 'First Name',
        value: profileData.firstName,
        ...TEMPLATE_FIELD_POSITIONS.firstName,
      });
    }

    if (profileData.lastName) {
      replacements.push({
        placeholder: 'Last Name',
        value: profileData.lastName,
        ...TEMPLATE_FIELD_POSITIONS.lastName,
      });
    }

    if (profileData.dateOfBirth) {
      replacements.push({
        placeholder: 'Date of birth',
        value: profileData.dateOfBirth,
        ...TEMPLATE_FIELD_POSITIONS.dateOfBirth,
      });
    }

    if (profileData.major) {
      replacements.push({
        placeholder: 'Major',
        value: profileData.major,
        ...TEMPLATE_FIELD_POSITIONS.major,
      });
    }

    if (profileData.branch) {
      replacements.push({
        placeholder: 'Branch',
        value: profileData.branch,
        ...TEMPLATE_FIELD_POSITIONS.branch,
      });
    }

    // Apply text replacements
    await replaceTextInPDF(pdfDoc, replacements);

    // Save the edited PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const base64 = btoa(String.fromCharCode(...Array.from(modifiedPdfBytes)));
    
    return base64;
  } catch (error) {
    console.error('Error editing PDF template:', error);
    throw error;
  }
}

