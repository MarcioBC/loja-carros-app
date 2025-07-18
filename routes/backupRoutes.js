// routes/backupRoutes.js
const express = require('express');
const router = express.Router();
const json2csv = require('json2csv').parse;
const mongoose = require('mongoose');
const multer = require('multer'); // Necessário para upload de arquivos na importação
const csv = require('csv-parser'); // Necessário para processar CSV na importação
const streamToArray = require('stream-to-array'); // Necessário para processar CSV na importação
const { Readable } = require('stream'); // Necessário para processar CSV na importação

const upload = multer({ storage: multer.memoryStorage() }); // Configuração para multer

// Importa seus modelos (AJUSTE OS CAMINHOS SE NECESSÁRIO E ADICIONE TODOS OS SEUS MODELOS)
const Client = require('../models/Client');
const Vehicle = require('../models/Vehicle');
const FichaCadastral = require('../models/FichaCadastral');
const User = require('../models/User');     // <<<<<<<<<< IMPORTANTE: Adicione este
const Company = require('../models/Company'); // <<<<<<<<<< IMPORTANTE: Adicione este
// ADICIONE AQUI TODOS OS OUTROS MODELOS DO SEU SISTEMA QUE VOCÊ QUER FAZER BACKUP
// Exemplo: const Product = require('../models/Product');


const { protect, authorize } = require('../middleware/authMiddleware'); // Ajuste o caminho se necessário

