// script.js

// --- INISIALISASI SUPABASE MENGGUNAKAN ES MODULES ---
// PENTING: Baris ini harus ada di bagian paling atas file.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Menggunakan esm.sh CDN

const SUPABASE_URL = 'https://rfzlwivxzftiovusiuzl.supabase.co'; // URL proyek Supabase Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemx3aXZ4emZ0aW92dXNpdXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3Mzg1MDAsImV4cCI6MjA2NjMxNDUwMH0.SghNTZoGbFJqvWn8RowN9AYHaISUsCGSZuYbf1z_RMs'; // Anon Key Anda

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Fungsi-fungsi Utilitas Supabase & Otentikasi (DIJADIKAN GLOBAL) ---

// Fungsi untuk mendapatkan peran pengguna saat ini
async function getCurrentUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        if (user.user_metadata && user.user_metadata.role === 'admin') {
            return 'admin';
        }
        return 'user';
    }
    return 'guest';
}
window.getCurrentUserRole = getCurrentUserRole; // Jadikan global

// Fungsi untuk memeriksa akses admin
async function checkAdminAccess() {
    const role = await getCurrentUserRole();
    if (role !== 'admin') {
        alert('Akses Ditolak! Anda bukan Administrator.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
window.checkAdminAccess = checkAdminAccess; // Jadikan global

// Contoh fungsi registrasi pengguna
async function signUpUser(email, password, username) {
    console.log('Mencoba registrasi user:', { email, password, username });
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: username,
                role: 'user'
            }
        }
    });

    if (error) {
        console.error('Error registrasi:', error.message);
        return { success: false, message: error.message };
    } else {
        console.log('User berhasil registrasi:', data);
        return { success: true, message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.' };
    }
}
window.signUpUser = signUpUser; // Jadikan global

// Contoh fungsi login pengguna
async function signInUser(email, password) {
    console.log('Mencoba login user:', { email, password });
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Error login:', error.message);
        return { success: false, message: error.message };
    } else {
        console.log('User berhasil login:', data);
        return { success: true, message: 'Login berhasil!' };
    }
}
window.signInUser = signInUser; // Jadikan global

// Contoh fungsi reset password
async function resetPassword(email) {
    console.log('Mencoba reset password untuk:', email);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password.html'
    });

    if (error) {
        console.error('Error reset password:', error.message);
        return { success: false, message: error.message };
    } else {
        console.log('Link reset password dikirim:', data);
        return { success: true, message: 'Link reset password telah dikirim ke email Anda!' };
    }
}
window.resetPassword = resetPassword; // Jadikan global

// Contoh fungsi untuk mengunggah akun baru
async function uploadNewAccount(accountData) {
    console.log('Mencoba mengunggah akun baru:', accountData);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: "Anda harus login untuk menjual akun." };
    }

    return { success: true, message: 'Akun Anda berhasil diunggah dan sedang dalam peninjauan (simulasi)!' };
}
window.uploadNewAccount = uploadNewAccount; // Jadikan global

// Contoh fungsi untuk mengambil daftar akun
async function fetchAccounts(filters = {}) {
    console.log('Mencoba mengambil akun dengan filter:', filters);
    let query = supabase.from('accounts').select('*, game_categories(name, icon_url), users(username, is_verified_seller)');

    if (filters.gameId) {
        query = query.eq('game_id', filters.gameId);
    }
    if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
    }
    if (filters.sortBy) {
        if (filters.sortBy === 'latest') query = query.order('created_at', { ascending: false });
        if (filters.sortBy === 'cheapest') query = query.order('price', { ascending: true });
        if (filters.sortBy === 'most-expensive') query = query.order('price', { ascending: false });
    }

    const { data, error } = await query.eq('status', 'active');

    if (error) {
        console.error('Error mengambil akun:', error.message);
        return [];
    } else {
        console.log('Akun berhasil diambil:', data);
        return data;
    }
}
window.fetchAccounts = fetchAccounts; // Jadikan global


