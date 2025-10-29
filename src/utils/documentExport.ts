"use client";

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

/**
 * Exports the given title and content as a DOCX file.
 * @param title The title of the document.
 * @param content The main content of the document.
 */
export const exportAsDocx = async (title: string, content: string) => {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({
          text: "", // Add a blank line after title
        }),
        new Paragraph({
          children: [
            new TextRun(content.replace(/\n/g, '\n\n')), // Replace single newlines with double for better DOCX paragraph spacing
          ],
        }),
      ],
    }],
  });

  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_')}.docx`);
  } catch (error) {
    console.error("Error exporting DOCX:", error);
    throw new Error("Failed to export document as DOCX.");
  }
};

/**
 * Exports the given title and content as a PDF file.
 * @param title The title of the document.
 * @param content The main content of the document.
 */
export const exportAsPdf = (title: string, content: string) => {
  const doc = new jsPDF();

  // Set font and size for title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 14, 22); // x, y coordinates

  // Add a line break after the title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("", 14, 30); // Empty line

  // Split content into lines to handle wrapping
  const splitContent = doc.splitTextToSize(content, 180); // 180mm width for content
  doc.text(splitContent, 14, 40); // Start content at y=40

  try {
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  } catch (error) {
    console.error("Error exporting PDF:", error);
    throw new Error("Failed to export document as PDF.");
  }
};