// --- Rota de Exportação Genérica INDIVIDUAL ---
router.get('/export/:dataType', protect, authorize('gerente'), async (req, res) => {
    try {
        const { companyId } = req.user;
        const { dataType } = req.params;
        const { format } = req.query;

        let Model;
        let fileName;
        let fieldsToPopulate = [];

        switch (dataType) {
            case 'clientes':
                Model = Client;
                fileName = 'clientes';
                if (format === 'csv') { // Popula apenas para CSV, para JSON de backup não populamos para manter _ids originais
                    fieldsToPopulate = [{ path: 'cadastradoPor', select: 'nome' }];
                }
                break;
            case 'vehicles':
                Model = Vehicle;
                fileName = 'veiculos';
                if (format === 'csv') {
                    fieldsToPopulate = [
                        { path: 'cadastradoPor', select: 'nome' },
                        // Removidos 'custosAdicionais' e 'dividas' do populate se forem sub-documentos embutidos
                    ];
                }
                break;
            case 'fichas':
                Model = FichaCadastral;
                fileName = 'fichas_cadastrais';
                if (format === 'csv') {
                    fieldsToPopulate = [
                        { path: 'clienteId' },
                        { path: 'veiculoInteresse.veiculoId' },
                        { path: 'dadosVendaFinal.veiculoTroca.veiculoId' },
                        { path: 'cadastradoPor' },
                        { path: 'ultimaAnalisePor' },
                        { path: 'ultimaConferenciaPor' },
                        { path: 'ultimaDocumentacaoPor' },
                        { path: 'financeirasConsultadas.analisadoPor' },
                        { path: 'historicoStatus.alteradoPor' },
                        { path: 'historicoDialogo.remetente' }
                    ];
                }
                break;
            default:
                return res.status(400).json({ message: 'Tipo de dado para exportação inválido.' });
        }

        let query = { companyId: new mongoose.Types.ObjectId(companyId) };

        console.log(`[EXPORT BACKEND] Buscando ${dataType} para exportação. Query:`, query);
        let data = Model.find(query);

        if (format === 'csv' && fieldsToPopulate.length > 0) {
            for (const populateOption of fieldsToPopulate) {
                data = data.populate(populateOption);
            }
        }
        data = await data.lean();
        console.log(`[EXPORT BACKEND] ${dataType} encontrados:`, data.length);


        if (!data || data.length === 0) {
            return res.status(404).json({ message: `Nenhum(a) ${dataType} encontrado(a) para exportar.` });
        }

        if (format === 'csv') {
            console.log(`[EXPORT BACKEND] Preparando para gerar CSV para ${dataType}.`);
            const flattenedData = data.map(item => {
                const flatItem = { ...item };
                delete flatItem._id;
                delete flatItem.companyId;

                if (dataType === 'clientes') {
                    if (item.cadastradoPor) flatItem.cadastrado_por_nome = item.cadastradoPor.nome;
                    if (item.endereco) {
                        flatItem.endereco_rua = item.endereco.rua;
                        flatItem.endereco_numero = item.endereco.numero;
                        flatItem.endereco_complemento = item.endereco.complemento;
                        flatItem.endereco_bairro = item.endereco.bairro;
                        flatItem.endereco_cidade = item.endereco.cidade;
                        flatItem.endereco_estado = item.endereco.estado;
                        flatItem.endereco_cep = item.endereco.cep;
                    }
                    delete flatItem.cadastradoPor;
                    delete flatItem.endereco;
                }

                if (dataType === 'vehicles') {
                    if (item.cadastradoPor) flatItem.cadastrado_por_nome = item.cadastradoPor.nome;
                    if (item.custosAdicionais) flatItem.custos_adicionais_json = JSON.stringify(item.custosAdicionais);
                    if (item.dividas) flatItem.dividas_json = JSON.stringify(item.dividas);
                    if (item.outroProprietario) {
                        flatItem.outro_proprietario_cpf = item.outroProprietario.cpf;
                        flatItem.outro_proprietario_nome = item.outroProprietario.nome;
                    }
                    delete flatItem.cadastradoPor;
                    delete flatItem.custosAdicionais;
                    delete flatItem.dividas;
                    delete flatItem.outroProprietario;
                }

                if (dataType === 'fichas') {
                    if (item.clienteId) {
                        flatItem.cliente_nome_completo = item.clienteId.nomeCompleto;
                        flatItem.cliente_cpf = item.clienteId.cpf;
                        flatItem.cliente_telefone_principal = item.clienteId.telefonePrincipal;
                        flatItem.cliente_email = item.clienteId.email;
                        if (item.clienteId.endereco) {
                            flatItem.cliente_endereco_rua = item.clienteId.endereco.rua;
                            flatItem.cliente_endereco_numero = item.clienteId.endereco.numero;
                            flatItem.cliente_endereco_complemento = item.clienteId.endereco.complemento;
                            flatItem.cliente_endereco_bairro = item.clienteId.endereco.bairro;
                            flatItem.cliente_endereco_cidade = item.clienteId.endereco.cidade;
                            flatItem.cliente_endereco_estado = item.clienteId.endereco.estado;
                            flatItem.cliente_endereco_cep = item.clienteId.endereco.cep;
                        }
                    } else {
                        flatItem.cliente_nome_completo = item.nomeCompletoCliente;
                        flatItem.cliente_cpf = item.cpfCliente;
                        flatItem.cliente_telefone_principal = item.telefonePrincipalCliente;
                        flatItem.cliente_email = item.emailCliente;
                        if (item.enderecoCliente) {
                            flatItem.cliente_endereco_rua = item.enderecoCliente.rua;
                            flatItem.endereco_cliente_numero = item.enderecoCliente.numero;
                            flatItem.endereco_cliente_complemento = item.enderecoCliente.complemento;
                            flatItem.endereco_cliente_bairro = item.enderecoCliente.bairro;
                            flatItem.endereco_cliente_cidade = item.enderecoCliente.cidade;
                            flatItem.endereco_cliente_estado = item.enderecoCliente.estado;
                            flatItem.endereco_cliente_cep = item.enderecoCliente.cep;
                        }
                    }
                    if (item.cadastradoPor) flatItem.cadastrado_por_nome = item.cadastradoPor.nome;
                    if (item.ultimaAnalisePor) flatItem.ultima_analise_por_nome = item.ultimaAnalisePor.nome;
                    if (item.ultimaConferenciaPor) flatItem.ultima_conferencia_por_nome = item.ultimaConferenciaPor.nome;
                    if (item.ultimaDocumentacaoPor) flatItem.ultima_documentacao_por_nome = item.ultimaDocumentacaoPor.nome;

                    if (item.veiculoInteresse && item.veiculoInteresse.veiculoId) {
                        flatItem.veiculo_interesse_marca_modelo_completo = `${item.veiculoInteresse.veiculoId.marca || ''} ${item.veiculoInteresse.veiculoId.modelo || ''}`.trim();
                        flatItem.veiculo_interesse_placa_completa = item.veiculoInteresse.veiculoId.placa;
                        flatItem.veiculo_interesse_preco_venda_completo = item.veiculoInteresse.veiculoId.preco;
                        flatItem.veiculo_interesse_cor_completo = item.veiculoInteresse.veiculoId.cor;
                        flatItem.veiculo_interesse_quilometragem_completo = item.veiculoInteresse.veiculoId.quilometragem;
                        flatItem.veiculo_interesse_ano_completo = item.veiculoInteresse.veiculoId.ano;
                    } else if (item.veiculoInteresse) {
                         flatItem.veiculo_interesse_marca_modelo_completo = item.veiculoInteresse.marcaModelo;
                         flatItem.veiculo_interesse_placa_completa = item.veiculoInteresse.placa;
                         flatItem.veiculo_interesse_preco_venda_completo = item.veiculoInteresse.precoSugerido;
                         flatItem.veiculo_interesse_cor_completo = item.veiculoInteresse.cor;
                         flatItem.veiculo_interesse_quilometragem_completo = item.veiculoInteresse.quilometragem;
                         flatItem.veiculo_interesse_ano_completo = item.veiculoInteresse.ano;
                    }

                    if (item.dadosVendaFinal && item.dadosVendaFinal.veiculoTroca && item.dadosVendaFinal.veiculoTroca.veiculoId) {
                        flatItem.veiculo_troca_marca_modelo_completo = `${item.dadosVendaFinal.veiculoTroca.veiculoId.marca || ''} ${item.dadosVendaFinal.veiculoTroca.veiculoId.modelo || ''}`.trim();
                        flatItem.veiculo_troca_placa_completa = item.dadosVendaFinal.veiculoTroca.veiculoId.placa;
                        flatItem.veiculo_troca_custo_aquisicao_completo = item.dadosVendaFinal.veiculoTroca.veiculoId.custoInicial;
                        flatItem.veiculo_troca_dividas_completas = JSON.stringify(item.dadosVendaFinal.veiculoTroca.veiculoId.dividas);
                        if (item.dadosVendaFinal.veiculoTroca.veiculoId.outroProprietario) {
                            flatItem.veiculo_troca_outro_proprietario_nome = item.dadosVendaFinal.veiculoTroca.veiculoId.outroProprietario.nome;
                            flatItem.veiculo_troca_outro_proprietario_cpf = item.dadosVendaFinal.veiculoTroca.veiculoId.outroProprietario.cpf;
                        }
                        flatItem.veiculo_troca_ano_completo = item.dadosVendaFinal.veiculoTroca.veiculoId.ano;
                        flatItem.veiculo_troca_cor_completo = item.dadosVendaFinal.veiculoTroca.veiculoId.cor;
                        flatItem.veiculo_troca_quilometragem_completo = item.dadosVendaFinal.veiculoTroca.veiculoId.quilometragem;
                        flatItem.veiculo_troca_chassi_completo = item.dadosVendaFinal.veiculoTroca.veiculoId.chassi;
                        flatItem.veiculo_troca_renavam_completo = item.dadosVendaFinal.veiculoTroca.veiculoId.renavam;

                    } else if (item.dadosVendaFinal && item.dadosVendaFinal.veiculoTroca) {
                        flatItem.veiculo_troca_marca_modelo_completo = item.dadosVendaFinal.veiculoTroca.marcaModelo;
                        flatItem.veiculo_troca_placa_completa = item.dadosVendaFinal.veiculoTroca.placa;
                        flatItem.veiculo_troca_custo_aquisicao_completo = item.dadosVendaFinal.veiculoTroca.custoAquisicao;
                        flatItem.veiculo_troca_cor_completo = item.dadosVendaFinal.veiculoTroca.cor;
                        flatItem.veiculo_troca_quilometragem_completo = item.dadosVendaFinal.veiculoTroca.quilometragem;
                        flatItem.veiculo_troca_ano_completo = item.dadosVendaFinal.veiculoTroca.ano;
                        flatItem.veiculo_troca_chassi_completo = item.dadosVendaFinal.veiculoTroca.chassi;
                        flatItem.veiculo_troca_renavam_completo = item.dadosVendaFinal.veiculoTroca.renavam;
                    }

                    if (item.financeirasConsultadas) flatItem.financeiras_consultadas_json = JSON.stringify(item.financeirasConsultadas);
                    if (item.historicoDialogo) flatItem.historico_dialogo_json = JSON.stringify(item.historicoDialogo);
                    if (item.historicoStatus) flatItem.historico_status_json = JSON.stringify(item.historicoStatus);
                    if (item.dadosVendaFinal) flatItem.dados_venda_final_json = JSON.stringify(item.dadosVendaFinal);

                    delete flatItem.clienteId;
                    delete flatItem.veiculoInteresse;
                    delete flatItem.dadosVendaFinal;
                    delete flatItem.cadastradoPor;
                    delete flatItem.financeirasConsultadas;
                    delete flatItem.historicoDialogo;
                    delete flatItem.enderecoCliente;
                    delete flatItem.enderecoProfissional;
                    delete flatItem.ultimaAnalisePor;
                    delete flatItem.ultimaConferenciaPor;
                    delete flatItem.ultimaDocumentacaoPor;
                    delete flatItem.historicoStatus;

                    delete flatItem.nomeConjugue;
                    delete flatItem.cpfConjugue;
                    delete flatItem.dataNascimentoConjugue;
                    delete flatItem.profissaoConjugue;
                }

                delete flatItem.__v;
                delete flatItem._id;
                delete flatItem.companyId;

                delete flatItem.veiculoId;
                delete flatItem.clientId;

                return flatItem;
            });

            const fields = Object.keys(flattenedData[0] || {});
            const csv = json2csv(flattenedData, { fields });

            res.header('Content-Type', 'text/csv');
            res.attachment(`${fileName}.csv`);
            return res.send(csv);

        } else if (format === 'json') {
            res.header('Content-Type', 'application/json');
            res.attachment(`${fileName}.json`);
            return res.json(data);
        } else {
            return res.status(400).json({ message: 'Formato de exportação inválido. Use "csv" ou "json".' });
        }

    } catch (error) {
        console.error(`Erro ao exportar ${dataType}:`, error);
        res.status(500).json({ message: `Erro no servidor ao exportar ${dataType}.`, error: error.message });
    }
});

