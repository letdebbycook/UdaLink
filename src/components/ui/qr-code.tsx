"use client";

import React, { useMemo } from "react";
import { generateQrMatrix } from "@/lib/qr-generator";

interface QrCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
  includeMargin?: boolean;
}

export function QrCodeSvg({
  value,
  size = 200,
  fgColor = "#0F172A",
  bgColor = "#FFFFFF",
  className = "",
  includeMargin = true,
}: QrCodeProps) {
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(value);
    } catch {
      // Fallback empty grid if generation fails
      return [[true]];
    }
  }, [value]);

  const margin = includeMargin ? 4 : 0;
  const matrixSize = matrix.length;
  const viewBoxSize = matrixSize + margin * 2;

  // Build SVG path data for all dark modules
  const pathData = useMemo(() => {
    let d = "";
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (matrix[r][c]) {
          const x = c + margin;
          const y = r + margin;
          d += `M${x},${y}h1v1h-1z `;
        }
      }
    }
    return d;
  }, [matrix, matrixSize, margin]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      className={`shape-rendering-crispEdges ${className}`}
      style={{ shapeRendering: "crispEdges" }}
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} rx={margin > 0 ? 2 : 0} />
      <path d={pathData} fill={fgColor} />
    </svg>
  );
}

