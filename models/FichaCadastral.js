// models/FichaCadastral.js
const mongoose = require('mongoose');

const FichaCadastralSchema = new mongoose.Schema({
    // --- DADOS BÁSICOS DO CLIENTE (SNAPSHOT NO MOMENTO DA FICHA) ---
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        default: null
    },
    nomeCompletoCliente: { type: String, required: true, trim: true },
    cpfCliente: { type: String, required: true, trim: true },
    rgCliente: { type: String, trim: true },
    dataNascimentoCliente: { type: Date },
    emailCliente: { type: String, lowercase: true, trim: true },
    telefonePrincipalCliente: { type: String, required: true, trim: true },
    telefoneSecundarioCliente: { type: String, trim: true },
    profissaoCliente: { type: String, trim: true },
    estadoCivilCliente: {
        type: String,
        enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'Outro', 'Não Informado'],
        default: 'Não Informado',
        trim: true
    },
    enderecoCliente: {
        rua: { type: String, trim: true },
        numero: { type: String, trim: true },
        complemento: { type: String, trim: true },
        bairro: { type: String, trim: true },
        cidade: { type: String, trim: true },
        estado: { type: String, trim: true },
        cep: { type: String, trim: true }
    },
    nomeConjugue: { type: String, trim: true },
    cpfConjugue: { type: String, trim: true },
    dataNascimentoConjugue: { type: Date },
    profissaoConjugue: { type: String, trim: true },
    nomeEmpresaTrabalha: { type: String, trim: true },
    tempoDeEmpresa: { type: String, trim: true },
    cargoOcupado: { type: String, trim: true },
    rendaBruta: { type: Number },
    tipoRenda: {
        type: String,
        enum: ['CLT', 'Autônomo', 'Empresário', 'Aposentado/Pensionista', 'Outro', 'Não Informado'],
        trim: true
    },
    possuiCnh: { type: Boolean, default: false },
    enderecoProfissional: {
        ruaProfissional: { type: String, trim: true },
        numeroProfissional: { type: String, trim: true },
        complementoProfissional: { type: String, trim: true },
        bairroProfissional: { type: String, trim: true },
        cidadeProfissional: { type: String, trim: true },
        estadoProfissional: { type: String, trim: true },
        cepProfissional: { type: String, trim: true },
        telefoneProfissional: { type: String, trim: true }
    },
    veiculoInteresse: {
        veiculoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
        marcaModelo: { type: String, trim: true },
        ano: { type: String, trim: true },
        precoSugerido: { type: Number },
        placa: { type: String, trim: true },
        chassi: { type: String, trim: true },
        renavam: { type: String, trim: true }
    },
    // --- DADOS DA VENDA FINAL ---
    dadosVendaFinal: {
        veiculoTroca: {
            veiculoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
            marcaModelo: { type: String, trim: true },
            ano: { type: String, trim: true },
            placa: { type: String, trim: true },
            chassi: { type: String, trim: true },
            renavam: { type: String, trim: true },
            cor: { type: String, trim: true },
            quilometragem: { type: Number },
            custoAquisicao: { type: Number }, // Armazena o custo total de aquisição para a concessionária
            dividas: [ // <--- ADICIONE ESTE NOVO CAMPO (ARRAY DE OBJETOS) AQUI
                {
                    valor: { type: Number },
                    descricao: { type: String, trim: true }
                }
            ],
            outroProprietario: { // <--- ADICIONE ESTE NOVO CAMPO (OBJETO) AQUI
                cpf: { type: String, trim: true },
                nome: { type: String, trim: true }
            }
        },
        financiamento: {
            _id: { type: String, required: false },
            nomeFinanceira: { type: String, trim: true },
            valorAprovado: { type: Number },
            quantidadeParcelas: { type: Number },
            valorParcela: { type: Number },
            dataVencimentoParcela: { type: String, trim: true },
        },
        formasPagamento: [
            {
                tipo: { type: String, trim: true },
                valor: { type: Number }
            }
        ],
    },
    // --- FIM DOS DADOS DA VENDA FINAL ---

    financeirasConsultadas: [
        {
            nomeFinanceira: { type: String, trim: true },
            statusAnalise: {
                type: String,
                enum: ['Aguardando', 'Em análise', 'Aprovada', 'Recusada'],
                default: 'Aguardando'
            },
            motivoRecusa: { type: String, trim: true },
            valorAprovado: { type: Number },
            quantidadeParcelas: { type: Number },
            valorParcela: { type: Number },
            dataVencimentoParcela: { type: String, trim: true },
            retornoFinanceira: { type: String, trim: true },
            dataAnalise: { type: Date, default: Date.now },
            analisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
    ],
    // --- HISTÓRICO DE DIÁLOGO ENTRE USUÁRIOS ---
    historicoDialogo: [
        {
            remetente: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            mensagem: { type: String, trim: true },
            data: { type: Date, default: Date.now }
        }
    ],
    status: {
        type: String,
        enum: [
            'SALVO_PARA_VENDEDOR',
            'AGUARDANDO_ANALISE_FN',
            'EM_ANALISE_FN',
            'APROVADA_FN',
            'REPROVADA_FN',
            'AGUARDANDO_CONFERENCIA',
            'EM_CONFERENCIA',
            'CONFERIDA',
            'AGUARDANDO_DOCUMENTACAO',
            'PROCESSO_EM_TRANSFERENCIA',
            'FINALIZADA',
            'CANCELADA',
            'DEVOLVIDA_AO_VENDEDOR'
        ],
        default: 'SALVO_PARA_VENDEDOR'
    },
    // --- NOVOS CAMPOS PARA RASTREAR QUEM TRABALHOU POR ÚLTIMO EM CADA ETAPA ---
    ultimaAnalisePor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    ultimaConferenciaPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    ultimaDocumentacaoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // --- FIM DOS NOVOS CAMPOS ---
    historicoStatus: [
        {
            status: { type: String },
            data: { type: Date, default: Date.now },
            usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
    ],
    observacoes: { type: String, trim: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    cadastradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    podeSerEditadaPeloVendedor: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FichaCadastral', FichaCadastralSchema);