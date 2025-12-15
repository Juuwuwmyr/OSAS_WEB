# Chatbot Setup Guide

## Overview

The chatbot has been successfully added to your OSAS system! It appears in both the admin and user sidebars, and also as a floating button in the bottom-right corner.

## Features

- ✅ Integrated in sidebar menu
- ✅ Floating chat button
- ✅ AI-powered responses using OpenAI API (or custom API)
- ✅ Optional database context integration
- ✅ Conversation history
- ✅ Modern, responsive UI
- ✅ Dark mode support

## Configuration

### Step 1: Set Your AI API Key

1. Open `app/config/ai_config.php`
2. Set your OpenAI API key:
   ```php
   define('AI_API_KEY', 'your-api-key-here');
   ```

   **Get your API key from:** https://platform.openai.com/api-keys

### Step 2: Configure API Settings (Optional)

You can customize the following in `app/config/ai_config.php`:

- **AI_API_TYPE**: `'openai'` or `'custom'` (default: `'openai'`)
- **AI_MODEL**: Model to use (default: `'gpt-3.5-turbo'`)
  - Options: `'gpt-3.5-turbo'`, `'gpt-4'`, `'gpt-4-turbo'`, etc.
- **USE_DATABASE_CONTEXT**: Whether to include database info in prompts (default: `true`)
  - Set to `false` if you don't want the chatbot to access database information

### Step 3: Test the Chatbot

1. Log in to your OSAS system (admin or user account)
2. Click the "Chatbot" option in the sidebar, or click the floating chat button
3. Type a message and send it
4. The chatbot should respond using the AI API

## Database Context

When `USE_DATABASE_CONTEXT` is enabled, the chatbot can access:
- System statistics (student count, department count, violation count)
- User-specific information (for logged-in users)
- User's violation count (for regular users)

This helps the chatbot provide more relevant and contextual responses.

## Using a Different AI Provider

To use a different AI provider (e.g., Anthropic, Google, etc.):

1. Set `AI_API_TYPE` to `'custom'` in `app/config/ai_config.php`
2. Update `AI_API_URL` to your provider's endpoint
3. Modify the `callCustomAI()` function in `api/chatbot.php` to match your provider's API format

## Troubleshooting

### Chatbot not responding?

1. **Check API Key**: Make sure `AI_API_KEY` is set in `app/config/ai_config.php`
2. **Check API Credits**: Ensure your OpenAI account has available credits
3. **Check Console**: Open browser developer tools (F12) and check for errors
4. **Check PHP Error Log**: Look for errors in your PHP error log

### API Key Error?

- Make sure the API key is valid and has not expired
- Check that you have sufficient credits in your OpenAI account
- Verify the API key format (should start with `sk-`)

### Database Context Not Working?

- Check that `USE_DATABASE_CONTEXT` is set to `true`
- Verify database connection in `app/config/db_connect.php`
- Check PHP error logs for database connection errors

## Files Created

- `api/chatbot.php` - Chatbot API endpoint
- `app/assets/js/chatbot.js` - Chatbot JavaScript module
- `app/assets/styles/chatbot.css` - Chatbot styles
- `app/config/ai_config.php` - AI API configuration

## Files Modified

- `app/views/partials/admin_sidebar.php` - Added chatbot menu item
- `app/views/partials/user_sidebar.php` - Added chatbot menu item
- `app/views/layouts/admin.php` - Added chatbot CSS and JS
- `app/views/layouts/user.php` - Added chatbot CSS and JS

## Security Notes

⚠️ **Important**: Never commit your API key to version control!

- Add `app/config/ai_config.php` to `.gitignore` if it contains your API key
- Consider using environment variables for API keys in production
- Keep your API keys secure and rotate them regularly

