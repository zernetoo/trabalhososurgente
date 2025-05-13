// index.js - Backend da API SOS Urgente

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ambulancias = [
    { id: 1, nome: 'Ambulância Alfa', latitude: -3.7325, longitude: -38.5275, status: 'disponivel' },
    { id: 2, nome: 'Ambulância Bravo', latitude: -3.7432, longitude: -38.5058, status: 'em_atendimento' },
    { id: 3, nome: 'Ambulância Charlie', latitude: -3.7450, longitude: -38.5200, status: 'disponivel' }
];

// Rota para retornar todas as ambulâncias
app.get('/ambulancias', (req, res) => {
    res.json(ambulancias);
});

// Rota para retornar a ambulância mais próxima
app.get('/ambulancia-proxima', (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ erro: 'Coordenadas ausentes' });

    const usuario = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
    };

    const calcularDistancia = (coord1, coord2) => {
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(coord2.latitude - coord1.latitude);
        const dLon = toRad(coord2.longitude - coord1.longitude);
        const lat1 = toRad(coord1.latitude);
        const lat2 = toRad(coord2.latitude);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const disponiveis = ambulancias.filter(a => a.status === 'disponivel');
    let maisProxima = null;
    let menorDistancia = Infinity;

    disponiveis.forEach(amb => {
        const dist = calcularDistancia(usuario, { latitude: amb.latitude, longitude: amb.longitude });
        if (dist < menorDistancia) {
            menorDistancia = dist;
            maisProxima = {...amb, distancia: dist };
        }
    });

    if (maisProxima) res.json(maisProxima);
    else res.json({});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
