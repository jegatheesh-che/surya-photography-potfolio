document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Scroll Coin Logic
    const scrollCoin = document.getElementById('scroll-coin');
    if (scrollCoin) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            scrollCoin.style.transform = `rotateY(${scrolled * 0.5}deg)`;
        });
    }
});
