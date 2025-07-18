// public/js/consultar_fichas_salva.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Variáveis de Local Storage ---
    const token = localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const companyId = localStorage.getItem('companyId');
    const userId = localStorage.getItem('userId'); // O ID do vendedor logado

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

    // --- Lógica do Menu Lateral Dinâmico ---
    const menuItems = [
        { name: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard', roles: ['vendedor', 'fn', 'conferente', 'documentacao', 'gerente'] },
        { name: 'Preparação', href: '#', icon: 'wrench', roles: ['gerente'] },
        { name: 'Manutenção', href: '#', icon: 'hammer', roles: ['gerente'] },
        { name: 'Nosso Estoque', href: '/estoque', icon: 'package', roles: ['vendedor', 'gerente'] },
        { name: 'Clientes', href: '/clientes.html', icon: 'users', roles: ['vendedor', 'gerente'] },
        { name: 'Vender', href: '/vender.html', icon: 'tag', roles: ['vendedor', 'gerente'] },
        { name: 'Vendas', href: '/veiculos_vendidos.html', icon: 'currency-dollar', roles: ['vendedor', 'gerente'] },
        { name: 'Ficha Cadastral', href: '/ficha_cadastral.html', icon: 'file-text', roles: ['vendedor', 'gerente'] },
        { name: 'Análise de Crédito', href: '/analise_credito.html', icon: 'wallet', roles: ['fn', 'gerente'] },
        { name: 'Conferência', href: '/conferencia.html', icon: 'clipboard-list', roles: ['conferente', 'gerente'] },
        { name: 'Documentação', href: '/documentacao.html', icon: 'file-check', roles: ['documentacao', 'gerente'] },
        { name: 'Arquivo', href: '/arquivo.html', icon: 'archive', roles: ['gerente'] },
        { name: 'Gerenciar Usuários', href: '/dashboard#userManagement', icon: 'user-cog', roles: ['gerente'], isSpecial: true }
    ];

    function renderMenu() {
        mainNav.innerHTML = '';
        menuItems.forEach(item => {
            if (item.roles.includes(userRole)) {
                const isActive = window.location.pathname === item.href ||
                                 (window.location.pathname === '/dashboard' && item.href.startsWith('/dashboard#'));
                const link = document.createElement('a');
                link.href = item.href;
                link.classList.add('block', 'py-2.5', 'px-4', 'rounded', 'transition', 'duration-200', 'hover:bg-gray-700', 'flex', 'items-center', 'gap-3');
                if (isActive) {
                    link.classList.add('active-link');
                }
                link.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${item.icon}">
                        </svg>
                    ${item.name}
                `;
                if (item.isSpecial) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.location.href = item.href;
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

    // --- Elementos do DOM (CONSULTAR FICHAS SALVAS - MAIN) ---
    const fichasSalvasTableBody = document.getElementById('fichasSalvasTableBody');
    const filtroFichasSalvasInput = document.getElementById('filtro-fichas-salvas');
    const filtroStatusFichasSelect = document.getElementById('filtro-status-fichas');

    // --- Funções Auxiliares (Máscaras) ---
    // Copiadas de ficha_cadastral.js ou clientes.js
    function applyCpfMask(value) {
        value = value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return value;
    }
    function applyPhoneMask(value) {
        value = value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        return value;
    }

    // --- Lógica de Tabela de Fichas Salvas (Listagem) ---
    function montarLinhaFichaSalva(ficha) {
        const tr = document.createElement('tr');
        // Usa dados populados se existirem, senão usa snapshot da ficha
        const clienteNome = ficha.clienteId && ficha.clienteId.nomeCompleto ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente;
        const clienteCpf = ficha.clienteId && ficha.clienteId.cpf ? ficha.clienteId.cpf : ficha.cpfCliente;
        const clienteTel = ficha.clienteId && ficha.clienteId.telefonePrincipal ? ficha.clienteId.telefonePrincipal : ficha.telefonePrincipalCliente;
        
        const veiculoInfo = ficha.veiculoInteresse && ficha.veiculoInteresse.marcaModelo ? 
                            `${ficha.veiculoInteresse.marcaModelo} (${ficha.veiculoInteresse.placa || 'N/A'})` : 'N/A';
        
        let statusClass = 'text-gray-700';
        let statusText = ficha.status ? ficha.status.replace(/_/g, ' ') : 'N/A';
        
        // Cores para status (copiado de ficha_cadastral.js)
        if (ficha.status === 'AGUARDANDO_ANALISE_FN') statusClass = 'text-yellow-600 font-semibold';
        else if (ficha.status === 'EM_ANALISE_FN') statusClass = 'text-blue-500 font-semibold';
        else if (ficha.status === 'APROVADA_FN') statusClass = 'text-green-600 font-semibold';
        else if (ficha.status === 'REPROVADA_FN' || ficha.status === 'CANCELADA') statusClass = 'text-red-600 font-semibold';
        else if (ficha.status === 'FINALIZADA') statusClass = 'text-purple-600 font-semibold';
        else if (ficha.status === 'DEVOLVIDA_AO_VENDEDOR') statusClass = 'text-orange-600 font-semibold';
        else if (ficha.status === 'CONFERIDA' || ficha.status === 'AGUARDANDO_DOCUMENTACAO') statusClass = 'text-teal-600 font-semibold';
        else if (ficha.status === 'EM_CONFERENCIA' || ficha.status === 'EM_DOCUMENTACAO') statusClass = 'text-indigo-600 font-semibold';
        else if (ficha.status === 'SALVO_PARA_VENDEDOR') statusClass = 'text-gray-500 font-semibold'; // Rascunho

        tr.innerHTML = `
            <td class="px-2 py-1">${new Date(ficha.createdAt).toLocaleDateString('pt-BR')}</td>
            <td class="px-2 py-1">${clienteNome || ''}</td>
            <td class="px-2 py-1">${applyCpfMask(clienteCpf || '')}</td>
            <td class="px-2 py-1">${applyPhoneMask(clienteTel || '')}</td>
            <td class="px-2 py-1">${veiculoInfo}</td>
            <td class="px-2 py-1 ${statusClass}">${statusText}</td>
            <td class="px-2 py-1 text-center space-x-2">
                <button class="btn-visualizar-ficha" title="Visualizar Ficha" data-id="${ficha._id}" style="background:none; border:none; cursor:pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button class="btn-editar-ficha" title="Editar Ficha" data-id="${ficha._id}" ${ficha.podeSerEditadaPeloVendedor ? '' : 'disabled'} style="background:none; border:none; cursor:pointer; ${ficha.podeSerEditadaPeloVendedor ? '' : 'opacity: 0.5; cursor: not-allowed;'}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button class="btn-excluir-ficha" title="Excluir Ficha" data-id="${ficha._id}" ${userRole === 'gerente' ? '' : 'disabled'} style="background:none; border:none; cursor:pointer; ${userRole === 'gerente' ? '' : 'opacity: 0.5; cursor: not-allowed;'}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14H7L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M4 6l1-3h14l1 3"></path></svg>
                </button>
            </td>
        `;
        return tr;
    }

    async function carregarFichasSalvas() {
        try {
            // Construir a URL com filtros
            let fetchUrl = `/api/fichas?companyId=${companyId}`;
            const filtroTexto = filtroFichasSalvasInput.value.toLowerCase();
            const filtroStatus = filtroStatusFichasSelect.value;

            // OBS: O backend (fichaRoutes.js) já filtra por userId se o role for 'vendedor'.
            // Então, o filtro aqui no frontend será apenas para texto e status
            if (filtroStatus) {
                fetchUrl += `&status=${filtroStatus}`;
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
            if (!response.ok) throw new Error('Erro ao carregar fichas salvas.');

            const fichas = await response.json();
            fichasSalvasTableBody.innerHTML = '';

            const filteredFichas = fichas.filter(ficha => {
                const clienteNome = ficha.clienteId ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente;
                const clienteCpf = ficha.clienteId ? ficha.clienteId.cpf : ficha.cpfCliente;
                const textoBusca = `${clienteNome || ''} ${clienteCpf || ''}`.toLowerCase();
                return textoBusca.includes(filtroTexto);
            });

            if (filteredFichas.length === 0) {
                fichasSalvasTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-gray-500">Nenhuma ficha encontrada com os filtros aplicados.</td></tr>`;
                return;
            }

            filteredFichas.forEach(ficha => {
                fichasSalvasTableBody.appendChild(montarLinhaFichaSalva(ficha));
            });

            // Adicionar listeners para botões (editar/excluir/visualizar)
            document.querySelectorAll('.btn-visualizar-ficha').forEach(btn => {
                btn.addEventListener('click', () => visualizarFicha(btn.dataset.id));
            });
            document.querySelectorAll('.btn-editar-ficha').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Redireciona para a página de Ficha Cadastral com o ID para edição
                    window.location.href = `/ficha_cadastral.html?id=${btn.dataset.id}`;
                });
            });
            document.querySelectorAll('.btn-excluir-ficha').forEach(btn => {
                btn.addEventListener('click', () => excluirFicha(btn.dataset.id));
            });

        } catch (error) {
            console.error('Erro ao carregar fichas salvas:', error);
            alert('Não foi possível carregar as fichas salvas.');
        }
    }

    // Chamadas iniciais para carregar fichas e aplicar filtros
    carregarFichasSalvas();
    filtroFichasSalvasInput.addEventListener('input', carregarFichasSalvas);
    filtroStatusFichasSelect.addEventListener('change', carregarFichasSalvas);

    // Funções de Ação (Visualizar, Excluir)
    async function visualizarFicha(id) {
        // Esta função abriria um modal de visualização ou redirecionaria para uma tela de detalhes.
        // Por enquanto, vamos redirecionar para a página de cadastro em modo de edição/visualização.
        window.location.href = `/ficha_cadastral.html?id=${id}`;
    }

    async function excluirFicha(id) {
        if (!confirm('Tem certeza que deseja excluir esta ficha? Esta ação é irreversível e também pode liberar o veículo reservado!')) {
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
                carregarFichasSalvas(); // Recarrega a lista
            } else {
                console.error('Erro detalhado do backend na exclusão:', data.message);
                alert(data.message || 'Erro ao excluir ficha.');
            }
        } catch (error) {
            console.error('Erro na requisição de exclusão:', error);
            alert('Erro ao conectar ao servidor para excluir ficha.');
        }
    }
});