document.addEventListener("DOMContentLoaded", function () {
    const lazyImages = document.querySelectorAll("img.lazy");
  
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src; // Ganti src dengan data-src
            img.classList.add("lazy-loaded"); // Tambahkan class untuk efek transisi
            observer.unobserve(img); // Hentikan pengamatan setelah gambar dimuat
          }
        });
      });
  
      lazyImages.forEach(image => observer.observe(image));
    } else {
      // Fallback untuk browser lama
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.classList.add("lazy-loaded");
      });
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    const lazyBackgrounds = document.querySelectorAll(".lazy-bg");
  
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const lazyBg = entry.target;
            const bgUrl = lazyBg.getAttribute("data-bg");
            lazyBg.style.backgroundImage = `url('${bgUrl}')`;
            lazyBg.classList.add("bg-loaded");
            observer.unobserve(lazyBg);
          }
        });
      });
  
      lazyBackgrounds.forEach((lazyBg) => observer.observe(lazyBg));
    } else {
      // Fallback for browsers without Intersection Observer
      lazyBackgrounds.forEach((lazyBg) => {
        const bgUrl = lazyBg.getAttribute("data-bg");
        lazyBg.style.backgroundImage = `url('${bgUrl}')`;
        lazyBg.classList.add("bg-loaded");
      });
    }
  });
  