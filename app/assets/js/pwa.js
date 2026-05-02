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
function showNetworkToast(isOnline) {
    let toast = document.getElementById('network-status-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'network-status-toast';
        toast.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 999999;
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.02em;
            display: none;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(toast);
    }

    if (isOnline) {
        toast.style.background = '#10b981';
        toast.style.color = '#fff';
        toast.innerHTML = `<i class='bx bx-wifi'></i> Back Online — syncing...`;
        toast.style.display = 'flex';

        // Trigger Background Sync
        registerBackgroundSync();

        setTimeout(() => { toast.style.display = 'none'; }, 4000);
    } else {
        toast.style.background = '#ef4444';
        toast.style.color = '#fff';
        toast.innerHTML = `<i class='bx bx-wifi-off'></i> Offline Mode — cached data shown`;
        toast.style.display = 'flex';
    }
}

window.addEventListener('online',  () => showNetworkToast(true));
window.addEventListener('offline', () => showNetworkToast(false));

// Refresh badge on page load
window.addEventListener('DOMContentLoaded', () => {
    if (window.refreshOfflineBadge) window.refreshOfflineBadge();
});
