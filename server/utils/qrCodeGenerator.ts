import QRCode from 'qrcode';
import crypto from 'crypto';

// Generate QR code as data URL
export const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Generate a shortened QR code for the database storage
export const generateStorableQRCode = async (data: string): Promise<string> => {
  try {
    // Create a hash of the URL instead of storing the full data URL
    // This prevents the PostgreSQL btree index size limitation
    const hash = crypto.createHash('md5').update(data).digest('hex');
    const timestamp = Date.now();
    return `qr_${hash}_${timestamp}`;
  } catch (error) {
    console.error('Error generating storable QR code:', error);
    throw new Error('Failed to generate storable QR code');
  }
};

// Generate QR code for a specific table
export const generateTableQRCode = async (tableNumber: number, baseUrl: string): Promise<string> => {
  const tableUrl = `${baseUrl}/table/${tableNumber}`;
  return generateStorableQRCode(tableUrl);
};
