/**
 * Compresses an image file in the browser using HTML Canvas.
 * Reduces raw camera / high-res uploads (e.g. 5MB) down to crisp ~25-40KB Data URLs,
 * preventing LocalStorage QuotaExceededError and ensuring fast loading.
 */
export function compressImage(
  file: File,
  maxWidth = 500,
  maxHeight = 500,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, keep vector format
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG transparency if PNG, else JPEG for smallest size
        const isPng = file.type === "image/png";
        const mimeType = isPng ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, isPng ? undefined : quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
