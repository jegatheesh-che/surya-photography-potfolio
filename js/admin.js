import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// CONFIGURATION (PLACEHOLDERS)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyADbXVx3b_DtClpoRGcy75e_Iq9bI8FCgI",
    authDomain: "project2-f50fa.firebaseapp.com",
    projectId: "project2-f50fa",
    storageBucket: "project2-f50fa.firebasestorage.app",
    messagingSenderId: "145748902606",
    appId: "1:145748902606:web:b2144e287ef6668a29469f"
};

const CLOUDINARY_CLOUD_NAME = "db2olmkfm";
const CLOUDINARY_UPLOAD_PRESET = "surya_photography";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// UI Elements
// ==========================================
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const btnLogout = document.getElementById('btn-logout');

// ==========================================
// AUTHENTICATION
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginOverlay.classList.add('hidden');
        loadDashboardData();
    } else {
        loginOverlay.classList.remove('hidden');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        errorMsg.classList.add('hidden');
    } catch (error) {
        errorMsg.classList.remove('hidden');
        console.error("Auth Error:", error);
    }
});

btnLogout.addEventListener('click', () => {
    signOut(auth);
});

// ==========================================
// DASHBOARD LOGIC
// ==========================================
let categoriesList = [];

// ==========================================
// PREMIUM UX HELPER FUNCTIONS
// ==========================================
window.showToast = function(type, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-times-circle';
    
    toast.innerHTML = `
        <i class="fas ${iconClass} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-progress"><div class="toast-progress-bar"></div></div>
    `;
    
    container.appendChild(toast);
    
    const duration = 3000;
    const progressBar = toast.querySelector('.toast-progress-bar');
    
    void toast.offsetWidth; // Trigger reflow
    progressBar.style.transitionDuration = duration + 'ms';
    progressBar.style.width = '0%';
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

window.showSuccessPopup = function(title, message) {
    const popup = document.getElementById('success-popup');
    if (!popup) return;
    document.getElementById('success-popup-title').innerText = title;
    document.getElementById('success-popup-message').innerText = message;
    
    // Add particles
    const particlesContainer = document.getElementById('success-popup-particles');
    particlesContainer.innerHTML = '';
    for(let i=0; i<12; i++) {
        let p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = '#10B981';
        p.style.left = `${50 + (Math.random() * 80 - 40)}%`;
        p.style.top = `${40 + (Math.random() * 60 - 30)}%`;
        p.style.width = `${Math.random() * 6 + 4}px`;
        p.style.height = p.style.width;
        p.style.animationDuration = `${0.6 + Math.random() * 0.6}s`;
        particlesContainer.appendChild(p);
    }
    
    // Vibrate if supported
    if(navigator.vibrate) navigator.vibrate([30, 50, 30]);

    // Show popup
    popup.classList.add('active');
    
    // Auto dismiss
    clearTimeout(window.successPopupTimeout);
    window.successPopupTimeout = setTimeout(window.closeSuccessPopup, 1800);
};

window.closeSuccessPopup = function() {
    const popup = document.getElementById('success-popup');
    if (!popup) return;
    popup.classList.remove('active');
    
    // Reset SVG animation after fade out
    setTimeout(() => {
        const svg = popup.querySelector('.success-popup-svg');
        const ring = popup.querySelector('.success-popup-ring');
        const glow = popup.querySelector('.success-popup-glow');
        if(svg) svg.parentNode.replaceChild(svg.cloneNode(true), svg);
        if(ring) ring.parentNode.replaceChild(ring.cloneNode(true), ring);
        if(glow) glow.parentNode.replaceChild(glow.cloneNode(true), glow);
    }, 400);
};

window.customConfirm = function(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const content = document.getElementById('confirm-modal-content');
        
        document.getElementById('confirm-title').innerText = title;
        document.getElementById('confirm-message').innerText = message;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        });
        
        const cleanup = () => {
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
            document.getElementById('btn-confirm-cancel').removeEventListener('click', onCancel);
            document.getElementById('btn-confirm-action').removeEventListener('click', onConfirm);
        };
        
        const onConfirm = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };
        
        document.getElementById('btn-confirm-cancel').addEventListener('click', onCancel);
        document.getElementById('btn-confirm-action').addEventListener('click', onConfirm);
    });
};

