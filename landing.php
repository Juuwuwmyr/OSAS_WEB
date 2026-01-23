<?php
/**
 * OSAS Landing Page
 * Office of Student Affairs and Services - Main Landing Page
 */

// Include configuration
require_once __DIR__ . '/config/db_connect.php';

// Get system statistics for display
$stats = [
    'students' => 0,
    'departments' => 0,
    'sections' => 0,
    'violations' => 0
];

try {
    // Get student count
    $result = $conn->query("SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL");
    if ($result) {
        $stats['students'] = $result->fetch_assoc()['count'];
    }
    
    // Get department count
    $result = $conn->query("SELECT COUNT(*) as count FROM departments WHERE deleted_at IS NULL");
    if ($result) {
        $stats['departments'] = $result->fetch_assoc()['count'];
    }
    
    // Get section count
    $result = $conn->query("SELECT COUNT(*) as count FROM sections WHERE deleted_at IS NULL");
    if ($result) {
        $stats['sections'] = $result->fetch_assoc()['count'];
    }
    
    // Get violation count
    $result = $conn->query("SELECT COUNT(*) as count FROM violations WHERE deleted_at IS NULL");
    if ($result) {
        $stats['violations'] = $result->fetch_assoc()['count'];
    }
} catch (Exception $e) {
    // If database connection fails, use default values
    error_log("Landing page stats error: " . $e->getMessage());
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OSAS System - Office of Student Affairs and Services</title>
    <meta name="description" content="Comprehensive student management system for the Office of Student Affairs and Services">
    <meta name="keywords" content="OSAS, Student Affairs, Student Management, Violations Tracking">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#4a2d6d">
    <link rel="apple-touch-icon" href="app/assets/img/default.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <!-- Custom CSS -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-color: #4a2d6d;
            --secondary-color: #6b46c1;
            --accent-color: #9333ea;
            --text-dark: #1f2937;
            --text-light: #6b7280;
            --bg-light: #f9fafb;
            --bg-white: #ffffff;
            --border-color: #e5e7eb;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --error-color: #ef4444;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: var(--text-dark);
            overflow-x: hidden;
        }

        /* Navigation */
        .navbar {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            transition: all 0.3s ease;
        }

        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .nav-logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary-color);
            text-decoration: none;
        }

        .nav-logo img {
            width: 40px;
            height: 40px;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            align-items: center;
        }

        .nav-link {
            color: var(--text-dark);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
        }

        .nav-link:hover {
            color: var(--primary-color);
        }

        .nav-buttons {
            display: flex;
            gap: 1rem;
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(74, 45, 109, 0.3);
        }

        .btn-outline {
            background: transparent;
            color: var(--primary-color);
            border: 2px solid var(--primary-color);
        }

        .btn-outline:hover {
            background: var(--primary-color);
            color: white;
        }

        /* Hero Section */
        .hero {
            margin-top: 80px;
            padding: 4rem 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,133.3C960,128,1056,96,1152,90.7C1248,85,1344,107,1392,117.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
            background-size: cover;
        }

        .hero-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
            position: relative;
            z-index: 1;
        }

        .hero-content h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            line-height: 1.2;
        }

        .hero-content p {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }

        .hero-buttons {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .hero-image {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .hero-image img {
            max-width: 100%;
            height: auto;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        /* Features Section */
        .features {
            padding: 5rem 2rem;
            background: var(--bg-light);
        }

        .section-header {
            text-align: center;
            max-width: 800px;
            margin: 0 auto 3rem;
        }

        .section-header h2 {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: 1rem;
        }

        .section-header p {
            font-size: 1.125rem;
            color: var(--text-light);
        }

        .features-grid {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .feature-card {
            background: var(--bg-white);
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .feature-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
            color: white;
        }

        .feature-card h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-dark);
        }

        .feature-card p {
            color: var(--text-light);
            line-height: 1.6;
        }

        /* Stats Section */
        .stats {
            padding: 5rem 2rem;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
        }

        .stats-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            text-align: center;
        }

        .stat-item {
            padding: 2rem;
        }

        .stat-number {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .stat-label {
            font-size: 1.125rem;
            opacity: 0.9;
        }

        /* Modules Section */
        .modules {
            padding: 5rem 2rem;
            background: var(--bg-white);
        }

        .modules-grid {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
        }

        .module-card {
            background: var(--bg-white);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .module-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .module-header {
            padding: 2rem;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
        }

        .module-header h3 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .module-header p {
            opacity: 0.9;
        }

        .module-content {
            padding: 2rem;
        }

        .module-features {
            list-style: none;
            margin-bottom: 1.5rem;
        }

        .module-features li {
            padding: 0.5rem 0;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .module-features li::before {
            content: '✓';
            color: var(--success-color);
            font-weight: bold;
        }

        /* Footer */
        .footer {
            background: var(--text-dark);
            color: white;
            padding: 3rem 2rem 1rem;
        }

        .footer-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .footer-section h4 {
            margin-bottom: 1rem;
            color: white;
        }

        .footer-section ul {
            list-style: none;
        }

        .footer-section ul li {
            margin-bottom: 0.5rem;
        }

        .footer-section a {
            color: #9ca3af;
            text-decoration: none;
            transition: color 0.3s ease;
        }

        .footer-section a:hover {
            color: white;
        }

        .footer-bottom {
            text-align: center;
            padding-top: 2rem;
            border-top: 1px solid #374151;
            color: #9ca3af;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .nav-links {
                display: none;
            }

            .hero-container {
                grid-template-columns: 1fr;
                text-align: center;
            }

            .hero-content h1 {
                font-size: 2rem;
            }

            .hero-buttons {
                justify-content: center;
            }

            .features-grid,
            .modules-grid {
                grid-template-columns: 1fr;
            }

            .stats-container {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .fade-in-up {
            animation: fadeInUp 0.6s ease-out;
        }

        /* Loading Animation */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-container">
            <a href="#" class="nav-logo">
                <img src="app/assets/img/default.png" alt="OSAS Logo">
                <span>OSAS System</span>
            </a>
            
            <div class="nav-links">
                <a href="#features" class="nav-link">Features</a>
                <a href="#modules" class="nav-link">Modules</a>
                <a href="#about" class="nav-link">About</a>
                <a href="#contact" class="nav-link">Contact</a>
            </div>
            
            <div class="nav-buttons">
                <a href="login_page.php?direct=true" class="btn btn-outline">
                    <i class="fas fa-sign-in-alt"></i>
                    Login
                </a>
                <a href="includes/signup.php" class="btn btn-primary">
                    <i class="fas fa-user-plus"></i>
                    Sign Up
                </a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-container">
            <div class="hero-content fade-in-up">
                <h1>Office of Student Affairs and Services</h1>
                <p>Comprehensive student management system designed to streamline administrative processes and enhance student experience.</p>
                <div class="hero-buttons">
                    <a href="index.php?direct=true" class="btn btn-primary" style="background: white; color: var(--primary-color);">
                        <i class="fas fa-rocket"></i>
                        Get Started
                    </a>
                    <a href="#features" class="btn btn-outline" style="border-color: white; color: white;">
                        <i class="fas fa-play-circle"></i>
                        Learn More
                    </a>
                </div>
            </div>
            <div class="hero-image fade-in-up">
                <img src="app/assets/img/default.png" alt="OSAS Dashboard Preview" style="max-width: 500px;">
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
        <div class="stats-container">
            <div class="stat-item">
                <div class="stat-number"><?= number_format($stats['students']) ?></div>
                <div class="stat-label">Active Students</div>
            </div>
            <div class="stat-item">
                <div class="stat-number"><?= number_format($stats['departments']) ?></div>
                <div class="stat-label">Departments</div>
            </div>
            <div class="stat-item">
                <div class="stat-number"><?= number_format($stats['sections']) ?></div>
                <div class="stat-label">Sections</div>
            </div>
            <div class="stat-item">
                <div class="stat-number"><?= number_format($stats['violations']) ?></div>
                <div class="stat-label">Tracked Violations</div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
        <div class="section-header">
            <h2>Powerful Features</h2>
            <p>Everything you need to manage student affairs efficiently and effectively.</p>
        </div>
        
        <div class="features-grid">
            <div class="feature-card fade-in-up">
                <div class="feature-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h3>Student Management</h3>
                <p>Comprehensive student record management with profile tracking, attendance monitoring, and academic performance analysis.</p>
            </div>
            
            <div class="feature-card fade-in-up">
                <div class="feature-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3>Violation Tracking</h3>
                <p>Track and manage student violations with detailed records, automated notifications, and comprehensive reporting.</p>
            </div>
            
            <div class="feature-card fade-in-up">
                <div class="feature-icon">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <h3>Analytics & Reports</h3>
                <p>Generate detailed reports and analytics to gain insights into student behavior and institutional performance.</p>
            </div>
            
            <div class="feature-card fade-in-up">
                <div class="feature-icon">
                    <i class="fas fa-bullhorn"></i>
                </div>
                <h3>Announcements</h3>
                <p>Centralized announcement system for important notifications, events, and institutional communications.</p>
            </div>
            
            <div class="feature-card fade-in-up">
                <div class="feature-icon">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <h3>Mobile Responsive</h3>
                <p>Access the system from any device with our fully responsive design and mobile-optimized interface.</p>
            </div>
            
            <div class="feature-card fade-in-up">
                <div class="feature-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3>Secure & Reliable</h3>
                <p>Enterprise-grade security with role-based access control and data encryption to protect sensitive information.</p>
            </div>
        </div>
    </section>

    <!-- Modules Section -->
    <section class="modules" id="modules">
        <div class="section-header">
            <h2>System Modules</h2>
            <p>Comprehensive modules designed for different user roles and responsibilities.</p>
        </div>
        
        <div class="modules-grid">
            <div class="module-card fade-in-up">
                <div class="module-header">
                    <h3><i class="fas fa-user-shield"></i> Admin Dashboard</h3>
                    <p>Complete administrative control</p>
                </div>
                <div class="module-content">
                    <ul class="module-features">
                        <li>Student record management</li>
                        <li>Department and section management</li>
                        <li>Violation tracking and reporting</li>
                        <li>System configuration</li>
                        <li>Analytics and insights</li>
                    </ul>
                    <a href="login_page.php?direct=true" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i>
                        Admin Login
                    </a>
                </div>
            </div>
            
            <div class="module-card fade-in-up">
                <div class="module-header">
                    <h3><i class="fas fa-user"></i> Student Portal</h3>
                    <p>Personal student dashboard</p>
                </div>
                <div class="module-content">
                    <ul class="module-features">
                        <li>View personal violations</li>
                        <li>Check violation history</li>
                        <li>View announcements</li>
                        <li>Personal dashboard</li>
                        <li>Profile management</li>
                    </ul>
                    <a href="login_page.php?direct=true" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i>
                        Student Login
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" id="contact">
        <div class="footer-container">
            <div class="footer-section">
                <h4>About OSAS</h4>
                <p>The Office of Student Affairs and Services provides comprehensive support for student development and welfare through innovative management solutions.</p>
            </div>
            
            <div class="footer-section">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="login_page.php?direct=true">Login</a></li>
                    <li><a href="includes/signup.php">Sign Up</a></li>
                    <li><a href="#features">Features</a></li>
                    <li><a href="#modules">Modules</a></li>
                </ul>
            </div>
            
            <div class="footer-section">
                <h4>Support</h4>
                <ul>
                    <li><a href="#">Documentation</a></li>
                    <li><a href="#">Help Center</a></li>
                    <li><a href="#">Contact Support</a></li>
                    <li><a href="#">System Status</a></li>
                </ul>
            </div>
            
            <div class="footer-section">
                <h4>Contact Info</h4>
                <ul>
                    <li><i class="fas fa-envelope"></i> osas@colegiodenaujan.edu</li>
                    <li><i class="fas fa-phone"></i> +63 (123) 456-7890</li>
                    <li><i class="fas fa-map-marker-alt"></i> Colegio De Naujan</li>
                </ul>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; 2026 OSAS System. Developed for Colegio De Naujan. All rights reserved.</p>
        </div>
    </footer>

    <!-- JavaScript -->
    <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            }
        });

        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe all fade-in-up elements
        document.querySelectorAll('.fade-in-up').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });

        // Dynamic stats counter animation
        function animateCounter(element, target) {
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(current).toLocaleString();
            }, 20);
        }

        // Animate stats when they come into view
        const statNumbers = document.querySelectorAll('.stat-number');
        const statsObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.animated) {
                    const target = parseInt(entry.target.textContent.replace(/,/g, ''));
                    animateCounter(entry.target, target);
                    entry.target.animated = true;
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => statsObserver.observe(stat));
    </script>
</body>
</html>
