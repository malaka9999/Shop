export function formatRs(amount: number): string {
  const rounded = Math.round(amount);
  return `Rs. ${rounded.toLocaleString('en-LK')}`;
}

export function formatRsNumber(amount: number): string {
  return Math.round(amount).toLocaleString('en-LK');
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPreviousDateString(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const d = new Date(year, month, day);
  d.setDate(d.getDate() - 1);
  
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
}

export function getNextDateString(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + 1);
  
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(m, 10) - 1;
    return `${d} ${months[monthIndex] || m} ${y}`;
  }
  return dateStr;
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Open WhatsApp with pre-filled message, or fallback to copy
 */
export function shareToWhatsApp(message: string, phoneNumber?: string): boolean {
  try {
    const encoded = encodeURIComponent(message.trim());
    let url = '';
    if (phoneNumber) {
      // clean phone number
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      const intlPhone = cleanPhone.startsWith('0') ? '94' + cleanPhone.substring(1) : cleanPhone;
      url = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encoded}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encoded}`;
    }
    
    // In iframe, open in new window or top
    const win = window.open(url, '_blank');
    if (!win) {
      // Pop-up blocked, copy to clipboard
      navigator.clipboard?.writeText(message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to open WhatsApp:', err);
    navigator.clipboard?.writeText(message);
    return false;
  }
}
