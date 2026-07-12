export function buildUploadedFileUrl(
  fileId: string,
  uploadToken?: string | null,
) {
  const id = encodeURIComponent(fileId);
  if (!uploadToken) return `/api/files/${id}`;
  return `/api/files/${id}?token=${encodeURIComponent(uploadToken)}`;
}
