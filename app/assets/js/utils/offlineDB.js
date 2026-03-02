/**
 * OSAS Offline Database Manager (IndexedDB)
 */
const DB_NAME = 'OSAS_OFFLINE_DB';
const DB_VERSION = 1;
const STORE_VIOLATIONS = 'offline_violations';
const STORE_SYNC_QUEUE = 'sync_queue';

class OfflineDB {
    constructor() {
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store for caching violation data for offline viewing
                if (!db.objectStoreNames.contains(STORE_VIOLATIONS)) {
                    db.createObjectStore(STORE_VIOLATIONS, { keyPath: 'id' });
                }

                // Queue for actions performed while offline
                if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
                    db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'tempId', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async saveViolations(violations) {
        const db = await this.init();
        const tx = db.transaction(STORE_VIOLATIONS, 'readwrite');
        const store = tx.objectStore(STORE_VIOLATIONS);
        
        // Clear old data first
        store.clear();
        
        violations.forEach(v => store.put(v));
        return new Promise((resolve) => tx.oncomplete = resolve);
    }

    async getViolations() {
        const db = await this.init();
        const tx = db.transaction(STORE_VIOLATIONS, 'readonly');
        const store = tx.objectStore(STORE_VIOLATIONS);
        return new Promise((resolve) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
        });
    }

    async queueAction(action, data) {
        const db = await this.init();
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_SYNC_QUEUE);
        const item = {
            action,
            data,
            timestamp: Date.now()
        };
        store.add(item);
        return new Promise((resolve) => tx.oncomplete = resolve);
    }

    async getSyncQueue() {
        const db = await this.init();
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
        const store = tx.objectStore(STORE_SYNC_QUEUE);
        return new Promise((resolve) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
        });
    }

    async removeFromQueue(tempId) {
        const db = await this.init();
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_SYNC_QUEUE);
        store.delete(tempId);
        return new Promise((resolve) => tx.oncomplete = resolve);
    }
}

const offlineDB = new OfflineDB();
window.offlineDB = offlineDB;
