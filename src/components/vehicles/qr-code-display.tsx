'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';

interface QrCodeDisplayProps {
  vehicleId: string;
  qrCodeId: string;
  unitNumber: string | null;
}

export function QrCodeDisplay({ vehicleId, qrCodeId, unitNumber }: QrCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = `${appUrl}/qr/${qrCodeId}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1e3a5f' },
      });
    }
  }, [qrUrl]);

  function handlePrint() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dataUrl = canvas.toDataURL();
    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${unitNumber ?? vehicleId}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif">
          <h2>${unitNumber ?? 'Vehicle'}</h2>
          <img src="${dataUrl}" style="width:300px;height:300px" />
          <p style="font-size:12px;color:#666">Scan to view vehicle details</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} />
      <p className="text-xs text-gray-400 break-all text-center max-w-[200px]">{qrUrl}</p>
      <Button variant="secondary" size="sm" onClick={handlePrint}>
        Print QR Code
      </Button>
    </div>
  );
}
