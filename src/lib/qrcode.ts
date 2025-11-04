// Helper to generate QR code URL for a table
export function generateTableQRCodeUrl(tableId: string): string {
  const billUrl = `${window.location.origin}/bill/${tableId}`;
  // Using QR code API service
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(billUrl)}`;
}