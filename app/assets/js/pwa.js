// ── Service Worker Registration ───────────────────────────────────────────────
// Must register from root scope so SW can intercept all requests
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Detect project root ('' on AWS root, '/OSAS_WEB' on local subfolder)
        const parts = window.location.pathname.split('/').filter(Boolean);
        const appDirs = ['app', 'api', 'includes', 'assets', 'public'];
        const root = (parts.length === 0 || appDirs.includes(parts[0])) ? '' : '/' + parts[0];

        navigator.serviceWorker.register(root + '/service-worker.js', { scope: root + '/' })
            .then(reg => {
                console.log('✅ SW registered, scope:', reg.scope);
                // Check for updates on every load
                reg.update();
            })
            .catch(err => console.warn('❌ SW registration failed:', err));
    });
}

// ── PWA Install Prompt ────────────────────────────────────────────────────────
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('installPWA');
    if (btn) btn.style.display = 'block';
});

document.addEventListener('click', async (e) => {
    if (!e.target.closest('#installPWA')) return;
    if (!deferredPrompt) return;
    const btn = document.getElementById('installPWA');
    if (btn) btn.style.display = 'none';
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed');
    deferredPrompt = null;
});

// ── Online / Offline Status Toast ─────────────────────────────────────────────
function showNetworkToast(isOnline) {
    let toast = document.getElementById('network-status-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'network-status-toast';
        toast.style.cssText = `
            position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
            padding: 10px 24px; border-radius: 24px; z-index: 99999;
            font-size: 13px; font-weight: 600; letter-spacing: 0.02em;
            display: none; align-items: center; gap: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(toast);
    }

    if (isOnline) {
        toast.style.background = '#10b981';
        toast.style.color = '#fff';
        toast.innerHTML = `<i class='bx bx-wifi'></i> Back Online`;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);

        // Sync any queued offline actions
        if (window.syncOfflineActions) window.syncOfflineActions();
    } else {
        toast.style.background = '#ef4444';
        toast.style.color = '#fff';
        toast.innerHTML = `<i class='bx bx-wifi-off'></i> You are Offline`;
        toast.style.display = 'flex';
    }
}

window.addEventListener('online',  () => showNetworkToast(true));
window.addEventListener('offline', () => showNetworkToast(false));
// Only show on actual status change, not on every page load
