// routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const Client = require('../models/Client'); // Importa o modelo de Cliente
const mongoose = require('mongoose'); // Necessário para ObjectId
const { protect, authorize } = require('./userRoutes'); // Importa middlewares de autenticação/autorização

// @route   POST /api/clients
// @desc    Cadastrar um novo cliente
// @access  Private (apenas vendedores e gerentes podem cadastrar)
router.post('/', protect, authorize('vendedor', 'gerente'), async (req, res) => {
    // Coleta os dados do corpo da requisição
    const { 
        nomeCompleto, cpf, rg, dataNascimento, email, 
        telefonePrincipal, telefoneSecundario, endereco, 
        profissao, estadoCivil 
    } = req.body;

    const companyId = req.user.companyId; // Pega o companyId do usuário logado (do token)

    console.log('--- TENTATIVA DE CADASTRO DE CLIENTE ---');
    console.log('Dados recebidos:', req.body);
    console.log('Company ID do usuário logado:', companyId);

    // Validação básica dos campos obrigatórios que não são nulos no schema
    if (!nomeCompleto || !cpf || !telefonePrincipal) {
        return res.status(400).json({ message: 'Por favor, preencha nome completo, CPF e telefone principal.' });
    }

    try {
        // 1. Verificar se já existe um cliente com o mesmo CPF para esta empresa
        const clientExists = await Client.findOne({ 
            cpf, 
            companyId: new mongoose.Types.ObjectId(companyId) 
        });

        if (clientExists) {
            console.warn(`Tentativa de cadastrar CPF duplicado (${cpf}) para a empresa ${companyId}.`);
            return res.status(400).json({ message: 'Cliente com este CPF já cadastrado para esta empresa.' });
        }

        // 2. Criar uma nova instância de Cliente
        const newClient = new Client({
            nomeCompleto,
            cpf,
            rg,
            dataNascimento: dataNascimento || undefined, // undefined se vazio
            email,
            telefonePrincipal,
            telefoneSecundario,
            endereco: endereco || {}, // Garante que endereco seja um objeto, mesmo se vazio
            profissao,
            estadoCivil,
            companyId: new mongoose.Types.ObjectId(companyId) // Associa ao companyId do usuário logado
        });

        console.log('Tentando salvar novo cliente:', newClient);

        // 3. Salvar o cliente no banco de dados
        await newClient.save();

        console.log('Cliente cadastrado com sucesso:', newClient._id);
        res.status(201).json({ 
            message: 'Cliente cadastrado com sucesso!', 
            client: newClient // Retorna o cliente cadastrado, se útil
        });

    } catch (error) {
        // Tratamento de erros específicos do Mongoose (validação, duplicidade)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Erro de validação do Mongoose ao cadastrar cliente:', messages);
            return res.status(400).json({ message: `Erro de validação: ${messages.join(', ')}` });
        }
        if (error.code === 11000 && error.keyPattern && error.keyPattern.cpf) {
            console.error('Erro de duplicidade (E11000) ao cadastrar cliente - CPF já existe:', error.message);
            return res.status(400).json({ message: 'CPF já cadastrado para outro cliente.' });
        }
        
        console.error('Erro INESPERADO ao cadastrar cliente:', error);
        res.status(500).json({ message: 'Erro no servidor ao cadastrar cliente.' });
    }
});


// @route   GET /api/clients
// @desc    Obter clientes. Se um CPF for fornecido via query, busca por CPF. Senão, lista todos.
// @access  Private (todos os roles podem listar, mas filtrado por companyId)
router.get('/', protect, async (req, res) => {
    const companyId = req.user.companyId;
    const { cpf } = req.query; // <<< ALTERAÇÃO 1: Captura o CPF da URL.

    console.log('--- TENTATIVA DE LISTAR/BUSCAR CLIENTES ---');
    console.log('Company ID:', companyId, 'CPF da Query:', cpf || 'Nenhum');

    try {
        // ALTERAÇÃO 2: Monta a busca inicial apenas com o ID da empresa.
        let query = { companyId: new mongoose.Types.ObjectId(companyId) };

        // ALTERAÇÃO 3: Se um CPF foi enviado, adiciona ele na busca.
        if (cpf) {
            query.cpf = String(cpf).replace(/\D/g, ''); // Limpa o CPF para buscar apenas os números
            console.log(`Buscando cliente específico por CPF: ${query.cpf}`);
        }

        // ALTERAÇÃO 4: Executa a busca com os critérios montados.
        const clients = await Client.find(query).sort({ nomeCompleto: 1 });
        
        console.log(`Encontrados ${clients.length} clientes para a consulta.`);
        res.json(clients);

    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar clientes.' });
    }
});


// @route   GET /api/clients/:id
// @desc    Obter um cliente específico pelo ID
// @access  Private (apenas vendedores e gerentes podem buscar)
router.get('/:id', protect, authorize('vendedor', 'gerente'), async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        // 1. Validar se o ID fornecido é um ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de cliente inválido.' });
        }

        // 2. Buscar o cliente pelo ID e garantir que ele pertença à empresa do usuário logado
        const client = await Client.findOne({ 
            _id: new mongoose.Types.ObjectId(id), 
            companyId: new mongoose.Types.ObjectId(companyId) 
        });

        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado ou não pertence à sua empresa.' });
        }

        res.json(client); // Retorna os dados do cliente
    } catch (error) {
        console.error('Erro ao buscar cliente por ID:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar cliente.' });
    }
});


