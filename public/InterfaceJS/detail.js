// Inisialisasi Firebase dan pengaturan pengambilan data berbasis URL
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getDatabase, ref, get, set, query, orderByChild, equalTo, } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

async function inisialisasiTampilanKandidat() {
  try {
    // Menambahkan loading state
    const fetchDataContainer = document.getElementById('fetch-data');
    if (fetchDataContainer) {
      fetchDataContainer.innerHTML = `
        <div class="max-w-md mx-auto space-y-4">
          <!-- Loading State -->
          <div class="bg-white rounded-xl p-4 shadow-lg animate-pulse">
            <div class="bg-blue-100 rounded-lg p-4">
              <div class="flex justify-between items-center mb-4">
                <div class="bg-gray-300 h-12 w-12 rounded-full"></div>
                <div class="flex space-x-2">
                  <div class="bg-gray-300 h-12 w-12 rounded-full"></div>
                </div>
              </div>
              <div class="bg-gray-200 rounded-lg mb-4 h-48"></div>
            </div>
            <div class="flex justify-center">
              <button class="w-lg bg-gray-300 text-white font-semibold py-2.5 px-3 rounded-lg mt-4"></button>
            </div>
          </div>
          <div class="bg-blue-900 text-white p-6 rounded-xl">
            <div class="space-y-4">
              <p class="bg-gray-300 h-6 w-3/4 rounded"></p>
            </div>
          </div>
        </div>
      `;
    }

    // Mengambil konfigurasi Firebase
    const response = await fetch('/firebase-config');
    if (!response.ok) throw new Error('Gagal memuat konfigurasi Firebase');
    const firebaseConfig = await response.json();

    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    // Mengambil parameter URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlKandidat = urlParams.get('url');

    if (!urlKandidat) {
      throw new Error('URL kandidat tidak ditemukan');
    }

    // Mengambil data kandidat berdasarkan URL
    const referensiKandidat = ref(database, 'candidates-data');
    const snapshot = await get(referensiKandidat);

    if (!snapshot.exists()) {
      throw new Error('Tidak ada kandidat yang ditemukan');
    }

    // Mencari kandidat dengan URL yang sesuai
    let kandidatDitemukan = null;
    snapshot.forEach((childSnapshot) => {
      const kandidat = childSnapshot.val();
      if (kandidat.url === urlKandidat) {
        kandidatDitemukan = kandidat;
      }
    });

    if (!kandidatDitemukan) {
      throw new Error('Kandidat tidak ditemukan');
    }

    // Memperbarui DOM dengan data kandidat
    perbaruiTampilanKandidat(kandidatDitemukan, database);

  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Gagal memuat data kandidat',
      customClass: {
        popup: 'rounded-lg',
        title: 'text-red-500 font-bold'
      }
    });
  }
}

