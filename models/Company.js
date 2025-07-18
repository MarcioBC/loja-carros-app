// models/Company.js
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true,
        trim: true // Adicionado trim para remover espaços em branco
    },
    pinCadastro: { // Campo para o PIN de cadastro (você inserirá no DB)
        type: String,
        required: true,
        unique: true,
        trim: true // Adicionado trim
    },
    // --- NOVOS CAMPOS ADICIONADOS AQUI ---
    cnpj: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    endereco: {
        rua: { type: String, trim: true },
        numero: { type: String, trim: true },
        complemento: { type: String, trim: true },
        bairro: { type: String, trim: true },
        cidade: { type: String, trim: true },
        estado: { type: String, trim: true },
        cep: { type: String, trim: true }
    },
    telefone: {
        type: String,
        trim: true
    },
    whatsapp: { // Se for diferente do telefone principal ou para contato específico
        type: String,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    // --- FIM DOS NOVOS CAMPOS ---
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Adicionado updatedAt para consistência, se você estiver usando timestamps em outros modelos
    updatedAt: { 
        type: Date,
        default: Date.now
    }
});

// Adicionado timestamp automáticos para createdAt e updatedAt.
// Se você já tem 'updatedAt' manual no schema, não precisa dessa linha.
CompanySchema.set('timestamps', true); 

// Se o nome da sua coleção de empresas no MongoDB não for 'companies',
// você pode especificar o nome real aqui:
// module.exports = mongoose.model('Company', CompanySchema, 'nome_real_da_sua_colecao');
module.exports = mongoose.model('Company', CompanySchema);