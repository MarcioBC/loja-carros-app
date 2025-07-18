// public/js/analise_credito.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Variáveis de Local Storage ---
    const token = localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const companyId = localStorage.getItem('companyId');
    const userId = localStorage.getItem('userId');

    // --- Verificação de Autenticação e Redirecionamento ---
    if (!token || !userRole || !userName || !companyId || !userId || !['fn', 'gerente'].includes(userRole)) {
        alert('Acesso negado. Faça login com um perfil autorizado (F&N ou Gerente).');
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

    // --- Elementos do Sidebar ---
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

    // --- Elementos do DOM (ANÁLISE DE CRÉDITO F&N - MAIN) ---
    const fichasAnaliseTableBody = document.getElementById('fichasAnaliseTableBody');
    // REMOVIDO: const filtroFichasFnInput = document.getElementById('filtro-fichas-fn'); // Este campo foi removido do HTML
    const filtroStatusAnaliseSelect = document.getElementById('filtro-status-analise');

    // --- NOVOS ELEMENTOS DE FILTRO DE MÊS/ANO ---
    const filtroMesSelect = document.getElementById('filtro-mes');
    const filtroAnoSelect = document.getElementById('filtro-ano');

    // --- Elementos do Modal de Análise de Crédito F&N (NOVOS) ---
    const analiseCreditoModal = document.getElementById('analiseCreditoModal');
    const analiseModalTitle = document.getElementById('analiseModalTitle');
    const analiseForm = document.getElementById('analiseForm');
    const closeAnaliseModalBtn = document.getElementById('closeAnaliseModalBtn');
    const cancelAnaliseModalBtn = document.getElementById('cancelAnaliseModalBtn');

    const analiseFichaIdInput = document.getElementById('analiseFichaId');
    const analiseClienteNomeInput = document.getElementById('analiseClienteNome');
    const analiseClienteCpfInput = document.getElementById('analiseClienteCpf');
    const analiseVeiculoInfoInput = document.getElementById('analiseVeiculoInfo');
    const analiseVeiculoIdHiddenInput = document.getElementById('analiseVeiculoIdHidden'); // ID do veículo selecionado na ficha

    const financeiraSelect = document.getElementById('financeiraSelect');
    const statusAnaliseSelect = document.getElementById('statusAnaliseSelect'); // Este é o SELECT DENTRO DO MODAL
    const motivoRecusaInput = document.getElementById('motivoRecusaInput');
    const observacoesAnaliseInput = document.getElementById('observacoesAnaliseInput'); // Campo de observações na análise
    const aprovacaoFieldsDiv = document.getElementById('aprovacaoFields');
    const recusaFieldsDiv = document.getElementById('recusaFields');

    const valorAprovadoInput = document.getElementById('valorAprovadoInput');
    const quantidadeParcelasInput = document.getElementById('quantidadeParcelasInput');
    const valorParcelaInput = document.getElementById('valorParcelaInput');
    const vencimentoParcelaSelect = document.getElementById('vencimentoParcelaSelect'); // Dropdown para vencimento (30, 45, 60)
    const retornoFinanceiraInput = document.getElementById('retornoFinanceiraInput'); // Dropdown para retorno (00-05)

    const analiseMessageDiv = document.getElementById('analiseMessage');

    // Elementos do Histórico de Diálogo (NOVO)
    const historicoDialogoDiv = document.getElementById('historicoDialogoDiv');
    const historicoDialogoContent = document.getElementById('historicoDialogoContent');

    // --- Elementos do Modal de Andamento da Análise (Reutilizando a estrutura do modal de aprovação do vendedor) ---
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


    // --- Funções Auxiliares (Máscaras, Formatação de Moeda, etc.) ---
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

    function applyCpfMask(value) {
        if (!value) return '';
        value = String(value).replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return value;
    }
    function formatNumberToCurrency(number) {
        if (typeof number !== 'number' || isNaN(number)) return 'R$ 0,00';
        return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function parseCurrencyToNumber(value) {
        if (typeof value !== 'string') return Number(value) || 0;
        return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
    }
    function handleCurrencyInput(event) {
        let input = event.target;
        let value = input.value;
        value = value.replace('R$', '').replace(/[^\d,.]/g, '');
        const numCommas = (value.match(/,/g) || []).length;
        const numDots = (value.match(/\./g) || []).length;

        if (numCommas > 1 || numDots > 1 || (numCommas === 1 && numDots === 1 && value.indexOf(',') < value.indexOf('.'))) {
            let cleanDigits = value.replace(/[,.]/g, '');
            let lastSeparatorIndex = Math.max(value.lastIndexOf(','), value.lastIndexOf('.'));
            if (lastSeparatorIndex !== -1) {
                let integerPart = cleanDigits.substring(0, lastSeparatorIndex - (value.length - cleanDigits.length));
                let decimalPart = cleanDigits.substring(lastSeparatorIndex - (value.length - cleanDigits.length));
                cleanDigits = integerPart + '.' + decimalPart;
            }
            value = cleanDigits;
        } else if (numCommas === 1) {
            value = value.replace(',', '.');
        }

        if (value === '' || value === '-' || value === '.') {
            input.value = '';
            return;
        }
        let numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
            input.value = '';
            return;
        }

        const originalValue = event.target.value;
        let currentDecimalPartLength = 0;
        if (originalValue.includes(',')) {
            currentDecimalPartLength = originalValue.split(',')[1].length;
        } else if (originalValue.includes('.')) {
            currentDecimalPartLength = originalValue.split('.')[1].length;
        }

        let formattedDisplay = numericValue.toLocaleString('pt-BR', {
            minimumFractionDigits: currentDecimalPartLength,
            maximumFractionDigits: 2
        });
        
        if (originalValue.endsWith(',') && !formattedDisplay.includes(',')) {
            formattedDisplay += ',';
        } else if (originalValue.endsWith('0') && originalValue.includes(',') && currentDecimalPartLength > formattedDisplay.split(',')[1].length) {
            formattedDisplay = originalValue;
        }
        input.value = formattedDisplay;
    }
    function handleCurrencyBlur(event) {
        let input = event.target;
        let numericValue = parseCurrencyToNumber(input.value);
        input.value = formatNumberToCurrency(numericValue);
    }
    function setupCurrencyListeners(container = document) {
        Array.from(container.querySelectorAll('.currency-input')).forEach(input => {
            input.removeEventListener('input', handleCurrencyInput);
            input.removeEventListener('blur', handleCurrencyBlur);
            input.addEventListener('input', handleCurrencyInput);
            input.addEventListener('blur', handleCurrencyBlur);
        });
    }

    // Função para formatar data e hora para exibição
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

    // Função para gerenciar o status do veículo via API separada
    async function updateVehicleStatus(vehicleId, newStatus, token) {
        try {
            const currentVehicleResponse = await fetch(`/api/vehicles/${vehicleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!currentVehicleResponse.ok) {
                const errorData = await currentVehicleResponse.json();
                console.error(`Erro ao buscar status atual do veículo ${vehicleId}:`, errorData.message);
                return { success: false, message: `Erro ao verificar status do veículo: ${errorData.message}` };
            }
            const currentVehicle = await currentVehicleResponse.json();
            
            if (currentVehicle.status === newStatus) {
                console.log(`Status do veículo ${vehicleId} já é ${newStatus}. Nenhuma atualização necessária.`);
                return { success: true, message: `Status do veículo já está ${newStatus}.` };
            }

            if (currentVehicle.status === 'RESERVADO' && newStatus === 'RESERVADO') {
                console.warn(`Tentativa redundante de reservar veículo ${vehicleId}. Já está RESERVADO.`);
                return { success: false, message: `Veículo não pode ser RESERVADO. Status atual: RESERVADO.` };
            }


            const response = await fetch(`/api/vehicles/${vehicleId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();
            if (response.ok) {
                console.log(`Status do veículo ${vehicleId} atualizado para ${newStatus}:`, data);
                return { success: true, message: data.message };
            } else {
                console.error(`Erro ao atualizar status do veículo ${vehicleId} para ${newStatus}:`, data.message);
                return { success: false, message: data.message || 'Erro desconhecido ao atualizar veículo.' };
            }
        } catch (error) {
            console.error(`Erro na requisição para atualizar status do veículo ${vehicleId} para ${newStatus}:`, error);
            return { success: false, message: 'Erro de conexão ao atualizar status do veículo.' };
        }
    }


    // --- Lógica de Tabela de Fichas para Análise ---
    function montarLinhaFichaAnalise(ficha) {
        const tr = document.createElement('tr');
        const clienteNome = ficha.clienteId && ficha.clienteId.nomeCompleto ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente;
        const clienteCpf = ficha.clienteId ? ficha.clienteId.cpf : ficha.cpfCliente;
        const veiculoInfo = ficha.veiculoInteresse && ficha.veiculoInteresse.marcaModelo ?
                            `${ficha.veiculoInteresse.marcaModelo} (${ficha.veiculoInteresse.placa || 'N/A'})` : 'N/A';
        const vendedorNome = ficha.cadastradoPor ? ficha.cadastradoPor.nome : 'N/A';
        
        let statusClass = 'text-gray-700';
        let statusText = ficha.status ? ficha.status.replace(/_/g, ' ') : 'N/A';
        
        if (ficha.status === 'AGUARDANDO_ANALISE_FN') statusClass = 'text-yellow-600 font-semibold';
        else if (ficha.status === 'EM_ANALISE_FN') statusClass = 'text-blue-500 font-semibold';
        else if (ficha.status === 'APROVADA_FN') statusClass = 'text-green-600 font-semibold';
        else if (ficha.status === 'REPROVADA_FN') statusClass = 'text-red-600 font-semibold';
        else if (ficha.status === 'DEVOLVIDA_AO_VENDEDOR') statusClass = 'text-orange-600 font-semibold';
        else if (ficha.status === 'CONFERIDA' || ficha.status === 'AGUARDANDO_CONFERENCIA') statusClass = 'text-teal-600 font-semibold';
        else if (ficha.status === 'EM_CONFERENCIA' || ficha.status === 'EM_DOCUMENTACAO') statusClass = 'text-indigo-600 font-semibold';
        else if (ficha.status === 'SALVO_PARA_VENDEDOR') statusClass = 'text-gray-500 font-semibold';

        const isActionableByFnOrGerente = userRole === 'fn' || userRole === 'gerente';
        const canAnalyze = ['AGUARDANDO_ANALISE_FN', 'EM_ANALISE_FN', 'REPROVADA_FN', 'DEVOLVIDA_AO_VENDEDOR'].includes(ficha.status);
        
        let actionButtonsHtml = '';

        // Botão Visualizar Detalhes - Redireciona para a nova página de visualização
        actionButtonsHtml += `
            <button class="btn-visualizar-ficha-fn" title="Visualizar Detalhes" data-id="${ficha._id}" style="background:none; border:none; cursor:pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
        `;

        // Botão: Andamento da Análise (visível para F&N e Gerente, sempre)
        if (isActionableByFnOrGerente || userRole === 'vendedor') {
            actionButtonsHtml += `
                <button class="btn-andamento-analise" title="Andamento da Análise" data-id="${ficha._id}" style="background:none; border:none; cursor:pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
            `;
        }

        if (isActionableByFnOrGerente && canAnalyze) { // Fichas que o F&N/Gerente podem efetivamente ANALISAR
             actionButtonsHtml += `
                <button class="btn-analisar-ficha" title="Analisar Ficha" data-id="${ficha._id}" style="background:none; border:none; cursor:pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 15h4"/><path d="M8 11h.01"/><path d="M8 15h.01"/></svg>
                </button>
            `;
        }

        // Apenas Gerente pode excluir qualquer ficha
        if (userRole === 'gerente') {
            actionButtonsHtml += `
                <button class="btn-excluir-ficha-fn" title="Excluir Ficha (Gerente)" data-id="${ficha._id}" style="background:none; border:none; cursor:pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14H7L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M4 6l1-3h14l1 3"></path></svg>
                </button>
            `;
        }

        tr.innerHTML = `
            <td class="px-2 py-1">${new Date(ficha.createdAt).toLocaleDateString('pt-BR')}</td>
            <td class="px-2 py-1">${clienteNome || ''}</td>
            <td class="px-2 py-1">${applyCpfMask(clienteCpf || '')}</td>
            <td class="px-2 py-1">${veiculoInfo}</td>
            <td class="px-2 py-1 ${statusClass}">${statusText}</td>
            <td class="px-2 py-1">${vendedorNome}</td>
            <td class="px-2 py-1 text-center space-x-1">
                ${actionButtonsHtml}
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
    // --- Função principal para carregar fichas para Análise ---
    async function carregarFichasParaAnalise() {
        try {
            const selectedMonth = filtroMesSelect.value;
            const selectedYear = filtroAnoSelect.value;
            // CORREÇÃO: Pega o valor do input de busca textual, agora que ele foi restaurado no HTML
            // COMO O HTML SERÁ MODIFICADO PARA NÃO TER filtroFichasFnInput, este valor será vazio
            const filterText = ''; // A string vazia é o valor padrão para quando o input não existe
            const selectedStatus = filtroStatusAnaliseSelect.value;

            let fetchUrl = `/api/fichas?companyId=${companyId}`;

            // Adiciona filtro de status
            if (selectedStatus) {
                fetchUrl += `&status=${selectedStatus}`;
            } else {
                if (userRole === 'fn' || userRole === 'gerente') {
                    fetchUrl += `&status=AGUARDANDO_ANALISE_FN,EM_ANALISE_FN,APROVADA_FN,REPROVADA_FN,DEVOLVIDA_AO_VENDEDOR,AGUARDANDO_CONFERENCIA,EM_CONFERENCIA,CONFERIDA,AGUARDANDO_DOCUMENTACAO,PROCESSO_EM_TRANSFERENCIA,FINALIZADA,CANCELADA`;
                }
            }

            // Adiciona parâmetros de filtro de mês e ano à URL
            if (selectedMonth) {
                fetchUrl += `&month=${selectedMonth}`;
            }
            if (selectedYear) {
                fetchUrl += `&year=${selectedYear}`;
            }
            // Adiciona filtro de texto (agora, com valor vazio se o input não existe)
            if (filterText) {
                fetchUrl += `&search=${encodeURIComponent(filterText)}`;
            }

            const res = await fetch(fetchUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401 || res.status === 403) {
                alert('Sessão expirada ou não autorizado. Faça login novamente.');
                localStorage.clear();
                window.location.href = '/';
                return;
            }
            if (!res.ok) throw new Error('Erro ao carregar fichas para análise.');

            const fichas = await res.json();
            fichasAnaliseTableBody.innerHTML = '';

            if (fichas.length === 0) {
                fichasAnaliseTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">Nenhuma ficha encontrada com os filtros aplicados.</td></tr>`;
                return;
            }

            fichas.forEach(ficha => {
                fichasAnaliseTableBody.appendChild(montarLinhaFichaAnalise(ficha));
            });

            // Re-adicionar event listeners após popular a tabela
            document.querySelectorAll('.btn-visualizar-ficha-fn').forEach(btn => {
                btn.addEventListener('click', () => visualizarFichaFn(btn.dataset.id));
            });
            document.querySelectorAll('.btn-analisar-ficha').forEach(btn => {
                btn.addEventListener('click', () => openAnaliseModal(btn.dataset.id));
            });
            document.querySelectorAll('.btn-excluir-ficha-fn').forEach(btn => {
                btn.addEventListener('click', () => excluirFichaAnalise(btn.dataset.id));
            });
            document.querySelectorAll('.btn-andamento-analise').forEach(btn => {
                btn.addEventListener('click', () => openAndamentoAnaliseModal(btn.dataset.id));
            });

        } catch (error) {
            console.error('Erro ao carregar fichas para análise:', error);
            alert('Não foi possível carregar as fichas para análise.');
        }
    }

    // --- Adiciona listeners para os filtros ---
    // REMOVIDO: filtroFichasFnInput.addEventListener('input', carregarFichasParaAnalise); // Este listener será removido pois o campo não existe
    filtroMesSelect.addEventListener('change', carregarFichasParaAnalise);
    filtroAnoSelect.addEventListener('change', carregarFichasParaAnalise);
    filtroStatusAnaliseSelect.addEventListener('change', carregarFichasParaAnalise);

    // CHAMADA INICIAL para carregar fichas
    carregarFichasParaAnalise();


    // Adicionado para gerar opções de Retorno Financeira
    function populateRetornoFinanceiraSelect() {
        retornoFinanceiraInput.innerHTML = '<option value="">Selecione</option>';
        for (let i = 0; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i.toString().padStart(2, '0');
            option.textContent = i.toString().padStart(2, '0');
            retornoFinanceiraInput.appendChild(option);
        }
    }
    populateRetornoFinanceiraSelect();

    // Adicionado para gerar opções de Vencimento de Parcela
    function populateVencimentoParcelaSelect() {
        vencimentoParcelaSelect.innerHTML = '<option value="">Selecione</option>';
        const vencimentos = ['30 dias', '45 dias', '60 dias'];
        vencimentos.forEach(days => {
            const option = document.createElement('option');
            option.value = days;
            option.textContent = days;
            vencimentoParcelaSelect.appendChild(option);
        });
    }
    populateVencimentoParcelaSelect();

    // Lógica para mostrar/esconder campos de aprovação/recusa no modal
    statusAnaliseSelect.addEventListener('change', () => {
        aprovacaoFieldsDiv.classList.add('hidden');
        recusaFieldsDiv.classList.add('hidden');
        motivoRecusaInput.value = '';
        valorAprovadoInput.value = '';
        quantidadeParcelasInput.value = '';
        valorParcelaInput.value = '';
        vencimentoParcelaSelect.value = '';
        retornoFinanceiraInput.value = '';

        if (statusAnaliseSelect.value === 'Aprovada') {
            aprovacaoFieldsDiv.classList.remove('hidden');
        } else if (statusAnaliseSelect.value === 'Recusada') {
            recusaFieldsDiv.classList.remove('hidden');
        }
    });

    // FUNÇÃO PARA ABRIR O MODAL DE ANÁLISE DE CRÉDITO E PREENCHER DADOS
    async function openAnaliseModal(fichaId) {
        try {
            const response = await fetch(`/api/fichas/${fichaId}`, {
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
                throw new Error(errorData.message || 'Erro ao buscar ficha para análise.');
            }
            const ficha = await response.json();
            console.log('Ficha para análise carregada:', ficha);

            analiseModalTitle.textContent = 'Analisar Ficha de Crédito';
            analiseFichaIdInput.value = ficha._id;

            analiseForm.reset();
            aprovacaoFieldsDiv.classList.add('hidden');
            recusaFieldsDiv.classList.add('hidden');
            motivoRecusaInput.value = '';
            valorAprovadoInput.value = '';
            quantidadeParcelasInput.value = '';
            valorParcelaInput.value = '';
            vencimentoParcelaSelect.value = '';
            retornoFinanceiraInput.value = '';
            clearMessage(analiseMessageDiv);

            analiseClienteNomeInput.value = ficha.clienteId ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente;
            analiseClienteCpfInput.value = applyCpfMask(ficha.clienteId ? ficha.clienteId.cpf : ficha.cpfCliente);
            analiseVeiculoInfoInput.value = ficha.veiculoInteresse && ficha.veiculoInteresse.marcaModelo ?
                                           `${ficha.veiculoInteresse.marcaModelo} (${ficha.veiculoInteresse.placa || 'N/A'})` : 'N/A';
            analiseVeiculoIdHiddenInput.value = ficha.veiculoInteresse && ficha.veiculoInteresse.veiculoId ? ficha.veiculoInteresse.veiculoId._id : '';

            // Carregar o histórico de diálogo
            historicoDialogoContent.innerHTML = '';
            if (ficha.historicoDialogo && ficha.historicoDialogo.length > 0) {
                ficha.historicoDialogo.forEach(dialogo => {
                    const p = document.createElement('p');
                    p.classList.add('text-sm', 'text-gray-600', 'mb-1');
                    const remetenteNome = dialogo.remetente ? dialogo.remetente.nome : 'Sistema';
                    p.innerHTML = `<span class="font-semibold">${remetenteNome} (${new Date(dialogo.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}):</span> ${dialogo.mensagem}`;
                    historicoDialogoContent.appendChild(p);
                });
                historicoDialogoDiv.classList.remove('hidden');
                setTimeout(() => {
                    historicoDialogoContent.scrollTop = historicoDialogoContent.scrollHeight;
                }, 50);
            } else {
                historicoDialogoDiv.classList.add('hidden');
            }

            const lastAnalysis = ficha.financeirasConsultadas && ficha.financeirasConsultadas.length > 0
                                 ? ficha.financeirasConsultadas[ficha.financeirasConsultadas.length - 1] : null;
            if (lastAnalysis) {
                financeiraSelect.value = lastAnalysis.nomeFinanceira || '';
                statusAnaliseSelect.value = lastAnalysis.statusAnalise || '';
                motivoRecusaInput.value = lastAnalysis.motivoRecusa || '';
                valorAprovadoInput.value = formatNumberToCurrency(lastAnalysis.valorAprovado);
                quantidadeParcelasInput.value = lastAnalysis.quantidadeParcelas || '';
                valorParcelaInput.value = formatNumberToCurrency(lastAnalysis.valorParcela);
                vencimentoParcelaSelect.value = lastAnalysis.dataVencimentoParcela || '';
                retornoFinanceiraInput.value = lastAnalysis.retornoFinanceira || '';

                if (lastAnalysis.statusAnalise === 'Aprovada') {
                    aprovacaoFieldsDiv.classList.remove('hidden');
                } else if (lastAnalysis.statusAnalise === 'Recusada') {
                    recusaFieldsDiv.classList.remove('hidden');
                }
            } else {
                if (ficha.status === 'AGUARDANDO_ANALISE_FN') {
                    statusAnaliseSelect.value = 'Em análise';
                }
            }
            observacoesAnaliseInput.value = ficha.observacoes || '';

            setupCurrencyListeners(analiseCreditoModal);
            analiseCreditoModal.classList.remove('hidden');


            const currentStatus = ficha.status;
            const disableForm = ['APROVADA_FN', 'REPROVADA_FN', 'AGUARDANDO_CONFERENCIA', 'CONFERIDA', 'AGUARDANDO_DOCUMENTACAO', 'PROCESSO_EM_TRANSFERENCIA', 'FINALIZADA', 'CANCELADA'].includes(currentStatus);

            const formElements = analiseForm.querySelectorAll('input, select, textarea, button:not(#closeAnaliseModalBtn):not(#cancelAnaliseModalBtn)');
            formElements.forEach(el => {
                el.disabled = disableForm;
                if (disableForm) el.classList.add('bg-gray-100'); else el.classList.remove('bg-gray-100');
            });
            analiseForm.querySelector('button[type="submit"]').disabled = disableForm;


            if (disableForm) {
                showMessage(analiseMessageDiv, 'Esta ficha não pode mais ser analisada ou já foi finalizada.', false);
            }


        } catch (error) {
            console.error('Erro ao abrir modal de análise:', error);
            alert('Não foi possível abrir o modal de análise: ' + error.message);
        }
    }

    // Listener para o submit do formulário de análise
    analiseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage(analiseMessageDiv);

        const fichaId = analiseFichaIdInput.value;
        const veiculoId = analiseVeiculoIdHiddenInput.value;
        const nomeFinanceira = financeiraSelect.value;
        const statusAnalise = statusAnaliseSelect.value;
        const motivoRecusa = motivoRecusaInput.value.trim();
        const observacoesAnalise = observacoesAnaliseInput.value.trim();

        const valorAprovado = parseCurrencyToNumber(valorAprovadoInput.value);
        const quantidadeParcelas = parseInt(quantidadeParcelasInput.value) || 0;
        const valorParcela = parseCurrencyToNumber(valorParcelaInput.value);
        const dataVencimentoParcela = vencimentoParcelaSelect.value;
        const retornoFinanceira = retornoFinanceiraInput.value;

        if (!nomeFinanceira || !statusAnalise) {
            showMessage(analiseMessageDiv, 'Por favor, selecione a financeira e o status da análise.', true);
            return;
        }
        if (statusAnalise === 'Aprovada' && (!valorAprovado || valorAprovado <= 0 || !quantidadeParcelas || quantidadeParcelas <= 0 || !valorParcela || valorParcela <= 0 || !dataVencimentoParcela || !retornoFinanceira)) {
            showMessage(analiseMessageDiv, 'Preencha todos os campos da aprovação (Valor, Parcelas, Valor Parcela, Vencimento, Retorno).', true);
            return;
        }
        if (statusAnalise === 'Recusada' && !motivoRecusa) {
            showMessage(analiseMessageDiv, 'Por favor, descreva o motivo da recusa.', true);
            return;
        }
        if (statusAnalise === 'Devolver' && !observacoesAnalise) {
             showMessage(analiseMessageDiv, 'Para devolver ao vendedor, adicione uma observação explicando o motivo.', true);
             return;
        }

        const novaConsultaFinanceira = {
            nomeFinanceira,
            statusAnalise,
            motivoRecusa: statusAnalise === 'Recusada' ? motivoRecusa : undefined,
            valorAprovado: statusAnalise === 'Aprovada' ? valorAprovado : undefined,
            quantidadeParcelas: statusAnalise === 'Aprovada' ? quantidadeParcelas : undefined,
            valorParcela: statusAnalise === 'Aprovada' ? valorParcela : undefined,
            dataVencimentoParcela: statusAnalise === 'Aprovada' ? dataVencimentoParcela : undefined,
            retornoFinanceira: statusAnalise === 'Aprovada' ? retornoFinanceira : undefined,
            observacoes: observacoesAnalise,
            dataAnalise: new Date(),
            analisadoPor: userId
        };

        let newFichaStatusForBackend = statusAnalise;
        let dialogoMensagem = '';

        switch (statusAnalise) {
            case 'Em análise':
                newFichaStatusForBackend = 'EM_ANALISE_FN';
                dialogoMensagem = `O analista (${userName}) enviou a proposta para análise no banco ${nomeFinanceira}.`;
                break;
            case 'Aprovada':
                newFichaStatusForBackend = 'APROVADA_FN';
                dialogoMensagem = `Proposta APROVADA pelo banco ${nomeFinanceira}. Valor: ${formatNumberToCurrency(valorAprovado)}, Parcelas: ${quantidadeParcelas}x ${formatNumberToCurrency(valorParcela)}.`;
                break;
            case 'Recusada':
                newFichaStatusForBackend = 'REPROVADA_FN';
                dialogoMensagem = `A proposta para o banco ${nomeFinanceira} foi RECUSADA. Motivo: ${motivoRecusa}.`;
                break;
            case 'Devolver':
                newFichaStatusForBackend = 'DEVOLVIDA_AO_VENDEDOR';
                dialogoMensagem = `Ficha devolvida ao vendedor (${userName}) para revisão.`;
                break;
            default:
                newFichaStatusForBackend = 'AGUARDANDO_ANALISE_FN'; // Fallback
                dialogoMensagem = `Ficha marcada como aguardando análise para o banco ${nomeFinanceira}.`;
                break;
        }
        if (observacoesAnalise) {
            dialogoMensagem += ` Observações: ${observacoesAnalise}`;
        }
        dialogoMensagem += ` Em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`;


        const updateData = {
            status: newFichaStatusForBackend,
            observacoes: observacoesAnalise,
            financeirasConsultadas: [novaConsultaFinanceira],
            historicoDialogo: [{
                remetente: userId,
                mensagem: dialogoMensagem,
                data: new Date()
            }]
        };

        try {
            const responseFicha = await fetch(`/api/fichas/${fichaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });
            const dataFicha = await responseFicha.json();

            if (!responseFicha.ok) {
                console.error('Erro detalhado do backend ao atualizar ficha na análise:', dataFicha.message);
                showMessage(analiseMessageDiv, dataFicha.message || 'Erro ao atualizar ficha.', true);
                return;
            }
            showMessage(analiseMessageDiv, dataFicha.message || 'Ficha atualizada com sucesso!', false);
            console.log("Ficha atualizada no backend. Novo status:", dataFicha.ficha.status);


            if (veiculoId) {
                let newVehicleStatus = null;
                if (['EM_ANALISE_FN', 'APROVADA_FN', 'AGUARDANDO_CONFERENCIA', 'CONFERIDA', 'AGUARDANDO_DOCUMENTACAO', 'PROCESSO_EM_TRANSFERENCIA', 'FINALIZADA'].includes(newFichaStatusForBackend)) {
                    newVehicleStatus = 'RESERVADO';
                } else if (newFichaStatusForBackend === 'DEVOLVIDA_AO_VENDEDOR' || newFichaStatusForBackend === 'CANCELADA' || newFichaStatusForBackend === 'REPROVADA_FN') {
                    newVehicleStatus = 'DISPONÍVEL';
                }

                if (newVehicleStatus) {
                    const vehicleStatusResult = await updateVehicleStatus(veiculoId, newVehicleStatus, token);
                    if (vehicleStatusResult.success) {
                        console.log(`Status do veículo ${veiculoId} atualizado para ${newVehicleStatus}.`);
                    } else {
                        console.error('Erro ao atualizar status do veículo:', vehicleStatusResult.message);
                        alert(`Atenção: A ficha foi atualizada, mas houve erro ao mudar o status do veículo: ${vehicleStatusResult.message}`);
                    }
                }
            }

            setTimeout(() => {
                analiseCreditoModal.classList.add('hidden');
                analiseForm.reset();
                clearMessage(analiseMessageDiv);
                historicoDialogoContent.innerHTML = '';
                historicoDialogoDiv.classList.add('hidden');
                carregarFichasParaAnalise();
            }, 1500);

        } catch (error) {
            console.error('Erro na requisição de análise/atualização de ficha:', error);
            showMessage(analiseMessageDiv, 'Erro ao conectar ao servidor para salvar análise.', true);
        }
    });

    // Função para visualizar ficha
    async function visualizarFichaFn(id) {
        window.location.href = `/view_ficha.html?id=${id}`;
    }

    // Função para excluir ficha
    async function excluirFichaAnalise(id) {
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
                carregarFichasParaAnalise();
            } else {
                console.error('Erro detalhado do backend na exclusão:', data.message);
                alert(data.message || 'Erro ao excluir ficha.');
            }
        } catch (error) {
            console.error('Erro na requisição de exclusão:', error);
            alert('Erro ao conectar ao servidor para excluir ficha.');
        }
    }

    closeAnaliseModalBtn.addEventListener('click', () => {
        analiseCreditoModal.classList.add('hidden');
        analiseForm.reset();
        clearMessage(analiseMessageDiv);
        historicoDialogoContent.innerHTML = '';
        historicoDialogoDiv.classList.add('hidden');
    });

    cancelAnaliseModalBtn.addEventListener('click', () => {
        if (confirm('Deseja realmente cancelar a análise e fechar o modal? As alterações não salvas serão perdidas.')) {
            analiseCreditoModal.classList.add('hidden');
            analiseForm.reset();
            clearMessage(analiseMessageDiv);
            historicoDialogoContent.innerHTML = '';
            historicoDialogoDiv.classList.add('hidden');
        }
    });

    // --- FUNÇÃO PARA ABRIR O MODAL DE ANDAMENTO DA ANÁLISE (PARA F&N) ---
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

            andamentoAnaliseModalTitle.textContent = 'Andamento da Análise';

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

    // Listeners para fechar o modal de andamento da análise (reutilizado)
    closeAprovacaoVendedorModalBtn.addEventListener('click', () => {
        aprovacaoVendedorModal.classList.add('hidden');
    });
    closeAprovacaoVendedorModalBtnBottom.addEventListener('click', () => {
        aprovacaoVendedorModal.classList.add('hidden');
    });

}); // Fim do DOMContentLoaded