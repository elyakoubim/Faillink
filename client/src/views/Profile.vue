<template>
  <div>
    <!-- Main Content -->
    <div class="container">
      <h1 class="page-title">Faillites récentes</h1>
      <p class="page-subtitle">{{ filteredCompanies.length }} entreprise(s) trouvée(s)</p>

      <!-- Filters -->
      <div class="filters">
        <div class="filters-header">
          <i class="fas fa-filter"></i>
          Filtres
        </div>
        
        <div class="filters-grid">
          <div class="search-input min-w-[200px]">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher une entreprise..."
              v-model="searchQuery"
            >
          </div>
          
          <select class="filter-select" v-model="selectedRegion">
            <option value="">Toutes les régions</option>
            <option value="Bruxelles-Capitale">Bruxelles-Capitale</option>
            <option value="Wallonie">Wallonie</option>
            <option value="Flandre">Flandre</option>
          </select>

          <select class="filter-select" v-model="selectedSector">
            <option value="">Tous les secteurs</option>
            <option value="Services informatiques">Services informatiques</option>
            <option value="Boulangerie-pâtisserie">Boulangerie-pâtisserie</option>
            <option value="Transport routier">Transport routier</option>
            <option value="BTP">BTP</option>
            <option value="Commerce">Commerce</option>
          </select>

          <select class="filter-select" v-model="selectedScore">
            <option value="">Tous les scores</option>
            <option value="Élevé">Élevé</option>
            <option value="Moyen">Moyen</option>
            <option value="Faible">Faible</option>
          </select>

          <select class="filter-select" v-model="selectedPeriod">
            <option value="">Période</option>
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">3 derniers mois</option>
          </select>

          <select class="filter-select" v-model="selectedActifType">
            <option value="">Type d'actif</option>
            <option value="Actifs">Actifs</option>
            <option value="Liquidation">Liquidation</option>
          </select>

          <button class="export-btn" @click="exportData">
            <i class="fas fa-download"></i>
            Export
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Date</th>
                <th>Localisation</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="company in filteredCompanies" :key="company.id">
                <td>
                  <div class="company-info">
                    <div class="company-name">{{ company.name }}</div>
                    <div class="company-id">{{ company.id }}</div>
                    <div class="company-sector">{{ company.sector }}</div>
                  </div>
                </td>
                <td>{{ formatDate(company.date) }}</td>
                <td>
                  <div class="location-info">
                    <div class="location-city">{{ company.city }}</div>
                    <div class="location-region">{{ company.region }}</div>
                  </div>
                </td>
                <td>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <span :class="'score-badge score-' + company.score.toLowerCase()">
                      {{ company.score }}
                    </span>
                    <span v-if="company.hasActifs" class="actifs-badge">Actifs</span>
                  </div>
                </td>
                <td>
                  <button class="action-btn" @click="viewDetails(company)">
                    <i class="far fa-eye"></i>
                    Voir
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const companies = ref([]);
const searchQuery = ref("");
const selectedRegion = ref("");
const selectedSector = ref("");
const selectedScore = ref("");
const selectedPeriod = ref("");
const selectedActifType = ref("");

// Example dataset
companies.value = [
  {
    id: "BE0123456789",
    name: "TechnoPlus SPRL",
    sector: "Services informatiques",
    date: "2024-01-14",
    city: "Bruxelles",
    region: "Bruxelles-Capitale",
    score: "Élevé",
    hasActifs: true,
    employees: 45,
    revenue: "8.2M",
    foundedYear: 2018,
    address: "Avenue Louise 123, 1050 Bruxelles",
    description:
      "Société spécialisée dans le développement de solutions électroniques pour l'industrie automobile et aéronautique.",
    curator: {
      name: "Me. Jean Dupont",
      company: "Cabinet Dupont & Associés",
      email: "jean.dupont@example.com",
      address: "Bruxelles",
    },
    assets: [
      { name: "Bâtiment industriel", state: "Bon", value: 5000000 },
      { name: "Machines CNC", state: "Excellent", value: 1200000 },
    ],
  },
];

const filteredCompanies = computed(() => {
  return companies.value.filter((c) => {
    const matchesQuery =
      !searchQuery.value ||
      c.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesRegion =
      !selectedRegion.value || c.region === selectedRegion.value;
    const matchesSector =
      !selectedSector.value || c.sector === selectedSector.value;
    const matchesScore =
      !selectedScore.value || c.score === selectedScore.value;
    return matchesQuery && matchesRegion && matchesSector && matchesScore;
  });
});

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR");
}

function formatAmount(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(amount);
}

function viewDetails(company) {
  router.push({ name: "EnterpriseDetail", params: { id: 3 } });
}



