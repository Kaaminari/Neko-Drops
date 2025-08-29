// functions/user-roles.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Responder a preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const authHeader = event.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token de acesso necessário' })
      };
    }

    const userToken = authHeader.replace('Bearer ', '');
    
    // Verificar usuário no Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    if (!userResponse.ok) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    const userData = await userResponse.json();
    
    // Verificar cargos no servidor
    const memberResponse = await fetch(
      `https://discord.com/api/guilds/${process.env.SERVER_ID}/members/${userData.id}`,
      { 
        headers: { 
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` 
        } 
      }
    );

    if (!memberResponse.ok) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Usuário não está no servidor' })
      };
    }

    const memberData = await memberResponse.json();
    const userRoles = memberData.roles || [];
    
    const isMember = userRoles.includes(process.env.MEMBER_ROLE_ID);
    const isVip = userRoles.includes(process.env.VIP_ROLE_ID);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        userId: userData.id,
        username: userData.username,
        roles: userRoles,
        isMember,
        isVip,
        canAccess: isMember
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
};
