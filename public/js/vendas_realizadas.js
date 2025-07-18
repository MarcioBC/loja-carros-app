// public/js/vendas_realizadas.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Variáveis de Local Storage ---
    const token = localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const companyId = localStorage.getItem('companyId');
    const userId = localStorage.getItem('userId');

    // --- Verificação de Autenticação e Redirecionamento ---
    if (!token || !userRole || !userName || !companyId || !userId || (!['vendedor', 'gerente'].includes(userRole))) {
        alert('Acesso negado. Faça login com um perfil autorizado (Vendedor ou Gerente).');
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

    // --- Elementos da Tabela Principal de Vendas ---
    const vendasRealizadasTableBody = document.getElementById('vendasRealizadasTableBody');
    const filtroVendasInput = document.getElementById('filtro-vendas'); // Input de busca
    // Novos elementos para exibir os totais
    
    // --- NOVOS ELEMENTOS DE FILTRO DE MÊS/ANO ---
    const filtroMesSelect = document.getElementById('filtro-mes');
    const filtroAnoSelect = document.getElementById('filtro-ano');

    // --- Elementos do Modal de Detalhes da Venda ---
    const vendaDetalhesModal = document.getElementById('vendaDetalhesModal');
    const closeVendaDetalhesModalBtn = document.getElementById('closeVendaDetalhesModalBtn');
    const closeVendaDetalhesModalBtnBottom = document.getElementById('closeVendaDetalhesModalBtnBottom'); // Botão de fechar de baixo
    const detalhesClienteNome = document.getElementById('detalhesClienteNome');
    const detalhesClienteCpf = document.getElementById('detalhesClienteCpf');
    const detalhesVeiculoModelo = document.getElementById('detalhesVeiculoModelo');
    const detalhesVeiculoPlaca = document.getElementById('detalhesVeiculoPlaca');
    const detalhesVeiculoAno = document.getElementById('detalhesVeiculoAno');
    const detalhesPrecoVenda = document.getElementById('detalhesPrecoVenda');
    const detalhesVendedor = document.getElementById('detalhesVendedor');
    const detalhesDataVenda = document.getElementById('detalhesDataVenda');
    const detalhesStatusAtual = document.getElementById('detalhesStatusAtual');
    const detalhesFormasPagamento = document.getElementById('detalhesFormasPagamento');
    const detalhesFinanciamento = document.getElementById('detalhesFinanciamento');
    const detalhesVeiculoTroca = document.getElementById('detalhesVeiculoTroca');


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
    function formatNumberToCurrency(number) {
        if (typeof number !== 'number' || isNaN(number)) return 'R$ 0,00';
        return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function parseCurrencyToNumber(value) {
        if (typeof value !== 'string') return Number(value) || 0;
        return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
    }
    function formatDateToLocale(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
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

                // Tratamento especial para "Gerenciar Usuários" se necessário (redirecionar para uma página)
                if (item.isSpecial && item.roles.includes('gerente')) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.location.href = '/gerenciar_usuarios.html'; // Redireciona para a página de gerenciamento de usuários
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
    populateYears(); // Chamada inicial // Chama a função ao carregar o DOM

    // --- FUNÇÃO PRINCIPAL PARA CARREGAR VENDAS REALIZADAS ---
    async function carregarVendasRealizadas() {
        if (!vendasRealizadasTableBody) return;
        vendasRealizadasTableBody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-gray-500">A carregar vendas realizadas...</td></tr>`; // Colspan ajustado para 8

        try {
            const selectedMonth = filtroMesSelect.value;
            const selectedYear = filtroAnoSelect.value;
            const filterText = filtroVendasInput.value;

            let fetchUrl = `/api/fichas/vendas-concluidas?companyId=${companyId}`;

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
            if (!response.ok) throw new Error('Falha ao buscar vendas realizadas.');

            const fichas = await response.json();
            renderVendasRealizadasTabela(fichas);

        } catch (error) {
            console.error('Erro ao carregar vendas realizadas:', error);
            vendasRealizadasTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500 p-4">Erro ao carregar vendas realizadas.</td></tr>`;
        }
    }

    // --- FUNÇÃO PARA RENDERIZAR A TABELA DE VENDAS REALIZADAS ---
    function renderVendasRealizadasTabela(fichas) {
        vendasRealizadasTableBody.innerHTML = '';
        if (fichas.length === 0) {
            vendasRealizadasTableBody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-gray-500">Nenhuma venda realizada encontrada.</td></tr>`;
            return;
        }

        let totalVendasValor = 0;
        let totalLucro = 0;
        let numVendas = 0;

        fichas.forEach(ficha => {
            numVendas++;
            const precoVenda = ficha.veiculoInteresse ? parseCurrencyToNumber(ficha.veiculoInteresse.precoSugerido) : 0;
            totalVendasValor += precoVenda;

            let custoTotalVeiculoPrincipal = 0;
            // Para calcular o custo total do veículo principal, precisamos do `custoInicial` E `custosAdicionais` do veículo
            // No seu `fichaRoutes.js`, a populacao de `veiculoInteresse.veiculoId` não inclui `custoInicial` nem `custosAdicionais`
            // que são campos do modelo `Vehicle`.
            // Se você quer um cálculo de lucro preciso aqui, o backend precisaria popular esses campos.
            // Por enquanto, farei uma estimativa baseada no que o `fichaCadastral` *poderia* ter se esses dados fossem salvos diretamente nela.
            // Idealmente, a rota `/api/fichas/vendas-concluidas` deveria retornar o custo do veículo.
            // Se o `veiculoInteresse.veiculoId` está populado, ele deve conter o `custoInicial` e `custosAdicionais` do veículo original.
            if (ficha.veiculoInteresse && ficha.veiculoInteresse.veiculoId && ficha.veiculoInteresse.veiculoId.custoInicial !== undefined) {
                custoTotalVeiculoPrincipal = parseCurrencyToNumber(ficha.veiculoInteresse.veiculoId.custoInicial || 0); // Supondo que custoInicial esteja em Vehicle
                if (ficha.veiculoInteresse.veiculoId.custosAdicionais && Array.isArray(ficha.veiculoInteresse.veiculoId.custosAdicionais)) {
                    custoTotalVeiculoPrincipal += ficha.veiculoInteresse.veiculoId.custosAdicionais.reduce((sum, item) => sum + parseCurrencyToNumber(item.valor), 0);
                }
            } else {
                 // Fallback se o veículo não estiver populado ou não tiver custoInicial
                 // Você pode optar por não calcular o lucro ou exibir 'N/A'
                 // Ou, se `ficha.custoInicial` (da ficha, se existisse) fosse um campo:
                 // custoTotalVeiculoPrincipal = parseCurrencyToNumber(ficha.custoInicial || 0);
            }

            let custoVeiculoTroca = 0;
            if (ficha.dadosVendaFinal && ficha.dadosVendaFinal.veiculoTroca && typeof ficha.dadosVendaFinal.veiculoTroca.custoAquisicao === 'number') {
                custoVeiculoTroca = parseCurrencyToNumber(ficha.dadosVendaFinal.veiculoTroca.custoAquisicao || 0);
                // Se o veiculoId do veiculoTroca estiver populado, podemos pegar dívidas dele
                if (ficha.dadosVendaFinal.veiculoTroca.veiculoId && ficha.dadosVendaFinal.veiculoTroca.veiculoId.dividas && Array.isArray(ficha.dadosVendaFinal.veiculoTroca.veiculoId.dividas)) {
                    custoVeiculoTroca += ficha.dadosVendaFinal.veiculoTroca.veiculoId.dividas.reduce((sum, item) => sum + parseCurrencyToNumber(item.valor), 0);
                }
            }


            // Cálculo do Lucro Bruto: Preço de Venda do veículo principal - Custo Total (do veículo principal + custo do veículo de troca)
            // Este cálculo pode variar dependendo da sua definição exata de "lucro bruto" para uma venda com troca.
            // Aqui, estou subtraindo os custos de ambos os veículos do preço de venda do principal.
            const lucroVenda = precoVenda - (custoTotalVeiculoPrincipal + custoVeiculoTroca);
            totalLucro += lucroVenda;

            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';

            const clienteNome = ficha.clienteId?.nomeCompleto || ficha.nomeCompletoCliente || 'N/A';
            const clienteCpf = ficha.clienteId?.cpf || ficha.cpfCliente || 'N/A';

            // Veículo Vendido Display
            const veiculoVendidoDisplay = ficha.veiculoInteresse?.veiculoId ?
                `${ficha.veiculoInteresse.veiculoId.modelo || ficha.veiculoInteresse.marcaModelo || 'N/A'} (${ficha.veiculoInteresse.veiculoId.placa || ficha.veiculoInteresse.placa || 'N/A'})` :
                (ficha.veiculoInteresse?.marcaModelo ? `${ficha.veiculoInteresse.marcaModelo} (${ficha.veiculoInteresse.placa || 'N/A'})` : 'N/A');

            const vendedorNome = ficha.cadastradoPor ? ficha.cadastradoPor.nome : 'N/A';

            const acoesHtml = `
                <button class="btn-visualizar-venda text-gray-600 hover:text-gray-800 p-1" data-id="${ficha._id}" title="Visualizar Detalhes da Venda">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            `;

            tr.innerHTML = `
                <td class="px-2 py-1">${formatDateToLocale(ficha.updatedAt || ficha.createdAt)}</td> <td class="px-2 py-1">${clienteNome}</td>
                <td class="px-2 py-1">${applyCpfMask(clienteCpf)}</td>
                <td class="px-2 py-1">${veiculoVendidoDisplay}</td>
                <td class="px-2 py-1">${formatNumberToCurrency(precoVenda)}</td>
                <td class="px-2 py-1">${vendedorNome}</td>
                <td class="px-2 py-1">${formatNumberToCurrency(lucroVenda)}</td>
                <td class="px-2 py-1 text-center space-x-2">${acoesHtml}</td>
            `;
            vendasRealizadasTableBody.appendChild(tr);
        });
        lucide.createIcons();

        document.querySelectorAll('.btn-visualizar-venda').forEach(btn => {
            btn.addEventListener('click', (e) => openVendaDetalhesModal(e.target.dataset.id));
        });
    }

    // --- Adiciona listeners para os novos filtros ---
    filtroMesSelect.addEventListener('change', carregarVendasRealizadas);
    filtroAnoSelect.addEventListener('change', carregarVendasRealizadas);
    filtroVendasInput.addEventListener('input', carregarVendasRealizadas); // Mantém o filtro de texto

    // --- Inicialização ---
    carregarVendasRealizadas();

    // --- Lógica do Modal de Detalhes da Venda ---
    async function openVendaDetalhesModal(fichaId) {
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
                throw new Error(errorData.message || 'Erro ao buscar detalhes da venda.');
            }
            const ficha = await response.json();
            console.log('Ficha detalhada da venda:', ficha);

            // Preencher detalhes do cliente
            detalhesClienteNome.textContent = ficha.clienteId ? ficha.clienteId.nomeCompleto : ficha.nomeCompletoCliente;
            detalhesClienteCpf.textContent = applyCpfMask(ficha.clienteId ? ficha.clienteId.cpf : ficha.cpfCliente);

            // Preencher detalhes do veículo principal
            if (ficha.veiculoInteresse && ficha.veiculoInteresse.veiculoId) {
                detalhesVeiculoModelo.textContent = ficha.veiculoInteresse.veiculoId.modelo || ficha.veiculoInteresse.marcaModelo || 'N/A';
                detalhesVeiculoPlaca.textContent = ficha.veiculoInteresse.veiculoId.placa || ficha.veiculoInteresse.placa || 'N/A';
                detalhesVeiculoAno.textContent = ficha.veiculoInteresse.veiculoId.ano || ficha.veiculoInteresse.ano || 'N/A';
                detalhesPrecoVenda.textContent = formatNumberToCurrency(ficha.veiculoInteresse.precoSugerido || 0);
            } else {
                detalhesVeiculoModelo.textContent = 'N/A';
                detalhesVeiculoPlaca.textContent = 'N/A';
                detalhesVeiculoAno.textContent = 'N/A';
                detalhesPrecoVenda.textContent = 'N/A';
            }

            // Preencher vendedor e data
            detalhesVendedor.textContent = ficha.cadastradoPor ? ficha.cadastradoPor.nome : 'N/A';
            detalhesDataVenda.textContent = formatDateToLocale(ficha.updatedAt || ficha.createdAt); // Usar updatedAt como data da venda final
            detalhesStatusAtual.textContent = String(ficha.status).replace(/_/g, ' ') || 'N/A';

            // Preencher formas de pagamento
            if (ficha.dadosVendaFinal && ficha.dadosVendaFinal.formasPagamento && ficha.dadosVendaFinal.formasPagamento.length > 0) {
                let formasHtml = '<ul class="list-disc list-inside">';
                ficha.dadosVendaFinal.formasPagamento.forEach(fp => {
                    formasHtml += `<li>${fp.tipo || 'N/A'}: ${formatNumberToCurrency(fp.valor || 0)}</li>`;
                });
                formasHtml += '</ul>';
                detalhesFormasPagamento.innerHTML = formasHtml;
            } else {
                detalhesFormasPagamento.innerHTML = '<p>Nenhuma forma de pagamento adicionada.</p>';
            }

            // Preencher detalhes do financiamento
            if (ficha.dadosVendaFinal && ficha.dadosVendaFinal.financiamento) {
                const fin = ficha.dadosVendaFinal.financiamento;
                detalhesFinanciamento.innerHTML = `
                    <p><span class="font-medium">Financeira:</span> ${fin.nomeFinanceira || 'N/A'}</p>
                    <p><span class="font-medium">Valor Aprovado:</span> ${formatNumberToCurrency(fin.valorAprovado || 0)}</p>
                    <p><span class="font-medium">Parcelas:</span> ${fin.quantidadeParcelas || 'N/A'} de ${formatNumberToCurrency(fin.valorParcela || 0)}</p>
                    <p><span class="font-medium">Vencimento:</span> ${fin.dataVencimentoParcela || 'N/A'}</p>
                `;
            } else {
                detalhesFinanciamento.innerHTML = '<p>Nenhum financiamento.</p>';
            }

            // Preencher detalhes do veículo de troca
            if (ficha.dadosVendaFinal && ficha.dadosVendaFinal.veiculoTroca && ficha.dadosVendaFinal.veiculoTroca.veiculoId) {
                const vt = ficha.dadosVendaFinal.veiculoTroca;
                const vtId = vt.veiculoId; // Isso seria o objeto Vehicle populado

                let dividasText = 'Nenhuma dívida.';
                // Verifica se vtId é um objeto e tem dívidas
                if (vtId && typeof vtId === 'object' && vtId.dividas && vtId.dividas.length > 0) {
                    dividasText = '<ul class="list-disc list-inside">';
                    vtId.dividas.forEach(d => {
                        dividasText += `<li>${formatNumberToCurrency(d.valor)} - ${d.descricao || 'Dívida'}</li>`;
                    });
                    dividasText += '</ul>';
                }

                let outroProprietarioText = 'Não';
                // Verifica se vtId é um objeto e tem outroProprietario
                if (vtId && typeof vtId === 'object' && vtId.outroProprietario && vtId.outroProprietario.nome) {
                    outroProprietarioText = `${vtId.outroProprietario.nome} (CPF: ${applyCpfMask(vtId.outroProprietario.cpf)})`;
                }

                detalhesVeiculoTroca.innerHTML = `
                    <p><span class="font-medium">Modelo:</span> ${vt.marcaModelo || 'N/A'}</p>
                    <p><span class="font-medium">Placa:</span> ${vt.placa || 'N/A'}</p>
                    <p><span class="font-medium">Ano:</span> ${vt.ano || 'N/A'}</p>
                    <p><span class="font-medium">Cor:</span> ${vt.cor || 'N/A'}</p>
                    <p><span class="font-medium">Quilometragem:</span> ${vt.quilometragem ? vt.quilometragem.toLocaleString('pt-BR') + ' KM' : 'N/A'}</p>
                    <p><span class="font-medium">Custo Aquisição:</span> ${formatNumberToCurrency(vt.custoAquisicao || 0)}</p>
                    <p><span class="font-medium">Dívidas:</span><br>${dividasText}</p>
                    <p><span class="font-medium">Outro Proprietário:</span> ${outroProprietarioText}</p>
                `;
            } else {
                detalhesVeiculoTroca.innerHTML = '<p>Nenhum veículo de troca.</p>';
            }

            vendaDetalhesModal.classList.remove('hidden');
        } catch (error) {
            console.error('Erro ao abrir modal de detalhes da venda:', error);
            alert('Não foi possível carregar os detalhes da venda: ' + error.message);
        }
    }

    closeVendaDetalhesModalBtn.addEventListener('click', () => {
        vendaDetalhesModal.classList.add('hidden');
    });
    // Adiciona listener ao botão de fechar de baixo do modal
    if (closeVendaDetalhesModalBtnBottom) {
        closeVendaDetalhesModalBtnBottom.addEventListener('click', () => {
            vendaDetalhesModal.classList.add('hidden');
        });
    }

});