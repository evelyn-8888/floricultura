// src/js/carrinho.js - Versão CORRIGIDA (sem imports)

// ── Helpers de localStorage ──────────────────────────────────
function getCarrinho() {
    return JSON.parse(localStorage.getItem("carrinho")) || [];
}

function salvarCarrinho(carrinho) {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarContadorHeader();
}

// Atualiza o número no ícone do carrinho no header
function atualizarContadorHeader() {
    const contador = document.getElementById("contador-carrinho");
    if (!contador) return;
    const carrinho = getCarrinho();
    const total = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    contador.textContent = total;
    contador.style.display = total > 0 ? 'inline-block' : 'none';
}

// ── Função chamada pelos botões "Comprar" nas páginas de produto ──
window.adicionarAoCarrinho = function (nome, preco, imagem) {
    let carrinho = getCarrinho();
    const index = carrinho.findIndex((i) => i.nome === nome);

    if (index >= 0) {
        carrinho[index].quantidade++;
    } else {
        carrinho.push({ nome, preco, imagem, quantidade: 1 });
    }

    salvarCarrinho(carrinho);
    
    // Mostrar notificação
    mostrarNotificacao(`${nome} adicionado ao carrinho!`);
    
    // Opção: redirecionar ou não
    // window.location.href = "carrinho.html";
};

// Mostrar notificação temporária
function mostrarNotificacao(mensagem) {
    const toast = document.createElement('div');
    toast.textContent = mensagem;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── Renderização do carrinho ─────────────────────────────────
function renderCarrinho() {
    const carrinho = getCarrinho();
    const tbody = document.getElementById("cart-items-body");
    const empty = document.getElementById("empty-cart-message");
    const actions = document.getElementById("cart-actions");

    if (!tbody) return;

    if (carrinho.length === 0) {
        if (empty) empty.style.display = "block";
        if (actions) actions.style.display = "none";
        atualizarResumo(0);
        return;
    }

    if (empty) empty.style.display = "none";
    if (actions) actions.style.display = "flex";

    let subtotal = 0;
    tbody.innerHTML = "";

    carrinho.forEach((item, index) => {
        const totalItem = item.preco * item.quantidade;
        subtotal += totalItem;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <img src="${item.imagem || 'imagem/produto-placeholder.jpg'}" width="50" style="border-radius:6px;">
                    <span>${item.nome}</span>
                </div>
            </td>
            <td>R$ ${item.preco.toFixed(2)}</td>
            <td>
                <button onclick="diminuirQtd(${index})" class="btn-qtd">-</button>
                <span style="margin: 0 10px;">${item.quantidade}</span>
                <button onclick="aumentarQtd(${index})" class="btn-qtd">+</button>
            </td>
            <td>R$ ${totalItem.toFixed(2)}</td>
            <td>
                <button onclick="removerItem(${index})" class="btn-remover">🗑️ Remover</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    atualizarResumo(subtotal);
}

function atualizarResumo(subtotal) {
    const shipping = 15.90;
    const total = subtotal + shipping;

    const subtotalEl = document.getElementById("subtotal");
    const shippingEl = document.getElementById("shipping");
    const totalEl = document.getElementById("total");

    if (subtotalEl) subtotalEl.innerText = `R$ ${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.innerText = `R$ ${shipping.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `R$ ${total.toFixed(2)}`;
}

// ── Controles de item ────────────────────────────────────────
window.removerItem = function (index) {
    let carrinho = getCarrinho();
    carrinho.splice(index, 1);
    salvarCarrinho(carrinho);
    renderCarrinho();
};

window.aumentarQtd = function (index) {
    let carrinho = getCarrinho();
    carrinho[index].quantidade++;
    salvarCarrinho(carrinho);
    renderCarrinho();
};

window.diminuirQtd = function (index) {
    let carrinho = getCarrinho();
    if (carrinho[index].quantidade > 1) {
        carrinho[index].quantidade--;
    } else {
        carrinho.splice(index, 1);
    }
    salvarCarrinho(carrinho);
    renderCarrinho();
};

// ── Limpar carrinho ──────────────────────────────────────────
function limparCarrinho() {
    if (confirm("Tem certeza que deseja limpar o carrinho?")) {
        localStorage.removeItem("carrinho");
        renderCarrinho();
        atualizarContadorHeader();
    }
}

// ── Finalizar compra → Firebase ──────────────────────────────
async function finalizarCompra(e) {
    if (e) e.preventDefault();

    // Verificar se usuário está logado
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Você precisa estar logado para finalizar a compra!");
        window.location.href = "index.html";
        return;
    }

    const carrinho = getCarrinho();

    if (carrinho.length === 0) {
        alert("Carrinho vazio!");
        return;
    }

    // Coletar dados do formulário
    const nome = document.getElementById("customer-name")?.value;
    const endereco = document.getElementById("customer-address")?.value;
    const cidade = document.getElementById("customer-city")?.value;
    const cep = document.getElementById("customer-zip")?.value;

    if (!nome || !endereco || !cidade || !cep) {
        alert("Por favor, preencha todos os campos do endereço!");
        return;
    }

    const btn = document.getElementById("checkout-btn");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Enviando...';
    }

    const pedido = {
        cliente: {
            uid: user.uid,
            email: user.email,
            nome: nome,
            endereco: endereco,
            cidade: cidade,
            cep: cep
        },
        itens: carrinho,
        subtotal: carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0),
        frete: 15.90,
        total: carrinho.reduce((acc, i) => acc + i.preco * i.quantidade, 0) + 15.90,
        status: "pendente",
        dataPedido: new Date().toISOString()
    };

    try {
        // Salvar no Firestore
        const db = firebase.firestore();
        const docRef = await db.collection("pedidos").add(pedido);
        
        console.log("Pedido salvo com ID:", docRef.id);
        
        // Limpar carrinho
        localStorage.removeItem("carrinho");
        atualizarContadorHeader();
        
        // Mostrar confirmação
        mostrarConfirmacao(docRef.id);
        
    } catch (err) {
        console.error("Erro ao salvar pedido:", err);
        alert("Erro ao finalizar pedido: " + err.message);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '💳 Finalizar Compra';
        }
    }
}

