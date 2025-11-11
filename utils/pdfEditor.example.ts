/**
 * Example usage of the PDF Editor utility
 * 
 * This file demonstrates how to use the PDF editing functionality
 * without ejecting from Expo.
 */

import { editPDF, createPDF, savePDFToFile, type PDFEditOptions } from './pdfEditor';

/**
 * Example 1: Create a new PDF from scratch
 */
export async function exampleCreatePDF() {
  try {
    const pdfBase64 = await createPDF({
      width: 612, // US Letter width in points
      height: 792, // US Letter height in points
      textFields: [
        {
          x: 50,
          y: 750,
          text: 'Hello, World!',
          fontSize: 24,
          fontColor: { r: 0, g: 0, b: 0 },
        },
        {
          x: 50,
          y: 700,
          text: 'This is a generated PDF',
          fontSize: 16,
          fontColor: { r: 0.5, g: 0.5, b: 0.5 },
        },
      ],
      imageFields: [
        {
          x: 400,
          y: 600,
          width: 150,
          height: 150,
          imageUri: 'file:///path/to/image.jpg', // Use file:// URI for local images
        },
      ],
    });

    // Save to file
    const fileUri = await savePDFToFile(pdfBase64, 'example.pdf');
    console.log('PDF saved to:', fileUri);
    
    return fileUri;
  } catch (error) {
    console.error('Error creating PDF:', error);
    throw error;
  }
}

/**
 * Example 2: Edit an existing PDF template from assets
 */
export async function exampleEditTemplatePDF() {
  try {
    // Load template from assets
    const templateAsset = require('../assets/pdf/card_template.pdf');
    
    const pdfOptions: PDFEditOptions = {
      textFields: [
        {
          x: 100,
          y: 500,
          text: 'John Doe',
          fontSize: 20,
          fontColor: { r: 0, g: 0, b: 0 },
        },
        {
          x: 100,
          y: 450,
          text: 'Student ID: 12345',
          fontSize: 14,
          fontColor: { r: 0.3, g: 0.3, b: 0.3 },
        },
      ],
      imageFields: [
        {
          x: 400,
          y: 400,
          width: 120,
          height: 150,
          imageUri: 'file:///path/to/photo.jpg',
        },
      ],
    };

    // Edit the template
    const pdfBase64 = await editPDF('', pdfOptions, templateAsset);
    
    // Save the edited PDF
    const fileUri = await savePDFToFile(pdfBase64, 'edited_card.pdf');
    console.log('Edited PDF saved to:', fileUri);
    
    return fileUri;
  } catch (error) {
    console.error('Error editing template PDF:', error);
    throw error;
  }
}

/**
 * Example 3: Edit a PDF from file system
 */
export async function exampleEditPDFFromFile(fileUri: string) {
  try {
    const pdfOptions: PDFEditOptions = {
      textFields: [
        {
          x: 50,
          y: 100,
          text: 'Added Text',
          fontSize: 16,
        },
      ],
    };

    // Edit PDF from file system
    const pdfBase64 = await editPDF(fileUri, pdfOptions);
    
    // Save the edited PDF
    const newFileUri = await savePDFToFile(pdfBase64, 'modified.pdf');
    return newFileUri;
  } catch (error) {
    console.error('Error editing PDF from file:', error);
    throw error;
  }
}

/**
 * Example 4: Fill form fields in a fillable PDF
 */
export async function exampleFillFormFields(templateUri: string) {
  try {
    const pdfOptions: PDFEditOptions = {
      formFields: {
        'name': 'John Doe',
        'email': 'john.doe@example.com',
        'date': new Date().toLocaleDateString(),
        // Add more form field names and values as needed
      },
    };

    const pdfBase64 = await editPDF(templateUri, pdfOptions);
    const fileUri = await savePDFToFile(pdfBase64, 'filled_form.pdf');
    return fileUri;
  } catch (error) {
    console.error('Error filling form fields:', error);
    throw error;
  }
}

/**
 * Example 5: Combine text and images in a card layout
 */
export async function exampleCreateIDCard(
  name: string,
  studentId: string,
  photoUri: string,
  logoUri?: string
) {
  try {
    const pdfOptions: PDFEditOptions = {
      textFields: [
        {
          x: 50,
          y: 300,
          text: name,
          fontSize: 24,
          fontColor: { r: 0, g: 0, b: 0 },
        },
        {
          x: 50,
          y: 250,
          text: `ID: ${studentId}`,
          fontSize: 18,
          fontColor: { r: 0.2, g: 0.2, b: 0.2 },
        },
      ],
      imageFields: [
        {
          x: 400,
          y: 200,
          width: 150,
          height: 200,
          imageUri: photoUri,
        },
        ...(logoUri ? [{
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          imageUri: logoUri,
        }] : []),
      ],
    };

    const pdfBase64 = await createPDF({
      width: 612, // Standard ID card width
      height: 396, // Standard ID card height
      ...pdfOptions,
    });

    const fileUri = await savePDFToFile(pdfBase64, `id_card_${studentId}.pdf`);
    return fileUri;
  } catch (error) {
    console.error('Error creating ID card:', error);
    throw error;
  }
}


