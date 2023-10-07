<template>
    <div class="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
      <a v-for="(social) in socials" :key="social.name" :href="social.link" target="_blank">
        <component :is="getSocialIconComponent(social.name)" />
      </a>
    </div>
  </template>
  
  <script setup lang="ts">
  import { globalProperties } from '../lib/globals';
  import { defineAsyncComponent } from 'vue';
  import { capitalizeFirstLetter } from '../lib/utils';
  
  const socials = globalProperties.socials;
  
  interface SocialComponentMap {
    [key: string]: string;
  }
  
  // Create the socialComponentMap dynamically based on the socials array
  const socialComponentMap: SocialComponentMap = socials.reduce((map, social) => {
    map[social.name] = capitalizeFirstLetter(social.name) + 'Icon';
    return map;
  }, {} as SocialComponentMap);
  
  const getSocialIconComponent = (name: string) => {
    const component = socialComponentMap[name];
    if (component) {
      return defineAsyncComponent(() => import(`../assets/icons/${component}.vue`));
    }
    return null;
  };
  </script>
  