document.addEventListener('DOMContentLoaded', () => {
  // GSAP Setup
  gsap.registerPlugin(TextPlugin, ScrollTrigger);

  // Constants & Elements
  const card = document.getElementById('card');
  const openBtn = document.getElementById('open');
  const closeBtn = document.getElementById('close');
  const loader = document.getElementById('loader');
  const audio = document.getElementById('bg-music');
  const insideContent = document.querySelector('.inside-content');
  const scrollHint = document.querySelector('.scroll-hint');
  const cursorLight = document.querySelector('.cursor-light');
  const endingScene = document.getElementById('ending-scene');
  const replayBtn = document.getElementById('replay-btn');
  const heartTrigger = document.getElementById('heart-trigger');
  const signature = document.getElementById('signature');
  const revealSurpriseBtn = document.getElementById('reveal-surprise-btn');

  let isCardOpen = false;
  let cardRevealTimeline;
  let typingTimeline;
  let musicRetryBound = false;

  const colors = ['#ff4d6d', '#ff758f', '#ffb3c1', '#ffc8dd', '#fb6f92'];

  function startMusic() {
    if (!audio || !audio.paused) return;

    audio.playbackRate = 0.85;
    audio.play().then(() => {
      document.removeEventListener('pointerdown', startMusic);
      document.removeEventListener('keydown', startMusic);
      musicRetryBound = false;
    }).catch(() => {
      if (musicRetryBound) return;
      document.addEventListener('pointerdown', startMusic);
      document.addEventListener('keydown', startMusic);
      musicRetryBound = true;
    });
  }

  startMusic();

  function updateScrollHint() {
    if (!insideContent || !scrollHint) return;
    const hasMoreContent = insideContent.scrollTop + insideContent.clientHeight < insideContent.scrollHeight - 8;
    scrollHint.classList.toggle('is-visible', hasMoreContent);
  }

  insideContent?.addEventListener('scroll', updateScrollHint);
  window.addEventListener('resize', updateScrollHint);

  // 1. LOADING SCREEN
  window.addEventListener('load', () => {
    const tl = gsap.timeline();
    tl.to('.progress', { width: '100%', duration: 1.5, ease: 'power2.inOut' })
      .to(loader, {
        opacity: 0,
        duration: 0.8,
        onComplete: () => {
          loader.style.display = 'none';
          startEntranceAnimations();
        }
      });
  });

  function startEntranceAnimations() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const entrance = gsap.timeline({
      onComplete: () => {
        if (!reduceMotion) {
          gsap.to('#card-wrapper', {
            y: -14,
            duration: 20,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
          });
        }
      }
    });

    entrance.from('#card-wrapper', {
      y: reduceMotion ? 0 : 48,
      opacity: 0,
      duration: reduceMotion ? 0.3 : 1.1,
      ease: 'power3.out'
    }, 0)
      .from('.main-title', {
        y: reduceMotion ? 0 : 35,
        opacity: 0,
        duration: reduceMotion ? 0.3 : 0.9,
        ease: 'power4.out'
      }, 0.1)
      .from('.cake-container', {
        scale: reduceMotion ? 1 : 0,
        opacity: 0,
        duration: reduceMotion ? 0.3 : 0.8,
        ease: 'back.out(1.7)'
      }, 0.25)
      .from('.card-controls', {
        y: reduceMotion ? 0 : 20,
        opacity: 0,
        duration: reduceMotion ? 0.3 : 0.7
      }, 0.2);
  }

  // 2. 3D INTERACTION
  const handleMove = (x, y) => {
    if (window.innerWidth < 1024) return; // Only for desktop
    if (!isCardOpen) {
      // Very subtle hover effect when closed
      const rx = (window.innerHeight / 2 - y) / 50;
      const ry = (x - window.innerWidth / 2) / 50;
      gsap.to(card, {
        rotationX: rx,
        rotationY: ry,
        duration: 0.7,
        ease: 'power2.out'
      });
    } else {
      // Even subtler when open to keep text readable
      const rx = (window.innerHeight / 2 - y) / 100;
      const ry = (x - window.innerWidth / 2) / 100;
      gsap.to(card, {
        rotationX: rx + 5, // 5deg base tilt
        rotationY: ry,
        duration: 0.7,
        ease: 'power2.out'
      });
    }

    // Move light source
    gsap.to(cursorLight, { left: x, top: y, duration: 0.3 });

    // Subtle orb reaction
    gsap.to('.orb-1', { x: (x - window.innerWidth / 2) * 0.05, y: (y - window.innerHeight / 2) * 0.05, duration: 2 });
    gsap.to('.orb-2', { x: (window.innerWidth / 2 - x) * 0.05, y: (window.innerHeight / 2 - y) * 0.05, duration: 2 });
  };

  document.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));

  // Mobile Orientation
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (!isCardOpen) {
        const x = (e.gamma || 0) * 2; // Left to right
        const y = (e.beta || 0) * 2;  // Front to back
        handleMove(window.innerWidth / 2 + x, window.innerHeight / 2 + y);
      }
    });
  }

  // 3. CARD OPEN/CLOSE (Human Flow)
  // Typing Animation Configuration
  const typingConfig = {
    lines: [
      "เนื่องในโอกาสวันคล้ายวันเกิดของปู่ใหญ่ในปีนี้",
      "ขออาราธนาคุณพระศรีรัตนตรัย คุ้มครองให้พบแต่ความสุขความเจริญ",
      "คิดหวังสิ่งใดขอให้สมดังปรารถนาทุกประการ มีจิตใจที่ผ่องใสเบิกบานตลอดไปเทอญ"
    ],
    duration: 0.9,
    pauseBetweenLines: 0.18
  };

  function startTypingAnimation() {
    const tl = gsap.timeline({
      onComplete: () => {
        updateScrollHint();
        if (revealSurpriseBtn) {
          gsap.to(revealSurpriseBtn, {
            display: 'flex',
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'back.out(1.7)'
          });
        }
      }
    });

    typingConfig.lines.forEach((line, index) => {
      const elementId = `line-${index + 1}`;
      const el = document.getElementById(elementId);

      tl.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      })
        .add(() => el.classList.add('typing-active'))
        .to(el, {
          duration: Math.max(0.8, line.length * 0.018),
          text: line,
          ease: 'none'
        })
        .add(() => el.classList.remove('typing-active'), `+=${typingConfig.pauseBetweenLines}`);
    });

    return tl;
  }

  const openCard = () => {
    if (isCardOpen) return;
    startMusic();
    isCardOpen = true;
    card.classList.add('is-open');
    document.body.classList.add('card-is-open');
    openBtn.setAttribute('aria-expanded', 'true');
    updateScrollHint();

    cardRevealTimeline = gsap.timeline();

    // Reveal title
    cardRevealTimeline.fromTo('.wish-title',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      "-=0.4"
    );

    // Start typing animation
    cardRevealTimeline.add(() => {
      typingTimeline = startTypingAnimation();
    }, "-=0.2");

    // Signature (reveals after title, but before typing finishes)
    cardRevealTimeline.fromTo('.signed',
      { opacity: 0, y: 10, filter: 'blur(5px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power2.out' },
      "-=0.2"
    ).add(() => {
      heartTrigger.classList.add('heart-pulse');
    });
  };

  const closeCard = () => {
    if (!isCardOpen) return;
    isCardOpen = false;
    card.classList.remove('is-open');
    document.body.classList.remove('card-is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    cardRevealTimeline?.kill();
    typingTimeline?.kill();
    document.querySelectorAll('.typing-active').forEach((line) => line.classList.remove('typing-active'));
    heartTrigger.classList.remove('heart-pulse');
  };

  openBtn.addEventListener('click', openCard);
  closeBtn.addEventListener('click', closeCard);

  // 4. MODAL INTERACTIONS (LoveFunCode)
  // 5. MICRO-INTERACTIONS
  if (heartTrigger) {
    heartTrigger.addEventListener('click', () => {
      gsap.to(heartTrigger, {
        scale: 1.8,
        color: '#ff0000',
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          const msg = document.createElement('div');
          msg.innerText = "ปู่รักหลานมากที่สุด ✨";
          msg.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: #ff4d6d; padding: 15px 30px; border-radius: 50px; z-index: 3000; font-weight: 600; box-shadow: 0 10px 25px rgba(255, 77, 109, 0.4);`;
          document.body.appendChild(msg);
          gsap.from(msg, { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
          gsap.to(msg, { y: -40, opacity: 0, delay: 1.5, duration: 0.8, onComplete: () => msg.remove() });
        }
      });

      for (let i = 0; i < 10; i++) createSparkle(window.innerWidth / 2, window.innerHeight / 2);
    });
  }

  // 5. FINAL SCENE TRIGGER
  // 6. DECORATIONS
  function createParticles() {
    const container = document.getElementById('particles-container');
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `position: absolute; width: ${Math.random() * 3 + 2}px; height: ${Math.random() * 3 + 2}px; background: white; opacity: ${Math.random() * 0.3 + 0.1}; border-radius: 50%; top: ${Math.random() * 100}%; left: ${Math.random() * 100}%; pointer-events: none;`;
      container.appendChild(p);
      animateParticle(p);
    }
  }

  function animateParticle(p) {
    gsap.to(p, {
      y: "-=150",
      x: `+=${Math.random() * 40 - 20}`,
      opacity: 0,
      duration: Math.random() * 5 + 3,
      onComplete: () => {
        p.style.top = '110%';
        p.style.left = `${Math.random() * 100}%`;
        p.style.opacity = Math.random() * 0.3 + 0.1;
        animateParticle(p);
      }
    });
  }

  function createSparkle(x, y) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    document.body.appendChild(s);
    const size = Math.random() * 6 + 4;
    gsap.set(s, { x, y, width: size, height: size, backgroundColor: colors[Math.floor(Math.random() * colors.length)], borderRadius: '50%', position: 'absolute', pointerEvents: 'none', zIndex: 9999 });
    gsap.to(s, { x: x + (Math.random() * 200 - 100), y: y + (Math.random() * 200 - 100), opacity: 0, scale: 0, duration: 1.2, ease: 'power2.out', onComplete: () => s.remove() });
  }

  createParticles();
  document.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
      createSparkle(e.pageX, e.pageY);
    }
  });
});
