import QRCode from 'qrcode'

/**
 * Generates a QR code as a data: URL, encoding the given URL. Called at
 * render time (not seed time) so it always reflects the current
 * siteConfig.integrations.demoUrl — "change the URL, the code changes"
 * per Pack-3/G2's own "Done when" criterion, with no reseed required.
 */
export async function generateQrCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 280 })
}
