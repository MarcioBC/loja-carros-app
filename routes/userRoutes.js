// routes/userRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importa o modelo de Usuário
const Company = require('../models/Company'); // Importa o modelo de Empresa
const mongoose = require('mongoose'); // Necessário para ObjectId

const router = express.Router();

// Middleware para proteger rotas - verifica o token JWT
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Adiciona os dados do usuário (id, nome, role, companyId) ao objeto de requisição do token
            next();
        } catch (error) {
            console.error('Erro na verificação do token:', error);
            // Mensagens de erro mais específicas para o cliente
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Sessão expirada. Faça login novamente.' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Token inválido. Faça login novamente.' });
            }
            return res.status(401).json({ message: 'Não autorizado, token falhou.' });
        }
    } else { // Se não houver token no cabeçalho
        return res.status(401).json({ message: 'Não autorizado, token não fornecido.' });
    }
};

// Middleware para autorização baseada em roles
const authorize = (...roles) => {
    return (req, res, next) => {
        // Verifica se req.user existe antes de acessar .role para evitar erro se o token for inválido
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Acesso negado. Usuário com papel ${req.user ? req.user.role : 'não identificado'} não tem permissão para acessar esta rota.` });
        }
        next();
    };
};


// @route   GET /api/users
// @desc    Obter todos os usuários para a empresa do gerente
// @access  Private (apenas gerentes podem listar usuários de sua empresa)
router.get('/', protect, authorize('gerente'), async (req, res) => {
    try {
        const companyId = req.user.companyId; // Pega o companyId do usuário logado (gerente)
        console.log('GET /api/users - companyId do gerente (do token):', companyId);

        // Busca todos os usuários associados a este companyId, excluindo a senha
        // CORREÇÃO: Usar 'new' com mongoose.Types.ObjectId()
        const users = await User.find({ companyId: new mongoose.Types.ObjectId(companyId) }).select('-senha');
        console.log('Usuários encontrados para o companyId:', users.length);
        res.json(users);
    } catch (error) {
        console.error('Erro ao buscar usuários (GET /api/users):', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar usuários.' });
    }
});


// @route   POST /api/auth/register-company-admin
// @desc    Registra uma nova empresa e um usuário administrador para ela
// @access  Public (inicialmente, só para setup)
// NOTA: Esta rota é tipicamente uma rota de AUTENTICAÇÃO e pode ser melhor movida para authRoutes.js.
// No entanto, está sendo mantida aqui para preservar seu código existente.
router.post('/register-company-admin', async (req, res) => {
    // ATENÇÃO: O modelo User.js usa 'email' e 'nome', não 'username' e 'nomeCompleto'.
    // Mapeie os campos conforme o modelo User.js se esta rota for usada.
    const { companyName, companyCnpj, companyAddress, companyPhone, username: email, password, nomeCompleto: nome } = req.body;

    try {
        // 1. Criar a Empresa
        const newCompany = new Company({
            nome: companyName,
            cnpj: companyCnpj,
            endereco: companyAddress,
            telefone: companyPhone
        });
        const company = await newCompany.save();

        // 2. Criar o Usuário Administrador associado a essa empresa
        const newUser = new User({
            nome, // Mapeado de nomeCompleto
            email, // Mapeado de username
            senha: password, // Middleware pre-save fará o hash
            role: 'gerente', // O primeiro usuário para uma nova empresa será um gerente
            companyId: company._id // company._id já é um ObjectId
        });
        await newUser.save();

        res.status(201).json({
            message: 'Empresa e usuário administrador registrados com sucesso!',
            companyId: company._id,
            userId: newUser._id
        });

    } catch (error) {
        if (error.code === 11000) { // Erro de duplicidade (unique: true)
            // Verificar se o erro é no nome da empresa, CNPJ, ou email do usuário
            let message = 'Nome da empresa, CNPJ ou e-mail já existem.';
            if (error.keyPattern && error.keyPattern.email) message = 'E-mail do administrador já está em uso.';
            if (error.keyPattern && error.keyPattern.nome && error.collection.collectionName === 'companies') message = 'Nome da empresa já existe.';
            if (error.keyPattern && error.keyPattern.cnpj) message = 'CNPJ da empresa já existe.';

            return res.status(400).json({ message: message });
        }
        console.error('Erro no registro de empresa/admin:', error);
        res.status(500).json({ message: 'Erro ao registrar empresa ou usuário.' });
    }
});


// @route   POST /api/users/register-user
// @desc    Registra um novo usuário (vendedor, fn, etc.) pela interface de Gerenciar Usuários
// @access  Private (apenas gerentes podem registrar novos usuários)
router.post('/register-user', protect, authorize('gerente'), async (req, res) => {
    // Mapeamento de campos: 'username' do frontend é 'email' no backend, 'nomeCompleto' é 'nome'
    const { username: email, password, role, nomeCompleto: nome, companyId } = req.body;

    console.log('--- DADOS RECEBIDOS NO BACKEND (users/register-user) ---');
    console.log('Email (username do frontend):', email);
    console.log('Nome Completo (nome do frontend):', nome);
    console.log('Role:', role);
    console.log('CompanyId recebido no body (frontend):', companyId);
    console.log('CompanyId do Gerente logado (do token):', req.user.companyId);

    // Garante que o gerente só possa registrar usuários para a SUA empresa
    // Converte para string para garantir comparação correta de ObjectId
    if (req.user.companyId.toString() !== companyId) {
        console.warn('Tentativa de registrar usuário para empresa diferente da do gerente logado.');
        return res.status(403).json({ message: 'Você só pode registrar usuários para a sua própria empresa.' });
    }

    try {
        // Verificar se o usuário (por email) já existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('Erro de validação: Usuário com este email já existe.');
            return res.status(400).json({ message: 'E-mail já cadastrado para outro usuário.' });
        }

        // Cria a instância do novo usuário
        const newUser = new User({
            nome,
            email,
            senha: password, // O middleware pre-save no User.js cuidará do hash
            role,
            // CORREÇÃO: Usar 'new' com mongoose.Types.ObjectId()
            companyId: new mongoose.Types.ObjectId(companyId)
        });

        console.log('Tentando salvar novo usuário:', newUser);

        await newUser.save();

        console.log('Usuário salvo com sucesso!');

        res.status(201).json({ message: 'Usuário registrado com sucesso!' });

    } catch (error) {
        // Tratamento de erros mais específico
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Erro de validação do Mongoose:', messages);
            return res.status(400).json({ message: `Erro de validação: ${messages.join(', ')}` });
        }
        if (error.code === 11000) { // Erro de duplicidade (unique: true)
            console.error('Erro de duplicidade (E11000):', error.message);
            return res.status(400).json({ message: 'E-mail já cadastrado para outro usuário.' });
        }
        
        console.error('Erro INESPERADO no registro de usuário (POST /api/users/register-user):', error);
        res.status(500).json({ message: 'Erro ao registrar usuário. Detalhes: ' + error.message });
    }
});


// @route   POST /api/auth/login
// @desc    Autentica um usuário e retorna um token JWT
// @access  Public
// NOTA: Esta rota é tipicamente uma rota de AUTENTICAÇÃO e pode ser melhor movida para authRoutes.js.
// No entanto, está sendo mantida aqui para preservar seu código existente.
router.post('/login', async (req, res) => {
    // ATENÇÃO: O modelo User.js usa 'email', não 'username'.
    // O frontend envia 'username' para o campo de login. Mapeie para 'email'.
    const { username: email, password } = req.body;

    try {
        const user = await User.findOne({ email }); // Busca pelo campo 'email' no modelo

        if (!user) {
            return res.status(401).json({ message: 'E-mail ou senha inválidos.' }); // Mensagem ajustada para refletir 'email'
        }

        const isMatch = await user.matchPassword(password); // Usa o método do modelo para comparar senha

        if (!isMatch) {
            return res.status(401).json({ message: 'E-mail ou senha inválidos.' }); // Mensagem ajustada
        }

        // Gerar o token JWT
        const token = jwt.sign(
            { id: user._id, nome: user.nome, role: user.role, companyId: user.companyId }, // Incluindo 'nome' para o frontend
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expira em 1 hora
        );

        res.json({
            message: 'Login bem-sucedido!',
            token,
            user: {
                id: user._id,
                nomeCompleto: user.nome, // Enviando como 'nomeCompleto' para o frontend
                email: user.email, // Enviando o email para o frontend
                role: user.role,
                companyId: user.companyId
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});


// @route   PUT /api/users/:id
// @desc    Atualizar informações de um usuário
// @access  Private (apenas gerentes podem atualizar usuários da sua empresa)
router.put('/:id', protect, authorize('gerente'), async (req, res) => {
    const { id } = req.params; // ID do usuário a ser atualizado (da URL)
    const { nome, email, role, password } = req.body; // Dados do corpo da requisição

    console.log(`--- TENTATIVA DE ATUALIZAR USUÁRIO (PUT /api/users/${id}) ---`);
    console.log('Dados recebidos para atualização:', { nome, email, role, password: password ? '[SENHA FORNECIDA]' : '[NÃO FORNECIDA]' });
    console.log('ID do usuário a ser atualizado (params):', id);
    console.log('CompanyId do gerente logado (token):', req.user.companyId);

    try {
        // 1. Validar se o ID fornecido na URL é um ObjectId válido do MongoDB
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.warn('ID de usuário inválido fornecido:', id);
            return res.status(400).json({ message: 'ID de usuário inválido.' });
        }

        // 2. Buscar o usuário pelo ID
        let user = await User.findById(new mongoose.Types.ObjectId(id)); // CORREÇÃO: Usar 'new' com ObjectId aqui!

        // 3. Verificar se o usuário foi encontrado
        if (!user) {
            console.warn('Usuário não encontrado com o ID:', id);
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // 4. Garantir que o gerente só edite usuários da SUA PRÓPRIA empresa
        // Compara o companyId do usuário que está sendo editado com o companyId do gerente logado.
        if (user.companyId.toString() !== req.user.companyId.toString()) {
            console.warn(`Tentativa de gerente ${req.user.id} editar usuário (${id}) de outra empresa (${user.companyId}).`);
            return res.status(403).json({ message: 'Você não tem permissão para editar este usuário.' });
        }

        // 5. Atualizar os campos do usuário, apenas se forem fornecidos no corpo da requisição
        if (nome !== undefined) user.nome = nome;
        // Se o email for alterado, verificar se o novo email já existe para outro usuário
        if (email !== undefined && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                console.warn('Tentativa de atualizar email para um já existente:', email);
                return res.status(400).json({ message: 'Este e-mail já está em uso por outro usuário.' });
            }
            user.email = email;
        }
        if (role !== undefined) user.role = role;
        // Se uma nova senha for fornecida, ela será hasheada automaticamente pelo middleware 'pre("save")' no User.js
        if (password !== undefined && password !== '') { // Verifica se password não é vazio
            user.senha = password;
            console.log('Senha do usuário será atualizada (hash via middleware).');
        }

        // 6. Salvar as alterações no banco de dados
        await user.save();
        console.log('Usuário atualizado com sucesso:', user._id);

        res.status(200).json({ message: 'Usuário atualizado com sucesso!' });

    } catch (error) {
        // Tratamento de erros específicos (validação, duplicidade) e genéricos
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Erro de validação do Mongoose na atualização:', messages);
            return res.status(400).json({ message: `Erro de validação: ${messages.join(', ')}` });
        }
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) { // Erro de duplicidade no email
            console.error('Erro de duplicidade (E11000) na atualização:', error.message);
            return res.status(400).json({ message: 'E-mail já cadastrado para outro usuário.' });
        }
        console.error('Erro INESPERADO ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar usuário.' });
    }
});


// @route   DELETE /api/users/:id
// @desc    Deletar um usuário
// @access  Private (apenas gerentes podem deletar usuários da sua empresa)
router.delete('/:id', protect, authorize('gerente'), async (req, res) => {
    const { id } = req.params;

    try {
        // Verifica se o ID é um ObjectId válido antes de buscar
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de usuário inválido.' });
        }

        const user = await User.findById(new mongoose.Types.ObjectId(id)); // CORREÇÃO: Usar 'new' com ObjectId aqui!

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Garante que o usuário sendo deletado pertence à empresa do gerente logado
        // E impede que um usuário tente deletar a si mesmo ou outro gerente (opcional, mas boa prática)
        if (user.companyId.toString() !== req.user.companyId.toString()) {
            return res.status(403).json({ message: 'Você não tem permissão para deletar este usuário.' });
        }
        // Opcional: Impedir que um gerente delete a si mesmo
        if (user._id.toString() === req.user.id.toString()) {
             return res.status(403).json({ message: 'Você não pode deletar sua própria conta de gerente através desta rota.' });
        }


        await user.deleteOne();

        res.status(200).json({ message: 'Usuário deletado com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ message: 'Erro no servidor ao deletar usuário.' });
    }
});


// Exporta o router e os middlewares para serem usados em server.js
module.exports = router;
module.exports.protect = protect;
module.exports.authorize = authorize;