# 🌐 OSAS WEB SYSTEM

A modern, full-stack web-based system designed for the **Office of Student Affairs and Services (OSAS)** to manage departments, sections, students, violations, announcements, and reports — all in one centralized platform with AI-powered chatbot assistance.

---

## 📁 Project Structure

```text
OSAS_WEB/
├── api/                              # API endpoints
│   ├── announcements.php             # Announcements CRUD operations
│   ├── announcements_debug.php       # Announcements debug endpoint
│   ├── chatbot.php                   # AI chatbot API endpoint
│   ├── departments.php               # Department CRUD operations
│   ├── get_context.php               # Database context for chatbot
│   ├── sections.php                  # Section CRUD operations
│   ├── students.php                  # Student CRUD operations
│   ├── test_announcements.php        # Announcements testing
│   ├── test_chatbot.php              # Chatbot testing
│   ├── upload_student_image.php      # Student image upload handler
│   └── violations.php                # Violations CRUD operations
├── app/                              # Main application folder
│   ├── assets/                       # Static assets
│   │   ├── img/                      # Images and icons
│   │   │   ├── students/             # Uploaded student images
│   │   │   ├── default.png           # Default images
│   │   │   └── user.jpg              # User avatars
│   │   ├── js/                       # JavaScript files
│   │   │   ├── modules/              # Modular JavaScript components
│   │   │   │   └── dashboardModule.js
│   │   │   ├── utils/                # Utility functions
│   │   │   │   ├── notification.js   # Notification system
│   │   │   │   └── theme.js          # Theme management
│   │   │   ├── announcement.js       # Announcements management
│   │   │   ├── chatbot.js            # Chatbot UI and logic
│   │   │   ├── dashboard.js          # Admin dashboard
│   │   │   ├── dashboardData.js      # Dashboard data handling
│   │   │   ├── department.js         # Department management
│   │   │   ├── login.js              # Login functionality
│   │   │   ├── pwa.js                # PWA installation
│   │   │   ├── register.js           # Registration
│   │   │   ├── reports.js            # Reports and analytics
│   │   │   ├── section.js            # Section management
│   │   │   ├── session.js            # Session management
│   │   │   ├── student.js            # Student management
│   │   │   ├── userAnnouncements.js  # User announcements view
│   │   │   ├── userDashboardData.js  # User dashboard data
│   │   │   ├── user_dashboard.js     # User dashboard
│   │   │   ├── userProfile.js        # User profile management
│   │   │   ├── userViolations.js     # User violations view
│   │   │   └── violation.js          # Violations management
│   │   └── styles/                   # CSS stylesheets
│   │       ├── announcements.css
│   │       ├── chatbot.css
│   │       ├── dashboard.css
│   │       ├── Dashcontent.css
│   │       ├── department.css
│   │       ├── login.css
│   │       ├── register.css
│   │       ├── report.css
│   │       ├── section.css
│   │       ├── settings.css
│   │       ├── students.css
│   │       ├── user_dashboard.css
│   │       └── violation.css
│   ├── config/                       # Configuration files
│   │   ├── ai_config.php             # AI/Chatbot API configuration
│   │   └── db_connect.php            # Database connection
│   ├── controllers/                  # MVC Controllers
│   │   ├── AnnouncementController.php
│   │   ├── AuthController.php
│   │   ├── DepartmentController.php
│   │   ├── SectionController.php
│   │   ├── StudentController.php
│   │   └── ViolationController.php
│   ├── core/                         # MVC Core classes
│   │   ├── Controller.php            # Base Controller class
│   │   ├── Model.php                 # Base Model class
│   │   ├── Router.php                # Routing system
│   │   └── View.php                  # View renderer
│   ├── entry/                        # Application entry points
│   │   ├── dashboard.php             # Admin dashboard entry
│   │   └── user_dashboard.php        # User dashboard entry
│   ├── models/                       # MVC Models
│   │   ├── AnnouncementModel.php
│   │   ├── DepartmentModel.php
│   │   ├── SectionModel.php
│   │   ├── StudentModel.php
│   │   ├── UserModel.php
│   │   └── ViolationModel.php
│   └── views/                        # View templates
│       ├── admin/                    # Admin interface views
│       │   ├── Announcements.php     # Announcements management
│       │   ├── dashcontent.php       # Dashboard content
│       │   ├── department.php        # Department management
│       │   ├── reports.php           # Reports and analytics
│       │   ├── sections.php          # Section management
│       │   ├── students.php          # Student management
│       │   └── violations.php        # Violations management
│       ├── auth/                     # Authentication views
│       │   ├── check_session.php
│       │   ├── login.php
│       │   ├── logout.php
│       │   ├── register.php
│       │   ├── signup.php
│       │   └── test_register.php
│       ├── includes/                 # Reusable view components
│       │   ├── dashboard.php
│       │   ├── signup.php
│       │   └── user_dashboard.php
│       ├── layouts/                  # Layout templates
│       │   ├── admin.php
│       │   └── user.php
│       ├── partials/                 # Partial templates
│       │   ├── admin_sidebar.php
│       │   ├── navbar.php
│       │   └── user_sidebar.php
│       ├── user/                     # User interface views
│       │   ├── announcements.php     # User announcements view
│       │   ├── dashcontent.php       # User dashboard content
│       │   ├── my_profile.php        # User profile
│       │   └── my_violations.php     # User violations view
│       └── loader.php
├── config/                           # Legacy config (for compatibility)
│   └── db_connect.php
├── database/                         # Database setup scripts
│   └── announcements_table.sql       # Announcements table schema
├── includes/                         # Legacy includes (for compatibility)
│   ├── dashboard.php
│   ├── signup.php
│   └── user_dashboard.php
├── index.php                         # Main entry point (Login page)
├── manifest.json                     # PWA manifest
├── service-worker.js                 # PWA service worker
└── .htaccess                         # Apache configuration
```

