-
const express = require('express'); -
const cors = require('cors');

-
const app = express(); -
app.use(cors()); -
app.use(express.json()); +
const express = require('express'); +
const cors = require('cors'); +
const http = require('http'); +
const { Server } = require('socket.io');

+
const app = express(); +
app.use(cors()); +
app.use(express.json());

+ // Em vez de app.listen, criamos o servidor HTTP:
+
const httpServer = http.createServer(app); + // Configura o Socket.IO com CORS liberado (ajuste o origin em produção!)
+
const io = new Server(httpServer, {+cors: { origin: '*' } +
});

// ... suas rotas REST continuam aqui ...

+ // Lógica do chat em tempo real
+io.on('connection', socket => {
    +console.log(`Cliente conectado: ${socket.id}`);

    + // Se necessário, você pode usar “salas” para isolar conversas:
    +socket.on('joinRoom', room => {
        +socket.join(room); +
    });

    + // Quando recebe mensagem do cliente:
    +socket.on('chatMessage', ({ room, sender, message }) => {
        + // retransmite para todos na sala (incluindo quem enviou)
        +io.to(room).emit('chatMessage', {+sender,
            +message,
            +timestamp: new Date().toISOString() +
        }); +
    });

    +
    socket.on('disconnect', () => {
        +console.log(`Cliente desconectado: ${socket.id}`); +
    }); +
});

-
const PORT = process.env.PORT || 3000; -
app.listen(PORT, () => {
<<<<<<< HEAD
    -console.log(`Servidor rodando na porta ${PORT}`); -
}); +
const PORT = process.env.PORT || 3000; +
httpServer.listen(PORT, () => {
    +console.log(`Servidor rodando na porta ${PORT}`); +
});
=======
    console.log(`Servidor rodando na porta ${PORT}`);
});
>>>>>>> b0fddb04d9b84b9d4b632996cfbb0d62c4c150c5
