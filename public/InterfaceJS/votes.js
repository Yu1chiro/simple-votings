if (formData) {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { nama, nim, semester, prodi, thumbnail } = formData;
        const newVoteRef = ref(database, `votes/${nim}`);
        const candidateName = kandidat.name;
        const candidateThumbnail = kandidat.thumbnail;
        
        await set(newVoteRef, {
            ...formData,
            Namecandidate: candidateName,
            Thumbnail: candidateThumbnail,
            status: 'vote',
        });
  
        localStorage.setItem('nim', nim);
        Swal.close();

        // Fungsi menampilkan modal informasi vote user
        Swal.fire({
            title: '<p class="text-xl font-bold mb-4">Voting Berhasil!</p>',
            html: `
                <div class="bg-white p-6 rounded-lg shadow-lg">
                
                    <div class="grid grid-cols-2 gap-4 text-left mb-4">
                        <div>
                            <p class="text-lg font-semibold">Nama:</p>
                            <p class="text-lg text-gray-700">${nama}</p>
                        </div>
                        <div>
                            <p class="text-lg font-semibold">NIM:</p>
                            <p class="text-lg text-gray-700">${nim}</p>
                        </div>
                        <div>
                            <p class="text-lg font-semibold">Semester:</p>
                            <p class="text-lg text-gray-700">${semester}</p>
                        </div>
                        <div>
                            <p class="text-lg font-semibold">Program Studi:</p>
                            <p class="text-lg text-gray-700">${prodi}</p>
                        </div>
                        <div>
                            <p class="text-lg font-semibold">Paslon:</p>
                            <p class="text-lg text-gray-700">${candidateName}</p>
                        </div>
                        <div>
                            <p class="text-lg font-semibold">Status:</p>
                            <p class="text-lg text-green-500">Vote ✓</p>
                        </div>
                    </div>
                    <div class="border-t pt-4">
                        <p class="font-semibold">Detail:</p>
                        <div class="flex items-center mt-2">
                            <img src="${candidateThumbnail}" alt="Kandidat"  width="70" height="auto" class="rounded-lg object-cover" style=" margin-right: 12px;">
                            <img src="${thumbnail}" alt="${thumbnail}"  width="70" height="auto" class="rounded-lg object-cover" style=" margin-right: 12px;">
                        </div>
                    </div>
                </div>
            `,
            showCloseButton: true,
            confirmButtonText: 'Unduh Bukti Voting',
            customClass: {
                container: 'max-w-2xl mx-auto',
                popup: 'rounded-xl',
                confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Fungsi mengunduh bukti voting user
                const container = document.createElement('div');
                container.style.width = '500px';
                container.style.position = 'absolute';
                container.style.left = '-9999px';
                container.innerHTML = `
                    <div style="width: 500px; background: linear-gradient(120deg, #0A3981 64%, #020C1B 100%); border-radius: 16px;">
                        <div style="background-color: white; border-radius: 12px; padding: 24px; margin: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <img src="/img/undiksha.png" width="70px" style="object-fit: contain;">
                                <img src="/img/logo.png" width="70px" style="object-fit: contain;">
                            </div>
                            
                            <h2 style="color: #0A3981; font-size: 20px; text-align: center; margin-bottom: 20px; font-weight: bold;">Bukti E-Voting PEMIRA HMJ BAHASA ASING 2024</h2>
                            
                            <div style="margin-bottom: 20px;">
                                <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 24px; margin-bottom: 4px;">
                                    <p style="color: #333; font-weight: bold;">Nama:</p>
                                    <p style="color: #333;">${nama}</p>
                                    
                                    <p style="color: #333; font-weight: bold;">NIM:</p>
                                    <p style="color: #333;">${nim}</p>
                                    
                                    <p style="color: #333; font-weight: bold;">Semester:</p>
                                    <p style="color: #333;">${semester}</p>
                                    
                                    <p style="color: #333; font-weight: bold;">Program Studi:</p>
                                    <p style="color: #333;">${prodi}</p>

                                    <p style="color: #333; font-weight: bold;">Paslon:</p>
                                    <p style="color: #333;">${candidateName}</p>

                                    <p style="color: #333; font-weight: bold;">Status:</p>
                                    <p class="text-green-500">Vote ✓</p>
                                </div>
                            </div>

                            <div style="border-top: 2px solid #eee; padding-top: 16px;">
                                <p style="color: #333; font-weight: bold; margin-bottom: 12px;">Detail:</p>
                                <div style="display: flex; align-items: center;">
                            <img src="${candidateThumbnail}" alt="Kandidat"  width="70" height="auto" class="rounded-lg object-cover" style=" margin-right: 12px;">
                            <img src="${thumbnail}" alt="${thumbnail}"  width="70" height="auto" class="rounded-lg object-cover" style=" margin-right: 12px;">
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
                        a.download = `bukti-voting-${nim}.png`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);

                        // Modifikasi notifikasi sukses dengan pesan penting
                        Swal.fire({
                            icon: 'success',
                            html: `
                                <div class="text-center">
                                    <div class="bg-blue-50 p-4 rounded-lg">
                                        <p class="text-blue-800 font-semibold">⚠️ PENTING ⚠️</p>
                                        <p class="text-blue-600">Simpan bukti e-voting Anda agar dapat digunakan jika sistem mengalami error/data anda tidak masuk di dalam sistem. terimakasih </p>
                                    </div>
                                </div>
                            `,
                            confirmButtonText: 'Saya Mengerti',
                            confirmButtonColor: '#3085d6',
                            allowOutsideClick: false
                        });
                    }, 'image/png');
                });
            }
        });

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: 'Mohon maaf, terjadi kesalahan saat memproses data.',
        });
    }
}