function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('invalid_data_url');
  }

  const mimeType = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

export async function uploadCheckoutAsset(
  uploadToken: string,
  dataUrl: string,
  filename: string,
): Promise<{ fileId: string }> {
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], filename, {
    type: blob.type || 'image/png',
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('token', uploadToken);

  const response = await fetch('/api/upload/print', {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as { fileId?: string; error?: string };

  if (!response.ok || !data.fileId) {
    throw new Error(data.error || 'upload_failed');
  }

  return { fileId: data.fileId };
}
