import './countdown.js';

// ========== Error Notification ==========
// Show error modal with custom title and message
function showError(title, message) {
  const errorModal = document.getElementById('error-modal');
  const errorTitle = document.getElementById('error-title');
  const errorMessage = document.getElementById('error-message');

  if (errorTitle) errorTitle.textContent = title;
  if (errorMessage) errorMessage.textContent = message;
  if (errorModal) errorModal.classList.add('active');
}

// Close error modal
function closeErrorModal() {
  const errModal = document.getElementById('error-modal');
  if (errModal) errModal.classList.remove('active');
}

// ========== Result Modal ==========
function closeModal() {
  const modal = document.getElementById('result-modal');
  if (modal) modal.classList.remove('active');

  // Hapus session: kosongkan input dan reset semua data modal
  const input = document.getElementById('search-input');
  if (input) input.value = '';

  document.getElementById('modal-no-peserta').textContent = '';
  document.getElementById('modal-nisn').textContent = '';
  document.getElementById('modal-nama').textContent = '';
  document.getElementById('modal-rata').textContent = '0';

  const statusBanner = document.getElementById('status-banner');
  if (statusBanner) {
    statusBanner.className = 'status-banner';
    statusBanner.innerHTML = '';
  }
}

// ========== Helpers ==========
// Helper to show/hide loading spinner (requires #loader element in HTML)
function setLoading(show) {
  const loader = document.getElementById('loader');
  if (loader) loader.classList.toggle('hidden', !show);
}

// ========== Search Handler ==========
async function handleSearch(event) {
  event.preventDefault();
  const input = document.getElementById('search-input');
  const noPeserta = input.value.trim();

  // Input validation: must be at least 3 digits
  if (!/^\d{3,}$/.test(noPeserta)) {
    showError('Input Tidak Valid', 'Nomor peserta harus berupa angka minimal 3 digit.');
    return;
  }

  const searchBtn = document.getElementById('btn-search');
  if (searchBtn) searchBtn.disabled = true;
  setLoading(true);

  try {
    // Load Supabase client
    let supabase;
    try {
      const module = await import('./supabaseClient.js');
      supabase = module.supabase;
      console.log('Supabase client initialized');
    } catch (e) {
      console.error('Failed to load Supabase client:', e);
      showError('Kesalahan Sistem', 'Tidak dapat menghubungkan ke database.');
      return;
    }

    // Query Supabase for student record by participant number
    const { data: student, error } = await supabase.from('students').select('*').eq('no_peserta', noPeserta).single();

    if (error) {
      console.error('Supabase query error:', error);
      if (error.code === 'PGRST116') {
        showError('Data Tidak Ditemukan', 'Nomor peserta yang Anda masukkan tidak terdaftar. Silakan periksa kembali.');
      } else {
        showError('Kesalahan Server', 'Gagal mengambil data dari server. Silakan coba lagi nanti.');
      }
      return;
    }

    // Populate modal fields
    console.log('Student record fetched:', student);
    document.getElementById('modal-no-peserta').textContent = student.no_peserta;
    document.getElementById('modal-nisn').textContent = student.nisn;
    document.getElementById('modal-nama').textContent = student.nama.toUpperCase();
    document.getElementById('modal-rata').textContent = student.rata_rata.toFixed(1);

    const statusBanner = document.getElementById('status-banner');
    if (student.keterangan === 'LULUS') {
      statusBanner.className = 'status-banner lulus';
      statusBanner.innerHTML = '<i class="fas fa-check-circle"></i><span class="status-banner-subtitle">Anda dinyatakan</span><span class="status-banner-title">LULUS</span>';
    } else {
      statusBanner.className = 'status-banner tidak-lulus';
      statusBanner.innerHTML = '<i class="fas fa-times-circle"></i><span class="status-banner-subtitle">Maaf, Anda dinyatakan</span><span class="status-banner-title">TIDAK LULUS</span>';
    }

    document.getElementById('result-modal').classList.add('active');
  } catch (err) {
    console.error('Unexpected error:', err);
    showError('Kesalahan Sistem', 'Terjadi kesalahan saat memproses data.');
  } finally {
    setLoading(false);
    if (searchBtn) searchBtn.disabled = false;
  }
}

// ========== Expose functions to global scope ==========
// Required because app.js is loaded as type="module" but HTML uses onclick attributes
window.handleSearch = handleSearch;
window.closeModal = closeModal;
window.closeErrorModal = closeErrorModal;
window.showError = showError;

// ========== Overlay click-to-close handlers ==========
const resultModal = document.getElementById('result-modal');
if (resultModal) {
  resultModal.addEventListener('click', (e) => {
    if (e.target === resultModal) closeModal();
  });
}
const errorModalOverlay = document.getElementById('error-modal');
if (errorModalOverlay) {
  errorModalOverlay.addEventListener('click', (e) => {
    if (e.target === errorModalOverlay) closeErrorModal();
  });
}
