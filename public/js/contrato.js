// public/js/contrato.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log("contrato.js: DOMContentLoaded iniciado.");

    // --- Funções Auxiliares (Autocontidas para independência) ---
    function applyCpfMask(value) {
        if (!value) return '';
        value = String(value).replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return value;
    }

    function applyPhoneMask(value) {
        if (!value) return '';
        value = String(value).replace(/\D/g, '');
        if (value.length === 11) { // Para (99) 99999-9999 (com 9 adicional)
            value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length === 10) { // Para (99) 9999-9999
            value = value.replace(/^(\d\d)(\d{4})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 2) { // Para (99)
            value = value.replace(/^(\d\d)(\d{0,9})/, '($1) $2');
        }
        return value;
    }

    function formatNumberToCurrency(number) {
        if (typeof number !== 'number' || isNaN(number)) return 'R$ 0,00';
        return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatDateToDisplay(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (e) {
            console.error("Erro ao formatar data:", dateString, e);
            return 'N/A';
        }
    }

    function convertNumberToBrazilianCurrencyWords(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return "zero reais";
        }

        const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

        function toWords(num) {
            if (num === 0) return '';
            if (num < 10) return units[num];
            if (num >= 10 && num < 20) return teens[num - 10];
            if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' e ' + units[num % 10] : '');
            if (num < 1000) return hundreds[Math.floor(num / 100)] + (num % 100 !== 0 ? ' e ' + toWords(num % 100) : '');
            return ''; // Should not happen for parts
        }

        const integerPart = Math.floor(value);
        const centsPart = Math.round((value - integerPart) * 100);

        let integerWords = '';
        if (integerPart === 0) {
            integerWords = 'zero';
        } else if (integerPart === 1) {
            integerWords = 'um';
        } else {
            integerWords = toWords(integerPart % 1000);
            let temp = Math.floor(integerPart / 1000);
            const thousands = Math.floor(temp % 1000);
            if (thousands > 0) {
                integerWords = (thousands === 1 ? 'mil' : toWords(thousands) + ' mil') + (integerWords ? ' e ' + integerWords : '');
            }
            temp = Math.floor(temp / 1000);
            const millions = Math.floor(temp % 1000);
            if (millions > 0) {
                integerWords = toWords(millions) + (millions === 1 ? ' milhão' : ' milhões') + (integerWords ? ' e ' + integerWords : '');
            }
            temp = Math.floor(temp / 1000);
            const billions = Math.floor(temp % 1000);
            if (billions > 0) {
                integerWords = toWords(billions) + (billions === 1 ? ' bilhão' : ' bilhões') + (integerWords ? ' e ' + integerWords : '');
            }
        }

        let centsWords = '';
        if (centsPart > 0) {
            centsWords = toWords(centsPart) + (centsPart === 1 ? ' centavo' : ' centavos');
        }

        let result = integerWords + (integerPart === 1 ? ' real' : ' reais');
        if (centsWords) {
            result += (integerPart > 0 ? ' e ' : '') + centsWords;
        }

        return result;
    }

    // --- Fim das Funções Auxiliares ---

    // 1. Tentar carregar os parâmetros essenciais do sessionStorage
    console.log("contrato.js: DOMContentLoaded iniciado. Tentando carregar contractParams do sessionStorage.");
    const contractParamsString = sessionStorage.getItem('contractParams');
    let contractParams = null;

    if (contractParamsString) {
        try {
            contractParams = JSON.parse(contractParamsString);
            console.log("contrato.js: Parâmetros do contrato carregados com sucesso:", contractParams);
            // Limpar o item do sessionStorage após carregar para evitar reuso indevido
            sessionStorage.removeItem('contractParams');
        } catch (error) {
            console.error("contrato.js: Erro ao fazer parse dos parâmetros do contrato do sessionStorage:", error);
        }
    } else {
        console.log("contrato.js: contractParamsString está vazio ou nulo no sessionStorage.");
    }

    // Se os parâmetros não foram carregados ou são inválidos, mostrar mensagem de erro
    if (!contractParams || !contractParams.fichaId || !contractParams.companyId || !contractParams.token) {
        console.error("contrato.js: Parâmetros essenciais do contrato faltando ou inválidos. Encerrando execução.");
        document.body.innerHTML = '<div class="container mx-auto p-6 bg-white shadow-md rounded-lg text-red-700 text-center text-xl">Erro ao carregar os dados essenciais para o contrato. Por favor, tente gerar novamente a partir da Ficha Cadastral.</div>';
        return;
    }
    console.log("contrato.js: Parâmetros essenciais validados. Iniciando busca de dados da ficha e empresa.");

    try {
        // 2. Fazer requisições ao backend para obter os dados completos
        console.log(`contrato.js: Fazendo fetch para fichaId: ${contractParams.fichaId} e companyId: ${contractParams.companyId}`);
        const [fichaResponse, companyResponse] = await Promise.all([
            fetch(`/api/fichas/${contractParams.fichaId}`, {
                headers: { 'Authorization': `Bearer ${contractParams.token}` }
            }),
            fetch(`/api/companies/${contractParams.companyId}`, {
                headers: { 'Authorization': `Bearer ${contractParams.token}` }
            })
        ]);

        console.log("contrato.js: Respostas das APIs recebidas.");

        if (!fichaResponse.ok) {
            const errorData = await fichaResponse.json();
            throw new Error(errorData.message || `Erro HTTP ${fichaResponse.status} ao buscar dados da ficha.`);
        }
        if (!companyResponse.ok) {
            const errorData = await companyResponse.json();
            throw new Error(errorData.message || `Erro HTTP ${companyResponse.status} ao buscar dados da empresa.`);
        }

        const ficha = await fichaResponse.json();
        const dadosEmpresa = await companyResponse.json();

        console.log("contrato.js: Dados da Ficha (backend) - Objeto Completo:", ficha);
        console.log("contrato.js: Dados da Empresa (backend) - Objeto Completo:", dadosEmpresa);
        console.log("contrato.js: Formas de Pagamento da Ficha (dadosVendaFinal.formasPagamento):", ficha.dadosVendaFinal ? ficha.dadosVendaFinal.formasPagamento : "N/A - ficha.dadosVendaFinal.formasPagamento não existe");


        const veiculoPrincipal = ficha.veiculoInteresse;
        const veiculoTroca = ficha.dadosVendaFinal ? ficha.dadosVendaFinal.veiculoTroca : null;
        const formasPagamentoAdicionais = ficha.dadosVendaFinal && ficha.dadosVendaFinal.formasPagamento ? ficha.dadosVendaFinal.formasPagamento : [];
        console.log("contrato.js: formasPagamentoAdicionais preparadas para uso:", formasPagamentoAdicionais);

        let dadosFinanciamento = null;
        if (ficha.financeirasConsultadas) {
             const ultimaAprovacao = ficha.financeirasConsultadas
                                .filter(fc => fc.statusAnalise === 'Aprovada')
                                .sort((a, b) => new Date(b.dataAnalise) - new Date(a.dataAnalise))[0];
            if (ultimaAprovacao) {
                dadosFinanciamento = ultimaAprovacao;
            }
        }

        const precoVendaVeiculoPrincipal = veiculoPrincipal ? veiculoPrincipal.precoSugerido : 0;

        let valorCompensadoVeiculoTroca = 0;
        let dividasVeiculoTroca = [];

        // Certifique-se que o veiculoId dentro do veiculoTroca está populado para pegar dívidas, etc.
        // Se veiculoTroca.veiculoId está populado, use os dados de lá, senão, dos campos diretos da ficha.
        let dadosCompletosVeiculoTroca = null;
        if (veiculoTroca) {
            if (veiculoTroca.veiculoId && typeof veiculoTroca.veiculoId === 'object') {
                dadosCompletosVeiculoTroca = veiculoTroca.veiculoId; // Objeto Vehicle populado
            } else {
                dadosCompletosVeiculoTroca = veiculoTroca; // Usa os campos diretos da ficha (marcaModelo, etc.)
            }

            if (typeof dadosCompletosVeiculoTroca.custoInicial === 'number') { // Custo de Aquisição da Troca
                valorCompensadoVeiculoTroca = dadosCompletosVeiculoTroca.custoInicial;
            } else if (typeof veiculoTroca.custoAquisicao === 'number') { // Fallback para custoAquisicao da ficha
                valorCompensadoVeiculoTroca = veiculoTroca.custoAquisicao;
            }


            // Adiciona dívidas do veículo de troca ao valor compensado
            const dividasAValidar = dadosCompletosVeiculoTroca.dividas || [];
            if (dividasAValidar.length > 0) {
                dividasVeiculoTroca = dividasAValidar; // Atribui para uso posterior na exibição
                dividasVeiculoTroca.forEach(divida => {
                    valorCompensadoVeiculoTroca += divida.valor || 0;
                });
            }
        }

        const valorAprovadoFinanciamento = dadosFinanciamento ? dadosFinanciamento.valorAprovado : 0;
        let totalPagoOutrasFormas = 0;
        console.log("contrato.js: Calculando totalPagoOutrasFormas de:", formasPagamentoAdicionais);
        if (formasPagamentoAdicionais && formasPagamentoAdicionais.length > 0) {
            formasPagamentoAdicionais.forEach(fp => {
                console.log(`contrato.js: Adicionando forma de pagamento: Tipo: ${fp.tipo}, Valor: ${fp.valor}`);
                totalPagoOutrasFormas += fp.valor;
            });
        }
        console.log("contrato.js: totalPagoOutrasFormas calculado:", totalPagoOutrasFormas);

        const valorTotalRecebido = valorCompensadoVeiculoTroca + valorAprovadoFinanciamento + totalPagoOutrasFormas;
        console.log(`contrato.js: Preço Veículo Principal: ${precoVendaVeiculoPrincipal}`);
        console.log(`contrato.js: Valor Compensado Troca (incluindo dívidas): ${valorCompensadoVeiculoTroca}`);
        console.log(`contrato.js: Valor Aprovado Financiamento: ${valorAprovadoFinanciamento}`);
        console.log(`contrato.js: Total Pago Outras Formas: ${totalPagoOutrasFormas}`);
        console.log(`contrato.js: Valor Total Recebido (Soma): ${valorTotalRecebido}`);


        const valorFaltanteFinalCalculado = precoVendaVeiculoPrincipal - valorTotalRecebido;
        console.log(`contrato.js: Valor Faltante Final Calculado: ${valorFaltanteFinalCalculado}`);

        const valorFaltanteFinalDisplay = Math.abs(valorFaltanteFinalCalculado) < 0.01 ? 0 : valorFaltanteFinalCalculado;


        const contractData = {
            vendedor: {
                nome: dadosEmpresa?.nome || 'N/A',
                cnpj: dadosEmpresa?.cnpj || 'N/A',
                endereco: `${dadosEmpresa?.endereco || 'N/A'}, ${dadosEmpresa?.numero || 'N/A'} - ${dadosEmpresa?.bairro || 'N/A'}, ${dadosEmpresa?.cidade || 'N/A'} - ${dadosEmpresa?.estado || 'N/A'}, ${dadosEmpresa?.cep || 'N/A'}`,
                telefone: applyPhoneMask(dadosEmpresa?.cel) || 'N/A',
                whatsapp: applyPhoneMask(dadosEmpresa?.whats) || 'N/A',
                email: dadosEmpresa?.email || 'N/A'
            },
            comprador: {
                nome: ficha.clienteId?.nomeCompleto || ficha.nomeCompletoCliente || 'N/A',
                cpf: applyCpfMask(ficha.clienteId?.cpf || ficha.cpfCliente) || 'N/A',
                rg: ficha.rgCliente || 'N/A',
                endereco: ficha.enderecoCliente ? `${ficha.enderecoCliente.rua || ''}, ${ficha.enderecoCliente.numero || ''} ${ficha.enderecoCliente.complemento ? `- ${ficha.enderecoCliente.complemento}` : ''} - ${ficha.enderecoCliente.bairro || ''}, ${ficha.enderecoCliente.cidade || ''} - ${ficha.enderecoCliente.estado || ''}, ${ficha.enderecoCliente.cep || ''}` : 'N/A',
                telefonePrincipal: applyPhoneMask(ficha.clienteId?.telefonePrincipal || ficha.telefonePrincipalCliente) || 'N/A',
                email: ficha.emailCliente || 'N/A'
            },
            conjuge: (ficha.estadoCivilCliente === 'Casado(a)' && ficha.nomeConjugue) ? {
                nome: ficha.nomeConjugue || 'N/A',
                cpf: applyCpfMask(ficha.cpfConjugue) || 'N/A',
                dataNascimento: formatDateToDisplay(ficha.dataNascimentoConjugue) || 'N/A',
                profissao: ficha.profissaoConjugue || 'N/A'
            } : null,
            veiculoVendido: {
                marcaModelo: veiculoPrincipal ? veiculoPrincipal.marcaModelo : 'N/A',
                ano: veiculoPrincipal ? veiculoPrincipal.ano : 'N/A',
                placa: veiculoPrincipal ? veiculoPrincipal.placa : 'N/A',
                chassi: veiculoPrincipal ? veiculoPrincipal.chassi : 'N/A',
                renavam: veiculoPrincipal ? veiculoPrincipal.renavam : 'N/A',
                cor: veiculoPrincipal?.veiculoId?.cor || 'N/A',
                quilometragem: veiculoPrincipal?.veiculoId?.quilometragem ? veiculoPrincipal.veiculoId.quilometragem.toLocaleString('pt-BR') + ' KM' : 'N/A',
                preco: precoVendaVeiculoPrincipal
            },
            veiculoTrocaData: (veiculoTroca) ? {
                marcaModelo: dadosCompletosVeiculoTroca?.marca ? `${dadosCompletosVeiculoTroca.marca} ${dadosCompletosVeiculoTroca.modelo}` : veiculoTroca.marcaModelo || 'N/A',
                ano: dadosCompletosVeiculoTroca?.ano || veiculoTroca.ano || 'N/A',
                placa: dadosCompletosVeiculoTroca?.placa || veiculoTroca.placa || 'N/A',
                chassi: dadosCompletosVeiculoTroca?.chassi || veiculoTroca.chassi || 'N/A',
                renavam: dadosCompletosVeiculoTroca?.renavam || veiculoTroca.renavam || 'N/A',
                cor: dadosCompletosVeiculoTroca?.cor || veiculoTroca.cor || 'N/A',
                quilometragem: dadosCompletosVeiculoTroca?.quilometragem || veiculoTroca.quilometragem ? (dadosCompletosVeiculoTroca?.quilometragem || veiculoTroca.quilometragem).toLocaleString('pt-BR') + ' KM' : 'N/A',
                custoAquisicao: valorCompensadoVeiculoTroca, // Este é o valor que está sendo "dado" na troca (inclui dívidas)
                dividas: dividasVeiculoTroca, // Dívidas já processadas
                outroProprietario: dadosCompletosVeiculoTroca?.outroProprietario || veiculoTroca.outroProprietario || null
            } : null,
            valorTotalVenda: precoVendaVeiculoPrincipal,
            financiamento: dadosFinanciamento ? {
                nomeFinanceira: dadosFinanciamento.nomeFinanceira,
                valorAprovado: dadosFinanciamento.valorAprovado,
                quantidadeParcelas: dadosFinanciamento.quantidadeParcelas,
                valorParcela: dadosFinanciamento.valorParcela,
                dataVencimentoParcela: dadosFinanciamento.dataVencimentoParcela
            } : null,
            formasPagamentoAdicionais: formasPagamentoAdicionais,
            valorFaltanteFinal: valorFaltanteFinalDisplay,
            dataContrato: `${new Date().getDate().toString().padStart(2, '0')} de ${new Date().toLocaleString('pt-BR', { month: 'long' })} de ${new Date().getFullYear()}`
        };

        console.log("contrato.js: Chamando fillContract com os dados:", contractData);
        fillContract(contractData);
        console.log("contrato.js: Preenchimento do contrato concluído.");

    } catch (error) {
        console.error('contrato.js: Erro ao carregar dados para o contrato:', error);
        document.body.innerHTML = '<div class="container mx-auto p-6 bg-white shadow-md rounded-lg text-red-700 text-center text-xl">Erro ao carregar os dados essenciais para o contrato. Por favor, tente gerar novamente a partir da Ficha Cadastral.</div>';
    }

    // 5. Funções de preenchimento do contrato HTML
    function fillContract(data) {
        console.log("fillContract: Iniciado preenchimento do HTML.");
        // Dados do Vendedor
        if (document.getElementById('vendedor-nome')) document.getElementById('vendedor-nome').textContent = data.vendedor.nome || 'N/A';
        if (document.getElementById('vendedor-cnpj')) document.getElementById('vendedor-cnpj').textContent = data.vendedor.cnpj || 'N/A';
        if (document.getElementById('vendedor-endereco')) document.getElementById('vendedor-endereco').textContent = data.vendedor.endereco || 'N/A';
        if (document.getElementById('vendedor-telefone')) document.getElementById('vendedor-telefone').textContent = data.vendedor.telefone || 'N/A';
        if (document.getElementById('vendedor-whatsapp')) document.getElementById('vendedor-whatsapp').textContent = data.vendedor.whatsapp || 'N/A';
        if (document.getElementById('vendedor-email')) document.getElementById('vendedor-email').textContent = data.vendedor.email || 'N/A';

        // Dados do Comprador
        if (document.getElementById('comprador-nome')) document.getElementById('comprador-nome').textContent = data.comprador.nome || 'N/A';
        if (document.getElementById('comprador-cpf')) document.getElementById('comprador-cpf').textContent = data.comprador.cpf || 'N/A';
        if (document.getElementById('comprador-rg')) document.getElementById('comprador-rg').textContent = data.comprador.rg || 'N/A';
        if (document.getElementById('comprador-endereco')) document.getElementById('comprador-endereco').textContent = data.comprador.endereco || 'N/A';
        if (document.getElementById('comprador-telefone-principal')) document.getElementById('comprador-telefone-principal').textContent = data.comprador.telefonePrincipal || 'N/A';
        if (document.getElementById('comprador-email')) document.getElementById('comprador-email').textContent = data.comprador.email || 'N/A';


        // Dados do Cônjuge (esconder se não aplicável)
        const dadosConjugeDiv = document.getElementById('dados-conjuge');
        if (data.conjuge) {
            if (document.getElementById('conjuge-nome')) document.getElementById('conjuge-nome').textContent = data.conjuge.nome || 'N/A';
            if (document.getElementById('conjuge-cpf')) document.getElementById('conjuge-cpf').textContent = data.conjuge.cpf || 'N/A';
            if (document.getElementById('conjuge-data-nascimento')) document.getElementById('conjuge-data-nascimento').textContent = data.conjuge.dataNascimento || 'N/A';
            if (document.getElementById('conjuge-profissao')) document.getElementById('conjuge-profissao').textContent = data.conjuge.profissao || 'N/A';
            if (dadosConjugeDiv) dadosConjugeDiv.classList.remove('hidden');
        } else {
            if (dadosConjugeDiv) dadosConjugeDiv.classList.add('hidden');
        }

        // Dados do Veículo Vendido
        if (document.getElementById('veiculo-vendido-marca-modelo')) document.getElementById('veiculo-vendido-marca-modelo').textContent = data.veiculoVendido?.marcaModelo || 'N/A';
        if (document.getElementById('veiculo-vendido-ano')) document.getElementById('veiculo-vendido-ano').textContent = data.veiculoVendido?.ano || 'N/A';
        if (document.getElementById('veiculo-vendido-placa')) document.getElementById('veiculo-vendido-placa').textContent = data.veiculoVendido?.placa || 'N/A';
        if (document.getElementById('veiculo-vendido-chassi')) document.getElementById('veiculo-vendido-chassi').textContent = data.veiculoVendido?.chassi || 'N/A';
        if (document.getElementById('veiculo-vendido-renavam')) document.getElementById('veiculo-vendido-renavam').textContent = data.veiculoVendido?.renavam || 'N/A';
        if (document.getElementById('veiculo-vendido-cor')) document.getElementById('veiculo-vendido-cor').textContent = data.veiculoVendido?.cor || 'N/A';
        if (document.getElementById('veiculo-vendido-quilometragem')) document.getElementById('veiculo-vendido-quilometragem').textContent = data.veiculoVendido?.quilometragem || 'N/A';
        if (document.getElementById('veiculo-vendido-preco')) {
            if (data.veiculoVendido && typeof data.veiculoVendido.preco === 'number') {
                document.getElementById('veiculo-vendido-preco').textContent = `${formatNumberToCurrency(data.veiculoVendido.preco)} (${convertNumberToBrazilianCurrencyWords(data.veiculoVendido.preco)})`;
            } else {
                document.getElementById('veiculo-vendido-preco').textContent = 'R$ 0,00 (zero reais) - Preço não disponível';
            }
        }

        // FORMAS DE PAGAMENTO
        if (document.getElementById('valor-total-venda')) document.getElementById('valor-total-venda').textContent = `${formatNumberToCurrency(data.valorTotalVenda)} (${convertNumberToBrazilianCurrencyWords(data.valorTotalVenda)})`;

        const listaFormasPagamento = document.getElementById('lista-formas-pagamento');
        if (listaFormasPagamento) listaFormasPagamento.innerHTML = '';

        // 1. Veículo na Troca (com detalhes e dívidas) - **AJUSTADO**
        const veiculoTrocaSection = document.getElementById('veiculo-troca-section');
        if (data.veiculoTrocaData) {
            const liTroca = document.createElement('li');
            const totalCompensadoFormatado = formatNumberToCurrency(data.veiculoTrocaData.custoAquisicao || 0); // O "custoAquisicao" já é o total (custo + dividas) do veiculo na ficha

            // Monta o texto de "Troca por valor do veículo da troca"
            liTroca.innerHTML = `
                - Entrou na troca o veiculo abaixo discriminado de valor de : ${totalCompensadoFormatado} (${convertNumberToBrazilianCurrencyWords(data.veiculoTrocaData.custoAquisicao || 0)})
            `;

            // Adiciona detalhes do veículo de troca (marca/modelo/ano/placa/chassi/renavam/cor/quilometragem/proprietário)
            const detalhesComplementaresTroca = `
                (${data.veiculoTrocaData.marcaModelo || 'N/A'}, Ano: ${data.veiculoTrocaData.ano || 'N/A'}, Placa: ${data.veiculoTrocaData.placa || 'N/A'}, Chassi: ${data.veiculoTrocaData.chassi || 'N/A'}, Renavam: ${data.veiculoTrocaData.renavam || 'N/A'}, Cor: ${data.veiculoTrocaData.cor || 'N/A'}, Km: ${data.veiculoTrocaData.quilometragem || 'N/A'})
            `;
            liTroca.innerHTML += `<br>&nbsp;&nbsp;&nbsp;&nbsp;Detalhes: ${detalhesComplementaresTroca}`;

            // Adiciona a lista de dívidas, se existirem
            if (data.veiculoTrocaData.dividas && data.veiculoTrocaData.dividas.length > 0) {
                const divDuvidas = document.createElement('div');
                divDuvidas.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;Dívidas: <ul style="list-style: none; padding-left: 1.5em;">' +
                    data.veiculoTrocaData.dividas.map(d => `<li>- ${formatNumberToCurrency(d.valor || 0)} (${d.descricao || 'N/A'})</li>`).join('') +
                    '</ul>';
                liTroca.appendChild(divDuvidas);
            }

            // Adiciona informações de outro proprietário, se houver
            if (data.veiculoTrocaData.outroProprietario && data.veiculoTrocaData.outroProprietario.nome) {
                const pOutroProp = document.createElement('p');
                pOutroProp.innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;Proprietário do Veículo de Troca: ${data.veiculoTrocaData.outroProprietario.nome} (CPF: ${applyCpfMask(data.veiculoTrocaData.outroProprietario.cpf)})`;
                liTroca.appendChild(pOutroProp);
            }


            if (listaFormasPagamento) listaFormasPagamento.appendChild(liTroca);
            if (veiculoTrocaSection) veiculoTrocaSection.classList.remove('hidden'); // Certifica que a seção está visível
        } else {
            if (veiculoTrocaSection) veiculoTrocaSection.classList.add('hidden'); // Esconde a seção se não há veículo de troca
        }


        // 2. Financiamento
        if (data.financiamento) {
            const liFinanciamento = document.createElement('li');
            liFinanciamento.textContent = `- Financiamento com ${data.financiamento.nomeFinanceira || 'N/A'}: ${formatNumberToCurrency(data.financiamento.valorAprovado)} (${convertNumberToBrazilianCurrencyWords(data.financiamento.valorAprovado)}) em ${data.financiamento.quantidadeParcelas || 'N/A'} parcelas de ${formatNumberToCurrency(data.financiamento.valorParcela)} (${convertNumberToBrazilianCurrencyWords(data.financiamento.valorParcela)}) (Vencimento: ${data.financiamento.dataVencimentoParcela || 'N/A'}).`;
            if (listaFormasPagamento) listaFormasPagamento.appendChild(liFinanciamento);
        }

        // 3. Outras Formas de Pagamento
        console.log("fillContract: Verificando formasPagamentoAdicionais para exibição:", data.formasPagamentoAdicionais);
        if (data.formasPagamentoAdicionais && data.formasPagamentoAdicionais.length > 0) {
            data.formasPagamentoAdicionais.forEach(fp => {
                console.log(`fillContract: Adicionando item de forma de pagamento: Tipo: ${fp.tipo}, Valor: ${fp.valor}`);
                const li = document.createElement('li');
                li.textContent = `- ${fp.tipo}: ${formatNumberToCurrency(fp.valor)} (${convertNumberToBrazilianCurrencyWords(fp.valor)})`;
                if (listaFormasPagamento) listaFormasPagamento.appendChild(li);
            });
        } else {
            console.log("fillContract: Nenhuma forma de pagamento adicional para exibir.");
        }

        // Saldo Final (Ajustado para ser ZERO se tudo bateu)
        const liSaldo = document.createElement('li');
        const numericValorFaltanteFinal = data.valorFaltanteFinal;

        if (listaFormasPagamento) {
            const existingSaldoLi = listaFormasPagamento.querySelector('.saldo-final-item');
            if (existingSaldoLi) {
                listaFormasPagamento.removeChild(existingSaldoLi);
            }
        }

        if (Math.abs(numericValorFaltanteFinal) >= 0.01) { // Só mostra se o valor for diferente de zero
            liSaldo.classList.add('saldo-final-item');
            liSaldo.textContent = `- Saldo restante a ser pago: ${formatNumberToCurrency(numericValorFaltanteFinal)} (${convertNumberToBrazilianCurrencyWords(numericValorFaltanteFinal)}).`;
            if (listaFormasPagamento) {
                listaFormasPagamento.appendChild(liSaldo);
            }
        }


        // Data do Contrato (primeira ocorrência)
        const currentDate = `${new Date().getDate().toString().padStart(2, '0')} de ${new Date().toLocaleString('pt-BR', { month: 'long' })} de ${new Date().getFullYear()}`;
        if (document.getElementById('data-contrato')) {
            document.getElementById('data-contrato').textContent = currentDate;
        }
        // Data do Contrato (segunda ocorrência - novo bloco de assinaturas)
        if (document.getElementById('data-contrato-2')) {
            document.getElementById('data-contrato-2').textContent = currentDate;
        }


        // Assinaturas (primeira ocorrência)
        if (document.getElementById('assinatura-vendedor-nome')) {
            document.getElementById('assinatura-vendedor-nome').textContent = data.vendedor.nome || 'Vendedor';
            if (document.getElementById('assinatura-vendedor-cnpj')) document.getElementById('assinatura-vendedor-cnpj').textContent = data.vendedor.cnpj || 'N/A';
            if (document.getElementById('assinatura-comprador-nome')) document.getElementById('assinatura-comprador-nome').textContent = data.comprador.nome || 'Comprador';
            if (document.getElementById('assinatura-comprador-cpf')) document.getElementById('assinatura-comprador-cpf').textContent = data.comprador.cpf || 'N/A';
        }
        // Assinaturas (segunda ocorrência - novo bloco)
        if (document.getElementById('assinatura-vendedor-nome-2')) {
            document.getElementById('assinatura-vendedor-nome-2').textContent = data.vendedor.nome || 'Vendedor';
            if (document.getElementById('assinatura-vendedor-cnpj-2')) document.getElementById('assinatura-vendedor-cnpj-2').textContent = data.vendedor.cnpj || 'N/A';
            if (document.getElementById('assinatura-comprador-nome-2')) document.getElementById('assinatura-comprador-nome-2').textContent = data.comprador.nome || 'Comprador';
            if (document.getElementById('assinatura-comprador-cpf-2')) document.getElementById('assinatura-comprador-cpf-2').textContent = data.comprador.cpf || 'N/A';
        }

        console.log("fillContract: Preenchimento do HTML concluído.");
    }

    // Listener para o botão Imprimir (permanece no contrato.js)
    const printButton = document.getElementById('printContractBtn');
    if (printButton) {
        printButton.addEventListener('click', () => {
            window.print();
        });
    }
    // Listener para o botão Concluir Venda (precisará de nova lógica se for aqui)
    const concluirVendaBtn = document.getElementById('concluirVendaBtn');
    if (concluirVendaBtn) {
        concluirVendaBtn.addEventListener('click', () => {
            alert('Ação "Concluir Venda" será implementada em breve. Por enquanto, a página é apenas para visualização e impressão.');
        });
    }
});