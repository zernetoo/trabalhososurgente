// script-socorrista.js
// Validações e navegação para área do Socorrista

// Função para validar CPF (algoritmo padrão brasileiro)
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const calc = (t) => {
        let sum = 0;
        for (let i = 0; i < t; i++) {
            sum += Number(cpf[i]) * ((t + 1) - i);
        }
        const d = (sum * 10) % 11;
        return d === 10 ? 0 : d;
    };

    return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

// Função para validar CNH (exatamente 11 dígitos numéricos)
function validarCNH(cnh) {
    const n = cnh.replace(/\D/g, '');
    return /^\d{11}$/.test(n);
}

// Executa após o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
const form = document.getElementById('formSocorrista');
const btnVoltar = document.getElementById('btnVoltar');

// Navega de volta para a landing page
btnVoltar.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Manipula submissão do formulário
form.addEventListener('submit', (evt) => {
    evt.preventDefault();

    const cpfEl = document.getElementById('cpf');
    const cnhEl = document.getElementById('cnh');
    const nome = document.getElementById('nomeSoc').value.trim();
    const dob = document.getElementById('dob').value;
    const cpf = cpfEl.value.trim();
    const cnh = cnhEl.value.trim();

    // checa TODOS os dados de uma vez
    if (!validarCPF(cpf) ||
        !nome ||
        !dob ||
        !validarCNH(cnh)
    ) {
        alert('Informações incorretas, tente novamente.');
        return;
    }

    // tudo ok → salva e redireciona
    const socorrista = { cpf, nome, dob, cnh };
    localStorage.setItem('ambuGo_socorrista', JSON.stringify(socorrista));
    window.location.href = 'dashboard-socorrista.html';
});


// Validações
if (!validarCPF(cpf)) {
    alert('CPF inválido. Verifique e tente novamente.');
    cpfEl.focus();
    return;
}
if (!nome) {
    alert('Informe seu nome completo.');
    return;
}
if (!dob) {
    alert('Informe sua data de nascimento.');
    return;
}
if (!validarCNH(cnh)) {
    alert('CNH inválida. Deve conter 11 dígitos numéricos.');
    cnhEl.focus();
    return;
}

// Tudo válido: salva e redireciona
const socorrista = { cpf, nome, dob, cnh };
localStorage.setItem('ambuGo_socorrista', JSON.stringify(socorrista));
window.location.href = 'dashboard-socorrista.html';
});
});