document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o recarregamento da página

            const username = loginForm.username.value;
            const password = loginForm.password.value;

            loginMessage.textContent = ''; // Limpa mensagens anteriores
            loginMessage.classList.add('hidden');

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Login bem-sucedido: Salva o token e redireciona
                    localStorage.setItem('jwtToken', data.token);
                    localStorage.setItem('userRole', data.user.role); // Salva o papel do usuário
                    localStorage.setItem('companyId', data.user.companyId); // Salva o companyId
                    localStorage.setItem('userId', data.user.id); // Salva o ID do usuário
                    localStorage.setItem('userName', data.user.nomeCompleto); // Salva o nome completo do usuário

                    loginMessage.textContent = 'Login bem-sucedido! Redirecionando...';
                    loginMessage.classList.remove('text-red-500');
                    loginMessage.classList.add('text-green-500', 'block');

                    // Redireciona para o dashboard após um pequeno atraso
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000); // 1 segundo
                } else {
                    // Login falhou: Exibe a mensagem de erro do backend
                    loginMessage.textContent = data.message || 'Erro no login. Tente novamente.';
                    loginMessage.classList.remove('text-green-500');
                    loginMessage.classList.add('text-red-500', 'block');
                }
            } catch (error) {
                console.error('Erro na requisição de login:', error);
                loginMessage.textContent = 'Erro ao conectar ao servidor. Tente novamente mais tarde.';
                loginMessage.classList.remove('text-green-500');
                loginMessage.classList.add('text-red-500', 'block');
            }
        });
    }
});