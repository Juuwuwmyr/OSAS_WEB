# Commit Messages

## 1. Login and Signup Page Redesign

```
feat: Redesign login and signup pages with background images and overlays

- Add background.jpg image to both login and signup pages
- Implement adaptive overlay system for light and dark modes
- Light mode: White overlay with 0.80/0.75 opacity for better readability
- Dark mode: Dark overlay with 0.95/0.92 opacity for enhanced contrast
- Update overlay colors to use pure white (rgba(255, 255, 255)) in light mode
- Ensure background image remains visible while maintaining text readability
- Improve visual appeal with professional gradient overlays

Files modified:
- app/assets/styles/login.css
- app/assets/styles/register.css
```

## 2. Chatbot Complete Redesign and Memory Enhancement

```
feat: Complete chatbot redesign with modern classic design and enhanced memory

Design Changes:
- Redesign chatbot with modern but classic "elders vibe" aesthetic
- Replace neon colors with professional navy blue (#1B4F72) and muted tones
- Add yellow gradient banner header matching settings modal design
- Improve typography with better letter-spacing and font sizes
- Enhance readability with increased padding and line-height
- Update all icons to modern Boxicons variants
- Refine shadows, borders, and spacing for professional appearance
- Implement subtle hover effects and smooth transitions

Memory Enhancement:
- Add announcements data fetching and context integration
- Add reports data fetching and context integration
- Include announcements and reports in system statistics
- Format announcements with title, content preview, audience, and status
- Format reports with title, type, description preview, and status
- Update AI context to include announcements and reports capabilities
- Enable chatbot to answer questions about all system features

Files modified:
- app/assets/js/chatbot.js
- app/assets/styles/chatbot.css
```

