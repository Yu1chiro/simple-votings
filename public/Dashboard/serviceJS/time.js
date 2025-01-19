import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase, ref, set, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Global variables
let database;

// Initialize Firebase and setup system
async function initializeSystem() {
    try {
        const { database: db } = await initializeFirebase();
        database = db;
        await setupEventListeners();
    } catch (error) {
        console.error('Error initializing system:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Gagal menginisialisasi sistem. Silakan muat ulang halaman.'
        });
    }
}

// Firebase initialization
async function initializeFirebase() {
    try {
        const response = await fetch('/firebase-config');
        if (!response.ok) throw new Error('Failed to load Firebase config');
        const firebaseConfig = await response.json();
        
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const database = getDatabase(app);
        
        return { app, auth, database };
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        throw new Error('Gagal memuat konfigurasi Firebase');
    }
}
// Setup event listeners
async function setupEventListeners() {
    const openPresensiButton = document.getElementById('open-presensi');
    const formPresensiActive = document.getElementById('form-presensi-active');
    const formPresensiLate = document.getElementById('form-presensi-late');
    const addLocationButton = document.getElementById('add-location');
    const deleteCountdownButton = document.getElementById('delete-time');
    const buttonPresensi = document.getElementById('button-presensi');
    const buttonLate = document.getElementById('button-late');

    if (openPresensiButton) {
        openPresensiButton.addEventListener('click', handleOpenPresensi);
    }

    if (formPresensiActive) {
        formPresensiActive.addEventListener('submit',);
    }

    if (formPresensiLate) {
        formPresensiLate.addEventListener('submit',);
    }

    if (addLocationButton) {
        addLocationButton.addEventListener('click', handleAddLocation);
    }

    if (deleteCountdownButton) {
        deleteCountdownButton.addEventListener('click', handleDeleteCountdown);
    }
    if (buttonPresensi && buttonLate) {
        deleteCountdownButton.addEventListener('click', () => {
            buttonPresensi.disabled = true;
            buttonLate.disabled = true;

            Swal.fire({
                icon: 'info',
                title: 'Tolong refresh halaman',
                text: 'Tombol presensi dan terlambat tidak dapat digunakan setelah waktu dihapus.'
            });
        });
    }
    if (openPresensiButton) {
        openPresensiButton.addEventListener('click', () => {
            if (buttonPresensi && buttonLate) {
                buttonPresensi.disabled = false;
                buttonLate.disabled = false;
            }
        });
    }

    // Periksa status countdown saat inisialisasi
    await checkCountdownStatus();
}
async function checkCountdownStatus() {
    try {
        const timeRef = ref(database, 'time');
        const timeSnapshot = await get(timeRef);

        const formPresensiActive = document.getElementById('form-presensi-active');
        if (formPresensiActive) {
            if (!timeSnapshot.exists()) {
                formPresensiActive.classList.add('hidden');
            } else {
                const timeData = timeSnapshot.val();
                const now = new Date().getTime();

                if (now < timeData.startTime) {
                    formPresensiActive.classList.add('hidden');
                } else {
                    formPresensiActive.classList.remove('hidden');
                }
            }
        }
    } catch (error) {
        console.error('Error checking countdown status:', error);
    }
}

// Penanganan penghapusan countdown
async function handleDeleteCountdown() {
    try {
        const timeRef = ref(database, 'time');
        await remove(timeRef);

        // Sembunyikan form presensi aktif
        const formPresensiActive = document.getElementById('form-presensi-active');
        if (formPresensiActive) {
            formPresensiActive.classList.add('hidden');
        }

        Swal.fire('Presensi Ditutup', 'success');
    } catch (error) {
        console.error('Error deleting countdown:', error);
        Swal.fire('Error', 'Gagal menghapus countdown', 'error');
    }
}
// Handle opening presence time setter
async function handleOpenPresensi() {
    const { value: formValues } = await Swal.fire({
        html: `
           <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Pilih Waktu</h2>
    <form>
      <label for="start-time" class="block text-gray-700 font-medium mb-2">Waktu Mulai</label>
      <input id="start-time" class="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700" type="datetime-local">

      <label for="end-time" class="block text-gray-700 font-medium mt-4 mb-2">Waktu Selesai</label>
      <input id="end-time" class="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700" type="datetime-local">
    </form>
  </div>
        `,
        customClass: {
            confirmButton: 'bg-green-500 me-3 hover:bg-green-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base',
            cancelButton: 'bg-red-500 hover:bg-red-600 text-white font-semibold px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base'
          },
        focusConfirm: false,
        preConfirm: () => ({
            startTime: document.getElementById('start-time').value,
            endTime: document.getElementById('end-time').value
        })
    });

    if (formValues) {
        try {
            await set(ref(database, 'time'), {
                status: 'active',
                startTime: new Date(formValues.startTime).getTime(),
                endTime: new Date(formValues.endTime).getTime()
            });
            
            // Tampilkan form presensi aktif dan hapus overlay
            const formPresensiActive = document.getElementById('form-presensi-active');
            if (formPresensiActive) {
                formPresensiActive.classList.remove('hidden');
                const existingOverlay = document.querySelector('.fixed.inset-0');
                if (existingOverlay) {
                    existingOverlay.remove();
                }
            }
            
            Swal.fire('Berhasil', 'Waktu presensi telah diatur', 'success');
        } catch (error) {
            console.error('Error setting time:', error);
            Swal.fire('Error', 'Gagal menyimpan pengaturan waktu', 'error');
        }
    }
}
async function handleAddLocation() {
    const { value: formValues } = await Swal.fire({
        title: 'Pengaturan Lokasi Presensi',
        html: `
            <div class="mb-3">
                <label for="latitude" class="block">Latitude:</label>
                <input id="latitude" class="swal2-input" type="number" step="any" placeholder="Contoh: -8.099219">
            </div>
            <div class="mb-3">
                <label for="longitude" class="block">Longitude:</label>
                <input id="longitude" class="swal2-input" type="number" step="any" placeholder="Contoh: 115.107613">
            </div>
        `,
        focusConfirm: false,
        preConfirm: () => ({
            latitude: document.getElementById('latitude').value,
            longitude: document.getElementById('longitude').value
        })
    });

    if (formValues) {
        try {
            await set(ref(database, 'location'), {
                latitude: parseFloat(formValues.latitude),
                longitude: parseFloat(formValues.longitude)
            });
            
            Swal.fire('Berhasil', 'Lokasi presensi telah diatur', 'success');
        } catch (error) {
            console.error('Error setting location:', error);
            Swal.fire('Error', 'Gagal menyimpan pengaturan lokasi', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', initializeSystem);