function perbaruiTampilanKandidat(kandidat, database) {
  const fetchDataContainer = document.getElementById('fetch-data');
  if (fetchDataContainer) {
    fetchDataContainer.innerHTML = `
      <div class="max-w-md mx-auto space-y-4">
        <div class="bg-white rounded-xl p-4 shadow-lg">
          <div class="bg-blue-100 rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
              <img src="/img/undiksha.png" width="50px" height="auto" alt="">
              <div class="flex space-x-2">
                <img src="/img/logo.png" width="50px" height="auto" alt="">
              </div>
            </div>
            <div class="bg-gray-200 rounded-lg mb-4">
              <img src="${kandidat.thumbnail}" alt="${kandidat.name}" class="h-full w-auto object-cover rounded-lg">
            </div>
          </div>
          <div class="flex justify-center">
            <button id="vote-button" class="w-lg bg-green-600 text-white font-semibold py-2.5 px-3 rounded-lg mt-4 hover:bg-blue-700 transition-colors">
              <img src="/img/voting.webp" class="rounded-lg inline-block" width="40px" height="auto" alt="">
              Vote Now
            </button>
          </div>
        </div>
        <div class="bg-blue-900 text-white p-6 rounded-xl">
          <div class="space-y-4 text-justify">
            ${kandidat.description}
          </div>
        </div>
      </div>
    `;

    document.getElementById('vote-button').addEventListener('click', async () => {
        const database = getDatabase();
        
        // Tampilkan modal loading saat memulai pengecekan
        Swal.fire({
          title: 'Memeriksa Status Vote',
          text: 'Mohon tunggu sebentar...',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });
      
        // *********SECURITY CHECK ✅**************
        const checkIfVoted = async (nim) => {
            const votesRef = ref(database, 'votes');
            const nimQuery = query(votesRef, orderByChild('nim'), equalTo(nim));
            const snapshot = await get(nimQuery);
        
            return snapshot.exists(); // Jika ada data, berarti NIM sudah melakukan vote
        };
        
        // Fungsi delay dengan Promise
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Ambil NIM dari localStorage
        const nimLocal = localStorage.getItem('nim');
        let nimToCheck = nimLocal;
        
        if (!nimToCheck) {
            const { value: nimInput } = await Swal.fire({
            title: '<p class="text-xl">Silahkan masukkan NIM anda</p>',
            input: 'text',
            inputPlaceholder: 'Masukkan NIM Anda',
            showCancelButton: true,
            confirmButtonText: 'Submit',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value) return 'NIM tidak boleh kosong!';
            },
            });
        
            if (!nimInput) {
            Swal.close();
            return;
            }
        
            nimToCheck = nimInput;
            
            Swal.fire({
            title: 'Please waiting',
            text: 'The system is checking your NIM',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
            });
        }
        
        // Lakukan pengecekan NIM di database dengan delay
        const isVoted = await checkIfVoted(nimToCheck);
        await delay(2000); 
        
        Swal.close();
        
        if (isVoted) {
            Swal.fire({
            icon: 'info',
            title: 'Anda Sudah Melakukan Voting',
            text: 'Terima kasih, Anda sudah melakukan voting sebelumnya.',
            });
            return;
        }
            
        // Jika NIM belum melakukan vote, tampilkan form voting
        Swal.close();
        const { value: formData } = await Swal.fire({
            title: `<p class="text-lg font-semibold">Vote ${kandidat.name}</p> `,
            html: `
           <div class="mb-6">
        <label for="nama" class="block text-start text-lg font-medium text-gray-700">Nama Lengkap</label>
        <input
        id="nama"
        type="text"
        class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg p-3"
        placeholder="Nama Lengkap"
        />
    </div>

    <div class="mb-6">
        <label for="nim" class="block text-start text-lg font-medium text-gray-700">NIM</label>
        <input
        id="nim"
        type="text"
        value="${nimToCheck}"
        readonly
        class="mt-2 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 text-lg p-3 focus:border-indigo-500 focus:ring-indigo-500"
        />
    </div>

    <div class="mb-6">
        <label for="semester" class="block text-start text-lg font-medium text-gray-700">Semester</label>
        <input
        id="semester"
        type="text"
        class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg p-3"
        placeholder="Semester"
        />
    </div>

    <div class="mb-6">
        <label for="prodi" class="block text-start text-lg font-medium text-gray-700">Program Studi</label>
        <select
        id="prodi"
        class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg p-3"
        >
        <option value="">Pilih Prodi</option>
        <option value="Pendidikan Bahasa Inggris">Pendidikan Bahasa Inggris</option>
        <option value="Pendidikan Bahasa Jepang">Pendidikan Bahasa Jepang</option>
        <option value="Bahasa Inggris untuk Komunikasi Bisnis dan Profesional">Bahasa Inggris untuk Komunikasi Bisnis dan Profesional</option>
        </select>
    </div>

    <div class="mb-6">
        <label for="thumbnail" class="block text-start text-lg font-medium text-gray-700">Upload KTM Mahasiswa</label>
        <input
        id="thumbnail"
        type="file"
        accept="image/*"
        class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg p-3"
        />
    </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Submit',
            cancelButtonText: 'Batal',
            preConfirm: () => {
                const nama = document.getElementById('nama').value;
                const semester = document.getElementById('semester').value;
                const prodi = document.getElementById('prodi').value;
                const thumbnailInput = document.getElementById('thumbnail').files[0];
          
                if (!nama || !semester || !prodi || !thumbnailInput) {
                    Swal.showValidationMessage('Harap isi semua bidang!');
                    return false;
                }
          
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve({
                            nama,
                            nim: nimToCheck,
                            semester,
                            prodi,
                            thumbnail: reader.result,
                        });
                    };
                    reader.readAsDataURL(thumbnailInput);
                });
            },
        });
          
        if (formData) {
            // Tampilkan loading alert sebelum menyimpan data
            Swal.fire({
                title: 'Please wait',
                text: 'processing your voting',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        
            try {
                // Delay 3 detik untuk memberikan efek loading
                await new Promise(resolve => setTimeout(resolve, 1000));
        
                // Simpan data ke database
                const { nama, nim, semester, prodi, thumbnail } = formData;
                const newVoteRef = ref(database, `votes/${nim}`);
                const candidateName = kandidat.name;
                const candidateThumbnail = kandidat.thumbnail;
                
                await set(newVoteRef, {
                    ...formData,
                    Namecandidate: candidateName,
                    Thumbnail: candidateThumbnail
                });
          
                // Simpan NIM ke localStorage
                localStorage.setItem('nim', nim);
        
                // Tutup loading alert
                Swal.close();
          
                // Tampilkan pesan sukses
                Swal.fire({
                    icon: 'success',
                    title: 'Voting Berhasil',
                    text: 'Terima kasih telah melakukan voting.',
                });
          
                // document.getElementById('vote-button').disabled = true;
            } catch (error) {
                // Jika terjadi error, tutup loading dan tampilkan pesan error
                Swal.fire({
                    icon: 'error',
                    title: 'Terjadi Kesalahan',
                    text: 'Mohon maaf, terjadi kesalahan saat memproses data.',
                });
            }
        }
      });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  inisialisasiTampilanKandidat().catch(console.error);
});
