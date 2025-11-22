/**
 * دوال مساعدة لوحدة المنتج
 */



/**
 * يحول البايت إلى صيغة قابلة للقراءة (KB, MB, ...).
 */
function productFormatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * تحويل الأرقام الهندية/العربية إلى الإنجليزية
 */
function productNormalizeDigits(str) {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  let output = '';
  for (let char of str) {
    if (arabicDigits.includes(char)) {
      output += arabicDigits.indexOf(char);
    } else if (persianDigits.includes(char)) {
      output += persianDigits.indexOf(char);
    } else {
      output += char;
    }
  }
  return output;
}

/**
 * تنقيح النص العربي من الألفاظ غير المرغوب فيها
 */
function productNormalizeArabicText(text) {
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * توليد سريال فريد للمنتج
 */
function productGenerateProductSerial() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let serial = "";
  for (let i = 0; i < 6; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
}

/**
 * فحص دعم WebP
 */
async function productSupportsWebP() {
  if (!self.createImageBitmap) return false;
  const blob = await fetch('data:image/webp;base64,UklGRiIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=')
    .then(r => r.blob()).catch(()=>null);
  if (!blob) return false;
  try { await createImageBitmap(blob); return true; } catch(e) { return false; }
}