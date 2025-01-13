// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase, ref, set, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Global variables
let database;
let countdownInterval;

// Initialize Firebase and setup system
async function initializeSystem() {
    try {
        const { database: db } = await initializeFirebase();
        database = db;
        await setupEventListeners();
        await setupInitialState();
        await checkPresenceStatus(); // Tambahan untuk memeriksa status presensi
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

    if (openPresensiButton) {
        openPresensiButton.addEventListener('click', handleOpenPresensi);
    }

    if (formPresensiActive) {
        formPresensiActive.addEventListener('submit', handleActiveSubmission);
    }

    if (formPresensiLate) {
        formPresensiLate.addEventListener('submit', handleLateSubmission);
    }

    if (addLocationButton) {
        addLocationButton.addEventListener('click', handleAddLocation);
    }

    if (deleteCountdownButton) {
        deleteCountdownButton.addEventListener('click', handleDeleteCountdown);
    }

    // Periksa status countdown saat inisialisasi
    await checkCountdownStatus();
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

        Swal.fire('Berhasil', 'Countdown telah dihapus', 'success');
    } catch (error) {
        console.error('Error deleting countdown:', error);
        Swal.fire('Error', 'Gagal menghapus countdown', 'error');
    }
}
function updateCountdown(timeData) {
    // Set initial state immediately
    const formPresensiActive = document.getElementById('form-presensi-active');
    if (formPresensiActive) {
        formPresensiActive.style.display = 'none';
        formPresensiActive.classList.add('hidden');
    }

    let countdownElement = document.getElementById('countdown');
    const headerElement = document.querySelector('h2');
    const modalActive = document.getElementById('modal-active');
    const info = document.getElementById('info');

    if (!countdownElement && headerElement) {
        countdownElement = document.createElement('div');
        countdownElement.id = 'countdown';
        countdownElement.className = 'text-center bg-gradient-to-r from-[#2B3784] to-[#4361EE] text-lg text-[#fafafafa] font-bold py-3 rounded-lg mb-5';
        headerElement.after(countdownElement);
    }

    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const startTime = timeData.startTime;
        const endTime = timeData.endTime;

        // Check if current time is before start time
        if (now < startTime) {
            if (countdownElement) {
                const timeToStart = startTime - now;
                const startHours = Math.floor(timeToStart / (1000 * 60 * 60));
                const startMinutes = Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60));
                const startSeconds = Math.floor((timeToStart % (1000 * 60)) / 1000);
                countdownElement.textContent = `Presensi akan dibuka dalam: ${startHours}:${startMinutes}:${startSeconds}`;
            }
            // Ensure form stays hidden
            if (formPresensiActive) {
                formPresensiActive.style.display = 'none';
                formPresensiActive.classList.add('hidden');
            }
            if (modalActive) modalActive.classList.remove('hidden');
            if (info) info.classList.add('hidden');
            return;
        }

        // Show form only when appropriate
        if (formPresensiActive) {
            formPresensiActive.style.display = '';
            formPresensiActive.classList.remove('hidden');
        }
        if (modalActive) modalActive.classList.remove('hidden');
        if (info) info.classList.add('hidden');

        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            if (countdownElement) {
                countdownElement.textContent = 'Waktu presensi telah berakhir';
            }
            if (formPresensiActive) {
                formPresensiActive.style.display = 'none';
                formPresensiActive.classList.add('hidden');
            }
            updateModalVisibility({ status: 'expired' });
            return;
        }

        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (countdownElement) {
            countdownElement.textContent = `Batas Pengisisan: ${hours}:${minutes}:${seconds}`;
        }
    }, 1000);
}
// Modified checkCountdownStatus to exclude overlay logic
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


// Setup initial state
async function setupInitialState() {
    const timeRef = ref(database, 'time');
    onValue(timeRef, handleTimeUpdate);
}

// Handle time updates
function handleTimeUpdate(snapshot) {
    const timeData = snapshot.val();
    if (!timeData) return;

    updateCountdown(timeData);
    updateModalVisibility(timeData);
}

