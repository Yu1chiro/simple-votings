import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase, ref, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Konstanta untuk monitoring
const MONITORING_CONFIG = {
    MAX_SIZE_MB: 50,
    THROTTLE_MS: 1000,
    WARNING_THRESHOLD: 90,
    ATTENTION_THRESHOLD: 70
};

let lastUpdate = 0;
let firebaseDatabase = null;

// Fungsi untuk menghitung ukuran data
function calculateDatabaseSize(snapshot) {
    try {
        const dataString = JSON.stringify(snapshot.val() || {});
        return dataString.length / (1024 * 1024); // Konversi ke MB
    } catch (error) {
        console.error('Error menghitung ukuran database:', error);
        return 0;
    }
}

async function initializeFirebase() {
    try {
        const response = await fetch('/firebase-config');
        if (!response.ok) throw new Error('Gagal memuat konfigurasi Firebase');
        const firebaseConfig = await response.json();

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const database = getDatabase(app);
        
        firebaseDatabase = database;
        
        await setupDatabaseMonitoring(database);
        
        return database;
    } catch (error) {
        console.error('Error inisialisasi Firebase:', error);
        throw error;
    }
}

async function setupDatabaseMonitoring(database) {
    if (!database) {
        throw new Error('Referensi database belum diinisialisasi');
    }

    const rootRef = ref(database, '/');
    
    onValue(rootRef, async (snapshot) => {
        try {
            const now = Date.now();
            if (now - lastUpdate < MONITORING_CONFIG.THROTTLE_MS) return;
            lastUpdate = now;

            const dataSizeInMB = calculateDatabaseSize(snapshot);
            const usagePercentage = (dataSizeInMB / MONITORING_CONFIG.MAX_SIZE_MB) * 100;

            await updateMonitoringUI(dataSizeInMB, usagePercentage);

            if (usagePercentage >= MONITORING_CONFIG.WARNING_THRESHOLD) {
                await showWarningAlert();
            }
        } catch (error) {
            console.error('Error dalam monitoring database:', error);
            handleMonitoringError(error);
        }
    }, {
        onlyOnce: false // Memastikan monitoring tetap berjalan
    });
}

function updateMonitoringUI(size, percentage) {
    const statusContainer = document.getElementById('status-database');
    if (!statusContainer) {
        console.error('Container status-database tidak ditemukan');
        return;
    }

    const getStatusConfig = (percentage) => {
        if (percentage >= MONITORING_CONFIG.WARNING_THRESHOLD) {
            return { class: 'bg-red-100 text-red-800', text: 'Kritis', barColor: 'bg-red-500' };
        } else if (percentage >= MONITORING_CONFIG.ATTENTION_THRESHOLD) {
            return { class: 'bg-yellow-100 text-yellow-800', text: 'Perhatian', barColor: 'bg-yellow-500' };
        }
        return { class: 'bg-green-100 text-green-800', text: 'Normal', barColor: 'bg-green-500' };
    };

    const status = getStatusConfig(percentage);
    
    const statusHTML = `
        <div class="bg-white rounded-lg shadow-lg p-4">
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-semibold text-gray-800">Status Database</h3>
                <span class="px-2 py-1 rounded-full text-sm ${status.class}">
                    ${status.text}
                </span>
            </div>
            <div class="space-y-2">
                <div>
                    <div class="flex justify-between mb-1">
                        <span class="text-sm text-gray-600">Penggunaan Storage</span>
                        <span class="text-sm font-medium">${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full ${status.barColor} transition-all duration-300" 
                             style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Ukuran Database</span>
                    <span class="text-sm font-medium">${size.toFixed(2)} MB</span>
                </div>
            </div>
        </div>
    `;
    
    statusContainer.innerHTML = statusHTML;
}

async function showWarningAlert() {
    await Swal.fire({
        html: `
            <div class="flex justify-center">
                <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Warning" class="mb-3 h-auto">
            </div>
            <h2 class="font-semibold text-red-500 mb-3">Perhatian!</h2>
            <p class="text-gray-700 mb-4">Sistem voting sedang dalam kapasitas tinggi.</p>
            <p class="text-gray-700 mb-4">Silakan gunakan link alternatif di bawah ini:</p>
            <a href="https://LINK-ALTERNATIF-ANDA"
                class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                target="_blank">
                Menuju Sistem Voting Alternatif
            </a>
        `,
        showConfirmButton: false,
        allowOutsideClick: false
    });
}

function handleMonitoringError(error) {
    console.error('Error dalam monitoring:', error);
    const statusContainer = document.getElementById('status-database');
    if (statusContainer) {
        statusContainer.innerHTML = `
            <div class="bg-red-100 p-4 rounded-lg">
                <p class="text-red-800">Terjadi kesalahan dalam monitoring database. Silakan refresh halaman.</p>
            </div>
        `;
    }
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeFirebase();
    } catch (error) {
        console.error('Gagal menginisialisasi Firebase:', error);
        handleMonitoringError(error);
    }
});

export { initializeFirebase, setupDatabaseMonitoring };