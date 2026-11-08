import QRCode from 'qrcode';
import { ENV } from '../config/env';

export function buildTableQrUrl(tableId: string, secretToken: string): string {
  return `${ENV.CLIENT_URL}/table/${tableId}?token=${encodeURIComponent(secretToken)}`;
}

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 320,
    color: {
      dark: '#111827',
      light: '#FFFFFF',
    },
  });
}
