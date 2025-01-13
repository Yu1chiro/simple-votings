// Import Firebase SDKs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase, ref, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Global functions to be used by the HTML buttons
let app, database;

// Initialize Firebase with config
async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    if (!response.ok) throw new Error('Failed to load Firebase config');
    const firebaseConfig = await response.json();

    // Initialize Firebase app and database
    app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    database = getDatabase(app);

    // Call function to fetch and display votes
    fetchVotes(database);
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
}
function createPDFLink(base64Data, linkText) {
  // Konversi base64 ke Blob
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });

  // Buat URL sementara dari Blob
  const blobURL = URL.createObjectURL(blob);

  // Kembalikan elemen tautan
  return `<a href="${blobURL}" target="_blank" class="text-white rounded-lg bg-green-500 py-2 px-2 shadow-lg">${linkText}</a>`;
}

// Function to fetch votes and populate the table
async function fetchVotes(database) {
  try {
    const votesRef = ref(database, 'votes');
    onValue(votesRef, (snapshot) => {
      const votesTableBody = document.getElementById('votes-table');
      votesTableBody.innerHTML = ''; // Clear the table body first
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const vote = childSnapshot.val();
          const voteRow = document.createElement('tr');

          voteRow.innerHTML = `
            <td class="text-center py-3 px-4">${vote.nama}</td>
            <td class="text-center py-3 px-4">${vote.nim}</td>
            <td class="text-center py-3 px-4">${vote.semester}</td>
            <td class="text-center py-3 px-4">${vote.prodi}</td>
           <td class="text-center py-3 px-4">
    ${vote.thumbnail.startsWith('data:application/pdf') 
      ? createPDFLink(vote.thumbnail, 'View') 
      : `<img src="${vote.thumbnail}" onclick="showModal('${vote.thumbnail}')" alt="Thumbnail" class="w-16 h-16 cursor-pointer rounded-lg object-cover">`
    }
  </td>
            <td class="text-center py-3 px-4">${vote.Namecandidate}</td>
            <td class="text-center py-3 px-4">
              <button class="bg-blue-500 mb-3 text-white px-4 py-2 rounded-lg" onclick="viewVoteDetail('${childSnapshot.key}')">Detail</button>
              <button class="bg-red-500 text-white px-4 py-2 rounded-lg" onclick="deleteVote('${childSnapshot.key}')">Delete</button>
            </td>
          `;

          votesTableBody.appendChild(voteRow);
        });
      } else {
        votesTableBody.innerHTML = '<tr><td colspan="8" class="text-center py-3 px-4">No votes found</td></tr>';
      }
    });
  } catch (error) {
    console.error('Failed to fetch votes:', error);
  }
}

// Global function to handle view vote detail
window.viewVoteDetail = function (voteId) {
  const voteRef = ref(database, `votes/${voteId}`);
  get(voteRef).then((snapshot) => {
    if (snapshot.exists()) {
      const vote = snapshot.val();
      Swal.fire({
        title: vote.nama,
        html: `
  <div class="mb-4">
    <p class="text-lg font-semibold"><strong>Nama:</strong> ${vote.nama}</p>
    <p class="text-lg"><strong>NIM:</strong> ${vote.nim}</p>
    <p class="text-lg"><strong>Semester:</strong> ${vote.semester}</p>
    <p class="text-lg"><strong>Prodi:</strong> ${vote.prodi}</p>
    <p class="text-lg mb-3"><strong>Candidate Chosen:</strong> ${vote.Namecandidate}</p>
       <p class="font-semibold mb-5">KHS Mahasiswa:</p>
                ${vote.thumbnail.startsWith('data:application/pdf') 
                  ? createPDFLink(vote.thumbnail, 'View') 
                  : `<a src="${vote.thumbnail}" class="text-white bg-green-500 py-2 px-2 shadow-lg" alt="">`
                }
  </div>

        `,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Close',
      });
    }
  }).catch((error) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load vote details.',
    });
    console.error('Failed to load vote detail:', error);
  });
};

// Global function to handle deleting a vote
window.deleteVote = function (voteId) {
  const voteRef = ref(database, `votes/${voteId}`);
  remove(voteRef).then(() => {
    Swal.fire({
      icon: 'success',
      title: 'Deleted',
      text: 'Vote has been successfully deleted.',
    });
  }).catch((error) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to delete vote.',
    });
    console.error('Failed to delete vote:', error);
  });
};

// Initialize Firebase when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase();
});
