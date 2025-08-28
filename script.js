// Configurações
const CLIENT_ID = "1410654667490197641";
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

// Dados de exemplo de contas Roblox
const sampleRobloxAccounts = [
    {
        id: 1,
        messageId: "123456789",
        username: "Ethchacoc",
        password: "Lok1_3008'",
        ip: "91.173.167.33",
        robux: "0",
        premium: false,
        cookie: "COOKIE_ROBLOX_AQUI",
        age: "1109 Dias",
        status: "Unverified (No Email Address)",
        description: "Conta Roblox com 1109 dias de idade. Ideal para quem busca uma conta estabelecida.",
        features: [
            "Idade: 1109 Dias",
            "Status: Não verificado",
            "IP: 91.173.167.33",
            "Robux: 0",
            "Premium: Não"
        ],
        imageUrl: "https://via.placeholder.com/300x160/5865F2/FFFFFF?text=Roblox+Account",
        isVip: false,
        createdAt: "2023-11-15T10:30:00Z"
    },
    {
        id: 2,
        messageId: "987654321",
        username: "PremiumUser",
        password: "PremiumPass123",
        ip: "192.168.1.1",
        robux: "2500",
        premium: true,
        cookie: "COOKIE_PREMIUM_AQUI",
        age: "500 Dias",
        status: "Verified",
        description: "Conta Roblox Premium com 2500 Robux. Perfeita para jogadores experientes.",
        features: [
            "Idade: 500 Dias",
            "Status: Verificado",
            "Robux: 2500",
            "Premium: Sim",
            "Itens exclusivos"
        ],
        imageUrl: "https://via.placeholder.com/300x160/00C853/FFFFFF?text=Premium+Account",
        isVip: true,
        createdAt: "2023-11-14T15:45:00Z"
    }
];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    setupCopyButtons();
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

// Configurar botões de copiar
function setupCopyButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-btn')) {
            const value = e.target.getAttribute('data-value');
            copyToClipboard(value, e.target);
        }
    });
}

// Adicionar esta função para configurar os filtros
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            renderDrops(filter);
        });
    });
}

// Modificar a função renderDrops para aceitar filtro
function renderDrops(filter = 'all') {
    clearDrops();
    
    if (!user || userRoles.length === 0) {
        showNoAccessMessage();
        return;
    }
    
    const canSeeVip = userRoles.includes(VIP_ROLE_ID) || userRoles.includes(OWNER_ROLE_ID);
    const isOwner = userRoles.includes(OWNER_ROLE_ID);
    
    let filteredDrops = drops;
    
    if (filter === 'normal') {
        filteredDrops = drops.filter(drop => !drop.isVip);
    } else if (filter === 'vip') {
        filteredDrops = drops.filter(drop => drop.isVip);
        if (!canSeeVip) {
            filteredDrops = [];
        }
    }
    
    if (filteredDrops.length === 0) {
        showNoDropsMessage();
        return;
    }
    
    filteredDrops.forEach(drop => {
        const dropElement = createRobloxAccountElement(drop, isOwner);
        dropsGrid.appendChild(dropElement);
    });
}

// Não se esqueça de chamar setupFilters() no DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    setupFilters(); // ← Adicionar esta linha
    setupCopyButtons();
});

// Função para copiar para a área de transferência
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        // Feedback visual
        const originalText = button.textContent;
        button.textContent = '✓ Copiado!';
        button.style.background = '#00C853';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar. Tente novamente.');
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
        
        if (userRoles.length > 0) {
            updateUIAfterLogin();
            loadDrops();
        } else {
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

// Simular verificação de cargos
function simulateRoleCheck() {
    const userId = user.id;
    const lastDigit = parseInt(userId[userId.length - 1]);
    
    if (lastDigit % 2 === 0) {
        userRoles = [MEMBER_ROLE_ID, VIP_ROLE_ID];
    } else {
        userRoles = [MEMBER_ROLE_ID];
    }
    
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
    drops = sampleRobloxAccounts;
    renderDrops();
}

// Renderizar drops
function renderDrops() {
    clearDrops();
    
    if (!user || userRoles.length === 0) {
        showNoAccessMessage();
        return;
    }
    
    const canSeeVip = userRoles.includes(VIP_ROLE_ID) || userRoles.includes(OWNER_ROLE_ID);
    const isOwner = userRoles.includes(OWNER_ROLE_ID);
    
    const filteredDrops = drops.filter(drop => {
        return !drop.isVip || canSeeVip;
    });
    
    if (filteredDrops.length === 0) {
        showNoDropsMessage();
        return;
    }
    
    filteredDrops.forEach(drop => {
        const dropElement = createRobloxAccountElement(drop, isOwner);
        dropsGrid.appendChild(dropElement);
    });
}

// Criar elemento de card para conta Roblox
function createRobloxAccountElement(account, isOwner) {
    const card = document.createElement('div');
    card.className = 'drop-card';
    card.dataset.id = account.id;
    
    const isVipOnly = account.isVip;
    
    card.innerHTML = `
        ${isVipOnly ? '<div class="vip-badge">VIP</div>' : '<div class="drop-badge">ROBLOX</div>'}
        <img src="${account.imageUrl}" alt="${account.username}" class="drop-image">
        <div class="drop-content">
            <h3 class="drop-title">${account.username}</h3>
            <div class="drop-price">${account.robux} Robux • ${account.age}</div>
            
            <ul class="drop-features">
                ${account.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            
            <div class="account-credentials">
                <div class="credential-item">
                    <span>Usuário: </span>
                    <span class="credential-value">${account.username}</span>
                    <button class="copy-btn" data-value="${account.username}">Copiar</button>
                </div>
                
                <div class="credential-item">
                    <span>Senha: </span>
                    <span class="credential-value">••••••••</span>
                    <button class="copy-btn" data-value="${account.password}">Copiar</button>
                </div>
                
                <div class="credential-item">
                    <span>Cookie: </span>
                    <span class="credential-value">••••••••</span>
                    <button class="copy-btn" data-value="${account.cookie}">Copiar</button>
                </div>
            </div>
            
            <p class="drop-description">${account.description}</p>
            
            <div class="drop-footer">
                <button class="claim-btn">Resgatar Agora</button>
                ${isOwner ? '<button class="delete-btn">🗑️</button>' : ''}
            </div>
        </div>
    `;
    
    const claimBtn = card.querySelector('.claim-btn');
    claimBtn.addEventListener('click', () => {
        alert(`Você está resgatando a conta: ${account.username}\n${account.robux} Robux`);
    });
    
    if (isOwner) {
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja deletar a conta "${account.username}"?`)) {
                deleteDrop(account.id);
            }
        });
    }
    
    return card;
}

// Deletar drop
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
    
    const loginBtn = dropsGrid.querySelector('.login-btn');
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });
}

// Mostrar mensagem quando não há drops
function showNoDropsMessage() {
    dropsGrid.innerHTML = `
        <div class="no-drops">
            <h3>Nenhuma conta disponível no momento</h3>
            <p>Volte mais tarde para ver novidades!</p>
        </div>
    `;
}

// Processar hash na carga inicial
processHash();