function getSkeletonRows(count, columns) {
    let colsHtml = '';
    for(let i=0; i<columns; i++) {
        colsHtml += `<td class="px-6 py-4"><div class="skeleton h-4 rounded w-full"></div></td>`;
    }
    return Array(count).fill(0).map(() => `<tr>${colsHtml}</tr>`).join('');
}

function openEditModal(data) {
    document.getElementById('edit-image-id').value = data.id;
    document.getElementById('edit-image-title').value = data.title;
    document.getElementById('edit-image-category').value = data.cat;
    
    const modal = document.getElementById('edit-modal');
    const content = document.getElementById('edit-modal-content');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    });
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    const content = document.getElementById('edit-modal-content');
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

async function loadDashboardData() {
    await fetchCategories();
    await fetchImages();
}

// --- Categories ---
async function fetchCategories() {
    const tbody = document.getElementById('categories-tbody');
    tbody.innerHTML = getSkeletonRows(3, 2);
    
    const q = query(collection(db, "categories"), orderBy("name"));
    try {
        const querySnapshot = await getDocs(q);
        
        categoriesList = [];
        const uploadSelect = document.getElementById('upload-category');
        const editSelect = document.getElementById('edit-image-category');
        
        tbody.innerHTML = '';
        let selectHtml = '<option value="">No Category</option>';

        if (querySnapshot.empty) {
            tbody.innerHTML = `
                <tr><td colspan="2" class="px-6 py-12 text-center text-gray-500 fade-up">
                    <i class="fas fa-tags text-4xl mb-3 opacity-20"></i><br>
                    <p>No categories yet. Create your first one above.</p>
                </td></tr>`;
        }

        let delay = 0;
        querySnapshot.forEach((docSnap) => {
            const cat = { id: docSnap.id, ...docSnap.data() };
            categoriesList.push(cat);
            
            selectHtml += `<option value="${cat.id}">${cat.name}</option>`;
            
            const tr = document.createElement('tr');
            tr.className = "table-row fade-up";
            tr.style.animationDelay = `${delay}ms`;
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${cat.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-red-600 hover:text-red-900 ml-4 btn-delete-cat btn-interactive" data-id="${cat.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
            delay += 50;
        });

        uploadSelect.innerHTML = selectHtml;
        editSelect.innerHTML = selectHtml;

            document.querySelectorAll('.btn-delete-cat').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tr = e.currentTarget.closest('tr');
                    if(await customConfirm('Delete Category?', 'This category will be permanently removed. Images using it will become uncategorized.')) {
                        try {
                            tr.classList.add('shrink-out');
                            await deleteDoc(doc(db, "categories", e.currentTarget.dataset.id));
                            showSuccessPopup('Task Completed', 'Category deleted successfully.');
                            setTimeout(fetchCategories, 400); // Wait for shrink animation
                        } catch(err) {
                            showToast('error', 'Error deleting category. Check permissions.');
                        }
                    }
                });
            });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="2" class="px-6 py-4 text-center text-sm text-red-500">Failed to load categories.</td></tr>';
    }
}

document.getElementById('btn-add-category').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const input = document.getElementById('new-category-name');
    const name = input.value.trim();
    if (name) {
        btn.classList.add('btn-loading');
        btn.innerText = "Saving";
        try {
            await addDoc(collection(db, "categories"), { name });
            input.value = '';
            showSuccessPopup('Task Completed', 'Category created successfully.');
            fetchCategories();
        } catch(err) {
            showToast('error', 'Failed to add category.');
        } finally {
            btn.classList.remove('btn-loading');
            btn.innerText = "Add";
        }
    }
});

