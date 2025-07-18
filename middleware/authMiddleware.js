// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importa o modelo de usuário para buscar o usuário no DB

// Middleware para proteger rotas (verifica o JWT)
const protect = async (req, res, next) => {
    let token;

    // Verifica se o token está no cabeçalho Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extrai o token do cabeçalho "Bearer TOKEN"
            token = req.headers.authorization.split(' ')[1];

            // Verifica o token (decodifica)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Anexa o usuário à requisição (sem a senha)
            // 'nome' aqui é o campo que você usa para o nome completo no seu modelo User
            req.user = await User.findById(decoded.id).select('-senha');
            req.userRole = decoded.role; // Adiciona a role diretamente
            req.companyId = decoded.companyId; // Adiciona o companyId

            next(); // Prossegue para a próxima função middleware/rota
        } catch (error) {
            console.error('Erro na validação do token:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expirado. Faça login novamente.' });
            }
            res.status(401).json({ message: 'Não autorizado, token inválido.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado, nenhum token.' });
    }
};

// Middleware para autorizar roles específicas
const authorize = (...roles) => {
    return (req, res, next) => {
        // Verifica se o usuário tem a role necessária
        if (!req.user || !roles.includes(req.user.role)) {
            // Se o usuário não está na lista de roles permitidas, retorna erro 403 (Forbidden)
            return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para realizar esta ação.' });
        }
        next(); // Se a role é permitida, prossegue
    };
};

module.exports = { protect, authorize };