import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';

export const generatePDF = async (elementId: string, filename: string = 'report.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  // Hide elements that shouldn't be printed
  const noPrintElements = element.querySelectorAll('.no-print');
  const originalDisplayStyles = new Map();
  noPrintElements.forEach((el: any) => {
    originalDisplayStyles.set(el, el.style.display);
    el.style.display = 'none';
  });

  try {
    const canvas = await toCanvas(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      style: {
        direction: 'rtl',
      }
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const availableWidth = pdfWidth - (margin * 2);
    const availableHeight = pdfHeight - (margin * 2);

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = availableWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Page 1
    pdf.addImage(imgData, 'JPEG', margin, margin, availableWidth, scaledHeight);
    
    // Cover bottom margin
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F');

    let heightLeft = scaledHeight - availableHeight;
    let position = 0;

    while (heightLeft > 0) {
      position = heightLeft - scaledHeight;
      pdf.addPage();
      
      // Draw image shifted up
      pdf.addImage(imgData, 'JPEG', margin, margin + position, availableWidth, scaledHeight);
      
      // Cover top margin
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, margin, 'F');
      
      // Cover bottom margin
      pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F');
      
      heightLeft -= availableHeight;
    }

    pdf.save(filename);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Restore .no-print elements
    noPrintElements.forEach((el: any) => {
      el.style.display = originalDisplayStyles.get(el);
    });
  }
};
