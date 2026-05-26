import type { GeneratedPaper, GeneratedQuestion } from './types';

interface DownloadOpts {
  paper: GeneratedPaper;
  dueDate?: string;
  fileName?: string;
}

// A4 in points: 595.28 × 841.89
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = { x: 56, top: 56, bottom: 64 };
const CONTENT_W = PAGE.width - 2 * MARGIN.x;

export async function downloadPaperPdf({ paper, dueDate, fileName }: DownloadOpts): Promise<void> {
  const { default: jsPDFModule } = await import('jspdf');
  const pdf = new jsPDFModule({ unit: 'pt', format: 'a4' });

  const ctx = {
    pdf,
    y: MARGIN.top,
    bottomBound: PAGE.height - MARGIN.bottom,
    pageNo: 1,
  };

  const newPage = () => {
    pdf.addPage();
    ctx.y = MARGIN.top;
    ctx.pageNo += 1;
  };
  const need = (h: number) => {
    if (ctx.y + h > ctx.bottomBound) newPage();
  };

  const setBody = () => {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(20, 20, 20);
  };

  // ---------- HEADER ----------
  pdf.setFont('times', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  const schoolLine =
    [paper.school, paper.schoolLocation].filter(Boolean).join(', ') || paper.title;
  pdf.text(schoolLine, PAGE.width / 2, ctx.y, { align: 'center' });
  ctx.y += 22;

  pdf.setFont('times', 'normal');
  if (paper.subject) {
    pdf.setFontSize(12);
    pdf.text(`Subject: ${paper.subject}`, PAGE.width / 2, ctx.y, { align: 'center' });
    ctx.y += 16;
  }
  pdf.setFontSize(11);
  pdf.text(`Assignment: ${paper.title}`, PAGE.width / 2, ctx.y, { align: 'center' });
  ctx.y += 14;

  if (paper.teacherName) {
    pdf.setFontSize(9);
    pdf.setTextColor(110);
    pdf.text(`Prepared by: ${paper.teacherName}`, PAGE.width / 2, ctx.y, { align: 'center' });
    ctx.y += 14;
    pdf.setTextColor(0);
  }

  // Top divider
  pdf.setDrawColor(170);
  pdf.setLineWidth(0.7);
  pdf.line(MARGIN.x, ctx.y + 4, PAGE.width - MARGIN.x, ctx.y + 4);
  ctx.y += 16;

  // ---------- TIME / MARKS ----------
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10.5);
  pdf.text('Time Allowed:', MARGIN.x, ctx.y);
  pdf.setFont('times', 'normal');
  const ta = `${estimateTime(paper)} minutes`;
  pdf.text(ta, MARGIN.x + pdf.getTextWidth('Time Allowed: '), ctx.y);

  pdf.setFont('times', 'bold');
  const mmLabel = 'Maximum Marks: ';
  const mmValue = String(paper.totalMarks);
  pdf.setFont('times', 'bold');
  const mmValueW = pdf.getTextWidth(mmValue);
  pdf.setFont('times', 'bold');
  const mmLabelW = pdf.getTextWidth(mmLabel);
  pdf.text(mmLabel, PAGE.width - MARGIN.x - mmLabelW - mmValueW, ctx.y);
  pdf.setFont('times', 'normal');
  pdf.text(mmValue, PAGE.width - MARGIN.x - mmValueW, ctx.y);
  ctx.y += 12;

  // Dashed divider
  dashedLine(pdf, MARGIN.x, ctx.y + 4, PAGE.width - MARGIN.x, ctx.y + 4);
  ctx.y += 14;

  // ---------- STUDENT FIELDS ----------
  drawStudentRow(pdf, ctx, ['Name', 'Roll Number', 'Section']);
  ctx.y += 8;
  dashedLine(pdf, MARGIN.x, ctx.y, PAGE.width - MARGIN.x, ctx.y);
  ctx.y += 16;

  // ---------- GENERAL INSTRUCTIONS ----------
  pdf.setFont('times', 'bold');
  pdf.setFontSize(11);
  pdf.text('General Instructions:', MARGIN.x, ctx.y);
  ctx.y += 14;

  setBody();
  pdf.setFontSize(10);
  const instructions = [
    'All questions are compulsory.',
    'Marks for each question are indicated against it.',
    'Read each question carefully before attempting.',
    'Write your answers clearly within the space provided.',
  ];
  instructions.forEach((ins, i) => {
    const lineH = 13;
    need(lineH);
    pdf.text(`${i + 1}.`, MARGIN.x + 6, ctx.y);
    const lines = pdf.splitTextToSize(ins, CONTENT_W - 24) as string[];
    pdf.text(lines, MARGIN.x + 22, ctx.y);
    ctx.y += lineH * lines.length;
  });
  ctx.y += 8;

  // ---------- SECTIONS ----------
  for (const section of paper.sections) {
    need(70);

    // Section title — centered + underline
    pdf.setFont('times', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(0);
    const titleY = ctx.y + 4;
    pdf.text(section.title, PAGE.width / 2, titleY, { align: 'center' });
    const titleW = pdf.getTextWidth(section.title);
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.6);
    pdf.line(
      PAGE.width / 2 - titleW / 2,
      titleY + 3,
      PAGE.width / 2 + titleW / 2,
      titleY + 3
    );
    ctx.y = titleY + 14;

    // Section instruction — italic centered
    if (section.instruction) {
      pdf.setFont('times', 'italic');
      pdf.setFontSize(9.5);
      pdf.setTextColor(95);
      const lines = pdf.splitTextToSize(section.instruction, CONTENT_W - 40) as string[];
      lines.forEach((l) => {
        need(11);
        pdf.text(l, PAGE.width / 2, ctx.y, { align: 'center' });
        ctx.y += 11;
      });
      pdf.setTextColor(0);
    }
    ctx.y += 8;

    // Questions
    section.questions.forEach((q, idx) => drawQuestion(pdf, ctx, q, idx + 1, need));

    ctx.y += 10;
  }

  // ---------- FOOTER ----------
  need(40);
  ctx.y += 6;
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.5);
  dashedLine(pdf, MARGIN.x, ctx.y, PAGE.width - MARGIN.x, ctx.y);
  ctx.y += 14;
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(80);
  pdf.text('-- End of Question Paper --', PAGE.width / 2, ctx.y, { align: 'center' });
  pdf.setTextColor(0);

  // Page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(140);
    pdf.text(`Page ${i} of ${pageCount}`, PAGE.width / 2, PAGE.height - 28, { align: 'center' });
    if (dueDate) {
      const d = new Date(dueDate);
      if (!isNaN(d.getTime())) {
        pdf.text(
          `Due: ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`,
          PAGE.width - MARGIN.x,
          PAGE.height - 28,
          { align: 'right' }
        );
      }
    }
    pdf.setTextColor(0);
  }

  const name =
    (fileName ?? `${paper.title}-question-paper`)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'question-paper';
  pdf.save(`${name}.pdf`);
}

