// routes/fichaRoutes.js
const express = require('express');
const router = express.Router();
const FichaCadastral = require('../models/FichaCadastral'); // AJUSTE O CAMINHO SE NECESSÁRIO
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/authMiddleware'); // AJUSTE O CAMINHO SE NECESSÁRIO

// ROTA POST para criar uma nova ficha cadastral
router.post('/', protect, authorize('vendedor', 'gerente'), async (req, res) => {
    try {
        console.log('Requisição POST para /api/fichas recebida. Corpo:', req.body);

        const fichaData = {
            ...req.body,
            companyId: req.user.companyId,
            cadastradoPor: req.user.id
        };

        const novaFicha = new FichaCadastral(fichaData);
        await novaFicha.save();

        const fichaPopulada = await FichaCadastral.findById(novaFicha._id)
            .populate('clienteId')
            .populate('veiculoInteresse.veiculoId')
            .populate('cadastradoPor')
            .populate('ultimaAnalisePor')
            .populate('ultimaConferenciaPor')
            .populate('ultimaDocumentacaoPor');
           

        res.status(201).json({
            message: 'Ficha cadastrada com sucesso!',
            ficha: fichaPopulada
        });

    } catch (error) {
        console.error('Erro ao cadastrar nova ficha:', error);
        let errorMessage = 'Erro interno do servidor ao cadastrar ficha.';
        if (error.code === 11000) {
            errorMessage = 'Já existe uma ficha com este CPF/cliente. Por favor, verifique.';
        } else if (error.name === 'ValidationError') {
            errorMessage = `Dados inválidos: ${Object.values(error.errors).map(err => err.message).join(', ')}`;
        }
        res.status(500).json({ message: errorMessage, error: error.message });
    }
});

