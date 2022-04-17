<template>
    <div class="content d-flex justify-content-center align-items-center">
        <!-- Container -->
        <div class="flex-fill">
            <!-- Error title -->
            <div class="text-center mb-3">
                <h1 class="error-title">404</h1>
                <h5>Oops, an error has occurred. Page not found!</h5>
            </div>
            <!-- /error title -->


            <!-- Error content -->
            <router-link to="/" class="btn btn-primary btn-block"><i class="icon-home4"></i> Dashboard</router-link>
            <!-- /error wrapper -->

        </div>
        <!-- /container -->

    </div>
</template>

<script>
    export default {
        mounted() {

        }
    }
</script>