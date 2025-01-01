import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getDatabase, ref, get, set, child } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

async function checkVoteStatus(nim = null) {
    if (nim) {
        const localStatus = localStorage.getItem('voteStatus');
        if (localStatus) {
            const status = JSON.parse(localStatus);
            if (status.nim === nim && status.hasVoted) {
                return true;
            }
        }
    }

    if (!nim) {
        const localStatus = localStorage.getItem('voteStatus');
        if (localStatus) {
            const status = JSON.parse(localStatus);
            if (status.hasVoted) {
                return true;
            }
        }
    }

    if (nim) {
        try {
            const database = getDatabase();
            const votesRef = ref(database, 'votes-candidate');
            const snapshot = await get(votesRef);
            
            if (snapshot.exists()) {
                const votes = snapshot.val();
                return Object.values(votes).some(vote => vote.nim === nim);
            }
        } catch (error) {
            console.error('Error checking database vote status:', error);
            throw error;
        }
    }
    
    return false;
}

function updateVoteButton(disabled = true) {
    const voteButton = document.getElementById('vote-button');
    if (voteButton) {
        voteButton.disabled = disabled;
        if (disabled) {
            voteButton.classList.remove('bg-green-600', 'hover:bg-blue-700');
            voteButton.classList.add('bg-gray-400', 'cursor-not-allowed');
            voteButton.innerHTML = `
                <img src="/img/voting.webp" class="rounded-lg inline-block" width="40px" height="auto" alt="">
                Sudah Vote
            `;
        }
    }
}

async function simpanVote(data, kandidatId) {
    const database = getDatabase();
    const voteId = Date.now().toString();
    
    const reader = new FileReader();
    const thumbnailBase64 = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(data.thumbnail);
    });

    const voteData = {
        nama: data.nama,
        nim: data.nim,
        semester: data.semester,
        prodi: data.prodi,
        thumbnail: thumbnailBase64,
        kandidatId: kandidatId,
        timestamp: Date.now(),
        status: 'valid'
    };

    try {
        await set(ref(database, `votes-candidate/${voteId}`), voteData);
        
        localStorage.setItem('voteStatus', JSON.stringify({
            nim: data.nim,
            hasVoted: true,
            timestamp: Date.now()
        }));
        
        return true;
    } catch (error) {
        console.error('Error saving vote:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const hasVoted = await checkVoteStatus();
        if (hasVoted) {
            updateVoteButton(true);
        }
    } catch (error) {
        console.error('Error checking initial vote status:', error);
    }

    const voteButton = document.getElementById('vote-button');
    if (voteButton) {
        voteButton.addEventListener('click', async (e) => {
            e.preventDefault();

            Swal.fire({
                title: 'Memeriksa Status Vote',
                text: 'Mohon tunggu sebentar...',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const nimInput = document.getElementById('nim');
                const nim = nimInput ? nimInput.value : null;
                
                const hasVoted = await checkVoteStatus(nim);
                
                if (hasVoted) {
                    updateVoteButton(true);
                    Swal.fire({
                        icon: 'info',
                        title: 'Sudah Vote',
                        text: 'Anda sudah melakukan voting sebelumnya'
                    });
                    return;
                }

                Swal.fire({
                    title: 'Form Voting',
                    html: `
                        <input id="nama" class="swal2-input" placeholder="Nama Lengkap">
                        <input id="nim" class="swal2-input" placeholder="NIM">
                        <input id="semester" class="swal2-input" placeholder="Semester">
                        <select id="prodi" class="swal2-input">
                            <option value="">Pilih Prodi</option>
                            <option value="Ilmu Komputer">Ilmu Komputer</option>
                            <option value="Sistem Informasi">Sistem Informasi</option>
                            <option value="Teknologi Informasi">Teknologi Informasi</option>
                        </select>
                        <input type="file" id="thumbnail" class="swal2-file" accept="image/*">
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Submit',
                    cancelButtonText: 'Batal',
                    preConfirm: async () => {
                        const formData = {
                            nama: document.getElementById('nama').value,
                            nim: document.getElementById('nim').value,
                            semester: document.getElementById('semester').value,
                            prodi: document.getElementById('prodi').value,
                            thumbnail: document.getElementById('thumbnail').files[0]
                        };

                        if (!formData.nama || !formData.nim || !formData.semester || !formData.prodi || !formData.thumbnail) {
                            Swal.showValidationMessage('Semua field harus diisi');
                            return false;
                        }

                        const finalCheck = await checkVoteStatus(formData.nim);
                        if (finalCheck) {
                            Swal.showValidationMessage('NIM ini sudah melakukan voting');
                            return false;
                        }

                        return formData;
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        Swal.fire({
                            title: 'Menyimpan Vote',
                            text: 'Mohon tunggu sebentar...',
                            allowOutsideClick: false,
                            showConfirmButton: false,
                            willOpen: () => {
                                Swal.showLoading();
                            }
                        });

                        const urlParams = new URLSearchParams(window.location.search);
                        const kandidatId = urlParams.get('url');
                        
                        const success = await simpanVote(result.value, kandidatId);
                        
                        if (success) {
                            updateVoteButton(true);
                            Swal.fire({
                                icon: 'success',
                                title: 'Berhasil',
                                text: 'Terima kasih telah berpartisipasi dalam voting!'
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Gagal',
                                text: 'Terjadi kesalahan saat menyimpan vote'
                            });
                        }
                    }
                });
            } catch (error) {
                console.error('Error in voting process:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Terjadi kesalahan dalam proses voting'
                });
            }
        });
    }
});