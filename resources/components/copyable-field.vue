<template>
    <div class="input-group" :id="`${this._uid}`">
        <input :type="type" :name="name" class="form-control" :value="content" :id="`input-${this._uid}`" @change="updateValue()" :readonly="readonly">
        <div class="input-group-append">
            <button class="btn btn-outline-secondary copy-button" type="button" :id="`button-${this._uid}`" :data-clipboard-target="`#input-${this._uid}`"><i class="icon-copy2"></i></button>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['value', 'type', 'name', 'readonly'],
        data() {
            return {
                content: this.value,
                clipboard: null,
            }
        },
        mounted() {
            this.content = this.value;
            this.clipboard = new ClipboardJS(`#button-${this._uid}`, {
                container: document.getElementById(`${this._uid}`),
                text: (trigger) => {
                    return this.content;
                }
            });
            this.clipboard.on('success', function(e) {
                PNotify.success({
                    title: 'Copied to Clipboard',
                    text: `The text has been copied to your clipboard successfully.`,
                    type: 'success'
                });
            });
            this.clipboard.on('error', function(e) {
                PNotify.danger({
                    title: 'Failed to Copy',
                    text: 'Failed to copy to clipboard. Your browser may not support copying via script. Please copy and paste manually.',
                    type: 'danger'
                });
            });
        },
        methods: {
            updateValue(e) {
                this.$emit('input', this.content)
            }
        },
        beforeDestroy() {
            this.clipboard.destroy();
        },
        watch: {
            value(newVal, oldVal) {
                this.content = newVal;
            }
        }
    }
</script>