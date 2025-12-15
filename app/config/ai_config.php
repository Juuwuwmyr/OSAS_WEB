<?php
/**
 * AI API Configuration
 * 
 * FREE API OPTIONS:
 * 
 * 1. GROQ (Recommended - Very Fast & Free)
 *    - Sign up: https://console.groq.com/
 *    - Get API key: https://console.groq.com/keys
 *    - Free tier: 30 requests/minute, 14,400 requests/day
 *    - Set AI_API_TYPE to 'groq'
 * 
 * 2. HUGGING FACE (Free)
 *    - Sign up: https://huggingface.co/
 *    - Get API key: https://huggingface.co/settings/tokens
 *    - Free tier: Limited but generous
 *    - Set AI_API_TYPE to 'huggingface'
 * 
 * 3. COHERE (Free Tier)
 *    - Sign up: https://cohere.com/
 *    - Get API key: https://dashboard.cohere.com/api-keys
 *    - Free tier: 100 API calls/minute
 *    - Set AI_API_TYPE to 'cohere'
 * 
 * 4. GOOGLE GEMINI (Free Tier)
 *    - Sign up: https://makersuite.google.com/app/apikey
 *    - Free tier: 60 requests/minute
 *    - Set AI_API_TYPE to 'gemini'
 */

// AI API Type: 'openai', 'groq', 'huggingface', 'cohere', 'gemini', or 'custom'
define('AI_API_TYPE', 'gemini'); // Change to 'groq' for free API

// Your AI API Key (keep this secure!)
// Get your free API key from one of the services above
define('AI_API_KEY', 'AIzaSyAfKXEQCJEvnVskAGRj1jFQg6sLvSrFokg'); // Paste your free API key here

// API Configuration (automatically set based on AI_API_TYPE)
// You can also manually override these if needed
if (AI_API_TYPE === 'groq') {
    define('AI_API_URL', 'https://api.groq.com/openai/v1/chat/completions');
    define('AI_MODEL', 'llama-3.1-8b-instant'); // or 'mixtral-8x7b-32768', 'llama-3.1-70b-versatile'
} elseif (AI_API_TYPE === 'huggingface') {
    define('AI_API_URL', 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct');
    define('AI_MODEL', 'meta-llama/Meta-Llama-3-8B-Instruct');
} elseif (AI_API_TYPE === 'cohere') {
    define('AI_API_URL', 'https://api.cohere.ai/v1/chat');
    define('AI_MODEL', 'command-r-plus'); // or 'command-r', 'command'
} elseif (AI_API_TYPE === 'gemini') {
    define('AI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent');
    define('AI_MODEL', 'gemini-pro');
} else {
    // OpenAI (default)
    define('AI_API_URL', 'https://api.openai.com/v1/chat/completions');
    define('AI_MODEL', 'gpt-3.5-turbo');
} 

define('USE_DATABASE_CONTEXT', true);

// SSL Certificate Verification (for local development)
// Set to false if you're getting SSL certificate errors in local development
// WARNING: Always set to true in production for security!
define('VERIFY_SSL_CERTIFICATE', false); // Set to true in production