---

## ✨ Features

### 🔐 Authentication & Authorization
* **User Authentication:** Secure login and registration system with session management
* **Cookie-Based Sessions:** Persistent login with remember me functionality
* **Role-Based Access Control:** Separate admin and user dashboards with appropriate permissions
* **Password Security:** Secure password handling and validation
* **Session Management:** PHP-based session handling with automatic session restoration

### 📊 Admin Dashboard
* **Dashboard Overview:** System statistics, charts, and quick navigation
* **Department Management:** Create, update, delete, and manage departments
* **Section Management:** Organize sections under departments with hierarchical structure
* **Student Records:** Complete student information management with:
  - Profile information and personal details
  - Image uploads with automatic resizing
  - Department and section assignment
  - Search and filter capabilities
* **Violation Tracking:** Record and track student violations including:
  - Violation types (dress code, ID, footwear, etc.)
  - Violation history and records
  - Violator statistics and reports
* **Announcements Management:** Create and manage system announcements with:
  - Multiple announcement types (info, urgent, warning)
  - Active/archived status management
  - Rich text messaging
  - Targeted announcements
* **Reports & Analytics:** Generate summaries and reports with:
  - Visual charts and graphs (Chart.js)
  - Violation statistics
  - Department and section analytics
  - Export capabilities
* **Settings:** System configuration and preferences

### 👤 User Dashboard
* **Personal Dashboard:** User-specific overview with personalized statistics
* **My Violations:** View personal violation history with detailed records
* **My Profile:** Manage personal information and profile settings
* **Announcements:** View system announcements filtered by type and status
* **Real-time Updates:** Live updates for violations and announcements

### 🤖 AI-Powered Chatbot
* **Intelligent Assistant:** AI-powered chatbot for system queries
* **Multiple AI Providers:** Support for various AI APIs:
  - OpenAI (GPT models)
  - Groq (Fast inference)
  - Hugging Face
  - Cohere
  - Google Gemini
  - Custom AI APIs
* **Database Context:** Chatbot has access to system database for accurate answers
* **Conversation History:** Maintains conversation context
* **User-Specific Responses:** Tailored responses based on user role and permissions