// --- Images ---
async function fetchImages() {
    const tbody = document.getElementById('gallery-tbody');
    tbody.innerHTML = getSkeletonRows(5, 5);
    
    const q = query(collection(db, "images"), orderBy("createdAt", "desc"));
    try {
        const querySnapshot = await getDocs(q);
        
        tbody.innerHTML = '';
        
        if (querySnapshot.empty) {
            tbody.innerHTML = `
                <tr><td colspan="5" class="px-6 py-16 text-center text-gray-500 fade-up">
                    <i class="fas fa-images text-5xl mb-4 opacity-20"></i><br>
                    <p class="text-lg">No images yet</p>
                    <p class="text-sm">Upload your first masterpiece to the gallery.</p>
                </td></tr>`;
        }

        let delay = 0;
        querySnapshot.forEach((docSnap) => {
            const img = { id: docSnap.id, ...docSnap.data() };
            const catName = categoriesList.find(c => c.id === img.category_id)?.name || '-';
            const dateStr = img.createdAt ? new Date(img.createdAt.toMillis()).toLocaleDateString() : 'Just now';
            
            // Handle Video vs Image rendering
            const isVideo = img.type === 'video';
            const thumbSrc = img.thumbnailUrl || img.imageUrl;
            let typeBadge = isVideo 
                ? `<span class="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full ml-2 flex items-center gap-1 font-bold inline-flex"><i class="fas fa-video"></i> ${formatDuration(img.duration)}</span>`
                : `<span class="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full ml-2 flex items-center gap-1 font-bold inline-flex"><i class="fas fa-camera"></i> Image</span>`;

            const tr = document.createElement('tr');
            tr.className = "table-row gallery-row fade-up";
            tr.style.animationDelay = `${delay}ms`;
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap relative">
                    <div class="relative h-12 w-20 rounded shadow-sm overflow-hidden group">
                        <img src="${thumbSrc}" alt="${img.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy">
                        ${isVideo ? '<div class="absolute inset-0 bg-black/30 flex items-center justify-center"><i class="fas fa-play text-white/80 text-xs"></i></div>' : ''}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium img-title">
                    <div class="flex items-center">
                        <span class="truncate max-w-[150px]">${img.title || 'Untitled'}</span>
                        ${typeBadge}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${catName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dateStr}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 btn-edit-img btn-interactive" data-id="${img.id}" data-title="${img.title || ''}" data-cat="${img.category_id || ''}"><i class="fas fa-edit"></i></button>
                    <button class="text-red-600 hover:text-red-900 ml-4 btn-delete-img btn-interactive" data-id="${img.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
            delay += 30;
        });

        // Delete
        document.querySelectorAll('.btn-delete-img').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tr = e.currentTarget.closest('tr');
                if(await customConfirm('Delete Image?', 'Are you sure you want to remove this image from the gallery?')) {
                    try {
                        tr.classList.add('shrink-out');
                        await deleteDoc(doc(db, "images", e.currentTarget.dataset.id));
                        showSuccessPopup('Task Completed', 'Image removed successfully.');
                        setTimeout(fetchImages, 400);
                    } catch(err) {
                        showToast('error', 'Error deleting image.');
                    }
                }
            });
        });

        // Edit
        document.querySelectorAll('.btn-edit-img').forEach(btn => {
            btn.addEventListener('click', (e) => {
                openEditModal(e.currentTarget.dataset);
            });
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-red-500">Failed to load images.</td></tr>';
    }
}

// Live Search
document.getElementById('gallery-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#gallery-tbody tr.gallery-row');
    let hasMatches = false;
    rows.forEach(row => {
        const title = row.querySelector('.img-title')?.innerText.toLowerCase() || '';
        if (title.includes(query)) {
            row.style.display = '';
            row.classList.add('fade-up');
            hasMatches = true;
        } else {
            row.style.display = 'none';
            row.classList.remove('fade-up');
        }
    });
});

// Edit Modal Actions
document.getElementById('btn-cancel-edit').addEventListener('click', closeEditModal);

