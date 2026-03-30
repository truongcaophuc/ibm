import { useState, useEffect, useRef } from 'react';
import ChatWidget from './components/ChatWidget';
import './App.css';

const testimonials = [
  { quote: "Bob demonstrated a level of intelligence and contextual understanding that goes beyond anything I've seen in other tools.", name: "Luis Fabricio de Llamas", role: "Sr. Java Developer, Act Digital", img: "/assets/luis-fabricio-C9N3tQC4.webp" },
  { quote: "The tool works very well and captures the modernization intent. Bob is the first tool of its kind to treat Java as a first-class citizen.", name: "Artur Skowronski", role: "Head of Java & Kotlin Engineering, VirtusLab", img: "/assets/artur-skowronski-DX9QOoof.webp" },
  { quote: "IBM Bob isn't just another autocomplete tool. It is an AI-first development partner designed to transform the entire software lifecycle.", name: "Christina Adames", role: "AI Strategist, CDW", img: "/assets/christina-adames-DE0Wyw4n.webp" },
  { quote: "Early results are very promising: in under 15 minutes, I had a small FPS-style prototype up and running. That combination of speed and explainability is exactly what I'm looking for.", name: "Reshad Moussa", role: "Director of Product Development, Supplier Shield", img: "/assets/reshad-moussa-CD_50tb-.webp" },
  { quote: "Project Bob sounds so wonderfully innocent but it is incredibly powerful. 3 prompts. That's all it took to build a production-ready MCP server.", name: "Wesley Wienen", role: "Technical Presale Engineer, Appsys ICT Group", img: "/assets/wesley-wienen-BVETBvDR.webp" },
  { quote: "Bob has built-in guardrails. It operates in different modes, allowing you to approve suggestions before changes are made. This controlled behavior is crucial for enterprise development.", name: "Steve Cast", role: "Practice Director, Fresche Solutions", img: "/assets/steve-cast-Cx-kpfG0.webp" },
  { quote: "Once the demonstration concept emerged, I saw the potential for a fully functional mockup. We quickly had two core features implemented just by outlining the requirements.", name: "Shigehiro Mouri", role: "General Manager, System Research", img: "/assets/shigehiro-mouri-C2RupuHP.webp" },
  { quote: "Project Bob isn't just another AI assistant. It's an agentic AI development partner built for large organizations tackling complex challenges.", name: "Hans Boef", role: "Manager Technical Consultants, Novadoc", img: "/assets/hans-boef-CawkiFJl.webp" },
];

const features = [
  { icon: "\u2699", title: "Build with Agentic Modes", desc: "Modes help define my purpose and assign a role for me to fill. Choose how you'd like me to contribute, and I'll grab the right tool from my belt. Need something more specialized? Create custom modes that align with your unique requirements.", media: { type: 'img' as const, src: "/assets/BuildWithAgentic-Dr_myMBw.png" } },
  { icon: "\u270E", title: "Develop in Your Favorite Human Language", desc: "With Literate Coding, forget context-switching between chat windows and your editor. Explain what you want in natural language and I will generate the implementation in context.", media: { type: 'video' as const, src: "/media/videos/bobweb_home_dark_literate_coding.mp4" } },
  { icon: "\uD83D\uDD0D", title: "Get Real-Time Code Reviews", desc: "Bob scans your code as you work, catching complexity issues and refactoring opportunities before they become problems. Write great code faster without adding technical debt.", media: { type: 'video' as const, src: "/media/videos/bobweb_home_dark_code_review.mp4" } },
  { icon: "\u2318", title: "Use AI in Your Entire Pipeline", desc: "I'm not confined to your IDE. With Bob Shell, I bring the same powerful capabilities to your terminal. Work alongside me at every stage of development.", media: { type: 'video' as const, src: "/media/videos/bobweb_home_dark_bob_shell.mp4" } },
  { icon: "\u26A1", title: "Access IBM's Enterprise Ecosystem with Ease", desc: "Connect to HashiCorp, Red Hat, Instana, and more -- directly from your IDE. Bob eliminates context switching and delivers enterprise-grade architecture right where you code.", media: { type: 'img' as const, src: "/assets/AccessEnterpriseEcosystem-DF1gu_8g.png" } },
];

function ShowcaseItem({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`showcase-item ${visible ? 'visible' : ''} ${index % 2 === 1 ? 'reverse' : ''}`}>
      <div className="showcase-text">
        <div className="feature-icon">{feature.icon}</div>
        <h3>{feature.title}</h3>
        <p>{feature.desc}</p>
      </div>
      <div className="showcase-media">
        {feature.media.type === 'video' ? (
          <video autoPlay loop muted playsInline><source src={feature.media.src} type="video/mp4" /></video>
        ) : (
          <img src={feature.media.src} alt={feature.title} />
        )}
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <a href="#" className="nav-logo">
          <img src="/assets/BobAnimationPlaceholder-BWZj7W25.svg" alt="Bob" />
          <span>IBM <b>Bob</b></span>
        </a>
        <div className="nav-right">
          <div className="nav-links">
            <a href="#">Pricing</a>
            <a href="#">Docs</a>
            <a href="#" className="external">Enterprise</a>
          </div>
          <button className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '\u2606' : '\u263E'}
          </button>
          <a href="#" className="btn-download-nav">Download</a>
          <button className="btn-login">Login</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-illustration">
          <img src="/assets/HeroBackground-DOxbEQcI.png" alt="Hero Background" className="hero-illustration-light" />
          <img src="/assets/HeroBackground-fv4jwfmI.png" alt="Hero Background" className="hero-illustration-dark" />
        </div>
        <div className="hero-content">
          <h1>Welcome to IBM Bob:<br />Your AI-Powered Development Partner</h1>
          <p>Hi, I'm Bob! I'm here to work right alongside you in your codebase, and help you build quality software faster.</p>
          <div className="hero-buttons">
            <a href="#" className="btn-primary">Get free trial</a>
            <a href="#" className="btn-secondary">Download</a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="section-header"><h2>What I can build with you</h2></div>
        {features.map((f, i) => <ShowcaseItem key={i} feature={f} index={i} />)}
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials">
        <div className="testimonials-inner">
          <div className="section-header"><h2>What developers say</h2></div>
          <div className="testimonial-track-wrapper">
            <div className="testimonial-track">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="testimonial-card">
                  <blockquote>"{t.quote}"</blockquote>
                  <div className="testimonial-author">
                    <img className="testimonial-avatar" src={t.img} alt={t.name} />
                    <div className="testimonial-info">
                      <h4>{t.name}</h4>
                      <p>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to build with Bob?</h2>
        <p>Try IBM Bob free for 30 days with 40 Bobcoins.</p>
        <div className="hero-buttons">
          <a href="#" className="btn-primary">Get free trial</a>
          <a href="#" className="btn-secondary">View pricing</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">
          <img src="/assets/BobAnimationPlaceholder-BWZj7W25.svg" alt="Bob" />
          <span>IBM Bob</span>
        </div>
        <div className="footer-links">
          <a href="#">Pricing</a>
          <a href="#">Documentation</a>
          <a href="#">Enterprise</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
        <div className="footer-social">
          <a href="#" title="LinkedIn">in</a>
          <a href="#" title="Bluesky">B</a>
        </div>
      </footer>

      {/* CHAT WIDGET */}
      <ChatWidget />
    </>
  );
}

export default App;
