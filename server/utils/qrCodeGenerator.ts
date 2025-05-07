import QRCode from 'qrcode';

// Generate QR code as data URL
export const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
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

// Generate QR code for a specific table
export const generateTableQRCode = async (tableNumber: number, baseUrl: string): Promise<string> => {
  const tableUrl = `${baseUrl}/table/${tableNumber}`;
  return generateQRCode(tableUrl);
};
