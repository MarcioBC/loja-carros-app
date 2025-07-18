document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const companyId = localStorage.getItem('companyId');
    const userId = localStorage.getItem('userId');

    // --- Verificação de Autenticação e Redirecionamento ---
    if (!token || !userRole || !userName || !companyId || !userId) {
        alert('Sessão expirada ou não autenticada. Faça login novamente.');
        localStorage.clear();
        window.location.href = '/';
        return;
    }

    // --- Elementos do DOM ---
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const logoutButton = document.getElementById('logoutButton'); // Botão de logout AGORA NA SIDEBAR
    const mainNav = document.getElementById('main-nav');

    // Cards do Dashboard
    const totalVehicles = document.getElementById('totalVehicles');
    const availableVehicles = document.getElementById('availableVehicles');
    const totalClients = document.getElementById('totalClients');
    const soldVehiclesMonth = document.getElementById('soldVehiclesMonth');
    const fichasEmAnaliseFn = document.getElementById('fichasEmAnaliseFn');
    const fichasAprovadas = document.getElementById('fichasAprovadas'); // NOVO CARD ID
    const fichasEmConferencia = document.getElementById('fichasEmConferencia');
    const fichasEmDocumentacao = document.getElementById('fichasEmDocumentacao');
    // const totalUsers = document.getElementById('totalUsers'); // REMOVIDO DAQUI, NÃO SERÁ MAIS UM CARD PRINCIPAL

    // Seção de Gerenciamento de Usuários (ainda existe para a tabela de usuários, se o gerente tiver acesso)
    const userManagementSection = document.getElementById('userManagementSection');
    const createUserBtn = document.getElementById('createUserBtn');
    const createUserForm = document.getElementById('createUserForm');
    const newUserForm = document.getElementById('newUserForm');
    const cancelCreateUserBtn = document.getElementById('cancelCreateUserBtn');
    const userCreationMessage = document.getElementById('userCreationMessage');
    const usersTableBody = document.getElementById('usersTableBody'); // A tabela de usuários ainda é populada

    // Elementos do Modal de Edição de Usuário (Existentes)
    const editUserModal = document.getElementById('editUserModal');
    const editUserForm = document.getElementById('editUserForm');
    const editUserId = document.getElementById('editUserId');
    const editUserCompanyId = document.getElementById('editUserCompanyId');
    const editUserEmail = document.getElementById('editUserEmail');
    const editUserName = document.getElementById('editUserName');
    const editUserRole = document.getElementById('editUserRole');
    const editUserPassword = document.getElementById('editUserPassword');
    const cancelEditUserBtn = document.getElementById('cancelEditUserBtn');
    const userEditMessage = document.getElementById('userEditMessage');


    // --- Funções Auxiliares (Existentes) ---
    function formatToBRL(value) {
        if (value === undefined || value === null || isNaN(value)) {
            return 'N/A';
        }
        return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

    // --- FUNÇÕES DE CARREGAMENTO E GERENCIAMENTO DE USUÁRIOS (Existentes) ---
    // A função loadUsers() ainda existe e carrega a tabela de usuários,
    // mas o card 'Total de Usuários' foi removido.
    async function loadUsers() {
        try {
            const response = await fetch(`/api/users?companyId=${companyId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('Sessão expirada ou não autorizado. Faça login novamente.');
                    localStorage.clear();
                    window.location.href = '/';
                    return;
                }
                throw new Error('Erro ao carregar usuários. Status: ' + response.status);
            }

            const users = await response.json();
            usersTableBody.innerHTML = '';

            if (users.length === 0) {
                usersTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhum usuário encontrado para esta empresa.</td></tr>`;
                return;
            }

            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-2 py-1">${user.email}</td>
                    <td class="px-2 py-1">${user.nome}</td>
                    <td class="px-2 py-1">${user.role ? user.role.toUpperCase() : 'N/A'}</td>
                    <td class="px-2 py-1">${companyNameDisplay ? companyNameDisplay.textContent : 'Carregando...'}</td>
                    <td class="px-2 py-1 text-center">
                        <button class="btn-edit-user text-blue-600 hover:text-blue-800 p-1 rounded-full" data-id="${user._id}" data-email="${user.email}" data-nome="${user.nome}" data-role="${user.role}" title="Editar Usuário">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        </button>
                        <button class="btn-delete-user text-red-600 hover:text-red-800 p-1 rounded-full ml-1" data-id="${user._id}" data-email="${user.email}" title="Excluir Usuário">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                    </td>
                `;
                usersTableBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-edit-user').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    const email = e.currentTarget.dataset.email;
                    const nome = e.currentTarget.dataset.nome;
                    const role = e.currentTarget.dataset.role;

                    editUserId.value = id;
                    editUserCompanyId.value = companyId;
                    editUserEmail.value = email;
                    editUserName.value = nome;
                    editUserRole.value = role;
                    editUserPassword.value = '';

                    clearMessage(userEditMessage);
                    editUserModal.classList.remove('hidden');
                });
            });

            document.querySelectorAll('.btn-delete-user').forEach(button => {
                button.addEventListener('click', (e) => deleteUser(e.currentTarget.dataset.id, e.currentTarget.dataset.email));
            });
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            usersTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Erro ao carregar usuários.</td></tr>`;
        }
    }

    async function deleteUser(userIdToDelete, emailToDelete) {
        if (!confirm(`Tem certeza que deseja excluir o usuário "${emailToDelete}"?`)) {
            return;
        }
        try {
            const response = await fetch(`/api/users/${userIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                alert(`Usuário "${emailToDelete}" excluído com sucesso!`);
                loadUsers();
                loadDashboardData();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erro ao excluir usuário.');
            }
        } catch (error) {
            console.error('Erro na requisição de exclusão de usuário:', error);
            alert('Erro ao conectar ao servidor para excluir usuário.');
        }
    }

    // --- Preencher Informações do Usuário no Cabeçalho (Existente) ---
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
        { name: 'Backup/Restaurar', href: '/backup.html', icon: 'cloud', roles: ['gerente'] },
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
            iconElement.classList.add('mr-3', 'w-5', 'h-5');
            link.appendChild(iconElement);

            const textSpan = document.createElement('span');
            textSpan.textContent = item.name;
            textSpan.classList.add('text-base');
            link.appendChild(textSpan);

            // Se for o item de gerenciamento de usuários para o gerente
            if (item.isSpecial && item.roles.includes('gerente')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    userManagementSection.classList.toggle('hidden');
                    if (!userManagementSection.classList.contains('hidden')) {
                        loadUsers(); // Carrega os usuários apenas quando a seção é aberta
                    }
                });
            }
            mainNav.appendChild(link);
        }
    });
    lucide.createIcons();
}

    renderMenu();

    // --- Lógica de Logout (Existente) ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.clear();
                window.location.href = '/';
            }
        });
    }

    // --- Carregar Dados do Dashboard (Gerencial) ---
    async function loadDashboardData() {
        try {
            // Requisições para dados gerais (veículos, clientes, fichas gerais)
            const [vehiclesResponse, clientsResponse, fichasGeralResponse, fichasVendasConcluidasResponse] = await Promise.all([
                fetch(`/api/vehicles?companyId=${companyId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/clients?companyId=${companyId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/fichas?companyId=${companyId}`, { headers: { 'Authorization': `Bearer ${token}` } }), // Para Análise/Conf/Doc
                fetch(`/api/fichas/vendas-concluidas?companyId=${companyId}`, { headers: { 'Authorization': `Bearer ${token}` } }) // Para Vendas Concluídas Mês
            ]);

            // Se o usuário é gerente, busca os usuários para a tabela de gerenciamento
            let usersData = [];
            if (userRole === 'gerente') {
                const usersResponse = await fetch(`/api/users?companyId=${companyId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (usersResponse.ok) {
                    usersData = await usersResponse.json();
                    // Não há mais um card 'Total de Usuários', mas o total ainda pode ser usado se precisar
                    // if (totalUsers) totalUsers.textContent = usersData.length;
                } else {
                    console.error('Erro ao carregar dados de usuários:', usersResponse.statusText);
                }
            }


            // Processar respostas
            if (vehiclesResponse.ok) {
                const vehiclesData = await vehiclesResponse.json();
                if (totalVehicles) totalVehicles.textContent = vehiclesData.length;
                const availableCount = vehiclesData.filter(v => v.status === 'DISPONÍVEL').length;
                if (availableVehicles) availableVehicles.textContent = availableCount;
            } else {
                console.error('Erro ao carregar dados de veículos:', vehiclesResponse.statusText);
            }

            if (clientsResponse.ok) {
                const clientsData = await clientsResponse.json();
                if (totalClients) totalClients.textContent = clientsData.length;
            } else {
                console.error('Erro ao carregar dados de clientes:', clientsResponse.statusText);
            }

            // --- CONTADOR DE VENDAS CONCLUÍDAS DO MÊS (AJUSTADO) ---
            if (fichasVendasConcluidasResponse.ok) {
                const vendasConcluidasData = await fichasVendasConcluidasResponse.json();
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                console.log('[DASHBOARD] Vendas Concluídas (RAW data):', vendasConcluidasData);
                console.log(`[DASHBOARD] Mês atual para filtro: ${currentMonth} (0=Jan), Ano: ${currentYear}`);

                const soldMonthCountFichas = vendasConcluidasData.filter(f => {
                    const fichaDate = new Date(f.createdAt);
                    const isValidDate = !isNaN(fichaDate.getTime());

                    const isCurrentMonthAndYear = isValidDate &&
                                                fichaDate.getMonth() === currentMonth &&
                                                fichaDate.getFullYear() === currentYear;
                    return isCurrentMonthAndYear;
                }).length;
                
                console.log('[DASHBOARD] Total de Vendas Concluídas filtradas para o mês:', soldMonthCountFichas);
                
                if (soldVehiclesMonth) {
                    soldVehiclesMonth.textContent = soldMonthCountFichas;
                }
            } else {
                console.error('Erro ao carregar fichas de vendas concluídas para o card:', fichasVendasConcluidasResponse.statusText);
                if (soldVehiclesMonth) soldVehiclesMonth.textContent = 'Erro';
            }
            // --- FIM CONTADOR DE VENDAS CONCLUÍDAS ---


            // Manter a contagem para os cards de Análise, Conferência e Documentação (usa fichasGeralResponse)
            if (fichasGeralResponse.ok) {
                const fichasDataGeral = await fichasGeralResponse.json();
                if (fichasEmAnaliseFn) fichasEmAnaliseFn.textContent = fichasDataGeral.filter(f => f.status === 'AGUARDANDO_ANALISE_FN' || f.status === 'EM_ANALISE_FN').length;
                // NOVO: Contagem de Fichas Aprovadas
                if (fichasAprovadas) fichasAprovadas.textContent = fichasDataGeral.filter(f => f.status === 'APROVADA_FN').length;
                if (fichasEmConferencia) fichasEmConferencia.textContent = fichasDataGeral.filter(f => f.status === 'AGUARDANDO_CONFERENCIA' || f.status === 'EM_CONFERENCIA').length;
                if (fichasEmDocumentacao) fichasEmDocumentacao.textContent = fichasDataGeral.filter(f => f.status === 'AGUARDANDO_DOCUMENTACAO' || f.status === 'PROCESSO_EM_TRANSFERENCIA').length; // Incluído PROCESSO_EM_TRANSFERENCIA
            } else {
                console.error('Erro ao carregar dados gerais de fichas:', fichasGeralResponse.statusText);
            }

        } catch (error) {
            console.error('Erro geral ao carregar dados do dashboard:', error);
            alert('Não foi possível carregar os dados do dashboard.');
        }
    }

    loadDashboardData();

    // --- Gerenciamento de Usuários (APENAS PARA GERENTE) ---
    if (userRole === 'gerente') {
        userManagementSection.classList.remove('hidden');
        createUserBtn.addEventListener('click', () => {
            createUserForm.classList.remove('hidden');
            clearMessage(userCreationMessage);
            newUserForm.reset();
        });
        cancelCreateUserBtn.addEventListener('click', () => {
            createUserForm.classList.add('hidden');
            clearMessage(userCreationMessage);
        });

        newUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newEmail = document.getElementById('newUsername').value;
            const newPassword = document.getElementById('newPassword').value;
            const newNome = document.getElementById('newNomeCompleto').value;
            const newUserRole = document.getElementById('newUserRole').value;

            clearMessage(userCreationMessage);

            try {
                const response = await fetch('/api/users/register-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        username: newEmail,
                        password: newPassword,
                        nomeCompleto: newNome,
                        role: newUserRole,
                        companyId: companyId
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    showMessage(userCreationMessage, 'Usuário criado com sucesso!', false);
                    newUserForm.reset();
                    createUserForm.classList.add('hidden');
                    loadUsers();
                    loadDashboardData();
                } else {
                    console.error('Erro detalhado na criação de usuário (backend):', data.message);
                    showMessage(userCreationMessage, data.message || 'Erro ao criar usuário.', true);
                }
            } catch (error) {
                console.error('Erro ao criar usuário:', error);
                showMessage(userCreationMessage, 'Erro ao conectar ao servidor para criar usuário.', true);
            }
        });
    }

    // --- Lógica do Modal de Edição de Usuário (Existente) ---
    if (cancelEditUserBtn) {
        cancelEditUserBtn.addEventListener('click', () => {
            editUserModal.classList.add('hidden');
            clearMessage(userEditMessage);
        });
    }

    if (editUserForm) {
        editUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = editUserId.value;
            const email = editUserEmail.value;
            const nome = editUserName.value;
            const role = editUserRole.value;
            const password = editUserPassword.value;
            const userCompanyId = editUserCompanyId.value;

            clearMessage(userEditMessage);

            try {
                const response = await fetch(`/api/users/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        nome,
                        email,
                        role,
                        password: password || undefined,
                        companyId: userCompanyId
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(userEditMessage, 'Usuário atualizado com sucesso!', false);
                    editUserModal.classList.add('hidden');
                    loadUsers();
                    loadDashboardData();
                } else {
                    console.error('Erro detalhado na atualização de usuário (backend):', data.message);
                    showMessage(userEditMessage, data.message || 'Erro ao atualizar usuário.', true);
                }
            } catch (error) {
                console.error('Erro na requisição de atualização de usuário:', error);
                showMessage(userEditMessage, 'Erro ao conectar ao servidor para atualizar usuário.', true);
            }
        });
    }
});