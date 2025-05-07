import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  tableNumber: number;
  size?: number;
}

export function QRCodeDisplay({ tableNumber, size = 200 }: QRCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Build the table URL based on the current origin and table number
        const baseUrl = window.location.origin;
        const tableUrl = `${baseUrl}/table/${tableNumber}`;
        
        // Generate QR code as a data URL
        const dataUrl = await QRCode.toDataURL(tableUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: size,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeDataUrl(dataUrl);
        setError(null);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      }
    };

    generateQRCode();
  }, [tableNumber, size]);

  if (error) {
    return <div className="qr-code-error">{error}</div>;
  }

  if (!qrCodeDataUrl) {
    return <div className="qr-code-loading">Loading QR code...</div>;
  }

  return (
    <div className="qr-code-display">
      <img 
        src={qrCodeDataUrl} 
        alt={`QR Code for Table ${tableNumber}`} 
        width={size} 
        height={size}
      />
    </div>
  );
}