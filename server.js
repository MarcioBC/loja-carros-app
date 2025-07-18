
require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const fichaRoutes = require('./routes/fichaRoutes');
const backupRoutes = require('./routes/backupRoutes');
require('./models/User'); 
require('./models/Client');
require('./models/Vehicle');
require('./models/FichaCadastral');
const app = express();
const PORT = process.env.PORT || 3000;

// Função auxiliar para obter o mês/ano atual no formato AAAA-MM
function getCurrentMonthYear() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês é 0-11, então +1
    return `${year}-${month}`;
}

// Conexão com o MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado ao MongoDB!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Middleware para servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear JSON (para receber dados de formulários no formato JSON)
app.use(express.json());

// Usar as rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/fichas', fichaRoutes); 
app.use('/api', backupRoutes);

// Rotas GET para suas páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/estoque', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'estoque.html'));
});
app.get('/clientes.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'clientes.html'));
});
app.get('/ficha_cadastral.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ficha_cadastral.html'));
});
app.get('/consultar_fichas_salva.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'consultar_fichas_salva.html'));
});
app.get('/veiculos_vendidos.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'veiculos_vendidos.html'));
});
app.get('/documentacao.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'documentacao.html'));
});

// Adicionar a rota para o register.html
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});