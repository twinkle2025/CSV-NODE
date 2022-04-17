<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Upload HasOffers Click Reports</h5>
        </div>
        <div class="card-body">
            <p class="mb-3">You may upload the following file types:</p>
            <ul>
                <li><code>.csv</code></li>
            </ul>
            <form action="/api/v1/marketing/utilities/hasoffers/upload-click-report" method="POST" class="dropzone dz-clickable" :id="`dropzone_${this._uid}`">
                <div class="dz-default dz-message">
                    <span>Drop files to upload <span>or CLICK</span></span>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
    import Dropzone from 'dropzone';
    Dropzone.autoDiscover = false;
    export default {
        mounted() {
            const dropzone = new Dropzone(`#dropzone_${this._uid}`, {
                paramName: "file",
                dictDefaultMessage: 'Drop files to upload <span>or CLICK</span>',
                maxFilesize: 100,
                acceptedFiles: 'text/csv',
                error: function(file, response) {
                    console.warn(file);
                    //console.warn(response);
                    if ('undefined' !== typeof(response)) {
                        if (Array.isArray(response.errors)) {
                            for (let i = 0; i < response.errors.length; i++) {
                                const err = response.errors[i];
                                switch (typeof (err)) {
                                    case 'object':
                                        $(file.previewElement).addClass("dz-error").find('.dz-error-message').text(err.message);
                                        break;

                                    case 'string':
                                        $(file.previewElement).addClass("dz-error").find('.dz-error-message').text(err);
                                        break;
                                }
                            }
                        }
                        else if ('undefined' !== typeof(response.error)) {
                            $(file.previewElement).addClass("dz-error").find('.dz-error-message').text(response.error.message);
                        }
                        else {
                            $(file.previewElement).addClass("dz-error").find('.dz-error-message').text(response);
                        }
                    } else {
                        $(file.previewElement).addClass("dz-error").find('.dz-error-message').text('An unrecoverable error occured. Please contact a system administrator.');
                    }
                }
            });
        }
    }
</script>