// public/js/ficha_cadastral.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Variáveis de Local Storage ---
    const token = localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const companyId = localStorage.getItem('companyId');
    const userId = localStorage.getItem('userId');


    // --- Verificação de Autenticação e Redirecionamento ---
    if (!token || !userRole || !userName || !companyId || !userId) {
        alert('Sessão expirada ou não autentada. Faça login novamente.');
        localStorage.clear();
        window.location.href = '/';
        return;
    }

    // --- Elementos do DOM (CABEÇALHO COM INFORMAÇÕES DO USUÁRIO) ---
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const logoutButton = document.getElementById('logoutButton');
    const mainNav = document.getElementById('main-nav');

    // --- Elementos do Sidebar (Necessários para inicialização) ---
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    // --- Preencher Informações do Usuário no Cabeçalho ---
    if (userNameDisplay) userNameDisplay.textContent = userName;
    if (userRoleDisplay) userRoleDisplay.textContent = userRole.toUpperCase();

    async function fetchCompanyName() {
        try {
            const response = await fetch(`/api/companies/${companyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const company = await response.json();
                if (companyNameDisplay) companyNameDisplay.textContent = company.nome;
            } else {
                console.error('Erro ao buscar nome da empresa:', response.statusText);
                if (companyNameDisplay) companyNameDisplay.textContent = 'N/A';
            }
        } catch (error) {
            console.error('Erro na requisição da empresa:', error);
            if (companyNameDisplay) companyNameDisplay.textContent = 'N/A';
        }
    }
    fetchCompanyName();

    // --- Lógica do Menu Lateral Dinâmico (Existente) ---
    const menuItems = [
        { name: 'Dashboard', href: '/dashboard.html', icon: 'layout-dashboard', roles: ['vendedor', 'fn', 'conferente', 'documentacao', 'gerente'] },
        { name: 'Preparação', href: '#', icon: 'wrench', roles: ['gerente'] },
        { name: 'Manutenção', href: '#', icon: 'hammer', roles: ['gerente'] },
        { name: 'Estoque', href: '/estoque.html', icon: 'package', roles: ['vendedor', 'gerente'] },
        { name: 'Clientes', href: '/clientes.html', icon: 'users', roles: ['vendedor', 'gerente'] },
        { name: 'Ficha Cadastral', href: '/ficha_cadastral.html', icon: 'file-text', roles: ['vendedor', 'gerente'] },
        { name: 'Análise de Crédito', href: '/analise_credito.html', icon: 'wallet', roles: ['fn', 'gerente'] },
        { name: 'Vendas realizadas', href: '/vendas_realizadas.html', icon: 'shield-check', roles: ['vendedor', 'gerente'] },
        { name: 'Conferência', href: '/conferencia.html', icon: 'clipboard-list', roles: ['conferente', 'gerente'] },
        { name: 'Documentação', href: '/documentacao.html', icon: 'file-check', roles: ['documentacao', 'gerente'] },
        { name: 'Arquivo', href: '/arquivo.html', icon: 'archive', roles: ['gerente'] },
        { name: 'Gerenciar Usuários', href: '#userManagement', icon: 'user-cog', roles: ['gerente'], isSpecial: true }
    ];

    function renderMenu() {
        mainNav.innerHTML = '';
        menuItems.forEach(item => {
            if (item.roles.includes(userRole)) {
                const isActive = window.location.pathname === item.href;
                const link = document.createElement('a');
                link.href = item.href;
                link.classList.add('block', 'py-2.5', 'px-4', 'rounded', 'transition', 'duration-200', 'hover:bg-gray-700', 'flex', 'items-center', 'gap-3');
                if (isActive) {
                    link.classList.add('active-link');
                }

                const iconElement = document.createElement('i');
                iconElement.setAttribute('data-lucide', item.icon);
                iconElement.classList.add('mr-3');

                link.appendChild(iconElement);

                const textSpan = document.createElement('span');
                textSpan.textContent = item.name;
                link.appendChild(textSpan);

                if (item.isSpecial && item.roles.includes('gerente')) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.location.href = '/gerenciar_usuarios.html';
                    });
                }
                mainNav.appendChild(link);
            }
        });
        lucide.createIcons();
    }
    renderMenu();

    // --- Lógica do Sidebar (Abre e Fecha) ---
    lucide.createIcons();
    if (openSidebarBtn) {
      openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
      });
    }
    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
      });
    }
    document.addEventListener('click', (event) => {
      if (window.innerWidth < 768 && sidebar && !sidebar.contains(event.target) && (!openSidebarBtn || !openSidebarBtn.contains(event.target))) {
        sidebar.classList.add('-translate-x-full');
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        sidebar.classList.remove('-translate-x-full');
      } else {
        sidebar.classList.add('-translate-x-full');
      }
      if (document.body.classList.contains('modal-open') && window.innerWidth < 768) {
          document.body.classList.add('overflow-hidden');
      } else {
          document.body.classList.remove('overflow-hidden');
      }
    });
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.attributeName === 'class') {
                    if (modal.classList.contains('hidden')) {
                        document.body.classList.remove('modal-open', 'overflow-hidden');
                    } else {
                        document.body.classList.add('modal-open');
                        if (window.innerWidth < 768) {
                            document.body.classList.add('overflow-hidden');
                        }
                    }
                }
            }
        });
        observer.observe(modal, { attributes: true });
    });
    window.dispatchEvent(new Event('resize'));

    // --- Lógica de Logout ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.clear();
                window.location.href = '/';
            }
        });
    }

    // --- Elementos do DOM (FICHA CADASTRAL - MAIN) ---
    const fichasTableBody = document.getElementById('fichasTableBody');
    const filtroFichasInput = document.getElementById('filtro-fichas');
    const btnNovaFichaCadastral = document.getElementById('btnNovaFichaCadastral');
    const acaoModal = document.getElementById('acaoModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalClienteNome = document.getElementById('modalClienteNome');
    const modalClienteCpf = document.getElementById('modalClienteCpf');
    const modalVeiculoNome = document.getElementById('modalVeiculoNome');
    const modalVeiculoPlaca = document.getElementById('modalVeiculoPlaca');
    const dialogoContent = document.getElementById('dialogoContent');
    const dialogoForm = document.getElementById('dialogoForm');
    const mensagemInput = document.getElementById('mensagemInput');
    const acoesContainer = document.getElementById('acoesContainer');

    // --- NOVOS ELEMENTOS DE FILTRO DE MÊS/ANO ---
    const filtroMesSelect = document.getElementById('filtro-mes');
    const filtroAnoSelect = document.getElementById('filtro-ano');

    // --- Elementos do Modal de Ficha Cadastral ---
    const fichaCadastralModal = document.getElementById('fichaCadastralModal');
    const fichaModalTitle = document.getElementById('fichaModalTitle');
    const fichaForm = document.getElementById('fichaForm');
    const closeFichaModalBtn = document.getElementById('closeFichaModalBtn');

    const fichaPart1 = document.getElementById('fichaPart1');
    const fichaPart2 = document.getElementById('fichaPart2');
    const fichaPart3 = document.getElementById('fichaPart3');
    const fichaPart4 = document.getElementById('fichaPart4');


    const btnSalvarParte1 = document.getElementById('btnSalvarParte1');
    const btnSalvarParte2 = document.getElementById('btnSalvarParte2');
    const btnSalvarVeiculo = document.getElementById('btnSalvarVeiculo');
    const btnSalvarApenas = document.getElementById('btnSalvarApenas');
    const btnSalvarEEnviarAnalise = document.getElementById('btnSalvarEEnviarAnalise');

    const btnVoltarParte2 = document.getElementById('btnVoltarParte2');
    const btnVoltarParte3 = document.getElementById('btnVoltarParte3');
    const btnVoltarParte4 = document.getElementById('btnVoltarParte4');

    const cancelFichaModalBtn1 = document.getElementById('cancelFichaModalBtn1');
    const cancelFichaModalBtn2 = document.getElementById('cancelFichaModalBtn2');
    const cancelFichaModalBtn3 = document.getElementById('cancelFichaModalBtn3');
    const cancelFichaModalBtn4 = document.getElementById('cancelFichaModalBtn4');

    const fichaMessage1 = document.getElementById('fichaMessage1');
    const fichaMessage2 = document.getElementById('fichaMessage2');
    const fichaMessage3 = document.getElementById('fichaMessage3');
    const fichaMessage4 = document.getElementById('fichaMessage4');

    // Inputs do formulário da Ficha Cadastral (IDs do HTML)
    const fichaIdInput = document.getElementById('fichaId');
    const fichaClienteIdInput = document.getElementById('fichaClienteId');
    const fichaCompanyIdInput = document.getElementById('fichaCompanyId');
    const fichaCadastradoPorIdInput = document.getElementById('fichaCadastradoPorId');
    const fichaPodeSerEditadaPeloVendedorInput = document.getElementById('fichaPodeSerEditadaPeloVendedor');

    // Parte 1 - Cliente
    const cpfClienteInput = document.getElementById('cpfCliente');
    const nomeCompletoClienteInput = document.getElementById('nomeCompletoCliente');
    const rgClienteInput = document.getElementById('rgCliente');
    const dataNascimentoClienteInput = document.getElementById('dataNascimentoCliente');
    const emailClienteInput = document.getElementById('emailCliente');
    const telefonePrincipalClienteInput = document.getElementById('telefonePrincipalCliente');
    const telefoneSecundarioClienteInput = document.getElementById('telefoneSecundarioCliente');
    const profissaoClienteInput = document.getElementById('profissaoCliente');
    const estadoCivilClienteSelect = document.getElementById('estadoCivilCliente');

    // Parte 1 - Endereço Residencial
    const cepResidencialInput = document.getElementById('cepResidencial');
    const ruaResidencialInput = document.getElementById('ruaResidencial');
    const numeroResidencialInput = document.getElementById('numeroResidencial');
    const complementoResidencialInput = document.getElementById('complementoResidencial');
    const bairroResidencialInput = document.getElementById('bairroResidencial');
    const cidadeResidencialInput = document.getElementById('cidadeResidencial');
    const estadoResidencialInput = document.getElementById('estadoResidencial');

    // Parte 2 - Profissional
    const nomeEmpresaTrabalhaInput = document.getElementById('nomeEmpresaTrabalha');
    const tempoDeEmpresaInput = document.getElementById('tempoDeEmpresa');
    const cargoOcupadoInput = document.getElementById('cargoOcupado');
    const rendaBrutaInput = document.getElementById('rendaBruta');
    const tipoRendaSelect = document.getElementById('tipoRenda');
    const possuiCnhSelect = document.getElementById('possuiCnh');

    // Parte 2 - Cônjuge
    const nomeConjugueInput = document.getElementById('nomeConjugue');
    const cpfConjugueInput = document.getElementById('cpfConjugue');
    const dataNascimentoConjugueInput = document.getElementById('dataNascimentoConjugue');
    const profissaoConjugueInput = document.getElementById('profissaoConjugue');

    // Parte 2 - Endereço Profissional
    const cepProfissionalInput = document.getElementById('cepProfissional');
    const ruaProfissionalInput = document.getElementById('ruaProfissional');
    const numeroProfissionalInput = document.getElementById('numeroProfissional');
    const complementoProfissionalInput = document.getElementById('complementoProfissional');
    const bairroProfissionalInput = document.getElementById('bairroProfissional');
    const cidadeProfissionalInput = document.getElementById('cidadeProfissional');
    const estadoProfissionalInput = document.getElementById('estadoProfissional');
    const telefoneProfissionalInput = document.getElementById('telefoneProfissional');

    // Parte 3 - Veículo de Interesse
    const filtroVeiculoInteresseInput = document.getElementById('filtroVeiculoInteresse');
    const listaVeiculosDisponiveisDiv = document.getElementById('listaVeiculosDisponiveis');
    const detalhesVeiculoSelecionadoDiv = document.getElementById('detalhesVeiculoSelecionado');
    const displayPlacaVeiculoSpan = document.getElementById('displayPlacaVeiculo');
    const displayModeloVeiculoSpan = document.getElementById('displayModeloVeiculo');
    const displayAnoVeiculoSpan = document.getElementById('displayAnoVeiculo');
    const displayCorVeiculoSpan = document.getElementById('displayCorVeiculo');
    const displayPrecoVeiculoSpan = document.getElementById('displayPrecoVeiculo');
    const veiculoIdSelecionadoInput = document.getElementById('veiculoIdSelecionado');
    const veiculoPlacaSelecionadoInput = document.getElementById('veiculoPlacaSelecionado');
    const veiculoChassiSelecionadoInput = document.getElementById('veiculoChassiSelecionado');
    const veiculoRenavamSelecionadoInput = document.getElementById('veiculoRenavamSelecionado');

    let currentFichaStep = 1;
    let selectedVehicleForFicha = null;

    // --- Elementos do NOVO Modal de Aprovação para o Vendedor (agora também para Andamento da Análise) ---
    const aprovacaoVendedorModal = document.getElementById('aprovacaoVendedorModal');
    const andamentoAnaliseModalTitle = document.getElementById('andamentoAnaliseModalTitle');
    const closeAprovacaoVendedorModalBtn = document.getElementById('closeAprovacaoVendedorModalBtn');
    const closeAprovacaoVendedorModalBtnBottom = document.getElementById('closeAprovacaoVendedorModalBtnBottom');
    const aprovacaoVendedorVeiculoInfo = document.getElementById('aprovacaoVendedorVeiculoInfo');
    const aprovacaoVendedorClienteNome = document.getElementById('aprovacaoVendedorClienteNome');
    const aprovacaoVendedorClienteCpf = document.getElementById('aprovacaoVendedorClienteCpf');
    const aprovacaoVendedorAnalisesContent = document.getElementById('aprovacaoVendedorAnalisesContent');
    const aprovacaoVendedorDialogoContent = document.getElementById('aprovacaoVendedorDialogoContent');
    const noAnalisesMessage = document.getElementById('noAnalisesMessage');
    const noDialogoMessage = document.getElementById('noDialogoMessage');

    // --- Elementos do NOVO Modal de Formalizar Venda ---
    const formalizarVendaModal = document.getElementById('formalizarVendaModal');
    const closeFormalizarVendaModalBtn = document.getElementById('closeFormalizarVendaModalBtn');
    const formalizarVendaForm = document.getElementById('formalizarVendaForm');
    const formalizarVendaClienteNome = document.getElementById('formalizarVendaClienteNome');
    const formalizarVendaFichaId = document.getElementById('formalizarVendaFichaId');
    const formalizarVendaVeiculoId = document.getElementById('formalizarVendaVeiculoId');
    const formalizarVendaDisplayModelo = document.getElementById('formalizarVendaDisplayModelo');
    const formalizarVendaDisplayPlaca = document.getElementById('formalizarVendaDisplayPlaca');
    const formalizarVendaDisplayAno = document.getElementById('formalizarVendaDisplayAno');
    const formalizarVendaDisplayChassi = document.getElementById('formalizarVendaDisplayChassi');
    const formalizarVendaDisplayRenavam = document.getElementById('formalizarVendaDisplayRenavam');
    const formalizarVendaDisplayCor = document.getElementById('formalizarVendaDisplayCor');
    const formalizarVendaDisplayKm = document.getElementById('formalizarVendaDisplayKm');

    const formalizarVendaDisplayPreco = document.getElementById('formalizarVendaDisplayPreco');
    const possuiVeiculoTroca = document.getElementById('possuiVeiculoTroca');
    const detalhesVeiculoTroca = document.getElementById('detalhesVeiculoTroca');
    const btnCadastrarVeiculoTroca = document.getElementById('btnCadastrarVeiculoTroca');
    const displayVeiculoTrocaMarcaModelo = document.getElementById('displayVeiculoTrocaMarcaModelo');
    const displayVeiculoTrocaPlaca = document.getElementById('displayVeiculoTrocaPlaca');
    const displayVeiculoTrocaAno = document.getElementById('displayVeiculoTrocaAno');
    const displayVeiculoTrocaCor = document.getElementById('displayVeiculoTrocaCor');
    const displayVeiculoTrocaChassi = document.getElementById('displayVeiculoTrocaChassi');
    const displayVeiculoTrocaRenavam = document.getElementById('displayVeiculoTrocaRenavam');
    const displayVeiculoTrocaQuilometragem = document.getElementById('displayVeiculoTrocaQuilometragem');

    const displayVeiculoTrocaCusto = document.getElementById('displayVeiculoTrocaCusto');
    const secaoAprovacao = document.getElementById('secaoAprovacao');
    const carregarDadosAprovacao = document.getElementById('carregarDadosAprovacao');
    const detalhesAprovacaoCarregados = document.getElementById('detalhesAprovacaoCarregados');
    const formalizarVendaDisplayFinanceira = document.getElementById('formalizarVendaDisplayFinanceira');
    const formalizarVendaDisplayValorAprovado = document.getElementById('formalizarVendaDisplayValorAprovado');
    const formalizarVendaDisplayQtdParcelas = document.getElementById('formalizarVendaDisplayQtdParcelas');
    const formalizarVendaDisplayValorParcela = document.getElementById('formalizarVendaDisplayValorParcela');
    const formalizarVendaDisplayVencimento = document.getElementById('formalizarVendaDisplayVencimento');
    const formalizarVendaIdAprovacaoSelecionada = document.getElementById('formalizarVendaIdAprovacaoSelecionada');
    const secaoPagamento = document.getElementById('secaoPagamento');
    const formalizarVendaValorFaltante = document.getElementById('formalizarVendaValorFaltante');
    const formasPagamentoContainer = document.getElementById('formasPagamentoContainer');
    const btnAddFormaPagamento = document.getElementById('btnAddFormaPagamento');
    const formalizarVendaMessage = document.getElementById('formalizarVendaMessage');
    const cancelFormalizarVendaModalBtn = document.getElementById('cancelFormalizarVendaModalBtn');
    const btnGerarContrato = document.getElementById('btnGerarContrato');
    const btnConcluirVenda = document.getElementById('btnConcluirVenda');
    const formasPagamentoUl = document.getElementById('formasPagamentoUl');
    const noFormasPagamentoMessage = document.getElementById('noFormasPagamentoMessage');

    // --- Elementos do NOVO Modal de Cadastro de Veículo na Troca ---
    const veiculoTrocaModal = document.getElementById('veiculoTrocaModal');
    const closeVeiculoTrocaModalBtn = document.getElementById('closeVeiculoTrocaModalBtn');
    const veiculoTrocaForm = document.getElementById('veiculoTrocaForm');
    const veiculoTrocaId = document.getElementById('veiculoTrocaId');
    const veiculoTrocaCompanyId = document.getElementById('veiculoTrocaCompanyId');
    const veiculoTrocaCadastradoPorId = document.getElementById('veiculoTrocaCadastradoPorId');
    const veiculoTrocaStatus = document.getElementById('veiculoTrocaStatus');
    const veiculoTrocaProprietarioFichaId = document.getElementById('veiculoTrocaProprietarioFichaId');
    const veiculoTrocaTipo = document.getElementById('veiculoTrocaTipo');
    const veiculoTrocaMarca = document.getElementById('veiculoTrocaMarca');
    const veiculoTrocaModelo = document.getElementById('veiculoTrocaModelo');
    const veiculoTrocaAno = document.getElementById('veiculoTrocaAno');
    const veiculoTrocaPlaca = document.getElementById('veiculoTrocaPlaca');
    const veiculoTrocaChassi = document.getElementById('veiculoTrocaChassi');
    const veiculoTrocaRenavam = document.getElementById('veiculoTrocaRenavam');
    const veiculoTrocaCor = document.getElementById('veiculoTrocaCor');
    const veiculoTrocaCombustivel = document.getElementById('veiculoTrocaCombustivel');
    const veiculoTrocaQuilometragem = document.getElementById('veiculoTrocaQuilometragem');
    const veiculoTrocaObservacoes = document.getElementById('veiculoTrocaObservacoes');

    const veiculoTrocaCustoInicial = document.getElementById('veiculoTrocaCustoInicial');
    const veiculoTrocaCustoTotalDisplay = document.getElementById('veiculoTrocaCustoTotalDisplay');

    const secaoDividaTroca = document.getElementById('secaoDividaTroca');
    const dividasTrocaContainer = document.getElementById('dividasTrocaContainer');
    const btnAddDividaTroca = document.getElementById('btnAddDividaTroca');
    const totalDividaTrocaDisplay = document.getElementById('totalDividaTrocaDisplay');
    const secaoProprietarioTroca = document.getElementById('secaoProprietarioTroca');
    const dadosOutroProprietarioTroca = document.getElementById('dadosOutroProprietarioTroca');
    const veiculoTrocaProprietarioComprador = document.getElementById('veiculoTrocaProprietarioComprador');
    const veiculoTrocaProprietarioCpf = document.getElementById('veiculoTrocaProprietarioCpf');
    const veiculoTrocaProprietarioNome = document.getElementById('veiculoTrocaProprietarioNome');
    const veiculoTrocaMessage = document.getElementById('veiculoTrocaMessage');
    const cancelVeiculoTrocaModalBtn = document.getElementById('cancelVeiculoTrocaModalBtn');
    const btnSalvarEtapaTroca = document.getElementById('btnSalvarEtapaTroca');

    // --- NOVOS ELEMENTOS ADICIONADOS PARA A LISTAGEM DE DÍVIDAS ---
    const dividasTrocaUl = document.getElementById('dividasTrocaUl');
    const noDividasMessage = document.getElementById('noDividasMessage');
    // --- FIM DOS NOVOS ELEMENTOS ---

    let currentFichaData = null;
    let veiculoTrocaCadastrado = null;
    let financiamentoAprovadoSelecionado = null;

    // --- Funções Auxiliares Comuns ---
    function showMessage(element, message, isError = true) {
        element.textContent = message;
        element.classList.remove('hidden');
        if (isError) {
            element.classList.remove('text-green-500');
            element.classList.add('text-red-500');
        } else {
            element.classList.remove('text-red-500');
            element.classList.add('text-green-500');
        }
    }

    function clearMessage(element) {
        element.textContent = '';
        element.classList.add('hidden');
    }

    // --- Funções de Máscara e Formatação ---
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
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        return value;
    }
    function applyCepMask(value) {
        if (!value) return '';
        value = String(value).replace(/\D/g, '');
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        return value;
    }
    function parseCurrencyToNumber(value) {
        if (typeof value !== 'string') return Number(value) || 0;
        return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
    }
    function formatNumberToCurrency(number) {
        if (typeof number !== 'number' || isNaN(number)) return 'R$ 0,00';
        return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function formatDateWithTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function handleCurrencyInput(event) {
        let input = event.target;
        let value = input.value.replace('R$', '').replace(/\./g, '').replace(/,/g, '');

        value = value.replace(/^0+/, '');
        if (value === '') value = '0';

        let num = parseInt(value, 10);
        if (isNaN(num)) {
            input.value = 'R$ 0,00';
            return;
        }

        let formattedValue = (num / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        input.value = 'R$ ' + formattedValue;
    }

    function handleCurrencyBlur(event) {
        let input = event.target;
        let numericValue = parseCurrencyToNumber(input.value);
        input.value = formatNumberToCurrency(numericValue);
        if (input.id === 'veiculoTrocaCustoInicial' || input.classList.contains('divida-valor') || input.classList.contains('forma-pagamento-valor')) {
            calculateValorFaltante();
        }
    }

    function setupCurrencyListeners(container = document) {
        Array.from(container.querySelectorAll('.currency-input')).forEach(input => {
            input.removeEventListener('input', handleCurrencyInput);
            input.removeEventListener('blur', handleCurrencyBlur);
            input.addEventListener('input', handleCurrencyInput);
            input.addEventListener('blur', handleCurrencyBlur);
        });
    }

    async function buscarEnderecoPorCep(cep, ruaInputElem, numeroInputElem, complementoInputElem, bairroInputElem, cidadeInputElem, estadoInputElem) {
        const cleanedCep = String(cep).replace(/\D/g, '');
        if (cleanedCep.length !== 8) {
            ruaInputElem.value = '';
            numeroInputElem.value = '';
            complementoInputElem.value = '';
            bairroInputElem.value = '';
            cidadeInputElem.value = '';
            estadoInputElem.value = '';
            if (ruaInputElem) ruaInputElem.removeAttribute('readonly');
            if (bairroInputElem) bairroInputElem.removeAttribute('readonly');
            if (cidadeInputElem) cidadeInputElem.removeAttribute('readonly');
            if (estadoInputElem) estadoInputElem.removeAttribute('readonly');
            console.log('CEP inválido para busca ou não completo:', cep);
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = await response.json();

            if (response.ok && !data.erro) {
                ruaInputElem.value = data.logradouro || '';
                complementoInputElem.value = data.complemento || '';
                bairroInputElem.value = data.bairro || '';
                cidadeInputElem.value = data.localidade || '';
                estadoInputElem.value = data.uf || '';
                numeroInputElem.focus();

                ruaInputElem.setAttribute('readonly', true);
                bairroInputElem.setAttribute('readonly', true);
                cidadeInputElem.setAttribute('readonly', true);
                estadoInputElem.setAttribute('readonly', true);

            } else {
                console.warn('CEP não encontrado ou erro na API ViaCEP:', data.erro ? 'CEP inválido na API.' : 'Erro na requisição da API.');
                alert('CEP não encontrado ou inválido. Por favor, digite o endereço manualmente.');
                ruaInputElem.value = '';
                numeroInputElem.value = '';
                complementoInputElem.value = '';
                bairroInputElem.value = '';
                cidadeInputElem.value = '';
                estadoInputElem.value = '';
                ruaInputElem.focus();

                if (ruaInputElem) ruaInputElem.removeAttribute('readonly');
                if (bairroInputElem) bairroInputElem.removeAttribute('readonly');
                if (cidadeInputElem) cidadeInputElem.removeAttribute('readonly');
                if (estadoInputElem) estadoInputElem.removeAttribute('readonly');
            }
        } catch (error) {
            console.error('Erro ao buscar endereço pelo CEP:', error);
            alert('Erro ao buscar endereço. Verifique sua conexão ou digite manualmente.');
            ruaInputElem.focus();
            if (ruaInputElem) ruaInputElem.removeAttribute('readonly');
            if (bairroInputElem) bairroInputElem.removeAttribute('readonly');
            if (cidadeInputElem) cidadeInputElem.removeAttribute('readonly');
            if (estadoInputElem) estadoInputElem.removeAttribute('readonly');
        }
    }


    cpfClienteInput.addEventListener('input', (e) => { e.target.value = applyCpfMask(e.target.value); });
    cpfConjugueInput.addEventListener('input', (e) => { e.target.value = applyCpfMask(e.target.value); });
    telefonePrincipalClienteInput.addEventListener('input', (e) => { e.target.value = applyPhoneMask(e.target.value); });
    telefoneSecundarioClienteInput.addEventListener('input', (e) => { e.target.value = applyPhoneMask(e.target.value); });
    telefoneProfissionalInput.addEventListener('input', (e) => { e.target.value = applyPhoneMask(e.target.value); });
    cepResidencialInput.addEventListener('input', (e) => { e.target.value = applyCepMask(e.target.value); });
    cepProfissionalInput.addEventListener('input', (e) => { e.target.value = applyCepMask(e.target.value); });
    estadoResidencialInput.addEventListener('input', (e) => { e.target.value = String(e.target.value).toUpperCase(); });
    estadoProfissionalInput.addEventListener('input', (e) => { e.target.value = String(e.target.value).toUpperCase(); });
    emailClienteInput.addEventListener('input', (e) => { e.target.value = String(e.target.value).toLowerCase(); });

    cepResidencialInput.addEventListener('blur', (e) => {
        buscarEnderecoPorCep(e.target.value, ruaResidencialInput, numeroResidencialInput, complementoResidencialInput, bairroResidencialInput, cidadeResidencialInput, estadoResidencialInput);
    });
    cepProfissionalInput.addEventListener('blur', (e) => {
        buscarEnderecoPorCep(e.target.value, ruaProfissionalInput, numeroProfissionalInput, complementoProfissionalInput, bairroProfissionalInput, cidadeProfissionalInput, estadoProfissionalInput);
    });

    cpfClienteInput.addEventListener('blur', async (e) => {
        const cpf = String(e.target.value).replace(/\D/g, '');
        if (cpf.length !== 11) {
            console.log('CPF incompleto para busca automática.');
            clearClientPersonalFields();
            return;
        }

        try {
            const response = await fetch(`/api/clients?cpf=${cpf}&companyId=${companyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok && data.length > 0) {
                const client = data[0];
                console.log('Cliente encontrado para autocompletar:', client);
                fichaClienteIdInput.value = client._id;
                nomeCompletoClienteInput.value = client.nomeCompleto || '';
                rgClienteInput.value = client.rg || '';
                dataNascimentoClienteInput.value = client.dataNascimento ? new Date(client.dataNascimento).toISOString().split('T')[0] : '';
                emailClienteInput.value = client.email || '';
                telefonePrincipalClienteInput.value = applyPhoneMask(client.telefonePrincipal || '');
                telefoneSecundarioClienteInput.value = applyPhoneMask(client.telefoneSecundario || '');
                profissaoClienteInput.value = client.profissao || '';
                estadoCivilClienteSelect.value = client.estadoCivil || '';

                if (client.endereco) {
                    cepResidencialInput.value = applyCepMask(client.endereco.cep || '');
                    ruaResidencialInput.value = client.endereco.rua || '';
                    numeroResidencialInput.value = client.endereco.numero || '';
                    complementoResidencialInput.value = client.endereco.complemento || '';
                    bairroResidencialInput.value = client.endereco.bairro || '';
                    cidadeResidencialInput.value = client.endereco.localidade || client.endereco.cidade || '';
                    estadoResidencialInput.value = client.endereco.uf || client.endereco.estado || '';
                } else {
                    limparEnderecoResidencialInputs();
                }

                if (ruaResidencialInput) ruaResidencialInput.setAttribute('readonly', true);
                if (bairroResidencialInput) bairroResidencialInput.setAttribute('readonly', true);
                if (cidadeResidencialInput) cidadeResidencialInput.setAttribute('readonly', true);
                if (estadoResidencialInput) estadoResidencialInput.setAttribute('readonly', true);

                showMessage(fichaMessage1, 'Cliente existente carregado automaticamente!', false);
            } else {
                console.log('Cliente não encontrado para este CPF. Prossiga com o preenchimento manual.');
                showMessage(fichaMessage1, 'Cliente não encontrado. Preencha os dados manualmente.', false);
                clearClientPersonalFields();
                if (ruaResidencialInput) ruaResidencialInput.removeAttribute('readonly');
                if (bairroResidencialInput) bairroResidencialInput.removeAttribute('readonly');
                if (cidadeResidencialInput) cidadeResidencialInput.removeAttribute('readonly');
                if (estadoResidencialInput) estadoResidencialInput.removeAttribute('readonly');
            }
        } catch (error) {
            console.error('Erro na busca de cliente por CPF:', error);
            showMessage(fichaMessage1, 'Erro ao buscar cliente por CPF. Tente novamente.', true);
            clearClientPersonalFields();
            if (ruaResidencialInput) ruaResidencialInput.removeAttribute('readonly');
            if (bairroResidencialInput) bairroResidencialInput.removeAttribute('readonly');
            if (cidadeResidencialInput) cidadeResidencialInput.removeAttribute('readonly');
            if (estadoResidencialInput) estadoResidencialInput.removeAttribute('readonly');
        }
    });

    function clearClientPersonalFields() {
        fichaClienteIdInput.value = '';
        nomeCompletoClienteInput.value = '';
        rgClienteInput.value = '';
        dataNascimentoClienteInput.value = '';
        emailClienteInput.value = '';
        telefonePrincipalClienteInput.value = '';
        telefoneSecundarioClienteInput.value = '';
        profissaoClienteInput.value = '';
        estadoCivilClienteSelect.value = '';

        limparEnderecoResidencialInputs();
    }

    function showFichaPart(partNumber) {
        const parts = [fichaPart1, fichaPart2, fichaPart3, fichaPart4];
        parts.forEach((part, index) => {
            if (index + 1 === partNumber) {
                part.classList.remove('hidden');
            } else {
                part.classList.add('hidden');
            }
        });
        currentFichaStep = partNumber;
        fichaModalTitle.textContent = `Ficha Cadastral (Parte ${partNumber} de 4)`;

        if (partNumber === 2) {
            setupCurrencyListeners(fichaPart2);
        }
        if (partNumber === 3) {
            carregarVeiculosDisponiveis();
        }
    }

    function clearAllFichaMessages() {
        clearMessage(fichaMessage1);
        clearMessage(fichaMessage2);
        clearMessage(fichaMessage3);
        clearMessage(fichaMessage4);
    }

    function resetFichaForm() {
        fichaForm.reset();
        fichaIdInput.value = '';
        fichaClienteIdInput.value = '';
        fichaPodeSerEditadaPeloVendedorInput.value = 'true';
        selectedVehicleForFicha = null;
        detalhesVeiculoSelecionadoDiv.classList.add('hidden');
        filtroVeiculoInteresseInput.value = '';
        currentFichaStep = 1;
        showFichaPart(1);
        clearAllFichaMessages();
        clearClientPersonalFields();
        limparEnderecoProfissionalInputs();

    }

    btnNovaFichaCadastral.addEventListener('click', () => {
        resetFichaForm();
        fichaCompanyIdInput.value = companyId;
        fichaCadastradoPorIdInput.value = userId;
        fichaModalTitle.textContent = 'Nova Ficha Cadastral';
        fichaCadastralModal.classList.remove('hidden');
        showFichaPart(1);
    });

    closeFichaModalBtn.addEventListener('click', () => {
        fichaCadastralModal.classList.add('hidden');
        resetFichaForm();
    });

    [cancelFichaModalBtn1, cancelFichaModalBtn2, cancelFichaModalBtn3, cancelFichaModalBtn4].forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja cancelar e fechar a ficha? Todo o progresso será perdido.')) {
                fichaCadastralModal.classList.add('hidden');
                resetFichaForm();
            }
        });
    });

    btnVoltarParte2.addEventListener('click', () => showFichaPart(1));
    btnVoltarParte3.addEventListener('click', () => showFichaPart(2));
    btnVoltarParte4.addEventListener('click', () => showFichaPart(3));

    btnSalvarParte1.addEventListener('click', async () => {
        // Validação inicial dos campos obrigatórios da Parte 1
        if (!nomeCompletoClienteInput.value.trim() || !cpfClienteInput.value.trim() || !telefonePrincipalClienteInput.value.trim() ||
            !cepResidencialInput.value.trim() || !ruaResidencialInput.value.trim() || !numeroResidencialInput.value.trim() ||
            !bairroResidencialInput.value.trim() || !cidadeResidencialInput.value.trim() || !estadoResidencialInput.value.trim()) {
            showMessage(fichaMessage1, 'Por favor, preencha todos os campos obrigatórios da Parte 1.', true);
            return;
        }

        clearMessage(fichaMessage1); // Limpa a mensagem de erro antes de processar

        try {
            // Chamada para a nova função que cadastra/atualiza o cliente
            const clientResult = await createOrUpdateClient();

            if (clientResult && clientResult.success) {
                // Se o cliente foi salvo/atualizado com sucesso, avance para a Parte 2
                showFichaPart(2);
                fichaModalTitle.textContent = 'Ficha Cadastral (Parte 2 de 4)';
            } else {
                // Se houve um erro no cadastro/atualização do cliente, exiba a mensagem e não avance
                showMessage(fichaMessage1, clientResult.message || 'Erro ao salvar/atualizar dados do cliente.', true);
            }
        } catch (error) {
            console.error('Erro ao processar cliente na Parte 1:', error);
            showMessage(fichaMessage1, 'Erro interno ao processar dados do cliente.', true);
        }
    });

    // --- NOVA FUNÇÃO PARA CADASTRAR OU ATUALIZAR CLIENTE ---
    async function createOrUpdateClient() {
        const clientId = fichaClienteIdInput.value; // Pega o ID do cliente, se já carregado
        const cleanedCpf = String(cpfClienteInput.value).replace(/\D/g, '');

        if (cleanedCpf.length !== 11) {
            return { success: false, message: 'CPF inválido ou incompleto.' };
        }

        const clientData = {
            _id: clientId || undefined, // Se tiver ID, é uma atualização
            nomeCompleto: nomeCompletoClienteInput.value.trim(),
            cpf: cleanedCpf,
            rg: rgClienteInput.value.trim(),
            dataNascimento: dataNascimentoClienteInput.value || undefined,
            email: emailClienteInput.value.trim(),
            telefonePrincipal: String(telefonePrincipalClienteInput.value).replace(/\D/g, ''),
            telefoneSecundario: String(telefoneSecundarioClienteInput.value).replace(/\D/g, ''),
            profissao: profissaoClienteInput.value.trim(),
            estadoCivil: estadoCivilClienteSelect.value,
            endereco: {
                rua: ruaResidencialInput.value.trim(),
                numero: numeroResidencialInput.value.trim(),
                complemento: complementoResidencialInput.value.trim(),
                bairro: bairroResidencialInput.value.trim(),
                localidade: cidadeResidencialInput.value.trim(), // 'localidade' é mais comum em APIs de CEP
                cidade: cidadeResidencialInput.value.trim(), // Mantém 'cidade' para compatibilidade com seu Schema FichaCadastral
                uf: estadoResidencialInput.value.trim(), // 'uf' é mais comum em APIs de CEP
                estado: estadoResidencialInput.value.trim(), // Mantém 'estado' para compatibilidade com seu Schema FichaCadastral
                cep: String(cepResidencialInput.value).replace(/\D/g, '')
            },
            companyId: companyId,
            cadastradoPor: userId
        };

        // Remove campos vazios ou nulos para evitar erros de validação no backend para campos opcionais
        for (const key in clientData) {
            if (clientData[key] === '' || clientData[key] === null || clientData[key] === undefined) {
                delete clientData[key];
            }
        }
        if (clientData.endereco) {
            for (const key in clientData.endereco) {
                if (clientData.endereco[key] === '' || clientData.endereco[key] === null || clientData.endereco[key] === undefined) {
                    delete clientData.endereco[key];
                }
            }
        }


        const url = clientId ? `/api/clients/${clientId}` : '/api/clients';
        const method = clientId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(clientData)
            });

            const data = await response.json();

            if (response.ok) {
                // Atualiza o fichaClienteIdInput com o ID do cliente (novo ou existente)
                fichaClienteIdInput.value = data.client._id;
                showMessage(fichaMessage1, data.message || `Cliente ${clientId ? 'atualizado' : 'cadastrado'} com sucesso!`, false);
                return { success: true, message: data.message, client: data.client };
            } else {
                console.error(`Erro ao ${clientId ? 'atualizar' : 'cadastrar'} cliente no backend:`, data.message);
                // Permite que o backend retorne uma mensagem de erro específica
                return { success: false, message: data.message || `Erro ao ${clientId ? 'atualizar' : 'cadastrar'} cliente.` };
            }
        } catch (error) {
            console.error('Erro na requisição para salvar/atualizar cliente:', error);
            return { success: false, message: 'Erro de conexão ao servidor ao salvar cliente.' };
        }
    }

    btnSalvarParte2.addEventListener('click', async () => {
        showFichaPart(3);
        clearMessage(fichaMessage2);
        fichaModalTitle.textContent = 'Ficha Cadastral (Parte 3 de 4)';
        carregarVeiculosDisponiveis();
    });

    if (btnSalvarVeiculo) {
        btnSalvarVeiculo.addEventListener('click', async () => {
            if (!selectedVehicleForFicha) {
                showMessage(fichaMessage3, 'Por favor, selecione um veículo.', true);
                return;
            }

            try {
                const vehicleIdToReserve = selectedVehicleForFicha._id;

                const reserveResponse = await fetch(`/api/vehicles/${vehicleIdToReserve}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status: 'RESERVADO',
                        fichaVendaId: fichaIdInput.value
                    })
                });

                const reserveData = await reserveResponse.json();

                if (!reserveResponse.ok) {
                    throw new Error(reserveData.message || 'Erro ao reservar o veículo.');
                }

                showMessage(fichaMessage3, 'Veículo reservado com sucesso!', false);

                setTimeout(() => {
                    showFichaPart(4);
                    clearMessage(fichaMessage3);
                }, 1000);

            } catch (error) {
                console.error('Erro na requisição de reserva de veículo:', error);
                showMessage(fichaMessage3, error.message || 'Erro ao conectar ao servidor para reservar veículo.', true);
            }
        });
    }


    btnSalvarApenas.addEventListener('click', async () => {
        await submitFicha('SALVO_PARA_VENDEDOR');
    });

    btnSalvarEEnviarAnalise.addEventListener('click', async () => {
        await submitFicha('AGUARDANDO_ANALISE_FN');
    });

    async function submitFicha(finalStatus) {
        const dadosFicha = {
            nomeCompletoCliente: nomeCompletoClienteInput.value.trim(),
            cpfCliente: String(cpfClienteInput.value).replace(/\D/g, ''),
            rgCliente: rgClienteInput.value.trim(),
            dataNascimentoCliente: dataNascimentoClienteInput.value || undefined,
            emailCliente: emailClienteInput.value.trim(),
            telefonePrincipalCliente: String(telefonePrincipalClienteInput.value).replace(/\D/g, ''),
            telefoneSecundarioCliente: String(telefoneSecundarioClienteInput.value).replace(/\D/g, ''),
            profissaoCliente: profissaoClienteInput.value.trim(),
            estadoCivilCliente: estadoCivilClienteSelect.value,
            enderecoCliente: {
                rua: ruaResidencialInput.value.trim(),
                numero: numeroResidencialInput.value.trim(),
                complemento: complementoResidencialInput.value.trim(),
                bairro: bairroResidencialInput.value.trim(),
                cidade: cidadeResidencialInput.value.trim(),
                estado: estadoResidencialInput.value.trim(),
                cep: String(cepResidencialInput.value).replace(/\D/g, '')
            },
            nomeEmpresaTrabalha: nomeEmpresaTrabalhaInput.value.trim(),
            tempoDeEmpresa: tempoDeEmpresaInput.value.trim(),
            cargoOcupado: cargoOcupadoInput.value.trim(),
            rendaBruta: parseCurrencyToNumber(rendaBrutaInput.value),
            tipoRenda: tipoRendaSelect.value,
            possuiCnh: possuiCnhSelect.value === 'true',
            enderecoProfissional: {
                ruaProfissional: ruaProfissionalInput.value.trim(),
                numeroProfissional: numeroProfissionalInput.value.trim(),
                complementoProfissional: complementoProfissionalInput.value.trim(),
                bairroProfissional: bairroProfissionalInput.value.trim(),
                cidadeProfissional: cidadeProfissionalInput.value.trim(),
                estadoProfissional: estadoProfissionalInput.value.trim(),
                cepProfissional: String(cepProfissionalInput.value).replace(/\D/g, ''),
                telefoneProfissional: String(telefoneProfissionalInput.value).replace(/\D/g, '')
            },
            veiculoInteresse: selectedVehicleForFicha ? {
                veiculoId: selectedVehicleForFicha._id,
                marcaModelo: selectedVehicleForFicha.modelo,
                ano: selectedVehicleForFicha.ano,
                precoSugerido: selectedVehicleForFicha.preco,
                placa: selectedVehicleForFicha.placa,
                chassi: selectedVehicleForFicha.chassi,
                renavam: selectedVehicleForFicha.renavam
            } : undefined,
            status: finalStatus,
            observacoes: '',
            companyId: companyId,
            cadastradoPor: userId,
            financeirasConsultadas: [],
            historicoDialogo: [],
        };

        const fichaId = fichaIdInput.value;
        const url = fichaId ? `/api/fichas/${fichaId}` : '/api/fichas';
        const method = fichaId ? 'PUT' : 'POST';
        const messageDiv = fichaMessage4;

        const payload = { ...dadosFicha };

        const dialogoMensagem = `Ficha ${fichaId ? 'atualizada' : 'cadastrada'} e status alterado para "${String(finalStatus).replace(/_/g, ' ')}" pelo vendedor (${userName}) em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`;

        payload.$push = {
            historicoDialogo: {
                remetente: userId,
                mensagem: dialogoMensagem,
                data: new Date()
            }
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(messageDiv, data.message || `Ficha ${fichaId ? 'atualizada' : 'cadastrada'} com sucesso!`, false);
                setTimeout(() => {
                    fichaCadastralModal.classList.add('hidden');
                    resetFichaForm();
                    carregarFichas(); // Recarrega as fichas com o filtro atual
                }, 1500);
            } else {
                console.error('Erro detalhado do backend:', data.message);
                showMessage(messageDiv, data.message || `Erro ao ${fichaId ? 'atualizar' : 'cadastrar'} ficha.`, true);
            }
        } catch (error) {
            console.error('Erro na requisição da ficha:', error);
            showMessage(messageDiv, `Erro ao conectar ao servidor para ${fichaId ? 'atualizar' : 'cadastrar'} ficha.`, true);
        }
    }


    let availableVehiclesList = [];
    filtroVeiculoInteresseInput.addEventListener('input', () => {
        renderVeiculosDisponiveis(filtroVeiculoInteresseInput.value);
    });

    async function carregarVeiculosDisponiveis() {
        try {
            const response = await fetch(`/api/vehicles?companyId=${companyId}&status=DISPONÍVEL`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar veículos disponíveis.');
            availableVehiclesList = await response.json();
            renderVeiculosDisponiveis();
        } catch (error) {
            console.error('Erro ao buscar veículos disponíveis:', error);
            listaVeiculosDisponiveisDiv.innerHTML = `<p class="text-red-500 text-center">Erro ao carregar veículos.</p>`;
        }
    }

    function renderVeiculosDisponiveis(filterText = '') {
        listaVeiculosDisponiveisDiv.innerHTML = '';
        const lowerCaseFilter = String(filterText).toLowerCase();

        const filteredVehicles = availableVehiclesList.filter(v =>
            (v.placa && String(v.placa).toLowerCase().includes(lowerCaseFilter)) ||
            (v.modelo && String(v.modelo).toLowerCase().includes(lowerCaseFilter))
        );

        if (filteredVehicles.length === 0) {
            listaVeiculosDisponiveisDiv.innerHTML = `<p class="text-gray-500 text-center">Nenhum veículo disponível com este filtro.</p>`;
            return;
        }

        filteredVehicles.forEach(vehicle => {
            const div = document.createElement('div');
            div.classList.add('p-2', 'border', 'rounded', 'cursor-pointer', 'hover:bg-blue-100', 'flex', 'justify-between', 'items-center');
            div.dataset.id = vehicle._id;
            div.innerHTML = `
                <span>${vehicle.placa || 'N/A'} - ${vehicle.modelo || 'N/A'} (${vehicle.ano || 'N/A'})</span>
                <span class="font-semibold">${formatNumberToCurrency(vehicle.preco)}</span>
            `;
            div.addEventListener('click', () => selectVehicleForFicha(vehicle));
            listaVeiculosDisponiveisDiv.appendChild(div);
        });
    }

    function selectVehicleForFicha(vehicle) {
        selectedVehicleForFicha = vehicle;
        displayPlacaVeiculoSpan.textContent = vehicle.placa || '';
        displayModeloVeiculoSpan.textContent = vehicle.modelo || '';
        displayAnoVeiculoSpan.textContent = vehicle.ano || '';
        displayCorVeiculoSpan.textContent = vehicle.cor || '';
        displayPrecoVeiculoSpan.textContent = formatNumberToCurrency(vehicle.preco);

        veiculoIdSelecionadoInput.value = vehicle._id || '';
        veiculoPlacaSelecionadoInput.value = vehicle.placa || '';
        veiculoChassiSelecionadoInput.value = vehicle.chassi || '';
        veiculoRenavamSelecionadoInput.value = vehicle.renavam || '';

        detalhesVeiculoSelecionadoDiv.classList.remove('hidden');
        showMessage(fichaMessage3, `Veículo ${vehicle.placa} selecionado!`, false);
    }

    function montarLinhaFicha(ficha) {
        const tr = document.createElement('tr');
        const clienteNome = ficha.clienteId ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente;
        const clienteCpf = ficha.clienteId ? ficha.clienteId.cpf : ficha.cpfCliente;
        const clienteTel = ficha.clienteId ? ficha.clienteId.telefonePrincipal : ficha.telefonePrincipalCliente;

        const veiculoInfo = ficha.veiculoInteresse && ficha.veiculoInteresse.marcaModelo ?
                            `${ficha.veiculoInteresse.marcaModelo} (${ficha.veiculoInteresse.placa || 'N/A'})` : 'N/A';

        let statusClass = 'text-gray-700';
        let statusText = ficha.status ? String(ficha.status).replace(/_/g, ' ') : 'N/A';
        if (ficha.status === 'AGUARDANDO_ANALISE_FN') statusClass = 'text-yellow-600 font-semibold';
        else if (ficha.status === 'EM_ANALISE_FN') statusClass = 'text-blue-500 font-semibold';
        else if (ficha.status === 'APROVADA_FN') statusClass = 'text-green-600 font-semibold';
        else if (ficha.status === 'REPROVADA_FN' || ficha.status === 'CANCELADA') statusClass = 'text-red-600 font-semibold';
        else if (ficha.status === 'FINALIZADA') statusClass = 'text-purple-600 font-semibold';
        else if (ficha.status === 'DEVOLVIDA_AO_VENDEDOR') statusClass = 'text-orange-600 font-semibold';
        else if (ficha.status === 'CONFERIDA' || ficha.status === 'AGUARDANDO_CONFERENCIA') statusClass = 'text-teal-600 font-semibold';
        else if (ficha.status === 'EM_CONFERENCIA' || ficha.status === 'EM_DOCUMENTACAO') statusClass = 'text-indigo-600 font-semibold';
        else if (ficha.status === 'SALVO_PARA_VENDEDOR') statusClass = 'text-gray-500 font-semibold';


        tr.innerHTML = `
            <td class="px-2 py-1">${new Date(ficha.createdAt).toLocaleDateString('pt-BR')}</td>
            <td class="px-2 py-1">${clienteNome || ''}</td>
            <td class="px-2 py-1">${applyCpfMask(clienteCpf || '')}</td>
            <td class="px-2 py-1">${applyPhoneMask(clienteTel || '')}</td>
            <td class="px-2 py-1">${veiculoInfo}</td>
            <td class="px-2 py-1 ${statusClass}">${statusText}</td>
            <td class="px-2 py-1 text-center space-x-2">
                <button class="btn-editar-ficha" title="Editar Ficha" data-id="${ficha._id}" ${ficha.podeSerEditadaPeloVendedor ? '' : 'disabled'} style="background:none; border:none; cursor:pointer; ${ficha.podeSerEditadaPeloVendedor ? '' : 'opacity: 0.5; cursor: not-allowed;'}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                ${(userRole === 'vendedor' && ficha.status === 'SALVO_PARA_VENDEDOR') ? `
                <button class="btn-enviar-analise-lista" title="Enviar para Análise F&N" data-id="${ficha._id}" style="background:none; border:none; cursor:pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
                ` : ''}
                ${((userRole === 'vendedor' || userRole === 'gerente') && ficha.status === 'APROVADA_FN') ? `
                <button class="btn-ver-aprovacao-vendedor" title="Ver Detalhes da Aprovação" data-id="${ficha._id}" style="background:none; border:none; cursor:pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-8.83"/><path d="m10.5 12.5 2.5 2.5L22 7"/></svg>
                </button>
                ` : ''}
                ${((userRole === 'vendedor' || userRole === 'gerente')) ? `
                <button class="btn-formalizar-venda" title="Formalizar Venda" data-id="${ficha._id}" style="background:none; border:none; cursor:pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-check"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 11 2 2 4-4"/></svg>
                </button>
                ` : ''}
                <button class="btn-andamento-analise" title="Andamento da Análise (Diálogo)" data-id="${ficha._id}" style="background:none; border:none; cursor:pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
                <button class="btn-excluir-ficha" title="Excluir Ficha" data-id="${ficha._id}" ${userRole === 'gerente' ? '' : 'disabled'} style="background:none; border:none; cursor:pointer; ${userRole === 'gerente' ? '' : 'opacity: 0.5; cursor: not-allowed;'}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14H7L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M4 6l1-3h14l1 3"></path></svg>
                </button>
            </td>
        `;
        return tr;
    }

    // --- Lógica para popular os anos no filtro ---
    function populateYears() {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // Obtém o mês atual (1-12)

        // Popula anos
        for (let i = currentYear + 2; i >= currentYear - 5; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            filtroAnoSelect.appendChild(option);
        }
        filtroAnoSelect.value = currentYear;

        // NOVO: Define o mês atual como selecionado por padrão
        filtroMesSelect.value = currentMonth; // Define o mês atual
    }
    populateYears(); // Chamada inicial
    // --- Função principal para carregar fichas com filtros ---
    async function carregarFichas() {
        try {
            const selectedMonth = filtroMesSelect.value;
            const selectedYear = filtroAnoSelect.value;
            const filterText = filtroFichasInput.value;

            let fetchUrl = `/api/fichas?companyId=${companyId}`;

            // Adiciona parâmetros de filtro de mês e ano à URL
            if (selectedMonth) {
                fetchUrl += `&month=${selectedMonth}`;
            }
            if (selectedYear) {
                fetchUrl += `&year=${selectedYear}`;
            }
            // Adiciona filtro de texto (já existente)
            if (filterText) {
                fetchUrl += `&search=${encodeURIComponent(filterText)}`; // Assumindo que o backend pode receber um parâmetro 'search'
            }

            const response = await fetch(fetchUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                alert('Sessão expirada ou não autorizado. Faça login novamente.');
                localStorage.clear();
                window.location.href = '/';
                return;
            }
            if (!response.ok) throw new Error('Erro ao carregar fichas.');

            const fichas = await response.json();
            fichasTableBody.innerHTML = '';

            // O filtro de texto agora é feito no backend se 'search' for implementado lá
            // Se o backend NÃO filtrar por 'search', você precisaria reintroduzir a lógica de filtro aqui
            fichas.forEach(ficha => {
                fichasTableBody.appendChild(montarLinhaFicha(ficha));
            });

            // Re-atribui os event listeners após recarregar a tabela
            document.querySelectorAll('.btn-editar-ficha').forEach(btn => {
                btn.addEventListener('click', () => editarFicha(btn.dataset.id));
            });
            document.querySelectorAll('.btn-excluir-ficha').forEach(btn => {
                btn.addEventListener('click', () => excluirFicha(btn.dataset.id));
            });
            document.querySelectorAll('.btn-enviar-analise-lista').forEach(btn => {
                btn.addEventListener('click', () => enviarFichaParaAnaliseDaLista(btn.dataset.id));
            });
            document.querySelectorAll('.btn-ver-aprovacao-vendedor').forEach(btn => {
                btn.addEventListener('click', () => openAprovacaoModal(btn.dataset.id));
            });
            document.querySelectorAll('.btn-formalizar-venda').forEach(btn => {
                btn.addEventListener('click', () => openFormalizarVendaModal(btn.dataset.id));
            });
            document.querySelectorAll('.btn-andamento-analise').forEach(btn => {
                btn.addEventListener('click', () => openAndamentoAnaliseModal(btn.dataset.id));
            });

        } catch (error) {
            console.error('Erro ao carregar fichas:', error);
            alert('Não foi possível carregar as fichas.');
        }
    }

    // --- Adiciona listeners para os novos filtros ---
    filtroMesSelect.addEventListener('change', carregarFichas);
    filtroAnoSelect.addEventListener('change', carregarFichas);
    filtroFichasInput.addEventListener('input', carregarFichas); // Mantém o filtro de texto

    carregarFichas(); // Chama a função para carregar fichas com os filtros iniciais ao carregar a página

    async function editarFicha(id) {
        fichaModalTitle.textContent = 'Editar Ficha Cadastral';
        clearAllFichaMessages();
        resetFichaForm();

        try {
            const response = await fetch(`/api/fichas/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('Sessão expirada ou não autorizado. Faça login novamente.');
                    localStorage.clear();
                    window.location.href = '/';
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao buscar dados da ficha para edição.');
            }
            const ficha = await response.json();
            console.log('Ficha carregada para edição:', ficha);

            fichaIdInput.value = ficha._id || '';
            fichaClienteIdInput.value = ficha.clienteId ? ficha.clienteId._id : '';
            fichaCompanyIdInput.value = ficha.companyId || companyId;
            fichaCadastradoPorIdInput.value = ficha.cadastradoPor ? ficha.cadastradoPor._id : userId;
            fichaPodeSerEditadaPeloVendedorInput.value = ficha.podeSerEditadaPeloVendedor ? 'true' : 'false';

            nomeCompletoClienteInput.value = ficha.nomeCompletoCliente || '';
            cpfClienteInput.value = applyCpfMask(ficha.cpfCliente || '');
            rgClienteInput.value = ficha.rgCliente || '';
            dataNascimentoClienteInput.value = ficha.dataNascimentoCliente ? new Date(ficha.dataNascimentoCliente).toISOString().split('T')[0] : '';
            emailClienteInput.value = ficha.emailCliente || '';
            telefonePrincipalClienteInput.value = applyPhoneMask(ficha.telefonePrincipalCliente || '');
            telefoneSecundarioClienteInput.value = applyPhoneMask(ficha.telefoneSecundarioCliente || '');
            profissaoClienteInput.value = ficha.profissaoCliente || '';
            estadoCivilClienteSelect.value = ficha.estadoCivilCliente || '';

            if (ficha.enderecoCliente) {
                cepResidencialInput.value = applyCepMask(ficha.enderecoCliente.cep || '');
                ruaResidencialInput.value = ficha.enderecoCliente.rua || '';
                numeroResidencialInput.value = ficha.enderecoCliente.numero || '';
                complementoResidencialInput.value = ficha.enderecoCliente.complemento || '';
                bairroResidencialInput.value = ficha.enderecoCliente.bairro || '';
                cidadeResidencialInput.value = ficha.enderecoCliente.localidade || ficha.enderecoCliente.cidade || '';
                estadoResidencialInput.value = ficha.enderecoCliente.uf || ficha.enderecoCliente.estado || '';
            } else {
                limparEnderecoResidencialInputs();
            }
            if (ficha.enderecoCliente && ficha.enderecoCliente.cep && ficha.enderecoCliente.rua) {
                if (ruaResidencialInput) ruaResidencialInput.setAttribute('readonly', true);
                if (bairroResidencialInput) bairroResidencialInput.setAttribute('readonly', true);
                if (cidadeResidencialInput) cidadeResidencialInput.setAttribute('readonly', true);
                if (estadoResidencialInput) estadoResidencialInput.setAttribute('readonly', true);
            } else {
                if (ruaResidencialInput) ruaResidencialInput.removeAttribute('readonly');
                if (bairroResidencialInput) bairroResidencialInput.removeAttribute('readonly');
                if (cidadeResidencialInput) cidadeResidencialInput.removeAttribute('readonly');
                if (estadoResidencialInput) estadoResidencialInput.removeAttribute('readonly');
            }


            nomeEmpresaTrabalhaInput.value = ficha.nomeEmpresaTrabalha || '';
            tempoDeEmpresaInput.value = ficha.tempoDeEmpresa || '';
            cargoOcupadoInput.value = ficha.cargoOcupado || '';
            rendaBrutaInput.value = formatNumberToCurrency(ficha.rendaBruta);
            tipoRendaSelect.value = ficha.tipoRenda || '';
            possuiCnhSelect.value = ficha.possuiCnh ? 'true' : 'false';

            nomeConjugueInput.value = ficha.nomeConjugue || '';
            cpfConjugueInput.value = applyCpfMask(ficha.cpfConjugue || '');
            dataNascimentoConjugueInput.value = ficha.dataNascimentoConjugue ? new Date(ficha.dataNascimentoConjugue).toISOString().split('T')[0] : '';
            profissaoConjugueInput.value = ficha.profissaoConjugue || '';

            if (ficha.enderecoProfissional) {
                cepProfissionalInput.value = applyCepMask(ficha.enderecoProfissional.cepProfissional || '');
                ruaProfissionalInput.value = ficha.enderecoProfissional.ruaProfissional || '';
                numeroProfissionalInput.value = ficha.enderecoProfissional.numeroProfissional || '';
                complementoProfissionalInput.value = ficha.enderecoProfissional.complementoProfissional || '';
                bairroProfissionalInput.value = ficha.enderecoProfissional.bairroProfissional || '';
                cidadeProfissionalInput.value = ficha.enderecoProfissional.cidadeProfissional || '';
                estadoProfissionalInput.value = ficha.enderecoProfissional.estadoProfissional || '';
                telefoneProfissionalInput.value = applyPhoneMask(ficha.enderecoProfissional.telefoneProfissional || '');
            } else {
                limparEnderecoProfissionalInputs();
            }
            if (ficha.enderecoProfissional && ficha.enderecoProfissional.cepProfissional && ficha.enderecoProfissional.ruaProfissional) {
                if (ruaProfissionalInput) ruaProfissionalInput.setAttribute('readonly', true);
                if (bairroProfissionalInput) bairroProfissionalInput.setAttribute('readonly', true);
                if (cidadeProfissionalInput) cidadeProfissionalInput.setAttribute('readonly', true);
                if (estadoProfissionalInput) estadoProfissionalInput.setAttribute('readonly', true);
            } else {
                if (ruaProfissionalInput) ruaProfissionalInput.removeAttribute('readonly');
                if (bairroProfissionalInput) bairroProfissionalInput.removeAttribute('readonly');
                if (cidadeProfissionalInput) cidadeProfissionalInput.removeAttribute('readonly');
                if (estadoProfissionalInput) estadoProfissionalInput.removeAttribute('readonly');
            }


            if (ficha.veiculoInteresse && ficha.veiculoInteresse.veiculoId) {
                selectedVehicleForFicha = {
                    _id: ficha.veiculoInteresse.veiculoId._id || ficha.veiculoInteresse.veiculoId,
                    modelo: ficha.veiculoInteresse.marcaModelo,
                    ano: ficha.veiculoInteresse.ano,
                    preco: ficha.veiculoInteresse.precoSugerido,
                    placa: ficha.veiculoInteresse.placa,
                    chassi: ficha.veiculoInteresse.chassi,
                    renavam: ficha.veiculoInteresse.renavam,
                    cor: ficha.veiculoInteresse.veiculoId.cor || '',
                    quilometragem: ficha.veiculoInteresse.veiculoId.quilometragem || 0
                };
                displayPlacaVeiculoSpan.textContent = selectedVehicleForFicha.placa || '';
                displayModeloVeiculoSpan.textContent = selectedVehicleForFicha.modelo || '';
                displayAnoVeiculoSpan.textContent = selectedVehicleForFicha.ano || '';
                displayCorVeiculoSpan.textContent = selectedVehicleForFicha.cor || '';
                displayPrecoVeiculoSpan.textContent = formatNumberToCurrency(selectedVehicleForFicha.preco);

                veiculoIdSelecionadoInput.value = selectedVehicleForFicha._id || '';
                veiculoPlacaSelecionadoInput.value = selectedVehicleForFicha.placa || '';
                veiculoChassiSelecionadoInput.value = selectedVehicleForFicha.chassi || '';
                veiculoRenavamSelecionadoInput.value = selectedVehicleForFicha.renavam || '';

            } else {
                selectedVehicleForFicha = null;
                detalhesVeiculoSelecionadoDiv.classList.add('hidden');
                filtroVeiculoInteresseInput.value = '';
            }

            const isEditable = ficha.podeSerEditadaPeloVendedor;
            const formElements = fichaForm.querySelectorAll('input, select, button:not(#closeFichaModalBtn):not(.modal-close-btn):not([type="button"])');
            formElements.forEach(el => {
                if (!['closeFichaModalBtn', 'cancelFichaModalBtn1', 'cancelFichaModalBtn2', 'cancelFichaModalBtn3', 'cancelFichaModalBtn4', 'btnVoltarParte2', 'btnVoltarParte3', 'btnVoltarParte4'].includes(el.id)) {
                    el.disabled = !isEditable;
                    if (!isEditable) el.classList.add('bg-gray-100'); else el.classList.remove('bg-gray-100');
                }
            });
            btnSalvarParte1.disabled = !isEditable;
            btnSalvarParte2.disabled = !isEditable;
            btnSalvarVeiculo.disabled = !isEditable;

            btnSalvarApenas.style.display = isEditable ? 'block' : 'none';
            btnSalvarEEnviarAnalise.style.display = isEditable ? 'block' : 'none';

            fichaCadastralModal.classList.remove('hidden');
            showFichaPart(1);
            fichaModalTitle.textContent = 'Editar Ficha Cadastral';

            setupCurrencyListeners(fichaPart2);

        } catch (error) {
            console.error('Erro ao editar ficha:', error);
            alert('Não foi possível carregar os dados da ficha para edição: ' + error.message);
        }
    }

    function limparEnderecoResidencialInputs() {
        cepResidencialInput.value = '';
        ruaResidencialInput.value = '';
        numeroResidencialInput.value = '';
        complementoResidencialInput.value = '';
        bairroResidencialInput.value = '';
        cidadeResidencialInput.value = '';
        estadoResidencialInput.value = '';

        if (ruaResidencialInput) ruaResidencialInput.removeAttribute('readonly');
        if (bairroResidencialInput) bairroResidencialInput.removeAttribute('readonly');
        if (cidadeResidencialInput) cidadeResidencialInput.removeAttribute('readonly');
        if (estadoResidencialInput) estadoResidencialInput.removeAttribute('readonly');
    }

    function limparEnderecoProfissionalInputs() {
        cepProfissionalInput.value = '';
        ruaProfissionalInput.value = '';
        numeroProfissionalInput.value = '';
        complementoProfissionalInput.value = '';
        bairroProfissionalInput.value = '';
        cidadeProfissionalInput.value = '';
        estadoProfissionalInput.value = '';
        telefoneProfissionalInput.value = '';

        if (ruaProfissionalInput) ruaProfissionalInput.removeAttribute('readonly');
        if (bairroProfissionalInput) bairroProfissionalInput.removeAttribute('readonly');
        if (cidadeProfissionalInput) cidadeProfissionalInput.removeAttribute('readonly');
        if (estadoProfissionalInput) estadoProfissionalInput.removeAttribute('readonly');
    }

    async function excluirFicha(id) {
        if (!confirm('Tem certeza que deseja excluir esta ficha? Esta ação é irreversível!')) {
            return;
        }
        try {
            const response = await fetch(`/api/fichas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message || 'Ficha excluída com sucesso!');
                carregarFichas();
            } else {
                console.error('Erro detalhado do backend na exclusão:', data.message);
                alert(data.message || 'Erro ao excluir ficha.');
            }
        } catch (error) {
            console.error('Erro na requisição de exclusão:', error);
            alert('Erro ao conectar ao servidor para excluir ficha.');
        }
    }

    async function enviarFichaParaAnaliseDaLista(fichaId) {
        if (!confirm('Tem certeza que deseja enviar esta ficha para Análise F&N? Após o envio, você não poderá mais editá-la até que seja devolvida.')) {
            return;
        }
        const messageDiv = document.getElementById('mainMessageArea');

        try {
            const updateData = {
                status: 'AGUARDANDO_ANALISE_FN',
                $push: {
                    historicoDialogo: {
                        remetente: userId,
                        mensagem: `Ficha enviada para análise F&N pelo vendedor (${userName}) em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`,
                        data: new Date()
                    }
                }
            };

            const response = await fetch(`/api/fichas/${fichaId}`,{
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });
            const data = await response.json();

            if (response.ok) {
                showMessage(messageDiv, data.message || 'Ficha enviada para análise com sucesso!', false);
                carregarFichas();
            } else {
                console.error('Erro detalhado do backend ao enviar para análise da lista:', data.message);
                showMessage(messageDiv, data.message || 'Erro ao enviar ficha para análise.', true);
            }
        } catch (error) {
            console.error('Erro na requisição de envio para análise da lista:', error);
            showMessage(messageDiv, 'Erro ao conectar ao servidor para enviar ficha para análise.', true);
        }
    }

    async function openAprovacaoModal(fichaId) {
        try {
            const response = await fetch(`/api/fichas/${fichaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao buscar dados da ficha para visualização.');
            }
            const ficha = await response.json();
            console.log('Ficha para visualização de aprovação carregada:', ficha);

            let veiculoDisplayInfo = 'Veículo não informado';
            if (ficha.veiculoInteresse) {
                const veiculoPopulado = ficha.veiculoInteresse.veiculoId;

                if (veiculoPopulado && typeof veiculoPopulado === 'object') {
                    veiculoDisplayInfo = `${veiculoPopulado.modelo || 'N/A'} (${veiculoPopulado.placa || 'N/A'}) - ${veiculoPopulado.ano || 'N/A'}`;
                }
                else if (ficha.veiculoInteresse.marcaModelo) {
                    veiculoDisplayInfo = `${ficha.veiculoInteresse.marcaModelo || 'N/A'} (${ficha.veiculoInteresse.placa || 'N/A'}) - ${ficha.veiculoInteresse.ano || 'N/A'}`;
                }
            }
            aprovacaoVendedorVeiculoInfo.textContent = veiculoDisplayInfo;

            aprovacaoVendedorClienteNome.textContent = ficha.clienteId ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente;
            aprovacaoVendedorClienteCpf.textContent = applyCpfMask(ficha.clienteId ? ficha.clienteId.cpf : ficha.cpfCliente);

            aprovacaoVendedorAnalisesContent.innerHTML = '';
            if (ficha.financeirasConsultadas && ficha.financeirasConsultadas.length > 0) {
                noAnalisesMessage.classList.add('hidden');
                const sortedAnalises = ficha.financeirasConsultadas.sort((a, b) => new Date(b.dataAnalise) - new Date(a.dataAnalise));

                sortedAnalises.forEach(fc => {
                    const div = document.createElement('div');
                    let borderColorClass = 'border-gray-200';
                    let statusColorClass = 'text-blue-600';
                    let approvalDetails = '';

                    if (fc.statusAnalise === 'Aprovada') {
                        borderColorClass = 'border-green-500';
                        statusColorClass = 'text-green-600 font-bold';
                        div.classList.add('shadow-md', 'border-2');
                        approvalDetails = `
                            <div class="grid grid-cols-2 gap-x-4">
                                <p><span class="font-medium">Valor Aprovado:</span> <span class="font-bold text-green-700">${formatNumberToCurrency(fc.valorAprovado)}</span></p>
                                <p><span class="font-medium">Qtd. Parcelas:</span> <span class="font-bold">${fc.quantidadeParcelas}</span></p>
                                <p><span class="font-medium">Valor Parcela:</span> <span class="font-bold text-green-700">${formatNumberToCurrency(fc.valorParcela)}</span></p>
                                <p><span class="font-medium">Vencimento:</span> ${fc.dataVencimentoParcela || 'N/A'}</p>
                            </div>
                        `;
                    } else if (fc.statusAnalise === 'Recusada') {
                        borderColorClass = 'border-red-500';
                        statusColorClass = 'text-red-600';
                        approvalDetails = `<p class="mt-2"><span class="font-medium text-red-700">Motivo da Recusa:</span> ${fc.motivoRecusa || 'N/A'}</p>`;
                    }

                    div.classList.add('mb-3', 'p-3', 'bg-white', 'rounded-lg', 'shadow-sm', 'border', borderColorClass);
                    div.innerHTML = `
                        <p class="font-bold text-lg text-gray-900 mb-1">${fc.nomeFinanceira || 'Financeira Desconhecida'}</p>
                        <p class="mb-2"><span class="font-medium">Status da Análise:</span> <span class="${statusColorClass}">${fc.statusAnalise || 'N/A'}</span></p>
                        ${approvalDetails}
                        <p class="text-xs text-gray-500 mt-1">Analisado por: ${fc.analisadoPor ? fc.analisadoPor.nome : 'N/A'} em ${formatDateWithTime(fc.dataAnalise)}</p>
                    `;
                    aprovacaoVendedorAnalisesContent.appendChild(div);
                });
            } else {
                noAnalisesMessage.classList.remove('hidden');
            }

            aprovacaoVendedorDialogoContent.innerHTML = '';
            if (ficha.historicoDialogo && ficha.historicoDialogo.length > 0) {
                noDialogoMessage.classList.add('hidden');
                const sortedDialogos = ficha.historicoDialogo.sort((a, b) => new Date(a.data) - new Date(b.data));

                sortedDialogos.forEach(hd => {
                    const p = document.createElement('p');
                    p.classList.add('text-sm', 'mb-1', 'px-2', 'py-1', 'rounded');
                    const remetenteNome = hd.remetente ? hd.remetente.nome : 'Sistema';

                    let bgColorClass = 'bg-gray-100 text-gray-800';
                    if (hd.remetente && hd.remetente.role === 'vendedor') {
                        bgColorClass = 'bg-blue-100 text-blue-800 text-right';
                    } else if (hd.remetente && ['fn', 'gerente'].includes(hd.remetente.role)) {
                        bgColorClass = 'bg-green-100 text-green-800 text-left';
                    }

                    p.innerHTML = `<span class="font-semibold">${remetenteNome}:</span> ${hd.mensagem} <span class="text-xs text-gray-600 float-right">${formatDateWithTime(hd.data)}</span>`;
                    p.classList.add(...bgColorClass.split(' '));
                    aprovacaoVendedorDialogoContent.appendChild(p);
                });
                setTimeout(() => {
                    aprovacaoVendedorDialogoContent.scrollTop = aprovacaoVendedorDialogoContent.scrollHeight;
                }, 50);
            } else {
                noDialogoMessage.classList.remove('hidden');
            }

            aprovacaoVendedorModal.classList.remove('hidden');

        } catch (error) {
            console.error('Erro ao abrir modal de aprovação do vendedor:', error);
            alert('Não foi possível carregar os detalhes da aprovação: ' + error.message);
        }
    }

    closeAprovacaoVendedorModalBtn.addEventListener('click', () => {
        aprovacaoVendedorModal.classList.add('hidden');
    });
    closeAprovacaoVendedorModalBtnBottom.addEventListener('click', () => {
        aprovacaoVendedorModal.classList.add('hidden');
    });

    async function openAndamentoAnaliseModal(fichaId) {
        console.log('Token JWT no frontend antes da requisição:', token);
        if (!token) {
            console.error('Erro: Token JWT não encontrado no localStorage.');
            alert('Você não está autenticado. Por favor, faça login novamente.');
            localStorage.clear();
            window.location.href = '/';
            return;
        }

        try {
            const response = await fetch(`/api/fichas/${fichaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText || 'Erro desconhecido.' }));
                console.error('Resposta de erro da API para ficha ID:', fichaId, 'Status:', response.status, 'Erro:', errorData);
                throw new Error(errorData.message || `Erro ao buscar dados da ficha para visualização do andamento. Status: ${response.status}`);
            }
            const ficha = await response.json();
            console.log('Ficha para visualização de andamento carregada:', ficha);

            andamentoAnaliseModalTitle.textContent = 'Andamento da Análise (Diálogo)';

            let veiculoDisplayInfo = 'Veículo não informado';
            if (ficha.veiculoInteresse) {
                const veiculoPopulado = ficha.veiculoInteresse.veiculoId;

                if (veiculoPopulado && typeof veiculoPopulado === 'object') {
                    const modelo = veiculoPopulado.modelo || 'N/A';
                    const placa = veiculoPopulado.placa || 'N/A';
                    const ano = veiculoPopulado.ano || 'N/A';
                    veiculoDisplayInfo = `${modelo} (${placa}) - ${ano}`;
                }
                else if (ficha.veiculoInteresse.marcaModelo) {
                    const modelo = ficha.veiculoInteresse.marcaModelo || 'N/A';
                    const placa = ficha.veiculoInteresse.placa || 'N/A';
                    const ano = ficha.veiculoInteresse.ano || 'N/A';
                    veiculoDisplayInfo = `${modelo} (${placa}) - ${ano}`;
                }
            }
            aprovacaoVendedorVeiculoInfo.textContent = veiculoDisplayInfo;

            aprovacaoVendedorClienteNome.textContent = ficha.clienteId ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente;
            aprovacaoVendedorClienteCpf.textContent = applyCpfMask(ficha.clienteId ? ficha.clienteId.cpf : ficha.cpfCliente);

            aprovacaoVendedorAnalisesContent.innerHTML = '';
            if (ficha.financeirasConsultadas && ficha.financeirasConsultadas.length > 0) {
                noAnalisesMessage.classList.add('hidden');
                const sortedAnalises = ficha.financeirasConsultadas.sort((a, b) => new Date(b.dataAnalise) - new Date(a.dataAnalise));

                sortedAnalises.forEach(fc => {
                    const div = document.createElement('div');
                    let borderColorClass = 'border-gray-200';
                    let statusColorClass = 'text-blue-600';

                    if (fc.statusAnalise === 'Aprovada') {
                        borderColorClass = 'border-green-500';
                        statusColorClass = 'text-green-600 font-bold';
                        div.classList.add('shadow-md', 'border-2');
                    } else if (fc.statusAnalise === 'Recusada') {
                        borderColorClass = 'border-red-500';
                        statusColorClass = 'text-red-600';
                    }

                    div.classList.add('mb-3', 'p-3', 'bg-white', 'rounded-lg', 'shadow-sm', 'border', borderColorClass);
                    div.innerHTML = `
                        <p class="font-bold text-lg text-gray-900 mb-1">${fc.nomeFinanceira || 'Financeira Desconhecida'}</p>
                        <p class="mb-2"><span class="font-medium">Status da Análise:</span> <span class="${statusColorClass}">${fc.statusAnalise || 'N/A'}</span></p>
                        ${fc.valorAprovado ? `
                        <div class="grid grid-cols-2 gap-x-4">
                            <p><span class="font-medium">Valor Aprovado:</span> <span class="font-bold text-green-700">${formatNumberToCurrency(fc.valorAprovado)}</span></p>
                            <p><span class="font-medium">Qtd. Parcelas:</span> <span class="font-bold">${fc.quantidadeParcelas}</span></p>
                            <p><span class="font-medium">Valor Parcela:</span> <span class="font-bold text-green-700">${formatNumberToCurrency(fc.valorParcela)}</span></p>
                            <p><span class="font-medium">Vencimento:</span> ${fc.dataVencimentoParcela || 'N/A'}</p>
                            <p><span class="font-medium">Retorno:</span> ${fc.retornoFinanceira || 'N/A'}</p>
                        </div>` : ''}
                        ${fc.motivoRecusa ? `<p class="mt-2"><span class="font-medium text-red-700">Motivo da Recusa:</span> ${fc.motivoRecusa}</p>` : ''}
                        <p class="text-xs text-gray-500 mt-1">Analisado por: ${fc.analisadoPor ? fc.analisadoPor.nome : 'N/A'} em ${formatDateWithTime(fc.dataAnalise)}</p>
                    `;
                    aprovacaoVendedorAnalisesContent.appendChild(div);
                });
            } else {
                noAnalisesMessage.classList.remove('hidden');
            }

            aprovacaoVendedorDialogoContent.innerHTML = '';
            if (ficha.historicoDialogo && ficha.historicoDialogo.length > 0) {
                noDialogoMessage.classList.add('hidden');
                const sortedDialogos = ficha.historicoDialogo.sort((a, b) => new Date(a.data) - new Date(b.data));

                sortedDialogos.forEach(hd => {
                    const p = document.createElement('p');
                    p.classList.add('text-sm', 'mb-1', 'px-2', 'py-1', 'rounded');
                    const remetenteNome = hd.remetente ? hd.remetente.nome : 'Sistema';

                    let bgColorClass = 'bg-gray-100 text-gray-800';
                    if (hd.remetente && hd.remetente.role === 'vendedor') {
                        bgColorClass = 'bg-blue-100 text-blue-800 text-right';
                    } else if (hd.remetente && ['fn', 'gerente'].includes(hd.remetente.role)) {
                        bgColorClass = 'bg-green-100 text-green-800 text-left';
                    }

                    p.innerHTML = `<span class="font-semibold">${remetenteNome}:</span> ${hd.mensagem} <span class="text-xs text-gray-600 float-right">${formatDateWithTime(hd.data)}</span>`;
                    p.classList.add(...bgColorClass.split(' '));
                    aprovacaoVendedorDialogoContent.appendChild(p);
                });
                setTimeout(() => {
                    aprovacaoVendedorDialogoContent.scrollTop = aprovacaoVendedorDialogoContent.scrollHeight;
                }, 50);
            } else {
                noDialogoMessage.classList.remove('hidden');
            }

            aprovacaoVendedorModal.classList.remove('hidden');

        } catch (error) {
            console.error('Erro ao abrir modal de andamento da análise:', error);
            if (error.message.includes('Status: 401') || error.message.includes('Status: 403')) {
                alert('Sessão expirada ou não autorizado. Faça login novamente.');
                localStorage.clear();
                window.location.href = '/';
            } else {
                alert('Não foi possível carregar os detalhes do andamento da análise: ' + error.message);
            }
        }
    }


    async function openFormalizarVendaModal(fichaId) {
        try {
            const response = await fetch(`/api/fichas/${fichaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao buscar dados da ficha para formalização.');
            }
            const ficha = await response.json();
            currentFichaData = ficha;

            console.log("Ficha carregada para formalização de venda:", ficha);

            formalizarVendaClienteNome.textContent = ficha.clienteId ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente;
            formalizarVendaFichaId.value = ficha._id;
            formalizarVendaVeiculoId.value = ficha.veiculoInteresse ? ficha.veiculoInteresse.veiculoId._id : '';

            if (ficha.veiculoInteresse && ficha.veiculoInteresse.veiculoId) {
                formalizarVendaDisplayModelo.textContent = ficha.veiculoInteresse.marcaModelo || 'N/A';
                formalizarVendaDisplayPlaca.textContent = ficha.veiculoInteresse.placa || 'N/A';
                formalizarVendaDisplayAno.textContent = ficha.veiculoInteresse.ano || 'N/A';
                formalizarVendaDisplayChassi.textContent = ficha.veiculoInteresse.chassi || 'N/A';
                formalizarVendaDisplayRenavam.textContent = ficha.veiculoInteresse.renavam || 'N/A';
                formalizarVendaDisplayCor.textContent = ficha.veiculoInteresse.veiculoId.cor || 'N/A';
                formalizarVendaDisplayKm.textContent = ficha.veiculoInteresse.veiculoId.quilometragem ? ficha.veiculoInteresse.veiculoId.quilometragem.toLocaleString('pt-BR') + ' KM' : 'N/A';
                formalizarVendaDisplayPreco.textContent = formatNumberToCurrency(ficha.veiculoInteresse.precoSugerido || 0);
            } else {
                formalizarVendaDisplayModelo.textContent = 'N/A';
                formalizarVendaDisplayPlaca.textContent = 'N/A';
                formalizarVendaDisplayAno.textContent = 'N/A';
                formalizarVendaDisplayChassi.textContent = 'N/A';
                formalizarVendaDisplayRenavam.textContent = 'N/A';
                formalizarVendaDisplayCor.textContent = 'N/A';
                formalizarVendaDisplayKm.textContent = 'N/A';
                formalizarVendaDisplayPreco.textContent = formatNumberToCurrency(0);
                alert('Atenção: Esta ficha não possui um veículo de interesse associado ou os dados do veículo estão incompletos.');
                formalizarVendaModal.classList.add('hidden');
                return;
            }

            // --- RESET BÁSICO DO MODAL DE FORMALIZAÇÃO ---
            possuiVeiculoTroca.value = ''; // Reset do dropdown
            detalhesVeiculoTroca.classList.add('hidden'); // Esconde detalhes do veículo de troca
            carregarDadosAprovacao.value = ''; // Reset do dropdown de aprovação
            detalhesAprovacaoCarregados.classList.add('hidden'); // Esconde detalhes da aprovação
            formasPagamentoContainer.innerHTML = ''; // Limpa campos de pagamento
            formasPagamentoUl.innerHTML = '';
            noFormasPagamentoMessage.classList.remove('hidden');

            formalizarVendaMessage.classList.add('hidden');
            btnGerarContrato.disabled = true;
            btnConcluirVenda.disabled = true;
            veiculoTrocaCadastrado = null; // Zera veículo de troca na memória
            financiamentoAprovadoSelecionado = null; // Zera financiamento na memória
            formalizarVendaIdAprovacaoSelecionada.value = ''; // Limpa ID de aprovação escondido

            // --- LÓGICA DE CARREGAMENTO DO VEÍCULO DE TROCA SALVO ---
            if (ficha.dadosVendaFinal && ficha.dadosVendaFinal.veiculoTroca && ficha.dadosVendaFinal.veiculoTroca.veiculoId) {
                // Se existe veículo de troca na ficha, preenche o dropdown e exibe os detalhes
                possuiVeiculoTroca.value = 'sim';
                detalhesVeiculoTroca.classList.remove('hidden');

                // Popula veiculoTrocaCadastrado com os dados existentes da ficha
                veiculoTrocaCadastrado = {
                    _id: ficha.dadosVendaFinal.veiculoTroca.veiculoId._id,
                    marca: ficha.dadosVendaFinal.veiculoTroca.veiculoId.marca || 'N/A',
                    modelo: ficha.dadosVendaFinal.veiculoTroca.veiculoId.modelo || 'N/A',
                    placa: ficha.dadosVendaFinal.veiculoTroca.veiculoId.placa || 'N/A',
                    ano: ficha.dadosVendaFinal.veiculoTroca.veiculoId.ano || 'N/A',
                    chassi: ficha.dadosVendaFinal.veiculoTroca.veiculoId.chassi || 'N/A',
                    renavam: ficha.dadosVendaFinal.veiculoTroca.veiculoId.renavam || 'N/A',
                    cor: ficha.dadosVendaFinal.veiculoTroca.veiculoId.cor || 'N/A',
                    quilometragem: ficha.dadosVendaFinal.veiculoTroca.veiculoId.quilometragem ? ficha.dadosVendaFinal.veiculoTroca.veiculoId.quilometragem : 0,
                    custoInicial: ficha.dadosVendaFinal.veiculoTroca.custoAquisicao || 0, // Custo de aquisição da ficha
                    dividas: ficha.dadosVendaFinal.veiculoTroca.veiculoId.dividas || [], // Dívidas do Vehicle populado
                    outroProprietario: ficha.dadosVendaFinal.veiculoTroca.veiculoId.outroProprietario || null
                };

                // Preenche os spans de exibição do veículo de troca
                if (displayVeiculoTrocaMarcaModelo) displayVeiculoTrocaMarcaModelo.textContent = `${veiculoTrocaCadastrado.marca} ${veiculoTrocaCadastrado.modelo}`;
                if (displayVeiculoTrocaPlaca) displayVeiculoTrocaPlaca.textContent = veiculoTrocaCadastrado.placa;
                if (displayVeiculoTrocaAno) displayVeiculoTrocaAno.textContent = veiculoTrocaCadastrado.ano;
                if (displayVeiculoTrocaCor) displayVeiculoTrocaCor.textContent = veiculoTrocaCadastrado.cor;
                if (displayVeiculoTrocaChassi) displayVeiculoTrocaChassi.textContent = veiculoTrocaCadastrado.chassi;
                if (displayVeiculoTrocaRenavam) displayVeiculoTrocaRenavam.textContent = veiculoTrocaCadastrado.renavam;
                if (displayVeiculoTrocaQuilometragem) displayVeiculoTrocaQuilometragem.textContent = veiculoTrocaCadastrado.quilometragem ? veiculoTrocaCadastrado.quilometragem.toLocaleString('pt-BR') + ' KM' : 'N/A';

                // Calcula e exibe o Custo Total do Veículo de Troca (Custo de Aquisição da ficha + Dívidas)
                let custoTotalParaDisplay = veiculoTrocaCadastrado.custoInicial;
                if (veiculoTrocaCadastrado.dividas && veiculoTrocaCadastrado.dividas.length > 0) {
                    veiculoTrocaCadastrado.dividas.forEach(divida => {
                        custoTotalParaDisplay += divida.valor;
                    });
                }
                if (displayVeiculoTrocaCusto) displayVeiculoTrocaCusto.textContent = `Custo Total: ${formatNumberToCurrency(custoTotalParaDisplay)}`;

            } else {
                // Se não há veículo de troca salvo, garante que tudo esteja limpo e escondido
                veiculoTrocaCadastrado = null;
                possuiVeiculoTroca.value = 'nao'; // Define como "Não"
                detalhesVeiculoTroca.classList.add('hidden');

                // Limpa os spans de exibição
                if (displayVeiculoTrocaMarcaModelo) displayVeiculoTrocaMarcaModelo.textContent = '';
                if (displayVeiculoTrocaPlaca) displayVeiculoTrocaPlaca.textContent = '';
                if (displayVeiculoTrocaAno) displayVeiculoTrocaAno.textContent = '';
                if (displayVeiculoTrocaCor) displayVeiculoTrocaCor.textContent = '';
                if (displayVeiculoTrocaChassi) displayVeiculoTrocaChassi.textContent = '';
                if (displayVeiculoTrocaRenavam) displayVeiculoTrocaRenavam.textContent = '';
                if (displayVeiculoTrocaQuilometragem) displayVeiculoTrocaQuilometragem.textContent = '';
                if (displayVeiculoTrocaCusto) displayVeiculoTrocaCusto.textContent = '';
            }

            // LÓGICA DE CARREGAMENTO DO FINANCIAMENTO SALVO
            if (ficha.dadosVendaFinal && ficha.dadosVendaFinal.financiamento) {
                const financiamentoSalvo = ficha.dadosVendaFinal.financiamento;

                // Tenta encontrar a aprovação original nas financeirasConsultadas para associar
                const aprovaçãoOriginal = currentFichaData.financeirasConsultadas.find(
                    fc => (fc._id && fc._id === financiamentoSalvo._id) || // Tenta pelo ID se salvo
                          (fc.nomeFinanceira === financiamentoSalvo.nomeFinanceira &&
                           Math.abs(fc.valorAprovado - financiamentoSalvo.valorAprovado) < 0.01) // Ou por nome e valor
                );

                if (aprovaçãoOriginal) {
                    financiamentoAprovadoSelecionado = aprovaçãoOriginal; // Armazena o objeto completo original
                    formalizarVendaIdAprovacaoSelecionada.value = aprovaçãoOriginal._id || ''; // Salva o ID no hidden input
                    carregarDadosAprovacao.value = 'sim'; // Marca o dropdown como 'sim'

                    formalizarVendaDisplayFinanceira.textContent = financiamentoSalvo.nomeFinanceira || 'N/A';
                    formalizarVendaDisplayValorAprovado.textContent = formatNumberToCurrency(financiamentoSalvo.valorAprovado);
                    formalizarVendaDisplayQtdParcelas.textContent = financiamentoSalvo.quantidadeParcelas || 'N/A';
                    formalizarVendaDisplayValorParcela.textContent = formatNumberToCurrency(financiamentoSalvo.valorParcela);
                    formalizarVendaDisplayVencimento.textContent = financiamentoSalvo.dataVencimentoParcela || 'N/A';
                    detalhesAprovacaoCarregados.classList.remove('hidden');
                } else {
                    console.warn("Financiamento salvo na ficha, mas a aprovação original não foi encontrada na lista de análises. Exibindo apenas dados salvos.");
                    financiamentoAprovadoSelecionado = financiamentoSalvo; // Guarda o que foi salvo, mesmo que não seja o original
                    formalizarVendaIdAprovacaoSelecionada.value = financiamentoSalvo._id || ''; // Salva o ID salvo

                    carregarDadosAprovacao.value = 'sim'; // Ainda marca como 'sim' pois há dados
                    formalizarVendaDisplayFinanceira.textContent = financiamentoSalvo.nomeFinanceira || 'N/A';
                    formalizarVendaDisplayValorAprovado.textContent = formatNumberToCurrency(financiamentoSalvo.valorAprovado);
                    formalizarVendaDisplayQtdParcelas.textContent = financiamentoSalvo.quantidadeParcelas || 'N/A';
                    formalizarVendaDisplayValorParcela.textContent = formatNumberToCurrency(financiamentoSalvo.valorParcela);
                    formalizarVendaDisplayVencimento.textContent = financiamentoSalvo.dataVencimentoParcela || 'N/A';
                    detalhesAprovacaoCarregados.classList.remove('hidden');
                }
            } else {
                carregarDadosAprovacao.value = 'nao'; // Garante que o dropdown esteja 'nao' se não houver financiamento salvo
                financiamentoAprovadoSelecionado = null; // Zera a variável se não houver financiamento salvo
                formalizarVendaIdAprovacaoSelecionada.value = '';
            }

            if (ficha.dadosVendaFinal && ficha.dadosVendaFinal.formasPagamento && ficha.dadosVendaFinal.formasPagamento.length > 0) {
                formasPagamentoContainer.innerHTML = '';
                ficha.dadosVendaFinal.formasPagamento.forEach(fp => {
                    addFormaPagamentoField(fp.valor, fp.tipo);
                });
            } else {
                formasPagamentoContainer.innerHTML = '';
                addFormaPagamentoField();
            }

            calculateValorFaltante();

            formalizarVendaModal.classList.remove('hidden');
            setupCurrencyListeners(formalizarVendaModal);
        } catch (error) {
            console.error('Erro ao abrir modal de formalização de venda:', error);
            alert('Não foi possível abrir o modal de formalização de venda: ' + error.message);
        }
    }

    function getFormalizarVendaFormasPagamento() {
        const formasPagamento = [];
        formasPagamentoContainer.querySelectorAll('.forma-pagamento-group').forEach(group => {
            const tipoSelect = group.querySelector('.forma-pagamento-tipo');
            const valorInput = group.querySelector('.forma-pagamento-valor');

            const tipo = tipoSelect.value.trim();
            const valor = parseCurrencyToNumber(valorInput.value);

            if (tipo && valor > 0) {
                formasPagamento.push({ tipo, valor });
            }
        });
        return formasPagamento;
    }

    function calculateValorFaltante() {
        const precoVendaVeiculoPrincipal = parseCurrencyToNumber(formalizarVendaDisplayPreco.textContent);
        let valorAprovadoFinanciamento = 0;
        if (carregarDadosAprovacao.value === 'sim') {
            valorAprovadoFinanciamento = parseCurrencyToNumber(formalizarVendaDisplayValorAprovado.textContent);
        }

        let totalPagoOutrasFormas = 0;
        formasPagamentoUl.innerHTML = '';
        let hasFormasPagamento = false;

        formasPagamentoContainer.querySelectorAll('.forma-pagamento-group').forEach(group => {
            const tipoSelect = group.querySelector('.forma-pagamento-tipo');
            const valorInput = group.querySelector('.forma-pagamento-valor');

            const tipo = tipoSelect.value.trim();
            const valor = parseCurrencyToNumber(valorInput.value);

            totalPagoOutrasFormas += valor;

            if (group.isConnected && tipo && valor > 0) {
                const li = document.createElement('li');
                li.innerHTML = `${tipo}: ${formatNumberToCurrency(valor)}
                                <button type="button" class="ml-2 text-red-400 hover:text-red-600 text-xs btn-remove-forma-pagamento-list"
                                        style="background:none; border:none; cursor:pointer;" title="Remover da lista">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>`;
                formasPagamentoUl.appendChild(li);
                hasFormasPagamento = true;

                li.querySelector('.btn-remove-forma-pagamento-list').addEventListener('click', (e) => {
                    e.target.closest('li').remove();
                    calculateValorFaltante();
                });
            }
        });

        if (hasFormasPagamento) {
            noFormasPagamentoMessage.classList.add('hidden');
        } else {
            noFormasPagamentoMessage.classList.remove('hidden');
        }
        lucide.createIcons();

        let valorCompensadoVeiculoTrocaParaCalculo = 0;
        if (veiculoTrocaCadastrado && typeof veiculoTrocaCadastrado.custoInicial === 'number') {
            valorCompensadoVeiculoTrocaParaCalculo = veiculoTrocaCadastrado.custoInicial;
        }

        let valorRestante = precoVendaVeiculoPrincipal - valorCompensadoVeiculoTrocaParaCalculo - valorAprovadoFinanciamento - totalPagoOutrasFormas;

        formalizarVendaValorFaltante.textContent = formatNumberToCurrency(valorRestante);

        if (Math.abs(valorRestante) < 0.01 && precoVendaVeiculoPrincipal > 0) {
            btnGerarContrato.disabled = false;
            formalizarVendaValorFaltante.classList.remove('text-red-600', 'bg-red-50');
            formalizarVendaValorFaltante.classList.add('text-green-600', 'bg-green-50');
        } else {
            btnGerarContrato.disabled = true;
            btnConcluirVenda.disabled = true;
            formalizarVendaValorFaltante.classList.add('text-red-600', 'bg-red-50');
            formalizarVendaValorFaltante.classList.remove('text-green-600', 'bg-green-50');
        }
    }

    closeFormalizarVendaModalBtn.addEventListener('click', () => {
        formalizarVendaModal.classList.add('hidden');
        formalizarVendaForm.reset();
        formasPagamentoContainer.innerHTML = '';
        formasPagamentoUl.innerHTML = '';
        noFormasPagamentoMessage.classList.remove('hidden');
        clearMessage(formalizarVendaMessage);
        veiculoTrocaCadastrado = null;
        financiamentoAprovadoSelecionado = null;
        formalizarVendaIdAprovacaoSelecionada.value = '';
        btnGerarContrato.disabled = true;
        btnConcluirVenda.disabled = true;
    });

    cancelFormalizarVendaModalBtn.addEventListener('click', () => {
        if (confirm('Deseja realmente cancelar a formalização da venda? As alterações não salvas serão perdidas.')) {
            formalizarVendaModal.classList.add('hidden');
            formalizarVendaForm.reset();
            formasPagamentoContainer.innerHTML = '';
            formasPagamentoUl.innerHTML = '';
            noFormasPagamentoMessage.classList.remove('hidden');
            clearMessage(formalizarVendaMessage);
            veiculoTrocaCadastrado = null;
            financiamentoAprovadoSelecionado = null;
            formalizarVendaIdAprovacaoSelecionada.value = '';
            btnGerarContrato.disabled = true;
            btnConcluirVenda.disabled = true;
        }
    });

    if (btnCadastrarVeiculoTroca) {
        btnCadastrarVeiculoTroca.addEventListener('click', () => {
            if (veiculoTrocaCadastrado && veiculoTrocaCadastrado._id) {
                populateVeiculoTrocaModalForEdit(veiculoTrocaCadastrado);
            } else {
                openVeiculoTrocaModal();
            }
        });
    }

    possuiVeiculoTroca.addEventListener('change', () => {
        if (possuiVeiculoTroca.value === 'sim') {
            detalhesVeiculoTroca.classList.remove('hidden');
            if (!veiculoTrocaCadastrado) {
                openVeiculoTrocaModal();
            }
        } else {
            detalhesVeiculoTroca.classList.add('hidden');
            veiculoTrocaCadastrado = null;
            if (displayVeiculoTrocaMarcaModelo) displayVeiculoTrocaMarcaModelo.textContent = '';
            if (displayVeiculoTrocaPlaca) displayVeiculoTrocaPlaca.textContent = '';
            if (displayVeiculoTrocaAno) displayVeiculoTrocaAno.textContent = '';
            if (displayVeiculoTrocaCor) displayVeiculoTrocaCor.textContent = '';
            if (displayVeiculoTrocaChassi) displayVeiculoTrocaChassi.textContent = '';
            if (displayVeiculoTrocaRenavam) displayVeiculoTrocaRenavam.textContent = '';
            if (displayVeiculoTrocaQuilometragem) displayVeiculoTrocaQuilometragem.textContent = '';

            if (displayVeiculoTrocaCusto) displayVeiculoTrocaCusto.textContent = '';
            calculateValorFaltante();
        }
    });

    carregarDadosAprovacao.addEventListener('change', () => {
        if (carregarDadosAprovacao.value === 'sim') {
            const ultimaAprovacao = currentFichaData.financeirasConsultadas
                                    .filter(fc => fc.statusAnalise === 'Aprovada')
                                    .sort((a, b) => new Date(b.dataAnalise) - new Date(a.dataAnalise))[0];

            if (ultimaAprovacao) {
                financiamentoAprovadoSelecionado = ultimaAprovacao;
                formalizarVendaIdAprovacaoSelecionada.value = ultimaAprovacao._id || '';

                formalizarVendaDisplayFinanceira.textContent = ultimaAprovacao.nomeFinanceira || 'N/A';
                formalizarVendaDisplayValorAprovado.textContent = formatNumberToCurrency(ultimaAprovacao.valorAprovado);
                formalizarVendaDisplayQtdParcelas.textContent = ultimaAprovacao.quantidadeParcelas || 'N/A';
                formalizarVendaDisplayValorParcela.textContent = formatNumberToCurrency(ultimaAprovacao.valorParcela);
                formalizarVendaDisplayVencimento.textContent = ultimaAprovacao.dataVencimentoParcela || 'N/A';
                detalhesAprovacaoCarregados.classList.remove('hidden');
            } else {
                showMessage(formalizarVendaMessage, 'Nenhuma aprovação encontrada com status "Aprovada" para esta ficha.', true);
                detalhesAprovacaoCarregados.classList.add('hidden');
                carregarDadosAprovacao.value = 'nao';
                financiamentoAprovadoSelecionado = null;
                formalizarVendaIdAprovacaoSelecionada.value = '';
            }
        } else {
            detalhesAprovacaoCarregados.classList.add('hidden');
            financiamentoAprovadoSelecionado = null;
            formalizarVendaIdAprovacaoSelecionada.value = '';
        }
        calculateValorFaltante();
    });

    btnAddFormaPagamento.addEventListener('click', () => {
        addFormaPagamentoField();
    });

    function addFormaPagamentoField(valor = 0, tipo = '') {
        const id = `formaPagamento-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const div = document.createElement('div');
        div.classList.add('grid', 'grid-cols-2', 'gap-4', 'mb-3', 'forma-pagamento-group');
        div.setAttribute('data-id', id);
        div.innerHTML = `
            <div>
                <label class="block text-gray-700 font-bold mb-1">Tipo:</label>
                <select class="border p-2 rounded w-full forma-pagamento-tipo" id="${id}-tipo">
                    <option value="">Selecione</option>
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartao de Credito">Cartão de Crédito</option>
                    <option value="Outros">Outros</option>
                    <option value="Desconto">Desconto</option>
                </select>
            </div>
            <div class="relative"> <label class="block text-gray-700 font-bold mb-1">Valor (R$):</label>
                <input type="text" class="border p-2 rounded w-full currency-input forma-pagamento-valor" id="${id}-valor" placeholder="0,00" value="${formatNumberToCurrency(valor)}" />
                <button type="button" class="absolute top-0 right-0 mt-1 mr-1 text-red-500 hover:text-red-700 text-sm delete-forma-pagamento-field"
                        style="background:none; border:none; cursor:pointer;" title="Remover Forma de Pagamento">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                </button>
            </div>
        `;
        formasPagamentoContainer.appendChild(div);
        setupCurrencyListeners(div);

        div.querySelector('.forma-pagamento-tipo').value = tipo;

        div.querySelector('.forma-pagamento-tipo').addEventListener('change', calculateValorFaltante);
        div.querySelector('.forma-pagamento-valor').addEventListener('input', calculateValorFaltante);
        div.querySelector('.forma-pagamento-valor').addEventListener('blur', calculateValorFaltante);

        div.querySelector('.delete-forma-pagamento-field').addEventListener('click', (e) => {
            e.target.closest('.forma-pagamento-group').remove();
            calculateValorFaltante();
        });

        calculateValorFaltante();
    }


    let totalDividaTrocaCalculado = 0;
    let custoInicialTrocaCalculado = 0;

    function resetVeiculoTrocaForm() {
        veiculoTrocaForm.reset();
        veiculoTrocaId.value = '';
        veiculoTrocaCompanyId.value = companyId;
        veiculoTrocaCadastradoPorId.value = userId;
        veiculoTrocaStatus.value = 'EM_PREPARACAO';
        veiculoTrocaProprietarioFichaId.value = '';

        veiculoTrocaCustoInicial.value = formatNumberToCurrency(0);
        custoInicialTrocaCalculado = 0;

        secaoDividaTroca.classList.remove('hidden');
        dividasTrocaContainer.innerHTML = '';
        dividasTrocaUl.innerHTML = '';
        noDividasMessage.classList.remove('hidden');

        totalDividaTrocaDisplay.textContent = 'Total Dívidas: R$ 0,00';
        totalDividaTrocaCalculado = 0;
        veiculoTrocaCustoTotalDisplay.textContent = 'Custo Total: R$ 0,00';

        secaoProprietarioTroca.classList.remove('hidden');
        dadosOutroProprietarioTroca.classList.add('hidden');
        veiculoTrocaProprietarioCpf.value = '';
        veiculoTrocaProprietarioNome.value = '';
        veiculoTrocaProprietarioComprador.value = '';

        clearMessage(veiculoTrocaMessage);
        updateDividaTrocaVisualList();
    }

    function addDividaTrocaField(valor = 0, descricao = '') {
        console.log("addDividaTrocaField - Recebendo:", valor, descricao);
        const div = document.createElement('div');
        div.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4', 'mb-3', 'divida-troca-group');
        div.innerHTML = `
            <div>
                <label class="block text-gray-700 font-bold mb-1">Valor da Dívida (R$):</label>
                <input type="text" class="border p-2 rounded w-full currency-input divida-valor" placeholder="0,00" value="${formatNumberToCurrency(valor)}" />
            </div>
            <div class="relative">
                <label class="block text-gray-700 font-bold mb-1">Descrição da Dívida:</label>
                <input type="text" class="border p-2 rounded w-full divida-descricao" placeholder="IPVA, Multa, Financiamento..." value="${descricao}" />
                <button type="button" class="absolute top-0 right-0 mt-1 mr-1 text-red-500 hover:text-red-700 text-sm delete-divida-troca-field"
                        style="background:none; border:none; cursor:pointer;" title="Remover Dívida">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                </button>
            </div>
        `;
        dividasTrocaContainer.appendChild(div);
        setupCurrencyListeners(div);

        div.querySelector('.divida-valor').addEventListener('input', calculateTotalDividaTroca);
        div.querySelector('.divida-descricao').addEventListener('input', calculateTotalDividaTroca);

        div.querySelector('.delete-divida-troca-field').addEventListener('click', (e) => {
            e.target.closest('.divida-troca-group').remove();
            calculateTotalDividaTroca();
        });

        updateDividaTrocaVisualList();
    }

    function calculateTotalDividaTroca() {
        totalDividaTrocaCalculado = 0;

        dividasTrocaContainer.querySelectorAll('.divida-troca-group').forEach(group => {
            const valorInput = group.querySelector('.divida-valor');
            const valor = parseCurrencyToNumber(valorInput.value);
            totalDividaTrocaCalculado += valor;
        });

        totalDividaTrocaDisplay.textContent = `Total Dívidas: ${formatNumberToCurrency(totalDividaTrocaCalculado)}`;
        updateTotalCustoTrocaDisplay();
        updateDividaTrocaVisualList();
    }

    function updateDividaTrocaVisualList() {
        console.log("updateDividaTrocaVisualList - Iniciando atualização da lista visual.");
        dividasTrocaUl.innerHTML = '';
        let hasDividas = false;

        dividasTrocaContainer.querySelectorAll('.divida-troca-group').forEach(group => {
            const valorInput = group.querySelector('.divida-valor');
            const descricaoInput = group.querySelector('.divida-descricao');

            console.log("updateDividaTrocaVisualList - Input de descrição encontrado:", descricaoInput);
            if (descricaoInput) {
                console.log("updateDividaTrocaVisualList - Valor do input de descrição:", descricaoInput.value);
            }

            const valor = parseCurrencyToNumber(valorInput.value);
            const descricao = descricaoInput ? String(descricaoInput.value).trim() : '';

            if (valor > 0 || descricao) {
                console.log("updateDividaTrocaVisualList - Adicionando item à lista:", valor, descricao);
                const li = document.createElement('li');
                li.innerHTML = `${formatNumberToCurrency(valor)} - ${descricao || 'Dívida sem descrição'}
                                <button type="button" class="ml-2 text-red-400 hover:text-red-700 text-xs btn-remove-list-item"
                                        style="background:none; border:none; cursor:pointer;" title="Remover da lista">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>`;
                dividasTrocaUl.appendChild(li);
                hasDividas = true;

                li.querySelector('.btn-remove-list-item').addEventListener('click', (e) => {
                    li.remove();
                    calculateTotalDividaTroca();
                });
            }
        });

        if (hasDividas) {
            noDividasMessage.classList.add('hidden');
        } else {
            noDividasMessage.classList.remove('hidden');
        }
        lucide.createIcons();
        console.log("updateDividaTrocaVisualList - Finalizado. hasDividas:", hasDividas);
    }


    function updateTotalCustoTrocaDisplay() {
        const totalCusto = custoInicialTrocaCalculado + totalDividaTrocaCalculado;
        veiculoTrocaCustoTotalDisplay.textContent = `Custo Total: ${formatNumberToCurrency(totalCusto)}`;
    }

    veiculoTrocaCustoInicial.addEventListener('input', (e) => {
        handleCurrencyInput(e);
        custoInicialTrocaCalculado = parseCurrencyToNumber(e.target.value);
        updateTotalCustoTrocaDisplay();
    });
    veiculoTrocaCustoInicial.addEventListener('blur', (e) => {
        e.target.value = formatNumberToCurrency(parseCurrencyToNumber(e.target.value));
        updateTotalCustoTrocaDisplay();
    });


    function openVeiculoTrocaModal() {
        resetVeiculoTrocaForm();
        veiculoTrocaProprietarioFichaId.value = formalizarVendaFichaId.value;
        veiculoTrocaModal.classList.remove('hidden');

        secaoDividaTroca.classList.remove('hidden');
        secaoProprietarioTroca.classList.remove('hidden');

        if (dividasTrocaContainer.children.length === 0) {
            addDividaTrocaField();
        }
        setupCurrencyListeners(veiculoTrocaModal);
        calculateTotalDividaTroca();
        updateTotalCustoTrocaDisplay();
        clearMessage(veiculoTrocaMessage);
    }

    function populateVeiculoTrocaModalForEdit(vehicleData) {
        resetVeiculoTrocaForm();

        veiculoTrocaId.value = vehicleData._id || '';
        veiculoTrocaCompanyId.value = companyId;
        veiculoTrocaCadastradoPorId.value = userId;
        veiculoTrocaStatus.value = vehicleData.status || 'EM_PREPARACAO';
        veiculoTrocaProprietarioFichaId.value = formalizarVendaFichaId.value;

        veiculoTrocaTipo.value = vehicleData.tipo || '';
        veiculoTrocaMarca.value = vehicleData.marca || '';
        veiculoTrocaModelo.value = vehicleData.modelo || '';
        veiculoTrocaAno.value = vehicleData.ano || '';
        veiculoTrocaPlaca.value = vehicleData.placa || '';
        veiculoTrocaChassi.value = vehicleData.chassi || '';
        veiculoTrocaRenavam.value = vehicleData.renavam || '';
        veiculoTrocaCor.value = vehicleData.cor || '';
        veiculoTrocaCombustivel.value = vehicleData.combustivel || '';
        veiculoTrocaQuilometragem.value = vehicleData.quilometragem || '';
        veiculoTrocaObservacoes.value = vehicleData.observacoes || '';

        veiculoTrocaCustoInicial.value = formatNumberToCurrency(vehicleData.custoInicial || 0);
        custoInicialTrocaCalculado = vehicleData.custoInicial || 0;

        dividasTrocaContainer.innerHTML = '';
        dividasTrocaUl.innerHTML = '';

        console.log("populateVeiculoTrocaModalForEdit - vehicleData.dividas:", vehicleData.dividas);
        if (vehicleData.dividas && vehicleData.dividas.length > 0) {
            vehicleData.dividas.forEach(divida => {
                console.log("populateVeiculoTrocaModalForEdit - Adicionando divida:", divida.valor, divida.descricao);
                addDividaTrocaField(divida.valor, divida.descricao);
            });
        } else {
            console.log("populateVeiculoTrocaModalForEdit - Nenhuma divida encontrada no vehicleData, adicionando campo vazio.");
            addDividaTrocaField();
        }
        calculateTotalDividaTroca();

        if (vehicleData.outroProprietario && vehicleData.outroProprietario.cpf) {
            veiculoTrocaProprietarioComprador.value = 'nao';
            dadosOutroProprietarioTroca.classList.remove('hidden');
            veiculoTrocaProprietarioCpf.value = applyCpfMask(vehicleData.outroProprietario.cpf);
            veiculoTrocaProprietarioNome.value = vehicleData.outroProprietario.nome;
        } else {
            veiculoTrocaProprietarioComprador.value = 'sim';
            dadosOutroProprietarioTroca.classList.add('hidden');
        }

        secaoDividaTroca.classList.remove('hidden');
        secaoProprietarioTroca.classList.remove('hidden');

        veiculoTrocaModal.classList.remove('hidden');
        setupCurrencyListeners(veiculoTrocaModal);
        updateTotalCustoTrocaDisplay();
        clearMessage(veiculoTrocaMessage);
    }


    closeVeiculoTrocaModalBtn.addEventListener('click', () => {
        veiculoTrocaModal.classList.add('hidden');
        resetVeiculoTrocaForm();
    });

    cancelVeiculoTrocaModalBtn.addEventListener('click', () => {
        if (confirm('Deseja realmente cancelar o cadastro do veículo de troca? As alterações não salvas serão perdidas.')) {
            veiculoTrocaModal.classList.add('hidden');
            resetVeiculoTrocaForm();
        }
    });

    btnAddDividaTroca.addEventListener('click', () => {
        addDividaTrocaField();
    });

    veiculoTrocaProprietarioComprador.addEventListener('change', () => {
        if (veiculoTrocaProprietarioComprador.value === 'nao') {
            dadosOutroProprietarioTroca.classList.remove('hidden');
        } else {
            dadosOutroProprietarioTroca.classList.add('hidden');
            veiculoTrocaProprietarioCpf.value = '';
            veiculoTrocaProprietarioNome.value = '';
        }
    });

    veiculoTrocaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const custoTotalCalculado = custoInicialTrocaCalculado + totalDividaTrocaCalculado;

        const veiculoTrocaData = {
            _id: veiculoTrocaId.value || undefined,
            companyId: veiculoTrocaCompanyId.value,
            cadastradoPor: userId,
            tipo: veiculoTrocaTipo.value,
            marca: veiculoTrocaMarca.value.trim(),
            modelo: veiculoTrocaModelo.value.trim(),
            ano: veiculoTrocaAno.value.trim(),
            placa: veiculoTrocaPlaca.value.trim().toUpperCase(),
            chassi: veiculoTrocaChassi.value.trim().toUpperCase(),
            renavam: veiculoTrocaRenavam.value.trim(),
            cor: veiculoTrocaCor.value.trim(),
            combustivel: veiculoTrocaCombustivel.value,
            quilometragem: parseInt(veiculoTrocaQuilometragem.value) || 0,
            observacoes: veiculoTrocaObservacoes.value.trim(),
            status: 'EM_PREPARACAO',

            preco: 0,
            custoInicial: custoTotalCalculado,

            dividas: []
        };

        dividasTrocaContainer.querySelectorAll('.divida-troca-group').forEach(group => {
            const valor = parseCurrencyToNumber(group.querySelector('.divida-valor').value);
            const descricao = String(group.querySelector('.divida-descricao').value).trim();
            if (valor > 0 || descricao) {
                veiculoTrocaData.dividas.push({ valor, descricao });
            }
        });

        if (veiculoTrocaProprietarioComprador.value === 'nao') {
            veiculoTrocaData.outroProprietario = {
                cpf: String(veiculoTrocaProprietarioCpf.value).replace(/\D/g, ''),
                nome: veiculoTrocaProprietarioNome.value.trim()
            };
        }

        if (!veiculoTrocaData.tipo || !veiculoTrocaData.marca || !veiculoTrocaData.modelo || !veiculoTrocaData.ano) {
            showMessage(veiculoTrocaMessage, 'Por favor, preencha Tipo, Marca, Modelo e Ano do veículo de troca.', true);
            return;
        }

        const url = veiculoTrocaData._id ? `/api/vehicles/${veiculoTrocaData._id}` : '/api/vehicles';
        const method = veiculoTrocaData._id ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(veiculoTrocaData)
            });
            const data = await response.json();

            if (response.ok) {
                if (data && data.vehicle && typeof data.vehicle.marca === 'string') {
                    showMessage(veiculoTrocaMessage, data.message || 'Veículo de troca salvo com sucesso!', false);

                    veiculoTrocaCadastrado = data.vehicle;

                    veiculoTrocaCadastrado.custoInicial = custoTotalCalculado;
                    veiculoTrocaCadastrado.dividas = veiculoTrocaData.dividas;
                    veiculoTrocaCadastrado.outroProprietario = veiculoTrocaData.outroProprietario;

                    if (displayVeiculoTrocaMarcaModelo) displayVeiculoTrocaMarcaModelo.textContent = `${veiculoTrocaCadastrado.marca} ${veiculoTrocaCadastrado.modelo}`;
                    if (displayVeiculoTrocaPlaca) displayVeiculoTrocaPlaca.textContent = veiculoTrocaCadastrado.placa;
                    if (displayVeiculoTrocaAno) displayVeiculoTrocaAno.textContent = veiculoTrocaCadastrado.ano;
                    if (displayVeiculoTrocaCor) displayVeiculoTrocaCor.textContent = veiculoTrocaCadastrado.cor;
                    if (displayVeiculoTrocaChassi) displayVeiculoTrocaChassi.textContent = veiculoTrocaCadastrado.chassi;
                    if (displayVeiculoTrocaRenavam) displayVeiculoTrocaRenavam.textContent = veiculoTrocaCadastrado.renavam;
                    if (displayVeiculoTrocaQuilometragem) displayVeiculoTrocaQuilometragem.textContent = veiculoTrocaCadastrado.quilometragem ? veiculoTrocaCadastrado.quilometragem.toLocaleString('pt-BR') + ' KM' : 'N/A';

                    if (displayVeiculoTrocaCusto) displayVeiculoTrocaCusto.textContent = `Custo Total: ${formatNumberToCurrency(veiculoTrocaCadastrado.custoInicial || 0)}`;

                    detalhesVeiculoTroca.classList.remove('hidden');
                    possuiVeiculoTroca.value = 'sim'; // Define como "sim" aqui também após salvar

                    await updateFichaWithTradeVehicle(formalizarVendaFichaId.value, veiculoTrocaCadastrado);

                } else {
                    console.error('Erro: Resposta do servidor OK, mas data.vehicle não foi retornado ou está incompleto. Verifique o endpoint do BACKEND.');
                    showMessage(veiculoTrocaMessage, 'Veículo de troca salvo, mas dados incompletos ou ausentes na resposta do servidor para exibição. Verifique o console para mais detalhes e o retorno do BACKEND.', false);
                }
                calculateValorFaltante();
                setTimeout(() => {
                    veiculoTrocaModal.classList.add('hidden');
                }, 1500);
            } else {
                console.error('Erro ao salvar veículo de troca:', data.message);
                showMessage(veiculoTrocaMessage, data.message || 'Erro ao salvar veículo de troca.', true);
            }
        } catch (error) {
            console.error('Erro na requisição de veículo de troca:', error);
            showMessage(veiculoTrocaMessage, 'Erro de conexão ao salvar veículo de troca.', true);
        }
    });

    async function updateFichaWithTradeVehicle(fichaId, tradeVehicle) {
        if (!fichaId || !tradeVehicle || !tradeVehicle._id) {
            console.error('Dados inválidos para atualizar ficha com veículo de troca.');
            return;
        }

        const updatePayload = {
            'dadosVendaFinal.veiculoTroca': {
                veiculoId: tradeVehicle._id,
                marcaModelo: `${tradeVehicle.marca} ${tradeVehicle.modelo}`,
                ano: tradeVehicle.ano,
                placa: tradeVehicle.placa,
                chassi: tradeVehicle.chassi,
                renavam: tradeVehicle.renavam,
                cor: tradeVehicle.cor,
                quilometragem: tradeVehicle.quilometragem,
                custoAquisicao: tradeVehicle.custoInicial
            },
            $push: {
                historicoDialogo: {
                    remetente: userId,
                    mensagem: `Veículo de troca (${tradeVehicle.marca} ${tradeVehicle.modelo} - ${tradeVehicle.placa || 'N/A'}) ${tradeVehicle._id ? 'atualizado' : 'adicionado'} na formalização de venda.`,
                    data: new Date()
                }
            }
        };

        try {
            const response = await fetch(`/api/fichas/${fichaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatePayload)
            });

            if (response.ok) {
                console.log('Ficha atualizada com veículo de troca com sucesso!');
                const updatedFichaResponse = await fetch(`/api/fichas/${fichaId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (updatedFichaResponse.ok) {
                    currentFichaData = await updatedFichaResponse.json();
                    console.log("currentFichaData atualizada com veículo de troca.");
                } else {
                    console.warn("Não foi possível recarregar currentFichaData após salvar veículo de troca.");
                }

            } else {
                const errorData = await response.json();
                console.error('Erro ao atualizar ficha com veículo de troca:', errorData.message);
                alert('Erro ao salvar informações do veículo de troca na ficha: ' + errorData.message);
            }
        } catch (error) {
            console.error('Erro na requisição para atualizar ficha com veículo de troca:', error);
            alert('Erro de conexão ao salvar informações do veículo de troca na ficha.');
        }
    }

async function saveFormalizacaoDataToBackend(finalStatus = currentFichaData.status) {
    clearMessage(formalizarVendaMessage);

    if (!currentFichaData || !currentFichaData._id) {
        showMessage(formalizarVendaMessage, 'Erro: Dados da ficha não carregados. Recarregue o modal.', true);
        return null;
    }

        const fichaId = formalizarVendaFichaId.value;
        const formasPagamentoAdicionais = getFormalizarVendaFormasPagamento();

        let dadosFinanciamentoParaSalvar = null;
        if (carregarDadosAprovacao.value === 'sim' && financiamentoAprovadoSelecionado) {
            dadosFinanciamentoParaSalvar = {
                _id: financiamentoAprovadoSelecionado._id || undefined,
                nomeFinanceira: financiamentoAprovadoSelecionado.nomeFinanceira,
                valorAprovado: financiamentoAprovadoSelecionado.valorAprovado,
                quantidadeParcelas: financiamentoAprovadoSelecionado.quantidadeParcelas,
                valorParcela: financiamentoAprovadoSelecionado.valorParcela,
                dataVencimentoParcela: financiamentoAprovadoSelecionado.dataVencimentoParcela,
            };
        }

        const dadosVendaFinalPayload = {
            veiculoTroca: null,
            financiamento: dadosFinanciamentoParaSalvar,
            formasPagamento: formasPagamentoAdicionais
        };

        if (possuiVeiculoTroca.value === 'sim' && veiculoTrocaCadastrado && veiculoTrocaCadastrado._id) {
            dadosVendaFinalPayload.veiculoTroca = {
                veiculoId: veiculoTrocaCadastrado._id,
                marcaModelo: `${veiculoTrocaCadastrado.marca} ${veiculoTrocaCadastrado.modelo}`,
                ano: veiculoTrocaCadastrado.ano,
                placa: veiculoTrocaCadastrado.placa,
                chassi: veiculoTrocaCadastrado.chassi,
                renavam: veiculoTrocaCadastrado.renavam,
                cor: veiculoTrocaCadastrado.cor,
                quilometragem: veiculoTrocaCadastrado.quilometragem,
                custoAquisicao: veiculoTrocaCadastrado.custoInicial
            };
        } else {
            dadosVendaFinalPayload.veiculoTroca = null;
        }

        console.log("Payload para atualizar dadosVendaFinal antes de enviar para o backend (saveFormalizacaoDataToBackend):", dadosVendaFinalPayload);

        const updatePayload = {
            status: finalStatus,
            dadosVendaFinal: dadosVendaFinalPayload,
            $push: {
                historicoDialogo: {
                    remetente: userId,
                    mensagem: `Dados de formalização de venda ${fichaId ? 'atualizados' : 'salvos'} para status "${String(finalStatus).replace(/_/g, ' ')}" pelo vendedor (${userName}) em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`,
                    data: new Date()
                }
            }
        };

        try {
            const response = await fetch(`/api/fichas/${fichaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatePayload)
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(formalizarVendaMessage, data.message || 'Dados de formalização salvos com sucesso!', false);
                currentFichaData = data.ficha;

                return data.ficha;
            } else {
                console.error('Erro detalhado do backend ao salvar dados de formalização:', data.message);
                showMessage(formalizarVendaMessage, data.message || 'Erro ao salvar dados de formalização.', true);
                return false;
            }
        } catch (error) {
            console.error('Erro na requisição para salvar dados de formalização:', error);
            showMessage(formalizarVendaMessage, 'Erro de conexão ao servidor para salvar dados de formalização.', true);
            return null;
        }
    }


if (btnGerarContrato) {
    btnGerarContrato.addEventListener('click', async (e) => {
        e.preventDefault();

        showMessage(formalizarVendaMessage, 'A guardar dados antes de gerar o contrato...', false);

        const fichaAtualizada = await saveFormalizacaoDataToBackend(currentFichaData.status);

        if (!fichaAtualizada) {
            return;
        }

        currentFichaData = fichaAtualizada;

        showMessage(formalizarVendaMessage, 'Dados guardados! A gerar contrato...', false);

        const contractParams = {
            fichaId: currentFichaData._id,
            companyId: companyId,
            token: token,
            userId: userId,
            userName: userName,
            userRole: userRole
        };

        sessionStorage.setItem('contractParams', JSON.stringify(contractParams));
        console.log("Parâmetros do contrato salvos no sessionStorage:", contractParams);

        const newWindow = window.open('/contrato.html', '_blank');
        if (!newWindow) {
            alert('O navegador bloqueou a abertura da nova janela pop-up para o contrato. Por favor, permita pop-ups para este site.');
        }

        btnConcluirVenda.disabled = false;
    });
}
if (btnConcluirVenda) {
    btnConcluirVenda.disabled = true;

    btnConcluirVenda.addEventListener('click', async () => {
        if (!confirm('Tem a certeza de que deseja enviar esta ficha para Conferência?')) return;

        const fichaAtualizada = await saveFormalizacaoDataToBackend('AGUARDANDO_CONFERENCIA');

        if (fichaAtualizada) {
            currentFichaData = fichaAtualizada;

            if (formalizarVendaVeiculoId.value) {
                try {
                    const vehicleResponse = await fetch(`/api/vehicles/${formalizarVendaVeiculoId.value}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            status: 'VENDIDO',
                            dataVenda: new Date().toISOString(),
                            fichaVendaId: currentFichaData._id
                        })
                    });

                    if (!vehicleResponse.ok) {
                        const errorData = await vehicleResponse.json();
                        throw new Error(errorData.message || 'Falha ao atualizar o status do veículo.');
                    }

                    alert('Ficha enviada para conferência e veículo marcado como vendido com sucesso!');

                } catch(err) {
                    console.error('Erro ao atualizar status do veículo:', err);
                    alert(`ATENÇÃO: A ficha foi enviada para conferência, mas ocorreu um erro ao marcar o veículo como vendido. Erro: ${err.message}. Avise o gerente.`);
                }
            }

            formalizarVendaModal.classList.add('hidden');
            carregarFichas();
        }
    });
}

});