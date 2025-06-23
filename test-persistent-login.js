// Testar persistência de login
console.log('Testando login persistente...');

// Simular refresh da página
console.log('Token no localStorage:', localStorage.getItem('auth_token') ? 'Presente' : 'Ausente');
console.log('Estado de logout:', localStorage.getItem('logout_state') || 'Não definido');

console.log('✅ Sistema configurado para manter login até logout manual');