// public/js/documentacao.js - VERSÃO COMPLETA E FINAL PADRONIZADA
document.addEventListener('DOMContentLoaded', async () => {
    // --- Variáveis de Local Storage ---
    const token = localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const companyId = localStorage.getItem('companyId');
    const userId = localStorage.getItem('userId');

    // --- Verificação de Autenticação e Redirecionamento ---
    if (!token || !userRole || !userName || !companyId || !userId || (userRole !== 'documentacao' && userRole !== 'gerente')) {
        alert('Acesso negado. Faça login com um perfil autorizado (Documentação ou Gerente).');
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
    const filtroDocumentacaoInput = document.getElementById('filtro-documentacao'); // Input de busca textual
    const filtroMesSelect = document.getElementById('filtro-mes');
    const filtroAnoSelect = document.getElementById('filtro-ano');

    // --- Elementos do NOVO Modal de Documentação ---
    const documentacaoModal = document.getElementById('documentacaoModal');
    const closeDocumentacaoModalBtn = document.getElementById('closeDocumentacaoModalBtn');
    const modalTitleDocumentacao = document.getElementById('modalTitleDocumentacao');

    // Elementos de exibição do cliente/veículo no modal
    const clienteNomeDocumentacao = document.getElementById('clienteNomeDocumentacao');
    const clienteCpfDocumentacao = document.getElementById('clienteCpfDocumentacao');
    const veiculoInfoDocumentacao = document.getElementById('veiculoInfoDocumentacao');

    // Elementos do histórico de diálogo
    const dialogoContentDocumentacao = document.getElementById('dialogoContentDocumentacao');
    const dialogoFormDocumentacao = document.getElementById('dialogoFormDocumentacao');
    const mensagemInputDocumentacao = document.getElementById('mensagemInputDocumentacao');

    // Container para os botões de ação
    const acoesContainerDocumentacao = document.getElementById('acoesContainerDocumentacao');

    // --- Funções Auxiliares Comuns (Padronizadas) ---
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
            } else {
                companyNameDisplay.textContent = 'N/A';
            }
        }catch (e) {
            console.error('Erro ao buscar nome da empresa:', e);
            companyNameDisplay.textContent = 'N/A';
        }
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
        fichasTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-gray-500">A carregar fichas para documentação...</td></tr>`;
        try {
            const selectedMonth = filtroMesSelect.value;
            const selectedYear = filtroAnoSelect.value;
            const filterText = filtroDocumentacaoInput.value; // Pega o valor do novo campo de busca

            let fetchUrl = `/api/fichas/documentacao?companyId=${companyId}`;

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
            if (!response.ok) throw new Error('Falha ao buscar fichas para documentação.');

            const fichas = await response.json();
            renderTabela(fichas);

        } catch (error) {
            console.error("Erro ao carregar fichas para documentação:", error);
            fichasTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500 p-4">Erro ao carregar fichas para documentação.</td></tr>`;
        }
    }

    function renderTabela(fichas) {
        fichasTableBody.innerHTML = '';
        if (fichas.length === 0) {
            fichasTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-gray-500">Nenhuma ficha para documentação.</td></tr>`;
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

            // Padronizando ícones e comportamento dos botões de ação
            const acoesHtml = `
                <button class="btn-documentacao text-blue-600 hover:text-blue-800 p-1" data-id="${ficha._id}" title="Ações de Documentação">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-check">
                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 11 2 2 4-4"/>
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

        // Adicionar event listeners aos botões
        document.querySelectorAll('.btn-documentacao').forEach(btn => btn.addEventListener('click', (e) => openDocumentacaoModal(e.currentTarget.dataset.id)));
        document.querySelectorAll('.btn-andamento-analise').forEach(btn => btn.addEventListener('click', (e) => openDocumentacaoModal(e.currentTarget.dataset.id))); // Ambos abrem o mesmo modal agora
    }

    // --- Adiciona listeners para os novos filtros ---
    filtroMesSelect.addEventListener('change', carregarFichas);
    filtroAnoSelect.addEventListener('change', carregarFichas);
    filtroDocumentacaoInput.addEventListener('input', carregarFichas); // Listener para o campo de busca

    // --- Função para Abrir o Modal de Documentação ---
    async function openDocumentacaoModal(fichaId) {
        if (!token) {
            console.error('Erro: Token JWT não encontrado no localStorage.');
            alert('Você não está autenticado. Por favor, faça login novamente.');
            localStorage.clear();
            window.location.href = '/';
            return;
        }
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

            // Preenchimento do Cabeçalho do Modal (Padronizado)
            modalTitleDocumentacao.textContent = 'Ações de Documentação';

            clienteNomeDocumentacao.textContent = ficha.clienteId?.nomeCompleto || ficha.nomeCompletoCliente || 'N/A';
            clienteCpfDocumentacao.textContent = `CPF: ${applyCpfMask(ficha.clienteId?.cpf || ficha.cpfCliente || 'N/A')}`;

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
            veiculoInfoDocumentacao.textContent = veiculoDisplayInfo;

            // Armazena o ID da ficha no modal para uso na função de envio de mensagem
            documentacaoModal.setAttribute('data-ficha-id', ficha._id);

            renderDialogoDocumentacao(ficha.historicoDialogo);
            renderAcoesDocumentacao(ficha.status, ficha._id);
            documentacaoModal.classList.remove('hidden');

        } catch (error) {
            console.error('Erro ao abrir modal de documentação:', error);
            if (error.message.includes('Status: 401') || error.message.includes('Status: 403')) {
                alert('Sessão expirada ou não autorizado. Faça login novamente.');
                localStorage.clear();
                window.location.href = '/';
            } else {
                alert('Não foi possível carregar a ficha para documentação: ' + error.message);
            }
        }
    }

    // --- Renderização do Histórico de Diálogo (para Documentação) ---
    function renderDialogoDocumentacao(historico) {
        dialogoContentDocumentacao.innerHTML = '';
        if (!historico || historico.length === 0) {
            dialogoContentDocumentacao.innerHTML = `<p class="text-gray-500 text-center">Nenhuma mensagem no histórico.</p>`;
            return;
        }
        // Ordenar diálogos pela data, mais antigo primeiro para leitura de "chat"
        const sortedDialogos = historico.sort((a, b) => new Date(a.data) - new Date(b.data));

        sortedDialogos.forEach(msg => {
            const msgDiv = document.createElement('div');
            const isCurrentUser = msg.remetente && msg.remetente._id === userId;

            const remetenteNome = msg.remetente ? (msg.remetente.nome || 'Sistema') : 'Sistema';
            const remetenteRole = msg.remetente ? (msg.remetente.role || 'sistema') : 'sistema';

            let bgColorClass = 'bg-gray-100 text-gray-800'; // Default
            msgDiv.classList.add('p-2', 'rounded-lg', 'mb-2', 'text-sm', 'max-w-xs');

            if (remetenteRole === 'vendedor') {
                bgColorClass = 'bg-blue-100 text-blue-800';
                if (isCurrentUser) msgDiv.classList.add('ml-auto'); else msgDiv.classList.add('mr-auto');
            } else if (['fn', 'gerente', 'conferente', 'documentacao'].includes(remetenteRole)) {
                bgColorClass = 'bg-green-100 text-green-800';
                if (isCurrentUser) msgDiv.classList.add('ml-auto'); else msgDiv.classList.add('mr-auto');
            } else { // System messages
                bgColorClass = 'bg-gray-100 text-gray-800';
                msgDiv.classList.add('mr-auto');
            }

            // Apply background color class
            msgDiv.classList.add(...bgColorClass.split(' '));

            msgDiv.innerHTML = `<p class="font-semibold">${remetenteNome}</p><p class="text-gray-800">${msg.mensagem}</p><p class="text-xs text-gray-500 mt-1">${formatDateWithTime(msg.data)}</p>`;
            dialogoContentDocumentacao.appendChild(msgDiv);
        });
        dialogoContentDocumentacao.scrollTop = dialogoContentDocumentacao.scrollHeight;
    }

    // --- Renderização dos Botões de Ação no Modal (para Documentação) ---
    function renderAcoesDocumentacao(status, fichaId) {
        acoesContainerDocumentacao.innerHTML = '';
        let acaoBtn;

        if (status === 'AGUARDANDO_DOCUMENTACAO') {
            acaoBtn = document.createElement('button');
            acaoBtn.className = 'btn-status bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700';
            acaoBtn.textContent = 'Iniciar Transferência';
            acaoBtn.dataset.status = 'PROCESSO_EM_TRANSFERENCIA';
        } else if (status === 'PROCESSO_EM_TRANSFERENCIA') {
            acaoBtn = document.createElement('button');
            acaoBtn.className = 'btn-status bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700';
            acaoBtn.textContent = 'Veículo Transferido';
            acaoBtn.dataset.status = 'FINALIZADA';
        }

        if (acaoBtn) {
            acaoBtn.addEventListener('click', (e) => handleStatusUpdateDocumentacao(e, fichaId));
            acoesContainerDocumentacao.appendChild(acaoBtn);
        }
    }

    // --- Handler de Atualização de Status da Ficha (para Documentação) ---
    async function handleStatusUpdateDocumentacao(e, fichaId) {
        const btn = e.currentTarget;
        const novoStatus = btn.dataset.status;
        let mensagemAutomatica = '';

        if (novoStatus === 'PROCESSO_EM_TRANSFERENCIA') {
            mensagemAutomatica = `Processo de transferência iniciado pela documentação (${userName}) em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;
            if (!confirm('Tem certeza que deseja iniciar o processo de transferência?')) {
                return;
            }
        } else if (novoStatus === 'FINALIZADA') {
            mensagemAutomatica = `Processo de documentação FINALIZADO (${userName}) em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}. Ficha marcada como FINALIZADA.`;
            if (!confirm('Tem certeza que deseja marcar como "Veículo Transferido" e finalizar a ficha?')) {
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
            documentacaoModal.classList.add('hidden');
            carregarFichas();

        } catch (error) {
            console.error('Erro ao atualizar status da ficha:', error);
            alert('Não foi possível atualizar o status da ficha: ' + error.message);
        }
    }

    // --- Handler de Envio de Mensagem de Diálogo (para Documentação) ---
    async function handleDialogoSubmitDocumentacao(e) {
        e.preventDefault();
        const currentFichaId = documentacaoModal.dataset.fichaId;
        const mensagem = mensagemInputDocumentacao.value.trim();
        if (!mensagem || !currentFichaId) {
            alert("Mensagem ou ID da ficha ausente.");
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
            renderDialogoDocumentacao(data.ficha.historicoDialogo);
            mensagemInputDocumentacao.value = '';

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            alert(`Erro ao enviar mensagem: ${error.message}`);
        }
    }

    // --- Event Listeners para o Modal de Documentação ---
    if (closeDocumentacaoModalBtn) {
        closeDocumentacaoModalBtn.addEventListener('click', () => {
            documentacaoModal.classList.add('hidden');
            mensagemInputDocumentacao.value = '';
            dialogoContentDocumentacao.innerHTML = '';
            documentacaoModal.removeAttribute('data-ficha-id'); // Limpa o data-attribute
        });
    }
    if (dialogoFormDocumentacao) {
        dialogoFormDocumentacao.addEventListener('submit', handleDialogoSubmitDocumentacao);
    }

    // --- Inicialização ---
    carregarFichas();
});