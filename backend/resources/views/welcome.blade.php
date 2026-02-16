<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GestionStock - Votre solution de gestion intelligente</title>
    <link rel="icon" href="{{ asset('storage/app_image.png') }}">
    <meta name="description" content="GestionStock est une application mobile puissante pour gérer vos stocks, ventes et clients en toute simplicité.">
    <!-- Google Fonts: Space Grotesk for Headings, Inter for Body -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <!-- CSS -->
    <style>
        :root {
            --primary: #2563eb; /* Blue */
            --primary-light: #60a5fa;
            --primary-dark: #1e40af;
            --secondary: #ef4444; /* Red */
            --bg-light: #f8fafc;
            --bg-white: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --glass-white: rgba(255, 255, 255, 0.95);
            --border-color: #000000;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-light);
            color: var(--text-main);
            line-height: 1.6;
            overflow-x: hidden;
            cursor: none; /* Hide default cursor */
        }

        /* --- Custom Cursor Effect --- */
        #custom-cursor {
            width: 20px;
            height: 20px;
            background: rgba(37, 99, 235, 0.8);
            border: 2px solid #000;
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: width 0.2s, height 0.2s, background 0.2s, border-radius 0.2s;
            box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #custom-cursor::before, #custom-cursor::after {
            content: '';
            position: absolute;
            background: #000;
            display: none;
        }

        /* Sniper lines */
        #custom-cursor.cursor-hover::before {
            display: block;
            width: 2px;
            height: 100%;
            left: 50%;
            transform: translateX(-50%);
        }
        #custom-cursor.cursor-hover::after {
            display: block;
            width: 100%;
            height: 2px;
            top: 50%;
            transform: translateY(-50%);
        }

        #custom-cursor-glow {
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, rgba(0,0,0,0) 70%);
            position: fixed;
            pointer-events: none;
            z-index: 9998;
            transform: translate(-50%, -50%);
            border-radius: 50%;
        }

        a, button, .btn-cta, .btn-header {
            cursor: none !important;
        }

        /* Input specific: show default text cursor */
        input, textarea {
            cursor: text;
        }

        .cursor-hidden {
            opacity: 0 !important;
            visibility: hidden !important;
        }

        /* --- SNIPER SCOPE CURSOR --- */
        #custom-cursor.cursor-hover {
            width: 80px !important;
            height: 80px !important;
            background: 
                /* Crosshair & Ticks */
                linear-gradient(90deg, transparent 49%, #000 49%, #000 51%, transparent 51%), 
                linear-gradient(#000 1px, transparent 1px) center/10px 100% no-repeat,
                linear-gradient(transparent 49%, #000 49%, #000 51%, transparent 51%),
                linear-gradient(90deg, #000 1px, transparent 1px) center/100% 10px no-repeat
                !important;
            background-size: 100% 2px, 60% 2px, 2px 100%, 2px 60% !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            
            border: 2px solid #000 !important;
            border-radius: 50% !important;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5), inset 0 0 20px rgba(0,0,0,0.1);
        }

        /* Dynamic Sniper Text (replaces pseudo-elements) */
        .cursor-text {
            display: none !important; /* Hidden by default */
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            font-weight: 900;
            color: #000;
            pointer-events: none;
        }

        .text-top { top: 4px; }
        .text-bottom { bottom: 4px; }

        /* Show text only on hover state */
        #custom-cursor.cursor-hover .cursor-text {
            display: block !important;
        }
        
        /* Red Center Dot */
        .cursor-dot {
            display: none;
            width: 4px;
            height: 4px;
            background: red;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
        }
        
        #custom-cursor.cursor-hover .cursor-dot {
            display: block;
        }

        /* Override to force show system cursor when input is focused */
        body.cursor-auto-override,
        body.cursor-auto-override a,
        body.cursor-auto-override button,
        body.cursor-auto-override .btn-cta,
        body.cursor-auto-override .btn-header {
            cursor: auto !important;
        }

        h1, h2, h3, .font-heading {
            font-family: 'Space Grotesk', sans-serif;
            letter-spacing: -0.02em;
        }

        img.neo-border {
            border: 3px solid #000 !important;
            box-shadow: 10px 10px 0 #000;
            border-radius: 24px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        img.neo-border:hover {
            transform: translate(-5px, -5px);
            box-shadow: 15px 15px 0 #000;
        }

        /* Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(1deg); }
            100% { transform: translateY(0px) rotate(0deg); }
        }

        .animate-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 6s ease-in-out infinite; }

        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }

        /* --- Decorative Shapes --- */
        .deco-wrapper {
            position: absolute;
            pointer-events: none;
            z-index: 10;
        }

        .deco-shape {
            filter: drop-shadow(6px 6px 0 #000);
            animation: float 4s ease-in-out infinite;
        }

        .deco-star {
            position: absolute;
            color: #ffde03;
            width: 50px;
            height: 50px;
        }

        .top-right-deco { top: -20px; right: -20px; }
        .bottom-left-deco { bottom: -20px; left: -20px; }
        .top-left-deco { top: -20px; left: -20px; }
        .bottom-right-deco { bottom: -20px; right: -20px; }

        .delay-1 { animation-delay: 1s; }
        .delay-2 { animation-delay: 2s; }

        /* --- Header: Massive & Large Elements --- */
        header {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 1000;
            padding: 2.5rem 5rem;
            background: var(--glass-white);
            backdrop-filter: blur(20px);
            border-bottom: 4px solid #000;
            transition: all 0.4s ease;
            height: 120px;
            display: flex;
            align-items: center;
        }

        header.scrolled {
            padding: 1.5rem 5rem;
            height: 100px;
        }

        nav {
            max-width: 1600px;
            width: 100%;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo-img {
            height: 80px;
            object-fit: contain;
            border: none !important;
            box-shadow: none !important;
        }

        .nav-links {
            display: flex;
            gap: 4rem;
            list-style: none;
        }

        .nav-links a {
            text-decoration: none;
            color: var(--text-main);
            font-weight: 900;
            font-size: 1.4rem;
            transition: all 0.3s ease;
            font-family: 'Space Grotesk', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .nav-links a:hover {
            color: var(--primary);
            transform: scale(1.1);
        }

        .btn-header {
            padding: 15px 35px;
            background: #000;
            color: #fff;
            font-weight: 900;
            font-size: 1.2rem;
            font-family: 'Space Grotesk', sans-serif;
            text-transform: uppercase;
            text-decoration: none;
            box-shadow: 6px 6px 0 var(--primary);
            border: 3px solid #000;
            transition: 0.2s;
        }

        .btn-header:hover {
            transform: translate(-3px, -3px);
            box-shadow: 10px 10px 0 var(--primary);
        }

        /* --- Hero Section: Smaller Image, Higher Text --- */
        .hero {
            position: relative;
            padding: 250px 5rem 100px;
            max-width: 1600px;
            margin: 0 auto;
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
            min-height: 90vh;
        }

        .hero-content {
            flex: 1.2;
            z-index: 2;
            padding-top: 20px;
        }

        .hero h1 {
            font-size: 8rem;
            line-height: 0.85;
            margin-bottom: 2.5rem;
            font-weight: 900;
            color: #000;
            letter-spacing: -0.05em;
        }

        .hero::before {
            content: "STOCK";
            position: absolute;
            top: 100px;
            left: -50px;
            font-size: 20rem;
            font-weight: 950;
            color: rgba(0,0,0,0.03);
            z-index: 1;
            font-family: 'Space Grotesk';
            pointer-events: none;
        }

        .hero h1 span {
            color: var(--primary);
            position: relative;
        }

        .hero p {
            font-size: 1.6rem;
            color: var(--text-muted);
            margin-bottom: 4rem;
            max-width: 650px;
            font-weight: 500;
        }

        .hero-image {
            flex: 0.8;
            text-align: right;
            margin-top: -60px;
            margin-left: -50px;
        }

        .main-mockup {
            width: 70%; /* Smaller as requested */
            margin-left: auto;
            border-radius: 24px;
        }

        /* --- Feature Showcase: No Overlap --- */
        .features {
            background: #fff;
            padding: 120px 5rem;
            border-top: 4px solid #000;
        }

        .container-wide {
            max-width: 1500px;
            margin: 0 auto;
        }

        .section-header h2 {
            font-size: 4.5rem;
            font-weight: 900;
            margin-bottom: 80px;
            line-height: 0.9;
            text-transform: uppercase;
        }

        .card-neo {
            background: #fff;
            border: 4px solid #000;
            padding: 5rem;
            box-shadow: 20px 20px 0 #000;
            display: flex;
            gap: 6rem;
            align-items: center;
            margin-bottom: 6rem;
            position: relative;
            overflow: visible; /* Prevent clipping of shadows */
        }

        .card-content {
            flex: 1;
            z-index: 10;
        }

        .card-content h3 {
            font-size: 3.5rem;
            margin-bottom: 2rem;
            font-weight: 900;
            text-transform: uppercase;
            line-height: 1;
        }

        .card-content p {
            font-size: 1.4rem;
            color: #333;
            margin-bottom: 2.5rem;
            font-weight: 500;
        }

        .img-container {
            flex: 1.5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            position: relative;
        }

        .img-neo-full {
            width: 100%;
            height: auto;
        }

        /* Organisation Section: Interactive Stack WITHOUT covering text */
        .org-stack {
            position: relative;
            width: 100%;
            height: 550px;
        }

        .stack-img {
            position: absolute;
            width: 75%;
            transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .img-boutique {
            z-index: 5;
            left: 0;
            bottom: 0;
        }

        .img-client {
            z-index: 6;
            right: 0;
            top: -40px; /* Pushed up as requested */
        }

        .card-neo:hover .img-boutique {
            transform: translate(-60px, 60px) rotate(-5deg);
            z-index: 10;
        }

        .card-neo:hover .img-client {
            transform: translate(60px, -60px) rotate(5deg);
        }

        /* Layout for Split Components */
        .grid-split {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            margin-bottom: 6rem;
        }

        .card-split {
            background: #fff;
            border: 4px solid #000;
            padding: 4rem;
            box-shadow: 15px 15px 0 #000;
        }

        /* --- CTA: Professional Online Image --- */
        .cta-section {
            padding: 120px 6rem;
            background: #000;
            color: #fff;
            margin: 100px 5rem;
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: 6rem;
            border: 6px solid var(--primary);
            box-shadow: 25px 25px 0 var(--primary);
        }

        .cta-text {
            flex: 1;
        }

        .cta-text h2 {
            font-size: 5rem;
            color: #fff;
            margin-bottom: 3rem;
            line-height: 0.9;
            text-transform: uppercase;
        }

        .btn-cta {
            padding: 30px 70px;
            background: var(--primary);
            color: #fff;
            font-size: 2rem;
            font-weight: 900;
            text-transform: uppercase;
            border: 4px solid #000;
            box-shadow: 10px 10px 0 #000;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s ease;
            font-family: 'Space Grotesk', sans-serif;
            white-space: nowrap; /* Prevent line break */
        }

        .btn-cta:hover {
            transform: translate(-5px, -5px);
            box-shadow: 15px 15px 0 #000;
        }

        .cta-visual {
            flex: 1.2;
        }

        .cta-visual img {
            width: 100%;
            border-radius: 24px;
            border: 4px solid #000 !important;
            box-shadow: 15px 15px 0 var(--primary);
        }

        /* Footer */
        footer {
            padding: 100px 5rem;
            background: #fff;
            border-top: 5px solid #000;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .footer-brand img { height: 100px; margin-bottom: 2rem; border: none !important; box-shadow: none !important; }
        
        .powered-box {
            text-align: right;
        }

        .powered-box span {
            font-family: 'Space Grotesk';
            font-weight: 900;
            text-transform: uppercase;
            font-size: 1.4rem;
            display: block;
            margin-bottom: 1.5rem;
        }

        .powered-img {
            height: 70px;
            border: none !important;
            box-shadow: none !important;
        }

        /* --- Mobile Menu & Toggle --- */
        .mobile-toggle {
            display: none;
            flex-direction: column;
            gap: 8px;
            cursor: pointer;
            z-index: 2000;
            padding: 10px;
            background: transparent;
            border: none;
        }

        .bar {
            width: 40px;
            height: 4px;
            background-color: #000;
            transition: 0.3s;
            border-radius: 2px;
        }

        .mobile-menu {
            position: fixed;
            top: 0;
            right: -100%;
            width: 100%;
            height: 100vh;
            height: 100dvh;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            z-index: 1500;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            transition: right 0.4s cubic-bezier(0.19, 1, 0.22, 1);
            padding: 20px;
        }

        .mobile-menu.active {
            right: 0;
        }

        .mobile-link {
            font-family: 'Space Grotesk';
            font-size: 2.5rem;
            text-transform: uppercase;
            font-weight: 950;
            text-decoration: none;
            color: #000;
            transition: 0.2s;
            text-align: center;
            padding: 10px 20px;
            width: 100%;
            max-width: 300px;
        }

        .mobile-link:hover {
            color: var(--primary);
            transform: scale(1.05);
        }

        /* Toggle Animation */
        .mobile-toggle.active .bar:nth-child(1) { transform: rotate(45deg) translate(8px, 8px); }
        .mobile-toggle.active .bar:nth-child(2) { opacity: 0; }
        .mobile-toggle.active .bar:nth-child(3) { transform: rotate(-45deg) translate(8px, -8px); }

        /* Close menu button */
        .close-menu {
            position: absolute;
            top: 30px;
            right: 30px;
            font-size: 3rem;
            background: none;
            border: none;
            color: #000;
            cursor: pointer;
            z-index: 2001;
            display: none;
        }

        /* --- RESPONSIVE DESIGN IMPROVED --- */
        @media (max-width: 1400px) {
            .hero h1 { font-size: 6rem; }
            .hero-image { flex: 1; }
            .hero { padding: 200px 4rem 80px; }
        }

        @media (max-width: 1200px) {
            header { padding: 2rem 3rem; }
            .hero h1 { font-size: 5rem; }
            .hero p { font-size: 1.4rem; }
            .card-neo { padding: 4rem; gap: 4rem; }
            .cta-section { margin: 80px 3rem; padding: 80px 4rem; }
        }

        @media (max-width: 1024px) {
            /* Header adjustments */
            header { 
                height: 80px; 
                padding: 0 2rem !important; 
            }
            header.scrolled { padding: 0 2rem !important; height: 80px; }
            .nav-links, .btn-header.desktop-only { display: none; }
            .mobile-toggle { display: flex; }
            
            /* Hero section */
            .hero { 
                padding: 140px 2rem 60px !important; 
                min-height: auto; 
                flex-direction: column;
                text-align: center;
            }
            .hero h1 { font-size: 3.5rem; }
            .hero p { font-size: 1.2rem; margin-bottom: 2rem; max-width: 100%; }
            .hero-content { padding-top: 0; }
            .hero-image { 
                margin: 30px auto 0 !important; 
                text-align: center;
                width: 100%;
            }
            .hero-image img { 
                width: 80% !important; 
                max-width: 400px;
                margin: 0 auto;
            }
            .hero::before { font-size: 12rem; left: 0; top: 80px; }
            
            /* Features section */
            .features { padding: 60px 2rem; }
            .section-header h2 { font-size: 2.8rem; margin-bottom: 50px; }
            
            /* Cards */
            .card-neo { 
                flex-direction: column !important; 
                padding: 2.5rem !important; 
                gap: 2.5rem !important; 
                box-shadow: 10px 10px 0 #000 !important; 
                margin-bottom: 3rem;
            }
            /* Reorder text to top for all cards on mobile */
            .card-neo > .card-content { order: -1; }
            .card-neo > .img-container { order: 1; }
            
            .card-content h3 { font-size: 2.2rem !important; }
            .card-content p { font-size: 1.1rem; margin-bottom: 1.5rem; }
            
            /* Images in cards */
            .img-container { 
                min-height: auto !important; 
                width: 100%; 
                margin-top: 1rem;
            }
            
            /* Grid split */
            .grid-split { 
                grid-template-columns: 1fr !important; 
                gap: 2rem; 
                margin-bottom: 3rem;
            }
            
            .card-split { 
                padding: 2rem !important; 
                box-shadow: 8px 8px 0 #000 !important; 
            }
            
            /* CTA section */
            .cta-section { 
                flex-direction: column;
                padding: 3rem 2rem !important; 
                margin: 40px 1.5rem !important; 
                border-radius: 30px;
                gap: 2.5rem;
            }
            
            .cta-text h2 { font-size: 2.5rem; margin-bottom: 1.5rem; }
            .btn-cta { 
                padding: 20px 40px !important; 
                font-size: 1.2rem !important; 
                box-shadow: 6px 6px 0 #000 !important; 
            }
            
            /* Download section */
            #download > div { flex-direction: column; text-align: center; }
            #download h2 { font-size: 2.5rem; }
            #download img { width: 200px !important; margin-top: 20px; }
            
            /* Contact form */
            #contact .card-neo { padding: 2rem !important; }
            #contact form { gap: 1rem; }
            #contact form > div { grid-template-columns: 1fr !important; }
            
            /* Footer */
            footer { 
                flex-direction: column !important; 
                text-align: center !important; 
                padding: 40px 2rem !important;
                gap: 2rem;
            }
            
            footer h2 { font-size: 3rem !important; }
        }

        @media (max-width: 768px) {
            /* Fix overflow issues */
            html, body { 
                overflow-x: hidden; 
                width: 100%; 
                position: relative; 
            }
            
            /* Hide custom cursor on mobile */
            #custom-cursor, #custom-cursor-glow { display: none !important; }
            body { cursor: auto !important; }
            a, button, input, textarea { cursor: pointer !important; }
            
            /* Header adjustments */
            header { 
                height: 70px; 
                padding: 0 1.5rem !important; 
            }
            .logo-img { height: 50px; }
            
            /* Hero section */
            .hero { 
                padding: 120px 1.5rem 40px !important; 
            }
            .hero h1 { font-size: 2.8rem; line-height: 1; }
            .hero::before { font-size: 8rem; top: 60px; }
            
            /* Mobile menu improvements */
            .mobile-menu {
                padding: 60px 20px 20px;
                justify-content: flex-start;
                padding-top: 100px;
            }
            
            .mobile-link {
                font-size: 1.8rem !important;
                padding: 15px;
            }
            
            .close-menu {
                display: block;
            }
            
            /* Features */
            .features { padding: 40px 1.5rem; }
            .section-header h2 { font-size: 2.2rem; margin-bottom: 30px; }
            
            /* Cards */
            .card-neo { 
                padding: 1.5rem !important; 
                box-shadow: 6px 6px 0 #000 !important; 
                border-width: 3px;
            }
            
            .card-content h3 { font-size: 1.8rem !important; }
            
            /* Organization stack - STATIC FLOW SUPERPOSITION */
            .org-stack { 
                height: auto !important; /* Let content dictate height */
                display: flex !important;
                flex-direction: column;
                align-items: center;
                margin-top: 2rem;
                margin-bottom: 4rem !important; /* Safety margin */
                overflow: visible !important;
                cursor: pointer;
                touch-action: manipulation;
                padding-bottom: 20px;
            }
            
            .stack-img { 
                position: relative !important; /* Taking real space */
                width: 90% !important; 
                max-width: 340px;
                top: auto !important;
                left: auto !important;
                margin: 0 !important;
                transition: transform 0.4s ease !important;
                box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
            }
            
            /* Boutique: First image in flow (Bottom layer) */
            .img-boutique {
                z-index: 10;
                transform: rotate(-3deg);
                margin-top: 0 !important; /* Reset margin so it doesn't overlap text */
            }
            
            /* Client: Second image in flow (Top layer, pulled up) */
            .img-client {
                z-index: 20;
                margin-top: -120px !important; /* Pull UP onto the boutique image */
                margin-left: 30px !important; /* Offset right */
                transform: rotate(3deg);
                top: auto !important; /* Reset desktop top */
            }
            
            /* Swapped State */
            .org-stack.swapped .img-boutique { z-index: 20 !important; opacity: 1; transform: rotate(-3deg) scale(1.05); }
            .org-stack.swapped .img-client { z-index: 10 !important; opacity: 0.6; transform: rotate(3deg); }
            
            /* Disable hover interactions completely on mobile */
            .card-neo:hover .img-boutique, 
            .card-neo:hover .img-client { 
                transform: none; 
                z-index: auto; 
            }
            
            /* Grid images */
            .img-container.grid-cols-2 { 
                grid-template-columns: 1fr !important; 
                gap: 1rem;
            }
            
            /* CTA */
            .cta-section { 
                margin: 30px 1rem !important; 
                padding: 2.5rem 1.5rem !important; 
                border-radius: 20px;
            }
            
            .cta-text h2 { font-size: 2rem; }
            .btn-cta { 
                padding: 15px 30px !important; 
                font-size: 1.1rem !important; 
                width: 100%; 
                text-align: center;
            }
            
            /* Download section */
            #download { padding: 30px 1rem; }
            #download h2 { font-size: 2rem; }
            .store-badges { 
                justify-content: center !important; 
                flex-direction: row !important; 
                flex-wrap: nowrap !important;
                gap:0px !important;
            }
            .store-badges img { height: 40px !important; }
            
            /* Footer */
            footer { 
                margin: 20px 15px 30px !important; 
                padding: 30px 1.5rem !important; 
                border-radius: 20px;
            }
            
            footer h2 { font-size: 2.2rem !important; }
            
            .footer-powered {
                text-align: center !important;
                width: 100%;
                margin-top: 1rem;
                align-items: center !important; /* Force center alignment preventing right shift */
            }
            .footer-powered > div { 
                text-align: center !important; 
                width: 100%;
            }
            .footer-powered img {
                margin: 0 auto;
                display: block;
                height: 50px !important; /* Reduced size for mobile */
                width: auto;
            }
            
            footer br { display: none; }
        }

        @media (max-width: 480px) {
            .hero h1 { font-size: 2.2rem; }
            .hero p { font-size: 1rem; }
            .section-header h2 { font-size: 1.8rem; }
            
            header { height: 60px; padding: 0 1rem !important; }
            .logo-img { height: 40px; }
            .mobile-toggle .bar { width: 30px; height: 3px; }
            
            .btn-cta { 
                font-size: 1rem !important; 
                padding: 12px 25px !important; 
            }
            
            .card-neo { padding: 1.25rem !important; }
            .card-content h3 { font-size: 1.5rem !important; }
            
            footer h2 { font-size: 1.8rem !important; }
            
            .mobile-link {
                font-size: 1.5rem !important;
            }
        }

        /* Special fixes for very small screens */
        @media (max-width: 360px) {
            .hero h1 { font-size: 1.8rem; }
            .section-header h2 { font-size: 1.5rem; }
            .btn-cta { font-size: 0.9rem !important; padding: 10px 20px !important; }
        }

        /* Prevent text overflow */
        .text-overflow-fix {
            word-break: break-word;
            overflow-wrap: break-word;
        }

        /* Responsive Spacing Overrides */
        @media (max-width: 1024px) {
            .mobile-compact-card {
                padding-bottom: 2rem !important;
                margin-bottom: 3rem !important;
            }
        }
    </style>
</head>
<body>
    <div id="custom-cursor">
        <span class="cursor-text text-top">00</span>
        <div class="cursor-dot"></div>
        <span class="cursor-text text-bottom">00</span>
    </div>
    <div id="custom-cursor-glow"></div>

    <header id="header">
        <nav>
            <a href="{{ url('/') }}" class="logo-container">
                <img src="{{ asset('storage/app_image.png') }}" alt="Logo" class="logo-img">
            </a>
            <ul class="nav-links">
                <li><a href="#gestion-stock">Produit</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <a href="#download" class="btn-header desktop-only">Commencer</a>

            <!-- Hamburger Button -->
            <button class="mobile-toggle" id="mobileToggle" aria-label="Ouvrir le menu">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
            </button>
        </nav>
    </header>

    <!-- Mobile Menu Overlay -->
    <div class="mobile-menu" id="mobileMenu">
        <button class="close-menu" id="closeMenu" aria-label="Fermer le menu">×</button>
        <a href="#gestion-stock" class="mobile-link">Produit</a>
        <a href="#services" class="mobile-link">Services</a>
        <a href="#contact" class="mobile-link">Contact</a>
        <a href="#download" class="btn-header" style="font-size: 1.2rem; padding: 15px 30px; margin-top: 1rem;">Commencer</a>
    </div>

    <main>
        <!-- HERO Section: dashboard1 (Small Image, Higher Text) -->
        <section class="hero">
            <div class="hero-content animate-up">
                <h1 class="text-overflow-fix">Maîtrisez votre <span>Stock</span> en temps réel</h1>
                <div class="hero-btns" style="margin-top: 2rem;">
                    <a href="#services" class="btn-cta" style="padding: 20px 50px; font-size: 1.5rem;">Découvrir l'App</a>
                </div>
            </div>
            
            <div class="hero-image">
                <img src="{{ asset('storage/images/dashboard1.jpeg') }}" alt="Dashboard View" class="main-mockup animate-float neo-border" loading="lazy">
            </div>
        </section>

        <!-- Feature Showcase -->
        <section id="services" class="features">
            <div class="container-wide">
                <div class="section-header">
                    <h2 class="text-overflow-fix">Une Application <span>Totale</span> pour les Entrepreneurs</h2>
                </div>

                <!-- 1. Analytique Section (3 images preserved) -->
                <div class="card-neo">
                  <!-- Deco Shapes -->
                    
                    <div class="card-content">
                        <h3 class="text-overflow-fix">Analytiques de Précision</h3>
                        <p>Visualisez chaque transaction, vente journalière et top de vos clients en un clin d'œil. Ne laissez rien au hasard.</p>
                        
                        <!-- New: Mini Live Indicator (Updated) -->
                        <div style="margin-top: 2rem; background: var(--secondary); color: #fff; padding: 1.5rem; border: 3px solid #000; box-shadow: 8px 8px 0 #000; transform: rotate(-1deg);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="font-family: 'Space Grotesk'; font-weight: 900; font-size: 0.8rem; text-transform: uppercase;">SYSTÈME D'ALERTE</span>
                                <div style="width: 10px; height: 10px; background: #fff; border-radius: 50%; box-shadow: 0 0 10px #fff; animation: pulse 1.5s infinite;"></div>
                            </div>
                            <div style="font-family: 'Space Grotesk'; font-weight: 900; font-size: 1.5rem;">Stock Faible: Sucre</div>
                            <div style="font-size: 0.7rem; color: #eee;">Vérifiez la boutique A maintenant</div>
                        </div>
                    </div>
                    <div class="img-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; flex: 2;">
                        <img src="{{ asset('storage/images/dashbord2_stats_ca.png') }}" alt="Stats CA" class="neo-border img-neo-full" loading="lazy">
                        <div style="display: grid; gap: 2rem;">
                            <img src="{{ asset('storage/images/dashboard3_vente_journaliere_stat.png') }}" alt="Ventes" class="neo-border img-neo-full" loading="lazy">
                            <img src="{{ asset('storage/images/dashboard4_top_client_commande.png') }}" alt="Top Commandes" class="neo-border img-neo-full" loading="lazy">
                        </div>
                    </div>
                </div>

                <!-- NEW: Dedicated Charts Section (Graphiques additionnels) -->
                <div class="card-neo mobile-compact-card" style="background: var(--bg-light); border-style: dashed; z-index: 1; padding-bottom: 400px; margin-bottom: 300px;">
                    <div class="img-container" style="flex: 2; display: flex; flex-direction: column; gap: 2rem; min-height: auto;">
                        <div style="background: #fff; border: 4px solid #000; padding: 2rem; box-shadow: 10px 10px 0 #000; width: 100%;">
                            <canvas id="salesChart" style="max-height: 350px; width: 100%;"></canvas>
                        </div>
                    </div>
                    <div class="card-content">
                        <h3 class="text-overflow-fix">Analyse en Temps Réel</h3>
                        <p>Nos algorithmes transforment vos données brutes en graphiques actionnables. Suivez vos tendances de vente en temps réel.</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem;">
                             <div style="background: #fff; border: 3px solid #000; padding: 1rem; text-align: center; box-shadow: 5px 5px 0 #000;">
                                <div style="font-weight: 900; color: var(--primary);">JUIN</div>
                                <div style="font-size: 1.2rem; font-weight: 900;">+35%</div>
                             </div>
                             <div style="background: #fff; border: 3px solid #000; padding: 1rem; text-align: center; box-shadow: 5px 5px 0 #000;">
                                <div style="font-weight: 900; color: var(--secondary);">ALERTES</div>
                                <div style="font-size: 1.2rem; font-weight: 900;">03</div>
                             </div>
                        </div>
                    </div>
                </div>

                <!-- 2. Organisation Section: boutiques/clients (INTERACTIVE STACK) -->
                <div class="card-neo" style="z-index: 2;">
                    <div class="card-content">
                        <h3 class="text-overflow-fix">Organisation Multi-Boutique</h3>
                        <p>Changez de point de vente instantanément. Gérez vos boutiques et vos fiches clients dans un environnement unifié et sécurisé.</p>
                    </div>
                    <div class="img-container org-stack" style="overflow: visible;">
                        <img src="{{ asset('storage/images/boutiques.png') }}" alt="Boutiques" class="stack-img img-boutique neo-border" loading="lazy">
                        <img src="{{ asset('storage/images/clients.png') }}" alt="Clients" class="stack-img img-client neo-border" loading="lazy" style="top: -60px;">
                    </div>
                </div>

                <!-- 3. Efficacité Section: Excel (MASSIVE IMAGE) -->
                <div class="card-neo">
                    <div class="deco-wrapper top-left-deco delay-2">
                        <svg class="deco-shape" width="110" height="110" viewBox="0 0 100 100">
                            <rect x="10" y="10" width="80" height="80" fill="#001a33" stroke="#000" stroke-width="4" transform="rotate(15 50 50)" opacity="0.9" />
                            <text x="50" y="65" font-family="Space Grotesk" font-weight="900" font-size="40" text-anchor="middle" fill="#fff" transform="rotate(15 50 50)">X</text>
                        </svg>
                    </div>
                    <!-- Added Exceil_ventes.png here as requested to use ALL 11 images -->
                    <div class="img-container" style="flex: 2; display: grid; gap: 2rem;">
                        <img src="{{ asset('storage/images/Excel_produit.png') }}" alt="Excel Import" class="neo-border img-neo-full" loading="lazy">
                        <img src="{{ asset('storage/images/Exceil_ventes.png') }}" alt="Excel Export" class="neo-border img-neo-full" loading="lazy">
                    </div>
                    <div class="card-content">
                        <h3 class="text-overflow-fix">Efficacité : Import/Export Excel</h3>
                        <p>Synchronisez des milliers de produits et exportez vos journaux de ventes en un éclair. Gagnez des heures précieuses.</p>
                    </div>
                </div>

                <!-- 4. Operations Section: produits/ventes/facture (SPLIT CARS) -->
                <!-- 4. Operations Section: produits/ventes/facture (SPLIT CARS) -->
                <div class="grid-split">
                    <div class="card-split" id="gestion-stock">
                        <h3 class="text-overflow-fix" style="font-size: 2.5rem; font-weight: 900; margin-bottom: 2rem;">Gestion de Stock</h3>
                        <p style="font-size: 1.2rem; margin-bottom: 2rem;">Inventaire complet et suivi des mouvements.</p>
                        <img src="{{ asset('storage/images/produits.png') }}" alt="Produits" class="neo-border" style="width: 100%;" loading="lazy">
                    </div>
                    <div class="card-split">
                        <h3 class="text-overflow-fix" style="font-size: 2.5rem; font-weight: 900; margin-bottom: 2rem;">Opérations de Vente</h3>
                        <p style="font-size: 1.2rem; margin-bottom: 2rem;">Générez des factures professionnelles à chaque encaissement.</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                            <img src="{{ asset('storage/images/ventes.png') }}" alt="Ventes" class="neo-border" style="width: 100%;" loading="lazy">
                            <img src="{{ asset('storage/images/facture.png') }}" alt="Facture" class="neo-border" style="width: 100%;" loading="lazy">
                        </div>
                    </div>
                </div>

                <!-- NEW: Performance Monitoring (Interactive Charts) -->
                <div class="card-neo" style="background: #f1f5f9; border: 4px solid #000;">
                    <div class="card-content">
                        <h3 class="text-overflow-fix">Surveillance des Performances</h3>
                        <p>Des graphiques générés en temps réel pour un pilotage précis de votre activité.</p>
                        <div style="background: #fff; border: 4px solid #000; padding: 1.5rem; box-shadow: 10px 10px 0 #000; margin-top: 2rem;">
                            <canvas id="categoryChart" style="max-height: 250px;"></canvas>
                        </div>
                    </div>
                    <div class="img-container" style="flex: 1.5; background: #fff; border: 4px solid #000; padding: 2rem; box-shadow: 15px 15px 0 #000;">
                        <canvas id="barChart" style="max-height: 350px;"></canvas>
                    </div>
                </div>

                <!-- NEW: Application Functional Diagram (Updated Color) -->
                <div class="card-neo" style="flex-direction: column; align-items: flex-start; background: var(--primary); color: #fff; border-color: #000;">
                    <div class="deco-wrapper top-right-deco" style="top: -40px; right: -40px;">
                        <svg class="deco-shape" width="130" height="130" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="#001a33" stroke="#fff" stroke-width="3" opacity="0.95" />
                            <path d="M50 25 L50 45 M50 55 L50 75 M25 50 L40 50 M60 50 L75 50" stroke="#fff" stroke-width="6" stroke-linecap="round" />
                        </svg>
                    </div>
                    <h3 class="text-overflow-fix" style="color: #fff;">Cycle de Vie de votre Gestion</h3>
                    <p style="color: #fff; margin-bottom: 4rem; opacity: 0.9;">Une boucle vertueuse pour maximiser votre rentabilité.</p>
                    
                    <div style="width: 100%; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 3rem; position: relative;">
                        <!-- Step 1 -->
                        <div style="background: #000; border: 3px solid #fff; padding: 2rem; box-shadow: 10px 10px 0 #000; position: relative;">
                            <div style="position: absolute; top: -20px; right: -10px; background: #fff; color: #000; padding: 5px 15px; font-weight: 900; border: 3px solid #000;">STEP 01</div>
                            <h4 style="font-family: 'Space Grotesk'; font-weight: 900; text-transform: uppercase; margin-bottom: 1rem; color: #fff;">IMPORTATION</h4>
                            <p style="font-size: 0.9rem; color: #eee;">Intégrez vos stocks via Excel en 1 clic.</p>
                        </div>
                        <!-- Step 2 -->
                        <div style="background: #000; border: 3px solid #fff; padding: 2rem; box-shadow: 10px 10px 0 #000; position: relative;">
                            <div style="position: absolute; top: -20px; right: -10px; background: #fff; color: #000; padding: 5px 15px; font-weight: 900; border: 3px solid #000;">STEP 02</div>
                            <h4 style="font-family: 'Space Grotesk'; font-weight: 900; text-transform: uppercase; margin-bottom: 1rem; color: #fff;">Vente & Suivi</h4>
                            <p style="font-size: 0.9rem; color: #eee;">Enregistrez vos ventes sur mobile instantanément.</p>
                        </div>
                        <!-- Step 3 -->
                        <div style="background: #000; border: 3px solid #fff; padding: 2rem; box-shadow: 10px 10px 0 #000; position: relative;">
                            <div style="position: absolute; top: -20px; right: -10px; background: #fff; color: #000; padding: 5px 15px; font-weight: 900; border: 3px solid #000;">STEP 03</div>
                            <h4 style="font-family: 'Space Grotesk'; font-weight: 900; text-transform: uppercase; margin-bottom: 1rem; color: #fff;">OPTIMISATION</h4>
                            <p style="font-size: 0.9rem; color: #eee;">Analysez vos bénéfices et réapprovisionnez intelligemment.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section Téléchargement Ultra-Compacte -->
        <section id="download" style="background: #000; color: #fff; padding: 10px 0; border-top: 4px solid var(--primary); border-bottom: 4px solid var(--primary); position: relative; overflow: hidden;">
            <div style="max-width: 1500px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 5%;">
                <div style="flex: 1.5;">
                    <h2 style="font-size: 3.5rem; color: #fff; margin-bottom: 0.5rem; line-height: 0.9; font-weight: 900; text-transform: uppercase;" class="text-overflow-fix">Disponible <span>Maintenant</span></h2>
                    <p style="font-size: 1.2rem; color: #ccc; margin-bottom: 1.5rem; max-width: 500px; font-weight: 500;">Gérez votre stock partout. Téléchargez l'app officielle.</p>
                    
                    <div class="store-badges" style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
                        <a href="#" style="display: inline-block;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" style="height: 50px; border: none !important; box-shadow: none !important; border-radius: 0 !important;" loading="lazy">
                        </a>
                        <a href="#" style="display: inline-block;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" style="height: 50px; border: none !important; box-shadow: none !important; border-radius: 0 !important;" loading="lazy">
                        </a>
                    </div>
                </div>
                <div style="flex: 1; text-align: right; display: flex; justify-content: flex-end; align-items: center;">
                    <img src="{{ asset('storage/images/dashboard1.jpeg') }}" alt="App Mob" class="neo-border" style="width: 250px; transform: rotate(3deg); border-color: #fff !important; box-shadow: 10px 10px 0 var(--primary); border-radius: 20px;" loading="lazy">
                </div>
            </div>
        </section>

        <!-- Final Call to Action -->
        <section class="cta-section">
            <div class="cta-text">
                <h2 class="text-overflow-fix">Boostez votre Business dès aujourd'hui</h2>
                <a href="#download" class="btn-cta">Démarrer Maintenant</a>
            </div>
            <div class="cta-visual" style="flex: 1;">
                <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" alt="Smart Business Management" class="neo-border" loading="lazy">
            </div>
        </section>

        <!-- Contact Form Section -->
        <section id="contact" class="section-wide" style="background: #f8fafc; padding-bottom: 0;">
            <div class="container" style="padding-bottom: 60px;">
                <div class="title-block" style="text-align: center; margin-bottom: 4rem;">
                    <h2 style="font-size: 3.5rem;" class="text-overflow-fix">Contactez-nous</h2>
                </div>
                
                <!-- Messages placed OUTSIDE the card for better visibility -->
                @if(session('success'))
                    <div style="background: #fff; color: #000; padding: 1.5rem; border: 4px solid #000; box-shadow: 8px 8px 0 #000; margin: 0 auto 3rem; max-width: 900px; font-family: 'Space Grotesk'; font-weight: 800; text-transform: uppercase; font-size: 1.2rem; display: flex; align-items: center; gap: 1rem;">
                        <span style="font-size: 2rem;">✅</span>
                        <span>{{ session('success') }}</span>
                    </div>
                @endif

                @if($errors->any())
                    <div style="background: #fff; color: #ff0000; padding: 1.5rem; border: 4px solid #000; box-shadow: 8px 8px 0 #000; margin: 0 auto 3rem; max-width: 900px; font-family: 'Space Grotesk'; font-weight: 800; text-transform: uppercase;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <span style="font-size: 2rem;">⚠️</span>
                            <span style="font-size: 1.2rem;">Oups !</span>
                        </div>
                        <ul style="list-style: none;">
                            @foreach($errors->all() as $error)
                                <li>- {{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif
                
                <div class="card-neo" style="background: #fff; color: #000; box-shadow: 15px 15px 0 var(--primary); width: 100%; max-width: 900px; margin: 0 auto; padding: 4rem;">
                    <h3 style="font-size: 1.8rem; margin-bottom: 3rem; font-weight: 950; text-transform: uppercase; background: #000; color: #fff; display: inline-block; padding: 12px 30px; transform: rotate(-1.5deg); border: 3px solid var(--primary); box-shadow: 8px 8px 0 var(--primary);" class="text-overflow-fix">Envoyez-nous un message</h3>

                    <form id="contactForm" action="{{ route('contact.send') }}" method="POST" style="display: grid; gap: 1.5rem;" onsubmit="const btn = document.getElementById('submitBtn'); btn.disabled = true; btn.innerText = 'ENVOI EN COURS...'; btn.style.backgroundColor = '#333'; btn.style.cursor = 'wait';">
                        @csrf
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                            <input type="text" name="name" value="{{ old('name') }}" placeholder="VOTRE NOM COMPLET" required style="padding: 1.5rem; border: 4px solid #000; font-size: 1rem; font-family: 'Space Grotesk'; font-weight: 800; text-transform: uppercase; width: 100%;">
                            <input type="email" name="email" value="{{ old('email') }}" placeholder="VOTRE EMAIL" required style="padding: 1.5rem; border: 4px solid #000; font-size: 1rem; font-family: 'Space Grotesk'; font-weight: 800; width: 100%;">
                        </div>
                        <input type="text" name="subject" value="{{ old('subject') }}" placeholder="SUJET DE VOTRE MESSAGE" required style="padding: 1.5rem; border: 4px solid #000; font-size: 1rem; font-family: 'Space Grotesk'; font-weight: 800; text-transform: uppercase; width: 100%;">
                        <textarea name="message" placeholder="VOTRE MESSAGE..." rows="5" required style="padding: 1.5rem; border: 4px solid #000; font-size: 1rem; font-family: 'Space Grotesk'; font-weight: 800; width: 100%; resize: vertical;">{{ old('message') }}</textarea>
                        <button id="submitBtn" type="submit" class="btn-cta" style="width: 100%; cursor: pointer; border: 4px solid #000; box-shadow: 10px 10px 0 #000; font-size: 1.5rem; padding: 25px;">ENVOYER MAINTENANT 🔥</button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <!-- Monumental Rounded Industrial Footer (Optimized) -->
    <footer style="background: #000; color: #fff; padding: 80px 5%; border: 8px solid var(--primary); border-radius: 40px; display: flex; justify-content: space-between; align-items: center; gap: 4rem; flex-wrap: wrap; margin: 20px 30px 30px; box-shadow: 15px 15px 0 rgba(0,0,0,0.05);">
        
        <h2 style="font-family: 'Space Grotesk'; font-weight: 950; font-size: 5.5rem; line-height: 0.85; text-transform: uppercase; flex: 2; margin: 0; letter-spacing: -0.05em; color: #fff;" class="text-overflow-fix">
            La révolution de la <br>gestion des stocks <br><span style="color: var(--primary);">sur mobile.</span>
        </h2>

        <div class="footer-powered" style="flex: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 1.5rem;">
            <div style="text-align: right;">
                <span style="font-family: 'Space Grotesk'; font-weight: 900; font-size: 1.5rem; text-transform: uppercase; color: #444; letter-spacing: 5px; display: block; margin-bottom: 12px;">Powered by</span>
                <img src="{{ asset('storage/by.png') }}" alt="Powered By" style="height: 90px; filter: brightness(0) invert(1); border: none !important; box-shadow: none !important;" loading="lazy">
            </div>
        </div>

    </footer>

    <script>
        // Mobile Menu Logic - IMPROVED VERSION
        const mobileToggle = document.getElementById('mobileToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const closeMenu = document.getElementById('closeMenu');
        const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-menu .btn-header');

        function toggleMenu() {
            mobileToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
        }

        function closeMenuFunction() {
            mobileToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // Toggle menu on hamburger click
        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });

        // Close menu on close button click
        closeMenu.addEventListener('click', closeMenuFunction);

        // Close menu when clicking on links
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMenuFunction);
        });

        // Close menu when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (mobileMenu.classList.contains('active') && 
                !mobileMenu.contains(e.target) && 
                !mobileToggle.contains(e.target)) {
                closeMenuFunction();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                closeMenuFunction();
            }
        });

        // Custom cursor logic (disabled on touch devices)
        const cursor = document.getElementById('custom-cursor');
        const cursorGlow = document.getElementById('custom-cursor-glow');
        
        // Check if device supports hover (not touch device)
        if (window.matchMedia("(hover: hover)").matches) {
            document.addEventListener('mousemove', (e) => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
                cursorGlow.style.left = e.clientX + 'px';
                cursorGlow.style.top = e.clientY + 'px';
                
                // Update sniper values with "technical" data derived from coordinates
                const topVal = cursor.querySelector('.text-top');
                const botVal = cursor.querySelector('.text-bottom');
                if (topVal && botVal) {
                    // Simulate coordinate/rangefinder data
                    topVal.innerText = Math.floor(e.clientX / 5).toString().padStart(3, '0');
                    botVal.innerText = Math.floor(e.clientY / 5).toString().padStart(3, '0');
                }
            });

            // Hover effect for interactive elements
            const interactives = document.querySelectorAll('a, button, .btn-cta, .btn-header');
            interactives.forEach(el => {
                el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
            });

            // Hide custom cursor on focus for inputs/textareas
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(el => {
                el.addEventListener('focus', () => {
                    cursor.classList.add('cursor-hidden');
                    cursorGlow.classList.add('cursor-hidden');
                    document.body.classList.add('cursor-auto-override'); // Show system cursor
                });
                el.addEventListener('blur', () => {
                    cursor.classList.remove('cursor-hidden');
                    cursorGlow.classList.remove('cursor-hidden');
                    document.body.classList.remove('cursor-auto-override'); // Restore custom cursor
                });
            });
        } else {
            // Hide custom cursor on touch devices
            cursor.style.display = 'none';
            cursorGlow.style.display = 'none';
        }

        // Header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Mobile Stack Interaction
        const orgStack = document.querySelector('.org-stack');
        if (orgStack) {
            orgStack.addEventListener('click', function() {
                this.classList.toggle('swapped');
            });
        }



        // Prevent horizontal scroll
        document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Fix for iOS viewport height
        function setVH() {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        
        // Chart.js Implementation
        const ctxSales = document.getElementById('salesChart');
        if (ctxSales) {
            new Chart(ctxSales, {
                type: 'line',
                data: {
                    labels: ['Début', 'Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'],
                    datasets: [{
                        label: 'Volume de Transactions (Mensuel)',
                        data: [50, 150, 120, 240, 310],
                        borderColor: '#2563eb',
                        borderWidth: 5,
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#000',
                        pointBorderWidth: 3,
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: '#000', borderDash: [2, 2] },
                            ticks: { font: { family: 'Space Grotesk', weight: '900' } }
                        },
                        x: { 
                            grid: { display: false },
                            ticks: { font: { family: 'Space Grotesk', weight: '900' } }
                        }
                    }
                }
            });
        }

        const ctxCategory = document.getElementById('categoryChart');
        if (ctxCategory) {
            new Chart(ctxCategory, {
                type: 'doughnut',
                data: {
                    labels: ['Confirmé', 'En Attente', 'Alerte'],
                    datasets: [{
                        data: [65, 20, 15],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderColor: '#000',
                        borderWidth: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { font: { family: 'Space Grotesk', weight: '900', size: 11 }, usePointStyle: true, padding: 20 }
                        }
                    },
                    cutout: '70%'
                }
            });
        }

        const ctxBar = document.getElementById('barChart');
        if (ctxBar) {
            new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
                    datasets: [{
                        label: 'Chiffre d\'Affaires',
                        data: [420, 580, 490, 710, 850],
                        backgroundColor: '#2563eb',
                        borderColor: '#000',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: '#000', borderDash: [2, 2] }, ticks: { font: { family: 'Space Grotesk', weight: '900' } } },
                        x: { ticks: { font: { family: 'Space Grotesk', weight: '900' } } }
                    }
                }
            });
        }

        setVH();
        window.addEventListener('resize', setVH);
    </script>
</body>
</html>