### 📱 Progressive Web App (PWA)
* **Installable:** Can be installed as a mobile/desktop app
* **Offline Support:** Service worker for offline functionality
* **Responsive Design:** Works seamlessly on all device sizes
* **App-like Experience:** Standalone display mode with custom icons

---

## ⚙️ Technologies Used

### Frontend
* **HTML5 & CSS3:** Modern web standards with responsive design
* **JavaScript (ES6+):** Vanilla JavaScript with modern features
* **Chart.js:** Interactive charts and graphs for analytics
* **Font Awesome:** Icon library for UI elements
* **Boxicons:** Additional icon library
* **Puter.js:** AI integration library

### Backend
* **PHP 7.4+:** Server-side scripting
* **MySQL/MariaDB:** Database management
* **MVC Architecture:** Model-View-Controller pattern for clean code organization

### Additional
* **Progressive Web App (PWA):** Service worker and manifest for app-like experience
* **RESTful API:** API endpoints for frontend-backend communication
* **AI Integration:** Multiple AI API providers for chatbot functionality

---

## 🚀 Getting Started

### Prerequisites

* **Web Server:** WAMP/XAMPP/LAMP or any PHP-enabled server
* **PHP:** Version 7.4 or higher (with CURL extension enabled)
* **MySQL:** Version 5.7 or higher (or MariaDB 10.2+)
* **Web Browser:** Modern browser with JavaScript enabled

### Installation Steps

1. **Clone or download the repository**

```bash
git clone https://github.com/yourusername/osas-web-system.git
cd OSAS_WEB
```

2. **Set up the database**

   * Create a new MySQL database named `osas` (or update `app/config/db_connect.php` with your preferred name)
   
   * Import the database schema:
   
   **Using phpMyAdmin:**
   1. Open phpMyAdmin
   2. Select your database (`osas`)
   3. Click "Import" tab
   4. Choose the SQL file from `database/` directory
   5. Click "Go"
   
   **Using MySQL Command Line:**
   ```bash
   mysql -u root -p osas < database/announcements_table.sql
   ```
   
   **Note:** You may need to create additional tables for departments, sections, students, users, and violations. Check your database setup files or create them manually.

3. **Configure database connection**

   Edit `app/config/db_connect.php` and update with your database credentials:
   ```php
   $host = "localhost";
   $user = "root";          // Your MySQL username
   $pass = "";              // Your MySQL password
   $dbname = "osas";        // Your database name
   ```

4. **Configure AI/Chatbot (Optional)**

   For chatbot functionality, edit `app/config/ai_config.php`:
   ```php
   define('AI_API_TYPE', 'groq'); // or 'openai', 'huggingface', 'cohere', 'gemini'
   define('AI_API_KEY', 'your-api-key-here');
   define('AI_API_URL', 'https://api.groq.com/openai/v1/chat/completions'); // Adjust based on provider
   define('AI_MODEL', 'llama-3.1-70b-versatile'); // Adjust based on provider
   define('USE_DATABASE_CONTEXT', true); // Enable database context in chatbot
   ```
   
   **Free AI API Options:**
   - **Groq** (Recommended): https://console.groq.com/ (Fast & free)
   - **Hugging Face**: https://huggingface.co/ (Free tier available)
   - **Cohere**: https://cohere.com/ (Free tier: 100 calls/minute)
   - **Google Gemini**: https://makersuite.google.com/app/apikey (Free tier available)

5. **Set up file permissions**

   Ensure the `app/assets/img/students/` directory is writable for image uploads:
   
   **Windows (WAMP):**
   - Right-click the folder → Properties → Security → Edit permissions
   
   **Linux/Mac:**
   ```bash
   chmod 755 app/assets/img/students/
   ```

6. **Start your web server**

   * **WAMP:** Start WAMP server and navigate to `http://localhost/OSAS_WEB/`
   * **XAMPP:** Start Apache and MySQL, navigate to `http://localhost/OSAS_WEB/`
   * **LAMP:** Configure your virtual host or use `http://localhost/OSAS_WEB/`

