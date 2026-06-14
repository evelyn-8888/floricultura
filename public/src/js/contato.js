// src/js/faleconosco.js
document.addEventListener("DOMContentLoaded", () => {
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error("Firebase não inicializado");
        return;
    }

    const db = firebase.firestore();
    
    // Referência para a coleção de mensagens
    const mensagensRef = db.collection('mensagens_contato');
    
    // Capturar o formulário
    const formContato = document.getElementById('formContato');
    
    if (formContato) {
        formContato.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Capturar dados do formulário
            const dadosContato = {
                nome: document.getElementById('nome')?.value || '',
                email: document.getElementById('email')?.value || '',
                telefone: document.getElementById('telefone')?.value || '',
                assunto: document.getElementById('assunto')?.value || '',
                mensagem: document.getElementById('mensagem')?.value || '',
                dataEnvio: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'nao_lido', // nao_lido, lido, respondido
                ip: await getIP()
            };
            
            // Validar campos obrigatórios
            if (!dadosContato.nome || !dadosContato.email || !dadosContato.mensagem) {
                mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'erro');
                return;
            }
            
            // Validar email
            if (!validarEmail(dadosContato.email)) {
                mostrarMensagem('Por favor, informe um e-mail válido.', 'erro');
                return;
            }
            
            try {
                // Mostrar loading
                const btnEnviar = formContato.querySelector('button[type="submit"]');
                const textoOriginal = btnEnviar.textContent;
                btnEnviar.textContent = 'Enviando...';
                btnEnviar.disabled = true;
                
                // Salvar no Firestore
                const docRef = await mensagensRef.add(dadosContato);
                
                console.log("Mensagem salva com ID:", docRef.id);
                mostrarMensagem('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'sucesso');
                formContato.reset();
                
                // Opcional: enviar email de confirmação
                await enviarEmailConfirmacao(dadosContato.email, dadosContato.nome);
                
            } catch (error) {
                console.error("Erro ao salvar mensagem:", error);
                mostrarMensagem('Erro ao enviar mensagem. Tente novamente mais tarde.', 'erro');
            } finally {
                // Restaurar botão
                const btnEnviar = formContato.querySelector('button[type="submit"]');
                btnEnviar.textContent = 'Enviar Mensagem';
                btnEnviar.disabled = false;
            }
        });
    }
    
    // Funções auxiliares
    function validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    async function getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'IP não disponível';
        }
    }
    
    async function enviarEmailConfirmacao(email, nome) {
        // Se você tiver um backend, pode enviar email aqui
        console.log(`Email de confirmação enviado para ${email}`);
        // Implementar com Firebase Functions se necessário
    }
    
    function mostrarMensagem(mensagem, tipo) {
        // Criar elemento de mensagem
        const msgDiv = document.createElement('div');
        msgDiv.className = `mensagem-${tipo}`;
        msgDiv.textContent = mensagem;
        msgDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            background: ${tipo === 'sucesso' ? '#4caf50' : '#f44336'};
            color: white;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(msgDiv);
        
        setTimeout(() => {
            msgDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => msgDiv.remove(), 300);
        }, 5000);
    }
    
    // Adicionar estilos para animações
    if (!document.querySelector('#msg-styles')) {
        const style = document.createElement('style');
        style.id = 'msg-styles';
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
});