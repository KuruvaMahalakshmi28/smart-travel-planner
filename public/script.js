// public/script.js

function showLoader() {
  const container = document.getElementById('resultContainer');
  container.innerHTML = `
    <div class="text-center py-20">
      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-blue-700 font-medium">Loading destination info...</p>
    </div>
  `;
}
