import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase, ref, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

let combinedData = [];
let firebaseDatabase;

async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    if (!response.ok) throw new Error('Failed to load Firebase config');
    const firebaseConfig = await response.json();

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);
    
    firebaseDatabase = database;
    
    initializeRealTimeListeners(database);

    return { app, auth, database };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Gagal menginisialisasi Firebase. Mohon periksa konfigurasi Anda.'
    });
  }
}

function initializeRealTimeListeners(database) {
  const activeRef = ref(database, 'presensi-active');
  const lateRef = ref(database, 'presensi-late');

  onValue(activeRef, (activeSnapshot) => {
    const activeData = activeSnapshot.val() || {};
    
    onValue(lateRef, (lateSnapshot) => {
      const lateData = lateSnapshot.val() || {};
      
      combinedData = [...Object.values(activeData), ...Object.values(lateData)];
      
      renderTable(combinedData, database);
    }, (error) => {
      console.error('Error fetching late data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data terlambat dari Firebase.'
      });
    });
  }, (error) => {
    console.error('Error fetching active data:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Gagal memuat data aktif dari Firebase.'
    });
  });

  document.getElementById('download').addEventListener('click', () => {
    downloadExcel(combinedData);
  });
}

function renderTable(data, database) {
  const tableBody = document.getElementById('student-table');
  tableBody.innerHTML = '';

  data.forEach((item) => {
    const statusColor =
      item.status === 'Terlambat'
        ? 'text-red-500'
        : item.status === 'Hadir'
        ? 'text-green-500' 
        : item.status === 'Tidak Hadir'
        ? 'text-red-500' 
        : 'text-gray-500'; 

    const locationLink =
      item.latitude && item.longitude
        ? `<a href="https://www.google.com/maps?q=${item.latitude},${item.longitude}" target="_blank" class="text-blue-500 underline">Lihat Lokasi</a>`
        : '-';
        let formattedTimestamp = '-';
    if (item.timestamp) {
      const date = new Date(item.timestamp); // Langsung membuat objek Date dari timestamp
      formattedTimestamp = date.toLocaleString(); // Format tanggal dan waktu berdasarkan lokal
    }
    const row = `
      <tr>
        <td class="text-center py-3 px-4">${formattedTimestamp}</td>
        <td class="text-center py-3 px-4">${item.nama || '-'}</td>
        <td class="text-center py-3 px-4">${item.nim || '-'}</td>
        <td class="text-center py-3 px-4">${item.semester || '-'}</td>
        <td class="text-center py-3 px-4">${item.prodi || '-'}</td>
        <td class="text-center py-3 px-4 ${statusColor}">${item.status || '-'}</td>
        <td class="text-center py-3 px-4">${locationLink}</td>
        <td class="text-center py-3 px-4">
          <button class="text-white bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-semibold rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2" onclick="viewDetail('${item.nim}')">Detail</button>
          <button class="text-white bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-semibold rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2" onclick="removeIndividualData('${item.nim}')">Delete</button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

async function removeIndividualData(nim) {
  if (!firebaseDatabase) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Database belum terinisialisasi.'
    });
    return;
  }

  const userData = combinedData.find(item => item.nim === nim);
  const name = userData ? userData.nama : 'error data nama tidak ditemukan';

  const result = await Swal.fire({
    title: 'Konfirmasi Hapus',
    html: `
    <p class="text-lg">Apakah ingin menghapus data <span class="text-red-500"> ${name}? </span></p>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Hapus',
    cancelButtonText: 'Batal'
  });

  if (result.isConfirmed) {
    try {
      const activeRef = ref(firebaseDatabase, 'presensi-active');
      const lateRef = ref(firebaseDatabase, 'presensi-late');

      const [activeSnapshot, lateSnapshot] = await Promise.all([
        get(activeRef),
        get(lateRef)
      ]);

      const activeData = activeSnapshot.val() || {};
      const lateData = lateSnapshot.val() || {};

      let dataPath = '';
      let dataKey = '';

      Object.entries(activeData).forEach(([key, value]) => {
        if (value.nim === nim) {
          dataPath = 'presensi-active';
          dataKey = key;
        }
      });

      if (!dataKey) {
        Object.entries(lateData).forEach(([key, value]) => {
          if (value.nim === nim) {
            dataPath = 'presensi-late';
            dataKey = key;
          }
        });
      }

      if (dataKey) {
        const deleteRef = ref(firebaseDatabase, `${dataPath}/${dataKey}`);
        await remove(deleteRef);

        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Data berhasil dihapus'
        });
      } else {
        throw new Error('Data tidak ditemukan');
      }
    } catch (error) {
      console.error('Error removing individual data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal menghapus data. Silakan coba lagi.'
      });
    }
  }
}

