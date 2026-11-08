import QRCode from 'qrcode';
import { ENV } from '../config/env';

export function getEffectiveClientUrl(overrideUrl?: string): string {
  if (overrideUrl && overrideUrl.startsWith('http') && !overrideUrl.includes('localhost')) {
    return overrideUrl.replace(/\/+$/, '');
  }
  if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost')) {
    return process.env.CLIENT_URL.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://smart-menu-phi-seven.vercel.app';
  }
  return process.env.CLIENT_URL || ENV.CLIENT_URL || 'http://localhost:3000';
}

export function buildTableQrUrl(tableId: string, secretToken: string, baseUrl?: string): string {
  const host = getEffectiveClientUrl(baseUrl);
  return `${host}/table/${tableId}?token=${encodeURIComponent(secretToken)}`;
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