// --- Rota de Importação Genérica INDIVIDUAL ---
router.post('/import/:dataType', protect, authorize('gerente'), upload.single('file'), async (req, res) => {
    try {
        const { dataType } = req.params;
        const { companyId } = req.user;
        const userId = req.user.id;
        // ATENÇÃO: req.body.data só virá se o frontend enviar JSON no corpo.
        // Se o frontend envia FormData (com um arquivo), o `data` não estará em req.body.
        // O `multer` já processou o arquivo, e o conteúdo está em `req.file.buffer`.

        const file = req.file; // Pega o arquivo enviado pelo multer

        if (!file) {
            return res.status(400).json({ message: 'Nenhum arquivo de importação enviado.' });
        }

        let dataToImport;
        const isJson = file.mimetype === 'application/json' || file.originalname.endsWith('.json');
        const isCsv = file.mimetype === 'text/csv' || file.originalname.endsWith('.csv');

        if (isJson) {
            try {
                dataToImport = JSON.parse(file.buffer.toString());
                if (!Array.isArray(dataToImport)) {
                    throw new Error('O arquivo JSON deve conter um array de objetos.');
                }
            } catch (jsonParseError) {
                return res.status(400).json({ message: `Erro ao analisar o arquivo JSON: ${jsonParseError.message}` });
            }
        } else if (isCsv) {
            try {
                const readableStream = new Readable();
                readableStream.push(file.buffer);
                readableStream.push(null);

                dataToImport = await streamToArray(readableStream.pipe(csv()));

                dataToImport = dataToImport.map(row => {
                    const newRow = {};
                    for (const key in row) {
                        if (Object.prototype.hasOwnProperty.call(row, key)) {
                            const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                            newRow[camelCaseKey] = row[key];
                        }
                    }
                    return newRow;
                });

            } catch (csvParseError) {
                console.error('Erro detalhado no parse CSV:', csvParseError);
                return res.status(400).json({ message: `Erro ao analisar o arquivo CSV: ${csvParseError.message}. Verifique o formato das colunas e a codificação (UTF-8).` });
            }
        } else {
            return res.status(400).json({ message: 'Formato de arquivo não suportado. Envie .json ou .csv.' });
        }


        if (dataToImport.length === 0) {
            return res.status(400).json({ message: 'Nenhum dado para importar.' });
        }

        let Model;
        switch (dataType) {
            case 'clientes':
                Model = Client;
                break;
            case 'vehicles':
                Model = Vehicle;
                break;
            case 'fichas':
                Model = FichaCadastral;
                break;
            default:
                return res.status(400).json({ message: 'Tipo de dado para importação inválido.' });
        }

        let importedCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const item of dataToImport) { // Use dataToImport aqui
            let originalItemIdInfo = '';
            if (dataType === 'vehicles' && item.placa) originalItemIdInfo = `Placa: ${item.placa}`;
            else if (dataType === 'clientes' && item.cpf) originalItemIdInfo = `CPF: ${item.cpf}`;
            else if (dataType === 'fichas' && item.cpfCliente) originalItemIdInfo = `CPF Cliente: ${item.cpfCliente}`;
            else if (item._id) originalItemIdInfo = `ID: ${item._id}`;
            else originalItemIdInfo = `Item: ${JSON.stringify(item || {}).substring(0, 50)}...`;

            try {
                const newItem = { ...item };
                delete newItem._id;
                delete newItem.createdAt;
                delete newItem.updatedAt;

                if (newItem.companyId && mongoose.Types.ObjectId.isValid(newItem.companyId)) {
                    newItem.companyId = new mongoose.Types.ObjectId(newItem.companyId);
                } else {
                    newItem.companyId = new mongoose.Types.ObjectId(companyId);
                }

                if (newItem.cadastradoPor && mongoose.Types.ObjectId.isValid(newItem.cadastradoPor)) {
                    newItem.cadastradoPor = new mongoose.Types.ObjectId(newItem.cadastradoPor);
                } else {
                    newItem.cadastradoPor = new mongoose.Types.ObjectId(userId);
                }
                if (newItem.ultimaAnalisePor && mongoose.Types.ObjectId.isValid(newItem.ultimaAnalisePor)) newItem.ultimaAnalisePor = new mongoose.Types.ObjectId(newItem.ultimaAnalisePor); else delete newItem.ultimaAnalisePor;
                if (newItem.ultimaConferenciaPor && mongoose.Types.ObjectId.isValid(newItem.ultimaConferenciaPor)) newItem.ultimaConferenciaPor = new mongoose.Types.ObjectId(newItem.ultimaConferenciaPor); else delete newItem.ultimaConferenciaPor;
                if (newItem.ultimaDocumentacaoPor && mongoose.Types.ObjectId.isValid(newItem.ultimaDocumentacaoPor)) newItem.ultimaDocumentacaoPor = new mongoose.Types.ObjectId(newItem.ultimaDocumentacaoPor); else delete newItem.ultimaDocumentacaoPor;


                const dateFields = [
                    'dataNascimentoCliente', 'dataNascimentoConjugue', 'dataCompra', 'dataVenda', 'data', 'dataVencimento', 'dataConsulta'
                ];
                dateFields.forEach(field => {
                    if (newItem[field] && typeof newItem[field] === 'string') {
                        try { newItem[field] = new Date(newItem[field]); } catch (e) { console.warn(`Data inválida para ${field} (${originalItemIdInfo}): ${newItem[field]}`); delete newItem[field]; }
                    }
                });

                const currencyFields = [
                    'preco', 'custoInicial', 'precoSugerido', 'rendaBruta',
                    'valorAprovado', 'valorParcela', 'custoAquisicao', 'valor', 'valorVenda'
                ];
                currencyFields.forEach(field => {
                    if (newItem[field] !== undefined && newItem[field] !== null && (typeof newItem[field] === 'string' || typeof newItem[field] === 'number')) {
                        const cleanedValue = String(newItem[field]).replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
                        newItem[field] = parseFloat(cleanedValue);
                        if (isNaN(newItem[field])) newItem[field] = undefined;
                    }
                });
                const intFields = ['quilometragem', 'quantidadeParcelas', 'ano'];
                intFields.forEach(field => {
                    if (newItem[field] !== undefined && newItem[field] !== null && (typeof newItem[field] === 'string' || typeof newItem[field] === 'number')) {
                        newItem[field] = parseInt(String(newItem[field]) || 0);
                        if (isNaN(newItem[field])) newItem[field] = undefined;
                    }
                });


                const boolFields = ['possuiCnh', 'podeSerEditadaPeloVendedor'];
                boolFields.forEach(field => {
                    if (newItem[field] !== undefined && newItem[field] !== null) {
                        if (typeof newItem[field] === 'string') {
                            newItem[field] = (newItem[field].toLowerCase() === 'true' || newItem[field].toLowerCase() === 'sim' || newItem[field] === '1');
                        } else if (typeof newItem[field] !== 'boolean') {
                            newItem[field] = undefined;
                        }
                    }
                });

                const stringTrimFields = ['modelo', 'placa', 'cpf', 'nomeCompleto', 'marca', 'tipo', 'ano', 'cor', 'chassi', 'renavam', 'profissao', 'estadoCivilCliente', 'nomeEmpresaTrabalha', 'tempoDeEmpresa', 'cargoOcupado', 'nomeFinanceira', 'statusAnalise', 'descricao', 'observacoes', 'tipoVenda', 'financeiraUtilizada', 'mensagem'];
                stringTrimFields.forEach(field => {
                    if (newItem[field] !== undefined && newItem[field] !== null && typeof newItem[field] === 'string') {
                        newItem[field] = newItem[field].trim();
                        if (newItem[field] === '') newItem[field] = undefined;
                    }
                });


                const addressFields = ['rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep'];
                if (Object.prototype.hasOwnProperty.call(newItem, 'enderecoClienteRua') || Object.prototype.hasOwnProperty.call(newItem, 'enderecoClienteCep')) {
                    const tempAddressClient = {};
                    addressFields.forEach(field => {
                        const csvKey = `enderecoCliente${field.charAt(0).toUpperCase() + field.slice(1)}`;
                        if (Object.prototype.hasOwnProperty.call(newItem, csvKey)) {
                            tempAddressClient[field] = newItem[csvKey];
                            delete newItem[csvKey];
                        }
                    });
                    if (Object.keys(tempAddressClient).length > 0) {
                        newItem.enderecoCliente = tempAddressClient;
                    } else { delete newItem.enderecoCliente; }
                }

                const professionalAddressFields = ['ruaProfissional', 'numeroProfissional', 'complementoProfissional', 'bairroProfissional', 'cidadeProfissional', 'estadoProfissional', 'cepProfissional', 'telefoneProfissional'];
                if (Object.prototype.hasOwnProperty.call(newItem, 'enderecoProfissionalRuaProfissional') || Object.prototype.hasOwnProperty.call(newItem, 'enderecoProfissionalCepProfissional')) {
                    const tempAddressProf = {};
                    professionalAddressFields.forEach(field => {
                         const csvKey = `enderecoProfissional${field.charAt(0).toUpperCase() + field.slice(1)}`;
                         if (Object.prototype.hasOwnProperty.call(newItem, csvKey)) {
                             tempAddressProf[field] = newItem[csvKey];
                             delete newItem[csvKey];
                         }
                    });
                    if (Object.keys(tempAddressProf).length > 0) {
                        newItem.enderecoProfissional = tempAddressProf;
                    } else { delete newItem.enderecoProfissional; }
                }
                
                if (dataType === 'vehicles' && (Object.prototype.hasOwnProperty.call(newItem, 'outroProprietarioCpf') || Object.prototype.hasOwnProperty.call(newItem, 'outroProprietarioNome'))) {
                    if (newItem.outroProprietarioCpf || newItem.outroProprietarioNome) {
                        newItem.outroProprietario = {
                            cpf: newItem.outroProprietarioCpf || '',
                            nome: newItem.outroProprietarioNome || ''
                        };
                    } else {
                        newItem.outroProprietario = undefined;
                    }
                    delete newItem.outroProprietarioCpf;
                    delete newItem.outroProprietarioNome;
                }

                if (dataType === 'fichas' && (Object.prototype.hasOwnProperty.call(newItem, 'conjugueCpf') || Object.prototype.hasOwnProperty.call(newItem, 'conjugueNome'))) {
                    if (newItem.conjugueNome || newItem.conjugueCpf) {
                        newItem.nomeConjugue = newItem.conjugueNome;
                        newItem.cpfConjugue = newItem.conjugueCpf;
                        if (newItem.conjugueDataNascimento && typeof newItem.conjugueDataNascimento === 'string') {
                            try { newItem.dataNascimentoConjugue = new Date(newItem.conjugueDataNascimento); } catch (e) { delete newItem.dataNascimentoConjugue; }
                        }
                        newItem.profissaoConjugue = newItem.conjugueProfissao;
                    } else {
                        newItem.nomeConjugue = undefined;
                        newItem.cpfConjugue = undefined;
                        newItem.dataNascimentoConjugue = undefined;
                        newItem.profissaoConjugue = undefined;
                    }
                    delete newItem.conjugueNome; delete newItem.conjugueCpf; delete newItem.conjugueDataNascimento; delete newItem.conjugueProfissao;
                }


                const jsonArrayFields = {
                    'financeirasConsultadasJson': 'financeirasConsultadas',
                    'historicoDialogoJson': 'historicoDialogo',
                    'dadosVendaFinalJson': 'dadosVendaFinal',
                    'custosAdicionaisJson': 'custosAdicionais',
                    'dividasJson': 'dividas',
                    'historicoStatusJson': 'historicoStatus'
                };

                for (const jsonCsvKey in jsonArrayFields) {
                    const originalMongooseKey = jsonArrayFields[jsonCsvKey];
                    if (typeof newItem[jsonCsvKey] === 'string') {
                        try {
                            const parsedData = JSON.parse(newItem[jsonCsvKey]);
                            newItem[originalMongooseKey] = Array.isArray(parsedData) ? parsedData : (typeof parsedData === 'object' && parsedData !== null ? parsedData : undefined);

                            if (Array.isArray(newItem[originalMongooseKey])) {
                                newItem[originalMongooseKey] = newItem[originalMongooseKey].map(subItem => {
                                    if (subItem.analisadoPor && typeof subItem.analisadoPor === 'string' && mongoose.Types.ObjectId.isValid(subItem.analisadoPor)) subItem.analisadoPor = new mongoose.Types.ObjectId(userId);
                                    if (subItem.remetente && typeof subItem.remetente === 'string' && mongoose.Types.ObjectId.isValid(subItem.remetente)) subItem.remetente = new mongoose.Types.ObjectId(userId);
                                    if (subItem.alteradoPor && typeof subItem.alteradoPor === 'string' && mongoose.Types.ObjectId.isValid(subItem.alteradoPor)) subItem.alteradoPor = new mongoose.Types.ObjectId(userId);


                                    currencyFields.forEach(cf => {
                                        if (subItem[cf] !== undefined && subItem[cf] !== null && (typeof subItem[cf] === 'string' || typeof subItem[cf] === 'number')) {
                                            const cleanedValue = String(subItem[cf]).replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
                                            subItem[cf] = parseFloat(cleanedValue);
                                            if (isNaN(subItem[cf])) subItem[cf] = undefined;
                                        }
                                    });
                                    intFields.forEach(inf => {
                                        if (subItem[inf] !== undefined && subItem[inf] !== null && (typeof subItem[inf] === 'string' || typeof subItem[inf] === 'number')) {
                                            subItem[inf] = parseInt(String(subItem[inf]) || 0);
                                            if (isNaN(subItem[inf])) subItem[inf] = undefined;
                                        }
                                    });
                                    dateFields.forEach(df => {
                                        if (subItem[df] && typeof subItem[df] === 'string') {
                                            try { subItem[df] = new Date(subItem[df]); } catch (e) { delete subItem[df]; }
                                        }
                                    });
                                    stringTrimFields.forEach(stf => {
                                        if (subItem[stf] !== undefined && subItem[stf] !== null && typeof subItem[stf] === 'string') {
                                            subItem[stf] = subItem[stf].trim();
                                            if (subItem[stf] === '') subItem[stf] = undefined;
                                        }
                                    });

                                    return subItem;
                                });
                            }
                            delete newItem[jsonCsvKey];
                        } catch (e) {
                            console.warn(`Erro ao parsear JSON stringificado para ${originalMongooseKey} (${originalItemIdInfo}):`, e);
                            delete newItem[jsonCsvKey];
                            newItem[originalMongooseKey] = (originalMongooseKey === 'financeirasConsultadas' || originalMongooseKey === 'historicoDialogo' || originalMongooseKey === 'custosAdicionais' || originalMongooseKey === 'dividas' || originalMongooseKey === 'historicoStatus') ? [] : undefined;
                        }
                    } else if (newItem[jsonCsvKey] === undefined || newItem[jsonCsvKey] === null || newItem[jsonCsvKey] === '') {
                         newItem[originalMongooseKey] = (originalMongooseKey === 'financeirasConsultadas' || originalMongooseKey === 'historicoDialogo' || originalMongooseKey === 'custosAdicionais' || originalMongooseKey === 'dividas' || originalMongooseKey === 'historicoStatus') ? [] : undefined;
                    }
                }
                
                if (Model === FichaCadastral) {
                    if (newItem.clienteId && typeof newItem.clienteId === 'string' && mongoose.Types.ObjectId.isValid(newItem.clienteId)) {
                        newItem.clienteId = new mongoose.Types.ObjectId(newItem.clienteId);
                    } else { delete newItem.clienteId; }

                    if (newItem.veiculoInteresse && newItem.veiculoInteresse.veiculoId && typeof newItem.veiculoInteresse.veiculoId === 'string' && mongoose.Types.ObjectId.isValid(newItem.veiculoInteresse.veiculoId)) {
                        newItem.veiculoInteresse.veiculoId = new mongoose.Types.ObjectId(newItem.veiculoInteresse.veiculoId);
                    } else if (newItem.veiculoInteresse) { delete newItem.veiculoInteresse.veiculoId; }

                    if (newItem.dadosVendaFinal && newItem.dadosVendaFinal.veiculoTroca && newItem.dadosVendaFinal.veiculoTroca.veiculoId && typeof newItem.dadosVendaFinal.veiculoTroca.veiculoId === 'string' && mongoose.Types.ObjectId.isValid(newItem.dadosVendaFinal.veiculoTroca.veiculoId)) {
                        newItem.dadosVendaFinal.veiculoTroca.veiculoId = new mongoose.Types.ObjectId(newItem.dadosVendaFinal.veiculoTroca.veiculoId);
                    } else if (newItem.dadosVendaFinal && newItem.dadosVendaFinal.veiculoTroca) { delete newItem.dadosVendaFinal.veiculoTroca.veiculoId; }
                }

                const doc = new Model(newItem);
                await doc.save();
                importedCount++;

            } catch (itemError) {
                let errorMessage = itemError.message;
                if (itemError.name === 'ValidationError') {
                    errorMessage = `Erro de validação: ${Object.values(itemError.errors).map(err => err.message).join(', ')}`;
                } else if (itemError.code === 11000) {
                    errorMessage = `Erro de duplicidade (código: ${itemError.code}). ${JSON.stringify(itemError.keyValue)}`;
                } else if (itemError.name === 'CastError') {
                    errorMessage = `Erro de tipo de dado: '${itemError.path}' esperava '${itemError.kind}', mas recebeu '${itemError.value}'.`;
                }

                console.error(`Erro ao importar item (${originalItemIdInfo}):`, errorMessage);
                errors.push({ id: originalItemIdInfo, message: errorMessage });
                errorCount++;
            }
        }

        let message = `Importação concluída para ${dataType}. Total processado: ${dataToImport.length} itens. Importados com sucesso: ${importedCount}. Com erros: ${errorCount}.`;
        if (errors.length > 0) {
            const formattedErrors = errors.map(e => `Item (${e.id}): ${e.message}`).join('; ');
            message += ` Detalhes dos erros: ${formattedErrors}.`;
        }
        res.status(200).json({ message, errorsDetails: errors });

    } catch (error) {
        console.error('Erro geral na rota de importação:', error);
        res.status(500).json({ message: 'Erro no servidor ao importar dados.', error: error.message });
    }
});


