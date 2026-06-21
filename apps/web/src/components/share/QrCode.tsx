"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Loader2 } from "lucide-react";

/** Renders a URL as a QR code entirely client-side (no network, no third party).
 *  Recruiters can scan it to open the verified profile; the PNG is downloadable. */
export function QrCode({
  value,
  size = 132,
  downloadName = "engineerdna-qr.png",
  showDownload = true,
}: {
  value: string;
  size?: number;
  downloadName?: string;
  showDownload?: boolean;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size * 2, // render at 2× for crisp scaling / printing
      margin: 1,
      color: { dark: "#0a0a0a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => active && setDataUrl(url))
      .catch(() => active && setDataUrl(null));
    return () => {
      active = false;
    };
  }, [value, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center rounded-xl bg-white p-2"
        style={{ width: size, height: size }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="Scan to open verified profile" width={size - 16} height={size - 16} />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        )}
      </div>
      {showDownload && dataUrl && (
        <a
          href={dataUrl}
          download={downloadName}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Download className="h-3 w-3" /> Download QR
        </a>
      )}
    </div>
  );
}
