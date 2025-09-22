<template>
  <div
    :class="[
      'transition-all duration-300 ease-in-out bg-gradient-to-b from-sky-600 to-sky-700 shadow-xl',
      isSidebarOpen ? 'w-64' : 'w-16',
    ]"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-sky-500">
      <transition name="fade">
        <h1 v-if="isSidebarOpen" class="text-white text-xl font-bold">
          Faillink
        </h1>
      </transition>
      <button
        @click="$emit('toggle-sidebar')"
        class="p-2 rounded-lg hover:bg-sky-500 transition-colors duration-200 text-white"
      >
        <i
          :class="isSidebarOpen ? 'fas fa-times' : 'fas fa-bars'"
          class="w-5 h-5"
        ></i>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="mt-6">
      <router-link
        v-for="item in menuItems"
        :key="item.id"
        :to="item.path"
        class="w-full flex items-center px-4 py-3 text-left transition-all duration-200 group relative"
        :class="[
          route.path === item.path
            ? 'bg-sky-500 text-white shadow-lg'
            : 'text-sky-100 hover:bg-sky-500 hover:text-white',
        ]"
      >
        <i :class="item.icon" class="w-5 h-5 flex-shrink-0"></i>
        <transition name="fade">
          <span v-if="isSidebarOpen" class="ml-3 whitespace-nowrap">
            {{ item.label }}
          </span>
        </transition>
        <transition name="fade">
          <i
            v-if="route.path === item.path && isSidebarOpen"
            class="fas fa-chevron-right w-4 h-4 ml-auto"
          >
          </i>
        </transition>
        <!-- Tooltip for collapsed state -->
        <div v-if="!isSidebarOpen" class="tooltip">
          {{ item.label }}
        </div>
      </router-link>
    </nav>

    <!-- Footer -->
    <!-- <transition name="fade">
      <div v-if="isSidebarOpen" class="sidebar-footer">
        <div class="bg-sky-500 rounded-lg p-3 text-center">
          <p class="text-sky-100 text-sm">Need help?</p>
          <button class="text-white text-sm font-medium hover:underline">
            Contact Support
          </button>
        </div>
      </div>
    </transition> -->
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import { useRoute } from "vue-router";
const props = defineProps({
  menuItems: Array,
  isSidebarOpen: Boolean,
});
const emit = defineEmits(["toggle-sidebar"]);
const route = useRoute();
</script>

<style scoped>
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.sidebar-footer {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
}
.tooltip {
  position: absolute;
  left: 4rem;
  background-color: #1f2937;
  color: white;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
  z-index: 50;
  transition: opacity 0.2s;
}
.group:hover .tooltip {
  opacity: 1;
}
</style>
