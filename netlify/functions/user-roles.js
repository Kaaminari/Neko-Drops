const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS CORRIGIDO
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-netlify-headers',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🔍 Iniciando verificação de user-roles...');
    
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token de acesso necessário' })
      };
    }

    const userToken = authHeader.replace('Bearer ', '');
    console.log('🔑 Token do usuário recebido');

    // Verificar usuário no Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    if (!userResponse.ok) {
      console.log('❌ Token de usuário inválido');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    const userData = await userResponse.json();
    console.log('👤 Usuário:', userData.username);
    
    // VERIFICAÇÃO CRÍTICA - VARIÁVEL CORRETA
    const botToken = process.env.DISCORD_BOT_TOKEN; // ← CORRIGIDO
    if (!botToken) {
      console.log('❌ FALTA: DISCORD_BOT_TOKEN no environment');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Erro de configuração do servidor' })
      };
    }

    // Verificar cargos no servidor
    console.log('🛡️ Usando bot token para verificar cargos...');
    const memberResponse = await fetch(
      `https://discord.com/api/guilds/${process.env.SERVER_ID}/members/${userData.id}`,
      { 
        headers: { 
          Authorization: `Bot ${botToken}` // ← VARIÁVEL CORRIGIDA
        } 
      }
    );

    console.log('📊 Status da resposta do servidor:', memberResponse.status);
    
    if (!memberResponse.ok) {
      console.log('❌ Usuário não está no servidor');
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Usuário não está no servidor' })
      };
    }

    const memberData = await memberResponse.json();
    const userRoles = memberData.roles || [];
    
    console.log('🎯 Cargos do usuário:', userRoles);
    
    const isMember = userRoles.includes(process.env.MEMBER_ROLE_ID);
    const isVip = userRoles.includes(process.env.VIP_ROLE_ID);
    
    console.log('✅ Login bem-sucedido para:', userData.username);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        userId: userData.id,
        username: userData.username,
        avatar: userData.avatar,
        roles: userRoles,
        isMember,
        isVip,
        canAccess: isMember
      })
    };

  } catch (error) {
    console.error('💥 Erro na função user-roles:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
};
