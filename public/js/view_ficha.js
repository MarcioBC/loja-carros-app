// public/js/view_ficha.js
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

    // --- Elementos do DOM da Visualização da Ficha ---
    const fichaContentDiv = document.getElementById('fichaContent');
    const loadingMessage = document.getElementById('loadingMessage');

    // --- Funções Auxiliares de Formatação ---
    function applyCpfMask(value) {
        if (!value) return 'N/A';
        value = value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return value;
    }
    function applyPhoneMask(value) {
        if (!value) return 'N/A';
        value = value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        return value;
    }
    function applyCepMask(value) {
        if (!value) return 'N/A';
        value = value.replace(/\D/g, '');
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        return value;
    }
    function formatNumberToCurrency(number) {
        if (typeof number !== 'number' || isNaN(number)) return 'R$ 0,00';
        return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    async function loadFichaDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const fichaId = urlParams.get('id');

        if (!fichaId) {
            fichaContentDiv.innerHTML = '<p class="text-red-500 text-center">ID da ficha não fornecido.</p>';
            loadingMessage.classList.add('hidden');
            return;
        }

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
                throw new Error(errorData.message || 'Erro ao carregar dados da ficha.');
            }

            const ficha = await response.json();
            loadingMessage.classList.add('hidden');
            renderFicha(ficha);

        } catch (error) {
            console.error('Erro ao carregar ficha para visualização:', error);
            fichaContentDiv.innerHTML = `<p class="text-red-500 text-center">Não foi possível carregar os detalhes da ficha: ${error.message}</p>`;
            loadingMessage.classList.add('hidden');
        }
    }

    function renderFicha(ficha) {
        let veiculoInteresseHtml = '<span>N/A</span>';
        if (ficha.veiculoInteresse) {
            veiculoInteresseHtml = `
                <div class="info-item">
                    <span>Marca/Modelo:</span> <span>${ficha.veiculoInteresse.marcaModelo || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span>Ano:</span> <span>${ficha.veiculoInteresse.ano || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span>Preço Sugerido:</span> <span>${formatNumberToCurrency(ficha.veiculoInteresse.precoSugerido)}</span>
                </div>
                <div class="info-item">
                    <span>Placa:</span> <span>${ficha.veiculoInteresse.placa || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span>Chassi:</span> <span>${ficha.veiculoInteresse.chassi || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span>Renavam:</span> <span>${ficha.veiculoInteresse.renavam || 'N/A'}</span>
                </div>
                ${ficha.veiculoInteresse.veiculoId && ficha.veiculoInteresse.veiculoId.cor ? `
                <div class="info-item">
                    <span>Cor:</span> <span>${ficha.veiculoInteresse.veiculoId.cor}</span>
                </div>
                ` : ''}
            `;
        }

        let financeirasConsultadasHtml = '<span>Nenhuma análise realizada.</span>';
        if (ficha.financeirasConsultadas && ficha.financeirasConsultadas.length > 0) {
            financeirasConsultadasHtml = ficha.financeirasConsultadas.map(fc => `
                <div class="border-b border-dashed border-gray-300 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                    <div class="info-item">
                        <span>Financeira:</span> <span>${fc.nomeFinanceira || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Status Análise:</span> <span>${fc.statusAnalise || 'N/A'}</span>
                    </div>
                    ${fc.motivoRecusa ? `
                    <div class="info-item">
                        <span>Motivo Recusa:</span> <span>${fc.motivoRecusa}</span>
                    </div>` : ''}
                    ${fc.valorAprovado ? `
                    <div class="info-item">
                        <span>Valor Aprovado:</span> <span>${formatNumberToCurrency(fc.valorAprovado)}</span>
                    </div>` : ''}
                    ${fc.quantidadeParcelas ? `
                    <div class="info-item">
                        <span>Qtd Parcelas:</span> <span>${fc.quantidadeParcelas}</span>
                    </div>` : ''}
                    ${fc.valorParcela ? `
                    <div class="info-item">
                        <span>Valor Parcela:</span> <span>${formatNumberToCurrency(fc.valorParcela)}</span>
                    </div>` : ''}
                    ${fc.dataVencimentoParcela ? `
                    <div class="info-item">
                        <span>Vencimento:</span> <span>${fc.dataVencimentoParcela} dias</span>
                    </div>` : ''}
                    ${fc.retornoFinanceira ? `
                    <div class="info-item">
                        <span>Retorno Financeira:</span> <span>${fc.retornoFinanceira}</span>
                    </div>` : ''}
                    <div class="info-item">
                        <span>Data Análise:</span> <span>${formatDate(fc.dataAnalise)}</span>
                    </div>
                    <div class="info-item">
                        <span>Analisado Por:</span> <span>${fc.analisadoPor ? fc.analisadoPor.nome : 'N/A'}</span>
                    </div>
                </div>
            `).join('');
        }

        let historicoStatusHtml = '<span>Nenhum histórico de status.</span>';
        if (ficha.historicoStatus && ficha.historicoStatus.length > 0) {
            historicoStatusHtml = ficha.historicoStatus.map(hs => `
                <div class="info-item">
                    <span>Status:</span> <span>${(hs.status || 'N/A').replace(/_/g, ' ')}</span>
                </div>
                <div class="info-item">
                    <span>Data:</span> <span>${new Date(hs.data).toLocaleString('pt-BR')}</span>
                </div>
                <div class="info-item mb-2">
                    <span>Usuário:</span> <span>${hs.usuario ? hs.usuario.nome : 'N/A'}</span>
                </div>
                <hr class="my-2 border-gray-200">
            `).join('');
        }

        let historicoDialogoHtml = '<span>Nenhuma mensagem no histórico.</span>';
        if (ficha.historicoDialogo && ficha.historicoDialogo.length > 0) {
            historicoDialogoHtml = ficha.historicoDialogo.map(hd => `
                <div class="mb-2 p-2 bg-gray-50 rounded">
                    <p class="text-sm">
                        <span class="font-semibold">${hd.remetente ? hd.remetente.nome : 'N/A'} (${new Date(hd.data).toLocaleString('pt-BR')}):</span>
                        ${hd.mensagem}
                    </p>
                </div>
            `).join('');
        }


        fichaContentDiv.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="info-card">
                    <h3>Dados do Cliente</h3>
                    <div class="info-item">
                        <span>Nome Completo:</span> <span>${ficha.clienteId ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>CPF:</span> <span>${applyCpfMask(ficha.clienteId ? ficha.clienteId.cpf : ficha.cpfCliente || '')}</span>
                    </div>
                    <div class="info-item">
                        <span>RG:</span> <span>${ficha.rgCliente || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Data Nasc.:</span> <span>${formatDate(ficha.dataNascimentoCliente)}</span>
                    </div>
                    <div class="info-item">
                        <span>Email:</span> <span>${ficha.emailCliente || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Tel. Principal:</span> <span>${applyPhoneMask(ficha.telefonePrincipalCliente || '')}</span>
                    </div>
                    <div class="info-item">
                        <span>Tel. Secundário:</span> <span>${applyPhoneMask(ficha.telefoneSecundarioCliente || '')}</span>
                    </div>
                    <div class="info-item">
                        <span>Profissão:</span> <span>${ficha.profissaoCliente || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Estado Civil:</span> <span>${ficha.estadoCivilCliente || 'N/A'}</span>
                    </div>
                </div>

                <div class="info-card">
                    <h3>Endereço Residencial</h3>
                    <div class="info-item">
                        <span>CEP:</span> <span>${applyCepMask(ficha.enderecoCliente.cep || '')}</span>
                    </div>
                    <div class="info-item">
                        <span>Rua:</span> <span>${ficha.enderecoCliente.rua || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Número:</span> <span>${ficha.enderecoCliente.numero || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Complemento:</span> <span>${ficha.enderecoCliente.complemento || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Bairro:</span> <span>${ficha.enderecoCliente.bairro || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Cidade:</span> <span>${ficha.enderecoCliente.cidade || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Estado:</span> <span>${ficha.enderecoCliente.estado || 'N/A'}</span>
                    </div>
                </div>

                <div class="info-card">
                    <h3>Dados Profissionais</h3>
                    <div class="info-item">
                        <span>Empresa:</span> <span>${ficha.nomeEmpresaTrabalha || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Tempo de Empresa:</span> <span>${ficha.tempoDeEmpresa || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Cargo:</span> <span>${ficha.cargoOcupado || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Renda Bruta:</span> <span>${formatNumberToCurrency(ficha.rendaBruta)}</span>
                    </div>
                    <div class="info-item">
                        <span>Tipo de Renda:</span> <span>${ficha.tipoRenda || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Possui CNH:</span> <span>${ficha.possuiCnh ? 'Sim' : 'Não'}</span>
                    </div>
                    <h4 class="text-md font-semibold mt-4 mb-2 text-gray-700">Endereço Profissional:</h4>
                    <div class="info-item">
                        <span>CEP Profissional:</span> <span>${applyCepMask(ficha.enderecoProfissional.cepProfissional || '')}</span>
                    </div>
                    <div class="info-item">
                        <span>Rua Profissional:</span> <span>${ficha.enderecoProfissional.ruaProfissional || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Número Profissional:</span> <span>${ficha.enderecoProfissional.numeroProfissional || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Comp. Profissional:</span> <span>${ficha.enderecoProfissional.complementoProfissional || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Bairro Profissional:</span> <span>${ficha.enderecoProfissional.bairroProfissional || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Cidade Profissional:</span> <span>${ficha.enderecoProfissional.cidadeProfissional || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Estado Profissional:</span> <span>${ficha.enderecoProfissional.estadoProfissional || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Tel. Profissional:</span> <span>${applyPhoneMask(ficha.enderecoProfissional.telefoneProfissional || '')}</span>
                    </div>
                </div>

                <div class="info-card">
                    <h3>Dados do Cônjuge</h3>
                    <div class="info-item">
                        <span>Nome Cônjuge:</span> <span>${ficha.nomeConjugue || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>CPF Cônjuge:</span> <span>${applyCpfMask(ficha.cpfConjugue || '')}</span>
                    </div>
                    <div class="info-item">
                        <span>Data Nasc. Cônjuge:</span> <span>${formatDate(ficha.dataNascimentoConjugue)}</span>
                    </div>
                    <div class="info-item">
                        <span>Profissão Cônjuge:</span> <span>${ficha.profissaoConjugue || 'N/A'}</span>
                    </div>

                    <h3 class="mt-6 text-lg font-semibold mb-2 text-gray-800">Veículo de Interesse</h3>
                    ${veiculoInteresseHtml}

                    <h3 class="mt-6 text-lg font-semibold mb-2 text-gray-800">Status Atual da Ficha</h3>
                    <div class="info-item">
                        <span>Status:</span> <span class="font-semibold text-blue-700">${(ficha.status || 'N/A').replace(/_/g, ' ')}</span>
                    </div>
                    <div class="info-item">
                        <span>Observações:</span> <span>${ficha.observacoes || 'Nenhuma'}</span>
                    </div>
                    <div class="info-item">
                        <span>Cadastrado Por:</span> <span>${ficha.cadastradoPor ? ficha.cadastradoPor.nome : 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span>Data Cadastro:</span> <span>${new Date(ficha.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                </div>
            </div>

            <div class="info-card mt-6">
                <h3>Análises Financeiras Realizadas</h3>
                ${financeirasConsultadasHtml}
            </div>

            <div class="info-card mt-6">
                <h3>Histórico de Status da Ficha</h3>
                ${historicoStatusHtml}
            </div>

            <div class="info-card mt-6">
                <h3>Histórico de Diálogo</h3>
                ${historicoDialogoHtml}
            </div>
        `;
    }

    loadFichaDetails();
});