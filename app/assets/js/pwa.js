// Register Service Worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js")
            .then(() => console.log("SW Registered ✔"))
            .catch(err => console.log("SW Failed ❌", err));
    });
}


// PWA Install Handler
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById("installPWA");
    if (installBtn) {
        installBtn.style.display = "block";
    }
});

const installBtn = document.getElementById("installPWA");
if (installBtn) {
    installBtn.addEventListener("click", async () => {
        installBtn.style.display = "none";
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
    });
}

// Online/Offline Status Handling
function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    console.log("Network status:", isOnline ? "Online" : "Offline");
    
    // Create status indicator if it doesn't exist
    let statusToast = document.getElementById('offline-status-toast');
    if (!statusToast) {
        statusToast = document.createElement('div');
        statusToast.id = 'offline-status-toast';
        statusToast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 9999;
            transition: all 0.3s ease;
            font-weight: bold;
            display: none;
        `;
        document.body.appendChild(statusToast);
    }

    if (isOnline) {
        statusToast.textContent = "Back Online";
        statusToast.style.backgroundColor = "#4caf50";
        statusToast.style.color = "white";
        statusToast.style.display = "block";
        
        // Sync pending actions if online
        if (window.syncOfflineActions) {
            window.syncOfflineActions();
        }

        setTimeout(() => {
            statusToast.style.display = "none";
        }, 3000);
    } else {
        statusToast.textContent = "You are Offline";
        statusToast.style.backgroundColor = "#f44336";
        statusToast.style.color = "white";
        statusToast.style.display = "block";
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
window.addEventListener('DOMContentLoaded', updateOnlineStatus);
