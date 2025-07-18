// routes/vehicleRoutes.js
const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const mongoose = require('mongoose');
const { protect, authorize } = require('./userRoutes');

// @route   POST /api/vehicles
// @desc    Criar um novo veículo
// @access  Private (vendedor, gerente)
router.post('/', protect, authorize('vendedor', 'gerente'), async (req, res) => {
    try {
        const {
            modelo, marca, ano, preco, status, cor, placa, chassi, renavam,
            quilometragem, custoInicial, dataCompra, envelope, custosAdicionais,
            companyId,
            dividas,
            outroProprietario
        } = req.body;

        if (req.user.companyId.toString() !== companyId) {
            return res.status(403).json({ message: 'Não autorizado a cadastrar veículo para esta empresa.' });
        }

        const newVehicle = new Vehicle({
            modelo,
            marca,
            ano,
            preco,
            status,
            cor,
            placa,
            chassi,
            renavam,
            quilometragem,
            custoInicial,
            dataCompra,
            envelope,
            custosAdicionais,
            dividas: dividas || [],
            outroProprietario: outroProprietario || {},
            companyId: new mongoose.Types.ObjectId(companyId),
            cadastradoPor: new mongoose.Types.ObjectId(req.user.id)
        });

        await newVehicle.save();

        res.status(201).json({ message: 'Veículo criado com sucesso!', vehicle: newVehicle });
    } catch (error) {
        console.error('Erro ao criar veículo:', error);
        if (error.code === 11000 && error.keyPattern && error.keyPattern.placa) {
            return res.status(400).json({ message: 'Placa já cadastrada.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Erro de validação: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: 'Erro ao criar veículo.' });
    }
});

// @route   GET /api/vehicles
// @desc    Obter todos os veículos (com filtros de companyId e status)
// @access  Private (todos os usuários autenticados)
router.get('/', protect, async (req, res) => {
    try {
        const { companyId, status } = req.query;
        let query = {};

        // Filtro por companyId (obrigatório)
        if (companyId) {
            query.companyId = new mongoose.Types.ObjectId(companyId);
        } else {
            return res.status(400).json({ message: 'companyId é obrigatório para buscar veículos.' });
        }

        // Filtro por status (opcional):
        // Se um 'status' é fornecido na URL (ex: ?status=DISPONÍVEL), filtra por ele.
        // Se NENHUM 'status' é fornecido, a 'query.status' NÃO é adicionada,
        // permitindo que o Mongoose retorne veículos com QUALQUER status para o companyId.
        if (status) {
            // Se você quiser permitir múltiplos status (ex: ?status=DISPONÍVEL,VENDIDO), use:
            // query.status = { $in: status.split(',') };
            // Caso contrário, use:
            query.status = status;
        }

        // REMOVIDO: O BLOCO PROBLEMÁTICO QUE FILTRAVA 'VENDIDO' E 'DEVOLVIDO' POR PADRÃO.
        // Antigo: if (!status || (status !== 'VENDIDO' && status !== 'DEVOLVIDO')) { query.status = { $nin: ['VENDIDO', 'DEVOLVIDO'] }; }

        const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });

        res.status(200).json(vehicles);
    } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        res.status(500).json({ message: 'Erro ao carregar veículos.' });
    }
});


// @route   PUT /api/vehicles/:id
// @desc    Atualizar um veículo existente
// @access  Private (vendedor, gerente)
router.put('/:id', protect, authorize('vendedor', 'gerente'), async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId: reqCompanyId, ...updateData } = req.body;

        if (req.user.companyId.toString() !== reqCompanyId) {
            return res.status(403).json({ message: 'Você não tem permissão para atualizar veículos de outra empresa.' });
        }

        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(id), companyId: new mongoose.Types.ObjectId(req.user.companyId) },
            updateData,
            { new: true, runValidators: true }
        );

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado ou não pertence à sua empresa.' });
        }
        res.status(200).json({ message: 'Veículo atualizado com sucesso!', vehicle });
    } catch (error) {
        console.error('Erro ao atualizar veículo:', error);
        if (error.code === 11000 && error.keyPattern && error.keyPattern.placa) {
            return res.status(400).json({ message: 'Placa já cadastrada para outro veículo.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Erro de validação: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: 'Erro ao atualizar veículo.' });
    }
});

// @route   GET /api/vehicles/:id
// @desc    Obter um veículo por ID
// @access  Private (todos os usuários autenticados)
router.get('/:id', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: new mongoose.Types.ObjectId(req.params.id),
            companyId: new mongoose.Types.ObjectId(req.user.companyId)
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado ou não pertence à sua empresa.' });
        }
        res.status(200).json(vehicle);
    } catch (error) {
        console.error('Erro ao buscar veículo por ID:', error);
        res.status(500).json({ message: 'Erro ao buscar veículo.' });
    }
});


// @route   DELETE /api/vehicles/:id
// @desc    Excluir um veículo
// @access  Private (gerente)
router.delete('/:id', protect, authorize('gerente'), async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(id),
            companyId: new mongoose.Types.ObjectId(req.user.companyId)
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado ou você não tem permissão para excluí-lo.' });
        }
        res.status(200).json({ message: 'Veículo excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir veículo:', error);
        res.status(500).json({ message: 'Erro ao excluir veículo.' });
    }
});


// NOVO E CORRIGIDO (VERSÃO FINAL): Rota segura para ATUALIZAR STATUS do veículo
// @route   PATCH /api/vehicles/:id/status
// @desc    Atualiza o status de um veículo (ex: para RESERVADO ou VENDIDO)
// @access  Private (vendedor, gerente)
router.patch('/:id/status', protect, authorize('vendedor', 'gerente'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, dataVenda, fichaVendaId } = req.body;
        const companyId = req.user.companyId;

        const allowedStatus = ['RESERVADO', 'VENDIDO', 'DISPONÍVEL'];
        if (!status || !allowedStatus.includes(status)) {
            return res.status(400).json({ message: `Status '${status}' inválido. Apenas ${allowedStatus.join(', ')} são permitidos nesta rota.` });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de veículo inválido.' });
        }

        const vehicle = await Vehicle.findOne({
            _id: new mongoose.Types.ObjectId(id),
            companyId: new mongoose.Types.ObjectId(companyId)
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado ou não pertence à sua empresa.' });
        }

        if (status === 'RESERVADO' && vehicle.status !== 'DISPONÍVEL') {
            return res.status(409).json({ message: `Este veículo não está disponível. Status atual: ${vehicle.status}.` });
        }

        vehicle.status = status;
        if (status === 'VENDIDO') {
            vehicle.dataVenda = dataVenda || new Date();
            vehicle.fichaVendaId = fichaVendaId;
        } else {
            vehicle.dataVenda = null;
            vehicle.fichaVendaId = fichaVendaId || null;
        }

        const updatedVehicle = await vehicle.save();

        res.status(200).json({
            message: `Status do veículo atualizado para ${status} com sucesso!`,
            vehicle: updatedVehicle
        });

    } catch (error) {
        console.error('Erro ao atualizar status do veículo:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar status do veículo.' });
    }
});
module.exports = router;