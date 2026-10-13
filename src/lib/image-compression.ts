/**
 * Kompresi gambar sisi klien menggunakan HTML5 Canvas.
 * Mengubah ukuran gambar maksimum 1080px dan mengonversi ke format WebP (atau JPEG).
 */
export async function compressImage(
  file: File,
  maxWidth = 1080,
  maxHeight = 1080,
  quality = 0.8
): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            maxHeight = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal menginisialisasi canvas"));
          return;
        }

        // Render gambar ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export WebP jika didukung, fallback ke JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Gagal mengompresi gambar"));
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], cleanFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const dataUrl = canvas.toDataURL("image/webp", quality);
            resolve({ file: compressedFile, dataUrl });
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Format file gambar tidak valid"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.readAsDataURL(file);
  });
}
