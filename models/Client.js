// models/Client.js
const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    nomeCompleto: {
        type: String,
        required: true,
        trim: true
    },
    cpf: {
        type: String,
        required: true,
        unique: true, // CPF deve ser único para cada cliente
        trim: true
    },
    rg: {
        type: String,
        trim: true
    },
    dataNascimento: {
        type: Date
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    telefonePrincipal: {
        type: String,
        required: true,
        trim: true
    },
    telefoneSecundario: {
        type: String,
        trim: true
    },
    endereco: {
        rua: { type: String, trim: true },
        numero: { type: String, trim: true },
        complemento: { type: String, trim: true }, // NOVO CAMPO: Complemento
        bairro: { type: String, trim: true },
        cidade: { type: String, trim: true },
        estado: { type: String, trim: true },
        cep: { type: String, trim: true }
    },
    profissao: {
        type: String,
        trim: true
    },
    estadoCivil: {
        type: String,
        enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'Outro'],
        trim: true
    },
    companyId: { // Para associar o cliente a uma empresa (obrigatório)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para atualizar a data de atualização
ClientSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

ClientSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = mongoose.model('Client', ClientSchema);