import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RFQ } from './types';

export function generateRFQPDF(rfq: RFQ): { blob: Blob; dataUri: string; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [37, 99, 235]; // #2563eb Primary blue
  const darkColor: [number, number, number] = [15, 23, 42]; // #0f172a Slate 900
  const grayColor: [number, number, number] = [100, 116, 139]; // #64748b Slate 500

  // Top Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 24, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ProcureAI — REQUEST FOR QUOTATION', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL DOCUMENT', 160, 15);

  // RFQ Overview Section
  doc.setTextColor(...darkColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`RFQ Number: ${rfq.id}`, 14, 35);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(`Created Date: ${rfq.createdDate}   |   Status: ${rfq.status.toUpperCase()}   |   Category: ${rfq.category}`, 14, 42);

  // Buyer Info & Deadline Box
  doc.setLineWidth(0.3);
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 48, 88, 38, 2, 2, 'FD');
  doc.roundedRect(108, 48, 88, 38, 2, 2, 'FD');

  // Buyer Info Text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('ISSUING COMPANY', 18, 55);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('ProcureAI Enterprise Platform', 18, 62);
  doc.text('Procurement Operations Department', 18, 68);
  doc.text('Contact: rfq-ops@procureai.com', 18, 74);
  doc.text('Location: Mumbai Tech Park, HR', 18, 80);

  // Deadline & Terms Text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('KEY SUBMISSION REQUIREMENTS', 112, 55);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(`Submission Deadline: ${rfq.deadline}`, 112, 62);
  doc.text(`Target Price (per unit): $${rfq.targetPrice.toFixed(2)}`, 112, 68);
  doc.text(`Estimated Total Budget: $${(rfq.budget || rfq.targetPrice * rfq.quantity).toLocaleString()}`, 112, 74);
  doc.text(`Payment Terms: ${rfq.paymentTerms || 'Net 30 Days'}`, 112, 80);

  // Specifications Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('1. Product Specifications & Quantities', 14, 96);

  const specRows: [string, string][] = [
    ['Item / Product Name', rfq.product],
    ['Detailed Description', rfq.description || 'Standard technical specifications apply.'],
    ['Required Quantity', `${rfq.quantity.toLocaleString()} ${rfq.unit}`],
    ['Target Price / Unit', `$${rfq.targetPrice.toFixed(2)}`],
    ['Delivery Location', rfq.deliveryLocation || 'Mumbai Central Warehouse'],
  ];

  if (rfq.specifications && typeof rfq.specifications === 'object') {
    Object.entries(rfq.specifications).forEach(([k, v]) => {
      specRows.push([k, String(v)]);
    });
  }

  autoTable(doc, {
    startY: 100,
    head: [['Specification Attribute', 'Requirement Detail']],
    body: specRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 122 },
    },
    margin: { left: 14, right: 14 },
  });

  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Submission Instructions
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('2. Quotation Submission Guidelines', 14, lastY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  const instructions = [
    '• Quotations must be submitted via the ProcureAI Supplier Portal or emailed to rfq-ops@procureai.com.',
    '• Prices must include all applicable packaging, freight, and duty charges unless explicitly stated.',
    '• Please include quality certifications (ISO 9001 / IATF 16949) and warranty commitments with your quote.',
    '• Quotations received after the stated deadline will be automatically flagged for secondary review.',
  ];
  instructions.forEach((inst, idx) => {
    doc.text(inst, 14, lastY + 7 + idx * 6);
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated automatically by ProcureAI Automation Platform — Confidential Document', 14, 285);
  doc.text(`Page 1 of 1`, 185, 285);

  const filename = `${rfq.id}_Specification_Document.pdf`;
  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');

  return { blob, dataUri, filename };
}
