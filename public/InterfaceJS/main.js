// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Fungsi untuk menginisialisasi Firebase
async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    if (!response.ok) throw new Error('Failed to load Firebase config');
    const firebaseConfig = await response.json();
    
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    
    // Setup listener untuk data kandidat
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
  
  onValue(candidatesRef, (snapshot) => {
    const candidates = snapshot.val();
    updateCandidatesCards(candidates);
  }, (error) => {
    console.error('Error loading candidates:', error);
  });
}

// Update the card display code
function updateCandidatesCards(candidates) {
    const candidatesContainer = document.getElementById('candidates');
    candidatesContainer.innerHTML = '';
    const loadingState = document.querySelector('.loading-state');

    // Tampilkan loading state
    loadingState.style.display = 'none';
    
    if (candidates) {
      Object.entries(candidates).forEach(([key, candidate]) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'bg-[#0A3981] p-6 rounded-lg shadow-md';
        
        cardElement.innerHTML = `
          <div class="h-62 flex justify-center rounded mb-4">
            <img src="${candidate.thumbnail}" class="rounded h-62" alt="${candidate.name}">
          </div>
          <h3 class="text-xl font-semibold mb-2 text-white">${candidate.name}</h3>
          <a href="/vote/candidates.html?url=${candidate.url}" >
            <button class="bg-white text-blue-600 px-4 py-2 rounded shadow-md hover:bg-blue-700 hover:text-[#FAFAFA] transition">
              Detail
            </button>
          </a>
        `;
        
        candidatesContainer.appendChild(cardElement);
      });
    }
  }

// Inisialisasi Firebase saat DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase().catch(console.error);
});