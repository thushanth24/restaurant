import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  data: string;
  size?: number;
  title?: string;
  showDownload?: boolean;
  className?: string;
}

export function QRCodeGenerator({
  data,
  size = 200,
  title,
  showDownload = true,
  className = '',
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setError('No data provided for QR code generation');
      setIsLoading(false);
      return;
    }

    const generateQRCode = async () => {
      try {
        setIsLoading(true);
        const dataUrl = await QRCode.toDataURL(data, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: size,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeUrl(dataUrl);
        setError(null);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [data, size]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qrcode-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div 
          className="animate-pulse bg-neutral-200 rounded-lg" 
          style={{ width: `${size}px`, height: `${size}px` }}
        ></div>
        <span className="mt-2 text-sm text-neutral-500">Generating QR code...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div 
          className="bg-red-100 text-red-800 rounded-lg flex items-center justify-center" 
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <span className="text-sm text-center px-4">Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      
      <div className="border border-neutral-200 rounded-lg p-2 bg-white">
        <img 
          src={qrCodeUrl} 
          alt="QR Code" 
          width={size} 
          height={size} 
          className="rounded-lg"
        />
      </div>
      
      {showDownload && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      )}
    </div>
  );
}