// ROTA PUT para atualizar uma ficha cadastral existente
router.put('/:id', protect, authorize('vendedor', 'gerente', 'fn', 'conferente', 'documentacao'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Requisição PUT para /api/fichas/${id} recebida. Corpo:`, req.body);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de ficha inválido.' });
        }

        const fichaExistente = await FichaCadastral.findById(id);
        if (!fichaExistente || fichaExistente.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(404).json({ message: 'Ficha não encontrada ou não pertence à sua empresa.' });
        }

        if (req.user.role === 'vendedor' && !fichaExistente.podeSerEditadaPeloVendedor) {
            const statusNaoEditavelVendedor = ['AGUARDANDO_ANALISE_FN', 'EM_ANALISE_FN', 'APROVADA_FN', 'REPROVADA_FN', 'FINALIZADA', 'AGUARDANDO_CONFERENCIA', 'EM_CONFERENCIA', 'CONFERIDA', 'AGUARDANDO_DOCUMENTACAO', 'PROCESSO_EM_TRANSFERENCIA'];
            if (statusNaoEditavelVendedor.includes(fichaExistente.status) && req.body.status !== 'DEVOLVIDA_AO_VENDEDOR') {
                return res.status(403).json({ message: 'Você não tem permissão para editar esta ficha neste status.' });
            }
        }

        req.body.updatedAt = new Date();

        if (req.body.status) {
            const newStatus = req.body.status;
            if (['APROVADA_FN', 'REPROVADA_FN', 'EM_ANALISE_FN'].includes(newStatus)) {
                req.body.ultimaAnalisePor = req.user.id;
            } else if (['CONFERIDA', 'EM_CONFERENCIA'].includes(newStatus)) {
                req.body.ultimaConferenciaPor = req.user.id;
            } else if (['PROCESSO_EM_TRANSFERENCIA', 'FINALIZADA'].includes(newStatus)) {
                req.body.ultimaDocumentacaoPor = req.user.id;
            }
        }

        const updatedFicha = await FichaCadastral.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        const fichaPopulada = await FichaCadastral.findById(updatedFicha._id)
            .populate('clienteId')
            .populate('veiculoInteresse.veiculoId')
            .populate('cadastradoPor')
            .populate('financeirasConsultadas.analisadoPor')
            .populate('historicoDialogo.remetente')
            .populate('ultimaAnalisePor')
            .populate('ultimaConferenciaPor')
            .populate('ultimaDocumentacaoPor');

        res.status(200).json({
            message: 'Ficha atualizada com sucesso!',
            ficha: fichaPopulada
        });

    } catch (error) {
        console.error('Erro ao atualizar ficha:', error);
        let errorMessage = 'Erro interno do servidor ao atualizar ficha.';
        if (error.name === 'ValidationError') {
            errorMessage = `Dados inválidos: ${Object.values(error.errors).map(err => err.message).join(', ')}`;
        } else if (error.kind === 'ObjectId') {
             errorMessage = 'ID de ficha inválido no servidor.';
        }
        res.status(500).json({ message: errorMessage, error: error.message });
    }
});


// ROTA GET PRINCIPAL (Para Ficha Cadastral do Vendedor e outros roles com filtros)
router.get('/', protect, authorize('vendedor', 'gerente', 'fn'), async (req, res) => {
    try {
        let query = { companyId: new mongoose.Types.ObjectId(req.user.companyId) };

        if (req.user.role === 'vendedor') {
            query.cadastradoPor = new mongoose.Types.ObjectId(req.user.id);
        }

        if (req.query.status) {
            query.status = { $in: req.query.status.split(',') };
        }

        // Lógica de filtro por MÊS e ANO
        const { month, year } = req.query;
        if (month && year) {
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1); // Mês é 0-indexed no JS
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0); // Último dia do mês

            query.createdAt = {
                $gte: startOfMonth,
                $lte: endOfMonth
            };
        }

        const fichas = await FichaCadastral.find(query)
            .populate('clienteId', 'nomeCompleto cpf telefonePrincipal')
            .populate('veiculoInteresse.veiculoId', 'modelo placa ano')
            .populate('cadastradoPor', 'nome role')
            .populate('ultimaAnalisePor', 'nome role')
            .populate('ultimaConferenciaPor', 'nome role')
            .populate('ultimaDocumentacaoPor', 'nome role')
            .populate('dadosVendaFinal.veiculoTroca.veiculoId')
            .sort({ createdAt: -1 });

        res.json(fichas);
    } catch (error) {
        console.error('Erro na rota GET /api/fichas (principal):', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar fichas.' });
    }
});

// Nova ROTA para Vendas Concluídas (Vendedor e Gerente podem visualizar)
router.get('/vendas-concluidas', protect, authorize('vendedor', 'gerente'), async (req, res) => {
    try {
        if (!req.user || !req.user.companyId || !mongoose.Types.ObjectId.isValid(req.user.companyId)) {
            console.error('Erro 400: companyId inválido ou ausente no token do usuário:', req.user ? req.user.companyId : 'N/A');
            return res.status(400).json({ message: 'ID da empresa inválido ou não fornecido no token de autenticação.' });
        }

        let query = {
            companyId: new mongoose.Types.ObjectId(req.user.companyId),
            // LISTA DE STATUS QUE REPRESENTAM UMA "VENDA CONCLUÍDA"
            status: { $in: [
                'AGUARDANDO_CONFERENCIA',
                'EM_CONFERENCIA',
                // 'CONFERIDA' não é um status persistido, a ficha transiciona para AGUARDANDO_DOCUMENTACAO
                'AGUARDANDO_DOCUMENTACAO',
                'PROCESSO_EM_TRANSFERENCIA',
                'FINALIZADA',
                'CANCELADA' // Incluído se vendas canceladas ainda devem aparecer aqui
            ]}
        };

        if (req.user.role === 'vendedor') {
            query.cadastradoPor = new mongoose.Types.ObjectId(req.user.id);
        }

        // Lógica de filtro por MÊS e ANO
        const { month, year } = req.query;
        if (month && year) {
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0);

            query.createdAt = { // Usamos createdAt para o filtro mensal
                $gte: startOfMonth,
                $lte: endOfMonth
            };
        }

        const fichas = await FichaCadastral.find(query)
            .populate('clienteId', 'nomeCompleto cpf telefonePrincipal')
            .populate('veiculoInteresse.veiculoId', 'modelo placa ano')
            .populate('cadastradoPor', 'nome role')
            .populate('ultimaAnalisePor', 'nome role')
            .populate('ultimaConferenciaPor', 'nome role')
            .populate('ultimaDocumentacaoPor', 'nome role')
            .populate('dadosVendaFinal.veiculoTroca.veiculoId')
            .sort({ updatedAt: -1 });

        res.json(fichas);
    } catch (error) {
        console.error('Erro ao buscar fichas de vendas concluídas no backend:', error);
        res.status(500).json({ message: 'Erro ao buscar vendas concluídas.' });
    }
});


// ROTA PARA CONFERÊNCIA
router.get('/conferencia', protect, authorize('conferente', 'gerente'), async (req, res) => {
    try {
        let query = {
            companyId: new mongoose.Types.ObjectId(req.user.companyId),
        };

        if (req.user.role === 'conferente') {
            query.$or = [
                { status: { $in: ['AGUARDANDO_CONFERENCIA', 'EM_CONFERENCIA'] } },
                { ultimaConferenciaPor: new mongoose.Types.ObjectId(req.user.id) }
            ];
            // Lógica para conferente visualizar fichas que já passou por ele
            if (!query.$or[1] && req.user.role === 'conferente') { // Esta condição parece ser um fallback ou ajuste, manter como está.
                query.status = { $in: [
                    'AGUARDANDO_CONFERENCIA', 'EM_CONFERENCIA',
                    'AGUARDANDO_DOCUMENTACAO', 'PROCESSO_EM_TRANSFERENCIA', 'FINALIZADA', 'CANCELADA'
                ]};
                delete query.$or;
            }
        } else if (req.user.role === 'gerente') {
             query.status = { $in: [
                'AGUARDANDO_CONFERENCIA', 'EM_CONFERENCIA', 'AGUARDANDO_DOCUMENTACAO',
                'PROCESSO_EM_TRANSFERENCIA', 'FINALIZADA', 'CANCELADA'
            ]};
        }

        // Lógica de filtro por MÊS e ANO
        const { month, year } = req.query;
        if (month && year) {
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0);

            query.createdAt = {
                $gte: startOfMonth,
                $lte: endOfMonth
            };
        }

        const fichas = await FichaCadastral.find(query)
            .populate('clienteId', 'nomeCompleto cpf telefonePrincipal')
            .populate('veiculoInteresse.veiculoId', 'modelo placa ano')
            .populate('cadastradoPor', 'nome role')
            .populate('ultimaAnalisePor', 'nome role')
            .populate('ultimaConferenciaPor', 'nome role')
            .populate('ultimaDocumentacaoPor', 'nome role')
            .sort({ updatedAt: -1 });

        res.json(fichas);
    } catch (error) {
        console.error('Erro ao buscar fichas para conferência no backend:', error);
        res.status(500).json({ message: 'Erro ao buscar fichas para conferência.' });
    }
});

// ROTA PARA DOCUMENTAÇÃO
router.get('/documentacao', protect, authorize('documentacao', 'gerente'), async (req, res) => {
    try {
        let query = {
            companyId: new mongoose.Types.ObjectId(req.user.companyId),
        };

        if (req.user.role === 'documentacao') {
            query.$or = [
                { status: { $in: ['AGUARDANDO_DOCUMENTACAO', 'PROCESSO_EM_TRANSFERENCIA'] } },
                { ultimaDocumentacaoPor: new mongoose.Types.ObjectId(req.user.id) }
            ];
            // Lógica para documentação visualizar fichas que já passou por ele
            if (!query.$or[1] && req.user.role === 'documentacao') { // Esta condição parece ser um fallback ou ajuste, manter como está.
                query.status = { $in: [
                    'AGUARDANDO_DOCUMENTACAO', 'PROCESSO_EM_TRANSFERENCIA',
                    'FINALIZADA', 'CANCELADA'
                ]};
                delete query.$or;
            }
        } else if (req.user.role === 'gerente') {
             query.status = { $in: [
                'AGUARDANDO_DOCUMENTACAO', 'PROCESSO_EM_TRANSFERENCIA', 'FINALIZADA', 'CANCELADA'
            ]};
        }

        // Lógica de filtro por MÊS e ANO
        const { month, year } = req.query;
        if (month && year) {
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0);

            query.createdAt = {
                $gte: startOfMonth,
                $lte: endOfMonth
            };
        }

        const fichas = await FichaCadastral.find(query)
            .populate('clienteId', 'nomeCompleto cpf telefonePrincipal')
            .populate('veiculoInteresse.veiculoId', 'modelo placa ano')
            .populate('cadastradoPor', 'nome role')
            .populate('ultimaAnalisePor', 'nome role')
            .populate('ultimaConferenciaPor', 'nome role')
            .populate('ultimaDocumentacaoPor', 'nome role')
            .sort({ updatedAt: -1 });

        res.json(fichas);
    } catch (error) {
        console.error('Erro ao buscar fichas para documentação no backend:', error);
        res.status(500).json({ message: 'Erro ao buscar fichas para documentação.' });
    }
});

// Nova ROTA para Fichas Arquivadas (Status FINALIZADA)
router.get('/arquivo', protect, authorize('gerente'), async (req, res) => {
    try {
        if (!req.user || !req.user.companyId || !mongoose.Types.ObjectId.isValid(req.user.companyId)) {
            console.error('Erro 400: companyId inválido ou ausente no token do usuário:', req.user ? req.user.companyId : 'N/A');
            return res.status(400).json({ message: 'ID da empresa inválido ou não fornecido no token de autenticação.' });
        }

        let query = {
            companyId: new mongoose.Types.ObjectId(req.user.companyId),
            status: 'FINALIZADA' // Apenas fichas com status FINALIZADA
        };

        // Adicionar filtro de texto para busca, se fornecido
        if (req.query.search) {
            const searchText = req.query.search;
            // Busca em nome do cliente, CPF, marca/modelo do veículo
            query.$or = [
                { nomeCompletoCliente: { $regex: searchText, $options: 'i' } },
                { cpfCliente: { $regex: searchText, $options: 'i' } },
                { 'veiculoInteresse.marcaModelo': { $regex: searchText, $options: 'i' } },
                // Se quiser buscar por nome do vendedor, precisaria de um populate e depois filter no JS,
                // ou uma query mais complexa com aggregate. Por simplicidade, fica no JS.
            ];
        }

        // Lógica de filtro por MÊS e ANO
        const { month, year } = req.query;
        if (month && year) {
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0);

            query.createdAt = {
                $gte: startOfMonth,
                $lte: endOfMonth
            };
        }


        const fichas = await FichaCadastral.find(query)
            .populate('clienteId', 'nomeCompleto cpf') // Popula dados do cliente
            .populate('veiculoInteresse.veiculoId', 'modelo placa') // Popula dados do veículo
            .populate('cadastradoPor', 'nome') // Popula dados do vendedor
            .sort({ updatedAt: -1 }); // Ordena pelas mais recentes finalizações

        res.json(fichas);
    } catch (error) {
        console.error('Erro ao buscar fichas arquivadas no backend:', error);
        res.status(500).json({ message: 'Erro ao buscar fichas arquivadas.' });
    }
});


// ROTA GENÉRICA POR ID (VEM POR ÚLTIMO)
router.get('/:id', protect, async (req, res) => {
     try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de ficha inválido.' });
        }
        const ficha = await FichaCadastral.findById(req.params.id)
            .populate('historicoDialogo.remetente', 'nome')
            .populate('financeirasConsultadas.analisadoPor', 'nome')
            .populate('veiculoInteresse.veiculoId')
            .populate('clienteId')
            .populate('cadastradoPor')
            .populate('ultimaAnalisePor')
            .populate('ultimaConferenciaPor')
            .populate('ultimaDocumentacaoPor')
            .populate('dadosVendaFinal.veiculoTroca.veiculoId');
            

        if (!ficha || ficha.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(404).json({ message: 'Ficha não encontrada ou não pertence à sua empresa.' });
        }

        res.json(ficha);
    } catch (error) {
        console.error('Erro ao buscar ficha por ID no backend:', error);
        res.status(500).json({ message: 'Erro ao buscar ficha.' });
    }
});


// Rota para deletar uma ficha
router.delete('/:id', protect, authorize('gerente'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de ficha inválido.' });
        }

        const ficha = await FichaCadastral.findById(id);
        if (!ficha) {
            return res.status(404).json({ message: 'Ficha não encontrada.' });
        }

        if (ficha.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(403).json({ message: 'Você não tem permissão para excluir esta ficha.' });
        }

        await FichaCadastral.findByIdAndDelete(id);
        res.status(200).json({ message: 'Ficha excluída com sucesso!' });

    } catch (error) {
        console.error('Erro ao excluir ficha:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao excluir ficha.', error: error.message });
    }
});


// Rota para adicionar/atualizar uma análise financeira
router.patch('/:id/analise-financeira', protect, authorize('fn', 'gerente'), async (req, res) => {
    try {
        const { id } = req.params;
        const { financeirasConsultadas, status, historicoDialogoEntry } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de ficha inválido.' });
        }

        const ficha = await FichaCadastral.findById(id);
        if (!ficha || ficha.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(404).json({ message: 'Ficha não encontrada ou não pertence à sua empresa.' });
        }

        const updateData = {
            $set: { updatedAt: new Date() }
        };

        if (financeirasConsultadas && financeirasConsultadas.length > 0) {
            updateData.$push = {
                financeirasConsultadas: {
                    ...financeirasConsultadas[0],
                    analisadoPor: req.user.id,
                    dataAnalise: new Date()
                }
            };
        }

        if (status) {
            updateData.$set.status = status;
            if (['APROVADA_FN', 'REPROVADA_FN', 'EM_ANALISE_FN', 'AGUARDANDO_CONFERENCIA'].includes(status)) {
                updateData.$set.podeSerEditadaPeloVendedor = false;
            } else if (status === 'DEVOLVIDA_AO_VENDEDOR') {
                updateData.$set.podeSerEditadaPeloVendedor = true;
            }

            if (['APROVADA_FN', 'REPROVADA_FN', 'EM_ANALISE_FN', 'DEVOLVIDA_AO_VENDEDOR'].includes(status)) {
                updateData.$set.ultimaAnalisePor = req.user.id;
            }
        }

        if (historicoDialogoEntry) {
            if (!updateData.$push) updateData.$push = {};
            updateData.$push.historicoDialogo = historicoDialogoEntry;
        }

        const updatedFicha = await FichaCadastral.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('clienteId veiculoInteresse.veiculoId cadastradoPor financeirasConsultadas.analisadoPor historicoDialogo.remetente ultimaAnalisePor ultimaConferenciaPor ultimaDocumentacaoPor');

        if (!updatedFicha) {
            return res.status(404).json({ message: 'Ficha não encontrada após atualização.' });
        }

        res.status(200).json({
            message: 'Análise financeira e status da ficha atualizados com sucesso!',
            ficha: updatedFicha
        });

    } catch (error) {
        console.error('Erro ao adicionar análise financeira ou atualizar status da ficha:', error);
        let errorMessage = 'Erro interno do servidor ao processar análise financeira.';
        if (error.name === 'ValidationError') {
            errorMessage = `Dados inválidos: ${Object.values(error.errors).map(err => err.message).join(', ')}`;
        }
        res.status(500).json({ message: errorMessage, error: error.message });
    }
});


// Rota para adicionar uma nova mensagem ao histórico de diálogo (com push)
router.patch('/:id/dialogo', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { mensagem } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de ficha inválido.' });
        }

        const ficha = await FichaCadastral.findById(id);
        if (!ficha || ficha.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(404).json({ message: 'Ficha não encontrada ou não pertence à sua empresa.' });
        }

        const updatedFicha = await FichaCadastral.findByIdAndUpdate(
            id,
            {
                $push: {
                    historicoDialogo: {
                        remetente: req.user.id,
                        mensagem: mensagem,
                        data: new Date()
                    }
                },
                $set: { updatedAt: new Date() }
            },
            { new: true, runValidators: true }
        ).populate('historicoDialogo.remetente', 'nome')
         .populate('ultimaAnalisePor')
         .populate('ultimaConferenciaPor')
         .populate('ultimaDocumentacaoPor');

        if (!updatedFicha) {
            return res.status(404).json({ message: 'Ficha não encontrada para adicionar diálogo.' });
        }

        res.status(200).json({
            message: 'Mensagem adicionada ao histórico da ficha com sucesso!',
            ficha: updatedFicha
        });

    } catch (error) {
        console.error('Erro ao adicionar mensagem ao histórico de diálogo:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao adicionar mensagem.', error: error.message });
    }
});


// Rota para atualizar o status da ficha (geral)
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { id } = req.params;
        let { status, historicoDialogoEntry } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de ficha inválido.' });
        }

        const ficha = await FichaCadastral.findById(id);
        if (!ficha || ficha.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(404).json({ message: 'Ficha não encontrada ou não pertence à sua empresa.' });
        }

        const updateFields = {
            updatedAt: new Date()
        };

        if (status === 'CONFERIDA') {
            console.log(`[BACKEND] Status recebido: CONFERIDA. Alterando para: AGUARDANDO_DOCUMENTACAO`);
            updateFields.status = 'AGUARDANDO_DOCUMENTACAO';
            updateFields.podeSerEditadaPeloVendedor = false;
            updateFields.ultimaConferenciaPor = req.user.id;
        }
        else if (status === 'FINALIZADA') {
            console.log(`[BACKEND] Status recebido: FINALIZADA. Mantendo como FINALIZADA`);
            updateFields.status = 'FINALIZADA';
            updateFields.podeSerEditadaPeloVendedor = false;
            updateFields.ultimaDocumentacaoPor = req.user.id;
        }
        else if (status === 'PROCESSO_EM_TRANSFERENCIA') {
            console.log(`[BACKEND] Status recebido: PROCESSO_EM_TRANSFERENCIA. Mantendo como PROCESSO_EM_TRANSFERENCIA`);
            updateFields.status = 'PROCESSO_EM_TRANSFERENCIA';
            updateFields.podeSerEditadaPeloVendedor = false;
            updateFields.ultimaDocumentacaoPor = req.user.id;
        }
        else if (status === 'DEVOLVIDA_AO_VENDEDOR') {
            console.log(`[BACKEND] Status recebido: DEVOLVIDA_AO_VENDEDOR. Mantendo como DEVOLVIDA_AO_VENDEDOR`);
            updateFields.status = 'DEVOLVIDA_AO_VENDEDOR';
            updateFields.podeSerEditadaPeloVendedor = true;
            updateFields.ultimaAnalisePor = req.user.id;
        }
        else {
            console.log(`[BACKEND] Status recebido: ${status}. Mantendo como ${status}`);
            updateFields.status = status;
            if (['APROVADA_FN', 'REPROVADA_FN', 'EM_ANALISE_FN', 'AGUARDANDO_CONFERENCIA'].includes(status)) {
                updateFields.podeSerEditadaPeloVendedor = false;
                if (['APROVADA_FN', 'REPROVADA_FN', 'EM_ANALISE_FN'].includes(status)) {
                    updateFields.ultimaAnalisePor = req.user.id;
                }
            }
        }

        const updateOperation = { $set: updateFields };

        if (historicoDialogoEntry) {
            updateOperation.$push = { historicoDialogo: historicoDialogoEntry };
        }

        const updatedFicha = await FichaCadastral.findByIdAndUpdate(
            id,
            updateOperation,
            { new: true, runValidators: true }
        ).populate('historicoDialogo.remetente', 'nome')
         .populate('ultimaAnalisePor', 'nome role')
         .populate('ultimaConferenciaPor', 'nome role')
         .populate('ultimaDocumentacaoPor', 'nome role');

        if (!updatedFicha) {
            return res.status(404).json({ message: 'Ficha não encontrada para atualização de status.' });
        }

        console.log(`[BACKEND] Ficha ${id} atualizada. Novo status no DB: ${updatedFicha.status}`);

        res.status(200).json({
            message: `Status da ficha atualizado para ${updatedFicha.status.replace(/_/g, ' ')} com sucesso!`,
            ficha: updatedFicha
        });

    } catch (error) {
        console.error('Erro ao atualizar status da ficha:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar status da ficha.', error: error.message });
    }
});


module.exports = router;