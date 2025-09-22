<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar
      :menu-items="menuItems"
      :active-item="activeItem"
      :is-sidebar-open="isSidebarOpen"
      @toggle-sidebar="toggleSidebar"
      @set-active-item="setActiveItem"
    />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-semibold text-gray-800">
            {{ currentContent.title }}
          </h2>
          <div class="flex items-center space-x-4">
            <div class="relative">
              <i
                class="fas fa-bell w-5 h-5 text-gray-600 hover:text-sky-600 cursor-pointer transition-colors"
              ></i>
              <span class="notification-badge"> 3 </span>
            </div>
            <div
              class="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center"
            >
              <i class="fas fa-user w-4 h-4 text-sky-600"></i>
            </div>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto p-6">
        <div class="max-w-4xl mx-auto">
          <div class="card mb-6 p-2 shadow-sm border border-gray-200 rounded-lg ">
              <router-view></router-view>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import Sidebar from "../components/Sidebar.vue";

export default {
  name: "FaillinkIndex",
  components: { Sidebar },
  setup() {
    const activeItem = ref("dashboard");
    const isSidebarOpen = ref(true);

    const menuItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "fas fa-home",
        path: "/dashboard",
      },
      {
        id: "profile",
        label: "Profile",
        icon: "fas fa-user",
        path: "/profile",
      },
      {
        id: "messages",
        label: "Messages",
        icon: "fas fa-envelope",
        path: "/messages",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: "fas fa-bell",
        path: "/notifications",
      },
      {
        id: "documents",
        label: "Documents",
        icon: "fas fa-file-text",
        path: "/documents",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: "fas fa-chart-bar",
        path: "/analytics",
      },
      {
        id: "settings",
        label: "Settings",
        icon: "fas fa-cog",
        path: "/settings",
      },
    ];

    const contentData = {
      dashboard: {
        title: "Dashboard",
        content:
          "Welcome to your Faillink dashboard! Here you can see an overview of all your activities, key metrics, and important updates at a glance.",
      },
      profile: {
        title: "Profile",
        content:
          "Manage your profile information, update your personal details, upload your avatar, and customize your preferences to make Faillink work best for you.",
      },
      messages: {
        title: "Messages",
        content:
          "View and manage all your messages in one place. Stay connected with your team members, clients, and collaborators efficiently.",
      },
      notifications: {
        title: "Notifications",
        content:
          "Stay up to date with all your notifications, alerts, and important updates. Never miss anything important with our smart notification system.",
      },
      documents: {
        title: "Documents",
        content:
          "Access, organize, and manage all your documents in one centralized location. Upload, share, and collaborate on files seamlessly.",
      },
      analytics: {
        title: "Analytics",
        content:
          "View detailed analytics and insights about your project performance, user engagement, and key metrics to make data-driven decisions.",
      },
      settings: {
        title: "Settings",
        content:
          "Configure your application settings, manage your account preferences, set up integrations, and customize Faillink to suit your workflow.",
      },
    };

    const currentContent = computed(() => {
      return contentData[activeItem.value] || contentData.dashboard;
    });

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value;
    };

    const setActiveItem = (itemId) => {
      activeItem.value = itemId;
    };

    const getCurrentIcon = () => {
      const currentItem = menuItems.find(
        (item) => item.id === activeItem.value
      );
      return currentItem ? currentItem.icon : "fas fa-home";
    };

    onMounted(() => {
      // Component initialization code here
      console.log("Faillink Sidebar mounted successfully");
    });

    return {
      activeItem,
      isSidebarOpen,
      menuItems,
      currentContent,
      toggleSidebar,
      setActiveItem,
      getCurrentIcon,
    };
  },
};
</script>

<style scoped>
/* Notification Badge */
.notification-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background-color: #ef4444;
  color: white;
  font-size: 0.75rem;
  border-radius: 9999px;
  height: 1rem;
  width: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Content Cards */
.content-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e0f2fe;
  transition: box-shadow 0.2s;
}
.content-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
