import React, { useState } from 'react';
import { Download, Loader2, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function LessonPDFExporter({ targetRef, lessonTitle, lesson }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const generateDirectPDF = (pdfTitle, lessonData) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('Text-to-Learn | Course Lesson', margin, 13);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, 20);

    y = 36;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(15, 23, 42);
    const titleLines = doc.splitTextToSize(pdfTitle || 'Lesson Content', maxLineWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 7.5 + 4;

    if (lessonData?.objectives?.length) {
      checkPageBreak(30);
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, maxLineWidth, 8 + lessonData.objectives.length * 6, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, maxLineWidth, 8 + lessonData.objectives.length * 6, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text('LEARNING OBJECTIVES', margin + 4, y + 6);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      lessonData.objectives.forEach((obj) => {
        const lines = doc.splitTextToSize(`•  ${obj}`, maxLineWidth - 8);
        doc.text(lines, margin + 4, y);
        y += lines.length * 5 + 1;
      });
      y += 6;
    }

    if (lessonData?.content?.length) {
      lessonData.content.forEach((block) => {
        if (block.type === 'heading' && block.text) {
          checkPageBreak(16);
          y += 4;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12.5);
          doc.setTextColor(15, 23, 42);
          const lines = doc.splitTextToSize(block.text, maxLineWidth);
          doc.text(lines, margin, y);
          y += lines.length * 6 + 2;
        } else if (block.type === 'paragraph' && block.text) {
          checkPageBreak(12);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85);
          const lines = doc.splitTextToSize(block.text, maxLineWidth);
          doc.text(lines, margin, y);
          y += lines.length * 5.2 + 3;
        } else if (block.type === 'code' && block.text) {
          const codeLines = doc.splitTextToSize(block.text, maxLineWidth - 10);
          const boxHeight = codeLines.length * 4.5 + 8;
          checkPageBreak(boxHeight + 4);

          doc.setFillColor(15, 23, 42);
          doc.rect(margin, y, maxLineWidth, boxHeight, 'F');

          doc.setFont('courier', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(241, 245, 249);
          doc.text(codeLines, margin + 5, y + 6);
          y += boxHeight + 4;
        } else if ((block.type === 'mcq' || block.type === 'question' || block.type === 'quiz') && block.question) {
          checkPageBreak(35);
          y += 2;
          doc.setFillColor(248, 250, 252);
          const qLines = doc.splitTextToSize(`Quiz: ${block.question}`, maxLineWidth - 8);
          let extraHeight = 0;
          if (block.options?.length) {
            extraHeight += block.options.length * 5;
          }
          if (block.explanation) extraHeight += 8;

          doc.rect(margin, y, maxLineWidth, qLines.length * 5 + 6 + extraHeight, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.rect(margin, y, maxLineWidth, qLines.length * 5 + 6 + extraHeight, 'S');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);
          doc.text(qLines, margin + 4, y + 5);
          y += qLines.length * 5 + 5;

          if (block.options?.length) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            block.options.forEach((opt, optIdx) => {
              const isCorrect = optIdx === block.answer;
              doc.setTextColor(isCorrect ? 16 : 71, isCorrect ? 185 : 85, isCorrect ? 129 : 105);
              doc.text(
                `${String.fromCharCode(65 + optIdx)}. ${opt}${isCorrect ? ' (Correct Answer)' : ''}`,
                margin + 6,
                y
              );
              y += 5;
            });
          }

          if (block.explanation) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8.5);
            doc.setTextColor(100, 116, 139);
            doc.text(`Explanation: ${block.explanation}`, margin + 6, y + 1);
            y += 7;
          }
          y += 4;
        }
      });
    }

    if (lessonData?.hinglishExplanation) {
      checkPageBreak(30);
      doc.setFillColor(240, 253, 244);
      const hLines = doc.splitTextToSize(lessonData.hinglishExplanation, maxLineWidth - 8);
      const hBoxHeight = hLines.length * 5 + 12;
      doc.rect(margin, y, maxLineWidth, hBoxHeight, 'F');
      doc.setDrawColor(16, 185, 129);
      doc.rect(margin, y, maxLineWidth, hBoxHeight, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(16, 185, 129);
      doc.text('HINGLISH EXPLANATION', margin + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(22, 101, 52);
      doc.text(hLines, margin + 4, y + 10);
      y += hBoxHeight + 4;
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${i} of ${totalPages} • Text-to-Learn AI Platform`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }

    const safeFileName = `${(pdfTitle || 'Lesson').toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
    doc.save(safeFileName);
  };

  const handleExportPDF = async () => {
    if (!targetRef.current) return;
    setDownloading(true);

    try {
      const element = targetRef.current;
      const isDark = document.documentElement.classList.contains('dark');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: isDark ? '#08080a' : '#ffffff',
        logging: false,
        ignoreElements: (el) => {
          return (
            el.tagName === 'IFRAME' ||
            el.classList?.contains('no-pdf') ||
            el.tagName === 'VIDEO'
          );
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, '', 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, '', 'FAST');
        heightLeft -= pageHeight;
      }

      const fileName = `${(lessonTitle || 'Lesson').toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
      pdf.save(fileName);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (err) {
      console.warn('html2canvas export failed, falling back to structured PDF generation:', err);
      try {
        generateDirectPDF(lessonTitle, lesson);
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 2500);
      } catch (fallbackErr) {
        console.error('All PDF export strategies failed:', fallbackErr);
        alert('Could not export PDF.');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={downloading}
      title="Download full lesson as PDF"
      className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--ink)] border border-[var(--border)] transition-all cursor-pointer font-mono text-xs font-semibold hover:border-emerald-500/50"
    >
      {downloading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
          <span className="text-zinc-400">Generating...</span>
        </>
      ) : downloaded ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-500">PDF Saved!</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5 text-emerald-500" />
          <span>Export PDF</span>
        </>
      )}
    </button>
  );
}