// ----------------------------------------------------------------------------

interface Ctx {
  pdf: import('jspdf').jsPDF;
  y: number;
  bottomBound: number;
  pageNo: number;
}

function drawStudentRow(pdf: import('jspdf').jsPDF, ctx: Ctx, labels: string[]) {
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  const colW = (CONTENT_W - 16) / labels.length;
  const lineY = ctx.y + 4;
  labels.forEach((label, i) => {
    const x = MARGIN.x + i * (colW + 8);
    pdf.text(`${label}:`, x, ctx.y);
    const labelW = pdf.getTextWidth(`${label}: `);
    pdf.setDrawColor(60);
    pdf.setLineWidth(0.5);
    pdf.line(x + labelW + 4, lineY, x + colW, lineY);
  });
  ctx.y += 18;
}

function drawQuestion(
  pdf: import('jspdf').jsPDF,
  ctx: Ctx,
  q: GeneratedQuestion,
  qNum: number,
  need: (h: number) => void
) {
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(0);

  const marksLabel = `[${q.marks}]`;
  pdf.setFont('times', 'bold');
  const marksW = pdf.getTextWidth(marksLabel);
  pdf.setFont('times', 'normal');

  const numCol = 22;
  const textX = MARGIN.x + numCol;
  const textRight = PAGE.width - MARGIN.x - marksW - 6;
  const maxW = textRight - textX;
  const lines = pdf.splitTextToSize(q.text, maxW) as string[];

  const lineH = 14;
  need(lineH * lines.length + 6);

  pdf.text(`${qNum}.`, MARGIN.x + 2, ctx.y);
  pdf.text(lines[0], textX, ctx.y);
  pdf.setFont('times', 'bold');
  pdf.text(marksLabel, PAGE.width - MARGIN.x, ctx.y, { align: 'right' });
  pdf.setFont('times', 'normal');
  ctx.y += lineH;

  for (let i = 1; i < lines.length; i++) {
    need(lineH);
    pdf.text(lines[i], textX, ctx.y);
    ctx.y += lineH;
  }

  // Body
  if (q.type === 'mcq' && q.options && q.options.length > 0) {
    drawMcqOptions(pdf, ctx, q.options, textX, need);
  } else if (q.type === 'true_false') {
    need(16);
    pdf.setFontSize(10.5);
    pdf.text('True', textX, ctx.y);
    pdf.setDrawColor(60);
    pdf.setLineWidth(0.6);
    pdf.rect(textX + 30, ctx.y - 8, 9, 9);
    pdf.text('False', textX + 80, ctx.y);
    pdf.rect(textX + 113, ctx.y - 8, 9, 9);
    ctx.y += 18;
  } else if (q.type === 'short') {
    drawAnswerLines(pdf, ctx, 2, textX, need);
  } else if (q.type === 'long') {
    drawAnswerLines(pdf, ctx, 5, textX, need);
  }

  ctx.y += 4;
}

