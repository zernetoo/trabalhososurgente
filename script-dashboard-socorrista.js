// script-dashboard-socorrista.js

document.addEventListener('DOMContentLoaded', () => {
    // 1) Valida sessão do socorrista
    const soc = JSON.parse(localStorage.getItem('ambuGo_socorrista'));
    if (!soc) {
        return window.location.href = 'socorrista.html';
    }
    // Exibe nome
    document.getElementById('boasVindas').textContent = `Bem-vindo, ${soc.nome}`;

    const callsKey = 'ambuGo_calls';
    let calls = JSON.parse(localStorage.getItem(callsKey) || '[]');

    // 2) Renderiza lista de chamados
    function renderCalls() {
        const ul = document.getElementById('callsList');
        ul.innerHTML = '';
        const pendentes = calls.filter(c => c.status === 'pending');

        if (pendentes.length === 0) {
            ul.innerHTML = '<li>Nenhum chamado pendente.</li>';
            return;
        }

        pendentes.forEach(c => {
            const li = document.createElement('li');
            li.className = 'call-item';
            li.innerHTML = `
        <p><strong>Nome:</strong> ${c.nome}</p>
        <p><strong>CPF:</strong> ${c.cpf}</p>
        <p><strong>Localização:</strong> ${c.lat.toFixed(5)}, ${c.lon.toFixed(5)}</p>
        <div class="actions">
          <button data-id="${c.id}" class="btn-accept">Aceitar</button>
          <button data-id="${c.id}" class="btn-reject">Recusar</button>
        </div>
      `;
            ul.appendChild(li);
        });

        // 3) Eventos de aceitar/recusar
        document.querySelectorAll('.btn-accept').forEach(btn =>
            btn.addEventListener('click', () => respondToCall(btn.dataset.id, true))
        );
        document.querySelectorAll('.btn-reject').forEach(btn =>
            btn.addEventListener('click', () => respondToCall(btn.dataset.id, false))
        );
    }

    function respondToCall(id, accepted) {
        calls = calls.map(c =>
            c.id === id ?
            {...c, status: accepted ? 'accepted' : 'rejected' } :
            c
        );
        localStorage.setItem(callsKey, JSON.stringify(calls));
        showNotification('success', `Chamado ${accepted ? 'aceito' : 'recusado'}!`);
        renderCalls();
    }

    // 4) Logout
    document.getElementById('btnLogout')
        .addEventListener('click', () => {
            localStorage.removeItem('ambuGo_socorrista');
            window.location.href = 'socorrista.html';
        });

    // Render inicial e atualização periódica
    renderCalls();
    setInterval(() => {
        calls = JSON.parse(localStorage.getItem(callsKey) || '[]');
        renderCalls();
    }, 5000);
});