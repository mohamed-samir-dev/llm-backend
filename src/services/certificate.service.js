const PDFDocument = require('pdfkit');
const { uploadToCloudinary } = require('./cloudinary.service');

/**
 * Generate a certificate PDF and upload to Cloudinary
 */
const generateCertificate = async ({ userName, userEmail, courseTitle, completionDate, certificateId }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const result = await uploadToCloudinary(buffer, {
          folder: 'certificates',
          resource_type: 'raw',
          public_id: `cert_${certificateId}`,
          format: 'pdf',
          type: 'authenticated', // private
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    // Certificate design
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9ff');
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#6c63ff');

    doc.fillColor('#6c63ff').fontSize(36).font('Helvetica-Bold')
      .text('شهادة إتمام الدورة', 0, 80, { align: 'center' });

    doc.fillColor('#333').fontSize(18).font('Helvetica')
      .text('هذا يشهد بأن', 0, 160, { align: 'center' });

    doc.fillColor('#6c63ff').fontSize(28).font('Helvetica-Bold')
      .text(userName, 0, 195, { align: 'center' });

    doc.fillColor('#333').fontSize(16).font('Helvetica')
      .text('قد أتم بنجاح دورة', 0, 250, { align: 'center' });

    doc.fillColor('#2c3e50').fontSize(22).font('Helvetica-Bold')
      .text(courseTitle, 0, 280, { align: 'center' });

    doc.fillColor('#888').fontSize(12).font('Helvetica')
      .text(`تاريخ الإصدار: ${new Date(completionDate).toLocaleDateString('ar-EG')}`, 0, 340, { align: 'center' })
      .text(`رقم الشهادة: ${certificateId}`, 0, 360, { align: 'center' })
      .text(`البريد الإلكتروني: ${userEmail}`, 0, 380, { align: 'center' });

    doc.end();
  });
};

module.exports = { generateCertificate };
