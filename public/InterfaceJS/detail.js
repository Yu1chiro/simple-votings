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
        <div class="bg-gradient-to-r from-[#0a387f] to-[#1C1678] animate-card rounded-xl p-4 shadow-lg">
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
            <button id="vote-button" class="bg-gradient-to-r from-[#3b82f6] to-[#16A34A] font-custom animate-gradient-bg mt-3 text-[#FAFAFA] font-normal  px-6 py-3 rounded-lg shadow-md hover:bg-green-700 hover:text-[#FAFAFA] transition">
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
                    const validateUndekshaEmail = (emailUndiksha) => {
                      const undekshaEmailPattern = /@student\.undiksha\.ac\.id$/;
                      return undekshaEmailPattern.test(emailUndiksha);
                  };
                  
                    const validateNIMFormat = (nim) => {
                      // Check if NIM is exactly 10 digits
                      if (!/^\d{10}$/.test(nim)) {
                          return {
                              isValid: false,
                              message: 'NIM harus terdiri dari 10 digit angka!'
                          };
                      }
                  
                      // Extract parts of the NIM
                      const yearCode = nim.substring(0, 3);    // First 3 digits (221/231/241)
                      const majorCode = nim.substring(3, 6);   // Middle 3 digits (206/202/201)
                  
                      // Validate year code
                      const validYearCodes = ['221', '231', '241'];
                      if (!validYearCodes.includes(yearCode)) {
                          return {
                              isValid: false,
                              message: 'Format tahun pada NIM tidak valid! (221/231/241)'
                          };
                      }
                  
                      // Validate major code
                      const validMajorCodes = ['206', '202', '201'];
                      if (!validMajorCodes.includes(majorCode)) {
                          return {
                              isValid: false,
                              message: 'Kode jurusan pada NIM tidak valid! (206/202/201)'
                          };
                      }
                  
                      return {
                          isValid: true,
                          message: 'NIM valid'
                      };
                  };

        if (!nimToCheck) {
        const { value: nimInput } = await Swal.fire({
        html: `
        <div class="flex justify-center">
        <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
        </div>
        <h2 class="font-semibold">Masukkan NIM :</h2>
        `,
        input: 'number',
        inputPlaceholder: 'NIM Mahasiswa',
        showCancelButton: true,
        confirmButtonText: 'Verifikasi',
        confirmButtonColor: '#16a34a',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
            if (!value) {
                return 'NIM tidak boleh kosong!';
            }
            const validation = validateNIMFormat(value);
            if (!validation.isValid) {
                return validation.message;
            }
        }
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
            <h2 class="font-semibold text-green-500">System checking your NIM</h2>
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
        // Fungsi compressed 
        async function compressPDF(file) {
          try {
            // Convert File to ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Load PDF document
            let pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            // First compression pass with standard settings
            let compressedPdfBytes = await pdfDoc.save({
              useObjectStreams: true,
              addDefaultPage: false,
              preserveEditability: false,
              updateFieldAppearances: false
            });
            
            // Check if file is still too large (> 100KB)
            if (compressedPdfBytes.length > 100 * 1024) {
              // Load the first compressed version
              pdfDoc = await PDFLib.PDFDocument.load(compressedPdfBytes);
              
              // Second compression pass with more aggressive settings
              compressedPdfBytes = await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                preserveEditability: false,
                updateFieldAppearances: false,
                objectsPerTick: 50,
                compress: true
              });
            }
            
            // Convert compressed bytes back to File object
            const compressedFile = new File(
              [compressedPdfBytes], 
              file.name, 
              { type: 'application/pdf' }
            );
            
            return compressedFile;
          } catch (error) {
            throw new Error('Gagal mengkompresi PDF: ' + error.message);
          }
        }
        async function checkDatabaseSize(database) {
          try {
              const rootRef = ref(database, '/');
              const snapshot = await get(rootRef);
              
              // Konversi data ke string JSON untuk estimasi ukuran
              const dataSize = JSON.stringify(snapshot.val()).length;
              
              // Konversi ke MB (1 MB = 1024 * 1024 bytes)
              const dataSizeInMB = dataSize / (1024 * 1024);
              
              // Batas maksimum database (50MB untuk free plan)
              const maxSize = 50;
              
              // Jika ukuran database sudah mencapai 90% dari batas
              if (dataSizeInMB >= (maxSize * 0.9)) {
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
                  return false;
              }
              return true;
          } catch (error) {
              console.error('Error checking database size:', error);
              throw new Error('Gagal memeriksa kapasitas database');
          }
      }
      
               
      const { value: formData } = await Swal.fire({
        title: `<p class="text-lg font-semibold">Vote ${kandidat.name}</p>`,
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
                <label for="nim" class="block text-start text-lg font-medium text-gray-700">Nim Mahasiswa</label>
                <input
                    id="nim"
                    type="text"
                    value="${nimToCheck}"
                    readonly
                    class="mt-2 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 text-lg p-3 focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>
    
            <div class="mb-6">
                <label for="email-undiksha" class="block text-start text-lg font-medium text-gray-700">Email</label>
                <input
                    id="email-undiksha"
                    type="email"
                    class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg p-3"
                    placeholder="Masukkan email student undiksha"
                />
            </div>
    
            <div class="mb-6">
                <label for="semester" class="block text-start text-lg font-medium text-gray-700">Semester</label>
                <select
                    id="semester"
                    class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg p-3"
                >
                    <option value="">Pilih Semester</option>
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 7">Semester 7</option>
                </select>
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
                <label for="thumbnail" class="block text-start text-lg font-medium text-gray-700">Upload KHS/KRS</label>
                <input
                    id="thumbnail"
                    type="file"
                    accept="application/pdf"
                    class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg p-3"
                />
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Kirim Vote Anda',
        cancelButtonText: 'Batal',
        customClass: {
            confirmButton: 'bg-blue-500'
        },
        preConfirm: async () => {
            try {
                Swal.showLoading();
                
                const database = getDatabase();
                const isDatabaseAvailable = await checkDatabaseSize(database);
                
                if (!isDatabaseAvailable) {
                    return false;
                }
    
                const nama = document.getElementById('nama').value;
                const emailUndiksha = document.getElementById('email-undiksha').value;
                const semester = document.getElementById('semester').value;
                const prodi = document.getElementById('prodi').value;
                const thumbnailInput = document.getElementById('thumbnail').files[0];
    
                if (!nama || !emailUndiksha || !semester || !prodi || !thumbnailInput) {
                    Swal.showValidationMessage('Harap isi semua field yang diperlukan!');
                    return false;
                }
    
                if (!validateUndekshaEmail(emailUndiksha)) {
                    Swal.showValidationMessage('Email harus menggunakan domain @student.undiksha.ac.id');
                    return false;
                }
    
                if (!thumbnailInput.type.includes('pdf')) {
                    Swal.showValidationMessage('File harus berformat PDF!');
                    return false;
                }
    
                let finalFile = thumbnailInput;
                
                if (thumbnailInput.size > 60 * 1024) {
                    try {
                        Swal.showLoading();
                        Swal.getConfirmButton().disabled = true;
                        
                        finalFile = await compressPDF(thumbnailInput);
                        
                        if (finalFile.size > 60 * 1024) {
                            const originalSize = (thumbnailInput.size / 1024).toFixed(2);
                            Swal.fire({
                                html: `
                                    <div class="flex justify-center">
                                        <img src="/img/logo.webp" style="width: 60px; height: 60px;" alt="Loading" class="mb-3 h-auto">
                                    </div>
                                    <h2 class="font-bold text-red-500">Pengiriman Ditolak! PDF Anda Terlalu Besar</h2>
                                    <p class="text-lg">Ukuran PDF Anda: <strong>${originalSize} KB</strong></p>
                                    <p class="text-lg">Batas maksimal untuk upload KHS adalah: <strong>60 KB</strong></p>
                                    <p class="text-lg mb-3">Silakan kompres PDF Anda: </p>
                                    <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" class="text-white text-sm font-semibold rounded-lg shadow-lg bg-green-500 px-2 py-2">Kompres PDF</a>
                                `,
                                confirmButtonText: 'Tutup',
                                confirmButtonColor: '#3b82f6',
                                background: '#f9fafb',
                                customClass: {
                                    title: 'text-xl font-semibold text-red-600',
                                    content: 'text-sm text-gray-700'
                                }
                            });
                            return false;
                        }
                    } catch (error) {
                        Swal.showValidationMessage('Gagal mengkompresi file: ' + error.message);
                        return false;
                    } finally {
                        Swal.hideLoading();
                        Swal.getConfirmButton().disabled = false;
                    }
                }
    
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve({
                            nama,
                            nim: nimToCheck,
                            emailUndiksha,
                            semester,
                            prodi,
                            thumbnail: reader.result
                        });
                    };
                    reader.readAsDataURL(finalFile);
                });
            } catch (error) {
                Swal.showValidationMessage('Terjadi kesalahan: ' + error.message);
                return false;
            }
        }
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
        
                const { nama, nim, emailUndiksha, semester, prodi, thumbnail } = formData;
                const newVoteRef = ref(database, `votes/${nim}`);
                const candidateName = kandidat.name;
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
                    emailUndiksha,
                    Namecandidate: candidateName,
                    status: 'vote ✓',
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
                                        
                                        <p style="color: #333; font-weight: bold;">Nim:</p>
                                        <p style="color: #333;">${nim}</p>
                                        <p style="color: #333; font-weight: bold;">Email:</p>
                                        <p style="color: #333;">${emailUndiksha}</p>
                    
                                        <p style="color: #333; font-weight: bold;">Semester:</p>
                                        <p style="color: #333;">${semester}</p>
                                        
                                        <p style="color: #333; font-weight: bold;">Prodi:</p>
                                        <p style="color: #333;">${prodi}</p>
                    
                                        <p style="color: #333; font-weight: bold;">Paslon:</p>
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