# Free AI API Setup Guide

## 🎉 Free AI API Options for Your Chatbot

I've configured your chatbot to support multiple **FREE** AI APIs! Here are your options:

---

## 1. 🚀 **GROQ** (Recommended - Fastest & Best Free Option)

### Why Choose Groq?
- ⚡ **Extremely Fast** - Responses in milliseconds
- 🆓 **Free Tier**: 30 requests/minute, 14,400 requests/day
- ✅ **No Credit Card Required**
- 🎯 **High Quality Responses**

### Setup Steps:
1. **Sign up**: Go to https://console.groq.com/
2. **Get API Key**: 
   - Click "API Keys" in the sidebar
   - Click "Create API Key"
   - Copy your API key
3. **Configure**:
   - Open `app/config/ai_config.php`
   - Set `AI_API_TYPE` to `'groq'`
   - Paste your API key in `AI_API_KEY`

### Example Configuration:
```php
define('AI_API_TYPE', 'groq');
define('AI_API_KEY', 'your-groq-api-key-here');
```

---

## 2. 🤗 **Hugging Face** (Free)

### Why Choose Hugging Face?
- 🆓 **Completely Free**
- 🎓 **Open Source Models**
- 📚 **Large Model Library**

### Setup Steps:
1. **Sign up**: Go to https://huggingface.co/
2. **Get API Key**: 
   - Go to https://huggingface.co/settings/tokens
   - Click "New token"
   - Copy your token
3. **Configure**:
   - Set `AI_API_TYPE` to `'huggingface'`
   - Paste your token in `AI_API_KEY`

---

## 3. 💬 **Cohere** (Free Tier)

### Why Choose Cohere?
- 🆓 **Free Tier**: 100 API calls/minute
- 🌍 **Good for Multiple Languages**
- 📊 **Good Analytics**

### Setup Steps:
1. **Sign up**: Go to https://cohere.com/
2. **Get API Key**: 
   - Go to https://dashboard.cohere.com/api-keys
   - Create a new API key
3. **Configure**:
   - Set `AI_API_TYPE` to `'cohere'`
   - Paste your API key

---

## 4. 🔮 **Google Gemini** (Free Tier)

### Why Choose Gemini?
- 🆓 **Free Tier**: 60 requests/minute
- 🏢 **Backed by Google**
- 🌐 **Multilingual Support**

### Setup Steps:
1. **Sign up**: Go to https://makersuite.google.com/app/apikey
2. **Get API Key**: 
   - Click "Create API Key"
   - Copy your key
3. **Configure**:
   - Set `AI_API_TYPE` to `'gemini'`
   - Paste your API key

---

## ⚙️ Quick Configuration

### Step 1: Choose Your API
Open `app/config/ai_config.php` and change:
```php
define('AI_API_TYPE', 'groq'); // Change to: 'groq', 'huggingface', 'cohere', or 'gemini'
```

### Step 2: Add Your API Key
```php
define('AI_API_KEY', 'paste-your-api-key-here');
```

### Step 3: Save and Test!
1. Save the file
2. Open your chatbot
3. Send a test message

---

## 📊 Comparison Table

| API | Speed | Free Tier | Quality | Ease of Setup |
|-----|-------|-----------|---------|---------------|
| **Groq** | ⚡⚡⚡⚡⚡ | 14,400/day | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Hugging Face** | ⚡⚡⚡ | Unlimited* | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Cohere** | ⚡⚡⚡⚡ | 100/min | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Gemini** | ⚡⚡⚡⚡ | 60/min | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

*Hugging Face has rate limits but very generous free tier

---

## 🎯 Recommended: Start with Groq

**Why Groq?**
- Fastest responses
- Easiest to set up
- Best free tier limits
- No credit card needed

### Quick Start with Groq:
1. Visit: https://console.groq.com/
2. Sign up (free, no credit card)
3. Get API key
4. Update `app/config/ai_config.php`:
   ```php
   define('AI_API_TYPE', 'groq');
   define('AI_API_KEY', 'your-groq-key-here');
   ```
5. Done! 🎉

---

## 🐛 Troubleshooting

### API Key Not Working?
- Make sure you copied the entire key (no spaces)
- Check if the API key is active in your account
- Verify `AI_API_TYPE` matches your chosen provider

### Still Getting Errors?
- Check browser console (F12) for error messages
- Visit `api/test_chatbot.php` to test your configuration
- Make sure CURL is enabled in PHP

---

## 🔒 Security Note

**Never commit your API keys to version control!**

Add this to your `.gitignore`:
```
app/config/ai_config.php
```

Or use environment variables for production.

---

## 📝 Need Help?

If you encounter any issues:
1. Check the error message in the chatbot
2. Visit `api/test_chatbot.php` for diagnostics
3. Check the browser console (F12) for JavaScript errors

Happy chatting! 🚀