// Fungsi untuk mengatur tema (akan dipanggil di setiap halaman saat DOMContentLoaded)
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // Simpan preferensi
    // Update toggle button state if it exists on the page
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = (theme === 'light');
    }
}
window.setTheme = setTheme; // Jadikan global


// --- KODE LOGIKA UI UTAMA ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Global: Mobile Menu Toggle ---
    const menuButton = document.getElementById('menu-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    if (menuButton) {
        menuButton.addEventListener('click', () => {
            mobileMenuOverlay.classList.remove('hidden');
            document.body.classList.add('overflow-hidden'); 
        });
    }

    if (closeMenuButton) {
        closeMenuButton.addEventListener('click', () => {
            mobileMenuOverlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        });
    }

    // --- Global: Tombol Kembali Mengambang ---
    const backButton = document.getElementById('back-button-floating');
    if (backButton) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });
    }


    // --- Homepage Slideshow Logic (Jika ada di halaman ini) ---
    const slideshowContainer = document.getElementById('banner-slideshow');
    if (slideshowContainer) {
        const slides = document.querySelectorAll('#banner-slideshow .slide');
        const prevButton = document.querySelector('.prev-slide');
        const nextButton = document.querySelector('.next-slide');
        const dotsContainer = document.querySelector('.dot-navigation');
        const dots = dotsContainer ? Array.from(dotsContainer.children) : [];

        let currentSlide = 0;
        let autoSlideInterval;

        function showSlide(index) {
            if (slides.length === 0) return;

            currentSlide = index;
            if (currentSlide < 0) {
                currentSlide = slides.length - 1;
            } else if (currentSlide >= slides.length) {
                currentSlide = 0;
            }

            slideshowContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
            
            dots.forEach((dot, i) => {
                dot.classList.remove('active');
                if (i === currentSlide) {
                    dot.classList.add('active');
                }
            });
        }

        function nextSlide() {
            showSlide(currentSlide + 1);
        }

        function prevSlide() {
            showSlide(currentSlide - 1);
        }

        function startAutoSlide() {
            if (slides.length > 1) {
                stopAutoSlide(); 
                autoSlideInterval = setInterval(nextSlide, 5000); 
            }
        }

        function stopAutoSlide() {
            clearInterval(autoSlideInterval);
        }

        showSlide(currentSlide); 
        startAutoSlide(); 

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                stopAutoSlide();
                prevSlide();
                startAutoSlide(); 
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                stopAutoSlide();
                nextSlide();
                startAutoSlide(); 
            });
        }

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                stopAutoSlide();
                const index = parseInt(e.target.dataset.slideIndex);
                showSlide(index);
                startAutoSlide(); 
            });
        });

        slideshowContainer.addEventListener('mouseenter', stopAutoSlide);
        slideshowContainer.addEventListener('mouseleave', startAutoSlide);
    }


    // --- Login/Register Form Logic (for login.html & register.html) ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterButton = document.getElementById('show-register');
    const showLoginButton = document.getElementById('show-login');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('#login-email').value;
            const password = loginForm.querySelector('#login-password').value;
            
            const result = await signInUser(email, password); // Memanggil fungsi global
            if (result.success) {
                alert(result.message);
                const role = await getCurrentUserRole(); // Memanggil fungsi global
                if (role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'index.html'; 
                }
            } else {
                alert('Login gagal: ' + result.message);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = registerForm.querySelector('#register-email').value;
            const username = registerForm.querySelector('#register-username').value;
            const password = registerForm.querySelector('#register-password').value;
            const confirmPassword = registerForm.querySelector('#register-confirm-password').value;

            if (password !== confirmPassword) {
                alert('Password dan konfirmasi password tidak cocok!');
                return;
            }
            
            const result = await signUpUser(email, password, username); // Memanggil fungsi global
            alert(result.message);
            if (result.success) {
                window.location.href = 'login.html'; 
            }
        });
    }

    // Toggle antara Login dan Register (jika di halaman yang sama)
    if (showRegisterButton && showLoginButton) {
        const loginContainer = document.getElementById('login-form-container');
        const registerContainer = document.getElementById('register-form-container');

        showRegisterButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginContainer && registerContainer) {
                loginContainer.classList.add('hidden');
                registerContainer.classList.remove('hidden');
            } else {
                window.location.href = 'register.html'; 
            }
        });
        showLoginButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginContainer && registerContainer) {
                registerContainer.classList.add('hidden');
                loginContainer.classList.remove('hidden');
            } else {
                window.location.href = 'login.html'; 
            }
        });
    }

    // Logic for forgot-password.html
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = forgotPasswordForm.querySelector('#reset-email').value;
            const result = await resetPassword(email); // Memanggil fungsi global
            alert(result.message);
        });
    }


    // --- Jual Akun Dynamic Form Logic (for jual-akun.html) ---
    const gameSelector = document.getElementById('game-selector');
    const formsContainer = document.getElementById('forms-container');
    const allForms = formsContainer ? formsContainer.querySelectorAll('form') : [];
    
    // Templates for dynamic forms (common fields are included in each template for simplicity of copy-paste)
    const garansiTemplateOptions = `
        <option value="reffull">Reffull (Selamanya)</option>
        <option value="reffplay">Reff Play (Sampai Dijual Kembali)</option>
        <option value="noreff">No Reff (Tidak Ada Garansi)</option>
    `;

    const mlRanks = ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythical Honor', 'Mythical Glory', 'Mythic Immortal'].map(r => `<option value="${r}">${r}</option>`).join('');
    const mlCollectorLevels = ['Kolektor Amatir', 'Kolektor Junior', 'Kolektor Senior', 'Kolektor Ahli', 'Kolektor Ternama', 'Kolektor Terhormat', 'Kolektor Juragan', 'Kolektor Sultan'].map(l => `<option value="${l}">${l}</option>`).join('');
    const genshinMinusOptions = ['none', 'deadlink', 'invoice', 'ex-cheat', 'others'].map(o => `<option value="${o}">${o === 'none' ? 'Tidak Ada' : (o === 'deadlink' ? 'Deadlink' : (o === 'invoice' ? 'Invoice Hilang' : (o === 'ex-cheat' ? 'Bekas Cheat/Bot' : 'Lainnya')))}</option>`).join('');
    const fpsRanks = {
        ff: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Heroic', 'Grandmaster'].map(r => `<option value="${r}">${r}</option>`).join(''),
        pubg: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'].map(r => `<option value="${r}">${r}</option>`).join(''),
        codm: ['Rookie', 'Veteran', 'Elite', 'Pro', 'Master', 'Grand Master', 'Legendary'].map(r => `<option value="${r}">${r}</option>`).join(''),
        valorant: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'].map(r => `<option value="${r}">${r}</option>`).join('')
    };
    const otherMinusOptions = ['none', 'google_bind', 'facebook_bind', 'tiktok_bind', 'others'].map(o => `<option value="${o}">${o === 'none' ? 'Tidak Ada' : (o === 'google_bind' ? 'Bind Google' : (o === 'facebook_bind' ? 'Bind Facebook' : (o === 'tiktok_bind' ? 'Bind TikTok' : 'Lainnya')))}</option>`).join('');


    // Helper to generate common fields HTML
    const getCommonFieldsHtml = (formIdPrefix) => `
        <div>
            <label for="${formIdPrefix}-title" class="block text-text-primary text-base font-semibold mb-2">Judul Iklan <span class="text-status-error">*</span></label>
            <input id="${formIdPrefix}-title" type="text" class="form-input" placeholder="Cth: Akun Sultan Skin Lengkap" required>
        </div>
        <div>
            <label for="${formIdPrefix}-price" class="block text-text-primary text-base font-semibold mb-2">Harga (Rp) <span class="text-status-error">*</span></label>
            <input id="${formIdPrefix}-price" type="number" class="form-input" placeholder="Cth: 5000000" min="1000" required>
        </div>
        <div>
            <label for="${formIdPrefix}-minus" class="block text-text-primary text-base font-semibold mb-2">Minus Akun</label>
            <select id="${formIdPrefix}-minus" class="form-input minus-selector">
                ${genshinMinusOptions}
            </select>
        </div>
        <div class="hidden minus-others-input">
            <label class="block text-text-primary text-base font-semibold mb-2">Jelaskan Minus Lainnya</label>
            <input type="text" class="form-input" placeholder="Cth: Email mati, nomor HP tidak aktif">
        </div>
        <div>
            <label for="${formIdPrefix}-garansi" class="block text-text-primary text-base font-semibold mb-2">Garansi</label>
            <select id="${formIdPrefix}-garansi" class="form-input">${garansiTemplateOptions}</select>
        </div>
        <div>
            <label for="${formIdPrefix}-notes" class="block text-text-primary text-base font-semibold mb-2">Catatan Tambahan</label>
            <textarea id="${formIdPrefix}-notes" rows="3" class="form-input resize-y"></textarea>
        </div>
        <div>
            <label class="block text-text-primary text-base font-semibold mb-2">Upload Gambar Akun <span class="text-status-error">*</span></label>
            <input type="file" class="form-input" multiple accept="image/*" required>
            <p class="text-text-secondary text-sm mt-1">Minimal 3 gambar kualitas baik.</p>
        </div>
        <button type="submit" class="btn-primary w-full py-3 rounded-lg text-lg">Jual Akun Ini</button>
    `;

    const mlFormTemplate = `
        <h2 class="text-xl font-bold text-accent-primary mb-4">Detail Akun Mobile Legends</h2>
        <div class="grid grid-cols-2 gap-4">
            <div><label for="ml-level" class="block text-text-primary text-base font-semibold mb-2">Level Akun</label><input id="ml-level" type="number" class="form-input" placeholder="Cth: 75"></div>
            <div><label for="ml-rank" class="block text-text-primary text-base font-semibold mb-2">Rank Saat Ini</label><select id="ml-rank" class="form-input">${mlRanks}</select></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div><label for="ml-hero" class="block text-text-primary text-base font-semibold mb-2">Jumlah Hero</label><input id="ml-hero" type="number" class="form-input"></div>
            <div><label for="ml-skin" class="block text-text-primary text-base font-semibold mb-2">Jumlah Skin</label><input id="ml-skin" type="number" class="form-input"></div>
        </div>
        <div>
            <label for="ml-collector" class="block text-text-primary text-base font-semibold mb-2">Tingkat Kolektor</label>
            <select id="ml-collector" class="form-input">${mlCollectorLevels}</select>
        </div>
        ${getCommonFieldsHtml('ml')}
    `;

    const genshinFormTemplate = `
        <h2 class="text-xl font-bold text-accent-primary mb-4">Detail Akun Genshin Impact</h2>
        <div class="grid grid-cols-3 gap-4">
            <div><label for="gi-ar" class="block text-text-primary text-base font-semibold mb-2">Adventure Rank (AR)</label><input id="gi-ar" type="number" class="form-input" placeholder="Cth: 60"></div>
            <div><label for="gi-char5" class="block text-text-primary text-base font-semibold mb-2">Jumlah Karakter B5</label><input id="gi-char5" type="number" class="form-input"></div>
            <div><label for="gi-wep5" class="block text-text-primary text-base font-semibold mb-2">Jumlah Senjata B5</label><input id="gi-wep5" type="number" class="form-input"></div>
        </div>
        ${getCommonFieldsHtml('gi')}
    `;

    const wuwaFormTemplate = `
        <h2 class="text-xl font-bold text-accent-primary mb-4">Detail Akun Wuthering Waves</h2>
        <div class="grid grid-cols-3 gap-4">
            <div><label for="wuwa-ul" class="block text-text-primary text-base font-semibold mb-2">Union Level (UL)</label><input id="wuwa-ul" type="number" class="form-input" placeholder="Cth: 60"></div>
            <div><label for="wuwa-char5" class="block text-text-primary text-base font-semibold mb-2">Jumlah Resonator 5*</label><input id="wuwa-char5" type="number" class="form-input"></div>
            <div><label for="wuwa-wep5" class="block text-text-primary text-base font-semibold mb-2">Jumlah Senjata 5*</label><input id="wuwa-wep5" type="number" class="form-input"></div>
        </div>
        ${getCommonFieldsHtml('wuwa')}
    `;

    const fpsFormGen = (gameName, ranksOption, formIdPrefix) => `
        <h2 class="text-xl font-bold text-accent-primary mb-4">Detail Akun ${gameName}</h2>
        <div><label for="${formIdPrefix}-level" class="block text-text-primary text-base font-semibold mb-2">Level Akun</label><input id="${formIdPrefix}-level" type="number" class="form-input" placeholder="Cth: 100"></div>
        <div><label for="${formIdPrefix}-rank" class="block text-text-primary text-base font-semibold mb-2">Rank Saat Ini</label><select id="${formIdPrefix}-rank" class="form-input">${ranksOption}</select></div>
        ${getCommonFieldsHtml(formIdPrefix)}
    `;

    const othersFormTemplate = `
        <h2 class="text-xl font-bold text-accent-primary mb-4">Detail Akun Game Lainnya</h2>
        <div>
            <label for="other-game-name" class="block text-text-primary text-base font-semibold mb-2">Nama Game <span class="text-status-error">*</span></label>
            <input id="other-game-name" type="text" class="form-input" placeholder="Cth: Clash of Clans" required>
        </div>
        <div>
            <label for="other-level" class="block text-text-primary text-base font-semibold mb-2">Level (opsional)</label>
            <input id="other-level" type="text" class="form-input">
        </div>
        <div>
            <label for="other-rank" class="block text-text-primary text-base font-semibold mb-2">Rank (opsional)</label>
            <input id="other-rank" type="text" class="form-input">
        </div>
        ${getCommonFieldsHtml('other')}
    `;


    // Populate dynamic forms if the container exists and forms are present
    if (formsContainer && document.getElementById('form-ml')) {
        document.getElementById('form-ml').innerHTML = mlFormTemplate;
        document.getElementById('form-genshin').innerHTML = genshinFormTemplate;
        document.getElementById('form-wuwa').innerHTML = wuwaFormTemplate;
        document.getElementById('form-ff').innerHTML = fpsFormGen('Free Fire', fpsRanks.ff, 'ff');
        document.getElementById('form-pubg').innerHTML = fpsFormGen('PUBG Mobile', fpsRanks.pubg, 'pubg');
        document.getElementById('form-codm').innerHTML = fpsFormGen('Call of Duty: Mobile', fpsRanks.codm, 'codm');
        document.getElementById('form-valorant').innerHTML = fpsFormGen('Valorant', fpsRanks.valorant, 'valorant');
        document.getElementById('form-others').innerHTML = othersFormTemplate;
    }


    if (gameSelector && formsContainer) {
        gameSelector.addEventListener('change', (event) => {
            const selectedGame = event.target.value;
            allForms.forEach(form => form.classList.add('hidden')); 

            if (selectedGame) {
                const formToShow = document.getElementById(`form-${selectedGame}`);
                if(formToShow) {
                    formToShow.classList.remove('hidden');
                }
            }
        });

        formsContainer.addEventListener('change', (event) => {
            if (event.target.matches('select.minus-selector')) {
                const selectedForm = event.target.closest('form');
                const otherInputDiv = selectedForm.querySelector('.minus-others-input');
                if (otherInputDiv) {
                    if (event.target.value === 'others') {
                        otherInputDiv.classList.remove('hidden');
                    } else {
                        otherInputDiv.classList.add('hidden');
                    }
                }
            }
        });

        allForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Form Submitted for game:', form.id);
                const formData = new FormData(form);
                const data = {};
                formData.forEach((value, key) => { data[key] = value; });
                
                const result = await uploadNewAccount(data); // Call Supabase function
                if (result.success) {
                    alert(result.message);
                    form.reset(); 
                    gameSelector.value = ''; 
                    allForms.forEach(f => f.classList.add('hidden')); 
                } else {
                    alert('Gagal mengunggah akun: ' + result.message);
                }
                console.log('Data to be sent:', data);
            });
        });

    }


    // --- Transaction Tabs (Example for transaksi.html) ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const transactionItemsContainer = document.getElementById('transaction-items-container'); 

    if (tabButtons.length > 0 && transactionItemsContainer) {
        const allTransactionItems = Array.from(transactionItemsContainer.children); 

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                tabButtons.forEach(btn => {
                    btn.classList.remove('active-tab', 'border-accent-primary', 'text-accent-primary');
                    btn.classList.add('border-transparent', 'text-text-secondary'); 
                });
                
                e.target.classList.add('active-tab', 'border-accent-primary', 'text-accent-primary');
                e.target.classList.remove('border-transparent', 'text-text-secondary');

                const filter = e.target.dataset.tab; 
                
                allTransactionItems.forEach(item => {
                    if (filter === 'all' || item.classList.contains(`status-${filter}`)) {
                        item.style.display = 'flex'; 
                    } else {
                        item.style.display = 'none'; 
                    }
                });
            });
        });

        const initialActiveTab = document.querySelector('.tab-button[data-tab="all"]');
        if (initialActiveTab) {
            initialActiveTab.click(); 
        }
    }


    // --- AI Description/Suggestion Buttons (Simulated) ---
    const generateDescriptionBtn = document.getElementById('generate-description-btn');
    const aiDescriptionStatus = document.getElementById('ai-description-status');

    if (generateDescriptionBtn && aiDescriptionStatus) {
        generateDescriptionBtn.addEventListener('click', () => {
            aiDescriptionStatus.textContent = 'Membuat deskripsi...';
            generateDescriptionBtn.disabled = true; 
            setTimeout(() => {
                aiDescriptionStatus.textContent = 'Deskripsi berhasil dibuat!';
                generateDescriptionBtn.disabled = false;
            }, 2000); 
        });
    }

    const suggestTopupBtn = document.getElementById('suggest-topup-btn');
    const aiTopupSuggestion = document.getElementById('ai-topup-suggestion');

    if (suggestTopupBtn && aiTopupSuggestion) {
        suggestTopupBtn.addEventListener('click', () => {
            aiTopupSuggestion.textContent = 'Mencari saran...';
            suggestTopupBtn.disabled = true;
            setTimeout(() => {
                aiTopupSuggestion.textContent = 'Saran: Paket Hemat 500 Diamond + Bonus Skin!';
                suggestTopupBtn.disabled = false;
            }, 2000); 
        });
    }

    // --- Favorite Button Toggle (Example for detail-akun.html) ---
    const favoriteButton = document.getElementById('favorite-button');
    const favoriteIcon = document.getElementById('favorite-icon');

    if (favoriteButton && favoriteIcon) {
        let isFavorited = localStorage.getItem('isAccountFavorited') === 'true'; // Simulated state

        const updateFavoriteButton = () => {
            if (isFavorited) {
                favoriteIcon.classList.remove('far');
                favoriteIcon.classList.add('fas');
                favoriteButton.classList.add('text-accent-primary', 'border-accent-primary');
                favoriteButton.classList.remove('text-text-secondary', 'border-gray-700');
            } else {
                favoriteIcon.classList.remove('fas');
                favoriteIcon.classList.add('far');
                favoriteButton.classList.remove('text-accent-primary', 'border-accent-primary');
                favoriteButton.classList.add('text-text-secondary', 'border-gray-700');
            }
        };

        favoriteButton.addEventListener('click', async () => {
            isFavorited = !isFavorited;
            localStorage.setItem('isAccountFavorited', isFavorited); 
            updateFavoriteButton();

            // Placeholder for Supabase update
        });

        updateFavoriteButton(); 
    }

    // --- Dark/Light Mode Toggle Logic ---
    // Note: The actual toggle switch element is in profil.html
    // This function is globally available and called from profil.html
    const themeToggle = document.getElementById('theme-toggle'); // Untuk halaman profil
    if (themeToggle) { // Only add event listener if the toggle element exists on THIS page
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                setTheme('light');
            } else {
                setTheme('dark');
            }
        });
    }

    // Ambil preferensi tema dari localStorage saat halaman dimuat
    // Fungsi setTheme sendiri sudah global
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default dark
    setTheme(savedTheme); // Panggil setTheme secara langsung

});