// Update modal visibility
function updateModalVisibility(timeData) {
    const modalActive = document.getElementById('modal-active');
    const modalLate = document.getElementById('modal-late');

    if (modalActive && modalLate) {
        if (timeData.status === 'expired') {
            modalActive.classList.add('hidden');
            modalLate.classList.remove('hidden');
        } else {
            modalActive.classList.remove('hidden');
            modalLate.classList.add('hidden');
        }
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


// Handle location settings
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

// Check presence status on page load
async function checkPresenceStatus() {
    try {
        // Periksa status presensi di localStorage
        const presenceStatus = localStorage.getItem('status-presensi-active');
        const userNIM = localStorage.getItem('userNIM');
        
        if (!userNIM || !presenceStatus) {
            // Jika tidak ada data di localStorage, tampilkan modal
            const modalActive = document.getElementById('modal-active');
            if (modalActive) {
                modalActive.classList.remove('hidden');
            }
            return;
        }

        // Periksa status presensi di database
        const presenceRef = ref(database, `presensi-active/${userNIM}`);
        const presenceSnapshot = await get(presenceRef);

        const modalActive = document.getElementById('modal-active');
        
        // Jika data ada di database dan localStorage, sembunyikan modal
        if (presenceSnapshot.exists() && presenceStatus === 'true') {
            if (modalActive) {
                modalActive.classList.add('hidden');
            }
        } else {
            // Jika tidak ada di database atau localStorage, tampilkan modal
            if (modalActive) {
                modalActive.classList.remove('hidden');
            }
        }

    } catch (error) {
        console.error('Error checking presence status:', error);
    }
}
// VALIDATING NIM CHECKING
function isValidNIM(nim) {
    // NIM harus terdiri dari tepat 8 digit angka (Anda dapat menyesuaikan regex untuk pola lain)
    const nimPattern = /^\d{10}$/;
    return nimPattern.test(nim);}


// VALIDATING FUNCTION
async function handleActiveSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const nim = form.querySelector('#nim').value;

    // Validasi NIM
    if (!isValidNIM(nim)) {
        Swal.fire({
            icon: 'warning',
            html:`
            <div class="flex justify-center">
             <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
             </div>
             <h2 class="font-bold text-green-500">NIM Tidak Valid, Periksa kembali nim anda</h2>
            `,
        });
        return;
    }

    try {
        // Show loading spinner
        Swal.fire({
            html: `
                <div class="flex justify-center">
                    <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
                </div>
                <h2 class="font-bold text-green-500">Processing...</h2>
            `,
            allowOutsideClick: false, // Tidak memungkinkan klik di luar modal
            didOpen: () => {
                Swal.showLoading(); // Menampilkan loading spinner
            }
        });
    
        // Setelah 2 detik, menutup SweetAlert
      

        // Check for existing submission
        const nimRef = ref(database, `presensi-active/${nim}`, `presensi-late/${nim}`);
        const nimSnapshot = await get(nimRef);

        if (nimSnapshot.exists()) {
            Swal.fire('Error', 'Anda sudah melakukan presensi sebelumnya', 'error');
            return;
        }

        // Get location
        const position = await getLocation();
        const attendanceStatus = await determineAttendanceStatus(position);

        if (!attendanceStatus.locationValid) {
            const confirmSubmit = await Swal.fire({
                html: `
                <div class="text-center mb-4">
                    <img src="/img/logo.webp" alt="Logo" class="mb-4 h-16 w-16 mx-auto">
                    <p class="text-lg font-bold text-red-500">
                        Anda berada di luar area presensi ! 
                        <span class="text-lg font-bold text-red-500">(${attendanceStatus.distance.toFixed(2)} km) dari lokasi</span> 
                    </p>
                    <p class="text-lg font-semibold text-gray-600 mb-6">
                        Data akan tercatat sebagai <span class="text-lg font-bold text-red-500">Tidak Hadir</span> dalam sistem konfirmasi?
                        Jika anda tidak ingin menkonfirmasi, namun anda sudh berada di lokasi saat ini, anda bisa menghapus data cookie dan me refresh halaman ini agar sistem dapat mendapatkan lokasi terbaru anda
                    </p>
                </div>

                `,
                showCancelButton: true,
                confirmButtonText: 'Konfirmasi',
                cancelButtonText: 'Batal'
            });

            if (!confirmSubmit.isConfirmed) return;
        }

        // Save data
        await saveActivePresence(form, position, attendanceStatus);

        // Close the loading spinner and show success after a small delay
        setTimeout(() => {
            Swal.close(); // Close the loading spinner
        
            // Show success alert after the spinner is closed
            Swal.fire({
                html: `
                    <div class="flex justify-center">
                        <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Logo" class="mb-3 h-auto">
                    </div>
                    <h2 class="font-bold text-green-500 mb-2">Terkonfirmasi !</h2>
                    <p class="text-lg font-bold">Status anda : <span class="text-lg font-bold text-red-500">${attendanceStatus.status}</span></p>
                `,
                showConfirmButton: true, // Optional: Display confirm button
                confirmButtonText: 'OK',
                confirmButtonColor: '#16a34a' // Optional: Customize confirm button text
            });
        }, 600); // Delay before success alert
        
        form.reset();
        

    } catch (error) {
        setTimeout(() => {
            Swal.close(); // Menutup SweetAlert setelah 2 detik
        }, 2000);
        handleSubmissionError(error);
    }
}
async function handleLateSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const nimInput = form.querySelector('#nim-late');

    // Cek apakah elemen input NIM ada
    if (!nimInput) {
        Swal.fire('Error', 'Input NIM tidak ditemukan', 'error');
        return;
    }

    const nim = nimInput.value;

    // Validasi NIM
    if (!isValidNIM(nim)) {
        Swal.fire({
            icon: 'warning',
            html:`
            <div class="flex justify-center">
             <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
             </div>
             <h2 class="font-bold text-red-500">NIM Tidak Valid, Periksa kembali nim anda</h2>
            `,
 
        });
        return;
    }

    try {
        // Show loading spinner
        Swal.fire({
            html: `
                <div class="flex justify-center">
                    <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
                </div>
                <h2 class="font-bold text-green-500">Processing...</h2>
            `,
            allowOutsideClick: false, // Tidak memungkinkan klik di luar modal
            didOpen: () => {
                Swal.showLoading(); // Menampilkan loading spinner
            }
        });

        // Mengecek apakah NIM sudah terdaftar di presensi-late
        const nimExists = await checkLatePresenceStatus(nim);
        if (nimExists) {
            Swal.fire({
                html:`
                <div class="flex justify-center">
                 <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
                 </div>
                 <h2 class="font-bold text-red-500 mb-2">Sending Access Denied !</h2>
                 <p class="font-normal text-gray-700">NIM anda sudah ada di sistem, anda tidak dapat melakukan presensi keterlambatan lebih dari satu kali terimakasih</p>
                `
            });
            return; // Membatalkan pengiriman jika NIM sudah terdaftar
        }

        // Melanjutkan pengiriman presensi terlambat
        await saveLatePresence(form);

        // Close the loading spinner and show success after a small delay
        setTimeout(() => {
            Swal.close(); // Close the loading spinner
            // Show success alert after the spinner is closed
            Swal.fire({
                icon:'success',
                html: `
                    <h2 class="font-bold text-green-500 mb-2">Terkirim !</h2>
                    <h2 class="font-bold text-green-500 mb-2">Next time jangan telat lagi ya dek ya</h2>
                `,
                confirmButtonColor: '#16a34a',
                showConfirmButton: true, // Optional: Display confirm button
                confirmButtonText: 'OK', // Optional: Customize confirm button text
            });
        }, 1000);
        form.reset();

    } catch (error) {
        console.error('Error submitting late presence:', error);
        Swal.close(); // Ensure the spinner is closed on error
        Swal.fire('Error', 'Gagal menyimpan presensi terlambat', 'error');
    }
}


