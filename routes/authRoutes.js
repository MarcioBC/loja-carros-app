// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Função para gerar o token JWT
const generateToken = (id, nome, role, companyId) => {
    return jwt.sign({ id, nome, role, companyId }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
};

// Rota de registro (para o frontend público)
router.post('/register', async (req, res) => {
    const { nome, email, senha, role, companyId, pinCadastro } = req.body;

    console.log('--- DADOS RECEBIDOS NO BACKEND (auth/register) ---');
    console.log('Nome:', nome);
    console.log('Email:', email);
    console.log('Senha:', senha);
    console.log('Role:', role);
    console.log('CompanyId:', companyId);
    console.log('PIN de cadastro:', pinCadastro);

    if (!nome || !email || !senha || !role || !companyId || !pinCadastro) {
        return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
    }

    try {
        // Verificar se o usuário já existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ message: 'Usuário já existe com este e-mail.' });
        }

        // Converter companyId para ObjectId antes da busca
        let companyObjectId;
        try {
            companyObjectId = new mongoose.Types.ObjectId(companyId);
            console.log('companyId STRING original (vindo do frontend):', companyId);
            console.log('companyObjectId CONVERTIDO (para busca no DB):', companyObjectId);
            console.log('companyObjectId é uma instância de ObjectId:', companyObjectId instanceof mongoose.Types.ObjectId);
        } catch (err) {
            console.error('Formato inválido de companyId:', err);
            return res.status(400).json({ message: 'Formato de ID de empresa inválido.' });
        }

        // Buscar empresa
        console.log('Tentando buscar empresa no DB com ObjectId:', companyObjectId);
        const company = await Company.findById(companyObjectId);
        console.log('Resultado da busca da empresa no DB:', company);

        if (!company) {
            return res.status(400).json({ message: 'Empresa não encontrada com o ID fornecido.' });
        }

        console.log('Empresa encontrada! Nome:', company.nome, 'PIN no DB:', company.pinCadastro);

        // Verificar PIN
        console.log('--- VERIFICAÇÃO DE PIN ---');
        console.log('Tipo de company.pinCadastro (do DB):', typeof company.pinCadastro, 'Valor:', company.pinCadastro);
        console.log('Tipo de pinCadastro recebido (do frontend):', typeof pinCadastro, 'Valor:', pinCadastro);

        if (String(company.pinCadastro) !== String(pinCadastro)) {
            console.log('PIN inválido. PIN no banco:', company.pinCadastro, 'PIN recebido:', pinCadastro);
            return res.status(401).json({ message: 'PIN de cadastro da empresa inválido.' });
        }
        console.log('PIN válido. Prosseguindo com o registro.');

        // Criar novo usuário
        user = new User({
            nome,
            email,
            senha,
            role,
            companyId: companyObjectId,
        });

        await user.save();

        const token = generateToken(user._id, user.nome, user.role, user.companyId);

        res.status(201).json({
            message: 'Usuário registrado com sucesso!',
            token,
            user: {
                id: user._id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
            },
        });

    } catch (error) {
        // Erro de duplicidade (unique: true) no email/username
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            return res.status(400).json({ message: 'E-mail já cadastrado para outro usuário.' });
        }
        console.error('Erro no registro do usuário (catch geral):', error);
        res.status(500).json({ message: 'Erro no servidor ao registrar usuário.' });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    const { username, password } = req.body; // No frontend, estamos usando 'username' para o email

    if (!username || !password) {
        return res.status(400).json({ message: 'Informe e-mail e senha.' });
    }

    try {
        // Buscar usuário pelo email (que é o 'username' enviado do frontend)
        const user = await User.findOne({ email: username });

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await user.matchPassword(password); // Usando o método do modelo User

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Gerar o token JWT
        const token = generateToken(user._id, user.nome, user.role, user.companyId);

        res.json({
            message: 'Login bem-sucedido!',
            token,
            user: {
                id: user._id,
                nomeCompleto: user.nome, // Renomeado para 'nomeCompleto' para consistência com o frontend
                email: user.email,
                role: user.role,
                companyId: user.companyId
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

// Exporta apenas o router
module.exports = router;