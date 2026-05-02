// ── Service Worker Registration ───────────────────────────────────────────────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const appDirs = ['app', 'api', 'includes', 'assets', 'public'];
        const root = (parts.length === 0 || appDirs.includes(parts[0])) ? '' : '/' + parts[0];

        navigator.serviceWorker.register(root + '/service-worker.js', { scope: root + '/' })
            .then(reg => {
                console.log('✅ SW registered, scope:', reg.scope);
                reg.update();

                // Listen for messages from SW (Background Sync trigger)
                navigator.serviceWorker.addEventListener('message', async (event) => {
                    if (event.data && event.data.type === 'SYNC_VIOLATIONS') {
                        if (window.syncOfflineActions) {
                            await window.syncOfflineActions();
                        }
                    }
                });
            })
            .catch(err => console.warn('❌ SW registration failed:', err));
    });
}

// ── Register Background Sync when coming back online ─────────────────────────
async function registerBackgroundSync() {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return;
    try {
        const reg = await navigator.serviceWorker.ready;
        await reg.sync.register('sync-violations');
        console.log('✅ Background sync registered');
    } catch (e) {
        console.warn('Background sync not available:', e);
        // Fallback: run sync directly
        if (window.syncOfflineActions) window.syncOfflineActions();
    }
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

// ── Online / Offline Status ───────────────────────────────────────────────────
let _offlineTimer = null;

function showNetworkToast(isOnline) {
    if (_offlineTimer) { clearTimeout(_offlineTimer); _offlineTimer = null; }

    let bar = document.getElementById('network-status-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'network-status-bar';
        bar.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 999999;
            height: 36px;
            display: none;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            box-shadow: 0 2px 16px rgba(0,0,0,0.2);
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(bar);
    }

    if (isOnline) {
        bar.style.background = 'linear-gradient(90deg,#059669,#10b981)';
        bar.style.color = '#fff';
        bar.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <circle cx="12" cy="20" r="1" fill="currentColor"/>
            </svg>
            Back Online
        `;
        bar.style.display = 'flex';
        bar.style.opacity = '1';
        registerBackgroundSync();
        setTimeout(() => {
            bar.style.opacity = '0';
            setTimeout(() => { bar.style.display = 'none'; bar.style.opacity = '1'; }, 300);
        }, 3000);
    } else {
        // 4-second delay before showing offline bar (avoids false positives)
        _offlineTimer = setTimeout(() => {
            if (navigator.onLine) return;
            bar.style.background = 'linear-gradient(90deg,#b91c1c,#ef4444)';
            bar.style.color = '#fff';
            bar.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
                    <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                    <circle cx="12" cy="20" r="1" fill="currentColor"/>
                </svg>
                Offline Mode &nbsp;·&nbsp; Cached data shown
            `;
            bar.style.display = 'flex';
            bar.style.opacity = '1';
        }, 4000);
    }
}

window.addEventListener('online',  () => showNetworkToast(true));
window.addEventListener('offline', () => showNetworkToast(false));

// Refresh badge on page load
window.addEventListener('DOMContentLoaded', () => {
    if (window.refreshOfflineBadge) window.refreshOfflineBadge();
    // Show offline bar on load if already offline (with 1s delay)
    if (!navigator.onLine) setTimeout(() => showNetworkToast(false), 1000);
});
