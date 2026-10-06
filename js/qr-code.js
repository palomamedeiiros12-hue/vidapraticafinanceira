import QRCode from 'qrcode';

const canvas = document.querySelector('#site-qr-code');
const status = document.querySelector('#qr-status');
const link = document.querySelector('#qr-link');
const siteUrl = new URL(import.meta.env.BASE_URL, window.location.origin).href;

link.href = siteUrl;

async function renderQrCode() {
  try {
    await QRCode.toCanvas(canvas, siteUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 192,
      color: {
        dark: '#173a2d',
        light: '#ffffff'
      }
    });
    status.textContent = 'Escaneie com a câmera ou toque no link para abrir no celular.';
  } catch (error) {
    console.error('Não foi possível gerar o código QR.', error);
    status.textContent = 'Não foi possível gerar o código QR. Use o link para abrir no celular.';
  }
}

renderQrCode();
