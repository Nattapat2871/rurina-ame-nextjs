"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import "./landing.css"; 

// --- CONFIGURATION ---
const IMAGE_URLS = [
  "/asset/1.png", "/asset/2.png", "/asset/3.png", "/asset/4.png", 
  "/asset/5.png", "/asset/6.png", "/asset/7.png", "/asset/8.png"
];

const TRANSLATIONS: any = {
    'EN': {
        'nav_home': 'Home', 'nav_status': 'Status', 'nav_dashboard': 'Dashboard', 'nav_contact': 'Contact',
        'lang_en': 'English', 'lang_th': 'ภาษาไทย',
        // 🔥 แก้ไข: ตัดคำว่า AmeBot ออก เพื่อใช้ตัวแปรแทน
        'hero_title_prefix': 'Hello! This is', 
        'hero_description': 'My full name is Rurina Ame. I am your AI assistant, responsible for managing the server system and keeping all users safe. Let\'s meet!',
        'hero_button': 'Contact our developers', 'hero_join_discord': 'Join Discord Server', 'hero_invite_bot': 'Invite Bot',
        'about_title': 'About Me',
        'about_description': 'Hello! I am Rurina Ame, an intelligent AI assistant created to be more than just an ordinary bot. My core is powered by Google Gemini 2.0 flash lite technology, giving me diverse capabilities and making me ready to be both an assistant and a friend to everyone.\n\nKey Features:\n• Welcome-Leave System\n• Anti-Spam System\n• Server Log System\n• Weather Forecast\n• Image Search\n• Text To Speech\n• World Chat',
        'bot': 'Bot', 'statistics': 'Statistics', 'developers': 'Developers', 'api': 'API',
        'api_description': 'This API is used to fetch user data from Discord, capable of retrieving all available information.',
        'our_bots': 'Our Bots'
    },
    'TH': {
        'nav_home': 'หน้าหลัก', 'nav_status': 'สถานะ', 'nav_dashboard': 'แดชบอร์ด', 'nav_contact': 'ติดต่อ',
        'lang_en': 'English', 'lang_th': 'ภาษาไทย',
        // 🔥 แก้ไข: ตัดคำว่า AmeBot ออก เพื่อใช้ตัวแปรแทน
        'hero_title_prefix': 'สวัสดี! นี่คือ',
        'hero_description': 'ชื่อเต็มหนูคือ Rurina Ame หนูเป็น AI ผู้ช่วยของคุณ มีหน้าที่ดูแลระบบเซิร์ฟเวอร์ จัดการผู้ใช้ทุกคนให้ปลอดภัย แล้วมาเจอกันนะ!',
        'hero_button': 'ติดต่อผู้พัฒนาของเรา', 'hero_join_discord': 'เข้าร่วม Discord Server', 'hero_invite_bot': 'เชิญบอท',
        'about_title': 'เกี่ยวกับฉัน',
        'about_description': 'สวัสดีค่ะ หนูคือ Rurina Ame ผู้ช่วย AI อัจฉริยะที่ถูกสร้างขึ้นมาเพื่อเป็นมากกว่าแค่บอทธรรมดา หัวใจหลักของหนูขับเคลื่อนด้วยเทคโนโลยี Google Gemini 2.0 flash lite ทำให้หนูมีความสามารถที่หลากหลายและพร้อมจะเป็นทั้งผู้ช่วยและเพื่อนคุยให้กับทุกคนค่ะ\n\nความสามารถเด่น:\n• ระบบต้อนรับ-อำลา\n• ระบบป้องกันสแปม\n• ระบบบันทึก Log\n• สภาพอากาศ\n• ค้นหารูปภาพ\n• อ่านข้อความเป็นเสียง\n• แชทโลก',
        'bot': 'บอท', 'statistics': 'สถิติ', 'developers': 'ผู้พัฒนา', 'api': 'API',
        'api_description': 'API นี้ใช้สำหรับดึงข้อมูลผู้ใช้ใน Discord สามารถดึงข้อมูลได้ทุกอย่าง',
        'our_bots': 'บอทของเรา'
    }
};

