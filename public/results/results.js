// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

let database;

async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    if (!response.ok) throw new Error('Failed to load Firebase config');
    const firebaseConfig = await response.json();
    
    const app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    
    // Menggunakan URL pattern yang tetap
    const candidateUrl = "candidate-1"; // Anda dapat mengganti angka ini sesuai kebutuhan
    setupSingleCandidate(candidateUrl);
    
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

function setupSingleCandidate(candidateUrl) {
  const candidatesRef = ref(database, 'candidates-data');
  
  onValue(candidatesRef, (snapshot) => {
    const candidates = snapshot.val();
    if (candidates) {
      const candidate = Object.values(candidates).find(c => c.url === candidateUrl);
      if (candidate) {
        updateCandidateCard(candidate);
      } else {
        console.error('Kandidat tidak ditemukan');
      }
    }
  }, (error) => {
    console.error('Error loading candidate:', error);
  });
}

function updateCandidateCard(candidate) {
  const congratulationsContainer = document.getElementById('congartulations');
  
  const cardElement = document.createElement('div');
  cardElement.className = 'margin-custom bg-gradient-to-r from-[#0a387f] to-[#1C1678] animate-card p-6 rounded-lg shadow-md';
  
  cardElement.innerHTML = `
    <div class="h-62 flex justify-center rounded mb-4">
      <img src="${candidate.thumbnail}" class="rounded h-62" alt="${candidate.name}">
    </div>
    <h3 class="text-2xl font-custom text-center font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[hsl(42,85%,65%)] to-[hsl(42,80%,85%)]">
      ${candidate.name}
    </h3>
  `;
  
  congratulationsContainer.innerHTML = '';
  congratulationsContainer.appendChild(cardElement);
}

document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase().catch(console.error);
});