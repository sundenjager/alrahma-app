import React from 'react';
import { Button } from 'react-bootstrap';
import { FaFilePdf } from 'react-icons/fa';
import { jsPDF } from 'jspdf';

const PdfExportButton = ({ projects, formatDate }) => {
  // Arabic text formatter WITHOUT number conversion
  const formatArabic = (text) => {
    if (!text || typeof text !== 'string') return '';
    try {
      // Apply arabjs if available (no number conversion)
      return window.arabjs?.Convert?.(text) || text;
    } catch {
      return text;
    }
  };

  const generatePdfReport = () => {
    if (!projects?.length) {
      alert(formatArabic('لا توجد مشاريع لتصديرها'));
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        rtl: true
      });

      // Load Noto Naskh Arabic
      doc.addFont(
        '/fonts/Noto_Naskh_Arabic/NotoNaskhArabic-VariableFont_wght.ttf', 
        'NotoNaskh', 
        'normal'
      );
      doc.setFont('NotoNaskh');

      // Layout settings
      const rightMargin = 190;
      const lineHeight = 8;
      let yPos = 30;

      // Header
      doc.setFontSize(18);
      doc.text(formatArabic('التقرير السنوي للمشاريع المنجزة'), 105, 20, { align: 'center' });
      
      const currentYear = new Date().getFullYear();
      doc.setFontSize(12);
      doc.text(
        formatArabic(`سنة التقرير: ${currentYear}`), 
        105, 
        28, 
        { align: 'center' }
      );
      
      // Group by committee
      const projectsByCommittee = projects.reduce((acc, project) => {
        const committee = project.committee || formatArabic('غير مصنف');
        if (!acc[committee]) acc[committee] = [];
        acc[committee].push(project);
        return acc;
      }, {});

      // Generate content
      Object.entries(projectsByCommittee).forEach(([committee, committeeProjects]) => {
        // Committee header
        doc.setFontSize(14);
        doc.text(formatArabic(`لجنة: ${committee}`), rightMargin, yPos, { align: 'right' });
        yPos += lineHeight;

        // Projects list
        committeeProjects.forEach((project, index) => {
          // Project title
          doc.setFontSize(12);
          doc.text(
            formatArabic(`${project.project}${project.projectCode ? ` (${project.projectCode})` : ''}`),
            rightMargin,
            yPos,
            { align: 'right' }
          );
          yPos += lineHeight;

          // Project details (with Western numbers)
          const details = [
            `سنة المشروع: ${new Date(project.startDate).getFullYear()}`,
            `عدد المستفيدون: ${project.beneficiaries || 'غير محدد'}`,
            project.beneficiariesCount ? `(${project.beneficiariesCount})` : '',
            `الفئة: ${project.targetGroup || 'غير محدد'}`,
            `من ${formatDate(project.startDate)} إلى ${formatDate(project.completionDate)}`
          ].filter(Boolean).join(' | ');

          doc.text(formatArabic(details), rightMargin, yPos, {
            align: 'right',
            maxWidth: 150
          });
          yPos += lineHeight * 1.5;

          // Divider
          if (index < committeeProjects.length - 1 && yPos < 280) {
            doc.setDrawColor(200);
            doc.line(20, yPos, rightMargin, yPos);
            yPos += 10;
          }

          // Page break
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
        });
      });

      doc.save(formatArabic('التقرير_السنوي.pdf'));
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert(formatArabic('حدث خطأ أثناء إنشاء التقرير'));
    }
  };

  return (
    <Button
      variant="outline-success"
      onClick={generatePdfReport}
      disabled={!projects?.length}
      className="ms-2"
    >
      <FaFilePdf className="me-1" /> {formatArabic('بطاقات المشاريع PDF')}
    </Button>
  );
};

export default PdfExportButton;