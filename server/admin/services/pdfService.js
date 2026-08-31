import PDFDocument from 'pdfkit';

class PDFService {
  /**
   * Dynamically generate a PDF document buffer
   * @param {string} title - Report title
   * @param {Array<string>} headers - Table column headers
   * @param {Array<Array<any>>} rows - Table data rows
   * @returns {Promise<Buffer>}
   */
  generateTablePDF(title, headers, rows) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Draw header branding green line
        doc.rect(0, 0, 595.28, 15).fill('#2e7d32');
        doc.fillColor('#000000');

        doc.moveDown(2);
        // Title
        doc.font('Helvetica-Bold').fontSize(20).text(title, { align: 'center' });
        doc.moveDown(0.5);

        // Date Info
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#555555').text(
          `Generated on: ${new Date().toLocaleString()} | KrishiMitra Admin Panel`,
          { align: 'center' }
        );
        doc.moveDown(2);

        // Reset text color
        doc.fillColor('#333333');

        // Simple Table parameters
        const startX = 30;
        const totalWidth = 595.28 - 60; // 535 px
        const colWidth = totalWidth / headers.length;

        // Draw Table Header
        let currentY = doc.y;
        doc.rect(startX, currentY - 5, totalWidth, 22).fill('#f1f8e9');
        doc.fillColor('#2e7d32').font('Helvetica-Bold').fontSize(10);

        headers.forEach((header, index) => {
          doc.text(header, startX + index * colWidth + 5, currentY, {
            width: colWidth - 10,
            ellipsis: true,
          });
        });

        doc.moveDown(1.5);
        doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(startX, doc.y).lineTo(startX + totalWidth, doc.y).stroke();
        doc.moveDown(0.5);

        // Draw Table Rows
        doc.fillColor('#333333').font('Helvetica').fontSize(9);
        
        rows.forEach((row, rowIndex) => {
          currentY = doc.y;

          // Check if we need to add a page (prevent overflow)
          if (currentY > 780) {
            doc.addPage();
            // Re-draw branding green line on new page
            doc.rect(0, 0, 595.28, 15).fill('#2e7d32');
            doc.fillColor('#333333').fontSize(9);
            doc.moveDown(2);
            currentY = doc.y;
          }

          // Alternating row background
          if (rowIndex % 2 === 1) {
            doc.rect(startX, currentY - 4, totalWidth, 18).fill('#fafafa');
            doc.fillColor('#333333');
          }

          row.forEach((cell, cellIndex) => {
            const cellText = cell !== null && cell !== undefined ? String(cell) : '';
            doc.text(cellText, startX + cellIndex * colWidth + 5, currentY, {
              width: colWidth - 10,
              ellipsis: true,
            });
          });

          doc.moveDown(1.2);
        });

        // Add footer page numbers
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor('#888888').text(
            `Page ${i + 1} of ${range.count}`,
            30,
            815,
            { align: 'center', width: 535 }
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new PDFService();
