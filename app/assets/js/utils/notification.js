let notificationHideTimer = null;
let notificationRemoveTimer = null;

function showNotification(message, type = 'info', titleOrDuration = null, durationMaybe = null) {
  let title = null;
  let duration = 7000;

  if (typeof titleOrDuration === 'number') duration = titleOrDuration;
  if (typeof titleOrDuration === 'string') title = titleOrDuration;
  if (typeof durationMaybe === 'number') duration = durationMaybe;
  if (typeof durationMaybe === 'string' && title === null) title = durationMaybe;

  let notification = document.getElementById('notification-toast');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification-toast';
    notification.className = 'notification-toast';

    const icon = document.createElement('i');
    icon.className = 'bx';
    icon.dataset.role = 'notification-icon';

    const textWrap = document.createElement('div');
    textWrap.className = 'notification-text';

    const titleEl = document.createElement('div');
    titleEl.className = 'notification-title';
    titleEl.dataset.role = 'notification-title';

    const messageEl = document.createElement('div');
    messageEl.className = 'notification-message';
    messageEl.dataset.role = 'notification-message';

    textWrap.appendChild(titleEl);
    textWrap.appendChild(messageEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.type = 'button';
    closeBtn.innerHTML = "<i class='bx bx-x'></i>";
    closeBtn.addEventListener('click', () => {
      if (notificationHideTimer) clearTimeout(notificationHideTimer);
      if (notificationRemoveTimer) clearTimeout(notificationRemoveTimer);
      notification.remove();
    });

    notification.appendChild(icon);
    notification.appendChild(textWrap);
    notification.appendChild(closeBtn);

    document.body.appendChild(notification);
  }

  const iconEl = notification.querySelector('[data-role="notification-icon"]');
  const titleEl = notification.querySelector('[data-role="notification-title"]');
  const messageEl = notification.querySelector('[data-role="notification-message"]');

  if (iconEl) iconEl.className = `bx ${getNotificationIcon(type)}`;
  if (titleEl) {
    titleEl.textContent = title ? title : '';
    titleEl.style.display = title ? 'block' : 'none';
  }
  if (messageEl) messageEl.textContent = String(message ?? '');

  notification.classList.remove('notification-success', 'notification-error', 'notification-warning', 'notification-info', 'dark', 'hide');
  notification.classList.add(`notification-${type}`);
  
  // Add styles if not exists
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #333;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 20000;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        max-width: 420px;
        opacity: 0;
        transform: translateX(24px);
        transition: opacity 0.8s ease, transform 0.8s ease;
        pointer-events: auto;
      }
      .notification-toast.show {
        opacity: 1;
        transform: translateX(0);
      }
      .notification-toast.hide {
        opacity: 0;
        transform: translateX(24px);
      }
      .notification-toast.dark {
        background: #333;
        color: white;
      }
      .notification-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }
      .notification-title {
        font-weight: 700;
        font-size: 0.9rem;
        line-height: 1.2;
      }
      .notification-message {
        font-size: 0.85rem;
        line-height: 1.3;
        word-break: break-word;
      }
      .notification-success { border-left: 4px solid #10B981; }
      .notification-error { border-left: 4px solid #EF4444; }
      .notification-warning { border-left: 4px solid #F59E0B; }
      .notification-info { border-left: 4px solid #3B82F6; }
      .notification-close { background: none; border: none; cursor: pointer; padding: 0; }
    `;
    document.head.appendChild(styles);
  }

  // Apply dark mode if active
  if (window.darkMode) {
    notification.classList.add('dark');
  }

  if (notificationHideTimer) clearTimeout(notificationHideTimer);
  if (notificationRemoveTimer) clearTimeout(notificationRemoveTimer);

  requestAnimationFrame(() => {
    notification.classList.add('show');
  });
  
  notificationHideTimer = setTimeout(() => {
    if (!notification.parentElement) return;
    notification.classList.remove('show');
    notification.classList.add('hide');
    notificationRemoveTimer = setTimeout(() => notification.remove(), 850);
  }, duration);
}

function getNotificationIcon(type) {
  const icons = {
    success: 'bx-check-circle',
    error: 'bx-error-circle',
    warning: 'bx-error',
    info: 'bx-info-circle'
  };
  return icons[type] || icons.info;
}