document.getElementById('btn-save-edit').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const id = document.getElementById('edit-image-id').value;
    const title = document.getElementById('edit-image-title').value;
    const category_id = document.getElementById('edit-image-category').value;
    
    btn.classList.add('btn-loading');
    btn.innerText = "Saving";
    
    try {
        await updateDoc(doc(db, "images", id), { title, category_id });
        showSuccessPopup('Task Completed', 'Changes saved successfully.');
        closeEditModal();
        fetchImages();
    } catch(err) {
        showToast('error', 'Failed to save changes.');
    } finally {
        btn.classList.remove('btn-loading');
        btn.innerText = "Save Changes";
    }
});

// ==========================================
// CLOUDINARY UPLOAD WIDGET & PREMIUM POST-PROCESSING
// ==========================================
let uploadedFilesData = [];

// Helper to format duration like 01:45
function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

document.getElementById('btn-cloudinary-upload').addEventListener('click', () => {
    const category_id = document.getElementById('upload-category').value;
    uploadedFilesData = []; // reset array for this batch

    const widget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CLOUD_NAME, 
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        multiple: true,
        resourceType: "auto", // Automatically detect image or video
        clientAllowedFormats: ["webp", "jpeg", "jpg", "png", "mp4", "mov"],
        maxImageFileSize: 10000000, // 10MB
        maxVideoFileSize: 500000000 // 500MB
    }, (error, result) => {
        if (!error && result && result.event === "success") { 
            const info = result.info;
            
            // Video duration validation
            if (info.resource_type === 'video' && info.duration && info.duration > 120) {
                window.showToast('error', `Video "${info.original_filename}" is longer than 2 minutes and was rejected.`);
                return;
            }
            
            uploadedFilesData.push(info);
        }
        
        // Listen for the widget to fully close
        if (!error && result && result.event === "close") {
            if (uploadedFilesData.length > 0) {
                // Trigger the Premium Post-Processing Overlay
                processUploadedFiles(uploadedFilesData, category_id);
            }
        }
    });
    
    widget.open();
});

