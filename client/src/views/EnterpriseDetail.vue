<template>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <a href="#" class="back-button" @click.prevent="goBack">
        ← Retour au tableau
      </a>
    </div>

    <!-- Company Header -->
    <div class="company-header">
      <div class="company-title">
        <h1 class="company-name">{{ company.name }}</h1>
        <p class="company-id">{{ company.id }}</p>
      </div>
      <span class="status-badge">{{ company.status }}</span>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Left Column -->
      <div class="left-column">
        <!-- General Information -->
        <div class="card">
          <h2 class="card-title">📋 Informations générales</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Secteur d'activité</span>
              <span class="info-value">{{ company.sector }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date de faillite</span>
              <span class="info-value">📅 {{ company.bankruptcyDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Employés</span>
              <span class="info-value">{{ company.employees }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Année de création</span>
              <span class="info-value">{{ company.foundedYear }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Dernier CA déclaré</span>
              <span class="info-value">€ {{ company.lastRevenue }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Localisation</span>
              <span class="info-value">📍 {{ company.location }}</span>
            </div>
          </div>

          <div style="margin-top: 20px;">
            <div class="info-item">
              <span class="info-label">Description</span>
              <p class="description">{{ company.description }}</p>
            </div>
          </div>
        </div>

        <!-- Available Assets -->
        <div class="card">
          <div class="assets-header">
            <h2 class="card-title">💰 Actifs disponibles</h2>
            <span class="assets-total">{{ formatCurrency(totalAssets) }}</span>
          </div>
          <p class="assets-subtitle">
            Estimation basée sur les derniers rapports disponibles
          </p>

          <div class="assets-section">
            <div v-for="asset in assets" :key="asset.id" class="asset-item">
              <div class="asset-info">
                <div class="asset-name">{{ asset.name }}</div>
                <div class="asset-status">État: {{ asset.condition }}</div>
              </div>
              <div class="asset-value">{{ formatCurrency(asset.value) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="right-column">
        <div class="card">
          <!-- Curator Section -->
          <div class="curator-section">
            <h3 class="curator-title">👤 Curateur désigné</h3>
            <p class="curator-subtitle">
              Contact pour les questions relatives à cette faillite
            </p>

            <div class="curator-info">
              <div class="curator-name">{{ curator.name }}</div>
              <div class="curator-company">{{ curator.company }}</div>

              <div class="contact-info">
                <div class="contact-item">📧 {{ curator.email }}</div>
                <div class="contact-item">📍 {{ curator.address }}</div>
              </div>

              <button class="email-button" @click="sendEmail">
                ✉️ Envoyer un email
              </button>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="actions-section">
            <h3 class="actions-title">Actions rapides</h3>
            <button class="action-button" @click="downloadFile">
              📄 Télécharger le dossier
            </button>
            <button class="action-button" @click="viewSimilarCompanies">
              🏢 Voir entreprises similaires
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"

const company = ref({
  name: "ElectroTech Solutions SA",
  id: "BE0123456789",
  status: "Potentiel Élevé",
  sector: "Électronique & Tech",
  bankruptcyDate: "15/01/2024",
  employees: "45 personnes",
  foundedYear: "2018",
  lastRevenue: "8,2M",
  location: "Avenue Louise 123, 1050 Bruxelles",
  description:
    "Société spécialisée dans le développement de solutions électroniques pour l'industrie automobile et aéronautique.",
})

const curator = ref({
  name: "Me. Jean Dupont",
  company: "Cabinet Dupont & Associés",
  email: "j.dupont@cabinet-dupont.be",
  address: "Rue de la Loi 45, 1000 Bruxelles",
})

const assets = ref([
  { id: 1, name: "Équipements industriels", condition: "Bon état", value: 850000 },
  { id: 2, name: "Stock de composants", condition: "Neuf", value: 420000 },
  { id: 3, name: "Véhicules d'entreprise", condition: "Bon état", value: 180000 },
  { id: 4, name: "Mobilier de bureau", condition: "Moyen", value: 65000 },
])

const totalAssets = computed(() => {
  return assets.value.reduce((sum, asset) => sum + asset.value, 0)
})

const formatCurrency = (amount) => {
  return `€ ${(amount / 1000).toFixed(0)},000`
}

const goBack = () => {
  alert("Retour au tableau de bord")
}

const sendEmail = () => {
  window.location.href = `mailto:${curator.value.email}`
}

const downloadFile = () => {
  alert("Téléchargement du dossier en cours...")
}

const viewSimilarCompanies = () => {
  alert("Affichage des entreprises similaires...")
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  background-color: #f8fafc;
  color: #374151;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.back-button {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #6b7280;
  margin-right: 20px;
  font-size: 14px;
}

.back-button:hover {
  color: #374151;
}

.company-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.company-title {
  flex: 1;
}

.company-name {
  font-size: 32px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 5px;
}

.company-id {
  color: #6b7280;
  font-size: 14px;
}

.status-badge {
  background-color: #10b981;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.main-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.info-value {
  font-weight: 500;
  color: #111827;
}

.description {
  line-height: 1.6;
  color: #4b5563;
}

.assets-section {
  margin-top: 10px;
}

.assets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.assets-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.assets-total {
  font-size: 16px;
  font-weight: 600;
  color: #10b981;
}

.asset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.asset-item:last-child {
  border-bottom: none;
}

.asset-info {
  flex: 1;
}

.asset-name {
  font-weight: 500;
  color: #111827;
  margin-bottom: 2px;
}

.asset-status {
  font-size: 12px;
  color: #6b7280;
}

.asset-value {
  font-weight: 600;
  color: #10b981;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.curator-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.curator-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
}

.curator-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.curator-info {
  padding: 16px 0;
}

.curator-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.curator-company {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 15px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.email-button {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 15px;
}

.email-button:hover {
  background: #2563eb;
}

.actions-section {
  margin-top: 20px;
}

.actions-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 15px;
}

.action-button {
  width: 100%;
  padding: 12px;
  background: white;
  color: #3b82f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
}

.action-button:hover {
  background: #f8fafc;
  border-color: #3b82f6;
}

.icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .company-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>
