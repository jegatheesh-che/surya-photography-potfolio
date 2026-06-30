import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    orderBy 
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// GALLERY LOGIC
// ==========================================
const galleryGrid = document.getElementById('gallery-grid');
const filtersContainer = document.getElementById('gallery-filters');

// Bento Grid Spans Pattern
const bentoPattern = [
    'col-span-2 row-span-2', // Large Square
    'col-span-1 row-span-1', // Small Square
    'col-span-1 row-span-1', // Small Square
    'col-span-2 md:col-span-1 row-span-2', // Vertical Rectangle
    'col-span-2 md:col-span-1 row-span-1', // Wide Rectangle
    'col-span-1 row-span-1', // Small Square
    'col-span-1 row-span-1', // Small Square
    'col-span-2 md:col-span-2 row-span-1'  // Wide Rectangle
];

let galleryData = [];
let categoriesList = [];

// Fallback data if Firebase is unconfigured
const fallbackData = [
    { src: 'assets/images/Copy of DSC00343.jpg', category: 'weddings' },
    { src: 'assets/images/Copy of DSC00602.jpg', category: 'portraits' },
    { src: 'assets/images/DSC00147.jpg', category: 'maternity' },
    { src: 'assets/images/DSC02092.jpg', category: 'lifestyle' }
];

async function initGallery() {
    try {
        if (firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY") {
            throw new Error("Firebase not configured");
        }

        // Fetch categories
        const catQ = query(collection(db, "categories"), orderBy("name"));
        const catSnap = await getDocs(catQ);
        categoriesList = [];
        catSnap.forEach(doc => {
            categoriesList.push({ id: doc.id, name: doc.data().name });
        });
        renderFilters(categoriesList);

        // Fetch images (ordered by createdAt DESC)
        const imgQ = query(collection(db, "images"), orderBy("createdAt", "desc"));
        const imgSnap = await getDocs(imgQ);
        galleryData = [];
        
        imgSnap.forEach(doc => {
            const data = doc.data();
            const cat = categoriesList.find(c => c.id === data.category_id);
            galleryData.push({
                src: data.imageUrl,
                thumb: data.thumbnailUrl || data.imageUrl,
                type: data.type || 'image',
                category: cat ? cat.name.toLowerCase() : 'uncategorized'
            });
        });

    } catch (e) {
        galleryData = fallbackData;
        // Keep hardcoded filters if fallback
    }

    if (galleryGrid) {
        renderGallery();
        setupFilterListeners();
    }
}

function renderFilters(categories) {
    if (!filtersContainer) return;
    
    let html = `<button class="filter-btn active text-[10px] uppercase tracking-widest font-main" data-filter="all">All</button>`;
    categories.forEach(cat => {
        html += `<button class="filter-btn text-[10px] uppercase tracking-widest font-main" data-filter="${cat.name.toLowerCase()}">${cat.name}</button>`;
    });
    
    filtersContainer.innerHTML = html;
}

function renderGallery(filter = 'all') {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';
    let delay = 0;
    let renderIndex = 0;
    
    galleryData.forEach((item) => {
        if (filter === 'all' || item.category === filter) {
            const spanClass = bentoPattern[renderIndex % bentoPattern.length];
            const isVideo = item.type === 'video';
            const itemHtml = `
                <div class="bento-item photo-reveal ${spanClass}" style="transition-delay: ${delay}ms;" onclick="openLightbox('${item.src}', '${item.type}')">
                    <img src="${item.thumb || item.src}" alt="${item.category}" loading="lazy">
                    ${isVideo ? '<div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors"><div class="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg backdrop-filter"><i class="fas fa-play text-lg ml-1"></i></div></div>' : ''}
                    <div class="overlay"></div>
                </div>
            `;
            galleryGrid.insertAdjacentHTML('beforeend', itemHtml);
            delay += 50;
            renderIndex++;
        }
    });
    
    // Lazy loading animation observer
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    setTimeout(() => {
        document.querySelectorAll('.photo-reveal').forEach(el => observer.observe(el));
    }, 100);
}

function setupFilterListeners() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            galleryGrid.style.opacity = '0';
            setTimeout(() => {
                renderGallery(btn.getAttribute('data-filter'));
                galleryGrid.style.opacity = '1';
            }, 400);
        });
    });
    galleryGrid.style.transition = 'opacity 0.4s ease';
}

// ==========================================
// LIGHTBOX
// ==========================================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxVideo = document.getElementById('lightbox-video');
const lightboxClose = document.getElementById('lightbox-close');

window.openLightbox = function(src, type = 'image') {
    if (lightbox) {
        if (type === 'video' && lightboxVideo) {
            lightboxImg.classList.add('hidden');
            lightboxVideo.classList.remove('hidden');
            lightboxVideo.src = src;
        } else if (lightboxImg) {
            lightboxVideo?.classList.add('hidden');
            lightboxImg.classList.remove('hidden');
            lightboxImg.src = src;
        }
        
        lightbox.classList.remove('hidden');
        lightbox.classList.add('flex');
        setTimeout(() => {
            lightbox.style.opacity = '1';
        }, 10);
    }
}

window.closeLightbox = function() {
    if (lightbox) {
        lightbox.style.opacity = '0';
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            // Pause video and clear src to stop buffering
            if (lightboxVideo) {
                lightboxVideo.pause();
                lightboxVideo.src = '';
            }
        }, 300);
    }
}

if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
}

initGallery();