function drawMcqOptions(
  pdf: import('jspdf').jsPDF,
  ctx: Ctx,
  options: string[],
  startX: number,
  need: (h: number) => void
) {
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10.5);
  const lineH = 13;
  const colGap = 12;
  const colW = (PAGE.width - MARGIN.x - startX - colGap) / 2;

  // Compute wrapped lines per option to figure out row heights
  const wrapped = options.map((opt, i) => {
    const label = `(${String.fromCharCode(97 + i)}) `;
    const text = `${label}${opt}`;
    return pdf.splitTextToSize(text, colW) as string[];
  });

  // Render two-by-two
  for (let i = 0; i < wrapped.length; i += 2) {
    const left = wrapped[i];
    const right = wrapped[i + 1] ?? [];
    const rowH = Math.max(left.length, right.length) * lineH;
    need(rowH + 2);

    const yStart = ctx.y;
    pdf.text(left, startX, yStart);
    if (right.length > 0) pdf.text(right, startX + colW + colGap, yStart);
    ctx.y += rowH + 2;
  }
  ctx.y += 4;
}

function drawAnswerLines(
  pdf: import('jspdf').jsPDF,
  ctx: Ctx,
  n: number,
  startX: number,
  need: (h: number) => void
) {
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.4);
  const gap = 16;
  for (let i = 0; i < n; i++) {
    need(gap);
    const yLine = ctx.y + 10;
    pdf.line(startX, yLine, PAGE.width - MARGIN.x, yLine);
    ctx.y += gap;
  }
  ctx.y += 4;
  pdf.setDrawColor(0);
}

function dashedLine(
  pdf: import('jspdf').jsPDF,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  pdf.setLineDashPattern([2, 2], 0);
  pdf.setDrawColor(170);
  pdf.setLineWidth(0.5);
  pdf.line(x1, y1, x2, y2);
  pdf.setLineDashPattern([], 0);
  pdf.setDrawColor(0);
}

function estimateTime(paper: GeneratedPaper): number {
  let minutes = 0;
  for (const s of paper.sections) {
    for (const q of s.questions) {
      if (q.type === 'mcq' || q.type === 'true_false') minutes += 1;
      else if (q.type === 'short') minutes += 4;
      else minutes += 8;
    }
  }
  return Math.max(30, Math.round(minutes / 5) * 5);
}
