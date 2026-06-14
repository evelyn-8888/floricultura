// Aguarda o DOM completamente carregado antes de executar
document.addEventListener("DOMContentLoaded", () => {
    // Verifica se o Firebase já foi inicializado
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error("Firebase não foi inicializado. Certifique-se de que o script do Firebase está carregado antes.");
        return;
    }

    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Configurações adicionais para o provider (opcional)
    provider.setCustomParameters({
        prompt: 'select_account' // Força seleção de conta a cada login
    });

    // Elemento do ícone de usuário (suporta múltiplos seletores)
    const loginIcon = document.querySelector(".fa-user, .user-icon, [data-login-icon]");
    if (!loginIcon) {
        console.warn("Ícone de usuário não encontrado. Verifique se o elemento existe.");
        return;
    }

    // Função para atualizar a interface conforme estado de autenticação
    function updateAuthUI(user) {
        if (user) {
            // Opção 1: Ícone com check
            loginIcon.innerHTML = `<i class="fas fa-user-check"></i>`;
            loginIcon.title = `Logado como ${user.displayName || user.email}`;
            
            // Opção 2: Mostrar avatar/foto do usuário (se disponível)
            if (user.photoURL) {
                loginIcon.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width: 20px; height: 20px; border-radius: 50%;">`;
            }
            
            // Adicionar classe CSS para estilização
            loginIcon.classList.add('user-logged');
        } else {
            loginIcon.innerHTML = `<i class="fas fa-user"></i>`;
            loginIcon.title = "Fazer login";
            loginIcon.classList.remove('user-logged');
        }
    }

    // Observa mudanças no estado de autenticação
    auth.onAuthStateChanged((user) => {
        updateAuthUI(user);
        
        // Disparar evento personalizado para outras partes do site
        const authEvent = new CustomEvent('authStateChanged', { detail: { user } });
        document.dispatchEvent(authEvent);
    });

    // Função para fazer logout com feedback melhorado
    async function logout() {
        const user = auth.currentUser;
        const userName = user.displayName || user.email;
        
        // Usar modal customizado em vez de confirm (opcional)
        const confirmLogout = confirm(`Deseja sair da conta de ${userName}?`);
        
        if (confirmLogout) {
            try {
                await auth.signOut();
                console.log("Usuário deslogado com sucesso");
                showToast("Logout realizado com sucesso!", "success");
            } catch (error) {
                console.error("Erro ao fazer logout:", error);
                showToast("Erro ao fazer logout. Tente novamente.", "error");
            }
        }
    }

    // Função para fazer login com tratamento de erros melhorado
    async function login() {
        try {
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            console.log("Usuário logado:", user.email);
            showToast(`Bem-vindo(a), ${user.displayName || user.email}!`, "success");
            
            // Redirecionar após login (opcional)
            // window.location.href = "/dashboard";
            
        } catch (error) {
            console.error("Erro no login:", error);
            
            switch(error.code) {
                case 'auth/popup-blocked':
                    showToast("Popup bloqueado! Permita popups para este site.", "warning");
                    break;
                case 'auth/popup-closed-by-user':
                    showToast("Login cancelado.", "info");
                    break;
                case 'auth/network-request-failed':
                    showToast("Erro de rede. Verifique sua conexão.", "error");
                    break;
                default:
                    showToast(`Erro: ${error.message}`, "error");
            }
        }
    }

    // Função auxiliar para mostrar notificações (toast)
    function showToast(message, type = 'info') {
        // Criar elemento toast se não existir
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
            `;
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            margin-top: 10px;
            border-radius: 4px;
            font-size: 14px;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Adicionar estilos CSS para as animações (se não existirem)
    if (!document.querySelector('#auth-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Evento de clique com debounce para evitar múltiplos cliques
    let isProcessing = false;
    loginIcon.addEventListener("click", async (e) => {
        e.preventDefault();
        
        if (isProcessing) return;
        
        isProcessing = true;
        
        try {
            const user = auth.currentUser;
            if (user) {
                await logout();
            } else {
                await login();
            }
        } finally {
            setTimeout(() => {
                isProcessing = false;
            }, 1000);
        }
    });
});