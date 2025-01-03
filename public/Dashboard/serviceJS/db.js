// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase, ref, set, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Initialize Firebase with config
async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    if (!response.ok) throw new Error('Failed to load Firebase config');
    const firebaseConfig = await response.json();
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);
    
    // Set up real-time listener for candidates table
    setupCandidatesListener();
    
    return { app, auth, database };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to initialize Firebase. Please check your configuration.'
    });
    throw new Error('Gagal memuat konfigurasi Firebase');
  }
}

// Setup real-time listener for candidates
function setupCandidatesListener() {
  const db = getDatabase();
  const candidatesRef = ref(db, 'candidates-data');
  
  onValue(candidatesRef, (snapshot) => {
    updateCandidatesTable(snapshot.val());
  }, (error) => {
    console.error('Error loading candidates:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load candidates data'
    });
  });
}

// Update table with candidates data
function updateCandidatesTable(candidates) {
  const tableBody = document.getElementById('candidates-table');
  tableBody.innerHTML = '';
  if (candidates) {
    Object.entries(candidates).forEach(([key, candidate]) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="text-center py-3 px-4">${candidate.name}</td>
        <td class="text-center py-3 px-4">
        <img src="${candidate.thumbnail}" alt="${candidate.name}" class="w-20 h-20 object-cover mx-auto">
        </td>
        <td class="text-center py-3 px-4">${candidate.url || ''}</td>
        <td class="text-center py-3 px-4">
          <button onclick="detailCandidate('${key}')" class="bg-blue-500 mb-3 text-white px-4 py-2 rounded mr-2">
            Detail
          </button>
          <button onclick="editCandidate('${key}')" class="bg-blue-500 mb-3 text-white px-4 py-2 rounded mr-2">
            Edit
          </button>
          <button onclick="removeCandidate('${key}')" class="bg-red-500 text-white px-4 py-2 rounded">
            Delete
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
}

// Event listener untuk button add candidates
// Event listener untuk button add candidates
document.getElementById('add-candidates').addEventListener('click', () => {
    let editor;
  
    // Deteksi ukuran layar untuk responsivitas
    const isMobile = window.innerWidth < 768;
  
    Swal.fire({
      title: '<p class="text-lg font-semibold">Add New Candidate</p>',
      width: isMobile ? '95%' : '800px',
      customClass: {
        container: 'p-2 sm:p-4',
        popup: 'rounded-lg shadow-xl',
        title: 'text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4',
        confirmButton: 'bg-green-500 hover:bg-green-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base mx-1 sm:mx-2',
        cancelButton: 'bg-red-500 hover:bg-red-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base mx-1 sm:mx-2',
        actions: 'flex flex-col sm:flex-row gap-2 sm:gap-0',
      },
      html: `
        <div class="space-y-4 sm:space-y-6 p-2 sm:p-4">
          <div class="flex flex-col">
            <label for="candidate-name" class="text-left text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">Name of Candidate</label>
            <input id="candidate-name" 
              class="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
              placeholder="Enter candidate name">
          </div>
          
          <div class="flex flex-col">
            <label for="candidate-url" class="text-left text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">URL</label>
            <input id="candidate-url" 
              class="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
              placeholder="Enter candidate URL">
          </div>
          
          <div class="flex flex-col">
            <label for="candidate-thumbnail" class="text-left text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">Thumbnail Image</label>
            <input id="candidate-thumbnail" type="file" accept="image/*" 
              class="w-full text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg
              file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4
              file:rounded-lg file:border-0 file:text-sm sm:file:text-base file:font-semibold
              file:bg-blue-500 file:text-white
              hover:file:bg-blue-600 transition-colors duration-200">
          </div>
          
          <div class="flex flex-col">
            <label for="candidate-description" class="text-left text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">Description</label>
            <div id="editor-container" class="min-h-[200px] sm:min-h-[300px] w-full">
              <textarea id="candidate-description"></textarea>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'bg-green-500 me-3 hover:bg-green-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base',
        cancelButton: 'bg-red-500 hover:bg-red-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base'
      },
      showLoaderOnConfirm: true,
      didOpen: () => {
        ClassicEditor
          .create(document.querySelector('#candidate-description'), {
            toolbar: isMobile ? [
              'heading',
              '|',
              'bold',
              'italic',
              'bulletedList',
              '|',
              'undo',
              'redo'
            ] : [
              'heading',
              '|',
              'bold',
              'italic',
              'link',
              'bulletedList',
              'numberedList',
              '|',
              'outdent',
              'indent',
              '|',
              'blockQuote',
              'undo',
              'redo'
            ],
          })
          .then(newEditor => {
            editor = newEditor;
            const editorElement = document.querySelector('.ck-editor__editable');
            editorElement.style.minHeight = isMobile ? '200px' : '250px';
            
            const editorToolbar = document.querySelector('.ck-toolbar');
            if (editorToolbar) {
              editorToolbar.style.flexWrap = 'wrap';
            }
          })
          .catch(error => {
            console.error(error);
          });
  
        const swalContainer = Swal.getPopup();
        swalContainer.style.width = isMobile ? '95%' : '800px';
        swalContainer.style.padding = isMobile ? '1rem' : '2rem';
        swalContainer.classList.add('overflow-y-auto', 'max-h-[90vh]');
      },
      preConfirm: () => {
        const name = document.getElementById('candidate-name').value;
        const url = document.getElementById('candidate-url').value;
        const thumbnail = document.getElementById('candidate-thumbnail').files[0];
        const description = editor.getData();
  
        if (!name || !thumbnail || !description || !url) {
          Swal.showValidationMessage(`
            <div class="text-red-500 font-medium text-sm sm:text-base">
              Please fill in all required fields
            </div>
          `);
          return false;
        }
  
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name,
              url,
              thumbnail: e.target.result,
              description
            });
          };
          reader.readAsDataURL(thumbnail);
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Saving Data',
          html: `
            <div class="flex flex-col items-center">
              <div class="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
              <p class="mt-2 sm:mt-4 text-sm sm:text-base text-gray-600">Please wait while we save your data...</p>
            </div>
          `,
          allowOutsideClick: false,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-lg w-[90%] sm:w-auto',
            title: 'text-lg sm:text-xl font-bold'
          }
        });
  
        const db = getDatabase();
        const newCandidateRef = ref(db, 'candidates-data/' + Date.now());
        
        set(newCandidateRef, {
          name: result.value.name,
          url: result.value.url,
          thumbnail: result.value.thumbnail,
          description: result.value.description,
          timestamp: Date.now()
        })
        .then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Candidate data has been saved',
            customClass: {
              popup: 'rounded-lg w-[90%] sm:w-auto',
              title: 'text-green-500 font-bold text-lg sm:text-xl',
              confirmButton: 'bg-green-500 hover:bg-green-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base'
            },
            buttonsStyling: false
          });
        })
        .catch((error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to save candidate data',
            customClass: {
              popup: 'rounded-lg w-[90%] sm:w-auto',
              title: 'text-red-500 font-bold text-lg sm:text-xl',
              confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base'
            },
            buttonsStyling: false
          });
        });
      }
    });
});

// Fungsi global untuk edit kandidat
window.editCandidate = function(candidateId) {
    const db = getDatabase();
    const candidateRef = ref(db, `candidates-data/${candidateId}`);
    
    get(candidateRef).then((snapshot) => {
      if (snapshot.exists()) {
        const candidate = snapshot.val();
        let editor;
        
        Swal.fire({
          title: 'Edit Candidate',
          html: `
            <input id="edit-name" class="swal2-input w-xl px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" value="${candidate.name}">
            <input id="edit-url" class="swal2-input w-xl px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" value="${candidate.url || ''}">
            <div class="flex justify-center">
              <img src="${candidate.thumbnail}" alt="Current thumbnail" class="w-32 h-32 object-cover mt-2">
            </div>
            <input id="edit-thumbnail" type="file" class="swal2-input" accept="image/*">
            <textarea class="min-h-[200px] sm:min-h-[300px] w-full" id="edit-description">${candidate.description}</textarea>
          `,
          didOpen: () => {
            ClassicEditor
              .create(document.querySelector('#edit-description'))
              .then(newEditor => {
                editor = newEditor;
                editor.setData(candidate.description);
              });
          },
          customClass: {
            confirmButton: 'bg-green-500 hover:bg-green-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base',
            cancelButton: 'bg-red-500 hover:bg-red-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base'
          },
          showCancelButton: true,
          confirmButtonText: 'Update'
        }).then((result) => {
          if (result.isConfirmed) {
            const name = document.getElementById('edit-name').value;
            const url = document.getElementById('edit-url').value;
            const thumbnailFile = document.getElementById('edit-thumbnail').files[0];
            const description = editor.getData();
  
            if (!name || !description || !url) {
              Swal.fire('Error', 'Please fill all required fields', 'error');
              return;
            }
  
            Swal.fire({
              title: 'Updating...',
              html: 'Please wait...',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });
  
            const updateData = (thumbnailUrl) => {
              set(candidateRef, {
                name,
                url,
                thumbnail: thumbnailUrl || candidate.thumbnail,
                description,
                timestamp: Date.now()
              })
              .then(() => {
                Swal.fire('Success', 'Candidate updated successfully', 'success');
              })
              .catch((error) => {
                Swal.fire('Error', 'Failed to update candidate', 'error');
              });
            };
  
            if (thumbnailFile) {
              const reader = new FileReader();
              reader.onload = (e) => {
                updateData(e.target.result);
              };
              reader.readAsDataURL(thumbnailFile);
            } else {
              updateData(candidate.thumbnail);
            }
          }
        });
      }
    });
  };
window.detailCandidate = function(candidateId) {
    const db = getDatabase();
    const candidateRef = ref(db, `candidates-data/${candidateId}`);
    
    get(candidateRef).then((snapshot) => {
      if (snapshot.exists()) {
        const candidate = snapshot.val();
        
        // Menampilkan detail kandidat dengan SweetAlert2
        Swal.fire({
          title: `Detail Kandidat: ${candidate.name}`,
          width: window.innerWidth < 768 ? '95%' : '800px',
          customClass: {
            container: 'p-2 sm:p-4',
            popup: 'rounded-lg shadow-xl',
            title: 'text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4',
            confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base',
          },
          html: `
            <div class="space-y-4 sm:space-y-6 p-2 sm:p-4">
              <div class="flex flex-col sm:flex-row gap-4 items-start">
                <div class="w-full sm:w-1/3">
                  <img src="${candidate.thumbnail}" 
                       alt="${candidate.name}" 
                       class="w-full h-auto rounded-lg shadow-md">
                </div>
                <div class="w-full sm:w-2/3 space-y-4">
                  <div>
                    <h3 class="text-lg sm:text-xl font-semibold text-gray-800">Informasi Kandidat</h3>
                    <div class="mt-2">
                      <p class="text-sm sm:text-base text-gray-600">
                        <span class="font-medium text-gray-700">Nama:</span> ${candidate.name}
                        <span class="font-medium text-gray-700">Route:</span> ${candidate.url || ''}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 class="text-lg sm:text-xl font-semibold text-gray-800">Deskripsi</h3>
                    <div class="mt-2 prose prose-sm sm:prose-base max-w-none">
                      ${candidate.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `,
          buttonsStyling: false,
          showConfirmButton: true,
          confirmButtonText: 'Tutup',
          didOpen: () => {
            // Styling tambahan untuk container SweetAlert
            const swalContainer = Swal.getPopup();
            swalContainer.style.width = window.innerWidth < 768 ? '95%' : '800px';
            swalContainer.style.padding = window.innerWidth < 768 ? '1rem' : '2rem';
            swalContainer.classList.add('overflow-y-auto', 'max-h-[90vh]');
          }
        });
      }
    }).catch((error) => {
      console.error("Error getting candidate details:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to load candidate details',
        customClass: {
          popup: 'rounded-lg',
          title: 'text-red-500 font-bold',
          confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200'
        },
        buttonsStyling: false
      });
    });
  };
  
// Fungsi global untuk menghapus kandidat
window.removeCandidate = function(candidateId) {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      const db = getDatabase();
      const candidateRef = ref(db, `candidates-data/${candidateId}`);
      
      remove(candidateRef)
        .then(() => {
          Swal.fire(
            'Deleted!',
            'Candidate has been deleted.',
            'success'
          );
        })
        .catch((error) => {
          Swal.fire(
            'Error!',
            'Failed to delete candidate.',
            'error'
          );
        });
    }
  });
};

// Initialize Firebase when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase().catch(console.error);
});