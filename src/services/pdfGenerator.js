import { jsPDF } from 'jspdf';

export const generateCV = (portfolioData) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const { personal, experience, education, skills, projects } = portfolioData;

  const pageWidth = doc.internal.pageSize.width;   // 595
  const pageHeight = doc.internal.pageSize.height; // 842
  const marginX = 48;
  const contentWidth = pageWidth - marginX * 2;
  let y = 0;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const checkPage = (needed = 20) => {
    if (y + needed > pageHeight - 40) {
      doc.addPage();
      y = 48;
    }
  };

  const sectionHeader = (title) => {
    checkPage(32);
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(title.toUpperCase(), marginX, y);
    y += 4;
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(1);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 12;
  };

  // ── NAME & CONTACT ───────────────────────────────────────────────────────────

  y = 52;
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(10, 10, 10);
  doc.text(personal.name, pageWidth / 2, y, { align: 'center' });
  y += 16;

  // Contact line — build from social links + personal info
  const github = portfolioData.social?.find(s => s.platform === 'GitHub')?.url?.replace('https://', '') || '';
  const linkedin = portfolioData.social?.find(s => s.platform === 'LinkedIn')?.url?.replace('https://www.', '') || '';
  const contactParts = [
    personal.location,
    personal.email,
    personal.phone,
    linkedin,
    github,
  ].filter(Boolean);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(contactParts.join('  •  '), pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageWidth - marginX, y);

  // ── SUMMARY ──────────────────────────────────────────────────────────────────

  sectionHeader('Summary');

  // Summary bullet points — split bio into sentences, then add extra lines from the PDF
  const summaryLines = [
    personal.bio,
    'Designed and maintained scalable RESTful APIs following clean architecture, SOLID, and DRY principles with thorough Swagger/OpenAPI documentation',
    'Built async workflows and distributed systems using Celery, Kafka, and RabbitMQ; implemented unit and integration tests with PyTest',
    'Maintained high availability in production with observability via Prometheus, Grafana, ELK Stack, Sentry, and CloudWatch; managed infrastructure with Terraform',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);

  summaryLines.forEach((line) => {
    checkPage(24);
    const wrapped = doc.splitTextToSize(line, contentWidth);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 13 + 2;
  });

  // ── EXPERIENCE ────────────────────────────────────────────────────────────────

  sectionHeader('Experience');

  experience.forEach((exp) => {
    checkPage(50);

    // Position (bold) + date/location (right-aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(10, 10, 10);
    doc.text(exp.position, marginX, y);

    const dateLocation = `${exp.startDate} - ${exp.endDate},  ${exp.location}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(dateLocation, pageWidth - marginX, y, { align: 'right' });
    y += 13;

    // Company
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(exp.company + (exp.location ? `,  ${exp.location}` : ''), marginX, y);
    y += 13;

    // Responsibilities
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    exp.responsibilities.forEach((resp) => {
      checkPage(18);
      const wrapped = doc.splitTextToSize(`• ${resp}`, contentWidth - 8);
      doc.text(wrapped, marginX + 2, y);
      y += wrapped.length * 13;
    });

    y += 8;
  });

  // ── SKILLS ────────────────────────────────────────────────────────────────────

  sectionHeader('Skills');

  // Flatten all skills into a single list of badge-style chips
  const allSkills = Object.values(skills).flat();

  // Render as teal-bordered pill badges
  const badgePaddingX = 7;
  const badgePaddingY = 4;
  const badgeHeight = 16;
  const badgeGapX = 6;
  const badgeGapY = 8;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  let bx = marginX;
  allSkills.forEach((skill) => {
    const tw = doc.getTextWidth(skill);
    const bw = tw + badgePaddingX * 2;

    if (bx + bw > pageWidth - marginX) {
      bx = marginX;
      y += badgeHeight + badgeGapY;
      checkPage(badgeHeight + badgeGapY);
    }

    // teal border, white fill
    doc.setDrawColor(32, 178, 170);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.roundedRect(bx, y - badgeHeight + badgePaddingY, bw, badgeHeight, 3, 3, 'FD');

    doc.setTextColor(32, 178, 170);
    doc.text(skill, bx + badgePaddingX, y, { baseline: 'bottom' });

    bx += bw + badgeGapX;
  });

  y += badgeHeight + 4;

  // ── PROJECTS ──────────────────────────────────────────────────────────────────

  const showProjects = (projects || []).slice(0, 3);
  if (showProjects.length > 0) {
    sectionHeader('Projects');

    showProjects.forEach((proj) => {
      checkPage(36);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(10, 10, 10);
      doc.text(proj.name, marginX, y);
      y += 13;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(50, 50, 50);
      const descLines = doc.splitTextToSize(proj.description, contentWidth);
      doc.text(descLines, marginX, y);
      y += descLines.length * 13 + 8;
    });
  }

  // ── EDUCATION ────────────────────────────────────────────────────────────────

  sectionHeader('Education');

  (education || []).forEach((edu) => {
    checkPage(36);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(10, 10, 10);
    doc.text(edu.degree, marginX, y);
    y += 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`${edu.institution}  -  ${edu.startDate} - ${edu.endDate}`, marginX, y);
    y += 16;
  });

  // ── FILENAME & SAVE ──────────────────────────────────────────────────────────

  const earliestStart = experience.reduce((earliest, exp) => {
    const d = new Date(exp.startDate);
    return d < earliest ? d : earliest;
  }, new Date(experience[0].startDate));
  const yearsExp = ((Date.now() - earliestStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  const primaryTech = (skills['Backend'] || Object.values(skills)[0] || ['django'])[1] || 'django';
  const techSlug = primaryTech.toLowerCase().replace(/\s+/g, '-');
  const namePart = personal.name.replace(/\s+/g, '_');
  const fileName = `${namePart}_${yearsExp}yrs-${techSlug}.pdf`;

  doc.save(fileName);
};
