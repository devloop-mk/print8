/** Download a data URL using an extension that matches the encoded mime type. */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const mime = dataUrl.match(/^data:([^;,]+)/i)?.[1]?.toLowerCase() ?? '';
  let ext = 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
  else if (mime.includes('webp')) ext = 'webp';
  else if (mime.includes('png')) ext = 'png';
  else if (mime.includes('svg')) ext = 'svg';

  const base = filename.replace(/\.(png|jpe?g|webp|svg)$/i, '');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${base}.${ext}`;
  link.click();
}
