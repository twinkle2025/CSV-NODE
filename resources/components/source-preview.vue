<template>
    <div class="d-flex">
        <a @click="toggleExpand()">
            <i v-if="!expanded" class="fas fa-expand-arrows-alt mr-2"></i>
            <i v-if="expanded" class="fas fa-compress mr-2"></i>
        </a>
        <pre class="flex-grow-1 p-0" v-if="!expanded">{{JSON.stringify(source)}}</pre>
        <pre class="flex-grow-1" v-if="expanded">{{JSON.stringify(source, null, 2)}}</pre>
    </div>
</template>

<script>
    export default {
        props: ['source'],
        data() {
            return {
                expanded: false,
            }
        },
        mounted() {
            
        },
        methods: {
            toggleExpand() {
                this.expanded = !(this.expanded);
            }
        }
    }
</script>