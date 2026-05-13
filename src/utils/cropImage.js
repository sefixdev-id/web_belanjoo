const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Gagal memuat gambar untuk crop.'));
    image.src = src;
  });

const toBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Gagal membuat hasil crop.'));
      }
    }, mimeType, quality);
  });

export async function cropImageFile(imageSrc, croppedAreaPixels, fileName, mimeType = 'image/jpeg') {
  if (!croppedAreaPixels) {
    throw new Error('Area crop belum dipilih.');
  }

  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Browser tidak mendukung crop gambar.');
  }

  canvas.width = Math.round(croppedAreaPixels.width);
  canvas.height = Math.round(croppedAreaPixels.height);
  context.drawImage(
    image,
    Math.round(croppedAreaPixels.x),
    Math.round(croppedAreaPixels.y),
    Math.round(croppedAreaPixels.width),
    Math.round(croppedAreaPixels.height),
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await toBlob(canvas, mimeType, 0.9);
  const normalizedName = fileName.replace(/\.[^.]+$/, '') || 'belanjoo-image';
  return new File([blob], `${normalizedName}-cropped.jpg`, { type: mimeType });
}