function mostrarConfirmacao(pedidoId) {
    const summary = document.getElementById("cart-summary");
    if (!summary) return;
    
    summary.innerHTML = `
        <div style="text-align:center; padding: 2rem;">
            <i class="fas fa-check-circle" style="font-size:4rem; color:#27ae60;"></i>
            <h3 style="margin-top:1rem;">Pedido Realizado! 🌸</h3>
            <p>Seu pedido foi recebido com sucesso.</p>
            <p style="font-size:.85rem; color:#666;">ID do pedido: <strong>${pedidoId}</strong></p>
            <p>Entraremos em contato em breve!</p>
            <a href="index.html" class="btn" style="margin-top: 20px;">Voltar à Loja</a>
        </div>`;
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    atualizarContadorHeader();

    // Se estiver na página do carrinho
    if (document.getElementById("cart-items-body")) {
        renderCarrinho();
        
        const clearBtn = document.getElementById("clear-cart");
        if (clearBtn) {
            clearBtn.addEventListener("click", limparCarrinho);
        }
        
        const checkoutForm = document.getElementById("shipping-form");
        if (checkoutForm) {
            checkoutForm.addEventListener("submit", finalizarCompra);
        }
    }
});

// Adicionar estilos CSS
const styles = `
    <style>
        .btn-qtd {
            background: #7d4b5c;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
        }
        .btn-qtd:hover {
            background: #5a3542;
        }
        .btn-remover {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
        }
        .btn-remover:hover {
            background: #c0392b;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    </style>
`;

if (!document.querySelector('#carrinho-styles')) {
    const styleTag = document.createElement('div');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
}

