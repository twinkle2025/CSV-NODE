<template>
    <select :id="`select-${this._uid}`" @change="updateValue()" v-model="content"><slot></slot></select>
</template>

<script>
    export default {
        props: ['value'],
        data() {
            return {
                obj: null,
                content: this.value,
                observer: null,
            }
        },
        mounted() {
            this.content = this.value;
            this.obj = jQuery(`#select-${this._uid}`);
            this.obj.chosen({
                search_contains: true,
                group_search: false,
                width: '100%',
                display_disabled_options: false,
                hide_results_on_select: false,
            });
            this.obj.on('change', this.updateValue);
            this.obj.on('change', () => {
                this.$emit('change');
            })
            this.observer = new MutationObserver(function(mutations) {
                this.obj.trigger('chosen:updated');
            }.bind(this));
            this.observer.observe(
                this.$el,
                { attributes: true, childList: true, characterData: true, subtree: true }
            );
        },
        beforeDestroy: function() {
            this.observer.disconnect();
            this.obj.chosen('destroy');
        },
        methods: {
            updateValue(e) {
                this.content = this.obj.val();
                this.$emit('input', this.content)
            }
        },
        watch: {
            value(newVal, oldVal) {
                this.content = newVal;
                this.$nextTick(() => {
                    this.obj.trigger('chosen:updated');
                });
            }
        }
    }
</script>