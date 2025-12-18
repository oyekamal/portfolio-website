import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateCV = (portfolioData) => {
  const doc = new jsPDF();
  const { personal, experience, education, skills, certifications } = portfolioData;
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Header Section with Personal Info
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text(personal.name, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.text(personal.title, pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(10);
  const contactInfo = `${personal.email} • ${personal.phone} • ${personal.location}`;
  doc.text(contactInfo, pageWidth / 2, 40, { align: 'center' });
  
  yPosition = 60;

  // Professional Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Professional Summary', margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const bioLines = doc.splitTextToSize(personal.bio, contentWidth);
  doc.text(bioLines, margin, yPosition);
  yPosition += bioLines.length * 5 + 10;

  // Professional Experience
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Professional Experience', margin, yPosition);
  yPosition += 10;

  experience.forEach((exp, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(exp.position, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(exp.company, margin, yPosition);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${exp.startDate} - ${exp.endDate}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 5;

    doc.setTextColor(80, 80, 80);
    doc.text(exp.location, margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    exp.responsibilities.forEach(resp => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      const respLines = doc.splitTextToSize(`• ${resp}`, contentWidth - 5);
      doc.text(respLines, margin + 3, yPosition);
      yPosition += respLines.length * 5 + 1;
    });

    yPosition += 5;
  });

  // Education
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Education', margin, yPosition);
  yPosition += 10;

  education.forEach(edu => {
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(edu.degree, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(edu.institution, margin, yPosition);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${edu.startDate} - ${edu.endDate}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 5;

    doc.setTextColor(80, 80, 80);
    doc.text(edu.location, margin, yPosition);
    yPosition += 5;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const detailLines = doc.splitTextToSize(edu.details, contentWidth);
    doc.text(detailLines, margin, yPosition);
    yPosition += detailLines.length * 5 + 8;
  });

  // Skills
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Skills & Technologies', margin, yPosition);
  yPosition += 10;

  // Iterate through skill categories
  Object.entries(skills).forEach(([categoryName, skillsList]) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(categoryName, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    const skillsText = skillsList.join(' • ');
    const skillLines = doc.splitTextToSize(skillsText, contentWidth);
    doc.text(skillLines, margin, yPosition);
    yPosition += skillLines.length * 5 + 8;
  });

  // Certifications
  if (certifications && certifications.length > 0) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Certifications', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    certifications.forEach(cert => {
      doc.text(`• ${cert}`, margin + 3, yPosition);
      yPosition += 6;
    });
  }

  // Footer with generation date
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Download the PDF
  const fileName = `${personal.name.replace(/\s+/g, '_')}_CV.pdf`;
  doc.save(fileName);
};
