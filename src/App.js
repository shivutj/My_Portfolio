import React, { useEffect, useMemo, useRef, useState } from 'react';
import SplitText from './components/SplitText';
import ScrollReveal from './components/ScrollReveal';
import ClickSpark from './components/ClickSpark';
import StarBorder from './components/StarBorder';
import DotGrid from './components/DotGrid';
import Dither from './components/Dither';
import Shuffle from './components/Shuffle';
// import LoadingShimmer from './components/LoadingShimmer';
import './components/LoadingShimmer.css';
import './App.css';

const TABS = ['About', 'Projects', "Let's Connect"];

const App = () => {
  const [activeTab, setActiveTab] = useState('About');
  const [showBottomNav, setShowBottomNav] = useState(false);
  const [heroProgress, setHeroProgress] = useState(0); // 0 visible, 1 hidden
  const [isMobileHero, setIsMobileHero] = useState(false);
  const headerRef = useRef(null);
  const heroRef = useRef(null);
  const programmaticScrollRef = useRef(false);
  const sectionRefs = useMemo(
    () => ({
      About: React.createRef(),
      Projects: React.createRef(),
      "Let's Connect": React.createRef()
    }),
    []
  );
  const scrollEndTimerRef = useRef(null);

  // Ensure we start at About and top of page
  useEffect(() => {
    setActiveTab('About');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const timeElement = document.getElementById('current-time');
      if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString('en-US', { 
          hour12: true, 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
      }
    };
    
    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Detect very small screens to render a simpler hero title (avoids char-shuffle artifacts)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 400px)');
    const apply = () => setIsMobileHero(mq.matches);
    apply();
    mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', apply) : mq.removeListener(apply);
    };
  }, []);

  // Reveal-on-scroll for elements with .reveal class
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.reveal'));
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.2 }
    );
    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  const scrollToTab = tab => {
    const node = sectionRefs[tab]?.current;
    if (!node) return;
    const headerHeight = headerRef.current?.offsetHeight || 0;
    const y = node.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    programmaticScrollRef.current = true;
    setActiveTab(tab);
    window.scrollTo({ top: y, behavior: 'smooth' });
    window.clearTimeout(scrollEndTimerRef.current);
  };

  const scrollToMain = () => scrollToTab('About');

  // Debounce to detect end of programmatic scroll
  useEffect(() => {
    const onScroll = () => {
      if (!programmaticScrollRef.current) return;
      window.clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = window.setTimeout(() => {
        programmaticScrollRef.current = false;
      }, 350);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(scrollEndTimerRef.current);
    };
  }, []);

  // Show/hide bottom nav on scroll
  useEffect(() => {
    const onScroll = () => {
      const headerHeight = headerRef.current?.offsetHeight || 0;
      
      // Show bottom nav when header is scrolled out of view
      if (window.scrollY > headerHeight + 50) {
        setShowBottomNav(true);
      } else {
        setShowBottomNav(false);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const headerHeight = () => headerRef.current?.offsetHeight || 0;
    const opts = { root: null, rootMargin: `-${headerHeight() + 100}px 0px -30% 0px`, threshold: 0.1 };
    const observer = new IntersectionObserver(entries => {
      if (programmaticScrollRef.current) return; // don't override during click-scroll
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length === 0) return;
      const best = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
      const id = best.target.getAttribute('data-section');
      if (id && TABS.includes(id)) {
        setActiveTab(id);
      }
    }, opts);
    Object.values(sectionRefs).forEach(ref => ref.current && observer.observe(ref.current));
    return () => observer.disconnect();
  }, [sectionRefs]);

  // Track hero visibility progress for name fade
  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const hero = heroRef.current;
        if (!hero) return;
        const rect = hero.getBoundingClientRect();
        const h = Math.max(rect.height, 1);
        const scrolled = Math.min(Math.max(-rect.top, 0), h);
        const p = Math.min(Math.max(scrolled / (h * 0.8), 0), 1); // slightly faster fade
        setHeroProgress(p);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const renderSections = () => (
    <div className="combined-content">
      <section
        ref={sectionRefs.About}
        data-section="About"
        className="content-section"
      >
        <SplitText text="Introduction" tag="h2" className="heading reveal show" splitType="chars" />
        <ScrollReveal baseOpacity={0} enableBlur={true} baseRotation={5} blurStrength={10}>
          Motivated Computer Science graduate with a passion for learning and logical thinking. Eager to contribute to real-world projects, grow through continuous improvement, and become a reliable developer who supports innovation and collaborates effectively in team environments.
        </ScrollReveal>

        <div className="info-card">
          <h3>Education</h3>
          <div className="info-item">
            <div className="info-header">
              <span className="info-title">Master of Computer Applications</span>
              <span className="info-date">Sep 2025</span>
            </div>
            <div className="info-details">
              <span className="info-institution">Siddaganga Institute of Technology</span>
                <span className="info-gpa">GPA: 8.62/10</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-header">
              <span className="info-title">Bachelor of Computer Applications</span>
              <span className="info-date">Sep 2023</span>
            </div>
            <div className="info-details">
              <span className="info-institution">Sree Siddaganga College of Arts, Science and Commerce</span>
              <span className="info-gpa">GPA: 7.49/10</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3>Internships</h3>
          <div className="info-item">
            <div className="info-header">
              <span className="info-title">Web Dev Intern – Hex Softwares (Virtual)</span>
              <span className="info-date">Sep–Oct 2024</span>
            </div>
            <div className="info-details">
              <span className="info-description">4-week front-end internship using HTML, CSS, JavaScript</span>
              <a href="https://drive.google.com/file/d/1sBtM6lV4aYpHqFVInL8cByA-YR9vsrhp/view?usp=drivesdk" target="_blank" rel="noreferrer">Certificate</a>
            </div>
          </div>
          <div className="info-item">
            <div className="info-header">
              <span className="info-title">MERN Stack Intern – FacePrep (Campus)</span>
              <span className="info-date">Nov–Dec 2024</span>
            </div>
            <div className="info-details">
              <span className="info-description">Worked on full-stack MERN-based modules</span>
              <a href="https://drive.google.com/file/d/1sF9TL1EkiyEakm4FjS4rFPS2cxboY-zU/view?usp=drivesdk" target="_blank" rel="noreferrer">Certificate</a>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3>Skills</h3>
          <div className="skills-grid">
            <div className="skill-item">
              <span className="skill-label">Languages:</span>
              <span className="skill-value">Core Java, HTML, CSS, JavaScript</span>
            </div>
            <div className="skill-item">
              <span className="skill-label">Tools:</span>
              <span className="skill-value">VS Code, Figma (Basics)</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3>Certifications</h3>
          <div className="cert-item">
            <span className="cert-title">Programming in Java</span>
            <span className="cert-org">NPTEL</span>
            <span className="cert-date">Mar 2025</span>
            <a href="https://drive.google.com/file/d/18wt4di_a_MRJRWXVmpNVNcyDXSwZf8PM/view?usp=drivesdk" target="_blank" rel="noreferrer">View Certificate</a>
          </div>
        </div>
      </section>

      <section
        ref={sectionRefs.Projects}
        data-section="Projects"
        className="content-section"
      >
        <SplitText text="Projects" tag="h2" className="heading reveal show" splitType="chars" />
        <div className="projects-grid">
          <div className="project-card">
            <div className="project-header">
              <h3>Online Shopping System</h3>
              <span className="project-year">2024</span>
            </div>
            <p>PHP + SQL e-commerce with product listings, cart, and checkout modules; secure data handling and inventory updates.</p>
          </div>
          <div className="project-card">
            <div className="project-header">
              <h3>Learning Management System – SIT-MCA</h3>
              <span className="project-year">2025</span>
            </div>
            <p>Secure MERN-based LMS with Cloudinary video hosting; dashboard, login, and content upload modules.</p>
          </div>
          <div className="project-card">
            <div className="project-header">
              <h3>SanjeeviniAI – Leaf-Based Ayurvedic Herb Identifier</h3>
              <span className="project-year">2025</span>
            </div>
            <p>AI system identifying 30 Ayurvedic plants via leaf image. Compared CNN models (MobileNetV2, DenseNet121, Xception, EfficientNetB0, InceptionV3); Streamlit app with multilingual results and symptom-based remedy suggestions.</p>
          </div>
        </div>
        {/* Research Publications */}
        <div className="info-card" style={{ marginTop: 24 }}>
          <h3>Research Publications</h3>
          <div className="info-item">
            <div className="info-header">
              <span className="info-title">Deep Learning-Based Identification and Classification of Ayurvedic Medicinal Plants</span>
              <span className="info-date">Sep 2025</span>
            </div>
            <div className="info-details">
              <span className="info-description">Presented at the Fifth International Conference on Emerging Research in Electronics, Computer Science and Technology (ICERECT – 2025), organized by P.E.S. College of Engineering, Mandya, and IEEE Bangalore Section.</span>
              <a href="https://drive.google.com/file/d/1gmflDdh40KSlzepotP8UOxEsyA0QvQhF/view" target="_blank" rel="noreferrer">Publication Certificate</a>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={sectionRefs["Let's Connect"]}
        data-section="Let's Connect"
        className="content-section"
        id="lets-connect"
        style={{ paddingBottom: 32 }}
      >
        <SplitText text="Let's Connect" tag="h2" className="heading reveal show" splitType="chars" />
        <div className="contact-info">
          <div className="contact-cta">
            <span className="cta-title">Get in touch:</span>
            <div className="icon-row">
              <a className="icon-btn email" href="mailto:shivutj7@gmail.com" aria-label="Email">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5L4 8V6l8 5 8-5v2z"/></svg>
              </a>
                <a className="icon-btn linkedin" href="https://linkedin.com/in/shivutj" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              <a className="icon-btn github" href="https://github.com/tjshivu" target="_blank" rel="noreferrer" aria-label="GitHub">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 00-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18a2.65 2.65 0 00-1.1-1.45c-.9-.62.07-.6.07-.6a2.1 2.1 0 011.53 1 2.14 2.14 0 002.93.83 2.14 2.14 0 01.63-1.34c-2.22-.25-4.55-1.11-4.55-4.93a3.86 3.86 0 011-2.67 3.58 3.58 0 01.1-2.63s.84-.27 2.75 1a9.43 9.43 0 015 0c1.9-1.27 2.74-1 2.74-1a3.58 3.58 0 01.1 2.63 3.86 3.86 0 011 2.67c0 3.83-2.33 4.68-4.56 4.93a2.39 2.39 0 01.68 1.86v2.76c0 .26.18.58.69.48A10 10 0 0012 2z"/></svg>
              </a>
            </div>
          </div>
            <div className="location-info">
              <p className="location">Gubbi, India</p>
              <p className="current-time" id="current-time">
                {new Date().toLocaleTimeString('en-US', { 
                  hour12: true, 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
              <p className="last-updated">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="resume-bottom">
              <a
                className="resume-btn"
                href="https://drive.google.com/file/d/1cgoIRqd_tG99l3hPBZPp5QKB1A6Zm5Cl/view?usp=drivesdk"
                target="_blank"
                rel="noreferrer"
              >
                Download Resume
              </a>
            </div>
        </div>
      </section>
    </div>
  );

  return (
    <ClickSpark sparkColor="#fff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
      <div className="app-root">
        {/* DotGrid background covering entire black area */}
        <div className="dotgrid-background">
          <DotGrid
            dotSize={8}
            gap={20}
            baseColor="#bbbbbb"
            activeColor="#eeeeee"
            proximity={120}
            shockRadius={250}
            shockStrength={4}
            resistance={750}
            returnDuration={1.5}
          />
        </div>
        
        {/* Top navigation removed; keep zero-height header for offsets */}
        <header className="header header--hidden" ref={headerRef} />

      {/* Hero with Dither and name */}
      <section className="hero" aria-label="Intro" ref={heroRef}>
        <Dither waveColor={[0.35, 0.35, 0.35]} enableMouseInteraction={true} disableAnimation={false} colorNum={4} />
        <a className="hero-link hero-resume" href="https://drive.google.com/file/d/1cgoIRqd_tG99l3hPBZPp5QKB1A6Zm5Cl/view?usp=drivesdk" target="_blank" rel="noreferrer">Resume</a>
        <a className="hero-link" href="https://linkedin.com/in/shivutj" target="_blank" rel="noreferrer">LinkedIn</a>
        <div className="hero-overlay">
          <div
            className="hero-name"
            style={{ opacity: Math.max(0, 1 - heroProgress), transform: `translateY(${heroProgress * -24}px) scale(${1 - heroProgress * 0.05})` }}
          >
            {isMobileHero ? (
              <span style={{ display: 'inline-block' }}>SHIVU&nbsp;T&nbsp;J</span>
            ) : (
              <Shuffle
                text={"SHIVU\u00A0T\u00A0J"}
                shuffleDirection="right"
                duration={0.35}
                animationMode="evenodd"
                shuffleTimes={1}
                ease="power3.out"
                stagger={0.03}
                threshold={0.1}
                triggerOnce={true}
                triggerOnHover={true}
                respectReducedMotion={true}
                className=""
                style={{ display: 'inline-block' }}
              />
            )}
          </div>
          <div className="open-card" aria-label="availability">
            <span className="open-dot" />
            <span className="open-text">Open to work</span>
          </div>
        </div>
        <button className="scroll-down" aria-label="Scroll down" onClick={scrollToMain}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14M12 19l-6-6M12 19l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      {/* Main container as second square */}
      <div className="outer">
        <StarBorder as="div" className="content-wrapper" color="cyan" speed="5s">
          {renderSections()}
        </StarBorder>
      </div>

      {/* Floating bottom navigation */}
      <div className={`bottom-nav ${showBottomNav ? 'show' : ''}`}>
        <div className="capsule-nav" role="tablist" aria-label="Bottom Navigation">
          <div
            className="capsule-indicator"
            style={{ 
              left: `calc(${TABS.indexOf(activeTab) * (100 / TABS.length)}% + 4px)`, 
              width: `calc(${100 / TABS.length}% - 4px)` 
            }}
          />
          {TABS.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`capsule-item ${activeTab === tab ? 'is-active' : ''}`}
              onClick={() => scrollToTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      </div>
    </ClickSpark>
  );
};

export default App;


