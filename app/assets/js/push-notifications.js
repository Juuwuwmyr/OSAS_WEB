/**
 * Push: announcements = guest (no login, after install).
 *         violations = student only (after login, scope full).
 */
(function () {
    'use strict';

    const GUEST_PROMPT = 'eosas_guest_push_prompted';
    const STUDENT_PROMPT = 'eosas_student_push_prompted';
    const STYLE_ID = 'eosas-push-styles';

    function projectRoot() {
        const p = location.pathname.split('/').filter(Boolean);
        const dirs = ['app', 'api', 'includes', 'assets', 'public'];
        return (!p.length || dirs.includes(p[0])) ? '' : '/' + p[0];
    }

    function apiBase() {
        return projectRoot() + '/api/';
    }

    function isStudentApp() {
        return document.body.dataset.eosasPush === 'student'
            || /user_dashboard\.php/i.test(location.pathname);
    }

    function isGuestApp() {
        return document.body.dataset.eosasPush === 'guest'
            || (!isStudentApp() && (location.pathname === '/' || /index\.php$/i.test(location.pathname)));
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
          #eosas-push-overlay{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:16px}
          #eosas-push-modal{max-width:360px;width:100%;background:#1e293b;color:#fff;border-radius:16px;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.45)}
          #eosas-push-modal h3{margin:0 0 8px;font-size:18px}
          #eosas-push-modal p{margin:0 0 16px;font-size:14px;line-height:1.45;color:#cbd5e1}
          #eosas-push-modal .eosas-push-btns{display:flex;flex-direction:column;gap:10px}
          #eosas-push-modal button{min-height:48px;font-size:16px;border-radius:10px;border:none;touch-action:manipulation;cursor:pointer}
          #eosas-push-enable{background:#D4AF37;color:#111;font-weight:700}
          #eosas-push-later{background:transparent;color:#94a3b8;border:1px solid #475569}
        `;
        document.head.appendChild(s);
    }

    function toast(msg, ok) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;padding:12px 16px;border-radius:10px;color:#fff;font-size:13px;max-width:90vw;text-align:center;background:' + (ok ? '#16a34a' : '#dc2626');
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 5000);
    }

    function b64ToUint8(s) {
        const pad = '='.repeat((4 - (s.length % 4)) % 4);
        const b = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
        const r = atob(b);
        const a = new Uint8Array(r.length);
        for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i);
        return a;
    }

    async function getOrCreateSubscription() {
        const vkRes = await fetch(apiBase() + 'push.php?action=vapid-key', { credentials: 'same-origin' });
        const vk = await vkRes.json();
        if (!vkRes.ok || vk.status !== 'success') throw new Error(vk.message || 'Push not configured');

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: b64ToUint8(vk.data.publicKey)
            });
        }
        return sub;
    }

    async function saveSubscription(sub, scope) {
        const payload = Object.assign(sub.toJSON(), { scope });
        const res = await fetch(apiBase() + 'push.php?action=subscribe', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || data.status !== 'success') throw new Error(data.message || 'Subscribe failed');
    }

    async function subscribeWithScope(scope) {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            toast('Use Chrome and install the app for alerts.', false);
            return false;
        }
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
            toast('Tap Allow on the next screen, or enable in phone Settings.', false);
            return false;
        }
        const sub = await getOrCreateSubscription();
        await saveSubscription(sub, scope);
        return true;
    }

    async function upgradePushToStudent() {
        if (Notification.permission !== 'granted') return false;
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (!sub) return subscribeWithScope('full');

            const res = await fetch(apiBase() + 'push.php?action=upgrade', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub.toJSON())
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') return true;
            return subscribeWithScope('full');
        } catch (e) {
            console.warn('Push upgrade:', e);
            return false;
        }
    }

    function showEnableModal(mode) {
        if (document.getElementById('eosas-push-overlay')) return;
        injectStyles();

        const isGuest = mode === 'guest';
        const overlay = document.createElement('div');
        overlay.id = 'eosas-push-overlay';
        const modal = document.createElement('div');
        modal.id = 'eosas-push-modal';

        const title = document.createElement('h3');
        title.textContent = isGuest ? 'Campus announcements' : 'Violation alerts';
        const desc = document.createElement('p');
        desc.innerHTML = isGuest
            ? 'Get <strong>OSAS announcements</strong> on your phone—even without logging in. Tap Enable, then <strong>Allow</strong>.'
            : 'Also get alerts when <strong>you</strong> receive a violation (login required). Tap Enable, then <strong>Allow</strong>.';

        const btns = document.createElement('div');
        btns.className = 'eosas-push-btns';
        const yes = document.createElement('button');
        yes.id = 'eosas-push-enable';
        yes.textContent = 'Enable notifications';
        const no = document.createElement('button');
        no.id = 'eosas-push-later';
        no.textContent = 'Not now';

        const scope = isGuest ? 'announcements' : 'full';
        const promptKey = isGuest ? GUEST_PROMPT : STUDENT_PROMPT;

        const run = async (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            yes.disabled = true;
            yes.textContent = 'Please wait…';
            try {
                if (await subscribeWithScope(scope)) {
                    toast(isGuest ? 'You will get campus announcements.' : 'Announcements + violation alerts enabled.', true);
                    overlay.remove();
                }
            } catch (err) {
                toast(err.message || 'Failed', false);
            }
            yes.disabled = false;
            yes.textContent = 'Enable notifications';
        };

        yes.addEventListener('click', run, { passive: false });
        yes.addEventListener('touchend', run, { passive: false });
        no.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem(promptKey, '1');
            overlay.remove();
        });

        btns.append(yes, no);
        modal.append(title, desc, btns);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    async function syncGuestSubscription() {
        if (Notification.permission !== 'granted') return;
        try {
            const sub = await getOrCreateSubscription();
            await saveSubscription(sub, 'announcements');
        } catch (e) {
            console.warn('Guest push sync:', e);
        }
    }

    async function syncStudentSubscription() {
        if (Notification.permission !== 'granted') return;
        await syncGuestSubscription();
        await upgradePushToStudent();
    }

    async function initGuestPush() {
        if (!isGuestApp() || !('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            await syncGuestSubscription();
            return;
        }
        if (Notification.permission === 'denied') return;
        if (localStorage.getItem(GUEST_PROMPT)) return;

        setTimeout(() => showEnableModal('guest'), 2000);
    }

    async function initStudentPush() {
        if (!isStudentApp() || !('Notification' in window)) return;

        const pushPage = new URLSearchParams(location.search).get('push_page');
        if (pushPage && typeof window.loadContent === 'function') {
            setTimeout(() => window.loadContent(pushPage), 800);
        }

        navigator.serviceWorker.addEventListener('message', (e) => {
            if (e.data?.type === 'PUSH_NAVIGATE' && e.data.page && typeof window.loadContent === 'function') {
                window.loadContent(e.data.page);
            }
        });

        if (Notification.permission === 'granted') {
            await syncStudentSubscription();
            return;
        }
        if (Notification.permission === 'denied') return;

        if (!localStorage.getItem(GUEST_PROMPT) && !localStorage.getItem(STUDENT_PROMPT)) {
            setTimeout(() => showEnableModal('student'), 1500);
        } else if (!localStorage.getItem(STUDENT_PROMPT)) {
            setTimeout(() => showEnableModal('student'), 1500);
        }
    }

    window.subscribeToPush = () => subscribeWithScope(isStudentApp() ? 'full' : 'announcements');
    window.upgradePushToStudent = upgradePushToStudent;
    window.showPushEnableModal = (guest) => showEnableModal(guest ? 'guest' : 'student');
    window.initPushNotifications = initStudentPush;
    window.initGuestPush = initGuestPush;

    function boot() {
        if (isStudentApp()) initStudentPush();
        else if (isGuestApp()) initGuestPush();
    }

    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
