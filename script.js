// script.js - Melhorias visuais e notificações
// Injeta estilos para notificações e loader
(() => {
    const style = document.createElement('style');
    style.textContent = `
    .notification {
      position: fixed;
      top: 1rem;
      right: 1rem;
      padding: 1rem 1.5rem;
      color: #fff;
      border-radius: 4px;
      font-size: 0.9rem;
      opacity: 1;
      transition: opacity 0.5s ease;
      z-index: 10000;
    }
    .notification.info { background: #2196f3; }
    .notification.success { background: #4caf50; }
    .notification.error { background: #f44336; }
    .notification.fade-out { opacity: 0; }

    .loader {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      border: 8px solid #f3f3f3;
      border-top: 8px solid #3498db;
      border-radius: 50%;
      width: 60px; height: 60px;
      animation: spin 1s linear infinite;
      z-index: 10000;
    }
    @keyframes spin {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
  `;
    document.head.appendChild(style);
})();

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formSolicitacao');
    const localizacaoInput = document.getElementById('localizacao');
    const resultadoDiv = document.getElementById('resultado');
    let map, userMarker, ambulanceMarker;

    function showNotification(type, message) {
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('fade-out'), 3000);
        notif.addEventListener('transitionend', () => notif.remove());
    }

    function showLoader() {
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.id = 'global-loader';
        document.body.appendChild(loader);
    }

    function hideLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.remove();
    }

    function inicializarMapa(lat, lng) {
        map = L.map('map').setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        userMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup('📍 Sua localização').openPopup();
    }

    function atualizarLocalizacao() {
        showNotification('info', 'Obtendo localização...');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const coords = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                };
                localizacaoInput.value = `${coords.latitude}, ${coords.longitude}`;
                if (!map) inicializarMapa(coords.latitude, coords.longitude);
                else {
                    map.setView([coords.latitude, coords.longitude], 14);
                    userMarker.setLatLng([coords.latitude, coords.longitude]);
                }
                buscarAmbulanciaProxima(coords);
            }, () => {
                showNotification('error', 'Erro ao obter localização.');
                localizacaoInput.value = 'Erro ao obter localização';
            });
        } else {
            showNotification('error', 'Geolocalização não suportada.');
            localizacaoInput.value = 'Não suportado';
        }
    }

    async function buscarAmbulanciaProxima(coords) {
        showLoader();
        showNotification('info', 'Buscando ambulância mais próxima...');
        try {
            const res = await fetch(`http://localhost:3000/ambulancia-proxima?lat=${coords.latitude}&lng=${coords.longitude}`);
            const amb = await res.json();
            hideLoader();
            if (amb && amb.nome) {
                const tempoEstimado = (amb.distancia / 40 * 60).toFixed(1);
                resultadoDiv.innerHTML = `
          <p><span>🚑 Ambulância:</span> ${amb.nome}</p>
          <p><span>📏 Distância:</span> ${amb.distancia.toFixed(2)} km</p>
          <p><span>⏱️ Tempo estimado:</span> ${tempoEstimado} min</p>
        `;
                resultadoDiv.style.display = 'block';
                showNotification('success', `Ambulância ${amb.nome} encontrada!`);

                if (ambulanceMarker) map.removeLayer(ambulanceMarker);
                ambulanceMarker = L.marker([amb.latitude, amb.longitude], {
                    icon: L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2961/2961957.png',
                        iconSize: [36, 36],
                        iconAnchor: [18, 36],
                        popupAnchor: [0, -30]
                    })
                }).addTo(map).bindPopup(`🚑 ${amb.nome}`).openPopup();
            } else {
                resultadoDiv.innerHTML = "<p><strong>❌ Nenhuma ambulância disponível.</strong></p>";
                resultadoDiv.style.display = 'block';
                showNotification('error', 'Sem ambulâncias disponíveis.');
                hideLoader();
            }
        } catch (err) {
            hideLoader();
            console.error("Erro ao buscar ambulância:", err);
            showNotification('error', 'Erro ao buscar ambulância.');
        }
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('success', 'Solicitação enviada com sucesso!');
            form.reset();
        });
    }

    // Inicialização
    atualizarLocalizacao();

    // Botão manual de atualizar localização
    const btn = document.querySelector('.botao-localizar');
    if (btn) btn.addEventListener('click', atualizarLocalizacao);
});