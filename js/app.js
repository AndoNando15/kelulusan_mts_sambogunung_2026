import './countdown.js';

// ========== Constants ==========
const CACHE_KEY = 'student_cache';
const CACHE_EXPIRY_HOURS = 24; // Cache berlaku 24 jam
const REQUEST_TIMEOUT_MS = 10000; // 10 detik timeout
const LOADING_DURATION_MS = 3000; // Loading modal show 3 detik

// Store loading timeout ID untuk clear jika diperlukan
let loadingTimeoutId = null;

// ========== Data Validation ==========
/**
 * Validate student data sebelum ditampilkan
 */
function validateStudentData(student) {
  if (!student) return false;

  // Validate required fields
  if (!student.no_peserta || typeof student.no_peserta !== 'string') return false;
  if (!student.nisn || typeof student.nisn !== 'string') return false;
  if (!student.nama || typeof student.nama !== 'string') return false;
  if (student.rata_rata === undefined || student.rata_rata === null) return false;
  if (!student.keterangan || !['LULUS', 'TIDAK LULUS'].includes(student.keterangan)) return false;

  // Validate number ranges
  const avgScore = parseFloat(student.rata_rata);
  if (isNaN(avgScore) || avgScore < 0 || avgScore > 100) return false;

  return true;
}

/**
 * Validate input nomor peserta
 */
function validateNomorPeserta(noPeserta) {
  const trimmed = noPeserta.trim();

  // Must be numeric and at least 3 digits
  if (!/^\d{3,}$/.test(trimmed)) {
    return { valid: false, message: 'Nomor peserta harus berupa angka minimal 3 digit.' };
  }

  // Maximum 10 digits
  if (trimmed.length > 10) {
    return { valid: false, message: 'Nomor peserta terlalu panjang.' };
  }

  return { valid: true, value: trimmed };
}

// ========== Caching System ==========
/**
 * Get student data dari cache jika ada dan masih valid
 */
function getCachedStudent(noPeserta) {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache = JSON.parse(cached);
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

    // Check if cache masih valid
    if (now - cache.timestamp > expiryTime) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Return data jika noPeserta match
    if (cache.data[noPeserta]) {
      return cache.data[noPeserta];
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Cache student data ke localStorage
 */
function cacheStudent(noPeserta, studentData) {
  try {
    let cache = { timestamp: Date.now(), data: {} };

    // Load existing cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      cache = JSON.parse(cached);
    }

    // Add new data
    cache.data[noPeserta] = studentData;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Fail silently - caching tidak critical
  }
}

// ========== Error Notification ==========
/**
 * Show error modal dengan custom title dan message
 */
function showError(title, message) {
  const errorModal = document.getElementById('error-modal');
  const errorTitle = document.getElementById('error-title');
  const errorMessage = document.getElementById('error-message');

  if (errorTitle) errorTitle.textContent = title;
  if (errorMessage) errorMessage.textContent = message;
  if (errorModal) errorModal.classList.add('active');
}

/**
 * Close error modal
 */
function closeErrorModal() {
  const errModal = document.getElementById('error-modal');
  if (errModal) errModal.classList.remove('active');
}

// ========== Result Modal ==========
/**
 * Close result modal dan reset data
 */
function closeModal() {
  const modal = document.getElementById('result-modal');
  if (modal) modal.classList.remove('active');

  // Reset form dan data modal
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

// ========== Loading Feedback ==========
/**
 * Show loading modal
 */
function setLoading(show) {
  const loader = document.getElementById('loader');
  if (!loader) return;

  if (show) {
    loader.classList.remove('hidden');

    // Auto hide loading modal setelah 3 detik jika masih ditampilkan
    if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
    loadingTimeoutId = setTimeout(() => {
      if (loader && !loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
      }
      loadingTimeoutId = null;
    }, LOADING_DURATION_MS);
  } else {
    loader.classList.add('hidden');
    if (loadingTimeoutId) {
      clearTimeout(loadingTimeoutId);
      loadingTimeoutId = null;
    }
  }
}

/**
 * Langsung hide loading modal
 */
function hideLoading() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.add('hidden');
  }
  if (loadingTimeoutId) {
    clearTimeout(loadingTimeoutId);
    loadingTimeoutId = null;
  }
}

