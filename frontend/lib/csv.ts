import type { StudentInput } from './api';

export interface CsvParseResult {
  students: StudentInput[];
  errors: string[];
  totalRows: number;
}

/**
 * Parse a CSV of students. Header-driven with flexible column names.
 * Accepted columns (case-insensitive, any order):
 *   - name | student | full name
 *   - roll | rollno | roll number | id
 *   - attendance | attendance% | percent | attendance percentage
 *
 * If no header is detected, falls back to: name, rollNumber, attendancePercent.
 */
export function parseStudentsCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { students: [], errors: ['CSV is empty'], totalRows: 0 };

  const firstCells = parseCsvLine(lines[0]);
  const headerLooksReal = firstCells.some((c) =>
    /name|roll|attend|percent/i.test(c.trim())
  );

  let nameIdx = -1, rollIdx = -1, attIdx = -1;
  let dataStart = 0;

  if (headerLooksReal) {
    firstCells.forEach((c, i) => {
      const k = c.trim().toLowerCase();
      if (nameIdx < 0 && /\bname\b|^student\b|full name/.test(k)) nameIdx = i;
      if (rollIdx < 0 && /\broll\b|rollno|^id$/.test(k)) rollIdx = i;
      if (attIdx < 0 && /attend|percent/.test(k)) attIdx = i;
    });
    dataStart = 1;
  }

  if (nameIdx < 0) nameIdx = 0;
  if (rollIdx < 0) rollIdx = 1;
  if (attIdx < 0) attIdx = 2;

  const students: StudentInput[] = [];
  let totalRows = 0;

  for (let i = dataStart; i < lines.length; i++) {
    totalRows += 1;
    const cells = parseCsvLine(lines[i]);
    const name = (cells[nameIdx] ?? '').trim();
    const rollNumber = (cells[rollIdx] ?? '').trim();
    const attRaw = (cells[attIdx] ?? '').trim().replace('%', '');
    const attendancePercent = attRaw === '' ? 0 : Number(attRaw);

    if (!name) {
      errors.push(`Row ${i + 1}: missing name`);
      continue;
    }
    if (!rollNumber) {
      errors.push(`Row ${i + 1}: missing roll number`);
      continue;
    }
    if (!Number.isFinite(attendancePercent) || attendancePercent < 0 || attendancePercent > 100) {
      errors.push(`Row ${i + 1}: attendance "${attRaw}" is not a valid 0–100 number`);
      continue;
    }
    students.push({ name, rollNumber, attendancePercent });
  }

  return { students, errors, totalRows };
}

// Minimal RFC4180-ish CSV line parser (handles quotes + escaped quotes).
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === ',') {
        out.push(cur);
        cur = '';
      } else if (c === '"') {
        inQ = true;
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out;
}
