// Configurações
const CLIENT_ID = "1410654667490197641"; // Substitua pelo Client ID do seu app Discord
const REDIRECT_URI = window.location.origin;
const SERVER_ID = "1399661543284805763";
const MEMBER_ROLE_ID = "1399662113114296360";
const VIP_ROLE_ID = "1399662852448587859";
const OWNER_ROLE_ID = "1399664650638856303";

// Elementos DOM
const loginBtn = document.getElementById('login-btn');
const userInfo = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const username = document.getElementById('username');
const dropsGrid = document.getElementById('drops-grid');
const loginModal = document.getElementById('login-modal');
const modalLoginBtn = document.getElementById('modal-login-btn');
const errorModal = document.getElementById('error-modal');
const errorMessage = document.getElementById('error-message');
const errorCloseBtn = document.getElementById('error-close-btn');

// Estado da aplicação
let user = null;
let userRoles = [];
let drops = [];

// Dados de exemplo (substituir por dados reais em produção)
const sampleDrops = [
    {
        id: 1,
        messageId: "123456789",
        title: "Aces Roblox",
        price: "R$ 5,00",
        description: "Este produto é entregue automaticamente após o pagamento. Ideal para quem deseja praticidade e agilidade na sua compra.",
        features: [
            "Contagem segura",
            "Mobilidade em carteiras",
            "Entrega automática",
            "Garantia de funcionamento"
        ],
        imageUrl: "https://via.placeholder.com/300x160/5865F2/FFFFFF?text=Roblox+Account",
        isVip: false,
        createdAt: "2023-11-15T10:30:00Z"
    },
    {
        id: 2,
        messageId: "987654321",
        title: "Conta Roblox Premium",
        price: "R$ 15,00",
        description: "Conta Roblox com itens exclusivos e saldo Robux.",
        features: [
            "500 Robux inclusos",
            "Acesso a jogos premium",
            "Avatar items exclusivos",
            "Suporte prioritário"
        ],
        imageUrl: "https://via.placeholder.com/300x160/00C853/FFFFFF?text=Premium+Account",
        isVip: true,
        createdAt: "2023-11-14T15:45:00Z"
    },
    {
        id: 3,
        messageId: "567891234",
        title: "Kit Iniciante Roblox",
        price: "R$ 7,50",
        description: "Perfeito para quem está começando no Roblox.",
        features: [
            "250 Robux",
            "Itens básicos para avatar",
            "Guia de iniciação",
            "Suporte 24/7"
        ],
        imageUrl: "https://via.placeholder.com/300x160/23272A/FFFFFF?text=Starter+Kit",
        isVip: false,
        createdAt: "2023-11-13T09:15:00Z"
    }
];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Login com Discord
    loginBtn.addEventListener('click', () => {
        if (user) {
            logout();
        } else {
            loginModal.style.display = 'flex';
        }
    });

    // Modal login button
    modalLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginWithDiscord();
    });

    // Fechar modal ao clicar fora
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Error modal close button
    errorCloseBtn.addEventListener('click', () => {
        errorModal.style.display = 'none';
    });

    // Fechar error modal ao clicar fora
    errorModal.addEventListener('click', (e) => {
        if (e.target === errorModal) {
            errorModal.style.display = 'none';
        }
    });
}

// Verificar se o usuário está autenticado
function checkAuth() {
    const token = localStorage.getItem('discord_token');
    const userData = localStorage.getItem('discord_user');
    const rolesData = localStorage.getItem('discord_roles');
    
    if (token && userData) {
        user = JSON.parse(userData);
        if (rolesData) userRoles = JSON.parse(rolesData);
        
        // Verificar se o usuário é membro do servidor
        if (userRoles.length > 0) {
            updateUIAfterLogin();
            loadDrops();
        } else {
            // Se não tem cargos, forçar novo login
            logout();
            showError("Você precisa ser membro do servidor para acessar os drops.");
        }
    }
}

