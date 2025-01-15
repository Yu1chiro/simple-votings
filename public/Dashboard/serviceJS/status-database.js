import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase, ref, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Global variables
let firebaseDatabase = null;
let combinedData = [];

async function initializeFirebase() {
    try {
        const response = await fetch('/firebase-config');
        if (!response.ok) throw new Error('Failed to load Firebase config');
        const firebaseConfig = await response.json();

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const database = getDatabase(app);
        
        // Set the global database reference
        firebaseDatabase = database;
        
        // Start monitoring database size
        await monitorDatabaseSize(database);
        
        return database;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        throw error;
    }
}

async function monitorDatabaseSize(database) {
    if (!database) {
        throw new Error('Database reference is not initialized');
    }

    const rootRef = ref(database, '/');
    
    onValue(rootRef, async (snapshot) => {
        try {
            const dataSize = JSON.stringify(snapshot.val()).length;
            const dataSizeInMB = dataSize / (1024 * 1024);
            const maxSize = 50;
            const usagePercentage = (dataSizeInMB / maxSize) * 100;

            updateDatabaseStatusUI(dataSizeInMB, usagePercentage);

            if (usagePercentage >= 90) {
                await showDatabaseWarning();
            }
        } catch (error) {
            console.error('Error monitoring database size:', error);
            throw new Error('Gagal memantau ukuran database');
        }
    });
}

function updateDatabaseStatusUI(size, percentage) {
    const statusContainer = document.getElementById('status-database');
    
    if (!statusContainer) {
        console.error('Container dengan ID "status-database" tidak ditemukan');
        return;
    }
    
    const statusHTML = `
        <div class="bg-white rounded-lg shadow-lg p-4">
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-semibold text-gray-800">Status Database</h3>
                <span class="px-2 py-1 rounded-full text-sm ${
                    percentage >= 90 ? 'bg-red-100 text-red-800' :
                    percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                }">
                    ${percentage >= 90 ? 'Kritis' :
                      percentage >= 70 ? 'Perhatian' :
                      'Normal'}
                </span>
            </div>
            <div class="space-y-2">
                <div>
                    <div class="flex justify-between mb-1">
                        <span class="text-sm text-gray-600">Penggunaan Storage</span>
                        <span class="text-sm font-medium">${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full ${
                            percentage >= 90 ? 'bg-red-500' :
                            percentage >= 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                        }" style="width: ${percentage}%"></div>
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

async function showDatabaseWarning() {
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

// Initialize Firebase when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeFirebase();
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
    }
});

export { initializeFirebase, monitorDatabaseSize };