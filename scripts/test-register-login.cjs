const axios = require('axios');
require('dotenv').config();

(async () => {
  const raw = process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:9999'
  const base = raw.endsWith('/api') ? raw : raw.replace(/\/$/, '') + '/api'
  const username = 'cliuser_' + Math.floor(Math.random()*100000);
  const password = 'Pass1234';
  try {
    console.log('Registering:', username);
    const reg = await axios.post(`${base}/register`, {
      username,
      password,
      confirmPassword: password,
    }, { headers: { 'Content-Type': 'application/json' } });
    console.log('Register status:', reg.status, reg.data);

    console.log('Logging in:', username);
    const login = await axios.post(`${base}/login`, {
      username,
      password,
    }, { headers: { 'Content-Type': 'application/json' } });
    console.log('Login status:', login.status, login.data);
  } catch (e) {
    console.error('Test failed:', e.response ? e.response.status : e.message, e.response ? e.response.data : e);
  }
})();