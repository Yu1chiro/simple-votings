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
        <div class="bg-[linear-gradient(120deg,#0A3981_64%,#020C1B_100%)] rounded-xl p-4 shadow-lg">
          <div class="bg-blue-100 rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
              <img src="/img/undiksha.png" width="50px" height="auto" alt="">
              <div class="flex space-x-2">
                <img src="/img/logo.webp" width="50px" height="auto" alt="">
              </div>
            </div>
            <div class="bg-gray-200 rounded-lg mb-4">
              <img src="${kandidat.thumbnail}" alt="${kandidat.name}" class="h-full w-auto object-cover rounded-lg">
            </div>
          </div>
          <div class="flex justify-center">
            <button id="vote-button" class="bg-blue-700 mt-3 text-[#FAFAFA] font-semibold  px-6 py-3 rounded-lg shadow-md hover:bg-green-700 hover:text-[#FAFAFA] transition">
              <img src="/img/note-ico.png" class="rounded-lg inline-block" width="25px" height="auto" alt="">
              Vote Now
            </button>
          </div>
        </div>
        <div class="bg-blue-900 text-white p-6 rounded-xl">
          <div class="space-y-4 text-start">
            ${kandidat.description}
          </div>
        </div>
      </div>
    `;

    document.getElementById('vote-button').addEventListener('click', async () => {
        const database = getDatabase();
        
        // Tampilkan modal loading saat memulai pengecekan
        Swal.fire({
            html: `
            <div class="flex justify-center">
            <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
            </div>
            <h2 class="font-semibold text-green-500">Security checking...</h2>
          `,
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
        
            return snapshot.exists(); 
        };
        
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Ambil NIM dari localStorage
        const nimLocal = localStorage.getItem('nim');
        let nimToCheck = nimLocal;
         // Fungsi untuk validasi NIM
                    const validateNIM = (nim) => {
                        const nimPattern = /^\d{10}$/;
                        return nimPattern.test(nim);
                    };



        if (!nimToCheck) {
        const { value: nimInput } = await Swal.fire({
            html: `
            <div class="flex justify-center">
            <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
            </div>
            <h2 class="font-semibold">Silahkan Masukkan NIM :</h2>
            `,
            input: 'number',
            inputPlaceholder: 'Masukkan NIM Anda',
            showCancelButton: true,
            confirmButtonText: 'Submit',
            confirmButtonColor: '#16a34a',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value) {
                    return 'NIM tidak boleh kosong!';
                }
                if (!validateNIM(value)) {
                    return 'NIM harus terdiri dari 10 digit angka!';
                }
            },
        });
        
            if (!nimInput) {
            Swal.close();
            return;
            }
        
            nimToCheck = nimInput;
            
            Swal.fire({
                html: `
            <div class="flex justify-center">
            <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
            </div>
            <h2 class="font-semibold text-green-500">The system is checking your NIM</h2>
          `,
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
                html: `
                <div class="flex justify-center">
                <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
                </div>
                <h2 class="font-semibold">Anda sudah melakukan voting. Terimakasih</h2>
              `,
              confirmButtonColor: '#16a34a',
            });
            return;
        }
            
        // Jika NIM belum melakukan vote, tampilkan form voting
        Swal.close();
        // Fungsi form vote
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
        // fungsi voting
        if (formData) {
            try {
                // Tampilkan Swal Loading sebelum memulai proses
                Swal.fire({
                    html: `
            <div class="flex justify-center">
            <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
            </div>
            <h2 class="font-semibold text-green-500">Processing your voting...</h2>
          `,
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
        
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulasi delay 1 detik
        
                const { nama, nim, semester, prodi, thumbnail } = formData;
                const newVoteRef = ref(database, `votes/${nim}`);
                const candidateName = kandidat.name;
                const candidateThumbnail = kandidat.thumbnail;
                const currentDateTime = new Date().toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
        
                // Simpan data ke Firebase
                await set(newVoteRef, {
                    ...formData,
                    Namecandidate: candidateName,
                    Thumbnail: candidateThumbnail,
                    status: 'vote',
                    datetime: currentDateTime,
                });
        
                localStorage.setItem('nim', nim);
                Swal.close(); // Tutup Swal Loading setelah sukses
        
                // Tampilkan modal sukses dengan rincian data
                Swal.fire({
                    html: `
                            <div class="flex justify-center">
                            <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
                            </div>
                            <h2 class="font-semibold text-green-500">Thankyou for your voting !</h2>
                          `,
                    showCloseButton: true,
                    confirmButtonText: 'Download voting data',
                    confirmButtonColor: '#16a34a',
                }).then((result) => {
                    if (result.isConfirmed) {
                        Swal.fire({
                            html: `
                            <div class="flex justify-center">
                            <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
                            </div>
                            <h2 class="font-semibold text-green-500">Please wait....</h2>
                          `,
                            allowOutsideClick: false,
                            showConfirmButton: false,
                            willOpen: () => {
                              Swal.showLoading();
                            },
                          });

                        // Fungsi mengunduh bukti voting user
                        const container = document.createElement('div');
                        container.style.width = '500px';
                        container.style.position = 'absolute';
                        container.style.left = '-9999px';
                        container.innerHTML = `
                        <div class="bg-transparent" style="width: 500px; border-radius: 16px;">
                            <div style="background-color:#FAFAFA; border-radius: 12px; padding:1rem; margin: 2rem 1rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                    <img src="/img/undiksha.png" width="70px" style="object-fit: contain;">
                                    <img src="/img/logo.webp" width="70px" style="object-fit: contain;">
                                </div>
                                
                                <h2 style="color:#0A3981; font-weight:bold; text-align:center; margin-bottom:20px;">
                                    E-Voting PEMIRA HMJ BAHASA ASING 2024
                                </h2>
                                
                                <div style="margin-bottom: 20px;">
                                    <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 24px; margin-bottom: 4px;">
                                        <p style="color: #333; font-weight: bold;">Nama:</p>
                                        <p style="color: #333;">${nama}</p>
                                        
                                        <p style="color: #333; font-weight: bold;">NIM:</p>
                                        <p style="color: #333;">${nim}</p>
                    
                                        <p style="color: #333; font-weight: bold;">KTM:</p>
                                        <div style="display: flex; align-items: center;">
                                            <img src="${thumbnail}" alt="${thumbnail}" width="70" height="auto" class="rounded-lg object-cover" style="margin-right: 16px; margin-top: 4px; margin-bottom: 4px;">
                                        </div>
                    
                                        <p style="color: #333; font-weight: bold;">Semester:</p>
                                        <p style="color: #333;">${semester}</p>
                                        
                                        <p style="color: #333; font-weight: bold;">Program Studi:</p>
                                        <p style="color: #333;">${prodi}</p>
                    
                                        <p style="color: #333; font-weight: bold;">Voted:</p>
                                        <p style="color: #333; margin-right: 12px;">${candidateName}</p>
                    
                                        <p style="color: #333; font-weight: bold;">Status:</p>
                                        <p class="text-green-500">Vote ✓</p>

                                        <p style="color: #333; font-weight: bold;">Date:</p>
                                        <p class="text-[#333]">${currentDateTime}</p>

                                    </div>
                                </div>
                            </div>
                            <div style="text-align: center; color: white; font-size: 12px; padding: 16px;">
                                <p>Informasi E-VOTING PEMIRA HMJ BAHASA ASING 2024</p>
                                <p>Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    `;
                    

        
                        document.body.appendChild(container);
        
                        html2canvas(container.firstElementChild, {
                            scale: 2,
                            logging: false,
                            useCORS: true,
                            backgroundColor: null,
                            width: 500,
                            height: container.firstElementChild.offsetHeight,
                            windowWidth: 500,
                            windowHeight: container.firstElementChild.offsetHeight
                        }).then(canvas => {
                            document.body.removeChild(container);
        
                            canvas.toBlob(blob => {
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `bukti-voting-${nama}-${nim}.png`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
        
                                // Modifikasi notifikasi sukses dengan pesan penting
                                Swal.fire({
                                    html: `
                                        <div class="text-center">
                                            <div class="bg-green-50 p-4 rounded-lg">
                                            <div class="flex justify-center">
                                                <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
                                                </div>
                                                <p class="text-green-600">Simpan bukti e-voting Anda agar dapat digunakan jika sistem mengalami error/data anda tidak masuk di dalam sistem. terimakasih </p>
                                            </div>
                                        </div>
                                    `,
                                    confirmButtonText: 'Ok',
                                    confirmButtonColor: '#16a34a',
                                    allowOutsideClick: false
                                });
                            }, 'image/png');
                        });
                    }
                });
        
            } catch (error) {
                Swal.close(); // Tutup Swal Loading jika terjadi error
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