// Fungsi untuk mengecek apakah NIM sudah ada di database presensi-late
async function checkLatePresenceStatus(nim) {
    try {
        // Pastikan database sudah terinisialisasi
        if (!database) {
            throw new Error('Database belum terinisialisasi');
        }

        // Mengakses data presensi terlambat berdasarkan NIM
        const latePresenceRef = ref(database, `presensi-late/${nim}`);
        const snapshot = await get(latePresenceRef);

        // Mengembalikan true jika NIM sudah terdaftar
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking late presence status:', error);
        Swal.fire('Error', 'Gagal memeriksa status presensi terlambat', 'error');
        return false;
    }
}
// Helper functions
async function getLocation() {
    if (!navigator.geolocation) {
        throw new Error('Browser tidak mendukung geolokasi');
    }

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

// Modified determineAttendanceStatus to use location from database
async function determineAttendanceStatus(position) {
    try {
        const locationRef = ref(database, 'location');
        const locationSnapshot = await get(locationRef);
        
        if (!locationSnapshot.exists()) {
            throw new Error('Lokasi presensi belum diatur');
        }

        const locationData = locationSnapshot.val();
        const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            locationData.latitude,
            locationData.longitude
        );

        return {
            status: distance <= 0.5 ? 'Hadir' : 'Tidak Hadir',
            distance: distance,
            locationValid: distance <= 0.5
        };
    } catch (error) {
        console.error('Error getting location data:', error);
        throw error;
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI/180);
}

async function saveActivePresence(form, position, attendanceStatus) {
    const formData = {
        nama: form.querySelector('#nama').value,
        nim: form.querySelector('#nim').value,
        semester: form.querySelector('#semester').value,
        prodi: form.querySelector('#prodi').value,
        sie: form.querySelector('#sie').value,
        timestamp: new Date().getTime(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        status: attendanceStatus.status,
        jarakDariLokasi: `${attendanceStatus.distance.toFixed(2)} km`
    };

    await set(ref(database, `presensi-active/${formData.nim}`), formData);
}

async function saveLatePresence(form) {
    const formData = {
        nama: form.querySelector('#nama-late').value,
        nim: form.querySelector('#nim-late').value,
        semester: form.querySelector('#semester-late').value,
        prodi: form.querySelector('#prodi-late').value,
        sie: form.querySelector('#sie-late').value,
        alasan: form.querySelector('#message-late').value,
        timestamp: new Date().getTime(),
        status: 'Terlambat'
    };

    await set(ref(database, `presensi-late/${formData.nim}`), formData);
}

function handleSubmissionError(error) {
    Swal.close(); // Ensure the spinner is closed on error

    console.error('Error submitting presence:', error);
    if (error.code === 1) {
        Swal.fire({
            html:`
                <div class="flex justify-center">
                 <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
                 </div>
                 <h2 class="font-bold text-red-500 mb-2">Sending Access Denied !</h2>
                 <p class="font-normal text-gray-700">Allow location access untuk melanjutkan presensi terimakasih !</p>
            `,
            showConfirmButton: false, // Optional: Display confirm button
        });
    } else {
        Swal.fire('Error', 'Terjadi kesalahan saat memproses presensi', 'error');
    }
}

// Initialize system when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSystem);