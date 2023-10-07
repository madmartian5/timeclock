<template>
    <NavBar />
    <div class="container mx-auto">
        <router-view></router-view>
    </div>
    <Footer />
</template>

<script setup lang="ts">
    import Footer from './components/Footer.vue'
    import NavBar from './components/NavBar.vue'

// If you need any router-specific logic or hooks in App.vue, you'd import them here.
// Otherwise, you can leave this section empty or remove it.
</script>

<style>
/* Global styles for your app */
</style>
