// script.js - Funções visuais, perfil, chat, mapa e roteamento
// Injeta estilos para notificações e loader
(() => {
    const style = document.createElement('style');
    style.textContent = `
.notification {
  position: fixed; top: 1rem; right: 1rem;
  padding: 1rem 1.5rem; color: #fff;
  border-radius: 4px; font-size: 0.9rem;
  opacity: 1; transition: opacity 0.5s ease;
  z-index: 10000;
}
.notification.info { background: #2196f3; }
.notification.success { background: #4caf50; }
.notification.error { background: #f44336; }
.notification.fade-out { opacity: 0; }
.loader {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  border: 8px solid #f3f3f3;
  border-top: 8px solid #3498db;
  border-radius: 50%; width: 60px; height: 60px;
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

// Valida CPF (algoritmo brasileiro)
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    const calc = t => {
        let sum = 0;
        for (let i = 0; i < t; i++) sum += Number(cpf[i]) * (t + 1 - i);
        const d = (sum * 10) % 11;
        return d === 10 ? 0 : d;
    };
    return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

// Código principal após DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    // --- Utilitários ---
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

    // --- Chat de Emergência ---
    function habilitarChat() {
        const chat = document.getElementById('chat');
        if (chat) {
            chat.style.display = 'block';
            showNotification('info', 'Chat de emergência ativo.');
        }
    }
    const chatBtn = document.getElementById('chatEnviar');
    if (chatBtn) chatBtn.addEventListener('click', () => {
        const input = document.getElementById('chatInput');
        const txt = input.value.trim();
        if (!txt) return;
        const chatWindow = document.getElementById('chatWindow');
        const p = document.createElement('p');
        p.textContent = `Você: ${txt}`;
        chatWindow.appendChild(p);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        input.value = '';
    });

    // --- Perfil Médico ---
    const perfil = JSON.parse(localStorage.getItem('ambulogo_perfil')) || {};
    const alerg = document.getElementById('alergias');
    const cron = document.getElementById('cronicas');
    if (alerg) alerg.value = perfil.alergias || '';
    if (cron) cron.value = perfil.cronicas || '';
    const salvarPerfil = document.getElementById('salvarPerfil');
    if (salvarPerfil) salvarPerfil.addEventListener('click', () => {
        const p = { alergias: alerg.value, cronicas: cron.value };
        localStorage.setItem('ambulogo_perfil', JSON.stringify(p));
        showNotification('success', 'Perfil médico salvo com sucesso!');
    });

    // --- Formulário Vítima ---
    const form = document.getElementById('formSolicitacao');
    const cpfVitEl = document.getElementById('cpfVitima');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            // valida CPF vítima
            if (!validarCPF(cpfVitEl.value.trim())) {
                showNotification('error', 'Informações incorretas, tente novamente.');
                cpfVitEl.focus();
                return;
            }
            showNotification('success', 'Solicitação enviada com sucesso!');
            form.reset();
        });
    }

    // --- Mapa e API ---
    const localizacaoInput = document.getElementById('localizacao');
    const resultadoDiv = document.getElementById('resultado');
    let map, userMarker, ambulanceMarker;

    function inicializarMapa(lat, lng) {
        map = L.map('map').setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
        userMarker = L.marker([lat, lng]).addTo(map).bindPopup('📍 Sua localização').openPopup();
    }

    function calcularDistancia(c1, c2) {
        const toRad = v => (v * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(c2.latitude - c1.latitude);
        const dLon = toRad(c2.longitude - c1.longitude);
        const lat1 = toRad(c1.latitude);
        const lat2 = toRad(c2.latitude);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function atualizarLocalizacao() {
        showNotification('info', 'Obtendo localização...');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
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
                const tempo = (amb.distancia / 40 * 60).toFixed(1);
                resultadoDiv.innerHTML = `
          <p><span>🚑 Ambulância:</span> ${amb.nome}</p>
          <p><span>📏 Distância:</span> ${amb.distancia.toFixed(2)} km</p>
          <p><span>⏱️ Tempo estimado:</span> ${tempo} min</p>
        `;
                resultadoDiv.style.display = 'block';
                showNotification('success', `Ambulância ${amb.nome} encontrada!`);
                habilitarChat();
                if (ambulanceMarker) map.removeLayer(ambulanceMarker);
                ambulanceMarker = L.marker([amb.latitude, amb.longitude], { icon: L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/2961/2961957.png', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -30] }) }).addTo(map).bindPopup(`🚑 ${amb.nome}`).openPopup();
                // Hospital e rota omitidos para brevidade
            } else {
                resultadoDiv.innerHTML = `<p><strong>❌ Nenhuma ambulância disponível.</strong></p>`;
                resultadoDiv.style.display = 'block';
                showNotification('error', 'Sem ambulâncias disponíveis.');
            }
        } catch (err) {
            hideLoader();
            console.error(err);
            showNotification('error', 'Erro ao buscar ambulância.');
        }
    }

    // Inicialização
    atualizarLocalizacao();
    const btnLoc = document.querySelector('.botao-localizar');
    if (btnLoc) btnLoc.addEventListener('click', atualizarLocalizacao);
});