// ========== Network Detection ==========
/**
 * Check if user is online
 */
function isOnline() {
  return navigator.onLine;
}

// ========== Request with Timeout ==========
/**
 * Execute async function dengan timeout protection
 */
async function withTimeout(promise, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), timeoutMs));
  return Promise.race([promise, timeoutPromise]);
}

// ========== Display Result ==========
/**
 * Populate dan display result modal dengan student data
 */
function displayResult(student) {
  // Langsung hide loading sebelum tampilkan result
  hideLoading();

  // Small delay untuk smooth transition antar modal
  setTimeout(() => {
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
  }, 150);
}

// ========== Search Handler ==========
/**
 * Main search handler - fetch student data dan display result
 */
async function handleSearch(event) {
  event.preventDefault();

  const input = document.getElementById('search-input');
  const noPesertaInput = input.value.trim();

  // Input validation
  const validation = validateNomorPeserta(noPesertaInput);
  if (!validation.valid) {
    showError('Input Tidak Valid', validation.message);
    return;
  }

  const noPeserta = validation.value;
  const searchBtn = document.getElementById('btn-search');

  // Disable button dan show loading
  if (searchBtn) searchBtn.disabled = true;
  setLoading(true);

  try {
    // 1. Check cache first
    const cachedStudent = getCachedStudent(noPeserta);
    if (cachedStudent && validateStudentData(cachedStudent)) {
      displayResult(cachedStudent);
      return;
    }

    // 2. Check network connection
    if (!isOnline()) {
      if (cachedStudent) {
        // Show cached result jika offline
        displayResult(cachedStudent);
        return;
      } else {
        hideLoading();
        showError('Tidak Ada Koneksi Internet', 'Pastikan Anda terhubung ke internet. Coba lagi nanti.');
        return;
      }
    }

    // 3. Load Supabase client
    let supabase;
    try {
      const module = await import('./supabaseClient.js');
      supabase = module.supabase;
    } catch (e) {
      hideLoading();
      showError('Kesalahan Sistem', 'Tidak dapat memuat modul database. Coba refresh halaman.');
      return;
    }

    // 4. Fetch from Supabase dengan timeout
    let student;
    let error;
    try {
      const result = await withTimeout(supabase.from('students').select('*').eq('no_peserta', noPeserta).single(), REQUEST_TIMEOUT_MS);
      student = result.data;
      error = result.error;
    } catch (timeoutError) {
      hideLoading();
      if (timeoutError.message === 'REQUEST_TIMEOUT') {
        showError('Koneksi Lambat', 'Server membutuhkan waktu terlalu lama untuk merespons. Coba lagi nanti.');
      } else {
        showError('Kesalahan Jaringan', 'Gagal menghubungkan ke server. Pastikan koneksi internet stabil.');
      }
      return;
    }

    // 5. Handle query errors
    if (error) {
      hideLoading();
      if (error.code === 'PGRST116') {
        showError('Data Tidak Ditemukan', 'Nomor peserta yang Anda masukkan tidak terdaftar. Silakan periksa kembali.');
      } else {
        showError('Kesalahan Server', 'Gagal mengambil data dari server. Silakan coba lagi nanti.');
      }
      return;
    }

    // 6. Validate returned data
    if (!student || !validateStudentData(student)) {
      hideLoading();
      showError('Data Tidak Valid', 'Data yang diterima dari server tidak valid. Silakan coba lagi.');
      return;
    }

    // 7. Cache dan display result
    cacheStudent(noPeserta, student);
    displayResult(student);
  } catch (err) {
    // Unexpected error handling
    hideLoading();
    showError('Kesalahan Sistem', 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
  } finally {
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

// ========== Online/Offline Event Listeners ==========
window.addEventListener('online', () => {
  // User is back online - bisa clear offline message jika ada
});

window.addEventListener('offline', () => {
  // User is offline
  showError('Mode Offline', 'Anda sedang offline. Beberapa data mungkin tidak tersedia.');
});
