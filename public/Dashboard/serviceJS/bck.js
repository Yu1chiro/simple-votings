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

    if (openPresensiButton) {
        openPresensiButton.addEventListener('click', handleOpenPresensi);
    }

    if (formPresensiActive) {
        formPresensiActive.addEventListener('submit', handleActiveSubmission);
    }

    if (formPresensiLate) {
        formPresensiLate.addEventListener('submit', handleLateSubmission);
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

// Update countdown display
function updateCountdown(timeData) {
    let countdownElement = document.getElementById('countdown');
    const headerElement = document.querySelector('h2');

    if (!countdownElement && headerElement) {
        countdownElement = document.createElement('div');
        countdownElement.id = 'countdown';
        countdownElement.className = 'text-center text-lg font-bold mt-2';
        headerElement.after(countdownElement);
    }

    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const endTime = timeData.endTime;
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            if (countdownElement) {
                countdownElement.textContent = 'Waktu presensi telah berakhir';
            }
            updateModalVisibility({ status: 'expired' });
            return;
        }

        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (countdownElement) {
            countdownElement.textContent = `Sisa waktu: ${hours}:${minutes}:${seconds}`;
        }
    }, 1000);
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
        title: 'Setting Waktu Presensi',
        html: `
            <input id="start-time" class="swal2-input" type="datetime-local">
            <input id="end-time" class="swal2-input" type="datetime-local">
        `,
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
            
            Swal.fire('Berhasil', 'Waktu presensi telah diatur', 'success');
        } catch (error) {
            console.error('Error setting time:', error);
            Swal.fire('Error', 'Gagal menyimpan pengaturan waktu', 'error');
        }
    }
}

// Handle active presence submission
async function handleActiveSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const nim = form.querySelector('#nim').value;

    try {
        // Check for existing submission
        const nimRef = ref(database, `presensi-active/${nim}`);
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
                title: 'Peringatan Lokasi',
                text: `Anda berada di luar area presensi (${attendanceStatus.distance.toFixed(2)} km dari lokasi). Data akan tercatat sebagai 'Tidak Hadir'. Lanjutkan?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, Lanjutkan',
                cancelButtonText: 'Batal'
            });

            if (!confirmSubmit.isConfirmed) return;
        }

        // Save data
        await saveActivePresence(form, position, attendanceStatus);
        
        Swal.fire('Berhasil', `Presensi berhasil disimpan dengan status: ${attendanceStatus.status}`, 'success');
        form.reset();

    } catch (error) {
        handleSubmissionError(error);
    }
}

// Handle late presence submission
async function handleLateSubmission(e) {
    e.preventDefault();
    const form = e.target;

    try {
        await saveLatePresence(form);
        Swal.fire('Berhasil', 'Presensi terlambat berhasil disimpan', 'success');
        form.reset();
    } catch (error) {
        console.error('Error submitting late presence:', error);
        Swal.fire('Error', 'Gagal menyimpan presensi terlambat', 'error');
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

async function determineAttendanceStatus(position) {
    const targetLat = -8.099219; // Sesuaikan dengan lokasi yang diinginkan
    const targetLng = 115.107613; // Sesuaikan dengan lokasi yang diinginkan
    
    const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        targetLat,
        targetLng
    );

    return {
        status: distance <= 0.5 ? 'Hadir' : 'Tidak Hadir',
        distance: distance,
        locationValid: distance <= 0.5
    };
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
    console.error('Error submitting presence:', error);
    if (error.code === 1) {
        Swal.fire('Error', 'Mohon izinkan akses lokasi untuk melakukan presensi', 'error');
    } else {
        Swal.fire('Error', 'Terjadi kesalahan saat memproses presensi', 'error');
    }
}

// Initialize system when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSystem);