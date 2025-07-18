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

  // --- Elementos do DOM (CABEÇALHO COM INFORMAÇÕES DO USUÁRIO) ---
  const userNameDisplay = document.getElementById('userNameDisplay');
  const userRoleDisplay = document.getElementById('userRoleDisplay');
  const companyNameDisplay = document.getElementById('companyNameDisplay');
  const logoutButton = document.getElementById('logoutButton');
  const mainNav = document.getElementById('main-nav');

  // --- Elementos do Estoque (MAIN) ---
  const tabelaCorpo = document.getElementById('veiculosTableBody');
  const filtroInput = document.getElementById('filtro-veiculos');
  const btnCadastrarNovoVeiculo = document.getElementById('btnCadastrarNovoVeiculo');

  // --- Elementos do Modal de Veículo ---
  const vehicleModal = document.getElementById('vehicleModal');
  const modalTitle = document.getElementById('modalTitle');
  const vehicleForm = document.getElementById('vehicleForm');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Inputs do formulário de veículo
  const vehicleIdInput = document.getElementById('vehicleId');
  const companyIdHiddenInput = document.getElementById('companyIdHidden');
  const dataCompraInput = document.getElementById('dataCompra');
  const placaInput = document.getElementById('placa');
  const modeloInput = document.getElementById('modelo');
  const anoInput = document.getElementById('ano');
  const corInput = document.getElementById('cor');
  const chassiInput = document.getElementById('chassi');
  const renavamInput = document.getElementById('renavam');
  const quilometragemInput = document.getElementById('quilometragem');
  const custoInicialInput = document.getElementById('custoInicial');
  const precoInput = document.getElementById('preco');
  const statusSelect = document.getElementById('status');
  // REMOVIDO: const envelopeInput = document.getElementById('envelope');
  const lucroPrevistoDisplay = document.getElementById('lucroPrevistoDisplay'); // NOVO: Campo para exibir o lucro

  // Elementos relacionados a custo/despesas (adicionados IDs no HTML)
  const custoInicialGroup = document.getElementById('custoInicialGroup');
  const additionalExpensesSection = document.getElementById('additionalExpensesSection');
  const saveVehicleBtn = document.getElementById('saveVehicleBtn');

  // Despesas Adicionais
  const additionalExpensesContainer = document.getElementById('additionalExpensesContainer');
  const tempExpenseValueInput = document.getElementById('tempExpenseValue');
  const tempExpenseDescriptionInput = document.getElementById('tempExpenseDescription');
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  const custoTotalDisplay = document.getElementById('custoTotalDisplay');

  let currentVehicleExpenses = [];

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
                    console.warn("Gerenciar Usuários clicado. Implementação específica para 'estoque.html' é necessária ou redirecionar.");
                });
            }
            mainNav.appendChild(link);
        }
    });
    lucide.createIcons();
  }
  renderMenu();

  if (logoutButton) {
      logoutButton.addEventListener('click', () => {
          if (confirm('Tem certeza que deseja sair?')) {
              localStorage.clear();
              window.location.href = '/';
          }
      });
  }

  function parseCurrencyToNumber(value) {
    if (typeof value !== 'string') return Number(value) || 0;
    return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
  }
  function formatNumberToCurrency(number) {
    if (typeof number !== 'number' || isNaN(number)) return 'R$ 0,00';
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        if (input === custoInicialInput || input === tempExpenseValueInput || input.classList.contains('expense-item-value-input') || input === precoInput) {
            calculateTotalCost(); // Recalcula mesmo com valor vazio para atualizar o lucro
        }
        return;
    }

    let numericValue = parseFloat(value);

    if (isNaN(numericValue)) {
        input.value = '';
        if (input === custoInicialInput || input === tempExpenseValueInput || input.classList.contains('expense-item-value-input') || input === precoInput) {
            calculateTotalCost(); // Recalcula mesmo com NaN para atualizar o lucro
        }
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

    // Adicionado precoInput aqui para garantir o recalculo do lucro
    if (input === custoInicialInput || input === tempExpenseValueInput || input.classList.contains('expense-item-value-input') || input === precoInput) {
        calculateTotalCost();
    }
  }

  function handleCurrencyBlur(event) {
    let input = event.target;
    let numericValue = parseCurrencyToNumber(input.value);
    input.value = formatNumberToCurrency(numericValue);
    // Adicionado precoInput aqui para garantir o recalculo do lucro
    if (input === custoInicialInput || input === tempExpenseValueInput || input.classList.contains('expense-item-value-input') || input === precoInput) {
        calculateTotalCost();
    }
  }

  function setupCurrencyListeners() {
    Array.from(document.querySelectorAll('.currency-input')).forEach(input => {
      input.removeEventListener('input', handleCurrencyInput);
      input.removeEventListener('blur', handleCurrencyBlur);

      input.addEventListener('input', handleCurrencyInput);
      input.addEventListener('blur', handleCurrencyBlur);
      if (!vehicleModal.classList.contains('hidden')) {
         input.dispatchEvent(new Event('blur')); // Dispara blur ao abrir para formatar e calcular
      }
    });
  }

  Array.from(document.querySelectorAll('.uppercase-input')).forEach(input => {
    input.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
  });

  addExpenseBtn.addEventListener('click', () => {
    const value = parseCurrencyToNumber(tempExpenseValueInput.value);
    const description = tempExpenseDescriptionInput.value.trim();

    if (value <= 0 || !description) {
      alert('Por favor, insira um valor e uma descrição válidos para a despesa.');
      return;
    }

    const newExpense = {
      valor: value,
      descricao: description,
      data: new Date().toISOString()
    };
    currentVehicleExpenses.push(newExpense);
    renderAdditionalExpenses();
    calculateTotalCost();
    tempExpenseValueInput.value = '';
    tempExpenseDescriptionInput.value = '';
    tempExpenseValueInput.dispatchEvent(new Event('blur')); // Formata o campo de despesa
  });

  function renderAdditionalExpenses() {
    additionalExpensesContainer.innerHTML = '';
    if (currentVehicleExpenses.length === 0) {
      additionalExpensesContainer.innerHTML = `<p class="text-gray-500 text-sm">Nenhuma despesa adicional adicionada.</p>`;
      return;
    }

    currentVehicleExpenses.forEach((expense, index) => {
      const div = document.createElement('div');
      div.classList.add('flex', 'justify-between', 'items-center', 'mb-1', 'text-xs');
      div.innerHTML = `
        <span class="text-gray-700">${new Date(expense.data).toLocaleDateString('pt-BR')} - ${expense.descricao}</span>
        <div class="flex items-center">
            <span class="text-gray-900 font-semibold mr-2">${formatNumberToCurrency(expense.valor)}</span>
            <button type="button" class="btn-remove-expense text-red-500 hover:text-red-700" data-index="${index}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
            </button>
        </div>
      `;
      additionalExpensesContainer.appendChild(div);
    });

    document.querySelectorAll('.btn-remove-expense').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        currentVehicleExpenses.splice(index, 1);
        renderAdditionalExpenses();
        calculateTotalCost();
      });
    });
  }

  function calculateTotalCost() {
    const initialCost = parseCurrencyToNumber(custoInicialInput.value);
    const totalExpenses = currentVehicleExpenses.reduce((sum, expense) => sum + expense.valor, 0);
    const finalTotalCost = initialCost + totalExpenses;
    custoTotalDisplay.value = formatNumberToCurrency(finalTotalCost);

    // Calcular Lucro Previsto: Preço de Venda - Custo Total
    const precoVenda = parseCurrencyToNumber(precoInput.value);
    const lucroPrevisto = precoVenda - finalTotalCost;
    lucroPrevistoDisplay.value = formatNumberToCurrency(lucroPrevisto);
  }

  btnCadastrarNovoVeiculo.addEventListener('click', () => {
    modalTitle.textContent = 'Cadastrar Novo Veículo';
    vehicleIdInput.value = '';
    companyIdHiddenInput.value = companyId;
    limparFormularioVeiculo(); // Esta função agora também reseta e calcula o lucro

    applyModalRestrictions(userRole);

    vehicleModal.classList.remove('hidden');
    setupCurrencyListeners();
    calculateTotalCost(); // Garante que o lucro seja 0,00 ao abrir para cadastro
  });

  vehicleModal.addEventListener('click', (e) => {
    const isCancelBtn = e.target.id === 'cancelModalBtn' || e.target.closest('#cancelModalBtn');
    const isCloseBtn = e.target.id === 'closeModalBtn' || e.target.closest('#closeModalBtn');

    if (isCancelBtn || isCloseBtn) {
        e.preventDefault();
        handleCloseModal();
    }
  });

  function handleCloseModal() {
      vehicleModal.classList.add('hidden');
      limparFormularioVeiculo();
      filtroInput.value = '';
      carregarVeiculos();
  }

  function limparFormularioVeiculo() {
    vehicleForm.reset();
    vehicleIdInput.value = '';
    companyIdHiddenInput.value = '';
    dataCompraInput.value = '';
    placaInput.value = '';
    modeloInput.value = '';
    anoInput.value = '';
    corInput.value = '';
    chassiInput.value = '';
    renavamInput.value = '';
    quilometragemInput.value = '';
    custoInicialInput.value = '';
    precoInput.value = '';
    statusSelect.value = 'DISPONÍVEL';
    // REMOVIDO: envelopeInput.value = '';
    currentVehicleExpenses = [];
    renderAdditionalExpenses();
    calculateTotalCost(); // Recalcula para exibir 0,00 ou conforme valores iniciais
    if (custoInicialGroup) custoInicialGroup.classList.remove('hidden');
    if (additionalExpensesSection) additionalExpensesSection.classList.remove('hidden');
    if (saveVehicleBtn) saveVehicleBtn.classList.remove('hidden');
    if (precoInput) precoInput.readOnly = false;
  }

  function calcularDiasEstoque(dataCadastro) {
    if (!dataCadastro) return 'N/A';
    const dataInicial = new Date(dataCadastro);
    const dataAtual = new Date();
    dataInicial.setHours(0, 0, 0, 0);
    dataAtual.setHours(0, 0, 0, 0);

    const diffMs = dataAtual - dataInicial;
    if (diffMs < 0) return '0';
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  function montarLinhaVeiculo(veiculo) {
    let corStatus = '';
    if (veiculo.status === 'DISPONÍVEL') corStatus = 'text-green-600 font-semibold';
    else if (veiculo.status === 'RESERVADO') corStatus = 'text-blue-600 font-semibold';
    else if (veiculo.status === 'VENDIDO') corStatus = 'text-red-600 font-semibold';
    else if (veiculo.status === 'DEVOLVIDO') corStatus = 'text-gray-500 font-semibold';
    else if (veiculo.status === 'EM_PREPARACAO') corStatus = 'text-gray-500 font-semibold';
    else if (veiculo.status === 'EM_MANUTENCAO') corStatus = 'text-gray-500 font-semibold';

    const dataCadastroFormatada = veiculo.createdAt ? new Date(veiculo.createdAt).toLocaleDateString('pt-BR') : 'N/A';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-2 py-1">${dataCadastroFormatada}</td>
      <td class="px-2 py-1">${veiculo.placa || ''}</td>
      <td class="px-2 py-1">${veiculo.modelo || ''}</td>
      <td class="px-2 py-1">${veiculo.ano || ''}</td>
      <td class="px-2 py-1">${veiculo.chassi || ''}</td>
      <td class="px-2 py-1">${veiculo.renavam || ''}</td>
      <td class="px-2 py-1 ${userRole !== 'gerente' ? 'hidden' : ''}">${formatNumberToCurrency(veiculo.custoInicial)}</td>
      <td class="px-2 py-1">${formatNumberToCurrency(veiculo.preco)}</td>
      <td class="px-2 py-1 ${corStatus}">${veiculo.status || ''}</td>
      <td class="px-2 py-1 text-center space-x-2">
        <button class="btn-editar-veiculo ${userRole !== 'gerente' ? 'hidden' : ''}" title="Editar" data-id="${veiculo._id}" style="background:none; border:none; cursor:pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button class="btn-excluir-veiculo ${userRole !== 'gerente' ? 'hidden' : ''}" title="Excluir" data-id="${veiculo._id}" style="background:none; border:none; cursor:pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14H7L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M4 6l1-3h14l1 3"></path></svg>
        </button>
      </td>
    `;
    return tr;
  }

  function applyModalRestrictions(role) {
      if (role !== 'gerente') {
          if (custoInicialGroup) custoInicialGroup.classList.add('hidden');
          if (additionalExpensesSection) additionalExpensesSection.classList.add('hidden');
          if (saveVehicleBtn) saveVehicleBtn.classList.add('hidden');

          if (precoInput) {
              precoInput.readOnly = true;
              precoInput.classList.add('bg-gray-100', 'cursor-not-allowed');
          }
      } else {
          if (custoInicialGroup) custoInicialGroup.classList.remove('hidden');
          if (additionalExpensesSection) additionalExpensesSection.classList.remove('hidden');
          if (saveVehicleBtn) saveVehicleBtn.classList.remove('hidden');

          if (precoInput) {
              precoInput.readOnly = false;
              precoInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
          }
      }
  }

  async function carregarVeiculos() {
    try {
      let fetchUrl = `/api/vehicles?companyId=${companyId}`;

      const res = await fetch(fetchUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        alert('Sessão expirada ou não autorizado. Faça login novamente.');
        localStorage.clear();
        window.location.href = '/';
        return;
      }
      if (!res.ok) throw new Error('Erro ao carregar veículos.');

      const veiculos = await res.json();

      veiculos.sort((a, b) => {
        const ordem = { 'DISPONÍVEL': 1, 'RESERVADO': 2, 'VENDIDO': 3, 'DEVOLVIDO': 4, 'EM_PREPARACAO': 5, 'EM_MANUTENCAO': 6 };
        const statusDiff = (ordem[a.status] || 99) - (ordem[b.status] || 99);
        if (statusDiff !== 0) return statusDiff;
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      tabelaCorpo.innerHTML = '';

      const filtro = filtroInput.value.toLowerCase();

      const precoCustoHeader = document.querySelector('.gerente-only-column');
      if (precoCustoHeader) {
          if (userRole !== 'gerente') {
              precoCustoHeader.classList.add('hidden');
          } else {
              precoCustoHeader.classList.remove('hidden');
          }
      }

      veiculos.forEach(veiculo => {
        const textoBusca = `${veiculo.placa || ''} ${veiculo.modelo || ''} ${veiculo.cor || ''} ${veiculo.ano || ''} ${veiculo.chassi || ''} ${veiculo.renavam || ''} ${veiculo.status || ''}`.toLowerCase();

        let shouldDisplay = false;

        if (!filtro) {
            if (veiculo.status !== 'VENDIDO' && veiculo.status !== 'DEVOLVIDO') {
                shouldDisplay = true;
            }
        } else {
            if (textoBusca.includes(filtro)) {
                shouldDisplay = true;
            }
        }

        if (shouldDisplay) {
            tabelaCorpo.appendChild(montarLinhaVeiculo(veiculo));
        }
      });

      document.querySelectorAll('.btn-editar-veiculo').forEach(btn => {
        btn.addEventListener('click', () => editarVeiculo(btn.dataset.id));
      });
      document.querySelectorAll('.btn-excluir-veiculo').forEach(btn => {
        btn.addEventListener('click', () => excluirVeiculo(btn.dataset.id));
      });
    }
    catch (err) {
      console.error(err);
      alert('Erro ao carregar veículos.');
    }
  }

  // **CHAMADA INICIAL PARA CARREGAR OS VEÍCULOS ASSIM QUE A PÁGINA CARREGA**
  carregarVeiculos();

  filtroInput.addEventListener('input', () => { carregarVeiculos(); });

  vehicleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (userRole !== 'gerente' && precoInput.readOnly) {
        alert('Você não tem permissão para alterar o preço de venda ou salvar este formulário.');
        return;
    }

    const dadosVeiculo = {
        placa: placaInput.value,
        modelo: modeloInput.value,
        ano: anoInput.value,
        cor: corInput.value,
        chassi: chassiInput.value,
        renavam: renavamInput.value,
        quilometragem: parseInt(quilometragemInput.value) || 0,
        preco: parseCurrencyToNumber(precoInput.value),
        status: statusSelect.value,
        // REMOVIDO: envelope: envelopeInput.value,
        companyId: companyId
    };

    if (userRole === 'gerente') {
        dadosVeiculo.custoInicial = parseCurrencyToNumber(custoInicialInput.value);
        dadosVeiculo.custosAdicionais = currentVehicleExpenses;
        dadosVeiculo.dataCompra = dataCompraInput.value;
    } else {
        // Assegura que campos de custo/despesas não sejam enviados por não-gerentes
        delete dadosVeiculo.custoInicial;
        delete dadosVeiculo.custosAdicionais;
        delete dadosVeiculo.dataCompra;
    }

    const vehicleId = vehicleIdInput.value;
    let url = '/api/vehicles';
    let method = 'POST';

    if (vehicleId) {
      url = `/api/vehicles/${vehicleId}`;
      method = 'PUT';
    }

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dadosVeiculo)
      });

      if (res.status === 401 || res.status === 403) {
        alert('Sessão expirada ou não autorizado. Faça login novamente.');
        localStorage.clear();
        window.location.href = '/';
        return;
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erro ao ${vehicleId ? 'atualizar' : 'cadastrar'} veículo.`);
      }

      alert(`Veículo ${vehicleId ? 'atualizado' : 'cadastrado'} com sucesso!`);
      handleCloseModal();

    } catch (err) {
      console.error(`Erro ao ${vehicleId ? 'atualizar' : 'cadastrar'} veículo:`, err);
      alert(`Não foi possível ${vehicleId ? 'atualizar' : 'cadastrar'} o veículo: ` + err.message);
    }
  });

  async function editarVeiculo(id) {
    if (userRole !== 'gerente') {
        alert('Você não tem permissão para editar veículos.');
        return;
    }

    modalTitle.textContent = 'Editar Veículo';
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        alert('Sessão expirada ou não autorizado. Faça login novamente.');
        localStorage.clear();
        window.location.href = '/';
        return;
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao buscar dados do veículo para edição.');
      }

      const veiculo = await res.json();
      
      vehicleIdInput.value = veiculo._id || '';
      companyIdHiddenInput.value = veiculo.companyId || '';
      if (userRole === 'gerente') {
        dataCompraInput.value = veiculo.dataCompra ? new Date(veiculo.dataCompra).toISOString().split('T')[0] : '';
      } else {
          dataCompraInput.value = ''; // Limpa a data de compra para não-gerentes
      }
      
      placaInput.value = veiculo.placa || '';
      modeloInput.value = veiculo.modelo || '';
      anoInput.value = veiculo.ano || '';
      corInput.value = veiculo.cor || '';
      chassiInput.value = veiculo.chassi || '';
      renavamInput.value = veiculo.renavam || '';
      quilometragemInput.value = veiculo.quilometragem || '';

      if (userRole === 'gerente') {
          custoInicialInput.value = formatNumberToCurrency(veiculo.custoInicial);
          currentVehicleExpenses = veiculo.custosAdicionais ? [...veiculo.custosAdicionais] : [];
          renderAdditionalExpenses();
          // calculateTotalCost() será chamado após a atribuição do precoInput
      } else {
          custoInicialInput.value = '';
          currentVehicleExpenses = [];
          renderAdditionalExpenses();
          // calculateTotalCost() será chamado após a atribuição do precoInput
      }

      precoInput.value = formatNumberToCurrency(veiculo.preco);
      statusSelect.value = veiculo.status || 'DISPONÍVEL';
      // REMOVIDO: envelopeInput.value = veiculo.envelope || '';

      vehicleModal.classList.remove('hidden');
      setupCurrencyListeners(); // Adicionado aqui para aplicar a formatação
      calculateTotalCost(); // Chama para calcular o lucro previsto com os dados carregados
      applyModalRestrictions(userRole);
    } catch (err) {
      console.error('Erro ao carregar veículo para edição:', err);
      alert('Não foi possível carregar os dados do veículo para edição: ' + err.message);
    }
  }

  async function excluirVeiculo(id) {
    if (userRole !== 'gerente') {
        alert('Você não tem permissão para excluir veículos.');
        return;
    }

    console.log('Tentando excluir veículo com ID:', id);
    if (!confirm('Tem certeza que deseja excluir este veículo? Esta ação é irreversível!')) {
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        alert('Sessão expirada ou não autorizado. Faça login novamente.');
        localStorage.clear();
        window.location.href = '/';
        return;
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao excluir veículo.');
      }

      alert('Veículo excluído com sucesso!');
      carregarVeiculos();
    } catch (err) {
      console.error('Erro ao excluir veículo:', err);
      alert('Não foi possível excluir o veículo: ' + err.message);
    }
  }
});