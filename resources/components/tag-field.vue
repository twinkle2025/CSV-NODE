<template>
    <div class="form-group" :id="`tag-field-${this._uid}`">
        <label v-if="label">{{label}}</label>
        <input type="text" :name="name" class="form-control tokenfield" :value="content" :id="`tag-field-input-${this._uid}`">
    </div>
</template>

<script>
    export default {
        props: ['value', 'name', 'label'],
        data() {
            return {
                obj: null,
                content: this.value
            }
        },
        mounted() {
            this.content = this.value;
            this.obj = jQuery(`#tag-field-input-${this._uid}`);
            this.obj.tokenfield({
                autocomplete: {
                    source: async (request, response) => {
                        try {
                            const {data} = await axios.get(`/tags?term=${request.term}`);
                            response(data.body);
                        } catch (error) {
                            handleAxiosError(error);
                            response([]);
                        }
                    },
                    delay: 100
                }
            });
            this.obj.on('tokenfield:createdtoken', this.updateValue);
            this.obj.on('tokenfield:editedtoken', this.updateValue);
            this.obj.on('tokenfield:removedtoken', this.updateValue);
            this.initialize();
        },
        methods: {
            initialize() {
                const tags = (this.value !== null) ? this.value.split(',') : [];
                this.obj.tokenfield('setTokens', tags);
            },
            updateValue(e) {
                const tokens = this.obj.tokenfield('getTokens');
                const updatedArray = [];
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    updatedArray.push(token.value);
                }
                this.content = updatedArray.join(',').toLowerCase();
                this.$emit('input', this.content)
            }
        },
        watch: {
            value(newVal, oldVal) {
                this.initialize();
            }
        }
    }
</script>