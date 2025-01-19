// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getDatabase, ref, onValue, query, limitToLast } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Cache untuk menyimpan data
const cache = {
  candidates: null,
  lastFetch: 0
};

// Durasi cache dalam milidetik (5 menit)
const CACHE_DURATION = 5 * 60 * 1000;

// Fungsi untuk menginisialisasi Firebase
async function initializeFirebase() {
  try {
    // Menggunakan cache untuk config jika tersedia
    const cachedConfig = sessionStorage.getItem('firebaseConfig');
    let firebaseConfig;

    if (cachedConfig) {
      firebaseConfig = JSON.parse(cachedConfig);
    } else {
      const response = await fetch('/firebase-config');
      if (!response.ok) throw new Error('Failed to load Firebase config');
      firebaseConfig = await response.json();
      sessionStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));
    }
    
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    
    setupCandidatesCards();
    
    return { app, database };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Fungsi untuk menyiapkan listener data kandidat
function setupCandidatesCards() {
  const db = getDatabase();
  const candidatesRef = ref(db, 'candidates-data');
  
  // Batasi jumlah data yang diambil
  const candidatesQuery = query(candidatesRef, limitToLast(10));
  
  // Implementasi debounce untuk update UI
  let debounceTimeout;
  
  onValue(candidatesQuery, (snapshot) => {
    const currentTime = Date.now();
    
    // Periksa cache sebelum memperbarui
    if (cache.candidates && currentTime - cache.lastFetch < CACHE_DURATION) {
      updateCandidatesCards(cache.candidates);
      return;
    }
    
    const candidates = snapshot.val();
    
    // Update cache
    cache.candidates = candidates;
    cache.lastFetch = currentTime;
    
    // Debounce update UI
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      updateCandidatesCards(candidates);
    }, 100);
    
  }, (error) => {
    console.error('Error loading candidates:', error);
  });
}

// Fungsi untuk memperbarui tampilan kartu dengan lazy loading gambar
function updateCandidatesCards(candidates) {
    const candidatesContainer = document.getElementById('candidates');
    const loadingState = document.querySelector('.loading-state');
    
    // Gunakan DocumentFragment untuk batch DOM updates
    const fragment = document.createDocumentFragment();
    
    loadingState.style.display = 'none';
    
    if (candidates) {
      Object.entries(candidates).forEach(([key, candidate]) => {
        const cardElement = document.createElement('div');
        cardElement.className = `
          bg-gradient-to-r from-[#0a387f] to-[#1C1678]
          bg-opacity-20 backdrop-blur-md
          animate-card p-6 rounded-lg shadow-md border border-[rgba(255,255,255,0.2)]
        `;
        
        // Implementasi lazy loading untuk gambar
        cardElement.innerHTML = `
          <div class="h-62 flex justify-center rounded mb-4">
            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
                 data-src="${candidate.thumbnail}" 
                 class="rounded h-62 lazy" 
                 alt="${candidate.name}">
          </div>
          <h3 class="text-xl font-custom font-normal mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[hsl(42,85%,65%)] to-[hsl(42,80%,85%)]">${candidate.name}</h3>
          <a href="/vote/candidates.html?url=${candidate.url}" >
            <button class="bg-blue-700 text-[#FAFAFA] font-custom px-6 py-3 rounded-lg shadow-md hover:bg-green-700 hover:text-[#FAFAFA] transition">
              Detail
            </button>
          </a>
        `;
        
        fragment.appendChild(cardElement);
      });
      
      // Batch update DOM
      candidatesContainer.innerHTML = '';
      candidatesContainer.appendChild(fragment);
      
      // Inisialisasi lazy loading
      initLazyLoading();
    }
}

// Fungsi untuk menginisialisasi lazy loading
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
}

// Inisialisasi Firebase saat DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase().catch(console.error);
});