const BOT_API_ENDPOINTS = [
    { apiUrl: 'https://ame-api.nattapat2871.me/v1/user/1141443585737244682', role: 'Main Bot & AI', description: 'The main bot responsible for server management and core functionalities.' },
    { apiUrl: 'https://ame-api.nattapat2871.me/v1/user/1141441060044816405', role: 'API Bot' },
    { apiUrl: 'https://ame-api.nattapat2871.me/v1/user/1456946547001655317', role: 'Music Bot', description: 'Dedicated to providing high-quality music streams 24/7.' }
];

const DEV_API_ENDPOINTS = [
    { apiUrl: 'https://ame-api.nattapat2871.me/v1/user/1007237437627572275', role: 'Lead Developer & Founder' },
    { apiUrl: 'https://ame-api.nattapat2871.me/v1/user/741501421936967722', role: 'Consultant' }
];

export default function LandingPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [lang, setLang] = useState('EN');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Dropdown States
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    
    const [activeTab, setActiveTab] = useState('statistics');
    
    // Data States
    const [bots, setBots] = useState<any[]>([]);
    const [devs, setDevs] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    
    // Login & Bot Info State
    const [user, setUser] = useState<any>(null);
    const [mainBotAvatar, setMainBotAvatar] = useState("/asset/amebot.png");
    // 🔥 เพิ่ม State ชื่อบอท
    const [botName, setBotName] = useState("AmeBot"); 
    
    // API Tester States
    const [apiInput, setApiInput] = useState("");
    const [apiResult, setApiResult] = useState<any>(null);
    const [apiJson, setApiJson] = useState('{ "message": "Enter a User ID to start." }');
    const [isApiLoading, setIsApiLoading] = useState(false);

    // Wallpaper Logic
    const [currentBgIndex, setCurrentBgIndex] = useState(0);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const t = (key: string) => TRANSLATIONS[lang][key] || key;

    const fetchProfiles = async (endpoints: any[]) => {
        const promises = endpoints.map(ep => fetch(ep.apiUrl).then(r => r.ok ? r.json() : null).then(d => d ? { ...d, ...ep } : null));
        const results = await Promise.all(promises);
        return results.filter(r => r !== null);
    };

    const handleApiTest = async (id: string) => {
        if (!id || id.length < 17) {
            setApiJson('{ "message": "Please enter a valid Discord User ID." }');
            return;
        }
        setIsApiLoading(true);
        setApiJson("Fetching data...");
        try {
            const res = await fetch(`https://ame-api.nattapat2871.me/v1/user/${id}`);
            const data = await res.json();
            if (!res.ok) throw data;
            setApiResult(data);
            setApiJson(JSON.stringify(data, null, 2));
        } catch (e) {
            setApiResult(null);
            setApiJson(JSON.stringify(e, null, 2));
        } finally {
            setIsApiLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        
        fetchProfiles(BOT_API_ENDPOINTS).then(setBots);
        fetchProfiles(DEV_API_ENDPOINTS).then(setDevs);
        
        // 🔥 ดึงข้อมูลบอท (ชื่อ + รูป) จาก API เราเอง
        fetch(`${API_URL}/api/guilds/bot-info`)
            .then(res => res.json())
            .then(data => {
                if (data.avatar) setMainBotAvatar(data.avatar);
                if (data.name) setBotName(data.name); // ✅ อัปเดตชื่อบอท
            })
            .catch(console.error);

        // ดึง Stats
        Promise.all([
            fetch('https://rurina-ame-bot.nattapat2871.me/api/advance/system/').catch(() => null),
            fetch('https://ame-api.nattapat2871.me/stats').catch(() => null)
        ]).then(async ([sysRes, apiRes]) => {
            const sysData = sysRes ? await sysRes.json() : {};
            const apiData = apiRes ? await apiRes.json() : {};
            setStats({
                servers: sysData.bot_info?.server_count || '...',
                users: sysData.bot_info?.user_count || '...',
                interactions: sysData.ai_stats?.total_interactions || '...',
                tokens: sysData.ai_stats?.estimated_tokens_processed ? `(${Math.round(sysData.ai_stats.estimated_tokens_processed).toLocaleString()} Tokens)` : '',
                requests: apiData['Ame API']?.api_usage?.total_requests || '...'
            });
        });

        // Check Login
        fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
            .then(res => { if(res.ok) return res.json(); throw new Error('Not logged in'); })
            .then(data => {
                if (data && data.id) setUser(data);
                else setUser(null);
            })
            .catch(() => setUser(null));

        const bgInterval = setInterval(() => {
            setCurrentBgIndex(prev => (prev + 1) % IMAGE_URLS.length);
        }, 7000);

        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang && TRANSLATIONS[savedLang]) setLang(savedLang);

        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.language-switcher')) setIsLangDropdownOpen(false);
            if (!(event.target as Element).closest('.user-menu-container')) setIsUserMenuOpen(false);
        };
        document.addEventListener('click', handleClickOutside);

        return () => { 
            clearTimeout(timer); 
            clearInterval(bgInterval);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [API_URL]);

    return (
        <div className="landing-page-wrapper">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css" />

            <div className={`preloader ${!isLoading ? 'preloader--hidden' : ''}`}>
                <div className="preloader-content">
                    <img src="/asset/loading.gif" alt="Loading" />
                    <p>Loading...</p>
                </div>
            </div>

            <nav className="landing-navbar">
                <div className="nav-left">
                    <Link href="/" className="brand">
                        <img src={mainBotAvatar} alt="Logo" className="brand-icon" />
                        {/* 🔥 ใช้ชื่อบอทจาก API */}
                        <span>{botName}</span>
                    </Link>
                </div>
                <div className="nav-center">
                    <ul className="nav-links">
                        <li><a href="/"><i className="fa-solid fa-house-chimney"></i><span>{t('nav_home')}</span></a></li>
                        <li><a href="https://status.nattapat2871.me"><i className="fa-solid fa-bolt-lightning"></i><span>{t('nav_status')}</span></a></li>
                        
                        {user && (
                            <li>
                                <a href="/dashboard" className="">
                                    <i className="fa-solid fa-gauge-high"></i>
                                    <span>{t('nav_dashboard')}</span>
                                </a>
                            </li>
                        )}
                        
                        <li><a href="/" className="nav-link-disabled"><i className="fa-solid fa-envelope"></i><span>{t('nav_contact')}</span></a></li>
                    </ul>
                </div>
                <div className="nav-right">
                    
                    {user ? (
                        <div className={`user-menu-container ${isUserMenuOpen ? 'open' : ''}`}>
                            <button 
                                className="nav-login-btn" 
                                onClick={(e) => { e.stopPropagation(); setIsUserMenuOpen(!isUserMenuOpen); }}
                            >
                                <img 
                                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} 
                                    className="nav-user-avatar" 
                                    alt="User"
                                    onError={(e) => e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png"}
                                />
                                <span className="max-w-[100px] truncate">{user.username}</span>
                                <i className={`fas fa-caret-down transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`}></i>
                            </button>
                            
                            <div className="user-menu-dropdown">
                                <Link href="/dashboard" className="user-menu-item">
                                    <i className="fa-solid fa-gauge-high"></i> Dashboard
                                </Link>
                                <a href={`${API_URL}/api/auth/logout`} className="user-menu-item logout">
                                    <i className="fa-solid fa-right-from-bracket"></i> Logout
                                </a>
                            </div>
                        </div>
                    ) : (
                        <a href={`${API_URL}/api/auth/login`} className="nav-login-btn">
                            <i className="fa-brands fa-discord"></i>
                            <span>Login</span>
                        </a>
                    )}

                    <div className={`language-switcher ${isLangDropdownOpen ? 'open' : ''}`}>
                        <button className="lang-button" onClick={(e) => { e.stopPropagation(); setIsLangDropdownOpen(!isLangDropdownOpen); }}>
                            <img src={lang === 'EN' ? "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/7.2.1/flags/4x3/us.svg" : "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/7.2.1/flags/4x3/th.svg"} className="flag-icon" />
                            <span>{lang}</span>
                            <i className="fas fa-caret-down"></i>
                        </button>
                        <div className="lang-dropdown">
                            <div className="lang-option" onClick={() => { setLang('EN'); setIsLangDropdownOpen(false); localStorage.setItem('preferredLanguage', 'EN'); }}>
                                <img src="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/7.2.1/flags/4x3/us.svg" className="flag-icon"/> English
                            </div>
                            <div className="lang-option" onClick={() => { setLang('TH'); setIsLangDropdownOpen(false); localStorage.setItem('preferredLanguage', 'TH'); }}>
                                <img src="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/7.2.1/flags/4x3/th.svg" className="flag-icon"/> ภาษาไทย
                            </div>
                        </div>
                    </div>
                    <button className="hamburger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><i className="fas fa-bars"></i></button>
                </div>
            </nav>

            <div className={`mobile-nav-links ${isMobileMenuOpen ? 'show' : ''}`}>
                <a href="/">{t('nav_home')}</a>
                {user && <a href="/dashboard">{t('nav_dashboard')}</a>}
                <a href={user ? "/dashboard" : `${API_URL}/api/auth/login`}>{user ? "Dashboard" : "Login"}</a>
            </div>
            <div className={`overlay ${isMobileMenuOpen ? 'show' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>

            <section className="wallpaper-section">
                {IMAGE_URLS.map((url, index) => (
                    <div key={url} className="wallpaper-bg" style={{ backgroundImage: `url('${url}')`, opacity: currentBgIndex === index ? 1 : 0 }}></div>
                ))}
                <div className="wallpaper-overlay"></div>
                <div className="wallpaper-content">
                    <div className="wallpaper-text">
                        {/* 🔥 ใช้ Prefix จาก Translation + ชื่อบอทจริง */}
                        <h1>{t('hero_title_prefix')} <span className="text-[#38bdf8]">{botName}</span></h1>
                        <p>{t('hero_description')}</p>
                        <div className="hero-buttons">
                            <a href="" className="cta-button"><i className="fa-solid fa-users"></i> {t('hero_button')}</a>
                            <a href="https://discord.gg/pC64QHK2mz" target="_blank" className="cta-button secondary-cta"><i className="fa-brands fa-discord"></i> {t('hero_join_discord')}</a>
                        </div>
                    </div>
                    <div className="wallpaper-image">
                        <img src={mainBotAvatar} alt="Bot" />
                        <a href="/invite" target="_blank" className="invite-button"><i className="fa-solid fa-plus"></i> {t('hero_invite_bot')}</a>
                    </div>
                </div>
            </section>

            <section className="about">
                <h1>{t('about_title')}</h1>
                <h3 style={{ whiteSpace: 'pre-line' }}>{t('about_description')}</h3>
            </section>

            <div className="secondary-nav">
                <ul className="secondary-nav-links">
                    {['statistics', 'bots', 'developers', 'api'].map(tab => (
                        <li key={tab}>
                            <a className={`secondary-nav-link ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                                <span>{t(tab)}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="content-wrapper">
                {/* ... (ส่วน Content เหมือนเดิม) ... */}
                <section className={`content-section ${activeTab === 'statistics' ? 'is-active' : ''}`} id="statistics">
                    <h2 className="section-title">{t('statistics')}</h2>
                    <div className="profile-cards-container">
                        <div className="stat-card"><i className="fa-solid fa-server stat-icon"></i><h3 className="stat-number">{stats.servers}</h3><p className="stat-title">Servers</p></div>
                        <div className="stat-card"><i className="fa-solid fa-users stat-icon"></i><h3 className="stat-number">{stats.users}</h3><p className="stat-title">Users</p></div>
                        <div className="stat-card"><i className="fa-solid fa-brain stat-icon"></i><h3 className="stat-number">{stats.interactions}</h3><p className="stat-title">AI Interactions</p><span className="stat-subtitle">{stats.tokens}</span></div>
                        <div className="stat-card"><i className="fa-solid fa-satellite-dish stat-icon"></i><h3 className="stat-number">{stats.requests}</h3><p className="stat-title">API Requests</p></div>
                    </div>
                </section>

                <section className={`content-section ${activeTab === 'bots' ? 'is-active' : ''}`} id="bots">
                    <h2 className="section-title">{t('our_bots')}</h2>
                    <div className="profile-cards-container">
                        {bots.map((data: any, idx) => (
                            <ProfileCard key={idx} data={data} type="bot" />
                        ))}
                    </div>
                </section>

                <section className={`content-section ${activeTab === 'developers' ? 'is-active' : ''}`} id="developers">
                    <h2 className="section-title">{t('developers')}</h2>
                    <div className="profile-cards-container">
                        {devs.map((data: any, idx) => (
                            <ProfileCard key={idx} data={data} type="dev" />
                        ))}
                    </div>
                </section>

                <section className={`content-section ${activeTab === 'api' ? 'is-active' : ''}`} id="api">
                    <h2 className="section-title">{t('api')}</h2>
                    <p className="section-description">{t('api_description')}</p>
                    <div className={`api-tester-container ${isApiLoading ? 'loading' : ''}`}>
                        <div className="api-tester-left">
                            <h3>Try It Yourself</h3>
                            <p className="api-tester-desc">Enter a Discord User ID below to fetch data.</p>
                            <input type="text" id="api-user-id-input" placeholder="Enter ID..." onChange={(e) => handleApiTest(e.target.value)} />
                            {apiResult && (
                                <div className="api-profile-card">
                                    <div className="api-profile-header">
                                        <div className="api-profile-avatar-wrapper">
                                            <img src={apiResult.ame.user.avatar ? `https://cdn.discordapp.com/avatars/${apiResult.ame.user.id}/${apiResult.ame.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} className="api-profile-avatar" />
                                            <div className={`status-indicator ${apiResult.ame.discord_status}`}></div>
                                        </div>
                                        <div className="api-profile-user-info">
                                            <span className="username">{apiResult.ame.user.username}</span>
                                            <div className="badges-container">
                                                {apiResult.ame.badges?.map((b: any, i:number) => <img key={i} src={`https://cdn.discordapp.com/badge-icons/${b.icon}.png`} className="badge-image" title={b.description}/>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="api-tester-right">
                            <pre><code className="language-json">{apiJson}</code></pre>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="site-footer">
                <div className="footer-content">
                    <div className="footer-copyright"><p>&copy; 2026 Nattapat2871. All Rights Reserved.</p></div>
                </div>
            </footer>
        </div>
    );
}

function ProfileCard({ data, type }: { data: any, type: string }) {
    const user = data.ame.user;
    const profile = data.ame;
    const avatar = user.avatar?.startsWith('a_') 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.gif?size=128` 
        : `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` || 'https://cdn.discordapp.com/embed/avatars/0.png';

    return (
        <div className="profile-card">
            <div className="profile-card-header">
                <div className="profile-avatar-wrapper">
                    <img src={avatar} alt="Avatar" className="profile-avatar" />
                </div>
                <div className="profile-info">
                    <div className="profile-name-line">
                        <h3 className="profile-name">{user.username}</h3>
                        {user.primary_guild?.tag && <div className="guild-tag">{user.primary_guild.tag}</div>}
                    </div>
                    <div className="badges-container">
                        {profile.badges?.map((b: any, i: number) => <img key={i} src={`https://cdn.discordapp.com/badge-icons/${b.icon}.png`} className="badge-image" title={b.description}/>)}
                    </div>
                    <span className="profile-role">{data.role}</span>
                </div>
            </div>
            <div className="profile-card-body">
                <div>
                   {type === 'bot' && data.description && <p>{data.description}</p>}
                </div>
                <div className="profile-status-wrapper">
                   <div className={`profile-status ${profile.discord_status}`}><span>{profile.discord_status}</span></div>
                </div>
            </div>
        </div>
    );
}