export async function fileToResizedDataUrl(
  file: File,
  opts: { maxSize?: number; quality?: number; mime?: 'image/jpeg' | 'image/png' | 'image/webp' } = {}
): Promise<string> {
  const { maxSize = 256, quality = 0.85, mime = 'image/jpeg' } = opts;

  const img = await loadImage(file);
  const { width, height } = fitSquare(img.width, img.height, maxSize);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL(mime, quality);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function fitSquare(w: number, h: number, max: number): { width: number; height: number } {
  if (w === h) return { width: Math.min(w, max), height: Math.min(h, max) };
  // crop center to square then resize
  const side = Math.min(w, h);
  const out = Math.min(side, max);
  return { width: out, height: out };
}

export async function fileToCenteredCroppedDataUrl(
  file: File,
  size = 256,
  quality = 0.85
): Promise<string> {
  const img = await loadImage(file);
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

  return canvas.toDataURL('image/jpeg', quality);
}
