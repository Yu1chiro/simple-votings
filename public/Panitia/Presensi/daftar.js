import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase, ref, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

let combinedData = [];
let firebaseDatabase;

async function initializeFirebase() {
    try {
      // Mengambil konfigurasi Firebase dari endpoint /firebase-config
      const response = await fetch('/firebase-config');
      if (!response.ok) throw new Error('Failed to load Firebase config');
      const firebaseConfig = await response.json();
  
      // Inisialisasi Firebase dengan config yang didapat
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const database = getDatabase(app); 
      
      firebaseDatabase = database;
      
      // Menjalankan listener realtime
      initializeRealTimeListeners(database);
  
      return { app, auth, database };
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      // Tampilkan pesan error menggunakan SweetAlert
      Swal.fire({
        icon: 'error', 
        title: 'Error',
        text: 'Gagal menginisialisasi Firebase. Mohon periksa konfigurasi Anda.'
      });
    }
  }
  function initializeRealTimeListeners(database) {
    // Membuat referensi ke node presensi-active dan presensi-late
    const activeRef = ref(database, 'presensi-active');
    const lateRef = ref(database, 'presensi-late');
  
    // Listener untuk data aktif
    onValue(activeRef, (activeSnapshot) => {
      const activeData = activeSnapshot.val() || {};
      
      // Nested listener untuk data terlambat 
      onValue(lateRef, (lateSnapshot) => {
        const lateData = lateSnapshot.val() || {};
        
        // Gabungkan data aktif dan terlambat
        combinedData = [...Object.values(activeData), ...Object.values(lateData)];
        
        // Render tabel dengan data yang digabung
        renderTable(combinedData, database);
      });
    });
  }
  
  function renderTable(data, database) {
    const tableBody = document.getElementById('daftar-presensi');
    tableBody.innerHTML = '';
  
    data.forEach((item) => {
      // Set warna status
      const statusColor =
        item.status === 'Terlambat' ? 'text-yellow-500' :
        item.status === 'Hadir' ? 'text-green-500' :
        item.status === 'Tidak Hadir' ? 'text-red-500' : 
        'text-gray-500';
        const icon = 
        item.status === 'Terlambat' ? '🕒' :
        item.status === 'Hadir' ? '✓' :
        item.status === 'Tidak Hadir' ? '✗ ' : 
        'text-gray-500';
      // Format timestamp
      let formattedTimestamp = '-';
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        formattedTimestamp = date.toLocaleString();
      }
  
      // Buat baris tabel
      const row = `
        <tr>
          <td class="text-center text-sm py-3 px-4">${formattedTimestamp}</td>
          <td class="text-center py-3 px-4">${item.nama || '-'}</td>
          <td class="text-center py-3 px-4">${item.nim || '-'}</td>
          <td class="text-center py-3 px-4">${item.prodi || '-'}</td>
          <td class="text-center py-3 px-4">${item.semester || '-'}</td>
          <td class="text-center font-semibold py-3 px-4 ${statusColor}">${item.status || '-'} ${icon}</td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  }


initializeFirebase();