7. **Access the application**

   Open your browser and navigate to:
   ```
   http://localhost/OSAS_WEB/
   ```
   
   You should see the login page. Register a new account or use existing credentials to log in.

---

## 📝 Database Structure

### Main Tables

* **announcements:** Stores system announcements (title, message, type, status, timestamps)
* **departments:** Stores department information
* **sections:** Stores section information (linked to departments)
* **students:** Stores student records (linked to sections)
* **users:** User accounts for authentication
* **violations:** Violation records (linked to students)

### Announcements Table

The announcements table supports:
- Multiple types: `info`, `urgent`, `warning`
- Status management: `active`, `archived`
- Soft deletes with `deleted_at` field
- Creator tracking with `created_by` field

---

## 🔧 Configuration

### Database Configuration
Edit `app/config/db_connect.php` to match your database settings. The file supports both local and remote database configurations.

### AI/Chatbot Configuration
Edit `app/config/ai_config.php` to configure your preferred AI provider. Multiple providers are supported with easy switching.

### PWA Configuration
Edit `manifest.json` to customize the Progressive Web App settings, including:
- App name and short name
- Theme colors
- Icons
- Display mode

---

## 🎯 API Endpoints

The system provides RESTful API endpoints for various operations:

* **Announcements:** `/api/announcements.php`
* **Chatbot:** `/api/chatbot.php`
* **Departments:** `/api/departments.php`
* **Sections:** `/api/sections.php`
* **Students:** `/api/students.php`
* **Violations:** `/api/violations.php`
* **Student Image Upload:** `/api/upload_student_image.php`
* **Database Context:** `/api/get_context.php` (for chatbot)

---

## 📌 Features Status

### ✅ Implemented Features

* Full authentication system with session management
* Admin and user dashboards with role-based access
* Department management (CRUD operations)
* Section management (CRUD operations)
* Student management with image uploads
* Violation tracking and management
* Announcements system (create, update, archive, display)
* AI-powered chatbot with multiple provider support
* Reports and analytics with charts
* PWA support with service worker
* Responsive design for all devices
* Theme management (light/dark mode)
* Notification system
* Search and filter functionality

### 🔄 Future Enhancements

* Advanced analytics and detailed reports
* Print-friendly and exportable reports (PDF, Excel)
* Email notifications for violations and announcements
* Advanced search and filtering with multiple criteria
* Bulk operations for data management
* Data export/import functionality
* Real-time notifications (WebSocket)
* Mobile app (React Native/Flutter)
* Advanced user permissions and roles
* Audit logging system

---

## 🛡️ Security Considerations

* Password security with proper hashing
* Session management with secure cookies
* SQL injection prevention with prepared statements
* XSS protection with input sanitization
* CSRF protection (recommended to add)
* File upload validation for student images
* Role-based access control

---

## 🐛 Troubleshooting

### Database Connection Issues
* Check database credentials in `app/config/db_connect.php`
* Ensure MySQL/MariaDB service is running
* Verify database name exists

### Chatbot Not Working
* Check if CURL extension is enabled in PHP
* Verify AI API key is set in `app/config/ai_config.php`
* Check API provider status and rate limits
* Review error logs for detailed error messages

### Image Upload Issues
* Verify write permissions on `app/assets/img/students/` directory
* Check PHP `upload_max_filesize` and `post_max_size` settings
* Ensure correct file types are being uploaded

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository or contact the development team.

---

## 🛡️ License

This project is created for **Colegio De Naujan**.
Customization is required to adapt it for other schools or organizations.

---

## 👨‍💻 Maintained By

Developed by: **Mr-Patrick-James / OSAS Teams**

**Contributors:**
* Romasanta Patrick James Vital & Moreno Jumyr Manalo (s) Cdenians

**System Administrator/Head:**
* Cedrick H. Almarez

---

## 🙏 Acknowledgments

* Colegio De Naujan - OSAS Department
* All contributors and testers
* AI API providers (Groq, OpenAI, Hugging Face, Cohere, Google)

---

**Version:** 2.0.0  
**Last Updated:** 2025
