// models/Vehicle.js
const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    modelo: {
        type: String,
        required: true,
        trim: true
    },
    marca: { 
        type: String,
        required: false, // Alterado para false, caso a marca seja parte do modelo
        trim: true
    },
    ano: {
        type: String, // Mantido como String para "AAAA/AAAA"
        required: true
    },
    preco: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['DISPONÍVEL', 'RESERVADO', 'VENDIDO', 'EM_MANUTENCAO', 'EM_PREPARACAO', 'DEVOLVIDO'],
        default: 'DISPONÍVEL'
    },
    cor: {
        type: String,
        trim: true
    },
    placa: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true
    },
    chassi: { 
        type: String,
        trim: true
    },
    renavam: { 
        type: String,
        trim: true
    },
    quilometragem: { 
        type: Number
    },
    custoInicial: { // Este campo agora representa o custo total de aquisição (incluindo dívidas)
        type: Number,
        required: false 
    },
    dataCompra: { 
        type: Date
    },
    envelope: { 
        type: String,
        trim: true
    },
    custosAdicionais: [ 
        {
            valor: { type: Number, required: true },
            descricao: { type: String, required: true },
            data: { type: Date, default: Date.now }
        }
    ],
    dividas: [ // Dívidas do veículo de troca (se for o caso)
        {
            valor: { type: Number, default: 0 },
            descricao: { type: String, trim: true }
        }
    ],
    companyId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    dataVenda: { // NOVO CAMPO: Data da Venda do Veículo
        type: Date,
        default: null 
    },
    fichaVendaId: { // NOVO CAMPO: Referência à Ficha Cadastral que formalizou a venda
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FichaCadastral',
        default: null
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
VehicleSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

VehicleSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = mongoose.model('Vehicle', VehicleSchema);