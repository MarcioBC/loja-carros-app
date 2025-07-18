// public/js/conferencia.js - VERSÃO FINAL E COMPLETA COM MODAL PADRONIZADO
document.addEventListener('DOMContentLoaded', async () => {
    // --- Variáveis de Local Storage ---
    const token = localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const companyId = localStorage.getItem('companyId');
    const userId = localStorage.getItem('userId');

    // --- Verificação de Autenticação e Redirecionamento ---
    if (!token || !userRole || !userName || !companyId || !userId || (userRole !== 'conferente' && userRole !== 'gerente')) {
        alert('Acesso negado. Faça login com um perfil autorizado (Conferente ou Gerente).');
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

    // --- Elementos da Tabela Principal ---
    const fichasTableBody = document.getElementById('fichasTableBody');

    // --- NOVOS ELEMENTOS DE FILTRO DE MÊS/ANO/BUSCA ---
    const filtroConferenciaInput = document.getElementById('filtro-conferencia'); // Input de busca textual
    const filtroMesSelect = document.getElementById('filtro-mes');
    const filtroAnoSelect = document.getElementById('filtro-ano');

    // --- Elementos do Modal de Conferência (Antigo acaoModal) ---
    const conferenciaModal = document.getElementById('acaoModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');

    // Elementos de exibição do cliente/veículo no modal
    const modalClienteNome = document.getElementById('modalClienteNome');
    const modalClienteCpf = document.getElementById('modalClienteCpf');
    const modalVeiculoInfo = document.getElementById('modalVeiculoInfo');

    // Elementos do histórico de diálogo
    const dialogoContent = document.getElementById('dialogoContent');
    const dialogoForm = document.getElementById('dialogoForm');
    const mensagemInput = document.getElementById('mensagemInput');

    // Container para os botões de ação (Iniciar Conferência, Marcar como Conferido)
    const acoesContainer = document.getElementById('acoesContainer');

    // --- Funções Auxiliares Comuns ---
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

    // --- Preencher Informações do Usuário no Cabeçalho ---
    if (userNameDisplay) userNameDisplay.textContent = userName;
    if (userRoleDisplay) userRoleDisplay.textContent = userRole.toUpperCase();

    async function fetchCompanyName() {
        if (!companyNameDisplay) return;
        try {
            const response = await fetch(`/api/companies/${companyId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const company = await response.json();
                companyNameDisplay.textContent = company.nome;
            }
        } catch (e) { console.error('Erro ao buscar nome da empresa:', e); }
    }
    fetchCompanyName();

    // --- Lógica do Menu Lateral Dinâmico ---
    function renderMenu() {
        if (!mainNav) return;
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
        mainNav.innerHTML = '';
        menuItems.forEach(item => {
            if (item.roles.includes(userRole)) {
                const link = document.createElement('a');
                link.href = item.href;
                link.className = 'block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 flex items-center gap-3';
                if (window.location.pathname === item.href) link.classList.add('active-link');

                const iconElement = document.createElement('i');
                iconElement.setAttribute('data-lucide', item.icon);
                iconElement.classList.add('mr-3');

                link.appendChild(iconElement);
                const textSpan = document.createElement('span');
                textSpan.textContent = item.name;
                link.appendChild(textSpan);

                // Tratamento especial para "Gerenciar Usuários" (redirecionar para uma página)
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

    // --- Lógica do Sidebar (Abre e Fecha) e Modal Overflow ---
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

    // --- Funções de Carregamento e Renderização da Tabela de Fichas ---
    async function carregarFichas() {
        if (!fichasTableBody) return;
        fichasTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-gray-500">A carregar fichas para conferência...</td></tr>`;
        try {
            const selectedMonth = filtroMesSelect.value;
            const selectedYear = filtroAnoSelect.value;
            const filterText = filtroConferenciaInput.value; // Pega o valor do novo campo de busca

            let fetchUrl = `/api/fichas/conferencia?companyId=${companyId}`;

            // Adiciona parâmetros de filtro de mês e ano à URL
            if (selectedMonth) {
                fetchUrl += `&month=${selectedMonth}`;
            }
            if (selectedYear) {
                fetchUrl += `&year=${selectedYear}`;
            }
            // Adiciona filtro de texto
            if (filterText) {
                fetchUrl += `&search=${encodeURIComponent(filterText)}`;
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
            if (!response.ok) throw new Error('Falha ao buscar fichas para conferência.');

            const fichas = await response.json();
            renderTabela(fichas);

        } catch (error) {
            console.error('Erro ao carregar fichas para conferência:', error);
            fichasTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500 p-4">Erro ao carregar fichas para conferência.</td></tr>`;
        }
    }

    function renderTabela(fichas) {
        fichasTableBody.innerHTML = '';
        if (fichas.length === 0) {
            fichasTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-gray-500">Nenhuma ficha para conferência.</td></tr>`;
            return;
        }
        fichas.forEach(ficha => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';
            const clienteNome = ficha.clienteId?.nomeCompleto || ficha.nomeCompletoCliente || 'N/A';
            const clienteCpf = ficha.clienteId?.cpf || ficha.cpfCliente || 'N/A';
            const clienteTelefone = ficha.clienteId?.telefonePrincipal || ficha.telefonePrincipalCliente || 'N/A';

            const veiculoInfoDisplay = ficha.veiculoInteresse?.veiculoId ?
                `${ficha.veiculoInteresse.veiculoId.modelo || 'N/A'} (${ficha.veiculoInteresse.veiculoId.placa || 'N/A'})` :
                (ficha.veiculoInteresse?.marcaModelo ? `${ficha.veiculoInteresse.marcaModelo} (${ficha.veiculoInteresse.placa || 'N/A'})` : 'N/A');

            const statusText = ficha.status ? String(ficha.status).replace(/_/g, ' ') : 'N/A';

            const acoesHtml = `
                <button class="btn-conferir text-blue-600 hover:text-blue-800 p-1" data-id="${ficha._id}" title="Conferir Ficha">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-check">
                        <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 11 2 2 4-4"/>
                    </svg>
                </button>
                <button class="btn-andamento-analise text-gray-600 hover:text-gray-800 p-1" data-id="${ficha._id}" title="Andamento da Análise (Diálogo)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>
            `;

            tr.innerHTML = `
                <td class="px-2 py-1">${new Date(ficha.createdAt).toLocaleDateString('pt-BR')}</td>
                <td class="px-2 py-1">${clienteNome}</td>
                <td class="px-2 py-1">${applyCpfMask(clienteCpf)}</td>
                <td class="px-2 py-1">${applyPhoneMask(clienteTelefone)}</td>
                <td class="px-2 py-1">${veiculoInfoDisplay}</td>
                <td class="px-2 py-1 font-semibold">${statusText}</td>
                <td class="px-2 py-1 text-center space-x-2">${acoesHtml}</td>
            `;
            fichasTableBody.appendChild(tr);
        });
        lucide.createIcons();

        document.querySelectorAll('.btn-conferir').forEach(btn => btn.addEventListener('click', (e) => openConferenciaModal(e.currentTarget.dataset.id)));
        document.querySelectorAll('.btn-andamento-analise').forEach(btn => btn.addEventListener('click', (e) => openAndamentoAnaliseModal(e.currentTarget.dataset.id)));
    }

    // --- Adiciona listeners para os novos filtros ---
    filtroMesSelect.addEventListener('change', carregarFichas);
    filtroAnoSelect.addEventListener('change', carregarFichas);
    filtroConferenciaInput.addEventListener('input', carregarFichas); // Listener para o campo de busca


    // --- Função para Abrir o Modal de Conferência ---
    async function openConferenciaModal(fichaId) {
        try {
            const response = await fetch(`/api/fichas/${fichaId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('Sessão expirada ou não autorizado. Faça login novamente.');
                    localStorage.clear();
                    window.location.href = '/';
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ficha não encontrada.');
            }
            const ficha = await response.json();

            modalTitle.textContent = 'Análise de Conferência';

            modalClienteNome.textContent = ficha.clienteId?.nomeCompleto || ficha.nomeCompletoCliente || 'N/A';
            modalClienteCpf.textContent = `CPF: ${applyCpfMask(ficha.clienteId?.cpf || ficha.cpfCliente || 'N/A')}`;

            let veiculoDisplayInfo = 'Veículo não informado';
            if (ficha.veiculoInteresse) {
                const veiculoPopulado = ficha.veiculoInteresse.veiculoId;
                if (veiculoPopulado && typeof veiculoPopulado === 'object') {
                    const modelo = veiculoPopulado.modelo || 'N/A';
                    const placa = veiculoPopulado.placa || 'N/A';
                    const ano = veiculoPopulado.ano || 'N/A';
                    veiculoDisplayInfo = `${modelo} (${placa}) - ${ano}`;
                } else if (ficha.veiculoInteresse.marcaModelo) {
                    const modelo = ficha.veiculoInteresse.marcaModelo || 'N/A';
                    const placa = ficha.veiculoInteresse.placa || 'N/A';
                    const ano = ficha.veiculoInteresse.ano || 'N/A';
                    veiculoDisplayInfo = `${modelo} (${placa}) - ${ano}`;
                }
            }
            modalVeiculoInfo.textContent = veiculoDisplayInfo;

            renderDialogo(ficha.historicoDialogo);
            renderAcoes(ficha.status, fichaId);
            conferenciaModal.classList.remove('hidden');

        } catch (error) {
            console.error('Erro ao abrir modal de conferência:', error);
            alert('Não foi possível carregar a ficha para conferência: ' + error.message);
        }
    }

    // --- Renderização do Histórico de Diálogo ---
    function renderDialogo(historico) {
        dialogoContent.innerHTML = '';
        if (!historico || historico.length === 0) {
            dialogoContent.innerHTML = `<p class="text-gray-500 text-center">Nenhuma mensagem no histórico.</p>`;
            return;
        }
        const sortedDialogos = historico.sort((a, b) => new Date(a.data) - new Date(b.data));

        sortedDialogos.forEach(msg => {
            const msgDiv = document.createElement('div');
            const isCurrentUser = msg.remetente && msg.remetente._id === userId;

            const remetenteNome = msg.remetente ? (msg.remetente.nome || 'Sistema') : 'Sistema';
            const remetenteRole = msg.remetente ? (msg.remetente.role || 'sistema') : 'sistema';

            let bgColorClass = 'bg-gray-100 text-gray-800';
            if (remetenteRole === 'vendedor') {
                bgColorClass = 'bg-blue-100 text-blue-800';
                if (isCurrentUser) bgColorClass += ' ml-auto'; else bgColorClass += ' mr-auto';
            } else if (['fn', 'gerente', 'conferente', 'documentacao'].includes(remetenteRole)) {
                bgColorClass = 'bg-green-100 text-green-800';
                if (isCurrentUser) bgColorClass += ' ml-auto'; else bgColorClass += ' mr-auto';
            } else {
                 bgColorClass = 'bg-gray-100 text-gray-800 mr-auto';
            }

            msgDiv.className = `p-2 rounded-lg mb-2 text-sm max-w-xs ${bgColorClass}`;
            msgDiv.innerHTML = `<p class="font-semibold">${remetenteNome}</p><p class="text-gray-800">${msg.mensagem}</p><p class="text-xs text-gray-500 mt-1">${formatDateWithTime(msg.data)}</p>`;
            dialogoContent.appendChild(msgDiv);
        });
        dialogoContent.scrollTop = dialogoContent.scrollHeight;
    }

    // --- Renderização dos Botões de Ação no Modal ---
    function renderAcoes(status, fichaId) {
        acoesContainer.innerHTML = '';
        let acaoBtn;

        if (status === 'AGUARDANDO_CONFERENCIA') {
            acaoBtn = document.createElement('button');
            acaoBtn.className = 'btn-status bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700';
            acaoBtn.textContent = 'Iniciar Conferência';
            acaoBtn.dataset.status = 'EM_CONFERENCIA';
        } else if (status === 'EM_CONFERENCIA') {
            acaoBtn = document.createElement('button');
            acaoBtn.className = 'btn-status bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700';
            acaoBtn.textContent = 'Marcar como Conferido';
            acaoBtn.dataset.status = 'CONFERIDA';
        }

        if (acaoBtn) {
            acaoBtn.addEventListener('click', (e) => handleStatusUpdate(e, fichaId));
            acoesContainer.appendChild(acaoBtn);
        }
    }

    // --- Handler de Atualização de Status da Ficha ---
    async function handleStatusUpdate(e, fichaId) {
        const btn = e.currentTarget;
        const novoStatus = btn.dataset.status;
        let mensagemAutomatica = '';

        if (novoStatus === 'EM_CONFERENCIA') {
            mensagemAutomatica = `Conferência iniciada pelo conferente (${userName}) em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;
        } else if (novoStatus === 'CONFERIDA') {
            mensagemAutomatica = `Ficha marcada como CONFERIDA pelo conferente (${userName}) em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}. Status agora AGUARDANDO DOCUMENTAÇÃO.`;
            if (!confirm('Ao marcar como "Conferido", a ficha será enviada para o setor de Documentação. Tem certeza?')) {
                return;
            }
        }

        try {
            const updatePayload = {
                status: novoStatus,
                historicoDialogoEntry: {
                    remetente: userId,
                    mensagem: mensagemAutomatica,
                    data: new Date()
                }
            };

            const response = await fetch(`/api/fichas/${fichaId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao atualizar status.');
            }

            alert('Status da ficha atualizado com sucesso!');
            conferenciaModal.classList.add('hidden');
            carregarFichas(); // Recarrega as fichas com os filtros atuais

        } catch (error) {
            console.error('Erro ao atualizar status da ficha:', error);
            alert('Não foi possível atualizar o status da ficha: ' + error.message);
        }
    }

    // --- Handler de Envio de Mensagem de Diálogo ---
    async function handleDialogoSubmit(e) {
        e.preventDefault();
        // O ID da ficha para o diálogo é obtido do modal atual
        // Certifique-se que o modal armazena o ID da ficha de alguma forma, por exemplo, em um data-attribute
        // No seu HTML, o modal 'acaoModal' não tem um data-id. Vou usar um elemento que você provavelmente tem dentro dele para pegar o ID.
        // Assumindo que você tem um hidden input com id="modalFichaId" ou um data-id no container principal do modal
        const currentFichaId = conferenciaModal.querySelector('[data-id]') ? conferenciaModal.querySelector('[data-id]').dataset.id : null;
        // Se a modalTitle é o h2, você pode adicionar um data-id a ela quando o modal é aberto.
        // Ou o 'modalClienteNome' ou 'modalClienteCpf' que já existem podem ter um data-ficha-id.

        if (!currentFichaId) {
             console.error('ID da ficha não encontrado para enviar mensagem.');
             alert('Não foi possível identificar a ficha para enviar a mensagem. Por favor, feche e reabra o modal.');
             return;
        }

        const mensagem = mensagemInput.value.trim();
        if (!mensagem) {
            alert('Digite uma mensagem para enviar.');
            return;
        }

        try {
            const response = await fetch(`/api/fichas/${currentFichaId}/dialogo`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ mensagem })
            });
            const data = await response.json();
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao enviar mensagem.');
            }
            renderDialogo(data.ficha.historicoDialogo);
            mensagemInput.value = '';

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            alert(`Erro ao enviar mensagem: ${error.message}`);
        }
    }

    // --- Função para Abrir o Modal de Andamento da Análise (Diálogo) para Conferência ---
    async function openAndamentoAnaliseModal(fichaId) {
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

            modalTitle.textContent = 'Andamento da Análise (Diálogo)';

            // Adiciona o ID da ficha ao modal para uso no envio de mensagens
            conferenciaModal.setAttribute('data-id', ficha._id); // Adicionado esta linha para armazenar o ID

            let veiculoDisplayInfo = 'Veículo não informado';
            if (ficha.veiculoInteresse) {
                const veiculoPopulado = ficha.veiculoInteresse.veiculoId;
                if (veiculoPopulado && typeof veiculoPopulado === 'object') {
                    const modelo = veiculoPopulado.modelo || 'N/A';
                    const placa = veiculoPopulado.placa || 'N/A';
                    const ano = veiculoPopulado.ano || 'N/A';
                    veiculoDisplayInfo = `${modelo} (${placa}) - ${ano}`;
                } else if (ficha.veiculoInteresse.marcaModelo) {
                    const modelo = ficha.veiculoInteresse.marcaModelo || 'N/A';
                    const placa = ficha.veiculoInteresse.placa || 'N/A';
                    const ano = ficha.veiculoInteresse.ano || 'N/A';
                    veiculoDisplayInfo = `${modelo} (${placa}) - ${ano}`;
                }
            }
            modalVeiculoInfo.textContent = veiculoDisplayInfo;

            modalClienteNome.textContent = ficha.clienteId ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente;
            modalClienteCpf.textContent = applyCpfMask(ficha.clienteId ? ficha.clienteId.cpf : ficha.cpfCliente);

            renderDialogo(ficha.historicoDialogo);

            // Esconde os botões de ação de status ao abrir o modal de diálogo
            acoesContainer.innerHTML = '';
            dialogoForm.classList.remove('hidden'); // Garante que o formulário de diálogo esteja visível

            conferenciaModal.classList.remove('hidden');

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

    // --- Event Listeners para o Modal de Conferência ---
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            conferenciaModal.classList.add('hidden');
            mensagemInput.value = '';
            dialogoContent.innerHTML = '';
            conferenciaModal.removeAttribute('data-id'); // Limpa o ID da ficha ao fechar
        });
    }
    if (dialogoForm) {
        dialogoForm.addEventListener('submit', handleDialogoSubmit);
    }

    // --- Inicialização ---
    carregarFichas();
});