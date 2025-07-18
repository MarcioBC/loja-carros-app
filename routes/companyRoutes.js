// routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const Company = require('../models/Company'); // Importa o modelo de Empresa
const { protect, authorize } = require('../middleware/authMiddleware'); // Importa os middlewares de proteção do caminho CORRETO

// @route   POST /api/companies
// @desc    Cadastrar uma nova empresa (apenas para gerentes)
// @access  Private (somente gerentes)
router.post('/', protect, authorize('gerente'), async (req, res) => {
    try {
        const newCompany = new Company(req.body);
        const savedCompany = await newCompany.save();
        res.status(201).json({ message: 'Empresa cadastrada com sucesso!', company: savedCompany });
    } catch (error) {
        if (error.code === 11000) { // Erro de duplicidade (unique: true)
            return res.status(400).json({ message: 'Nome ou CNPJ da empresa já existe.' });
        }
        console.error('Erro ao cadastrar empresa:', error);
        res.status(500).json({ message: 'Erro ao cadastrar empresa.', error: error.message });
    }
});

// @route   GET /api/companies/:id
// @desc    Buscar uma empresa por ID (para qualquer usuário logado ver sua empresa)
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        // req.user é populado pelo middleware 'protect'
        const { companyId, role } = req.user;
        const requestedCompanyId = req.params.id;

        // Gerentes podem ver qualquer empresa
        // Outros usuários só podem ver a própria empresa
        if (role !== 'gerente' && companyId.toString() !== requestedCompanyId.toString()) {
            return res.status(403).json({ message: 'Você não tem permissão para acessar esta empresa.' });
        }

        const company = await Company.findById(requestedCompanyId);

        if (!company) {
            return res.status(404).json({ message: 'Empresa não encontrada.' });
        }
        res.status(200).json(company);
    } catch (error) {
        console.error('Erro ao buscar empresa:', error);
        res.status(500).json({ message: 'Erro ao buscar empresa.', error: error.message });
    }
});

// @route   GET /api/companies
// @desc    Listar todas as empresas (apenas para gerentes)
// @access  Private (somente gerentes)
router.get('/', protect, authorize('gerente'), async (req, res) => {
    try {
        const companies = await Company.find({});
        res.status(200).json(companies);
    } catch (error) {
        console.error('Erro ao listar empresas:', error);
        res.status(500).json({ message: 'Erro ao listar empresas.', error: error.message });
    }
});

// @route   PUT /api/companies/:id
// @desc    Atualizar uma empresa (apenas para gerentes)
// @access  Private (somente gerentes)
router.put('/:id', protect, authorize('gerente'), async (req, res) => {
    try {
        const requestedCompanyId = req.params.id;
        const updatedCompany = await Company.findByIdAndUpdate(requestedCompanyId, req.body, { new: true, runValidators: true });
        if (!updatedCompany) {
            return res.status(404).json({ message: 'Empresa não encontrada.' });
        }
        res.status(200).json({ message: 'Empresa atualizada com sucesso!', company: updatedCompany });
    } catch (error) {
        console.error('Erro ao atualizar empresa:', error);
        res.status(500).json({ message: 'Erro ao atualizar empresa.', error: error.message });
    }
});

// @route   DELETE /api/companies/:id
// @desc    Excluir uma empresa (apenas para gerentes)
// @access  Private (somente gerentes)
router.delete('/:id', protect, authorize('gerente'), async (req, res) => {
    try {
        const requestedCompanyId = req.params.id;
        const deletedCompany = await Company.findByIdAndDelete(requestedCompanyId);
        if (!deletedCompany) {
            return res.status(404).json({ message: 'Empresa não encontrada.' });
        }
        res.status(200).json({ message: 'Empresa excluída com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir empresa:', error);
        res.status(500).json({ message: 'Erro ao excluir empresa.', error: error.message });
    }
});

module.exports = router;