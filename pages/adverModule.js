/**
 * @file js/adverModule.js
 * @description موديول لعرض شريط إعلانات متحرك (Hero Slider).
 *
 * يقوم هذا الموديول بجلب الصور الإعلانية من رابط عام وعرضها
 * في حاوية محددة كشريط إعلاني ينتقل تلقائيًا.
 */

async function initAdverModule(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[AdverModule] لم يتم العثور على الحاوية بالمعرف: ${containerId}`);
    return;
  }

  const R2_PUBLIC_URL = 'https://pub-e828389e2f1e484c89d8fb652c540c12.r2.dev';
  const MAX_ADS = 10; // أقصى عدد من الإعلانات للبحث عنه
  const adImages = [];

  // دالة للتحقق من وجود صورة
  function checkImage(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  // جلب الصور الموجودة بالتسلسل
  for (let i = 1; i <= MAX_ADS; i++) {
    const imageUrl = `${R2_PUBLIC_URL}/pic${i}.webp`;
    const exists = await checkImage(imageUrl);
    if (exists) {
      adImages.push(imageUrl);
    } else {
      break; // توقف عند أول صورة غير موجودة
    }
  }

  // إذا لم توجد صور، اعرض رسالة
  if (adImages.length === 0) {
    container.innerHTML = '<p class="no-ads-message">لا توجد إعلانات حالياً</p>';
    container.style.height = 'auto'; // ضبط الارتفاع
    return;
  }

  // بناء هيكل الشريط الإعلاني
  container.innerHTML = `
    <div class="ad-slider-track"></div>
    <div class="ad-slider-dots"></div>
  `;

  const track = container.querySelector('.ad-slider-track');
  const dotsContainer = container.querySelector('.ad-slider-dots');
  const slides = [];
  const dots = [];
  let currentIndex = 0;

  // إنشاء الشرائح والنقاط
  adImages.forEach((imageUrl, index) => {
    const slide = document.createElement('div');
    slide.className = 'ad-slide';
    slide.style.backgroundImage = `url(${imageUrl})`;
    track.appendChild(slide);
    slides.push(slide);

    const dot = document.createElement('div');
    dot.className = 'ad-slider-dot';
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
    dots.push(dot);
  });

  function goToSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentIndex = index;
  }

  // بدء الحركة
  if (slides.length > 0) {
    goToSlide(0); // عرض الشريحة الأولى

    if (slides.length > 1) {
      setInterval(() => {
        const nextIndex = (currentIndex + 1) % slides.length;
        goToSlide(nextIndex);
      }, 3000); // تغيير الشريحة كل 3 ثوانٍ
    }
  }
}