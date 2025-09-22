<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
    <p>Welcome to your Faillink dashboard! Here you can see an overview of all your activities, key metrics, and important updates at a glance.</p>

    <!-- Example enterprise list -->
    <div class="mt-8">
      <h2 class="text-lg font-semibold mb-2">Entreprises en faillite</h2>
      <table class="min-w-full bg-white rounded shadow">
        <thead>
          <tr class="bg-gray-100">
            <th class="py-2 px-4 text-left">Nom</th>
            <th class="py-2 px-4 text-left">Numéro</th>
            <th class="py-2 px-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="py-2 px-4">ElectroTech Solutions SA</td>
            <td class="py-2 px-4">BE0123456789</td>
            <td class="py-2 px-4">
              <button @click="goToEnterprise('BE0123456789')" class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition">Voir</button>
            </td>
          </tr>
          <!-- Add more rows as needed -->
        </tbody>
      </table>
    </div>
  </div>
</template> 