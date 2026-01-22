// Configuratie voor email API
// Voor lokale ontwikkeling: zet EMAIL_API_KEY in je environment variables
// Voor productie: gebruik de API key uit Vercel environment variables
module.exports = {
  API_URL: process.env.API_URL || 'https://mailingsmpt-strato.vercel.app',
  API_KEY: process.env.EMAIL_API_KEY || 'manege-strato-email-2026-secure-key-99xtif26dpbjjnp9x4hzrh', // Fallback voor lokale tests
};
