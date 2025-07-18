// public/js/clientes.js
document.addEventListener('DOMContentLoaded', async () => {
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

                // Se for o item de gerenciamento de usuários para o gerente, adicione o listener específico
                if (item.isSpecial && item.roles.includes('gerente')) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Assume que userManagementSection existe em um contexto maior ou redireciona
                        // Se não existe, esta linha pode causar erro. Vou mudar para um redirecionamento seguro.
                        window.location.href = '/gerenciar_usuarios.html'; // Redireciona para a página de gerenciamento
                    });
                }
                mainNav.appendChild(link);
            }
        });
        lucide.createIcons();
    }
    renderMenu();

    // --- Lógica de Logout ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.clear();
                window.location.href = '/';
            }
        });
    }

    // --- Elementos do DOM (CLIENTES - MAIN) ---
    const clientesTableBody = document.getElementById('clientesTableBody');
    const filtroClientesInput = document.getElementById('filtro-clientes');
    const btnCadastrarNovoCliente = document.getElementById('btnCadastrarNovoCliente');

    // --- Elementos do Modal de Cliente ---
    const clientModal = document.getElementById('clientModal');
    const modalTitleClient = document.getElementById('modalTitleClient');
    const clientForm = document.getElementById('clientForm');
    const cancelModalClientBtn = document.getElementById('cancelModalClientBtn');
    const closeModalClientBtn = document.getElementById('closeModalClientBtn');

    // Inputs do formulário de cliente
    const clientIdInput = document.getElementById('clientId');
    const companyIdClientHiddenInput = document.getElementById('companyIdClientHidden');
    const nomeCompletoInput = document.getElementById('nomeCompleto');
    const cpfInput = document.getElementById('cpf');
    const rgInput = document.getElementById('rg');
    const dataNascimentoInput = document.getElementById('dataNascimento');
    const emailInput = document.getElementById('email');
    const telefonePrincipalInput = document.getElementById('telefonePrincipal');
    const telefoneSecundarioInput = document.getElementById('telefoneSecundario');
    const profissaoInput = document.getElementById('profissao');
    const estadoCivilSelect = document.getElementById('estadoCivil');

    // Endereço
    const ruaInput = document.getElementById('rua');
    const numeroInput = document.getElementById('numero');
    const complementoInput = document.getElementById('complemento');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const estadoInput = document.getElementById('estado');
    const cepInput = document.getElementById('cep');

    const clientMessageDiv = document.getElementById('clientMessage');


    // --- Funções Auxiliares para Clientes ---

    // Máscaras de Input
    function applyCpfMask(value) {
        value = String(value).replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return value;
    }
    function applyPhoneMask(value) {
        value = String(value).replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        return value;
    }
    function applyCepMask(value) {
        value = String(value).replace(/\D/g, '');
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        return value;
    }

    // Função para buscar endereço por CEP
    async function buscarEnderecoPorCep(cep) {
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) {
            // Se o CEP é inválido/incompleto, remove readonly e limpa
            setClientFieldsReadonly(false); // Permite edição de todos os campos
            ruaInput.value = '';
            numeroInput.value = '';
            complementoInput.value = '';
            bairroInput.value = '';
            cidadeInput.value = '';
            estadoInput.value = '';
            // Não precisa mais remover readonly aqui individualmente
            console.log('CEP inválido para busca ou não completo:', cep);
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = await response.json();

            if (response.ok && !data.erro) {
                ruaInput.value = data.logradouro || '';
                bairroInput.value = data.bairro || '';
                cidadeInput.value = data.localidade || '';
                estadoInput.value = data.uf || '';
                // Complemento não é preenchido pelo CEP, apenas limpo ou mantido
                numeroInput.focus();

                // Define campos de endereço como readonly (autocompletados)
                ruaInput.setAttribute('readonly', true);
                bairroInput.setAttribute('readonly', true);
                cidadeInput.setAttribute('readonly', true);
                estadoInput.setAttribute('readonly', true);
                // Outros campos do cliente permanecem editáveis se o CPF não foi encontrado
                // ou se já foram setados como editáveis antes.
            } else {
                console.warn('CEP não encontrado ou erro na API ViaCEP:', data.erro ? 'CEP inválido na API.' : 'Erro na requisição da API.');
                alert('CEP não encontrado ou inválido. Por favor, digite o endereço manualmente.');
                // Permite edição manual de todos os campos de endereço
                ruaInput.value = '';
                numeroInput.value = '';
                complementoInput.value = '';
                bairroInput.value = '';
                cidadeInput.value = '';
                estadoInput.value = '';
                ruaInput.focus();

                ruaInput.removeAttribute('readonly');
                bairroInput.removeAttribute('readonly');
                cidadeInput.removeAttribute('readonly');
                estadoInput.removeAttribute('readonly');
            }
        } catch (error) {
            console.error('Erro ao buscar endereço pelo CEP:', error);
            alert('Erro ao buscar endereço. Verifique sua conexão ou digite manualmente.');
            ruaInput.focus();
            ruaInput.removeAttribute('readonly');
            bairroInput.removeAttribute('readonly');
            cidadeInput.removeAttribute('readonly');
            estadoInput.removeAttribute('readonly');
        }
    }

    // Nova função para controlar o estado de readonly dos campos do cliente
    function setClientFieldsReadonly(isReadonly) {
        const clientPersonalFields = [
            nomeCompletoInput, rgInput, dataNascimentoInput, emailInput,
            telefonePrincipalInput, telefoneSecundarioInput, profissaoInput, estadoCivilSelect,
            ruaInput, numeroInput, complementoInput, bairroInput, cidadeInput, estadoInput
        ];

        clientPersonalFields.forEach(field => {
            if (field) { // Garante que o elemento exista
                if (isReadonly) {
                    field.setAttribute('readonly', true);
                    field.classList.add('bg-gray-100'); // Adiciona estilo de campo bloqueado
                } else {
                    field.removeAttribute('readonly');
                    field.classList.remove('bg-gray-100'); // Remove estilo de campo bloqueado
                }
            }
        });
        // O campo CPF deve ser sempre editável, exceto talvez em modo de visualização,
        // mas para a busca e preenchimento manual, ele deve ser editável.
        cpfInput.removeAttribute('readonly');
        cpfInput.classList.remove('bg-gray-100');
    }


    // Listeners para máscaras
    cpfInput.addEventListener('input', (e) => { e.target.value = applyCpfMask(e.target.value); });
    telefonePrincipalInput.addEventListener('input', (e) => { e.target.value = applyPhoneMask(e.target.value); });
    telefoneSecundarioInput.addEventListener('input', (e) => { e.target.value = applyPhoneMask(e.target.value); });
    cepInput.addEventListener('input', (e) => { e.target.value = applyCepMask(e.target.value); });
    estadoInput.addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
    emailInput.addEventListener('input', (e) => { e.target.value = e.target.value.toLowerCase(); });

    // Listener para buscar endereço quando o campo CEP perde o foco
    cepInput.addEventListener('blur', (e) => {
        buscarEnderecoPorCep(e.target.value);
    });


    cpfInput.addEventListener('blur', async (e) => {
        const cpf = String(e.target.value).replace(/\D/g, '');
        if (cpf.length !== 11) {
            console.log('CPF incompleto para busca automática.');
            clearClientPersonalFields(); // Limpa e habilita edição
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
                clientIdInput.value = client._id;
                nomeCompletoInput.value = client.nomeCompleto || '';
                rgInput.value = client.rg || '';
                dataNascimentoInput.value = client.dataNascimento ? new Date(client.dataNascimento).toISOString().split('T')[0] : '';
                emailInput.value = client.email || '';
                telefonePrincipalInput.value = applyPhoneMask(client.telefonePrincipal || '');
                telefoneSecundarioInput.value = applyPhoneMask(client.telefoneSecundario || '');
                profissaoInput.value = client.profissao || '';
                estadoCivilSelect.value = client.estadoCivil || '';

                if (client.endereco) {
                    cepInput.value = applyCepMask(client.endereco.cep || '');
                    ruaInput.value = client.endereco.rua || '';
                    numeroInput.value = client.endereco.numero || '';
                    complementoInput.value = client.endereco.complemento || '';
                    bairroInput.value = client.endereco.bairro || '';
                    cidadeInput.value = client.endereco.localidade || client.endereco.cidade || '';
                    estadoInput.value = client.endereco.uf || client.endereco.estado || '';
                } else {
                    limparEnderecoResidencialInputs(); // Apenas endereço, mantém outros campos preenchidos
                }
                showMessage(clientMessageDiv, 'Cliente existente carregado automaticamente! Alguns campos estão bloqueados para edição.', false);
                setClientFieldsReadonly(true); // BLOQUEIA CAMPOS AUTOPREENCHIDOS
            } else {
                console.log('Cliente não encontrado para este CPF. Prossiga com o preenchimento manual.');
                showMessage(clientMessageDiv, 'CPF não encontrado. Preencha os dados do cliente manualmente.', false);
                clearClientPersonalFields(); // Limpa e habilita edição de todos
                setClientFieldsReadonly(false); // HABILITA EDIÇÃO DE TODOS OS CAMPOS
            }
        } catch (error) {
            console.error('Erro na busca de cliente por CPF:', error);
            showMessage(clientMessageDiv, 'Erro ao buscar cliente por CPF. Tente novamente.', true);
            clearClientPersonalFields(); // Limpa e habilita edição de todos
            setClientFieldsReadonly(false); // HABILITA EDIÇÃO DE TODOS OS CAMPOS
        }
    });

    // Limpa campos pessoais e de endereço, e os torna editáveis
    function clearClientPersonalFields() {
        clientIdInput.value = '';
        // companyIdClientHiddenInput.value = ''; // Não limpar, pois é um campo de controle
        nomeCompletoInput.value = '';
        rgInput.value = '';
        dataNascimentoInput.value = '';
        emailInput.value = '';
        telefonePrincipalInput.value = '';
        telefoneSecundarioInput.value = '';
        profissaoInput.value = '';
        estadoCivilSelect.value = '';
        limparEnderecoResidencialInputs(); // Esta já torna editáveis os campos de endereço
        // setClientFieldsReadonly(false); // Já é chamado no bloco principal após a falha na busca
    }

    function limparEnderecoResidencialInputs() {
        cepInput.value = '';
        ruaInput.value = '';
        numeroInput.value = '';
        complementoInput.value = '';
        bairroInput.value = '';
        cidadeInput.value = '';
        estadoInput.value = '';
        // Garante que os campos de endereço fiquem editáveis
        ruaInput.removeAttribute('readonly');
        bairroInput.removeAttribute('readonly');
        cidadeInput.removeAttribute('readonly');
        estadoInput.removeAttribute('readonly');
    }

    // Montar linha da tabela de clientes
    function montarLinhaCliente(client) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-2 py-1">${client.nomeCompleto || ''}</td>
            <td class="px-2 py-1">${applyCpfMask(client.cpf || '')}</td>
            <td class="px-2 py-1">${applyPhoneMask(client.telefonePrincipal || '')}</td>
            <td class="px-2 py-1">${client.email || ''}</td>
            <td class="px-2 py-1">${client.endereco && client.endereco.cidade && client.endereco.estado ? `${client.endereco.cidade}/${client.endereco.estado}` : 'N/A'}</td>
            <td class="px-2 py-1 text-center space-x-2">
                <button class="btn-editar-cliente" title="Editar" data-id="${client._id}" style="background:none; border:none; cursor:pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button class="btn-excluir-cliente" title="Excluir" data-id="${client._id}" style="background:none; border:none; cursor:pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14H7L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M4 6l1-3h14l1 3"></path></svg>
                </button>
            </td>
        `;
        return tr;
    }

    // Função para carregar e exibir clientes
    async function carregarClientes() {
        try {
            const response = await fetch(`/api/clients?companyId=${companyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                alert('Sessão expirada ou não autorizado. Faça login novamente.');
                localStorage.clear();
                window.location.href = '/';
                return;
            }
            if (!response.ok) throw new Error('Erro ao carregar clientes.');

            const clients = await response.json();
            clientesTableBody.innerHTML = ''; // Limpa a tabela

            const filtro = filtroClientesInput.value.toLowerCase();

            clients.forEach(client => {
                const textoBusca = `${client.nomeCompleto || ''} ${client.cpf || ''} ${client.telefonePrincipal || ''} ${client.email || ''} ${client.endereco ? client.endereco.cidade : ''} ${client.endereco ? client.endereco.estado : ''}`.toLowerCase();
                if (!filtro || textoBusca.includes(filtro)) {
                    clientesTableBody.appendChild(montarLinhaCliente(client));
                }
            });

            // Adicionar listeners para botões de edição e exclusão (FUTURAMENTE VÃO CHAMAR AS FUNÇÕES ABAIXO)
            document.querySelectorAll('.btn-editar-cliente').forEach(btn => {
                btn.addEventListener('click', () => editarCliente(btn.dataset.id));
            });
            document.querySelectorAll('.btn-excluir-cliente').forEach(btn => {
                btn.addEventListener('click', () => excluirCliente(btn.dataset.id));
            });

        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            alert('Não foi possível carregar os clientes.');
        }
    }

    // CHAMADA INICIAL: Carrega clientes ao carregar a página
    carregarClientes();

    // Event listeners para o formulário e modal
    btnCadastrarNovoCliente.addEventListener('click', () => {
        modalTitleClient.textContent = 'Cadastrar Novo Cliente';
        clientIdInput.value = ''; // Limpa o ID para um novo cadastro
        companyIdClientHiddenInput.value = companyId; // Define o companyId
        limparFormularioCliente(); // Limpa todos os campos
        setClientFieldsReadonly(false); // Garante que todos os campos sejam editáveis para novo cadastro
        clientModal.classList.remove('hidden');

        // Garante que campos de endereço sejam editáveis ao abrir para novo cadastro
        // Já tratado por setClientFieldsReadonly(false);
    });

    // Listener de eventos no próprio modal para cliques nos botões de fechar e cancelar
    clientModal.addEventListener('click', (e) => {
        const clickedElement = e.target;
        const isCancelBtn = clickedElement.id === 'cancelModalClientBtn' || clickedElement.closest('#cancelModalClientBtn');
        const isCloseBtn = clickedElement.id === 'closeModalClientBtn' || clickedElement.closest('#closeModalClientBtn');

        if (isCancelBtn || isCloseBtn) {
            e.preventDefault();
            console.log('Botão de fechar/cancelar do modal de cliente clicado.');
            handleCloseClientModal();
        } else if (clickedElement === clientModal) {
            console.log('Clique fora do conteúdo do modal na overlay.');
            handleCloseClientModal();
        }
    });

    // Função para fechar o modal e recarregar clientes
    function handleCloseClientModal() {
        console.log('handleCloseClientModal sendo executado.');
        clientModal.classList.add('hidden');
        limparFormularioCliente();
        clientMessageDiv.classList.add('hidden'); // Oculta mensagens de feedback
        clientMessageDiv.textContent = ''; // Limpa o texto da mensagem
        filtroClientesInput.value = ''; // Limpa o filtro
        carregarClientes();
    }

    // Limpa o formulário do cliente e define campos como editáveis
    function limparFormularioCliente() {
        clientForm.reset();
        clientIdInput.value = '';
        companyIdClientHiddenInput.value = companyId; // Mantém o companyId definido
        setClientFieldsReadonly(false); // Torna todos os campos editáveis
        clientMessageDiv.classList.add('hidden');
        clientMessageDiv.textContent = '';
    }


    // Submit do formulário de cliente (cadastrar/editar)
    clientForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const clientId = clientIdInput.value;
        const url = clientId ? `/api/clients/${clientId}` : '/api/clients';
        const method = clientId ? 'PUT' : 'POST';

        const dadosCliente = {
            nomeCompleto: nomeCompletoInput.value.trim(),
            cpf: cpfInput.value.replace(/\D/g, ''),
            rg: rgInput.value.trim(),
            dataNascimento: dataNascimentoInput.value || undefined,
            email: emailInput.value.trim(),
            telefonePrincipal: telefonePrincipalInput.value.replace(/\D/g, ''),
            telefoneSecundario: telefoneSecundarioInput.value.replace(/\D/g, ''),
            profissao: profissaoInput.value.trim(),
            estadoCivil: estadoCivilSelect.value,
            endereco: {
                rua: ruaInput.value.trim(),
                numero: numeroInput.value.trim(),
                complemento: complementoInput.value.trim(),
                bairro: bairroInput.value.trim(),
                cidade: cidadeInput.value.trim(),
                estado: estadoInput.value.trim(),
                cep: cepInput.value.replace(/\D/g, '')
            },
            companyId: companyIdClientHiddenInput.value
        };

        // Remove campos de endereço vazios para evitar validação de `required` no backend para campos opcionais
        if (dadosCliente.endereco) {
            for (const key in dadosCliente.endereco) {
                if (dadosCliente.endereco[key] === '' || dadosCliente.endereco[key] === null || dadosCliente.endereco[key] === undefined) {
                    delete dadosCliente.endereco[key];
                }
            }
            // Se todos os campos de endereço estiverem vazios, delete o objeto endereco para não enviar um objeto vazio
            if (Object.keys(dadosCliente.endereco).length === 0) {
                delete dadosCliente.endereco;
            }
        }


        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dadosCliente)
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || `Cliente ${clientId ? 'atualizado' : 'cadastrado'} com sucesso!`);
                handleCloseClientModal();
            } else {
                console.error('Erro detalhado do backend:', data.message);
                alert(data.message || `Erro ao ${clientId ? 'atualizar' : 'cadastrar'} cliente.`);
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            alert(`Erro ao conectar ao servidor para ${clientId ? 'atualizar' : 'cadastrar'} cliente.`);
        }
    });

    // Filtro de Clientes (Input de Pesquisa)
    filtroClientesInput.addEventListener('input', () => {
        carregarClientes();
    });

    // Funções para editar e excluir (IMPLEMENTAÇÃO COMPLETA)
    async function editarCliente(id) {
        // Limpa mensagens anteriores
        clientMessageDiv.classList.add('hidden');
        clientMessageDiv.textContent = '';
        limparFormularioCliente(); // Garante que campos estão limpos e editáveis antes de carregar

        try {
            // 1. Buscar os dados do cliente pelo ID
            const response = await fetch(`/api/clients/${id}`, {
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
                throw new Error(errorData.message || 'Erro ao buscar dados do cliente para edição.');
            }

            const client = await response.json();
            console.log('Dados do cliente para edição:', client);

            // 2. Preencher o modal com os dados do cliente
            modalTitleClient.textContent = 'Editar Cliente';
            clientIdInput.value = client._id || '';
            companyIdClientHiddenInput.value = client.companyId || companyId;

            nomeCompletoInput.value = client.nomeCompleto || '';
            cpfInput.value = applyCpfMask(client.cpf || '');
            rgInput.value = client.rg || '';
            dataNascimentoInput.value = client.dataNascimento ? new Date(client.dataNascimento).toISOString().split('T')[0] : '';
            emailInput.value = client.email || '';
            telefonePrincipalInput.value = applyPhoneMask(client.telefonePrincipal || '');
            telefoneSecundarioInput.value = applyPhoneMask(client.telefoneSecundario || '');
            profissaoInput.value = client.profissao || '';
            estadoCivilSelect.value = client.estadoCivil || '';

            ruaInput.value = client.endereco ? client.endereco.rua || '' : '';
            numeroInput.value = client.endereco ? client.endereco.numero || '' : '';
            complementoInput.value = client.endereco ? client.endereco.complemento || '' : '';
            bairroInput.value = client.endereco ? client.endereco.bairro || '' : '';
            cidadeInput.value = client.endereco ? client.endereco.cidade || '' : '';
            estadoInput.value = client.endereco ? client.endereco.estado || '' : '';
            cepInput.value = applyCepMask(client.endereco ? client.endereco.cep || '' : '');

            // Ao editar, o CPF não deve ser alterável para não desvincular o cliente (se o ID for mantido)
            // Ou, se o CPF for a chave, e houver restrições no backend, deve-se considerar isso.
            // Por enquanto, vamos manter o CPF editável, mas outros campos bloqueados se vierem da busca.
            // Para edição, os campos devem ser editáveis
            setClientFieldsReadonly(false); // Torna todos os campos editáveis para edição
            // Se o endereço veio preenchido pelo ViaCEP anteriormente e você quer manter ele readonly
            // então essa lógica precisa ser mais granular aqui.
            // Por simplicidade, ao editar, todos os campos ficam editáveis.

            // 3. Abrir o modal
            clientModal.classList.remove('hidden');

        } catch (error) {
            console.error('Erro ao editar cliente:', error);
            alert('Não foi possível carregar os dados do cliente para edição: ' + error.message);
        }
    }

    async function excluirCliente(id) {
        if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação é irreversível!')) {
            return;
        }
        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message || 'Cliente excluído com sucesso!');
                carregarClientes(); // Recarrega a lista após exclusão
            } else {
                console.error('Erro detalhado do backend na exclusão:', data.message);
                alert(data.message || 'Erro ao excluir cliente.');
            }
        } catch (error) {
            console.error('Erro na requisição de exclusão:', error);
            alert('Erro ao conectar ao servidor para excluir cliente.');
        }
    }
});