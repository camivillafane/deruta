/**
 * Achica una foto antes de subirla: las fotos de celular pesan 3-8 MB y el
 * servidor acepta hasta 4 MB. Devuelve un JPEG de hasta `maxSide` px de lado.
 * Si el navegador no puede leer la imagen (por ejemplo HEIC fuera de Safari),
 * devuelve el archivo original y que decida el servidor.
 */
export async function shrinkImage(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}