async function processUploadedFiles(files, category_id) {
    const overlay = document.getElementById('processing-overlay');
    const card = document.getElementById('processing-card');
    const stagesUl = document.getElementById('processing-stages');
    const bar = document.getElementById('processing-bar');
    const pct = document.getElementById('processing-percent');
    const title = document.getElementById('processing-title');
    const subtitle = document.getElementById('processing-subtitle');
    const icon = document.getElementById('processing-icon');
    const iconContainer = document.getElementById('processing-icon-container');
    const errorActions = document.getElementById('processing-error-actions');
    const progressContainer = document.getElementById('processing-progress-container');
    const particles = document.getElementById('processing-particles');
    
    // Reset state
    errorActions.classList.add('hidden');
    progressContainer.classList.remove('hidden');
    stagesUl.innerHTML = '';
    bar.style.width = '0%';
    pct.innerText = '0%';
    icon.className = 'fas fa-camera retro-cam';
    iconContainer.className = 'w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-indigo-100 transition-all duration-500';
    title.innerText = 'Upload Complete';
    subtitle.innerText = 'Now preparing your masterpiece...';
    title.className = 'text-2xl font-bold text-gray-800 mb-2';
    particles.innerHTML = '';
    
    // Show Overlay
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        card.classList.remove('scale-95');
        card.classList.add('scale-100');
    });

    const addStage = (text, isCheck = false) => {
        const li = document.createElement('li');
        li.className = 'stage-item flex items-center';
        li.innerHTML = `<i class="fas ${isCheck ? 'fa-check text-green-500' : 'fa-circle-notch fa-spin text-indigo-400'} w-5 mr-3"></i> <span>${text}</span>`;
        stagesUl.appendChild(li);
        return li;
    };
    
    const updateStage = (li, isCheck) => {
        li.querySelector('i').className = `fas ${isCheck ? 'fa-check text-green-500' : 'fa-circle-notch fa-spin text-red-500'} w-5 mr-3`;
    };

    try {
        // Stage 1
        let stage1 = addStage('Media received from Cloudinary');
        await new Promise(r => setTimeout(r, 600));
        updateStage(stage1, true);
        bar.style.width = '20%'; pct.innerText = '20%';
        
        // Stage 2
        let stage2 = addStage('Optimizing media & generating thumbnails...');
        await new Promise(r => setTimeout(r, 800));
        updateStage(stage2, true);
        bar.style.width = '40%'; pct.innerText = '40%';
        
        // Stage 3
        let stage3 = addStage(`Saving ${files.length} item(s) to Gallery...`);
        let baseProgress = 40;
        let progressPerFile = 40 / files.length;
        
        for(let i=0; i<files.length; i++) {
            const file = files[i];
            
            // Determine type and thumbnail
            const isVideo = file.resource_type === 'video';
            const thumb = isVideo ? file.secure_url.replace(/\.[^/.]+$/, ".jpg") : file.secure_url;
            
            await addDoc(collection(db, "images"), {
                title: file.original_filename,
                category_id: category_id || null,
                imageUrl: file.secure_url,
                thumbnailUrl: thumb,
                type: isVideo ? 'video' : 'image',
                duration: isVideo ? (file.duration || 0) : null,
                publicId: file.public_id,
                createdAt: serverTimestamp()
            });
            baseProgress += progressPerFile;
            bar.style.width = `${Math.round(baseProgress)}%`;
            pct.innerText = `${Math.round(baseProgress)}%`;
            if(files.length === 1) await new Promise(r => setTimeout(r, 600)); 
        }
        updateStage(stage3, true);
        
        // Stage 4
        let stage5 = addStage('Refreshing Gallery data...');
        await fetchImages();
        updateStage(stage5, true);
        bar.style.width = '100%'; pct.innerText = '100%';
        
        // Completion
        await new Promise(r => setTimeout(r, 400));
        title.innerText = 'Successfully Published';
        title.className = 'text-2xl font-bold text-green-600 mb-2';
        subtitle.innerText = 'Your gallery is up to date.';
        icon.className = 'fas fa-check';
        iconContainer.className = 'w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-green-100 transition-all duration-500';
        iconContainer.style.animation = 'successPulse 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        
        for(let i=0; i<15; i++) {
            let p = document.createElement('div');
            p.className = 'particle';
            p.style.left = `${50 + (Math.random() * 60 - 30)}%`;
            p.style.top = `50%`;
            p.style.width = `${Math.random() * 6 + 4}px`;
            p.style.height = p.style.width;
            p.style.animationDuration = `${0.8 + Math.random()}s`;
            p.style.animationDelay = `${Math.random() * 0.2}s`;
            particles.appendChild(p);
        }

        showSuccessPopup('Task Completed', `${files.length} items published successfully.`);
        setTimeout(closeOverlay, 2500);

    } catch (err) {
        console.error(err);
        title.innerText = 'Upload Failed';
        title.className = 'text-2xl font-bold text-red-600 mb-2';
        subtitle.innerText = 'An error occurred while saving to Firestore.';
        icon.className = 'fas fa-times';
        iconContainer.className = 'w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-red-100 transition-all duration-500 shake';
        errorActions.classList.remove('hidden');
        
        const currentStage = stagesUl.lastElementChild;
        if(currentStage) updateStage(currentStage, false);
    }
    
    function closeOverlay() {
        overlay.classList.add('opacity-0');
        card.classList.remove('scale-100');
        card.classList.add('scale-95');
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }, 500);
    }
    
    document.getElementById('btn-processing-dismiss').onclick = closeOverlay;
}

// ==========================================
// TABS
// ==========================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if(btn.classList.contains('active')) return;

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const targetId = btn.dataset.tab;
        
        tabContents.forEach(c => {
            if(c.classList.contains('active')) {
                c.classList.remove('active');
                c.classList.add('fade-out');
                setTimeout(() => {
                    c.classList.remove('fade-out');
                    if (c.id === targetId) {
                        c.classList.add('active', 'fade-in');
                        setTimeout(() => c.classList.remove('fade-in'), 300);
                    }
                }, 300);
            } else if (c.id === targetId) {
                setTimeout(() => {
                    c.classList.add('active', 'fade-in');
                    setTimeout(() => c.classList.remove('fade-in'), 300);
                }, 300);
            }
        });
    });
});