window.removeIndividualData = removeIndividualData;

window.viewDetail = function(nim) {
  const studentData = combinedData.find(item => item.nim === nim);

  if (studentData) {
    Swal.fire({
      html: `
        <p class="text-lg"><strong>Nama:</strong> ${studentData.nama}</p>
        <p class="text-lg"><strong>NIM:</strong> ${studentData.nim}</p>
        <p class="text-lg"><strong>Semester:</strong> ${studentData.semester}</p>
        <p class="text-lg"><strong>Prodi:</strong> ${studentData.prodi}</p>
        <p class="text-lg"><strong>Sie:</strong> ${studentData.sie}</p>
        <p class="text-lg"><strong>Status:</strong> ${studentData.status || '-'}</p>
        <p class="text-lg"><strong>Alasan mahasiswa:</strong> ${studentData.alasan || '-'}</p>
      `,
      showConfirmButton: true,
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Data Tidak Ditemukan',
      text: 'Tidak ada data dengan NIM tersebut.'
    });
  }
};
  
async function removeAllData() {
  if (!firebaseDatabase) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Database belum terinisialisasi.'
    });
    return;
  }

  const result = await Swal.fire({
    title: 'Apakah Anda yakin?',
    text: "Semua data presensi akan terhapus permanen!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  });

  if (result.isConfirmed) {
    try {
      const activeRef = ref(firebaseDatabase, 'presensi-active/');
      const lateRef = ref(firebaseDatabase, 'presensi-late/');

      await Promise.all([remove(activeRef), remove(lateRef)]);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Semua data presensi telah dihapus.'
      });
    } catch (error) {
      console.error('Error saat menghapus data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal menghapus data. Silakan coba lagi.'
      });
    }
  }
}
function downloadExcel(data) {
    const filteredData = data.map(item => {
      let formattedTimestamp = '-';
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        formattedTimestamp = date.toLocaleString();
      }
      
      return {
        TIME: formattedTimestamp || '-',
        NAMA: item.nama || '-',
        NIM: item.nim || '-',
        SEMESTER: item.semester || '-',
        PRODI: item.prodi || '-',
        SIE: item.sie || '-',
        STATUS: item.status || 'Status Error',
        ALASAN: item.alasan || 'Alasan Tidak Disertakan',
      };
    });
  
    const ws = XLSX.utils.json_to_sheet(filteredData);
    
    // Define the styles
    const styles = {
      hadir: { fill: { fgColor: { rgb: "90EE90" } } }, // Light green
      terlambat: { fill: { fgColor: { rgb: "FFB6C1" } } }, // Light red
      tidakHadir: { fill: { fgColor: { rgb: "FFB6C1" } } } // Light red
    };
  
    // Apply styles to cells
    filteredData.forEach((row, idx) => {
      const rowIndex = idx + 1; // Add 1 to skip header row
      const status = row.STATUS;
      
      // Get the appropriate style based on status
      let style = null;
      if (status === 'Hadir') {
        style = styles.hadir;
      } else if (status === 'Terlambat' || status === 'Tidak Hadir') {
        style = styles.terlambat;
      }
  
      // If we have a style to apply
      if (style) {
        // Apply to all cells in the row
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({ r: rowIndex, c: C });
          if (!ws[addr]) ws[addr] = { t: 's', v: '' };
          ws[addr].s = style;
        }
      }
    });
  
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // TIME
      { wch: 15 }, // NAMA
      { wch: 12 }, // NIM
      { wch: 10 }, // SEMESTER
      { wch: 25 }, // PRODI
      { wch: 15 }, // SIE
      { wch: 12 }, // STATUS
      { wch: 25 }  // ALASAN
    ];
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Presensi");
    
    // Write file with properties to ensure styles are preserved
    XLSX.writeFile(wb, "Presensi_Pemira_2024.xlsx", { 
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary',
      cellStyles: true
    });
  }
  
document.getElementById('remove-all-data').addEventListener('click', removeAllData);

initializeFirebase();