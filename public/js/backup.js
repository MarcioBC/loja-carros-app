// public/js/backup.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const companyId = localStorage.getItem('companyId');
    const userId = localStorage.getItem('userId');

    // --- Verificação de Autenticação e Redirecionamento (Apenas Gerente pode acessar) ---
    if (!token || !userRole || !userName || !companyId || !userId || userRole !== 'gerente') {
        alert('Acesso negado. Apenas Gerentes podem acessar a página de Backup.');
        localStorage.clear();
        window.location.href = '/';
        return;
    }

    // --- Elementos do DOM (CABEÇALHO E SIDEBAR) ---
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const logoutButton = document.getElementById('logoutButton');
    const mainNav = document.getElementById('main-nav');
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    // --- Elementos do Backup/Importar INDIVIDUAL ---
    const exportButtons = document.querySelectorAll('.btn-export');
    const importFileInput = document.getElementById('importFileInput');
    const importDataTypeSelect = document.getElementById('importDataType');
    const btnImportData = document.getElementById('btnImportData');
    const importMessage = document.getElementById('importMessage');

    // --- Elementos do Backup/Importar COMPLETO ---
    const exportFullBackupButton = document.getElementById('exportFullBackupButton');
    const importFullBackupFile = document.getElementById('importFullBackupFile');
    const importFullBackupButton = document.getElementById('importFullBackupButton');
    const fullBackupMessageDiv = document.getElementById('fullBackupMessage');
    const fullBackupLoadingDiv = document.getElementById('fullBackupLoading');


    // --- Preencher Informações do Usuário no Cabeçalho ---
    if (userNameDisplay) userNameDisplay.textContent = userName;
    if (userRoleDisplay) userRoleDisplay.textContent = userRole.toUpperCase();

    // FUNÇÃO PARA BUSCAR E EXIBIR NOME DA EMPRESA
    async function fetchCompanyName() {
        if (!companyNameDisplay) return;
        try {
            const response = await fetch(`/api/companies/${companyId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const company = await response.json();
                companyNameDisplay.textContent = company.nome;
            } else {
                console.error('Erro ao buscar nome da empresa:', response.statusText);
                companyNameDisplay.textContent = 'N/A';
            }
        } catch (e) {
            console.error('Erro na requisição da empresa:', e);
            companyNameDisplay.textContent = 'N/A';
        }
    }
    fetchCompanyName();

    // --- Lógica do Menu Lateral Dinâmico ---
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
        { name: 'Backup/Restaurar', href: '/backup.html', icon: 'cloud', roles: ['gerente'] },
        { name: 'Arquivo', href: '/arquivo.html', icon: 'archive', roles: ['gerente'] },
        { name: 'Gerenciar Usuários', href: '#userManagement', icon: 'user-cog', roles: ['gerente'], isSpecial: true }
    ];

    function renderMenu() {
        if (!mainNav) return;
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

    // --- Lógica do Sidebar e Logout ---
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

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.clear();
                window.location.href = '/';
            }
        });
    }

    // --- Funções Auxiliares para Mensagens ---
    function showMessage(element, message, isError = true) {
        element.textContent = message;
        element.classList.remove('hidden');
        if (isError) {
            element.classList.remove('text-green-500', 'bg-d4edda'); // Remove success classes
            element.classList.add('text-red-500', 'bg-f8d7da', 'border-f5c6cb'); // Add error classes
        } else {
            element.classList.remove('text-red-500', 'bg-f8d7da', 'border-f5c6cb'); // Remove error classes
            element.classList.add('text-green-500', 'bg-d4edda', 'border-c3e6cb'); // Add success classes
        }
    }
    function clearMessage(element) {
        element.textContent = '';
        element.classList.add('hidden');
        element.classList.remove('text-red-500', 'bg-f8d7da', 'border-f5c6cb', 'text-green-500', 'bg-d4edda', 'border-c3e6cb');
    }
    function setLoading(element, isLoading) {
        if (isLoading) {
            element.classList.remove('hidden');
            clearMessage(fullBackupMessageDiv); // Limpa mensagens anteriores
        } else {
            element.classList.add('hidden');
        }
    }


    // --- Lógica de Exportação INDIVIDUAL (Original do seu arquivo) ---
    exportButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const dataType = e.target.dataset.type;
            const format = e.target.dataset.format;

            if (!dataType || !format) {
                alert('Erro: Tipo de dado ou formato de exportação não especificado.');
                return;
            }

            try {
                const url = `/api/export/${dataType}?companyId=${companyId}&format=${format}`;
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 401 || response.status === 403) {
                        alert('Sessão expirada ou não autorizado para exportar. Faça login novamente.');
                        localStorage.clear();
                        window.location.href = '/';
                    } else {
                        alert(`Erro ao exportar ${dataType}: ${errorData.message || response.statusText}`);
                    }
                    console.error(`Erro HTTP ${response.status} ao exportar ${dataType}:`, errorData);
                    return;
                }

                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `${dataType}.${format}`;
                if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
                    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1];
                    }
                }
                
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = downloadUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                document.body.removeChild(a);

            } catch (error) {
                console.error('Erro ao iniciar exportação individual:', error);
                alert('Não foi possível iniciar a exportação. Verifique o console para mais detalhes.');
            }
        });
    });

    // --- Lógica de Importação INDIVIDUAL (Original do seu arquivo) ---
    let importedFileContent = null;

    importFileInput.addEventListener('change', (e) => {
        clearMessage(importMessage);
        const file = e.target.files[0];
        if (file) {
            const isJson = file.type === 'application/json' || file.name.endsWith('.json');
            const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');

            if (!isJson && !isCsv) {
                showMessage(importMessage, 'Por favor, selecione um arquivo JSON ou CSV.', true);
                importFileInput.value = '';
                btnImportData.disabled = true;
                importDataTypeSelect.value = '';
                return;
            }
            
            importedFileContent = file; 
            showMessage(importMessage, `Arquivo "${file.name}" carregado. Selecione o tipo de dado para importar.`, false);
            btnImportData.disabled = !(importedFileContent && importDataTypeSelect.value); 

        } else {
            importedFileContent = null;
            importFileInput.value = '';
            btnImportData.disabled = true;
            importDataTypeSelect.value = '';
        }
    });

    importDataTypeSelect.addEventListener('change', () => {
        btnImportData.disabled = !(importedFileContent && importDataTypeSelect.value);
    });

    btnImportData.addEventListener('click', async () => {
        clearMessage(importMessage);
        if (!importedFileContent) {
            showMessage(importMessage, 'Por favor, carregue um arquivo JSON ou CSV primeiro.', true);
            return;
        }
        const dataType = importDataTypeSelect.value;
        if (!dataType) {
            showMessage(importMessage, 'Por favor, selecione o tipo de dados a importar.', true);
            return;
        }

        if (!confirm(`Tem certeza que deseja IMPORTAR dados para ${dataType.toUpperCase()}? Esta ação pode adicionar novos dados ou duplicar. Use com extrema cautela!`)) {
            return;
        }

        try {
            showMessage(importMessage, 'Iniciando importação... Isso pode levar algum tempo.', false);
            btnImportData.disabled = true;

            const formData = new FormData();
            formData.append('file', importedFileContent);
            formData.append('companyId', companyId);

            const response = await fetch(`/api/import/${dataType}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(importMessage, result.message || `Dados de ${dataType} importados com sucesso!`, false);
                importFileInput.value = '';
                importDataTypeSelect.value = '';
                importedFileContent = null;
            } else {
                showMessage(importMessage, result.message || `Erro ao importar dados de ${dataType}.`, true);
                console.error('Erro detalhado da importação:', result);
            }
        } catch (error) {
            showMessage(importMessage, 'Erro de conexão ao servidor durante a importação.', true);
            console.error('Erro na requisição de importação:', error);
        } finally {
            btnImportData.disabled = !(importFileInput.files.length > 0 && importDataTypeSelect.value);
        }
    });

    // --- NOVAS LÓGICAS PARA BACKUP COMPLETO (UM ÚNICO BOTÃO) ---

    // Lógica para exportar backup completo
    exportFullBackupButton.addEventListener('click', async () => {
        setLoading(fullBackupLoadingDiv, true);
        try {
            const response = await fetch('/api/backup/full-export', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const filename = `backup_sistema_completo_${new Date().toISOString().slice(0, 10)}.json`;
                // Função auxiliar para download
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                showMessage(fullBackupMessageDiv, 'Backup completo exportado com sucesso!', false);
            } else {
                const errorData = await response.json();
                showMessage(fullBackupMessageDiv, `Erro ao exportar backup: ${errorData.message || 'Erro desconhecido'}`, true);
                console.error('Erro na requisição de exportação completa:', errorData);
            }
        } catch (error) {
            console.error('Erro de rede ou servidor ao exportar backup completo:', error);
            showMessage(fullBackupMessageDiv, `Erro de rede ou servidor ao exportar: ${error.message}`, true);
        } finally {
            setLoading(fullBackupLoadingDiv, false);
        }
    });

    // Lógica para habilitar/desabilitar botão de importação completa
    importFullBackupFile.addEventListener('change', () => {
        clearMessage(fullBackupMessageDiv);
        const file = importFullBackupFile.files[0];
        if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
            importFullBackupButton.disabled = false;
            showMessage(fullBackupMessageDiv, `Arquivo "${file.name}" selecionado para importação.`, false);
        } else {
            importFullBackupButton.disabled = true;
            importFullBackupFile.value = ''; // Limpa a seleção do arquivo
            showMessage(fullBackupMessageDiv, 'Por favor, selecione um arquivo JSON válido.', true);
        }
    });

    // Lógica para importar backup completo
    importFullBackupButton.addEventListener('click', async () => {
        const file = importFullBackupFile.files[0];
        if (!file) {
            showMessage(fullBackupMessageDiv, 'Nenhum arquivo selecionado para importação.', true);
            return;
        }

        if (!confirm('Tem certeza que deseja IMPORTAR este backup completo? Esta ação adicionará dados ao seu sistema e pode causar DUPLICAÇÃO em campos únicos. É ALTAMENTE RECOMENDADO FAZER UM BACKUP ANTES e entender as implicações!')) {
            return;
        }

        setLoading(fullBackupLoadingDiv, true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/backup/full-import', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(fullBackupMessageDiv, `Importação completa: ${result.message}`, false);
                if (result.detailedErrors && Object.keys(result.detailedErrors).length > 0) {
                    console.warn('Detalhes dos erros de importação completa:', result.detailedErrors);
                    // Adicionar uma mensagem mais visível para erros parciais
                    showMessage(fullBackupMessageDiv, `Importação completa finalizada com SUCESSO, mas com alguns erros em coleções específicas. Verifique o console para detalhes.`, true);
                }
            } else {
                showMessage(fullBackupMessageDiv, `Erro na importação completa: ${result.message || 'Erro desconhecido'}`, true);
                console.error('Erro detalhado da importação completa:', result.detailedErrors || result);
            }
        } catch (error) {
            console.error('Erro de rede ou servidor durante a importação completa:', error);
            showMessage(fullBackupMessageDiv, `Erro de rede ou servidor ao importar: ${error.message}`, true);
        } finally {
            setLoading(fullBackupLoadingDiv, false);
            importFullBackupFile.value = ''; // Limpa o campo de arquivo
            importFullBackupButton.disabled = true; // Desabilita o botão após a operação
        }
    });

});