// Login com Discord OAuth2
function loginWithDiscord() {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify%20guilds`;
    window.location.href = authUrl;
}

// Processar token de acesso após redirecionamento
function processHash() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const error = params.get('error');
    
    if (error) {
        showError("Erro ao fazer login: " + error);
        return;
    }
    
    if (accessToken) {
        localStorage.setItem('discord_token', accessToken);
        getUserInfo(accessToken);
        
        // Limpar a hash da URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
                  }

// Obter informações do usuário
async function getUserInfo(token) {
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            user = await response.json();
            localStorage.setItem('discord_user', JSON.stringify(user));
            
            // Verificar cargos do usuário no servidor
            await checkUserRoles(token);
        } else {
            throw new Error('Falha ao obter informações do usuário');
        }
    } catch (error) {
        console.error('Erro:', error);
        showError("Erro ao fazer login. Tente novamente.");
        logout();
    }
}

// Verificar cargos do usuário no servidor
async function checkUserRoles(token) {
    try {
        // Primeiro, verificar se o usuário está no servidor
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        if (guildsResponse.ok) {
            const guilds = await guildsResponse.json();
            const isInServer = guilds.some(guild => guild.id === SERVER_ID);
            
            if (!isInServer) {
                showError("Você precisa ser membro do servidor para acessar os drops.");
                logout();
                return;
            }
            
            // Em uma implementação real, você precisaria de um backend para verificar os cargos
            // Aqui estamos simulando a verificação com dados mockados
            simulateRoleCheck();
        } else {
            throw new Error('Falha ao verificar servidores');
        }
    } catch (error) {
        console.error('Erro ao verificar cargos:', error);
        showError("Erro ao verificar permissões. Tente novamente.");
        logout();
    }
}

// Simular verificação de cargos (substituir por verificação real com backend)
function simulateRoleCheck() {
    // Simular uma resposta com base no ID do usuário
    const userId = user.id;
    
    // Usuários com ID terminando em número par são VIPs, ímpares são membros comuns
    const lastDigit = parseInt(userId[userId.length - 1]);
    
    if (lastDigit % 2 === 0) {
        userRoles = [MEMBER_ROLE_ID, VIP_ROLE_ID];
    } else {
        userRoles = [MEMBER_ROLE_ID];
    }
    
    // 10% de chance de ser owner (para teste)
    if (Math.random() < 0.1) {
        userRoles.push(OWNER_ROLE_ID);
    }
    
    localStorage.setItem('discord_roles', JSON.stringify(userRoles));
    updateUIAfterLogin();
    loadDrops();
}

// Atualizar UI após login
function updateUIAfterLogin() {
    loginBtn.textContent = 'Sair';
    userAvatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
    username.textContent = user.username;
    userInfo.classList.remove('hidden');
    loginModal.style.display = 'none';
}

// Logout
function logout() {
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_user');
    localStorage.removeItem('discord_roles');
    user = null;
    userRoles = [];
    loginBtn.textContent = 'Entrar com Discord';
    userInfo.classList.add('hidden');
    clearDrops();
}

// Mostrar erro
function showError(message) {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

// Carregar drops
function loadDrops() {
    // Em uma implementação real, isso viria de uma API
    // Aqui estamos usando dados de exemplo
    drops = sampleDrops;
    renderDrops();
}

// Renderizar drops
function renderDrops() {
    clearDrops();
    
    // Verificar se o usuário tem permissão para ver drops
    if (!user || userRoles.length === 0) {
        showNoAccessMessage();
        return;
    }
    
    // Filtrar drops com base nos cargos do usuário
    const canSeeVip = userRoles.includes(VIP_ROLE_ID) || userRoles.includes(OWNER_ROLE_ID);
    const isOwner = userRoles.includes(OWNER_ROLE_ID);
    
    const filteredDrops = drops.filter(drop => {
        return !drop.isVip || canSeeVip;
    });
    
    if (filteredDrops.length === 0) {
        showNoDropsMessage();
        return;
    }
    
    // Renderizar cada drop
    filteredDrops.forEach(drop => {
        const dropElement = createDropElement(drop, isOwner);
        dropsGrid.appendChild(dropElement);
    });
}

// Criar elemento de card para um drop
function createDropElement(drop, isOwner) {
    const card = document.createElement('div');
    card.className = 'drop-card';
    card.dataset.id = drop.id;
    
    // Verificar se é VIP apenas
    const isVipOnly = drop.isVip;
    
    card.innerHTML = `
        ${isVipOnly ? '<div class="vip-badge">VIP</div>' : '<div class="drop-badge">NOVO</div>'}
        <img src="${drop.imageUrl}" alt="${drop.title}" class="drop-image">
        <div class="drop-content">
            <h3 class="drop-title">${drop.title}</h3>
            <div class="drop-price">${drop.price}</div>
            <ul class="drop-features">
                ${drop.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            <p class="drop-description">${drop.description}</p>
            <div class="drop-footer">
                <button class="claim-btn">Resgatar Agora</button>
                ${isOwner ? '<button class="delete-btn">🗑️</button>' : ''}
            </div>
        </div>
    `;
    
    // Adicionar evento de clique no botão de resgatar
    const claimBtn = card.querySelector('.claim-btn');
    claimBtn.addEventListener('click', () => {
        alert(`Você está resgatando: ${drop.title}\n${drop.price}`);
    });
    
    // Adicionar evento de clique no botão de deletar (apenas para owners)
    if (isOwner) {
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja deletar o drop "${drop.title}"?`)) {
                deleteDrop(drop.id);
            }
        });
    }
    
    return card;
}

// Deletar drop (apenas para owners)
function deleteDrop(dropId) {
    drops = drops.filter(drop => drop.id !== dropId);
    renderDrops();
}

// Limpar drops
function clearDrops() {
    dropsGrid.innerHTML = '';
}

// Mostrar mensagem quando não há acesso
function showNoAccessMessage() {
    dropsGrid.innerHTML = `
        <div class="no-drops">
            <h3>Acesso Restrito</h3>
            <p>Você precisa ser membro do servidor para visualizar os drops.</p>
            <button class="login-btn" style="margin-top: 15px;">Entrar com Discord</button>
        </div>
    `;
    
    // Adicionar evento de clique no botão de login
    const loginBtn = dropsGrid.querySelector('.login-btn');
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });
}

// Mostrar mensagem quando não há drops
function showNoDropsMessage() {
    dropsGrid.innerHTML = `
        <div class="no-drops">
            <h3>Nenhum drop disponível no momento</h3>
            <p>Volte mais tarde para ver novidades!</p>
        </div>
    `;
}

// Processar hash na carga inicial (para OAuth2)
processHash();
