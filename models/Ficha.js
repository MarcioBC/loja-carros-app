const mongoose = require('mongoose');

// Schema para as Formas de Pagamento Adicionais
// Não precisa de _id: false se você quiser um ID automático para cada forma de pagamento no array
const FormaPagamentoSchema = new mongoose.Schema({
    tipo: { // Ex: Pix, Dinheiro, Cartao de Credito, Outros
        type: String,
        required: true,
        trim: true
    },
    valor: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false }); // Adicionado _id: false para evitar IDs desnecessários em subdocumentos de array

// Schema para os Dados de Venda Final
const DadosVendaFinalSchema = new mongoose.Schema({
    veiculoTroca: {
        veiculoId: { // Referência ao veículo de troca cadastrado no Vehicle Model
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle'
        },
        marcaModelo: String,
        ano: String,
        placa: String,
        chassi: String,
        renavam: String,
        cor: String,
        quilometragem: Number,
        custoAquisicao: Number // O valor total que a concessionária "pagou" pelo veículo de troca (incluindo dívidas)
    },
    financiamento: {
        nomeFinanceira: String,
        valorAprovado: Number,
        quantidadeParcelas: Number,
        valorParcela: Number,
        dataVencimentoParcela: String // Mantido como String para flexibilidade (ex: "45 dias" ou uma data formatada)
    },
    // Array para armazenar as formas de pagamento adicionais (Pix, Dinheiro, Cartão, Outros)
    formasPagamento: [FormaPagamentoSchema]
}, { _id: false }); // Adicionado _id: false para o subdocumento dadosVendaFinal, se não precisar de um ID próprio.


const FichaSchema = new mongoose.Schema({
    companyId: { // Associação com a empresa
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    vendedor: { // Usuário que criou a ficha
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cliente: { // Referência ao cliente envolvido na ficha
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    veiculoInteresse: { // Referência ao veículo que o cliente tem interesse
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    // Status da Ficha no fluxo de trabalho
    status: {
        type: String,
        enum: [
            'EM_CADASTRO', // Vendedor está preenchendo
            'AGUARDANDO_ANALISE_FN', // Vendedor enviou para F&N
            'EM_ANALISE_FN', // F&N pegou a ficha
            'APROVADA_FN', // F&N aprovou e devolveu ao vendedor
            'REPROVADA_FN', // F&N reprovou e devolveu ao vendedor
            'AGUARDANDO_CONFERENCIA', // Vendedor concluiu a venda e enviou para conferência
            'EM_CONFERENCIA', // Conferente pegou a ficha
            'AGUARDANDO_DOCUMENTACAO', // Conferente enviou para documentação
            'EM_DOCUMENTACAO', // Documentação pegou a ficha
            'FINALIZADA', // Mudei de CONCLUIDA para FINALIZADA para corresponder ao frontend
            'CANCELADA' // Ficha cancelada em qualquer etapa
        ],
        default: 'EM_CADASTRO'
    },
    // NOVO CAMPO: Para armazenar todos os detalhes da venda final
    dadosVendaFinal: DadosVendaFinalSchema, // <--- ADICIONADO AQUI!

    // Campos de rastreamento de data e hora do fluxo
    dataCadastroFicha: { // Data em que o vendedor iniciou a ficha
        type: Date,
        default: Date.now
    },
    dataEnvioAnalise: { // Data em que o vendedor enviou para análise F&N
        type: Date
    },
    analistaFnPegou: { // Referência ao analista F&N que pegou a ficha
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dataFnPegou: { // Data em que o analista F&N pegou a ficha
        type: Date
    },
    // 'detalhesFinanciamentoAprovado' parece redundante se você tiver 'dadosVendaFinal.financiamento'.
    // Recomendo remover 'detalhesFinanciamentoAprovado' para evitar duplicação e usar apenas 'dadosVendaFinal.financiamento'.
    // Se você usa 'detalhesFinanciamentoAprovado' em outros lugares e não quer quebrar, mantenha, mas saiba da duplicação.
    detalhesFinanciamentoAprovado: {
        valor: Number,
        banco: String,
        quantidadeParcelas: Number,
        valorParcela: Number,
        vencimentoPrimeiraParcela: String // Pode ser Date, dependendo do formato
    },
    dataAprovacaoFn: { // Data em que o F&N aprovou e devolveu ao vendedor
        type: Date
    },
    dataConclusaoVenda: { // Data em que o vendedor concluiu a venda após aprovação
        type: Date
    },
    conferentePegou: { // Referência ao conferente que pegou a ficha
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dataConferentePegou: { // Data em que o conferente pegou a ficha
        type: Date
    },
    dataEnvioDocumentacao: { // Data em que o conferente enviou para documentação
        type: Date
    },
    documentacaoPegou: { // Referência ao colaborador de documentação que pegou a ficha
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dataDocumentacaoPegou: { // Data em que a documentação pegou a ficha
        type: Date
    },
    dataProcessoConcluido: { // Data de conclusão final do processo (carro em nome do cliente)
        type: Date
    },
    observacoesInternas: { // Observações gerais de cada etapa
        type: String,
        trim: true
    },
    historicoStatus: [ // Histórico de todas as mudanças de status (para auditoria)
        {
            status: String,
            data: { type: Date, default: Date.now },
            responsavel: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            observacao: String
        }
    ]
}, {
    timestamps: true // Adiciona createdAt (data de criação da ficha) e updatedAt
});

const Ficha = mongoose.model('Ficha', FichaSchema);

module.exports = Ficha;