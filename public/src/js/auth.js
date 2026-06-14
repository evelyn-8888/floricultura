// src/js/auth.js
// Sistema de autenticação completo

// Aguardar DOM carregar
document.addEventListener("DOMContentLoaded", () => {
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error("Firebase não inicializado");
        return;
    }

    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    // Elementos da interface
    const userIcon = document.querySelector(".icons .fa-user");
    if (!userIcon) {
        console.warn("Ícone de usuário não encontrado");
        return;
    }

    // Container do ícone (o link que envolve o ícone)
    const userLink = userIcon.parentElement;

    // Função para atualizar a UI baseado no estado do usuário
    function updateAuthUI(user) {
        if (user) {
            // Usuário logado
            const displayName = user.displayName || user.email;
            userIcon.innerHTML = `<i class="fas fa-user-check"></i>`;
            userLink.title = `Logado como ${displayName}`;
            userLink.style.color = "#4caf50";
            
            // Adicionar classe CSS
            userLink.classList.add('user-logged');
            
            // Mostrar nome do usuário em algum lugar (opcional)
            showUserGreeting(displayName);
        } else {
            // Usuário deslogado
            userIcon.innerHTML = `<i class="fas fa-user"></i>`;
            userLink.title = "Fazer login";
            userLink.style.color = "";
            userLink.classList.remove('user-logged');
            removeUserGreeting();
        }
    }

    // Mostrar saudação ao usuário (opcional - pode adicionar no header)
    function showUserGreeting(name) {
        let greetingElement = document.querySelector('.user-greeting');
        if (!greetingElement) {
            greetingElement = document.createElement('div');
            greetingElement.className = 'user-greeting';
            greetingElement.style.cssText = `
                position: absolute;
                top: 60px;
                right: 20px;
                background: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                z-index: 1000;
            `;
            const header = document.querySelector('header');
            if (header) header.appendChild(greetingElement);
        }
        greetingElement.innerHTML = `Olá, ${name.split(' ')[0]}! 👋`;
        greetingElement.style.display = 'block';
        
        // Esconder após 3 segundos
        setTimeout(() => {
            if (greetingElement) greetingElement.style.display = 'none';
        }, 3000);
    }

    function removeUserGreeting() {
        const greetingElement = document.querySelector('.user-greeting');
        if (greetingElement) greetingElement.style.display = 'none';
    }

    // Função para mostrar notificações toast
    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${isError ? '#f44336' : '#4caf50'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInToast 0.3s ease;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: Arial, sans-serif;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutToast 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Adicionar estilos CSS para animações
    if (!document.querySelector('#auth-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-styles';
        style.textContent = `
            @keyframes slideInToast {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutToast {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            .user-logged {
                color: #4caf50 !important;
                transition: all 0.3s ease;
            }
            .user-logged:hover {
                transform: scale(1.1);
                color: #45a049 !important;
            }
            .loading-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #3498db;
                border-radius: 50%;
                animation: spin 0.5s linear infinite;
                margin-right: 8px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Monitorar mudanças no estado de autenticação
    auth.onAuthStateChanged((user) => {
        updateAuthUI(user);
        
        // Disparar evento personalizado para outros scripts
        const authEvent = new CustomEvent('authChanged', { detail: { user } });
        document.dispatchEvent(authEvent);
        
        // Salvar estado no sessionStorage
        if (user) {
            sessionStorage.setItem('userLogged', 'true');
            sessionStorage.setItem('userEmail', user.email);
            sessionStorage.setItem('userName', user.displayName || user.email);
        } else {
            sessionStorage.removeItem('userLogged');
            sessionStorage.removeItem('userEmail');
            sessionStorage.removeItem('userName');
        }
    });

    // Função de login
    async function login() {
        try {
            // Mostrar loading
            const originalContent = userIcon.innerHTML;
            userIcon.innerHTML = '<div class="loading-spinner"></div>';
            
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            console.log("Usuário logado:", user.email);
            showToast(`✨ Bem-vindo(a), ${user.displayName || user.email}! ✨`);
            
            // Salvar informações do usuário no Firestore (opcional)
            await saveUserToFirestore(user);
            
        } catch (error) {
            console.error("Erro no login:", error);
            
            let errorMessage = "Erro ao fazer login. ";
            switch(error.code) {
                case 'auth/popup-blocked':
                    errorMessage = "Popup bloqueado! Permita popups para este site.";
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = "Login cancelado pelo usuário.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Erro de rede. Verifique sua conexão.";
                    break;
                case 'auth/unauthorized-domain':
                    errorMessage = "Domínio não autorizado. Contate o administrador.";
                    break;
                default:
                    errorMessage += error.message;
            }
            showToast(errorMessage, true);
        } finally {
            // Restaurar ícone
            const user = auth.currentUser;
            if (user) {
                userIcon.innerHTML = '<i class="fas fa-user-check"></i>';
            } else {
                userIcon.innerHTML = '<i class="fas fa-user"></i>';
            }
        }
    }

    // Função de logout
    async function logout() {
        const user = auth.currentUser;
        const userName = user?.displayName || user?.email || "usuário";
        
        const confirmLogout = confirm(`🔓 Deseja sair da conta de ${userName}?`);
        
        if (confirmLogout) {
            try {
                await auth.signOut();
                showToast("✅ Logout realizado com sucesso!");
                console.log("Usuário deslogado");
                
                // Redirecionar para home se estiver em página restrita (opcional)
                if (window.location.pathname.includes('admin.html')) {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                }
            } catch (error) {
                console.error("Erro no logout:", error);
                showToast("Erro ao fazer logout. Tente novamente.", true);
            }
        }
    }

    // Salvar usuário no Firestore (opcional)
    async function saveUserToFirestore(user) {
        if (!firebase.firestore) return;
        
        try {
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(user.uid);
            
            await userRef.set({
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log("Usuário salvo no Firestore");
        } catch (error) {
            console.warn("Erro ao salvar usuário no Firestore:", error);
        }
    }

    // Evento de clique no ícone
    let isAuthProcessing = false;
    userLink.addEventListener("click", async (e) => {
        e.preventDefault();
        
        if (isAuthProcessing) return;
        isAuthProcessing = true;
        
        try {
            const user = auth.currentUser;
            if (user) {
                await logout();
            } else {
                await login();
            }
        } finally {
            setTimeout(() => {
                isAuthProcessing = false;
            }, 1000);
        }
    });

    // Verificar autenticação ao carregar página
    console.log("Sistema de autenticação carregado");
});

// Exportar auth para uso em outros módulos (se necessário)
window.auth = firebase.auth();