// --- NOVAS ROTAS PARA BACKUP COMPLETO (TODAS AS COLEÇÕES EM UM SÓ JSON) ---
router.get('/backup/full-export', protect, authorize('gerente'), async (req, res) => {
    const { companyId } = req.user;
    const backupData = {};

    const modelsToBackup = [
        { name: 'clients', Model: Client },
        { name: 'vehicles', Model: Vehicle },
        { name: 'fichas', Model: FichaCadastral },
        { name: 'users', Model: User }, // <<<<<<< Lembre-se de importar o modelo User
        { name: 'companies', Model: Company } // <<<<<<< Lembre-se de importar o modelo Company
        // ADICIONE AQUI TODOS OS OUTROS MODELOS DO SEU SISTEMA (ex: { name: 'products', Model: Product })
    ];

    try {
        for (const { name, Model } of modelsToBackup) {
            let query = {};
            // Para User e Company, você pode não querer filtrar por companyId ou ter uma lógica diferente
            if (Model.schema.paths.companyId) {
                 query = { companyId: new mongoose.Types.ObjectId(companyId) };
            }
           
            // NUNCA POPULE para um backup JSON completo, pois você quer os IDs originais
            const data = await Model.find(query).lean();
            backupData[name] = data;
            console.log(`[FULL BACKUP EXPORT] Exportado ${data.length} documentos da coleção: ${name}`);
        }

        res.header('Content-Type', 'application/json');
        res.attachment(`full_backup_${new Date().toISOString().slice(0, 10)}.json`);
        return res.json(backupData);

    } catch (error) {
        console.error('[FULL BACKUP EXPORT ERROR] Erro fatal ao exportar backup completo:', error);
        res.status(500).json({ message: 'Erro no servidor ao exportar backup completo.', error: error.message });
    }
});


