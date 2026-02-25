<template>
  <aside
    :class="[
      'bg-blue-800 text-white transition-all duration-300 ease-in-out',
      isOpen ? 'w-64' : 'w-0'
    ]"
    class="overflow-hidden"
  >
    <div class="flex flex-col h-full">
      <!-- User Info -->
      <div class="p-6 border-b border-blue-700">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span class="text-lg font-bold">{{ userInitial }}</span>
          </div>
          <div>
            <p class="font-semibold">{{ user?.nama_lengkap }}</p>
            <p class="text-sm text-blue-300">{{ user?.username }}</p>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <router-link
          to="/"
          class="flex items-center px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          :class="{ 'bg-blue-700': $route.path === '/' }"
        >
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </router-link>

        <!-- Data Produksi ASDP -->
        <div>
          <button
            @click="toggleProduksiMenu"
            class="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <div class="flex items-left">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Data Produksi ASDP
            </div>
            <svg
              :class="{ 'transform rotate-180': produksiMenuOpen }"
              class="w-4 h-4 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Submenu -->
          <div v-show="produksiMenuOpen" class="ml-4 mt-2 space-y-1">
            <router-link
              to="/produksi/input"
              class="flex items-center px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              :class="{ 'bg-blue-700': $route.path === '/produksi/input' }"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Input Produksi
            </router-link>

            <router-link
              to="/master-data"
              class="flex items-center px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              :class="{ 'bg-blue-700': $route.path.startsWith('/master-data') }"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Master Data
            </router-link>

            <router-link
              to="/produksi/data"
              class="flex items-center px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              :class="{ 'bg-blue-700': $route.path === '/produksi/data' }"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Data Produksi Harian
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Logout -->
      <div class="p-4 border-t border-blue-700">
        <button
          @click="logout"
          class="w-full flex items-center px-4 py-3 rounded-lg hover:bg-red-600 transition-colors"
        >
          <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

defineProps({
  isOpen: {
    type: Boolean,
    default: true
  }
});

const router = useRouter();
const user = ref(null);
const produksiMenuOpen = ref(true);

const userInitial = computed(() => {
  return user.value?.nama_lengkap?.charAt(0).toUpperCase() || 'U';
});

const toggleProduksiMenu = () => {
  produksiMenuOpen.value = !produksiMenuOpen.value;
};

const logout = () => {
  if (confirm('Apakah Anda yakin ingin logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }
};

onMounted(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    user.value = JSON.parse(userData);
  }
});
</script>
