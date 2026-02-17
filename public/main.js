// ========================
// VANDER KEY STORE — MAIN JS
// Handles Stripe checkout + key display
// ========================

const API = window.location.origin;

// ========================
// STRIPE CHECKOUT
// ========================
async function checkout(plan) {
    const btn = document.getElementById(plan === 'lifetime' ? 'btn-lifetime' : 'btn-monthly');
    const overlay = document.getElementById('loading-overlay');

    // Visual feedback
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-small"></span> Processing...';
    overlay.classList.remove('hidden');

    try {
        const res = await fetch(`${API}/api/create-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
        });

        const data = await res.json();

        if (data.url) {
            // Redirect to Stripe Checkout
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Failed to create checkout session');
        }
    } catch (e) {
        console.error('Checkout error:', e);
        overlay.classList.add('hidden');
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="credit-card"></i><span>Purchase ${plan === 'lifetime' ? 'Lifetime' : 'Monthly'}</span>`;
        lucide.createIcons();

        alert('⚠️ Payment system error. Please try again or contact support.');
    }
}

// ========================
// SUCCESS PAGE HANDLER
// ========================
async function handleSuccess() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) return;

    // Show the success modal
    const modal = document.getElementById('success-modal');
    modal.classList.remove('hidden');

    // Fetch the generated key
    try {
        const res = await fetch(`${API}/api/get-key?session_id=${sessionId}`);

        if (res.ok) {
            const data = await res.json();

            document.getElementById('generated-key').textContent = data.key;
            document.getElementById('purchased-plan').textContent =
                data.plan === 'lifetime' ? '♾️ Lifetime' : '📅 Monthly (30 Days)';

            // Animate the key reveal
            const keyDisplay = document.querySelector('.key-display');
            keyDisplay.classList.add('revealed');
        } else {
            document.getElementById('generated-key').textContent = 'Error — Contact Support';
        }
    } catch (e) {
        console.error('Key fetch error:', e);
        document.getElementById('generated-key').textContent = 'Error — Refresh Page';
    }
}

// ========================
// COPY KEY
// ========================
function copyKey() {
    const keyText = document.getElementById('generated-key').textContent;
    if (keyText.includes('Error') || keyText === 'Loading...') return;

    navigator.clipboard.writeText(keyText).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.innerHTML = '<i data-lucide="check"></i>';
        btn.classList.add('copied');
        lucide.createIcons();

        setTimeout(() => {
            btn.innerHTML = '<i data-lucide="copy"></i>';
            btn.classList.remove('copied');
            lucide.createIcons();
        }, 2000);
    });
}

// ========================
// MODAL CONTROLS
// ========================
function closeModal() {
    document.getElementById('success-modal').classList.add('hidden');
    // Clean URL
    window.history.replaceState({}, '', '/');
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('success-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// ========================
// SMOOTH SCROLL
// ========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ========================
// NAV SCROLL EFFECT
// ========================
window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// ========================
// INTERSECTION OBSERVER (Animate on scroll)
// ========================
const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Observe elements for animation
    document.querySelectorAll('.plan-card, .step-card, .security-banner').forEach(el => {
        observer.observe(el);
    });

    // Check for success redirect
    handleSuccess();
});
