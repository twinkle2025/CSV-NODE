import Vue from 'vue';
import vueHeadful from 'vue-headful';
import VueProgressBar from 'vue-progressbar';
import VueRouter from 'vue-router';
import router from './router';
// import CKEditor from '@ckeditor/ckeditor5-vue';
import Editor from '@tinymce/tinymce-vue';

/**
 * Setup Progress Bar Options
 */
const progressOptions = {
    color: '#3fcf96',
    failedColor: '#e3342f',
    thickness: '3px',
    transition: {
        speed: '0.2s',
        opacity: '0.6s',
        termination: 300
    },
    autoRevert: true,
    location: 'top',
    inverse: false
}

/**
 * Setup Vue Plugins
 */
Vue.use(VueRouter);
Vue.component('vue-headful', vueHeadful);
Vue.use(VueProgressBar, progressOptions);
Vue.component('tinymce-editor', Editor);
// Vue.use( CKEditor );

import socket from './socket.io';
import Notification from './notify';

const app = new Vue({
    router,
    el: '#app',
    data: {
        title: null,
        uploads: {},
        oldOnBeforeUpload: null,
        cpuUsage: null,
        driveUsage: null,
        memoryUsage: null,
        socketState: false,
        elasticState: 'white',
        showNotificationRequest: false,
        mfa: {
            qrcode: null,
            secret: null,
        },
        version: null,
        window,
        registration: null,
    },
    computed: {
        pageTitle() {
            if (this.title === null || this.title.length === 0) {
                return 'Bastion';
            } else {
                return `${this.title} | Bastion`;
            }
        }
    },
    created () {
        this.$Progress.start();
        this.$router.beforeEach((to, from, next) => {
            if (to.meta.progress !== undefined) {
                let meta = to.meta.progress
                this.$Progress.parseMeta(meta)
              }
              this.$Progress.start();
              next();
        });
        this.$router.afterEach((to, from) => {
            this.$Progress.finish();
        });
    },
    mounted() {
        this.$nextTick(() => {
            const form = jQuery('form[action="/mfa/save"]');
            if (form.length > 0) {
                this.getSetMFAInformation();
            }
        })
        if ("Notification" in window) {
            if (Notification.permission === "default") {
                this.showNotificationRequest = true;
            }
        }
        this.oldOnBeforeUpload = window.onbeforeunload;
        this.updatePageTitleFromRoute(this.$route);
        this.$Progress.finish();
        this.$router.beforeEach((to, from, next) => {
            this.updatePageTitleFromRoute(to);
            next();
        });
        jQuery('.breadcrumb-line').removeClass('d-none');
        jQuery('.uploads-tracker').removeClass('d-none');
        socket.on('connect', () => {
            this.$nextTick(() => {
                this.socketState = true;
            })
        });
        socket.on('connect_error', () => {
            this.$nextTick(() => {
                this.socketState = false;
            })
            this.elasticState = 'white';
        });
        socket.on('connect_timeout', () => {
            this.$nextTick(() => {
                this.socketState = false;
            })
            this.elasticState = 'white';
        });
        socket.on('error', () => {
            this.$nextTick(() => {
                this.socketState = false;
            })
            this.elasticState = 'white';
        });
        socket.on('disconnect', () => {
            this.$nextTick(() => {
                this.socketState = false;
            })
            this.elasticState = 'white';
        });
        socket.on('reconnect', () => {
            this.$nextTick(() => {
                this.socketState = true;
            })
            this.elasticState = 'white';
        });
        socket.on('version', (version) => {
            this.socketState = true;
            if (null === this.version) {
                this.version = version;
            } else if (this.version !== version) {
                Notification.send('System Update Detected', 'Bastion has been updated. Please reload to ensure compatibility.');
                swal({
                    title: 'System Update Detected',
                    text: 'You are using an old version of the Bastion Interface. Please reload in order to ensure compatibility.',
                    type: 'warning',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-danger',
                    showCancelButton: true,
                    showConfirmButton: true,
                    confirmButtonText: 'Reload Now',
                    cancelButtonText: 'Reload Later',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                }).then((result) => {
                    if (result.value) {
                        window.location.reload();
                    }
                });
            }
        });
        socket.on('cpu-utilization', (percentage) => {
            this.cpuUsage = percentage;
            jQuery('.hide-before-loaded').removeClass('hide-before-loaded');
            this.socketState = true;
        });
        socket.on('disk-utilization', (percentage) => {
            this.driveUsage = percentage;
            jQuery('.hide-before-loaded').removeClass('hide-before-loaded');
            this.socketState = true;
        });
        socket.on('memory-utilization', (percentage) => {
            this.memoryUsage = percentage;
            jQuery('.hide-before-loaded').removeClass('hide-before-loaded');
            this.socketState = true;
        });
        socket.on('file-upload-started', (fileInfo) => {
            PNotify.success({
                title: 'File Upload Started',
                text: `File ${fileInfo.name} has started uploading`,
                type: 'success'
            });
        })
        socket.on('file-upload-progress', (fileInfo) => {
            if ('undefined' !== typeof(fileInfo.uploadId)) {
                this.uploads[fileInfo.uploadId] = fileInfo;
            }
            this.$forceUpdate();
        })
        socket.on('file-upload-aborted', (fileInfo) => {
            PNotify.info({
                title: 'File Upload Aborted',
                text: `Upload for ${fileInfo.name} was aborted`,
                type: 'info'
            });
            delete this.uploads[fileInfo.uploadId];
            this.$forceUpdate();
        })
        socket.on('file-upload-complete', (fileInfo) => {
            PNotify.success({
                title: 'File Upload Completed',
                text: `File ${fileInfo.name} has finished uploading`,
                type: 'success'
            });
            delete this.uploads[fileInfo.uploadId];
            this.$forceUpdate();
        })
        socket.on('file-upload-failed', (fileInfo) => {
            PNotify.danger({
                title: 'File Upload Failed',
                text: `File ${fileInfo.name} could not be saved.`,
                type: 'danger'
            });
            delete this.uploads[fileInfo.uploadId];
            this.$forceUpdate();
        })
        socket.on('elasticsearch-cluster-health', (status) => {
            this.elasticState = status;
        });
        this.loadServiceWorker();
    },
    methods: {
        async getSetMFAInformation() {
            this.mfa.qrcode = null;
            this.mfa.secret = null;
            try {
                const response = await axios.get('/mfa/generate');
                this.mfa.qrcode = response.data.body.url;
                this.mfa.secret = response.data.body.secret;
            } catch (error) {
                if ('undefined' !== typeof(error.response)) {
                    if (Array.isArray(error.response.data.errors)) {
                        for (let i = 0; i < error.response.data.errors.length; i++) {
                            const err = error.response.data.errors[i];
                            switch (typeof (err)) {
                                case 'object':
                                    PNotify.danger({
                                        title: 'Error',
                                        text: err.message,
                                        type: 'danger'
                                    }); 
                                    break;

                                case 'string':
                                    PNotify.danger({
                                        title: 'Error',
                                        text: err,
                                        type: 'danger'
                                    });
                                    break;
                            }
                        }
                    } else {
                        PNotify.danger({
                            title: 'Error',
                            text: error.response.data.error.message,
                            type: 'danger'
                        });    
                    }
                } else {
                    PNotify.danger({
                        title: 'Error',
                        text: 'An unrecoverable error occured. Please contact a system administrator.',
                        type: 'danger'
                    });
                }
            }
        },
        requestNotificationPermission() {
            Notification.requestPermission( (permission) => {
                this.showNotificationRequest = false;
                if (permission === "granted") {
                       console.log('Permission Granted');
                }
            });
        },
        reloadWindow: () => {
            window.location.reload();
        },
        updatePageTitleFromRoute(route){
            this.title = route.meta.title;
            if ('object' === typeof(route.params) && 'string' === typeof(route.params.type)) {
                const titleCase = require('title-case');
                this.title = this.title.replace('Marketing', titleCase(route.params.type));
            }
        },
        handleLoginSuccess: () => {
            window.location.reload();
            PNotify.success({
                title: 'You have been logged in successfully',
                text: 'Please wait while the page is reloaded.',
                type: 'success'
            }); 
        },
        logout: () => {
            window.axios.delete('/login').then( (response) => {
                window.location.reload();
                PNotify.success({
                    title: 'You have been logged out successfully',
                    text: 'Please wait while the page is reloaded.',
                    type: 'success'
                }); 
            })
            .catch( (error) => {
                handleAxiosError(error);
            });
        },
        lock: () => {
            window.axios.post('/lock').then( (response) => {
                window.location.reload();
            })
            .catch( (error) => {
                handleAxiosError(error);
            });
        },
        getFilePercentage(fileInfo) {
            let float;
            if ('undefined' !== typeof(fileInfo.wrote)) {
                float = fileInfo.wrote / fileInfo.size;
            } else {
                float = fileInfo.sent / fileInfo.size;
            }
            return parseFloat(float * 100).toFixed(0);
        },
        loadServiceWorker() {
            /**
             * Service Worker
             */
            function urlBase64ToUint8Array(base64String) {
                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                const base64 = (base64String + padding)
                .replace(/\-/g, '+')
                .replace(/_/g, '/');
            
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
            
                for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
            }
            
            if ('serviceWorker' in navigator ) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/service-worker.js').then(async (registration) => {
                    this.registration = registration;
                    Notification.registration = registration;
                    try {
                        const vapidResponse = await axios.get('/push/vapid');
                        const publicVapidKey = vapidResponse.data.body;
                        const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                        });
                        await axios.post('/push/subscribe', subscription);
                    } catch (error) {
                        console.warn(error);
                    }
                    }, function(err) {
                        console.log('ServiceWorker registration failed: ', err);
                    });
                });
            }
        }
    },
    watch: {
        '$route' () {
            jQuery('#navbar-navigation').collapse('hide');
            jQuery('#navbar-navigation .mega-menu-full .dropdown-toggle').dropdown('hide');
            jQuery('.modal-backdrop').remove();
            jQuery('body').removeClass('modal-open');
        }
    }
});

window.axios.interceptors.request.use(config => {
    app.$Progress.start(); // for every request start the progress
    return config;
});

window.axios.interceptors.response.use(response => {
    app.$Progress.finish(); // finish when a response is received
    return response;
}, error => {
    app.$Progress.fail(); // finish when a response is received
    return Promise.reject(error);
});

window.onbeforeunload = function() {
    if (Object.keys(app.uploads).length > 0) {
        return 'You still have pending uploads. Are you sure you want to abort them?';
    }
    return;
}

export default app;