/**
 * Guest landing: show latest announcements + poll for new ones (permission required for system notifs).
 */
(function () {
    'use strict';

    const POLL_MS = 60000;
    const SHOWN_KEY = 'eosas_ann_batch_shown';
    const LAST_ID_KEY = 'eosas_last_announcement_id';

    function apiBase() {
        const p = location.pathname.split('/').filter(Boolean);
        const d = ['app', 'api', 'includes', 'assets', 'public'];
        return ((!p.length || d.includes(p[0])) ? '' : '/' + p[0]) + '/api/';
    }

    function iconUrl() {
        const root = apiBase().replace(/\/api\/$/, '');
        return root + '/app/assets/img/default.png';
    }

    async function fetchLatest(limit) {
        const res = await fetch(apiBase() + 'announcements.php?action=active&limit=' + (limit || 5), {
            credentials: 'same-origin',
            cache: 'no-store'
        });
        const json = await res.json();
        let list = json.data || json.announcements || [];
        if (!Array.isArray(list)) list = [];
        list.sort((a, b) => Number(b.id) - Number(a.id));
        return list.slice(0, limit || 5);
    }

    async function showViaServiceWorker(title, body, tag, data) {
        if (Notification.permission !== 'granted') return;
        try {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(title, {
                body: body.substring(0, 200),
                icon: iconUrl(),
                badge: iconUrl(),
                tag: tag || 'eosas-ann',
                data: data || { type: 'announcement', url: '/' },
                renotify: true
            });
        } catch (e) {
            new Notification(title, { body, icon: iconUrl() });
        }
    }

    /** Show up to 5 latest announcements as phone notifications. */
    async function showLatestBatch(force) {
        if (Notification.permission !== 'granted') return;

        const list = await fetchLatest(5);
        if (!list.length) {
            if (force) {
                await showViaServiceWorker('E-OSAS', 'No active announcements right now.', 'eosas-empty');
            }
            return;
        }

        const batchKey = SHOWN_KEY + '_' + list.map(a => a.id).join('-');
        if (!force && sessionStorage.getItem(batchKey)) return;
        sessionStorage.setItem(batchKey, '1');

        for (let i = 0; i < list.length; i++) {
            const a = list[i];
            const body = (a.message || '').replace(/<[^>]+>/g, '').trim();
            await showViaServiceWorker(
                a.title || 'Campus announcement',
                body || 'Open E-OSAS for details.',
                'announcement-' + a.id,
                { type: 'announcement', id: a.id, page: 'user-page/announcements', url: '/' }
            );
            if (i < list.length - 1) await new Promise(r => setTimeout(r, 450));
        }

        localStorage.setItem(LAST_ID_KEY, String(list[0].id));
    }

    async function checkNewAnnouncement() {
        if (Notification.permission !== 'granted' || !navigator.onLine) return;
        try {
            const list = await fetchLatest(1);
            if (!list.length) return;
            const latest = list[0];
            const last = localStorage.getItem(LAST_ID_KEY);
            if (last && String(latest.id) === String(last)) return;

            const body = (latest.message || '').replace(/<[^>]+>/g, '').trim();
            await showViaServiceWorker(
                'New announcement',
                (latest.title || 'Campus update') + (body ? ': ' + body.substring(0, 80) : ''),
                'announcement-' + latest.id,
                { type: 'announcement', id: latest.id, url: '/' }
            );
            localStorage.setItem(LAST_ID_KEY, String(latest.id));
        } catch (e) {
            console.warn('Announcement poll:', e);
        }
    }

    function isInstalledPWA() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.matchMedia('(display-mode: fullscreen)').matches
            || navigator.standalone === true
            || (typeof window.isInstalledPWA === 'function' && window.isInstalledPWA());
    }

    function startGuestAnnouncementWatcher() {
        if (document.body.dataset.eosasPush !== 'guest') return;
        if (!isInstalledPWA()) return;
        if (Notification.permission === 'granted') {
            showLatestBatch(false);
            checkNewAnnouncement();
        }
        setInterval(checkNewAnnouncement, POLL_MS);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') checkNewAnnouncement();
        });
    }

    window.fetchLatestAnnouncements = fetchLatest;
    window.showLatestAnnouncementNotifications = (force) => showLatestBatch(!!force);
    window.startGuestAnnouncementWatcher = startGuestAnnouncementWatcher;

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(startGuestAnnouncementWatcher, 2500);
    });
})();
