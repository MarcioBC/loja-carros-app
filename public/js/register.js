// public/js/register.js
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const companyIdInput = document.getElementById('companyId');
    const pinCadastroInput = document.getElementById('pinCadastro');
    const roleSelect = document.getElementById('role');
    const messageDiv = document.getElementById('message');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nome = nameInput.value.trim();
            const email = emailInput.value.trim();
            const senha = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const companyId = companyIdInput.value.trim();
            const pinCadastro = pinCadastroInput.value.trim();
            const role = roleSelect.value;

            messageDiv.textContent = '';
            messageDiv.style.display = 'none';
            messageDiv.classList.remove('error', 'success');

            if (senha !== confirmPassword) {
                messageDiv.textContent = 'As senhas não coincidem!';
                messageDiv.classList.add('error');
                messageDiv.style.display = 'block';
                return;
            }

            if (!nome || !email || !senha || !companyId || !pinCadastro || !role) {
                messageDiv.textContent = 'Por favor, preencha todos os campos.';
                messageDiv.classList.add('error');
                messageDiv.style.display = 'block';
                return;
            }

            console.log('--- Dados de Registro (Frontend - ANTES DO ENVIO) ---');
            console.log('PIN de cadastro a ser enviado:', pinCadastro);
            console.log('Company ID a ser enviado:', companyId);
            console.log('Role a ser enviado:', role);

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nome,
                        email,
                        senha,
                        companyId,
                        pinCadastro,
                        role
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = data.message || 'Registro realizado com sucesso! Redirecionando para o login...';
                    messageDiv.classList.add('success');
                    messageDiv.style.display = 'block';

                    if (data.token) {
                        localStorage.setItem('jwtToken', data.token);
                        localStorage.setItem('userId', data.user.id);
                        localStorage.setItem('userName', data.user.nome);
                        localStorage.setItem('userRole', data.user.role);
                        localStorage.setItem('companyId', data.user.companyId);

                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 2000);
                    } else {
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 2000);
                    }
                } else {
                    messageDiv.textContent = data.message || 'Erro ao realizar registro. Tente novamente.';
                    messageDiv.classList.add('error');
                    messageDiv.style.display = 'block';
                    console.error('Erro de registro:', data.message);
                }
            } catch (error) {
                messageDiv.textContent = 'Ocorreu um erro. Verifique sua conexão ou tente mais tarde.';
                messageDiv.classList.add('error');
                messageDiv.style.display = 'block';
                console.error('Erro na requisição de registro:', error);
            }
        });
    }
});
