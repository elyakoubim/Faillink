// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import Profile from "../views/Profile.vue";
import Messages from "../views/Messages.vue";
import Notifications from "../views/Notifications.vue";
import Documents from "../views/Documents.vue";
import Analytics from "../views/Analytics.vue";
import Settings from "../views/Settings.vue";
import Index from '../views/Index.vue'

const routes = [
  { path: "/", name: "Index", component: Index ,children:[
  { path: "/dashboard", name: "Dashboard", component: Dashboard },
  { path: "/profile", name: "Profile", component: Profile },
  { path: "/messages", name: "Messages", component: Messages },
  { path: "/notifications", name: "Notifications", component: Notifications },
  { path: "/documents", name: "Documents", component: Documents },
  { path: "/analytics", name: "Analytics", component: Analytics },
  { path: "/settings", name: "Settings", component: Settings }
  ]},
  ,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
