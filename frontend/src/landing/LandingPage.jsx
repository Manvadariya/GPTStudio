import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// This component encapsulates the styles, keeping the JSX clean.
const PageStyles = () => (
  <style>{`
    body {
        font-family: 'Inter', sans-serif;
        background-color: #eff5fb; /* New Background */
        color: #0b131e; /* New Text */
    }
    .cta-button {
        transition: all 0.3s ease;
    }
    .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(45, 116, 215, 0.3), 0 4px 6px -2px rgba(45, 116, 215, 0.2);
    }
    @keyframes grid {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-50px); }
    }
    .animate-grid {
        animation: grid 15s linear infinite;
    }
    
    /* Styles for Tubelight Navbar */
    .nav-item.active {
        color: #2d74d7; 
        background-color: rgba(45, 116, 215, 0.1);
    }
    .lamp {
        position: absolute;
        inset: 0;
        width: 100%;
        background-color: rgba(45, 116, 215, 0.05);
        border-radius: 9999px;
        z-index: -10;
        transition: all 0.3s ease;
    }
    .lamp-top {
        position: absolute;
        top: -0.375rem; /* -top-1.5 */
        left: 50%;
        transform: translateX(-50%);
        width: 2rem;
        height: 0.25rem;
        background-color: #2d74d7;
        border-radius: 9999px;
    }
    
    /* Manual syntax highlighting for the code block */
    .token-comment { color: #6a737d; }
    .token-punctuation { color: #24292e; }
    .token-property { color: #d73a49; }
    .token-string { color: #032f62; }
    .token-operator { color: #d73a49; }
    .token-boolean { color: #005cc5; }
    .token-number { color: #e36209; }
    .shiki-code {
        white-space: pre-wrap;
    }

    /* CTA Section Animations & Styles */
    @keyframes fade-in-up {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes scale-in {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
    .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }

    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
    .delay-300 { animation-delay: 300ms; }
    .delay-500 { animation-delay: 500ms; }
    .delay-700 { animation-delay: 700ms; }

    .fade-top-lg {
        mask-image: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 1) 8rem);
    }
    .shadow-glow {
        box-shadow: 0 -16px 128px 0 rgba(78, 147, 244, 0.5) inset, 0 -16px 32px 0 rgba(45, 116, 215, 0.5) inset;
    }
    .text-muted {
      color: #6c757d;
    }
    .text-muted-foreground {
        color: #6c757d;
    }
    .border {
        border-color: #dee2e6;
    }
    .bg-card {
        background-color: #fff;
    }
    .text-card-foreground {
        color: #0b131e;
    }
    .text-foreground {
       color: #0b131e;
    }
  `}</style>
);

// Helper function to combine class names, similar to shadcn/ui's cn utility.
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
}

// Lamp component for the active navigation item
const Lamp = () => (
    <div className="lamp">
        <div className="lamp-top">
            <div className="absolute w-12 h-6 bg-blue-500/20 rounded-full blur-md -top-2 -left-2"></div>
            <div className="absolute w-8 h-6 bg-blue-500/20 rounded-full blur-md -top-1"></div>
            <div className="absolute w-4 h-4 bg-blue-400/20 rounded-full blur-sm top-0 left-2"></div>
        </div>
    </div>
);

// Icon components from lucide-react
const Shield = ({ className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-shield", className)} {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

const Users = ({ className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-users", className)} {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const Copy = ({ className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-copy", className)} {...props}>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const Check = ({ className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-check", className)} {...props}>
        <path d="M20 6 9 17l-5-12" />
    </svg>
);

// Card Components from shadcn/ui
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-6", className)} {...props} />
));
CardContent.displayName = "CardContent";


const Navigation = ({ onSignInClick }) => { // 2. Accept a prop for the click handler
    const [activeItem, setActiveItem] = useState('Home');
    const navItems = ['Home', 'Features', 'Docs'];
    const navLinks = { 'Home': '#hero', 'Features': '#features', 'Docs': '#timeline' };
    const navIcons = {
        'Home': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
        'Features': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 12h18M12 3v18"/></svg>,
        'Docs': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
    };

    return (
        <>
            <header className="hidden sm:flex fixed top-0 left-0 right-0 z-50 justify-between items-center container mx-auto px-6 mt-6">
                 <a href="#" className="text-xl font-bold text-[#0b131e]">GPTStudio</a>
                 <nav>
                    <div className="flex items-center gap-1 bg-[#eff5fb]/60 border border-[#0b131e]/10 backdrop-blur-lg p-1.5 rounded-full shadow-lg">
                        {navItems.map(item => (
                            <a key={item} href={navLinks[item]} className={`nav-item relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors text-[#0b131e]/90 hover:text-[#2d74d7] ${activeItem === item ? 'active' : ''}`} onClick={(e) => { if (navLinks[item] === '#') e.preventDefault(); setActiveItem(item); }}>
                                <span className="hidden md:inline">{item}</span>
                                <span className="md:hidden">{navIcons[item]}</span>
                                {activeItem === item && <Lamp />}
                            </a>
                        ))}
                    </div>
                </nav>
                {/* 3. Use the passed-in onClick handler */}
                <button onClick={onSignInClick} className="bg-[#2d74d7] text-[#eff5fb] font-semibold py-2 px-6 rounded-lg cta-button text-sm">
                    Sign In
                </button>
            </header>
            <nav id="tubelight-nav" className="sm:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-50 mb-6">{/* ... Mobile Nav ... */}</nav>
        </>
    );
};

// Hero Section Component
const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <section id="hero" className="relative overflow-hidden">
            
            <div
                className="pointer-events-none absolute size-full overflow-hidden [perspective:200px]"
                style={{'--grid-angle': '65deg', '--cell-size': '50px', '--opacity': '0.4', '--light-line': 'rgba(11,19,30,0.1)'}}
            >
                <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
                    <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#eff5fb] to-transparent to-90%"></div>
            </div>
            <div className="max-w-screen-xl z-10 mx-auto px-4 pt-36 pb-28 gap-12 md:px-8 relative">
                <div className="space-y-5 max-w-4xl mx-auto text-center">
                    <h1 className="text-sm text-[#0b131e]/80 group font-sans mx-auto px-5 py-2 bg-[#0b131e]/5 border border-[#0b131e]/10 rounded-full w-fit cursor-pointer hover:bg-[#0b131e]/10 transition-colors">
                        No-Code Chatbot Builder
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline w-4 h-4 ml-1 group-hover:translate-x-1 duration-300"><path d="m9 18 6-6-6-6"/></svg>
                    </h1>
                    <h2 className="text-4xl tracking-tighter font-extrabold text-[#0b131e] mx-auto md:text-6xl">
                        Build Custom AI Chatbots, <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2d74d7] to-[#4e93f4]">
                            Powered by Your Data
                        </span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-[#0b131e]/80 text-lg md:text-xl">
                        Create intelligent, context-aware chatbots in minutes. Upload your documents, connect your website, and deploy an AI assistant that understands your business inside and out.
                    </p>
                    <div className="flex justify-center items-center gap-x-3 mt-8">
                        <button onClick={() => navigate('/signin')} className="bg-[#2d74d7] text-[#eff5fb] font-semibold py-3 px-8 rounded-lg cta-button text-lg">
                            Start Now
                        </button>
                    </div>
                </div>
                <div className="mt-24 mx-auto relative z-10 max-w-5xl">
                    <img
                        src="public/dashboard.png"
                        className="w-full shadow-2xl rounded-lg border border-[#0b131e]/10"
                        alt="GPTStudio Dashboard preview"
                    />
                </div>
            </div>
        </section>
    );
};

