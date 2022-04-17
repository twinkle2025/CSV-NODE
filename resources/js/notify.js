const ret = {
    registration: null,
    send: async function(title, body, actions, requireInteraction, silent) {
        if (this.registration instanceof ServiceWorkerRegistration) {
            return await this.registration.showNotification(title, {
                body,
                actions,
                icon: `/assets/images/favicon-96x96.png`,
                requireInteraction,
                silent
            });
        }
    }
}

// Notification.send = (title, body, actions, requireInteraction, silent) => {
//     return Notification(title, {
//         body,
//         actions,
//         icon: `${window.location.origin}/assets/images/favicon-96x96.png`,
//         renotify: true,
//         requireInteraction,
//         silent
//     });
// }

export default ret;