router.post('/backup/full-import', protect, authorize('gerente'), upload.single('file'), async (req, res) => {
    const { companyId } = req.user;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'Nenhum arquivo de backup enviado.' });
    }

    if (!(file.mimetype === 'application/json' || file.originalname.endsWith('.json'))) {
        return res.status(400).json({ message: 'Formato de arquivo não suportado. Envie um arquivo .json.' });
    }

    let backupData;
    try {
        backupData = JSON.parse(file.buffer.toString());
        if (typeof backupData !== 'object' || backupData === null) {
            throw new Error('O arquivo JSON deve conter um objeto com as coleções.');
        }
    } catch (jsonParseError) {
        return res.status(400).json({ message: `Erro ao analisar o arquivo JSON de backup: ${jsonParseError.message}` });
    }

    const modelsMap = {
        'clients': Client,
        'vehicles': Vehicle,
        'fichas': FichaCadastral,
        'users': User, // <<<<<<< Lembre-se de importar o modelo User
        'companies': Company // <<<<<<< Lembre-se de importar o modelo Company
        // ADICIONE AQUI TODOS OS OUTROS MODELOS QUE VOCÊ INCLUIU NO BACKUP (ex: 'products': Product)
    };

    let totalImported = 0;
    let totalErrors = 0;
    const detailedErrors = {};
    const successDetails = {};

    const importOrder = ['companies', 'users', 'clients', 'vehicles', 'fichas']; // Adapte esta ordem conforme suas dependências

    try {
        for (const collectionName of importOrder) {
            const Model = modelsMap[collectionName];
            const dataToImport = backupData[collectionName];

            if (!Model || !Array.isArray(dataToImport)) {
                console.warn(`[FULL BACKUP IMPORT] Coleção '${collectionName}' não encontrada no arquivo de backup ou não é um array válido. Pulando.`);
                continue;
            }

            console.log(`[FULL BACKUP IMPORT] Iniciando importação para a coleção: ${collectionName} (${dataToImport.length} itens)...`);
            let collectionImportedCount = 0;
            let collectionErrorCount = 0;
            const collectionErrors = [];

            // AVISO: PARA RESTAURAÇÃO COMPLETA E LIMPA, GERALMENTE SE LIMPA A COLEÇÃO ANTES DE IMPORTAR.
            // DESCOMENTE E USE COM CAUTELA SOMENTE EM AMBIENTE DE DESENVOLVIMENTO/TESTE!
            // if (Model.schema.paths.companyId && collectionName !== 'companies' && collectionName !== 'users') {
            //    await Model.deleteMany({ companyId: new mongoose.Types.ObjectId(companyId) });
            //    console.log(`[FULL BACKUP IMPORT] Coleção ${collectionName} limpa para companyId ${companyId}.`);
            // } else if (collectionName === 'users' || collectionName === 'companies') {
            //    // CUIDADO: Limpa TUDO na coleção de users/companies, pode apagar admin/outras empresas!
            //    // Apenas para cenários MUITO específicos de redefinição total.
            //    // await Model.deleteMany({});
            //    // console.log(`[FULL BACKUP IMPORT] Coleção ${collectionName} limpa (global).`);
            // }


            for (const item of dataToImport) {
                const newItem = { ...item };
                if (newItem._id && mongoose.Types.ObjectId.isValid(newItem._id)) {
                    newItem._id = new mongoose.Types.ObjectId(newItem._id);
                } else {
                    delete newItem._id;
                }
                delete newItem.createdAt;
                delete newItem.updatedAt;
                delete newItem.__v;

                if (Model.schema.paths.companyId) {
                    newItem.companyId = new mongoose.Types.ObjectId(companyId);
                }

                if (Model.schema.paths.cadastradoPor) {
                    newItem.cadastradoPor = new mongoose.Types.ObjectId(userId);
                }

                if (collectionName === 'fichas') {
                    if (newItem.clienteId && typeof newItem.clienteId === 'string' && mongoose.Types.ObjectId.isValid(newItem.clienteId)) {
                        newItem.clienteId = new mongoose.Types.ObjectId(newItem.clienteId);
                    } else { delete newItem.clienteId; }

                    if (newItem.veiculoInteresse && newItem.veiculoInteresse.veiculoId && typeof newItem.veiculoInteresse.veiculoId === 'string' && mongoose.Types.ObjectId.isValid(newItem.veiculoInteresse.veiculoId)) {
                        newItem.veiculoInteresse.veiculoId = new mongoose.Types.ObjectId(newItem.veiculoInteresse.veiculoId);
                    } else if (newItem.veiculoInteresse) { delete newItem.veiculoInteresse.veiculoId; }

                    if (newItem.dadosVendaFinal && newItem.dadosVendaFinal.veiculoTroca && newItem.dadosVendaFinal.veiculoTroca.veiculoId && typeof newItem.dadosVendaFinal.veiculoTroca.veiculoId === 'string' && mongoose.Types.ObjectId.isValid(newItem.dadosVendaFinal.veiculoTroca.veiculoId)) {
                        newItem.dadosVendaFinal.veiculoTroca.veiculoId = new mongoose.Types.ObjectId(newItem.dadosVendaFinal.veiculoTroca.veiculoId);
                    } else if (newItem.dadosVendaFinal && newItem.dadosVendaFinal.veiculoTroca) { delete newItem.dadosVendaFinal.veiculoTroca.veiculoId; }
                    
                    if (newItem.ultimaAnalisePor && typeof newItem.ultimaAnalisePor === 'string' && mongoose.Types.ObjectId.isValid(newItem.ultimaAnalisePor)) newItem.ultimaAnalisePor = new mongoose.Types.ObjectId(newItem.ultimaAnalisePor); else delete newItem.ultimaAnalisePor;
                    if (newItem.ultimaConferenciaPor && typeof newItem.ultimaConferenciaPor === 'string' && mongoose.Types.ObjectId.isValid(newItem.ultimaConferenciaPor)) newItem.ultimaConferenciaPor = new mongoose.Types.ObjectId(newItem.ultimaConferenciaPor); else delete newItem.ultimaConferenciaPor;
                    if (newItem.ultimaDocumentacaoPor && typeof newItem.ultimaDocumentacaoPor === 'string' && mongoose.Types.ObjectId.isValid(newItem.ultimaDocumentacaoPor)) newItem.ultimaDocumentacaoPor = new mongoose.Types.ObjectId(newItem.ultimaDocumentacaoPor); else delete newItem.ultimaDocumentacaoPor;
                    
                    if (newItem.financeirasConsultadas && Array.isArray(newItem.financeirasConsultadas)) {
                        newItem.financeirasConsultadas = newItem.financeirasConsultadas.map(fc => {
                            if (fc.analisadoPor && typeof fc.analisadoPor === 'string' && mongoose.Types.ObjectId.isValid(fc.analisadoPor)) fc.analisadoPor = new mongoose.Types.ObjectId(fc.analisadoPor);
                            return fc;
                        });
                    }
                    if (newItem.historicoDialogo && Array.isArray(newItem.historicoDialogo)) {
                        newItem.historicoDialogo = newItem.historicoDialogo.map(hd => {
                            if (hd.remetente && typeof hd.remetente === 'string' && mongoose.Types.ObjectId.isValid(hd.remetente)) hd.remetente = new mongoose.Types.ObjectId(hd.remetente);
                            return hd;
                        });
                    }
                     if (newItem.historicoStatus && Array.isArray(newItem.historicoStatus)) {
                        newItem.historicoStatus = newItem.historicoStatus.map(hs => {
                            if (hs.alteradoPor && typeof hs.alteradoPor === 'string' && mongoose.Types.ObjectId.isValid(hs.alteradoPor)) hs.alteradoPor = new mongoose.Types.ObjectId(hs.alteradoPor);
                            return hs;
                        });
                    }
                }
                
                try {
                    await Model.create(newItem);

                    collectionImportedCount++;
                } catch (itemError) {
                    let errorMessage = itemError.message;
                    if (itemError.name === 'ValidationError') {
                        errorMessage = `Erro de validação: ${Object.values(itemError.errors).map(err => err.message).join(', ')}`;
                    } else if (itemError.code === 11000) {
                        errorMessage = `Erro de duplicidade (código: ${itemError.code}). ${JSON.stringify(itemError.keyValue)}`;
                    } else if (itemError.name === 'CastError') {
                        errorMessage = `Erro de tipo de dado: '${itemError.path}' esperava '${itemError.kind}', mas recebeu '${itemError.value}'.`;
                    }
                    collectionErrors.push(`Item original _id: ${item._id || 'N/A'}, Erro: ${errorMessage}`);
                    collectionErrorCount++;
                    console.error(`[FULL BACKUP IMPORT ERROR] Erro ao importar item na coleção ${collectionName}:`, errorMessage);
                }
            }
            totalImported += collectionImportedCount;
            totalErrors += collectionErrorCount;
            successDetails[collectionName] = collectionImportedCount;
            if (collectionErrors.length > 0) {
                detailedErrors[collectionName] = collectionErrors;
            }
            console.log(`[FULL BACKUP IMPORT] Finalizado coleção ${collectionName}. Sucesso: ${collectionImportedCount}, Erros: ${collectionErrorCount}`);
        }

        let message = `Importação completa concluída. Total importado: ${totalImported}. Total com erros: ${totalErrors}.`;
        if (totalErrors > 0) {
            message += ' Veja detalhes dos erros.';
            return res.status(200).json({ message, success: true, importedCounts: successDetails, detailedErrors });
        }
        res.status(200).json({ message, success: true, importedCounts: successDetails });

    } catch (error) {
        console.error('[FULL BACKUP IMPORT ERROR] Erro geral na rota de importação completa:', error);
        res.status(500).json({ message: 'Erro no servidor ao importar backup completo.', error: error.message });
    }
});

module.exports = router;