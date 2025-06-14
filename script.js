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
        if (!document.getElementById('global-loader')) {
            const loader = document.createElement('div');
            loader.className = 'loader';
            loader.id = 'global-loader';
            document.body.appendChild(loader);
        }
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
    if (chatBtn) {
        chatBtn.addEventListener('click', () => {
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
    }

    // --- Perfil Médico ---
    const perfil = JSON.parse(localStorage.getItem('ambulogo_perfil')) || {};
    const alerg = document.getElementById('alergias');
    const cron = document.getElementById('cronicas');
    if (alerg) alerg.value = perfil.alergias || '';
    if (cron) cron.value = perfil.cronicas || '';
    const salvarPerfil = document.getElementById('salvarPerfil');
    if (salvarPerfil) {
        salvarPerfil.addEventListener('click', () => {
            const p = { alergias: alerg.value, cronicas: cron.value };
            localStorage.setItem('ambulogo_perfil', JSON.stringify(p));
            showNotification('success', 'Perfil médico salvo com sucesso!');
        });
    }

    // --- Formulário Vítima ---
    const form = document.getElementById('formSolicitacao');
    const cpfVitEl = document.getElementById('cpfVitima');
    if (form && cpfVitEl) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (!validarCPF(cpfVitEl.value.trim())) {
                showNotification('error', 'CPF inválido, tente novamente.');
                cpfVitEl.focus();
                return;
            }
            showNotification('success', 'Solicitação enviada com sucesso!');
            form.reset();
        });
    }

    // --- Mapa, Hospital Próximo, Disparo e Simulação ---
    const localizacaoInput = document.getElementById('localizacao');
    const resultadoDiv = document.getElementById('resultado');
    let map, userMarker, ambulanceMarker, simulationInterval = null;

    function inicializarMapa(lat, lng) {
        map = L.map('map').setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        userMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup('📍 Você está aqui')
            .openPopup();
    }

    async function buscarHospitalProximo(coords) {
        showLoader();
        try {
            const res = await fetch(`http://localhost:3000/hospital-proximo?lat=${coords.latitude}&lng=${coords.longitude}`);
            const hosp = await res.json();
            hideLoader();
            if (!hosp || !hosp.id) {
                showNotification('error', 'Nenhum hospital encontrado.');
                return null;
            }
            return hosp;
        } catch {
            hideLoader();
            showNotification('error', 'Erro ao buscar hospital.');
            return null;
        }
    }

    async function dispararAmbulancia(hospitalId, destino) {
        showLoader();
        try {
            const res = await fetch(
                `http://localhost:3000/disparar-ambulancia?hospitalId=${hospitalId}` +
                `&toLat=${destino.latitude}&toLng=${destino.longitude}`, { method: 'POST' }
            );
            const amb = await res.json();
            hideLoader();
            return amb;
        } catch {
            hideLoader();
            showNotification('error', 'Erro ao disparar ambulância.');
            return null;
        }
    }

    function simularTrajeto(origem, destino, ambNome) {
        if (simulationInterval) clearInterval(simulationInterval);
        if (ambulanceMarker) map.removeLayer(ambulanceMarker);

        ambulanceMarker = L.marker([origem.latitude, origem.longitude], {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2961/2961957.png',
                    iconSize: [36, 36],
                    iconAnchor: [18, 36],
                    popupAnchor: [0, -30]
                })
            })
            .addTo(map)
            .bindPopup(`🚑 ${ambNome}`)
            .openPopup();

        const steps = 100;
        let step = 0;
        const deltaLat = (destino.latitude - origem.latitude) / steps;
        const deltaLng = (destino.longitude - origem.longitude) / steps;

        simulationInterval = setInterval(() => {
            step++;
            const lat = origem.latitude + deltaLat * step;
            const lng = origem.longitude + deltaLng * step;
            ambulanceMarker.setLatLng([lat, lng]);
            ambulanceMarker.getPopup().setContent(`🚑 ${ambNome}<br>Chegando em você`);
            if (step >= steps) {
                clearInterval(simulationInterval);
                showNotification('success', 'Ambulância chegou ao local!');
            }
        }, 500);
    }

    function atualizarLocalizacao() {
        showNotification('info', 'Obtendo localização...');
        if (!navigator.geolocation) {
            showNotification('error', 'Geolocalização não suportada.');
            return;
        }
        navigator.geolocation.getCurrentPosition(async pos => {
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

            // 1) Hospital mais próximo
            const hosp = await buscarHospitalProximo(coords);
            if (!hosp) return;
            showNotification('success', `Hospital mais próximo: ${hosp.nome}`);

            // 2) Dispara ambulância
            const amb = await dispararAmbulancia(hosp.id, coords);
            if (!amb) return;
            showNotification('success', `Ambulância ${amb.nome} a caminho!`);

            // 3) Simula trajeto
            simularTrajeto({ latitude: hosp.latitude, longitude: hosp.longitude }, { latitude: coords.latitude, longitude: coords.longitude },
                amb.nome
            );
        }, () => {
            showNotification('error', 'Erro ao obter localização.');
        });
    }

    // Inicialização
    atualizarLocalizacao();
    const btnLoc = document.querySelector('.botao-localizar');
    if (btnLoc) btnLoc.addEventListener('click', atualizarLocalizacao);
    // ———————————————
    // Chamados de vítimas
    // ———————————————
    document.addEventListener('DOMContentLoaded', () => {
        const callsKey = 'ambuGo_calls';
        const btnCall = document.getElementById('btnOpenCall');

        if (btnCall) {
            btnCall.addEventListener('click', () => {
                if (!navigator.geolocation) {
                    return showNotification('info', 'Geolocalização não suportada pelo seu navegador.');
                }
                navigator.geolocation.getCurrentPosition(pos => {
                    const user = JSON.parse(localStorage.getItem('ambuGo_user'));
                    if (!user) {
                        return showNotification('info', 'Faça login antes de chamar uma ambulância.');
                    }
                    const calls = JSON.parse(localStorage.getItem(callsKey) || '[]');
                    const newCall = {
                        id: `call_${Date.now()}`,
                        nome: user.nome,
                        cpf: user.cpf,
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        timestamp: new Date().toISOString(),
                        status: 'pending'
                    };
                    calls.push(newCall);
                    localStorage.setItem(callsKey, JSON.stringify(calls));
                    showNotification('success', 'Chamado enviado com sucesso!');
                }, err => {
                    showNotification('info', 'Não foi possível obter a localização: ' + err.message);
                });
            });
        }
    });

});