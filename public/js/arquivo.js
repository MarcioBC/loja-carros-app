// public/js/arquivo.js - Baseado em conferencia.js e vendas_realizadas.js para padronização
document.addEventListener('DOMContentLoaded', async () => {
    // --- Variáveis de Local Storage ---
    const token = localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const companyId = localStorage.getItem('companyId');
    const userId = localStorage.getItem('userId');

    // --- Verificação de Autenticação e Redirecionamento ---
    // Apenas Gerente pode acessar esta página (ou roles que você definir)
    if (!token || !userRole || !userName || !companyId || !userId || !['gerente'].includes(userRole)) {
        alert('Acesso negado. Faça login com um perfil autorizado (Gerente).');
        localStorage.clear();
        window.location.href = '/';
        return;
    }

    // --- Elementos do DOM (CABEÇALHO COM INFORMAÇÕES DO USUÁRIO) ---
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const companyNameDisplay = document.getElementById('companyNameDisplay'); // ID companyNameDisplay do HTML
    const logoutButton = document.getElementById('logoutButton');
    const mainNav = document.getElementById('main-nav'); // Elemento para o menu

    // --- Elementos do Sidebar ---
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    
    // --- Elementos da Tabela Principal ---
    const fichasArquivoTableBody = document.getElementById('fichasArquivoTableBody');
    const filtroFichasArquivoInput = document.getElementById('filtroFichasArquivo');

    // --- Funções Auxiliares Comuns (Copiadas e Padronizadas) ---
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
            } else {
                companyNameDisplay.textContent = 'N/A';
            }
        } catch (e) { 
            console.error('Erro ao buscar nome da empresa:', e); 
            companyNameDisplay.textContent = 'N/A'; 
        }
    }
    fetchCompanyName();

    // --- Lógica do Menu Lateral Dinâmico (Copiada e Padronizada) ---
    function renderMenu() {
        if (!mainNav) {
            console.error("Elemento mainNav não encontrado!");
            return;
        }
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
        mainNav.innerHTML = ''; // Limpa o menu antes de renderizar
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

                // No arquivo.js, não há a seção de Gerenciar Usuários como um toggle
                // então não precisa do 'if (item.isSpecial && item.roles.includes('gerente'))' especial aqui
                mainNav.appendChild(link); // Adiciona o link normalmente
            }
        });
        lucide.createIcons(); // ESSENCIAL: Esta linha deve permanecer aqui, fora do forEach, no final da renderMenu
    }
    renderMenu(); // Chamar a função ao carregar a página

    // --- Lógica do Sidebar (Abre e Fecha) e Modal Overflow (Copiada e Padronizada) ---
    lucide.createIcons(); // Garante que os ícones do Lucide sejam criados
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
    // Adiciona classe para desabilitar scroll do body quando modal está aberto
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.attributeName === 'class') {
                    if (modal.classList.contains('hidden')) {
                        document.body.classList.remove('modal-open', 'overflow-hidden');
                    } else {
                        document.body.classList.add('modal-open');
                        if (window.innerWidth < 768) { // Apenas em telas pequenas para evitar scroll no body
                            document.body.classList.add('overflow-hidden');
                        }
                    }
                }
            }
        });
        observer.observe(modal, { attributes: true });
    });
    window.dispatchEvent(new Event('resize')); // Dispara o evento de redimensionamento para inicializar o estado

    // --- Lógica de Logout (Copiada e Padronizada) ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.clear();
                window.location.href = '/';
            }
        });
    }

    // --- FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO DA TABELA DE FICHAS ARQUIVADAS ---
    async function carregarFichasArquivadas() {
        if (!fichasArquivoTableBody) {
            console.error("Elemento fichasArquivoTableBody não encontrado!");
            return;
        }
        fichasArquivoTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-gray-500">A carregar fichas arquivadas...</td></tr>`;

        try {
            // Rota para buscar fichas finalizadas
            let fetchUrl = `/api/fichas/arquivo?companyId=${companyId}`;
            const filtroTexto = filtroFichasArquivoInput.value.toLowerCase();
            
            // Adicionar o filtro de busca ao URL se houver texto
            if (filtroTexto) {
                fetchUrl += `&search=${filtroTexto}`;
            }

            console.log(`[ARQUIVO.JS] Buscando fichas em: ${fetchUrl}`); // Log da URL de busca

            const response = await fetch(fetchUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                alert('Sessão expirada ou não autorizado. Faça login novamente.');
                localStorage.clear();
                window.location.href = '/';
                return;
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || 'Falha ao buscar fichas arquivadas.');
            }

            const fichas = await response.json();
            console.log('[ARQUIVO.JS] Fichas recebidas do backend:', fichas); // Log das fichas recebidas
            renderTabelaArquivadas(fichas); // Não precisa mais passar filtroTexto para a renderização, pois o backend já filtra

        } catch (error) {
            console.error('Erro ao carregar fichas arquivadas:', error);
            fichasArquivoTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-red-500 p-4">Erro ao carregar fichas arquivadas: ${error.message}.</td></tr>`;
        }
    }

    function renderTabelaArquivadas(fichas) { // Removido filtroTexto do parâmetro, pois já é filtrado no backend
        fichasArquivoTableBody.innerHTML = '';
        

        if (fichas.length === 0) {
            fichasArquivoTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-gray-500">Nenhuma ficha arquivada encontrada.</td></tr>`;
            return;
        }

        fichas.forEach(ficha => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';
            const clienteNome = ficha.clienteId?.nomeCompleto || ficha.nomeCompletoCliente || 'N/A';
            const clienteCpf = ficha.clienteId?.cpf || ficha.cpfCliente || 'N/A';
            
            const veiculoInfoDisplay = ficha.veiculoInteresse?.veiculoId ? 
                `${ficha.veiculoInteresse.veiculoId.modelo || 'N/A'} (${ficha.veiculoInteresse.veiculoId.placa || 'N/A'})` :
                (ficha.veiculoInteresse?.marcaModelo ? `${ficha.veiculoInteresse.marcaModelo} (${ficha.veiculoInteresse.placa || 'N/A'})` : 'N/A');

            const vendedorNome = ficha.cadastradoPor ? ficha.cadastradoPor.nome : 'N/A';
            // Para Data Finalização, usaremos updatedAt, que é a última atualização, incluindo o status FINALIZADA
            const dataFinalizacao = new Date(ficha.updatedAt).toLocaleDateString('pt-BR');

            const acoesHtml = `
                <button class="btn-visualizar-ficha-arquivo text-blue-600 hover:text-blue-800 p-1" data-id="${ficha._id}" title="Visualizar Detalhes">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                `;

            tr.innerHTML = `
                <td class="px-2 py-1">${dataFinalizacao}</td>
                <td class="px-2 py-1">${clienteNome}</td>
                <td class="px-2 py-1">${applyCpfMask(clienteCpf)}</td>
                <td class="px-2 py-1">${veiculoInfoDisplay}</td>
                <td class="px-2 py-1">${vendedorNome}</td>
                <td class="px-2 py-1 text-center space-x-2">${acoesHtml}</td>
            `;
            fichasArquivoTableBody.appendChild(tr);
        });
        lucide.createIcons(); // Recriar ícones após a renderização da tabela

        // Adicionar event listeners aos botões
        document.querySelectorAll('.btn-visualizar-ficha-arquivo').forEach(btn => {
            btn.addEventListener('click', () => {
                alert('Funcionalidade de Visualizar Ficha Arquivada a ser implementada para Ficha ID: ' + btn.dataset.id);
            });
        });
    }

    // --- Inicialização ---
    carregarFichasArquivadas();
    // Adicionar listener para o input de filtro
    if (filtroFichasArquivoInput) {
        filtroFichasArquivoInput.addEventListener('input', () => carregarFichasArquivadas());
    }
});