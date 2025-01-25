  // Fungsi untuk membuka modal
  document.getElementById('laporkan').addEventListener('click', function() {
      document.getElementById('modal').classList.remove('hidden');
  });

  // Fungsi untuk menutup modal
  document.getElementById('batalkan').addEventListener('click', function() {
      document.getElementById('modal').classList.add('hidden');
  });

  // Fungsi untuk mengirim laporan ke WhatsApp
// Fungsi untuk mengirim laporan ke WhatsApp
document.getElementById('laporanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Ambil data dari form
    const nama = document.getElementById('nama').value;
    const nim = document.getElementById('nim').value;
    const semester = document.getElementById('semester').value;
    const prodi = document.getElementById('prodi').value;
    const narahubung = document.getElementById('narahubung').value;
    const laporan = document.getElementById('laporan').value;

    const now = new Date();
    const timestamp = now.getFullYear() + "-" +
                      String(now.getMonth() + 1).padStart(2, '0') + "-" +
                      String(now.getDate()).padStart(2, '0') + " " +
                      String(now.getHours()).padStart(2, '0') + ":" +
                      String(now.getMinutes()).padStart(2, '0') + ":" +
                      String(now.getSeconds()).padStart(2, '0');

    // Buat pesan WhatsApp dengan template literal
    const pesanWA = `
Laporan Kendala E-voting Pemira 2025 👤:

Nama: ${nama}

NIM: ${nim}

Semester: ${semester}

Program Studi: ${prodi}

📝Laporan: 
[${laporan}]

Waktu Laporan: ${timestamp}`;


    // Encode pesan untuk URL
    const encodedPesan = encodeURIComponent(pesanWA);

    // Buka WhatsApp dengan nomor dan pesan
    window.open(`https://wa.me/${narahubung}?text=${encodedPesan}`, '_blank');

    // Reset dan tutup modal
    this.reset();
    document.getElementById('modal').classList.add('hidden');
});