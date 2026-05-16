(function () {
    'use strict';
    const PROMPT_KEY = 'eosas_push_prompted';

    function root() {
        const p = location.pathname.split('/').filter(Boolean);
        const app = ['app', 'api', 'includes', 'assets', 'public'];
        return (!p.length || app.includes(p[0])) ? '' : '/' + p[0];
    }
    const api = () => root() + '/api/';

    function b64ToUint8(s) {
        const pad = '='.repeat((4 - (s.length % 4)) % 4);
        const b = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
        const r = atob(b);
        const a = new Uint8Array(r.length);
        for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i);
        return a;
    }

    async function saveSub(sub) {
        const res = await fetch(api() + 'push.php?action=subscribe', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub)
        });
        const d = await res.json();
        if (!res.ok || d.status !== 'success') throw new Error(d.message || 'Subscribe failed');
    }

    async function subscribeToPush() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
        if ((await Notification.requestPermission()) !== 'granted') return false;

        const vk = await fetch(api() + 'push.php?action=vapid-key', { credentials: 'same-origin' }).then(r => r.json());
        if (vk.status !== 'success') throw new Error(vk.message || 'VAPID not configured');

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: b64ToUint8(vk.data.publicKey)
            });
        }
        await saveSub(sub.toJSON());
        return true;
    }

    function showBanner(onOk) {
        if (document.getElementById('push-enable-banner')) return;
        const el = document.createElement('div');
        el.id = 'push-enable-banner';
        el.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:999998;max-width:420px;background:#1e293b;color:#fff;padding:14px;border-radius:14px;font-size:13px;display:flex;flex-direction:column;gap:8px';
        const t = document.createElement('strong');
        t.textContent = 'Get alerts on your phone';
        const d = document.createElement('span');
        d.textContent = 'Announcements and violations even when the app is closed.';
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:8px';
        const yes = document.createElement('button');
        yes.textContent = 'Enable';
        yes.style.cssText = 'flex:1;padding:8px;border:none;border-radius:8px;background:#D4AF37;font-weight:700;cursor:pointer';
        const no = document.createElement('button');
        no.textContent = 'Not now';
        no.style.cssText = 'padding:8px 12px;border:1px solid #475569;background:transparent;color:#ccc;border-radius:8px;cursor:pointer';
        yes.onclick = async () => { yes.disabled = true; try { if (await onOk()) el.remove(); } catch (e) { console.warn(e); } yes.disabled = false; };
        no.onclick = () => { localStorage.setItem(PROMPT_KEY, '1'); el.remove(); };
        row.append(yes, no);
        el.append(t, d, row);
        document.body.appendChild(el);
    }

    async function init() {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

        const pp = new URLSearchParams(location.search).get('push_page');
        if (pp && typeof loadContent === 'function') setTimeout(() => loadContent(pp), 800);

        navigator.serviceWorker.addEventListener('message', e => {
            if (e.data?.type === 'PUSH_NAVIGATE' && e.data.page && typeof loadContent === 'function') loadContent(e.data.page);
        });

        if (Notification.permission === 'granted') {
            try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                if (sub) await saveSub(sub.toJSON());
            } catch (e) { console.warn(e); }
            return;
        }
        if (Notification.permission === 'denied' || localStorage.getItem(PROMPT_KEY)) return;
        setTimeout(() => showBanner(() => subscribeToPush()), 2500);
    }

    window.subscribeToPush = subscribeToPush;
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
