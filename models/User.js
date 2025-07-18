// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    nome: { // Este será o 'nomeCompleto' no frontend e 'userName' no localStorage
        type: String,
        required: true
    },
    email: { // Este será o 'username' para login no frontend e o campo único de identificação
        type: String,
        required: true,
        unique: true,
        lowercase: true // Garante que e-mails sejam únicos independentemente do case
    },
    senha: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['vendedor', 'fn', 'conferente', 'documentacao', 'gerente'],
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId, // Associa o usuário a uma empresa
        ref: 'Company',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para hash de senha antes de salvar
UserSchema.pre('save', async function (next) {
    if (!this.isModified('senha')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});

// Método para comparar senha (usado no login)
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.senha);
};


module.exports = mongoose.model('User', UserSchema);