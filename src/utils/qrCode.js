import QRCode from 'qrcode';

export const createQrDataUrl = async (value, options = {}) => {
  if (!value) return '';
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 180,
    ...options
  });
};