// Logos Section Component
const LogosSection = () => (
    <section className="py-12 bg-white border-y border-[#0b131e]/10">
        <div className="container mx-auto px-6">
            <p className="text-center text-[#0b131e]/70 mb-8 font-semibold tracking-wider">TRUSTED BY TEAMS AT WORLD-CLASS COMPANIES</p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
                <div className="h-8 text-[#0b131e]/70 font-bold text-xl opacity-70 hover:opacity-100 transition">Innovate Inc.</div>
                <div className="h-8 text-[#0b131e]/70 font-bold text-xl opacity-70 hover:opacity-100 transition">QuantumLeap</div>
                <div className="h-8 text-[#0b131e]/70 font-bold text-xl opacity-70 hover:opacity-100 transition">Apex Solutions</div>
                <div className="h-8 text-[#0b131e]/70 font-bold text-xl opacity-70 hover:opacity-100 transition">Stellar Corp.</div>
                <div className="h-8 text-[#0b131e]/70 font-bold text-xl opacity-70 hover:opacity-100 transition">Nexus Enterprises</div>
            </div>
        </div>
    </section>
);

// Features Section Component
const FeaturesSection = () => (
    <section id="features" className="bg-white py-16 md:py-32">
        <div className="mx-auto max-w-3xl lg:max-w-5xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
                 <h2 className="text-3xl md:text-4xl font-bold text-[#0b131e] mb-4">A Powerful Toolkit for Your AI Assistant</h2>
                <p className="text-[#0b131e]/80 text-lg">GPTStudio provides everything you need to build, manage, and deploy powerful custom chatbots.</p>
            </div>
            <div className="relative">
                <div className="relative z-10 grid grid-cols-6 gap-3">
                    <Card className="relative col-span-full flex overflow-hidden lg:col-span-2">
                        <CardContent className="relative m-auto size-fit pt-6">
                            <div className="relative flex h-24 w-56 items-center">
                                <svg className="text-muted absolute inset-0 size-full" viewBox="0 0 254 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M112.891 97.7022C140.366 97.0802 171.004 94.6715 201.087 87.5116C210.43 85.2881 219.615 82.6412 228.284 78.2473C232.198 76.3179 235.905 73.9942 239.348 71.3124C241.85 69.2557 243.954 66.7571 245.555 63.9408C249.34 57.3235 248.281 50.5341 242.498 45.6109C239.033 42.7237 235.228 40.2703 231.169 38.3054C219.443 32.7209 207.141 28.4382 194.482 25.534C184.013 23.1927 173.358 21.7755 162.64 21.2989C161.376 21.3512 160.113 21.181 158.908 20.796C158.034 20.399 156.857 19.1682 156.962 18.4535C157.115 17.8927 157.381 17.3689 157.743 16.9139C158.104 16.4588 158.555 16.0821 159.067 15.8066C160.14 15.4683 161.274 15.3733 162.389 15.5286C179.805 15.3566 196.626 18.8373 212.998 24.462C220.978 27.2494 228.798 30.4747 236.423 34.1232C240.476 36.1159 244.202 38.7131 247.474 41.8258C254.342 48.2578 255.745 56.9397 251.841 65.4892C249.793 69.8582 246.736 73.6777 242.921 76.6327C236.224 82.0192 228.522 85.4602 220.502 88.2924C205.017 93.7847 188.964 96.9081 172.738 99.2109C153.442 101.949 133.993 103.478 114.506 103.79C91.1468 104.161 67.9334 102.97 45.1169 97.5831C36.0094 95.5616 27.2626 92.1655 19.1771 87.5116C13.839 84.5746 9.1557 80.5802 5.41318 75.7725C-0.54238 67.7259 -1.13794 59.1763 3.25594 50.2827C5.82447 45.3918 9.29572 41.0315 13.4863 37.4319C24.2989 27.5721 37.0438 20.9681 50.5431 15.7272C68.1451 8.8849 86.4883 5.1395 105.175 2.83669C129.045 0.0992292 153.151 0.134761 177.013 2.94256C197.672 5.23215 218.04 9.01724 237.588 16.3889C240.089 17.3418 242.498 18.5197 244.933 19.6446C246.627 20.4387 247.725 21.6695 246.997 23.615C246.455 25.1105 244.814 25.5605 242.63 24.5811C230.322 18.9961 217.233 16.1904 204.117 13.4376C188.761 10.3438 173.2 8.36665 157.558 7.52174C129.914 5.70776 102.154 8.06792 75.2124 14.5228C60.6177 17.8788 46.5758 23.2977 33.5102 30.6161C26.6595 34.3329 20.4123 39.0673 14.9818 44.658C12.9433 46.8071 11.1336 49.1622 9.58207 51.6855C4.87056 59.5336 5.61172 67.2494 11.9246 73.7608C15.2064 77.0494 18.8775 79.925 22.8564 82.3236C31.6176 87.7101 41.3848 90.5291 51.3902 92.5804C70.6068 96.5773 90.0219 97.7419 112.891 97.7022Z" fill="currentColor"/>
                                </svg>
                                <span className="mx-auto block w-fit text-5xl font-semibold">100%</span>
                            </div>
                            <h2 className="mt-6 text-center text-3xl font-semibold">Customizable</h2>
                        </CardContent>
                    </Card>
                    <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                         <CardContent className="pt-6">
                            <div className="relative mx-auto flex aspect-square size-32 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border border-black/10 before:border-black/5">
                                 <Shield className="m-auto h-fit w-16 text-muted-foreground" strokeWidth={1.5} />
                            </div>
                            <div className="relative z-10 mt-6 space-y-2 text-center">
                                 <h2 className="text-lg font-medium text-foreground">Secure by default</h2>
                                <p className="text-muted-foreground text-sm">We take security seriously and implement best practices to protect your data.</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                        <CardContent className="pt-6">
                            <div className="pt-6 lg:px-6">
                               <svg className="text-muted-foreground w-full" viewBox="0 0 386 123" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="386" height="123" rx="10" fill="white" />
                                    <g clipPath="url(#clip0_0_106_light)">
                                        <circle className="text-muted" cx="29" cy="29" r="15" fill="currentColor" />
                                        <path d="M29 23V35" stroke="#eff5fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M35 29L29 35L23 29" stroke="#eff5fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path className="text-foreground" d="M55.2373 32H58.7988C61.7383 32 63.4404 30.1816 63.4404 27.0508V27.0371C63.4404 23.9404 61.7246 22.1357 58.7988 22.1357H55.2373V32ZM56.7686 30.6807V23.4551H58.6279C60.6719 23.4551 61.8818 24.7881 61.8818 27.0576V27.0713C61.8818 29.3613 60.6924 30.6807 58.6279 30.6807H56.7686ZM69.4922 32.1436C71.666 32.1436 72.999 30.6875 72.999 28.2949V28.2812C72.999 25.8887 71.6592 24.4326 69.4922 24.4326C67.3184 24.4326 65.9785 25.8955 65.9785 28.2812V28.2949C65.9785 30.6875 67.3115 32.1436 69.4922 32.1436ZM69.4922 30.9062C68.2139 30.9062 67.4961 29.9424 67.4961 28.2949V28.2812C67.4961 26.6338 68.2139 25.6699 69.4922 25.6699C70.7637 25.6699 71.4883 26.6338 71.4883 28.2812V28.2949C71.4883 29.9355 70.7637 30.9062 69.4922 30.9062ZM76.9111 32H78.4219L79.9531 26.4629H80.0693L81.6074 32H83.1318L85.1758 24.5762H83.7061L82.3799 30.3047H82.2637L80.7324 24.5762H79.3242L77.793 30.3047H77.6836L76.3506 24.5762H74.8604L76.9111 32ZM87.6934 32H89.1768V27.6455C89.1768 26.4492 89.8535 25.7041 90.9404 25.7041C92.0273 25.7041 92.54 26.3125 92.54 27.543V32H94.0166V27.1943C94.0166 25.4238 93.1006 24.4326 91.4395 24.4326C90.3594 24.4326 89.6484 24.9111 89.2861 25.7041H89.1768V24.5762H87.6934V32ZM97.1562 32H98.6396V21.6641H97.1562V32ZM104.992 32.1436C107.166 32.1436 108.499 30.6875 108.499 28.2949V28.2812C108.499 25.8887 107.159 24.4326 104.992 24.4326C102.818 24.4326 101.479 25.8955 101.479 28.2812V28.2949C101.479 30.6875 102.812 32.1436 104.992 32.1436ZM104.992 30.9062C103.714 30.9062 102.996 29.9424 102.996 28.2949V28.2812C102.996 26.6338 103.714 25.6699 104.992 25.6699C106.264 25.6699 106.988 26.6338 106.988 28.2812V28.2949C106.988 29.9355 106.264 30.9062 104.992 30.9062ZM113.307 32.123C114.291 32.123 115.07 31.6992 115.508 30.9473H115.624V32H117.094V26.9209C117.094 25.3623 116.041 24.4326 114.175 24.4326C112.486 24.4326 111.317 25.2461 111.14 26.4629L111.133 26.5107H112.562L112.568 26.4834C112.746 25.957 113.286 25.6562 114.106 25.6562C115.111 25.6562 115.624 26.1074 115.624 26.9209V27.5771L113.614 27.6934C111.844 27.8027 110.846 28.5752 110.846 29.9014V29.915C110.846 31.2617 111.892 32.123 113.307 32.123ZM112.322 29.8535V29.8398C112.322 29.1699 112.787 28.8008 113.812 28.7393L115.624 28.623V29.2588C115.624 30.2158 114.811 30.9404 113.703 30.9404C112.903 30.9404 112.322 30.5371 112.322 29.8535ZM122.893 32.123C123.932 32.123 124.745 31.6445 125.176 30.8311H125.292V32H126.769V21.6641H125.292V25.752H125.176C124.779 24.9521 123.911 24.4463 122.893 24.4463C121.006 24.4463 119.816 25.9297 119.816 28.2812V28.2949C119.816 30.626 121.026 32.123 122.893 32.123ZM123.316 30.8584C122.072 30.8584 121.327 29.8877 121.327 28.2949V28.2812C121.327 26.6885 122.072 25.7178 123.316 25.7178C124.547 25.7178 125.312 26.6953 125.312 28.2812V28.2949C125.312 29.8809 124.554 30.8584 123.316 30.8584Z" fill="currentColor"/></g>
                                    <path fillRule="evenodd" clipRule="evenodd" d="M3 123C3 123 14.3298 94.153 35.1282 88.0957C55.9266 82.0384 65.9333 80.5508 65.9333 80.5508C65.9333 80.5508 80.699 80.5508 92.1777 80.5508C103.656 80.5508 100.887 63.5348 109.06 63.5348C117.233 63.5348 117.217 91.9728 124.78 91.9728C132.343 91.9728 142.264 78.03 153.831 80.5508C165.398 83.0716 186.825 91.9728 193.761 91.9728C200.697 91.9728 206.296 63.5348 214.07 63.5348C221.844 63.5348 238.653 93.7771 244.234 91.9728C249.814 90.1684 258.8 60 266.19 60C272.075 60 284.1 88.057 286.678 88.0957C294.762 88.2171 300.192 72.9284 305.423 72.9284C312.323 72.9284 323.377 65.2437 335.553 63.5348C347.729 61.8259 348.218 82.07 363.639 80.5508C367.875 80.1335 372.949 82.2017 376.437 87.1008C379.446 91.3274 381.054 97.4325 382.521 104.647C383.479 109.364 382.521 123 382.521 123" fill="url(#paint0_linear_0_106_light)"/>
                                    <path className="text-[#2d74d7]" d="M3 121.077C3 121.077 15.3041 93.6691 36.0195 87.756C56.7349 81.8429 66.6632 80.9723 66.6632 80.9723C66.6632 80.9723 80.0327 80.9723 91.4656 80.9723C102.898 80.9723 100.415 64.2824 108.556 64.2824C116.696 64.2824 117.693 92.1332 125.226 92.1332C132.759 92.1332 142.07 78.5115 153.591 80.9723C165.113 83.433 186.092 92.1332 193 92.1332C199.908 92.1332 205.274 64.2824 213.017 64.2824C220.76 64.2824 237.832 93.8946 243.39 92.1332C248.948 90.3718 257.923 60.5 265.284 60.5C271.145 60.5 283.204 87.7182 285.772 87.756C293.823 87.8746 299.2 73.0802 304.411 73.0802C311.283 73.0802 321.425 65.9506 333.552 64.2824C345.68 62.6141 346.91 82.4553 362.27 80.9723C377.629 79.4892 383 106.605 383 106.605" stroke="currentColor" strokeWidth="3"/>
                                    <defs>
                                        <linearGradient id="paint0_linear_0_106_light" x1="3" y1="60" x2="3" y2="123" gradientUnits="userSpaceOnUse"><stop className="text-[#2d74d7]/15" stopColor="currentColor"/><stop className="text-transparent" offset="1" stopColor="currentColor" stopOpacity="0.01"/></linearGradient>
                                        <clipPath id="clip0_0_106_light"><rect width="358" height="30" fill="white" transform="translate(14 14)"/></clipPath>
                                    </defs>
                                </svg>
                            </div>
                            <div className="relative z-10 mt-14 space-y-2 text-center">
                                 <h2 className="text-lg font-medium text-foreground">Faster than light</h2>
                                <p className="text-muted-foreground text-sm">Experience lightning-fast performance with any website.</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="relative col-span-full overflow-hidden lg:col-span-3">
                        <CardContent className="grid h-full pt-6 sm:grid-cols-2">
                             <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border border-black/10 before:border-black/5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="m-auto size-5 text-muted-foreground" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
                                </div>
                                <div className="space-y-2">
                                     <h2 className="text-lg font-medium text-foreground">In-depth Analytics</h2>
                                    <p className="text-muted-foreground text-sm">Gain insights into user behavior and engagement.</p>
                                </div>
                            </div>
                           <div className="rounded-tl-lg relative -mb-6 -mr-6 mt-6 h-fit border-l border-t border-black/10 p-6 py-6 sm:ml-6">
                                <div className="absolute left-3 top-2 flex gap-1">
                                    <span className="block size-2 rounded-full border border-black/10 bg-black/5"></span>
                                    <span className="block size-2 rounded-full border border-black/10 bg-black/5"></span>
                                    <span className="block size-2 rounded-full border border-black/10 bg-black/5"></span>
                                </div>
                                <svg className="w-full sm:w-[150%]" viewBox="0 0 366 231" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M0.148438 231V179.394L1.92188 180.322L2.94482 177.73L4.05663 183.933L6.77197 178.991L7.42505 184.284L9.42944 187.985L11.1128 191.306V155.455L13.6438 153.03V145.122L14.2197 142.829V150.454V154.842L15.5923 160.829L17.0793 172.215H19.2031V158.182L20.7441 153.03L22.426 148.111V142.407L24.7471 146.86V128.414L26.7725 129.918V120.916L28.1492 118.521L28.4653 127.438L29.1801 123.822L31.0426 120.525V130.26L32.3559 134.71L34.406 145.122V137.548L35.8982 130.26L37.1871 126.049L38.6578 134.71L40.659 138.977V130.26V126.049L43.7557 130.26V123.822L45.972 112.407L47.3391 103.407V92.4726L49.2133 98.4651V106.053L52.5797 89.7556L54.4559 82.7747L56.1181 87.9656L58.9383 89.7556V98.4651L60.7617 103.407L62.0545 123.822L63.8789 118.066L65.631 122.082L68.5479 114.229L70.299 109.729L71.8899 118.066L73.5785 123.822V130.26L74.9446 134.861L76.9243 127.87L78.352 134.71V138.977L80.0787 142.407V152.613L83.0415 142.407V130.26L86.791 123.822L89.0121 116.645V122.082L90.6059 127.87L92.3541 131.77L93.7104 123.822L95.4635 118.066L96.7553 122.082V137.548L99.7094 140.988V131.77L101.711 120.525L103.036 116.645V133.348L104.893 136.218L106.951 140.988L108.933 134.71L110.797 130.26L112.856 140.988V148.111L115.711 152.613L117.941 145.122L119.999 140.988V148.111L123.4 152.613L125.401 158.182L130.547 150.454V156.566L131.578 155.455L134.143 158.182L135.594 168.136L138.329 158.182L140.612 160.829L144.681 169.5L147.011 155.455L148.478 151.787L151.02 152.613L154.886 145.122L158 143.412L159.406 140.637L159.496 133.348L162.295 127.87V122.082L163.855 116.645V109.729L164.83 104.407L166.894 109.729L176.249 98.4651L178.254 106.169L180.77 98.4651V81.045L182.906 69.1641L184.8 56.8669L186.477 62.8428L187.848 79.7483L188.849 106.169L191.351 79.7483L193.485 75.645V98.4651L196.622 94.4523L198.623 87.4228V79.7483L200.717 75.645L202.276 81.045V89.3966L203.638 113.023L205.334 99.8037L207.164 94.4523L208.982 98.4651V102.176L211.267 107.64L212.788 81.045L214.437 66.0083L216.19 62.8428L217.941 56.8669V73.676V79.7483L220.28 75.645L222.516 66.0083V73.676H226.174V84.8662L228.566 98.4651L230.316 75.645L233.61 94.4523V104.25L236.882 102.176L239.543 113.023L241.057 98.4651L243.604 94.4523L244.975 106.169L245.975 87.4228L247.272 89.3966L250.732 84.8662L251.733 96.7549L254.644 94.4523L257.452 99.8037L259.853 91.3111L261.193 84.8662L264.162 75.645L265.808 87.4228L267.247 58.4895L269.757 66.0083L276.625 13.5146L273.33 58.4895L276.25 67.6563L282.377 20.1968L281.37 58.4895V66.0083L283.579 75.645L286.033 56.8669L287.436 73.676L290.628 77.6636L292.414 84.8662L294.214 61.3904L296.215 18.9623L300.826 0.947876L297.531 56.8669L299.973 62.8428L305.548 22.0598L299.755 114.956L301.907 105.378L304.192 112.688V94.9932L308.009 80.0829L310.003 94.9932L311.004 102.127L312.386 105.378L315.007 112.688L316.853 98.004L318.895 105.378L321.257 94.9932L324.349 100.81L325.032 80.0829L327.604 61.5733L329.308 82.3223L333.525 52.7986L334.097 52.145L334.735 55.6812L337.369 59.8108V73.676L340.743 87.9656L343.843 96.3728L348.594 82.7747L349.607 81.045L351 89.7556L352.611 96.3728L355.149 94.9932L356.688 102.176L359.396 108.784L360.684 111.757L365 95.7607V231H148.478H0.148438Z" fill="url(#paint0_linear_0_705_light)"/>
                                    <path className="text-[#2d74d7]" d="M1 179.796L4.05663 172.195V183.933L7.20122 174.398L8.45592 183.933L10.0546 186.948V155.455L12.6353 152.613V145.122L15.3021 134.71V149.804V155.455L16.6916 160.829L18.1222 172.195V158.182L19.8001 152.613L21.4105 148.111V137.548L23.6863 142.407V126.049L25.7658 127.87V120.525L27.2755 118.066L29.1801 112.407V123.822L31.0426 120.525V130.26L32.3559 134.71L34.406 145.122V137.548L35.8982 130.26L37.1871 126.049L38.6578 134.71L40.659 138.977V130.26V126.049L43.7557 130.26V123.822L45.972 112.407L47.3391 103.407V92.4726L49.2133 98.4651V106.053L52.5797 89.7556L54.4559 82.7747L56.1181 87.9656L58.9383 89.7556V98.4651L60.7617 103.407L62.0545 123.822L63.8789 118.066L65.631 122.082L68.5479 114.229L70.299 109.729L71.8899 118.066L73.5785 123.822V130.26L74.9446 134.861L76.9243 127.87L78.352 134.71V138.977L80.0787 142.407V152.613L83.0415 142.407V130.26L86.791 123.822L89.0121 116.645V122.082L90.6059 127.87L92.3541 131.77L93.7104 123.822L95.4635 118.066L96.7553 122.082V137.548L99.7094 140.988V131.77L101.711 120.525L103.036 116.645V133.348L104.893 136.218L106.951 140.988L108.933 134.71L110.797 130.26L112.856 140.988V148.111L115.711 152.613L117.941 145.122L119.999 140.988L121.501 148.111L123.4 152.613L125.401 158.182L127.992 152.613L131.578 146.76V155.455L134.143 158.182L135.818 164.629L138.329 158.182L140.612 160.829L144.117 166.757L146.118 155.455L147.823 149.804L151.02 152.613L154.886 145.122L158.496 140.988V133.348L161.295 127.87V122.082L162.855 116.645V109.729L164.83 103.407L166.894 109.729L176.249 98.4651L178.254 106.169L180.77 98.4651V81.045L182.906 69.1641L184.8 56.8669L186.477 62.8428L187.848 79.7483L188.849 106.169L191.351 79.7483L193.485 75.645V98.4651L196.622 94.4523L198.623 87.4228V79.7483L200.717 75.645L202.276 81.045V89.3966L203.638 113.023L205.334 99.8037L207.164 94.4523L208.982 98.4651V102.176L211.267 107.64L212.788 81.045L214.437 66.0083L216.19 62.8428L217.941 56.8669V73.676V79.7483L220.28 75.645L222.516 66.0083V73.676H226.174V84.8662L228.566 98.4651L230.316 75.645L233.61 94.4523V104.25L236.882 102.176L239.543 113.023L241.057 98.4651L243.604 94.4523L244.975 106.169L245.975 87.4228L247.272 89.3966L250.732 84.8662L251.733 96.7549L254.644 94.4523L257.452 99.8037L259.853 91.3111L261.193 84.8662L264.162 75.645L265.808 87.4228L267.247 58.4895L269.757 66.0083L276.625 13.5146L273.33 58.4895L276.25 67.6563L282.377 20.1968L281.37 58.4895V66.0083L283.579 75.645L286.033 56.8669L287.436 73.676L290.628 77.6636L292.414 84.8662L294.214 61.3904L296.215 18.9623L300.826 0.947876L297.531 56.8669L299.973 62.8428L305.548 22.0598L299.755 114.956L301.907 105.378L304.192 112.688V94.9932L308.009 80.0829L310.003 94.9932L311.004 102.127L312.386 105.378L315.007 112.688L316.853 98.004L318.895 105.378L321.257 94.9932L324.349 100.81L325.032 80.0829L327.604 61.5733L329.357 74.9864L332.611 52.6565L334.352 48.5552L335.785 55.2637L338.377 59.5888V73.426L341.699 87.5181L343.843 93.4347L347.714 82.1171L350.229 78.6821L351.974 89.7556L353.323 94.9932L355.821 93.4347L357.799 102.127L360.684 108.794L363.219 98.004L365 89.7556" stroke="currentColor" strokeWidth="2"/>
                                    <defs><linearGradient id="paint0_linear_0_705_light" x1="0.85108" y1="0.947876" x2="0.85108" y2="230.114" gradientUnits="userSpaceOnUse"><stop className="text-[#2d74d7]/15" stopColor="currentColor"/><stop className="text-transparent" offset="1" stopColor="currentColor" stopOpacity="0.01"/></linearGradient></defs>
                                </svg>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="relative col-span-full overflow-hidden lg:col-span-3">
                        <CardContent className="grid h-full pt-6 sm:grid-cols-2">
                             <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border border-black/10 before:border-black/5">
                                    <Users className="m-auto size-6 text-muted-foreground" strokeWidth={1.5} />
                                </div>
                                <div className="space-y-2">
                                     <h2 className="text-lg font-medium text-foreground">Ready To Integrate anywhere</h2>
                                    <p className="text-muted-foreground text-sm">Seamlessly connect with your favorite tools and platforms.</p>
                                </div>
                            </div>
                           <div className="relative -my-6 -mr-6 mt-6 before:absolute before:inset-0 before:mx-auto before:w-px sm:-my-6 sm:-mr-6 border-l border-black/10">
                                 <div className="relative flex h-full flex-col justify-center space-y-6 py-6">
                                     <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                                         <span className="block h-fit rounded border border-black/10 px-2 py-1 text-xs shadow-sm bg-card">Likeur</span>
                                         <div className="ring-background size-7 ring-4 ring-white">
                                             <img className="size-full rounded-full" src="https://avatars.githubusercontent.com/u/102558960?v=4" alt="User avatar" />
                                        </div>
                                    </div>
                                     <div className="relative ml-[calc(50%-1rem)] flex items-center gap-2">
                                         <div className="ring-background size-8 ring-4 ring-white">
                                             <img className="size-full rounded-full" src="https://avatars.githubusercontent.com/u/47919550?v=4" alt="User avatar" />
                                        </div>
                                         <span className="block h-fit rounded border border-black/10 px-2 py-1 text-xs shadow-sm bg-card">M. Irung</span>
                                    </div>
                                     <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                                         <span className="block h-fit rounded border border-black/10 px-2 py-1 text-xs shadow-sm bg-card">B. Ng</span>
                                         <div className="ring-background size-7 ring-4 ring-white">
                                             <img className="size-full rounded-full" src="https://avatars.githubusercontent.com/u/31113941?v=4" alt="User avatar" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </section>
);

// Timeline Section Component
const TimelineSection = () => {
    const timelineContentRef = useRef(null);
    const animatedLineRef = useRef(null);
    const lineContainerRef = useRef(null);
    
    useEffect(() => {
        const timelineContent = timelineContentRef.current;
        const animatedLine = animatedLineRef.current;
        const lineContainer = lineContainerRef.current;
        
        if (!timelineContent || !animatedLine || !lineContainer) return;

        const setLineContainerHeight = () => {
            if (timelineContent.offsetHeight > 0) {
                 const timelineHeight = timelineContent.offsetHeight;
                 lineContainer.style.height = `${timelineHeight}px`;
            }
        };

        const handleScroll = () => {
            const rect = timelineContent.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            const startOffset = viewportHeight * 0.1;
            const endOffset = viewportHeight * 0.5;
            
            const start = rect.top - startOffset;
            const end = rect.bottom - endOffset;

            let progress = 0;
            if (start < 0 && end > 0) {
                progress = -start / (end - start);
            } else if (start >= 0) {
                progress = 0;
            } else {
                progress = 1;
            }
            progress = Math.max(0, Math.min(1, progress));

            const height = progress * timelineContent.offsetHeight;
            animatedLine.style.height = `${height}px`;

            let opacity = 0;
            if (progress > 0 && progress <= 0.1) {
                opacity = progress * 10;
            } else if (progress > 0.1) {
                opacity = 1;
            }
            animatedLine.style.opacity = opacity;
        };
        
        // Initial setup
        setTimeout(() => {
            setLineContainerHeight();
            handleScroll();
        }, 100);

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', setLineContainerHeight);
        

        // Use ResizeObserver for more robust height updates
        const resizeObserver = new ResizeObserver(setLineContainerHeight);
        resizeObserver.observe(timelineContent);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', setLineContainerHeight);
            resizeObserver.unobserve(timelineContent);
        };
    }, []);

    return (
        <section id="timeline" className="bg-[#eff5fb] py-24 sm:py-32">
            <div className="w-full md:px-10">
                <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10 text-center">
                    <h2 className="text-3xl md:text-4xl mb-4 font-bold text-[#0b131e]">
                        Get Started in Minutes
                    </h2>
                    <p className="text-[#0b131e]/80 text-lg max-w-2xl mx-auto">
                        Follow our simple four-step process to build and deploy your custom AI chatbot.
                    </p>
                </div>

                <div id="timeline-content" ref={timelineContentRef} className="relative max-w-7xl mx-auto pb-20 mt-16">
                    {/* Timeline Item 1 */}
                    <div className="flex justify-start pt-10 md:pt-40 md:gap-10">
                        <div className="sticky flex flex-col md:flex-row z-10 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                            <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-[#eff5fb] flex items-center justify-center">
                                <div className="h-4 w-4 rounded-full bg-[#0b131e]/10 border border-[#0b131e]/20 p-2"></div>
                            </div>
                             <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-[#0b131e]/50">
                                Step 1
                            </h3>
                        </div>
                        <div className="relative pl-20 pr-4 md:pl-4 w-full">
                             <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-[#0b131e]/50">
                                Step 1
                            </h3>
                            <div>
                                <h4 className="text-2xl font-bold text-[#0b131e] mb-4">Upload Your Documents</h4>
                                <p className="mb-8 text-sm font-normal text-[#0b131e] md:text-base">
                                  Instantly teach your chatbot by uploading your existing documentation, PDFs, or website content. Our platform processes your data to create a comprehensive knowledge base.
                                </p>
                                <img src="public/upload.png" alt="Document Upload UI" width="500" height="500" className="w-full rounded-lg object-cover shadow-md" />
                            </div>
                        </div>
                    </div>
                    {/* Timeline Item 2 */}
                    <div className="flex justify-start pt-10 md:pt-40 md:gap-10">
                        <div className="sticky flex flex-col md:flex-row z-10 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                             <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-[#eff5fb] flex items-center justify-center">
                                <div className="h-4 w-4 rounded-full bg-[#0b131e]/10 border border-[#0b131e]/20 p-2"></div>
                            </div>
                             <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-[#0b131e]/50">
                                Step 2
                            </h3>
                        </div>
                         <div className="relative pl-20 pr-4 md:pl-4 w-full">
                             <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-[#0b131e]/50">
                                Step 2
                            </h3>
                           <div>
                                <h4 className="text-2xl font-bold text-[#0b131e] mb-4">Test on the Playground</h4>
                                <p className="mb-8 text-sm font-normal text-[#0b131e] md:text-base">
                                   Interact with your chatbot in our real-time playground. Refine its responses, test different scenarios, and ensure it meets your standards before going live.
                                </p>
                                <img src="public/playground.png" alt="Chatbot testing playground" width="500" height="500" className="w-full rounded-lg object-cover shadow-md" />
                            </div>
                        </div>
                    </div>
                     {/* Timeline Item 3 */}
                    <div className="flex justify-start pt-10 md:pt-40 md:gap-10">
                         <div className="sticky flex flex-col md:flex-row z-10 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                             <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-[#eff5fb] flex items-center justify-center">
                                <div className="h-4 w-4 rounded-full bg-[#0b131e]/10 border border-[#0b131e]/20 p-2"></div>
                            </div>
                             <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-[#0b131e]/50">
                                Step 3
                            </h3>
                        </div>
                         <div className="relative pl-20 pr-4 md:pl-4 w-full">
                             <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-[#0b131e]/50">
                                Step 3
                            </h3>
                            <div>
                                <h4 className="text-2xl font-bold text-[#0b131e] mb-4">Deploy with API</h4>
                                <p className="mb-8 text-sm font-normal text-[#0b131e] md:text-base">
                                    Integrate your fully-trained chatbot into any application using our simple and powerful REST API. Copy and paste a few lines of code to deploy it anywhere.
                                </p>
                                <img src="public/api.png" alt="API Integration" width="500" height="500" className="w-full rounded-lg object-cover shadow-md" />
                            </div>
                        </div>
                    </div>
                    {/* Timeline Item 4 */}
                    <div className="flex justify-start pt-10 md:pt-40 md:gap-10">
                         <div className="sticky flex flex-col md:flex-row z-10 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                             <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-[#eff5fb] flex items-center justify-center">
                                <div className="h-4 w-4 rounded-full bg-[#0b131e]/10 border border-[#0b131e]/20 p-2"></div>
                            </div>
                             <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-[#0b131e]/50">
                                Step 4
                            </h3>
                        </div>
                         <div className="relative pl-20 pr-4 md:pl-4 w-full">
                             <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-[#0b131e]/50">
                                Step 4
                            </h3>
                            <div>
                                <h4 className="text-2xl font-bold text-[#0b131e] mb-4">View Analytics</h4>
                                <p className="mb-8 text-sm font-normal text-[#0b131e] md:text-base">
                                    Track your chatbot's performance through our analytics dashboard. Gain insights into user interactions, popular queries, and overall effectiveness to continuously improve.
                                </p>
                                <img src="public/dashboard.png" alt="Analytics Dashboard" width="500" height="500" className="w-full rounded-lg object-cover shadow-md" />
                            </div>
                        </div>
                    </div>
                    <div id="timeline-line-container" ref={lineContainerRef} className="absolute md:left-8 left-8 top-0 h-full overflow-hidden w-[2px] bg-gradient-to-b from-transparent via-[#0b131e]/10 to-transparent" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
                        <div id="timeline-animated-line" ref={animatedLineRef} className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-[#2d74d7] via-[#4e93f4] to-transparent rounded-full" style={{ height: '0px', opacity: 0 }}></div>
                    </div>
                </div>
            </div>
        </section>
    );
};


// --- NEW API SECTION COMPONENTS ---

// Simplified Button component
const Button = ({ className, variant, size, ...props }) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";
    const variantClasses = {
        ghost: "hover:bg-[#0b131e]/5 hover:text-accent-foreground",
    };
    const sizeClasses = {
        icon: "h-8 w-8",
    };

    const classes = cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
    );
    return <button className={classes} {...props} />;
};


// Simplified CodeBlock components
const CodeBlock = ({ children, className, ...props }) => (
    <div className={cn("not-prose flex w-full flex-col overflow-clip border border-[#0b131e]/10 rounded-xl bg-white shadow-sm", className)} {...props}>
        {children}
    </div>
);

const CodeBlockGroup = ({ children, className, ...props }) => (
    <div className={cn("flex items-center justify-between", className)} {...props}>
        {children}
    </div>
);

// Custom syntax highlighter to avoid Shiki dependency
const highlightJson = (jsonString) => {
    return jsonString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'token-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'token-property';
            } else {
                cls = 'token-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'token-boolean';
        } else if (/null/.test(match)) {
            cls = 'token-null';
        }
        return `<span class="${cls}">${match}</span>`;
    }).replace(/(\{|\}|\[|\]|,|:)/g, '<span class="token-punctuation">$1</span>');
};

const CodeBlockCode = ({ code, header, ...props }) => {
    const formattedCode = header ? `${header}\n${code}` : code;
    
    const commentRegex = /(#.*)/g;
    const jsonRegex = /\{[\s\S]*\}/;

    const parts = formattedCode.split(jsonRegex);
    const jsonPart = formattedCode.match(jsonRegex);

    const html = (
        <pre className="shiki-code">
            <code>
                {parts[0] && <span className="token-comment">{parts[0].trim()}</span>}
                {jsonPart && <div dangerouslySetInnerHTML={{ __html: highlightJson(jsonPart[0]) }} />}
                {parts[1] && <span className="token-comment">{parts[1].trim()}</span>}
            </code>
        </pre>
    );

    return (
        <div className="w-full overflow-x-auto text-[13px] p-4" {...props}>
            {html}
        </div>
    );
};


// Main API Section Component
const ApiSection = () => {
    const [reqCopied, setReqCopied] = useState(false);
    const [resCopied, setResCopied] = useState(false);

    const requestHeader = "# Authorization: Bearer sk-proj-2073...";
    const requestBody = JSON.stringify({
      "question": "What is best resource to learn ML",
      "history": []
    }, null, 2);

    const responseBody = JSON.stringify({
        "answer": "Oh, look who's trying to learn ML! That's adorable. If you want the best resource, try reading \"How to Stop Being a Complete Idiot\"—it’s a bestseller. But for real, hit up online courses like Coursera or edX. Just make sure you don’t confuse machine learning with your dating life; they both require a lot of training, but only one will actually get you results. Good luck, genius!",
        "projectId": "68d0467187dc45cbdec9717b",
        "projectName": "insulting"
    }, null, 2);

    const handleCopy = (text, type) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            if (type === 'req') {
                setReqCopied(true);
                setTimeout(() => setReqCopied(false), 2000);
            } else {
                setResCopied(true);
                setTimeout(() => setResCopied(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textarea);
    };

    return (
        <section className="bg-white py-24 sm:py-32">
            <div className="container mx-auto px-6 flex flex-col items-center">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0b131e] mb-4">Integrate with our Powerful API</h2>
                    <p className="text-[#0b131e]/80 text-lg">GPTStudio offers a simple yet powerful API to bring your custom chatbots into any application.</p>
                </div>

                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Request Block */}
                    <CodeBlock>
                        <CodeBlockGroup className="border-b border-[#0b131e]/10 py-2 pr-2 pl-4">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">Request</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(`${requestHeader}\n${requestBody}`, 'req')}>
                                {reqCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </CodeBlockGroup>
                        <CodeBlockCode code={requestBody} header={requestHeader} />
                    </CodeBlock>

                    {/* Response Block */}
                    <CodeBlock>
                        <CodeBlockGroup className="border-b border-[#0b131e]/10 py-2 pr-2 pl-4">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">Response</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(responseBody, 'res')}>
                                {resCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </CodeBlockGroup>
                        <CodeBlockCode code={responseBody} />
                    </CodeBlock>
                </div>
            </div>
        </section>
    );
};


// CTA Section Component
const CtaSection = () => {
    const navigate = useNavigate();

    return (
        <section className="overflow-hidden py-24 bg-[#eff5fb]">
            <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-8 py-12 text-center sm:gap-8 md:py-24">
                <div className="inline-flex items-center rounded-full border border-[#0b131e]/10 px-2.5 py-0.5 text-xs font-semibold opacity-0 animate-fade-in-up delay-100">
                    <span className="text-[#0b131e]/80">Start Building Now</span>
                </div>
                <h2 className="text-3xl font-semibold sm:text-5xl opacity-0 animate-fade-in-up delay-200 text-[#0b131e]">
                    Ready to Transform Your Customer Engagement?
                </h2>
                <p className="text-[#0b131e]/80 opacity-0 animate-fade-in-up delay-300 max-w-2xl mx-auto text-lg">
                    Join hundreds of businesses revolutionizing their support and sales with custom AI chatbots. Start your free trial today, no credit card required.
                </p>

                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/signin');
                    }}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-lg font-medium h-11 px-8 bg-[#0b131e] text-[#eff5fb] hover:bg-[#0b131e]/90 opacity-0 animate-fade-in-up delay-500"
                >
                    Build Your Chatbot Now
                </button>

                <div className="fade-top-lg pointer-events-none absolute inset-0 rounded-2xl shadow-glow opacity-0 animate-scale-in delay-700"></div>
            </div>
        </section>
    );
};


// Main Component
export function LandingPage() { // 4. Changed export name
  const navigate = useNavigate(); // 5. Get the navigate function

  // 6. Define the handler to navigate to the app's login/dashboard
  const handleSignInClick = () => {
    navigate('/signin');
  };

  return (
    <>
      <PageStyles />
      <div className="antialiased relative">
        <div className="absolute top-0 z-[-1] h-screen w-screen bg-[#eff5fb] bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
        <Navigation onSignInClick={handleSignInClick} /> {/* 7. Pass handler to Navigation */}
        <main>
            <HeroSection />
            <LogosSection />
            <FeaturesSection />
            <TimelineSection />
            <ApiSection />
            <CtaSection />
        </main>
      </div>
    </>
  );
}