/**
 * Kompresi dan penyesuaian gambar sisi klien menggunakan HTML5 Canvas.
 * Mendukung format rasio ideal 1:1 (contain/utuh tidak terpotong atau cover),
 * pengubahan ukuran resolusi, dan konversi ke WebP berkualitas tinggi.
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  makeSquare?: boolean;
  fitMode?: "contain" | "cover";
  backgroundColor?: string;
  zoomScale?: number; // 0.5 to 1.5
}

export async function compressImage(
  file: File,
  maxWidthOrOptions: number | CompressImageOptions = 1080,
  maxHeight = 1080,
  quality = 0.85
): Promise<{ file: File; dataUrl: string }> {
  const options: CompressImageOptions =
    typeof maxWidthOrOptions === "object"
      ? {
          maxWidth: 1080,
          maxHeight: 1080,
          quality: 0.85,
          makeSquare: false,
          fitMode: "contain",
          backgroundColor: "#FFFFFF",
          zoomScale: 1.0,
          ...maxWidthOrOptions,
        }
      : {
          maxWidth: maxWidthOrOptions,
          maxHeight,
          quality,
          makeSquare: false,
          fitMode: "contain",
          backgroundColor: "#FFFFFF",
          zoomScale: 1.0,
        };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const targetSquareSize = options.maxWidth || 1080;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Gagal menginisialisasi canvas grafis"));
          return;
        }

        if (options.makeSquare) {
          // MODE 1:1 IDEAL POST IMAGE
          canvas.width = targetSquareSize;
          canvas.height = targetSquareSize;

          // Isi latar belakang jika contain
          if (options.fitMode === "contain") {
            ctx.fillStyle = options.backgroundColor || "#FFFFFF";
            ctx.fillRect(0, 0, targetSquareSize, targetSquareSize);

            const zoom = options.zoomScale || 1.0;
            const baseScale = Math.min(
              targetSquareSize / img.width,
              targetSquareSize / img.height
            );
            const scale = baseScale * zoom;

            const renderW = img.width * scale;
            const renderH = img.height * scale;
            const offsetX = (targetSquareSize - renderW) / 2;
            const offsetY = (targetSquareSize - renderH) / 2;

            ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
          } else {
            // COVER (Potong penuh 1:1)
            const zoom = options.zoomScale || 1.0;
            const baseScale = Math.max(
              targetSquareSize / img.width,
              targetSquareSize / img.height
            );
            const scale = baseScale * zoom;

            const renderW = img.width * scale;
            const renderH = img.height * scale;
            const offsetX = (targetSquareSize - renderW) / 2;
            const offsetY = (targetSquareSize - renderH) / 2;

            ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
          }
        } else {
          // MODE ASPEK ASLI (Dikecilkan proporsional)
          let width = img.width;
          let height = img.height;
          const maxW = options.maxWidth || 1080;
          const maxH = options.maxHeight || 1080;

          if (width > height) {
            if (width > maxW) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            }
          } else {
            if (height > maxH) {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
        }

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

            const dataUrl = canvas.toDataURL("image/webp", options.quality || 0.85);
            resolve({ file: compressedFile, dataUrl });
          },
          "image/webp",
          options.quality || 0.85
        );
      };

      img.onerror = () => reject(new Error("Format file gambar tidak valid"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.readAsDataURL(file);
  });
}