function exportData() {
  alert("Export CSV en cours...");
}
</script>

    <style scoped>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.5;
        }

        /* Header Navigation */
        .header {
            background: #1e293b;
            color: white;
            padding: 0 24px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 24px;
            font-weight: 700;
            text-decoration: none;
            color: white;
        }

        .logo i {
            background: #3b82f6;
            padding: 8px;
            border-radius: 8px;
        }

        .nav-menu {
            display: flex;
            list-style: none;
            gap: 32px;
            margin: 0;
        }

        .nav-menu a {
            color: #94a3b8;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }

        .nav-menu a:hover {
            color: white;
        }

        .nav-actions {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .btn-connect {
            color: #94a3b8;
            text-decoration: none;
            font-weight: 500;
        }

        .btn-primary {
            background: #3b82f6;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
        }

        .btn-primary:hover {
            background: #2563eb;
        }

        .lang-selector {
            color: #94a3b8;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        /* Main Content */
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 32px 24px;
        }

        .page-title {
            font-size: 36px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
        }

        .page-subtitle {
            color: #64748b;
            font-size: 16px;
            margin-bottom: 32px;
        }

        /* Filters Section */
        .filters {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            overflow: auto;
        }

        .filters-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
            font-weight: 600;
            color: #1e293b;
        }

        .filters-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr auto;
            gap: 16px;
            align-items: center;
        }

        .search-input {
            position: relative;
        }

        .search-input input {
            width: 100%;
            padding: 12px 16px 12px 44px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            background: #f9fafb;
            transition: all 0.2s;
        }

        .search-input input:focus {
            outline: none;
            border-color: #3b82f6;
            background: white;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-input i {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
        }

        .filter-select {
            padding: 12px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            background: #f9fafb;
            cursor: pointer;
            transition: all 0.2s;
        }

        .filter-select:focus {
            outline: none;
            border-color: #3b82f6;
            background: white;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .export-btn {
            padding: 12px 20px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            color: #475569;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }

        .export-btn:hover {
            background: #e2e8f0;
        }

        /* Table */
        .table-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }

        .table-wrapper {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }

        th {
            padding: 16px 20px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        td {
            padding: 20px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover {
            background: #f8fafc;
        }

        .company-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .company-name {
            font-weight: 600;
            color: #1e293b;
            font-size: 16px;
        }

        .company-id {
            color: #64748b;
            font-size: 14px;
        }

        .company-sector {
            color: #64748b;
            font-size: 14px;
        }

        .location-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .location-city {
            font-weight: 500;
            color: #1e293b;
        }

        .location-region {
            color: #64748b;
            font-size: 14px;
        }

        .score-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }

        .score-eleve {
            background: #dcfce7;
            color: #166534;
        }

        .score-eleve::before {
            content: '';
            width: 8px;
            height: 2px;
            background: #22c55e;
            border-radius: 1px;
        }

        .score-moyen {
            background: #fef3c7;
            color: #92400e;
        }

        .score-moyen::before {
            content: '';
            width: 8px;
            height: 2px;
            background: #f59e0b;
            border-radius: 1px;
        }

        .score-faible {
            background: #fecaca;
            color: #991b1b;
        }

        .score-faible::before {
            content: '';
            width: 8px;
            height: 2px;
            background: #ef4444;
            border-radius: 1px;
        }

        .actifs-badge {
            background: #e0f2fe;
            color: #0c4a6e;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            width: fit-content;
        }

        .action-btn {
            padding: 8px 16px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            color: #374151;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }

        .action-btn:hover {
            border-color: #3b82f6;
            color: #3b82f6;
        }

        /* Detail Modal */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        }

        .modal-content {
            background: white;
            border-radius: 12px;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .back-btn {
            padding: 8px;
            border: none;
            background: #f1f5f9;
            border-radius: 6px;
            cursor: pointer;
            color: #64748b;
            transition: all 0.2s;
        }

        .back-btn:hover {
            background: #e2e8f0;
        }

        .modal-title {
            flex: 1;
        }

        .company-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 4px;
        }

        .company-subtitle {
            color: #64748b;
            font-size: 14px;
        }

        .potential-badge {
            background: #22c55e;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }

        .modal-body {
            padding: 24px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 32px;
        }

        .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
        }

        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .info-item {
            margin-bottom: 12px;
        }

        .info-label {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 4px;
        }

        .info-value {
            color: #1e293b;
            font-weight: 500;
        }

        .curator-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 24px;
        }

        .curator-info {
            margin-bottom: 16px;
        }

        .curator-name {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 4px;
        }

        .curator-company {
            color: #64748b;
            font-size: 14px;
        }

        .contact-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #64748b;
            font-size: 14px;
        }

        .email-btn {
            width: 100%;
            padding: 12px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: background-color 0.2s;
        }

        .email-btn:hover {
            background: #2563eb;
        }

        .assets-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
        }

        .assets-list {
            list-style: none;
        }

        .asset-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .asset-item:last-child {
            border-bottom: none;
        }

        .asset-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .asset-name {
            font-weight: 500;
            color: #1e293b;
        }

        .asset-state {
            color: #64748b;
            font-size: 14px;
        }

        .asset-value {
            font-weight: 600;
            color: #22c55e;
            font-size: 18px;
        }

        .total-estimate {
            text-align: center;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px solid #e2e8f0;
        }

        .total-label {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 4px;
        }

        .total-value {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
        }

        .actions-section {
            margin-top: 24px;
        }

        .action-buttons {
            display: flex;
            gap: 12px;
        }

        .btn-outline {
            flex: 1;
            padding: 12px;
            border: 1px solid #d1d5db;
            background: white;
            color: #374151;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
        }

        .btn-outline:hover {
            border-color: #3b82f6;
            color: #3b82f6;
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .filters-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }

            .info-grid {
                grid-template-columns: 1fr;
            }

            .nav-menu {
                display: none;
            }
        }

        @media (max-width: 768px) {
            .container {
                padding: 20px 16px;
            }

            th, td {
                padding: 12px 16px;
            }

            .modal-content {
                margin: 10px;
                max-height: calc(100vh - 20px);
            }
        }
    </style>