// @route   PUT /api/clients/:id
// @desc    Atualizar informações de um cliente
// @access  Private (apenas vendedores e gerentes podem atualizar)
router.put('/:id', protect, authorize('vendedor', 'gerente'), async (req, res) => {
    const { id } = req.params; // ID do cliente a ser atualizado
    // Coleta os dados do corpo da requisição para atualização
    const { 
        nomeCompleto, cpf, rg, dataNascimento, email, 
        telefonePrincipal, telefoneSecundario, endereco, 
        profissao, estadoCivil 
    } = req.body;

    const companyId = req.user.companyId; // Pega o companyId do usuário logado (do token)

    console.log(`--- TENTATIVA DE ATUALIZAR CLIENTE (PUT /api/clients/${id}) ---`);
    console.log('Dados recebidos para atualização:', req.body);
    console.log('ID do cliente a ser atualizado (params):', id);
    console.log('CompanyId do usuário logado (token):', companyId);

    try {
        // 1. Validar se o ID fornecido é um ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de cliente inválido.' });
        }

        // 2. Buscar o cliente pelo ID
        let client = await Client.findById(new mongoose.Types.ObjectId(id));

        // 3. Verificar se o cliente foi encontrado
        if (!client) {
            console.warn('Cliente não encontrado com o ID:', id);
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }

        // 4. Garantir que o cliente pertença à empresa do usuário logado
        if (client.companyId.toString() !== companyId.toString()) {
            console.warn(`Tentativa de usuário ${req.user.id} editar cliente (${id}) de outra empresa (${client.companyId}).`);
            return res.status(403).json({ message: 'Você não tem permissão para editar este cliente.' });
        }

        // 5. Atualizar os campos do cliente se forem fornecidos
        if (nomeCompleto !== undefined) client.nomeCompleto = nomeCompleto;
        
        // Se o CPF for alterado, verificar se o novo CPF já existe para outro cliente na mesma empresa
        if (cpf !== undefined && cpf !== client.cpf) {
            const cpfExists = await Client.findOne({ 
                cpf, 
                companyId: new mongoose.Types.ObjectId(companyId) 
            });
            if (cpfExists) {
                console.warn('Tentativa de atualizar CPF para um já existente:', cpf);
                return res.status(400).json({ message: 'Este CPF já está em uso por outro cliente na sua empresa.' });
            }
            client.cpf = cpf;
        }

        if (rg !== undefined) client.rg = rg;
        if (dataNascimento !== undefined) client.dataNascimento = dataNascimento; // Pode ser null ou Date
        if (email !== undefined) client.email = email;
        if (telefonePrincipal !== undefined) client.telefonePrincipal = telefonePrincipal;
        if (telefoneSecundario !== undefined) client.telefoneSecundario = telefoneSecundario;
        if (profissao !== undefined) client.profissao = profissao;
        if (estadoCivil !== undefined) client.estadoCivil = estadoCivil;

        // Atualizar endereço (se fornecido)
        if (endereco) {
            if (endereco.rua !== undefined) client.endereco.rua = endereco.rua;
            if (endereco.numero !== undefined) client.endereco.numero = endereco.numero;
            if (endereco.bairro !== undefined) client.endereco.bairro = endereco.bairro;
            if (endereco.cidade !== undefined) client.endereco.cidade = endereco.cidade;
            if (endereco.estado !== undefined) client.endereco.estado = endereco.estado;
            if (endereco.cep !== undefined) client.endereco.cep = endereco.cep;
        }

        // A data 'updatedAt' será atualizada automaticamente pelo middleware 'pre('save')' no modelo

        // 6. Salvar as alterações
        await client.save();
        console.log('Cliente atualizado com sucesso:', client._id);
        res.status(200).json({ message: 'Cliente atualizado com sucesso!', client });

    } catch (error) {
        // Tratamento de erros específicos (validação, duplicidade) e genéricos
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Erro de validação do Mongoose na atualização do cliente:', messages);
            return res.status(400).json({ message: `Erro de validação: ${messages.join(', ')}` });
        }
        if (error.code === 11000 && error.keyPattern && error.keyPattern.cpf) {
            console.error('Erro de duplicidade (E11000) na atualização do cliente - CPF já existe:', error.message);
            return res.status(400).json({ message: 'CPF já cadastrado para outro cliente.' });
        }
        console.error('Erro INESPERADO ao atualizar cliente:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar cliente.' });
    }
});


// @route   DELETE /api/clients/:id
// @desc    Deletar um cliente
// @access  Private (apenas gerentes podem deletar)
router.delete('/:id', protect, authorize('gerente'), async (req, res) => {
    const { id } = req.params;
    const companyId = req.user.companyId;

    console.log(`--- TENTATIVA DE DELETAR CLIENTE (DELETE /api/clients/${id}) ---`);
    console.log('ID do cliente a ser deletado:', id);
    console.log('CompanyId do usuário logado:', companyId);

    try {
        // 1. Validar se o ID fornecido é um ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de cliente inválido.' });
        }

        // 2. Buscar o cliente para garantir que ele exista e pertença à empresa do usuário logado
        const client = await Client.findOne({ 
            _id: new mongoose.Types.ObjectId(id), 
            companyId: new mongoose.Types.ObjectId(companyId) 
        });

        if (!client) {
            console.warn('Cliente não encontrado ou não pertence à empresa para deleção:', id);
            return res.status(404).json({ message: 'Cliente não encontrado ou não pertence à sua empresa.' });
        }

        // 3. Excluir o cliente
        await client.deleteOne(); // Usa deleteOne() em vez de findByIdAndDelete() para mais controle

        console.log('Cliente deletado com sucesso:', id);
        res.status(200).json({ message: 'Cliente deletado com sucesso!' });

    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        res.status(500).json({ message: 'Erro no servidor ao deletar cliente.' });
    }
});


module.exports = router;