<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Data Produksi Harian</h1>

    <!-- Filter Panel -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">
        Filter & Input Data
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Perusahaan
          </label>
          <MultiSelect
            v-model="filter.perusahaan_id"
            :options="perusahaan"
            label="Perusahaan"
            valueKey="perusahaan_id"
            labelKey="nama_perusahaan"
            @update:modelValue="onPerusahaanFilterChange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Kapal
          </label>
          <MultiSelect
            v-model="filter.kapal_id"
            :options="filteredKapalOptions"
            label="Kapal"
            valueKey="kapal_id"
            labelKey="nama_kapal"
            @update:modelValue="onKapalFilterChange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Pelabuhan Asal
          </label>
          <MultiSelect
            v-model="filter.pelabuhan_asal_id"
            :options="pelabuhan"
            label="Pelabuhan Asal"
            valueKey="pelabuhan_id"
            labelKey="nama_pelabuhan"
            @update:modelValue="onPelabuhanAsalFilterChange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Rute
          </label>
          <MultiSelect
            v-model="filter.rute_id"
            :options="filteredRuteOptions"
            label="Rute"
            valueKey="rute_id"
            labelKey="nama_rute"
            @update:modelValue="onRuteFilterChange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Shift
          </label>
          <MultiSelect
            v-model="filter.shift"
            :options="shiftOptions"
            label="Shift"
            valueKey="value"
            labelKey="label"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Regu
          </label>
          <MultiSelect
            v-model="filter.regu"
            :options="reguOptions"
            label="Regu"
            valueKey="value"
            labelKey="label"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Dari
          </label>
          <input
            v-model="filter.tanggal_dari"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Sampai
          </label>
          <input
            v-model="filter.tanggal_sampai"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div class="flex justify-end space-x-2 mt-6">
        <button
          @click="resetFilter"
          class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          Reset
        </button>
        <button
          @click="loadData"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Cari
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <!-- Dropdown Per Halaman -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center">
          <label class="text-sm text-gray-700 mr-2">Tampilkan:</label>
          <select
            v-model="perPage"
            @change="onPerPageChange"
            class="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="9999999">Semua</option>
          </select>
          <span class="text-sm text-gray-700 ml-2">data</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-blue-600">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                No
              </th>

              <th
                @click="toggleSort('tanggal_produksi')"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700"
              >
                <div class="flex items-center">
                  Tanggal
                  <span class="ml-2">
                    <span
                      v-if="
                        sortColumn === 'tanggal_produksi' &&
                        sortDirection === 'asc'
                      "
                      >↑</span
                    >
                    <span
                      v-else-if="
                        sortColumn === 'tanggal_produksi' &&
                        sortDirection === 'desc'
                      "
                      >↓</span
                    >
                    <span v-else class="text-blue-200">↕</span>
                  </span>
                </div>
              </th>

              <th
                @click="toggleSort('nama_perusahaan')"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700"
              >
                <div class="flex items-center">
                  Perusahaan
                  <span class="ml-2">
                    <span
                      v-if="
                        sortColumn === 'nama_perusahaan' &&
                        sortDirection === 'asc'
                      "
                      >↑</span
                    >
                    <span
                      v-else-if="
                        sortColumn === 'nama_perusahaan' &&
                        sortDirection === 'desc'
                      "
                      >↓</span
                    >
                    <span v-else class="text-blue-200">↕</span>
                  </span>
                </div>
              </th>

              <th
                @click="toggleSort('nama_kapal')"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700"
              >
                <div class="flex items-center">
                  Kapal
                  <span class="ml-2">
                    <span
                      v-if="
                        sortColumn === 'nama_kapal' && sortDirection === 'asc'
                      "
                      >↑</span
                    >
                    <span
                      v-else-if="
                        sortColumn === 'nama_kapal' && sortDirection === 'desc'
                      "
                      >↓</span
                    >
                    <span v-else class="text-blue-200">↕</span>
                  </span>
                </div>
              </th>

              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Rute
              </th>

              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Shift
              </th>

              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Regu
              </th>

              <th
                @click="toggleSort('total_penumpang')"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700"
              >
                <div class="flex items-center">
                  Penumpang
                  <span class="ml-2">
                    <span
                      v-if="
                        sortColumn === 'total_penumpang' &&
                        sortDirection === 'asc'
                      "
                      >↑</span
                    >
                    <span
                      v-else-if="
                        sortColumn === 'total_penumpang' &&
                        sortDirection === 'desc'
                      "
                      >↓</span
                    >
                    <span v-else class="text-blue-200">↕</span>
                  </span>
                </div>
              </th>

              <th
                @click="toggleSort('total_kendaraan')"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700"
              >
                <div class="flex items-center">
                  Kendaraan
                  <span class="ml-2">
                    <span
                      v-if="
                        sortColumn === 'total_kendaraan' &&
                        sortDirection === 'asc'
                      "
                      >↑</span
                    >
                    <span
                      v-else-if="
                        sortColumn === 'total_kendaraan' &&
                        sortDirection === 'desc'
                      "
                      >↓</span
                    >
                    <span v-else class="text-blue-200">↕</span>
                  </span>
                </div>
              </th>

              <th
                @click="toggleSort('total_pendapatan')"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700"
              >
                <div class="flex items-center">
                  Total Pendapatan
                  <span class="ml-2">
                    <span
                      v-if="
                        sortColumn === 'total_pendapatan' &&
                        sortDirection === 'asc'
                      "
                      >↑</span
                    >
                    <span
                      v-else-if="
                        sortColumn === 'total_pendapatan' &&
                        sortDirection === 'desc'
                      "
                      >↓</span
                    >
                    <span v-else class="text-blue-200">↕</span>
                  </span>
                </div>
              </th>

              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
              >
                Aksi
              </th>
            </tr>
          </thead>

          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="paginatedData.length === 0">
              <td colspan="11" class="px-6 py-8 text-center text-gray-500">
                Tidak ada data produksi. Silakan ubah filter atau tambah data
                baru.
              </td>
            </tr>
            <tr v-for="(item, index) in paginatedData" :key="item.produksi_id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ (currentPage - 1) * perPage + index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(item.tanggal_produksi) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.nama_perusahaan }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.nama_kapal }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.nama_rute }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.shift }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.regu }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.total_penumpang }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.total_kendaraan }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Rp {{ formatNumber(item.total_pendapatan) }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2"
              >
                <button
                  @click="viewDetail(item)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  Detail
                </button>
                <button
                  @click="deleteItem(item)"
                  class="text-red-600 hover:text-red-900"
                >
                  Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Navigation -->
      <div
        v-if="perPage < 9999999"
        class="px-6 py-4 border-t border-gray-200 flex items-center justify-between"
      >
        <!-- Info -->
        <div class="text-sm text-gray-700">
          Menampilkan {{ startIndex }} - {{ endIndex }} dari
          {{ totalData }} data
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center space-x-2">
          <!-- First Page -->
          <button
            @click="goToPage(1)"
            :disabled="currentPage === 1"
            :class="[
              'px-3 py-1 border rounded-lg',
              currentPage === 1
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50',
            ]"
          >
            «
          </button>

          <!-- Previous Page -->
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'px-3 py-1 border rounded-lg',
              currentPage === 1
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50',
            ]"
          >
            ‹
          </button>

          <!-- Page Numbers -->
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-3 py-1 border rounded-lg',
              page === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50',
            ]"
          >
            {{ page }}
          </button>

          <!-- Next Page -->
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'px-3 py-1 border rounded-lg',
              currentPage === totalPages
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50',
            ]"
          >
            ›
          </button>

          <!-- Last Page -->
          <button
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
            :class="[
              'px-3 py-1 border rounded-lg',
              currentPage === totalPages
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50',
            ]"
          >
            »
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="showDetailModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-semibold">Detail Produksi</h2>
          <button
            @click="closeDetailModal"
            class="text-gray-500 hover:text-gray-700"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div v-if="selectedProduksi">
          <!-- Header Info -->
          <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">Tanggal</p>
                <p class="font-semibold">
                  {{ formatDate(selectedProduksi.tanggal_produksi) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Perusahaan</p>
                <p class="font-semibold">
                  {{ selectedProduksi.nama_perusahaan }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Kapal</p>
                <p class="font-semibold">{{ selectedProduksi.nama_kapal }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Rute</p>
                <p class="font-semibold">{{ selectedProduksi.nama_rute }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Pelabuhan Asal</p>
                <p class="font-semibold">
                  {{ selectedProduksi.nama_pelabuhan_asal }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Pelabuhan Tujuan</p>
                <p class="font-semibold">
                  {{ selectedProduksi.nama_pelabuhan_tujuan }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Shift / Regu</p>
                <p class="font-semibold">
                  {{ selectedProduksi.shift }} / {{ selectedProduksi.regu }}
                </p>
              </div>
            </div>
          </div>

          <!-- Detail Penumpang -->
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Detail Ekonomi</h3>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                  >
                    Kategori
                  </th>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                  >
                    Jumlah
                  </th>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                  >
                    Tarif
                  </th>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                  >
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr
                  v-for="p in selectedProduksi.penumpang"
                  :key="p.produksi_penumpang_id"
                >
                  <td class="px-4 py-2 text-sm">{{ p.nama_kategori }}</td>
                  <td class="px-4 py-2 text-sm">{{ p.jumlah }}</td>
                  <td class="px-4 py-2 text-sm">
                    Rp {{ formatNumber(p.tarif) }}
                  </td>
                  <td class="px-4 py-2 text-sm">
                    Rp {{ formatNumber(p.subtotal) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="3" class="px-4 py-2 text-sm font-semibold">
                    Total
                  </td>
                  <td class="px-4 py-2 text-sm font-semibold">
                    Rp
                    {{
                      formatNumber(selectedProduksi.total_pendapatan_penumpang)
                    }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Detail Kendaraan -->
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Detail Kendaraan</h3>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                  >
                    Golongan
                  </th>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                  >
                    Tipe
                  </th>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                  >
                    Jumlah
                  </th>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                  >
                    Tarif
                  </th>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                  >
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr
                  v-for="k in selectedProduksi.kendaraan"
                  :key="k.produksi_kendaraan_id"
                >
                  <td class="px-4 py-2 text-sm">{{ k.nomor_golongan }}</td>
                  <td class="px-4 py-2 text-sm">{{ k.tipe_muatan || "-" }}</td>
                  <td class="px-4 py-2 text-sm">{{ k.jumlah }}</td>
                  <td class="px-4 py-2 text-sm">
                    Rp {{ formatNumber(k.tarif) }}
                  </td>
                  <td class="px-4 py-2 text-sm">
                    Rp {{ formatNumber(k.subtotal) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="4" class="px-4 py-2 text-sm font-semibold">
                    Total
                  </td>
                  <td class="px-4 py-2 text-sm font-semibold">
                    Rp
                    {{
                      formatNumber(selectedProduksi.total_pendapatan_kendaraan)
                    }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Summary -->
          <div class="bg-blue-50 p-4 rounded-lg mb-4">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-sm text-gray-600">Total Penumpang</p>
                <p class="text-xl font-bold text-blue-600">
                  {{ selectedProduksi.total_penumpang }} orang
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Kendaraan</p>
                <p class="text-xl font-bold text-blue-600">
                  {{ selectedProduksi.total_kendaraan }} unit
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Pendapatan</p>
                <p class="text-xl font-bold text-blue-600">
                  Rp {{ formatNumber(selectedProduksi.total_pendapatan) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Audit Info -->
          <div class="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-gray-600">Dibuat oleh</p>
                <p class="font-semibold">
                  {{ selectedProduksi.created_by_user?.nama_lengkap }} ({{
                    selectedProduksi.created_by_user?.username
                  }})
                </p>
                <p class="text-gray-500 text-xs">
                  {{ formatDateTime(selectedProduksi.created_at) }}
                </p>
              </div>
              <div v-if="selectedProduksi.updated_by">
                <p class="text-gray-600">Diupdate oleh</p>
                <p class="font-semibold">
                  {{ selectedProduksi.updated_by_user?.nama_lengkap }} ({{
                    selectedProduksi.updated_by_user?.username
                  }})
                </p>
                <p class="text-gray-500 text-xs">
                  {{ formatDateTime(selectedProduksi.updated_at) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-2">
            <button
              @click="closeDetailModal"
              class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Tutup
            </button>
            <button
              @click="editProduksi"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../../services/api";
import MultiSelect from "../../components/MultiSelect.vue";

const router = useRouter();

const produksi = ref([]);
const perusahaan = ref([]);
const kapal = ref([]);
const pelabuhan = ref([]);
const rute = ref([]);

const filter = ref({
  tanggal_dari: "",
  tanggal_sampai: "",
  perusahaan_id: [],
  kapal_id: [],
  pelabuhan_asal_id: [],
  rute_id: [],
  shift: [],
  regu: [],
});

const shiftOptions = [
  { value: "pagi", label: "Pagi" },
  { value: "malam", label: "Malam" },
];

const reguOptions = [
  { value: "regu 1", label: "Regu 1" },
  { value: "regu 2", label: "Regu 2" },
  { value: "regu 3", label: "Regu 3" },
];

const showDetailModal = ref(false);
const selectedProduksi = ref(null);
const sortColumn = ref(null);
const sortDirection = ref(null);
const currentPage = ref(1);
const perPage = ref(10);

const filteredKapalOptions = computed(() => {
  if (filter.value.perusahaan_id.length === 0) {
    return kapal.value;
  }
  return kapal.value.filter((k) =>
    filter.value.perusahaan_id.includes(k.perusahaan_id),
  );
});

const filteredRuteOptions = computed(() => {
  if (filter.value.pelabuhan_asal_id.length === 0) {
    return rute.value;
  }
  return rute.value.filter((r) =>
    filter.value.pelabuhan_asal_id.includes(r.pelabuhan_asal_id),
  );
});

const sortedProduksi = computed(() => {
  if (!sortColumn.value) return produksi.value;

  return [...produksi.value].sort((a, b) => {
    let aVal = a[sortColumn.value];
    let bVal = b[sortColumn.value];

    // Handle date
    if (sortColumn.value === "tanggal_produksi") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }

    // Handle string
    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    // Handle null/undefined
    if (aVal === null || aVal === undefined) aVal = 0;
    if (bVal === null || bVal === undefined) bVal = 0;

    if (sortDirection.value === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
});

const totalData = computed(() => sortedProduksi.value.length);

const totalPages = computed(() => {
  if (perPage.value >= 9999999) return 1;
  return Math.ceil(totalData.value / perPage.value);
});

const paginatedData = computed(() => {
  if (perPage.value >= 9999999) return sortedProduksi.value;

  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return sortedProduksi.value.slice(start, end);
});

const startIndex = computed(() => {
  if (totalData.value === 0) return 0;
  return (currentPage.value - 1) * perPage.value + 1;
});

const endIndex = computed(() => {
  if (perPage.value >= 9999999) return totalData.value;
  const end = currentPage.value * perPage.value;
  return Math.min(end, totalData.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  // Show max 5 pages
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + 4);

  // Adjust start if we're near the end
  if (end - start < 4) {
    start = Math.max(1, end - 4);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

const toggleSort = (column) => {
  if (sortColumn.value === column) {
    if (sortDirection.value === "asc") {
      sortDirection.value = "desc";
    } else if (sortDirection.value === "desc") {
      sortColumn.value = null;
      sortDirection.value = null;
    }
  } else {
    sortColumn.value = column;
    sortDirection.value = "asc";
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const onPerPageChange = () => {
  currentPage.value = 1; // Reset to first page when changing per page
};

const resetPagination = () => {
  currentPage.value = 1;
};

const onPerusahaanFilterChange = () => {
  // Filter kapal yang tidak sesuai dengan perusahaan yang dipilih
  filter.value.kapal_id = filter.value.kapal_id.filter((kapalId) => {
    const kapalItem = kapal.value.find((k) => k.kapal_id === kapalId);
    return (
      kapalItem && filter.value.perusahaan_id.includes(kapalItem.perusahaan_id)
    );
  });
  resetPagination();
};

const onKapalFilterChange = () => {
  // Auto-fill perusahaan dari kapal yang dipilih
  if (
    filter.value.kapal_id.length > 0 &&
    filter.value.perusahaan_id.length === 0
  ) {
    const perusahaanIds = [
      ...new Set(
        filter.value.kapal_id
          .map((kapalId) => {
            const kapalItem = kapal.value.find((k) => k.kapal_id === kapalId);
            return kapalItem?.perusahaan_id;
          })
          .filter(Boolean),
      ),
    ];
    filter.value.perusahaan_id = perusahaanIds;
  }
  resetPagination();
};

const onPelabuhanAsalFilterChange = () => {
  // Filter rute yang tidak sesuai
  filter.value.rute_id = filter.value.rute_id.filter((ruteId) => {
    const ruteItem = rute.value.find((r) => r.rute_id === ruteId);
    return (
      ruteItem &&
      filter.value.pelabuhan_asal_id.includes(ruteItem.pelabuhan_asal_id)
    );
  });
  resetPagination();
};

const onRuteFilterChange = () => {
  // Auto-fill pelabuhan asal dari rute yang dipilih
  if (
    filter.value.rute_id.length > 0 &&
    filter.value.pelabuhan_asal_id.length === 0
  ) {
    const pelabuhanAsalIds = [
      ...new Set(
        filter.value.rute_id
          .map((ruteId) => {
            const ruteItem = rute.value.find((r) => r.rute_id === ruteId);
            return ruteItem?.pelabuhan_asal_id;
          })
          .filter(Boolean),
      ),
    ];
    filter.value.pelabuhan_asal_id = pelabuhanAsalIds;
  }
  resetPagination();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (num) => {
  return new Intl.NumberFormat("id-ID").format(num || 0);
};

const loadData = async () => {
  try {
    const params = new URLSearchParams();
    if (filter.value.tanggal_dari)
      params.append("tanggal_dari", filter.value.tanggal_dari);
    if (filter.value.tanggal_sampai)
      params.append("tanggal_sampai", filter.value.tanggal_sampai);
    if (filter.value.perusahaan_id.length > 0)
      params.append("perusahaan_id", filter.value.perusahaan_id.join(","));
    if (filter.value.kapal_id.length > 0)
      params.append("kapal_id", filter.value.kapal_id.join(","));
    if (filter.value.pelabuhan_asal_id.length > 0)
      params.append(
        "pelabuhan_asal_id",
        filter.value.pelabuhan_asal_id.join(","),
      );
    if (filter.value.rute_id.length > 0)
      params.append("rute_id", filter.value.rute_id.join(","));
    if (filter.value.shift.length > 0)
      params.append("shift", filter.value.shift.join(","));
    if (filter.value.regu.length > 0)
      params.append("regu", filter.value.regu.join(","));

    const response = await api.get(`/produksi?${params.toString()}`);
    produksi.value = response.data.data;
  } catch (error) {
    alert("Gagal memuat data");
  }
};

const loadMasterData = async () => {
  try {
    const [pRes, kRes, pelRes, rRes] = await Promise.all([
      api.get("/master/perusahaan"),
      api.get("/master/kapal"),
      api.get("/master/pelabuhan"),
      api.get("/master/rute"),
    ]);
    perusahaan.value = pRes.data.data;
    kapal.value = kRes.data.data;
    pelabuhan.value = pelRes.data.data;
    rute.value = rRes.data.data;
  } catch (error) {
    console.error("Error loading master data:", error);
  }
};

const resetFilter = () => {
  filter.value = {
    tanggal_dari: "",
    tanggal_sampai: "",
    perusahaan_id: [],
    kapal_id: [],
    pelabuhan_asal_id: [],
    rute_id: [],
    shift: [],
    regu: [],
  };
  loadData();
};

const viewDetail = async (item) => {
  try {
    const response = await api.get(`/produksi/${item.produksi_id}`);
    selectedProduksi.value = response.data.data;
    showDetailModal.value = true;
  } catch (error) {
    alert("Gagal memuat detail");
  }
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedProduksi.value = null;
};

const editProduksi = () => {
  router.push({
    name: "input-produksi",
    query: { edit: selectedProduksi.value.produksi_id },
  });
};

const deleteItem = async (item) => {
  if (
    !confirm(
      `Hapus data produksi tanggal ${formatDate(item.tanggal_produksi)}?`,
    )
  )
    return;

  try {
    await api.delete(`/produksi/${item.produksi_id}`);
    alert("Data berhasil dihapus");
    loadData();
  } catch (error) {
    alert("Gagal menghapus data");
  }
};

onMounted(() => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  filter.value.tanggal_dari = weekAgo.toISOString().split("T")[0];
  filter.value.tanggal_sampai = today.toISOString().split("T")[0];

  loadMasterData();
  loadData();
});
</script>
