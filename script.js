const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d', { alpha: true });

let width, height;
let particles = [];
let dpr = 1;
const mouse = { x: null, y: null, radius: 100 };

// Detectar dispositivo móvil
function isMobileDevice() {
    return window.innerWidth < 768;
}

// Control del tamaño del canvas resistente a la barra de dirección de Safari iOS
let lastWidth = 0;
let lastHeight = 0;

function resize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    // En Safari móvil, el scroll oculta/muestra la barra de direcciones y dispara resize con variación leve de altura.
    // Solo redimensionamos y recreamos partículas si cambia el ancho (rotación/redimensionado)
    // o si el cambio de altura es considerable (> 120px, ej. teclado en pantalla).
    if (newWidth === lastWidth && Math.abs(newHeight - lastHeight) < 120 && particles.length > 0) {
        return;
    }

    lastWidth = newWidth;
    lastHeight = newHeight;
    width = newWidth;
    height = newHeight;

    // Limitamos DPR a 1.5 máximo en pantallas Retina para mantener nitidez sin saturar GPU/RAM en WebKit
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    init();
}

// Eventos de mouse pasivos
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}, { passive: true });

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
}, { passive: true });

// Eventos táctiles pasivos (crucial para que Safari no bloquee el scroll)
window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
}, { passive: true });

window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
}, { passive: true });

window.addEventListener('touchcancel', () => {
    mouse.x = null;
    mouse.y = null;
}, { passive: true });

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseSize = Math.random() * 1.8 + 0.8; // 0.8px a 2.6px
        this.size = this.baseSize;
        this.speedX = (Math.random() - 0.5) * 0.22;
        this.speedY = (Math.random() - 0.5) * 0.22;
        this.baseOpacity = Math.random() * 0.4 + 0.3;
        this.opacity = this.baseOpacity;
        this.twinkleSpeed = Math.random() * 0.035 + 0.015;
        this.angle = Math.random() * Math.PI * 2;
        
        // Paleta de colores solicitada: Azul, Rosa, Dorado, Morado, Blanco
        const colors = [
            { r: 59, g: 130, b: 246 },   // Azul
            { r: 236, g: 72, b: 153 },  // Rosa
            { r: 245, g: 158, b: 11 },   // Dorado
            { r: 139, g: 92, b: 246 },  // Morado
            { r: 255, g: 255, b: 255 }  // Blanco
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Oscilación suave de opacidad y tamaño
        this.angle += this.twinkleSpeed;
        this.opacity = Math.max(0.15, Math.min(1.0, this.baseOpacity + Math.sin(this.angle) * 0.45));
        this.size = Math.max(0.5, this.baseSize + Math.sin(this.angle) * 0.75);

        // Límites de pantalla (wrap)
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }

    draw() {
        const { r, g, b } = this.color;

        // 1. Halo suave de brillo (optimizado para Safari sin crear radial-gradient por cuadro)
        if (this.opacity > 0.65 && this.baseSize > 1.3) {
            const glowSize = this.size * 3.2;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.18})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Núcleo nítido de la estrella
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 3. Destello en cruz (4-point sparkle) en su brillo máximo
        if (this.opacity > 0.8 && this.baseSize > 1.4) {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(this.opacity - 0.7) * 1.8})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            
            const flare = this.size * 2.8;
            ctx.moveTo(this.x - flare, this.y);
            ctx.lineTo(this.x + flare, this.y);
            ctx.moveTo(this.x, this.y - flare);
            ctx.lineTo(this.x, this.y + flare);
            
            ctx.stroke();
        }
    }
}

function init() {
    particles = [];
    // Cantidad adaptativa según dispositivo (móvil vs escritorio) para máximo rendimiento
    const mobile = isMobileDevice();
    const maxParticles = mobile ? 40 : 80;
    const divisor = mobile ? 18000 : 13000;
    const numberOfParticles = Math.min(maxParticles, Math.max(25, Math.floor((width * height) / divisor)));

    for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
    }
}

function connect() {
    // Solo trazamos líneas interactivas cuando el usuario mueve el dedo o el mouse.
    // Esto evita invalidar constantemente el fondo bajo las tarjetas con backdrop-filter,
    // garantizando 60/120 FPS estables sin sobrecalentar la GPU en Safari.
    if (mouse.x === null || mouse.y === null) return;

    const mouseRadius = mouse.radius;
    const mouseRadiusSq = mouseRadius * mouseRadius;
    const pLen = particles.length;

    for (let a = 0; a < pLen; a++) {
        const pa = particles[a];
        const dx = pa.x - mouse.x;
        const dy = pa.y - mouse.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < mouseRadiusSq) {
            const dist = Math.sqrt(distSq);
            const opacity = (1 - dist / mouseRadius) * 0.28;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        }
    }
}

let animationFrameId;

function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    connect();
    animationFrameId = requestAnimationFrame(animate);
}

// Pausar animación cuando la pestaña o pantalla esté oculta (ahorra batería en Safari/móviles)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
    } else {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(animate);
    }
});

// Listener de resize con debounce para evitar cálculos innecesarios
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
}, { passive: true });

// Inicialización inicial
resize();
animate();

// ========================================
// LÓGICA DEL BOTÓN DE COMPARTIR Y TOAST
// ========================================
const shareBtn = document.getElementById('shareBtn');
const toastContainer = document.getElementById('toastContainer');
let toastTimeout;

if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
        const shareData = {
            title: '@raldylopez | Enlaces',
            text: 'Mira los enlaces de Raldy Lopez, portafolio de modelaje, servicios web y más.',
            url: window.location.href
        };

        // Si el navegador soporta compartir de manera nativa (especialmente en móviles)
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    fallbackShare();
                }
            }
        } else {
            fallbackShare();
        }
    });
}

function fallbackShare() {
    // Copiar URL de forma segura al portapapeles
    navigator.clipboard.writeText(window.location.href)
        .then(() => {
            showToast();
        })
        .catch(err => {
            console.error('Error al copiar el enlace: ', err);
        });
}

function showToast() {
    if (toastTimeout) clearTimeout(toastTimeout);
    
    toastContainer.classList.add('show');
    
    toastTimeout = setTimeout(() => {
        toastContainer.classList.remove('show');
    }, 3000);
}

// ========================================
// ========================================
// EFECTO TEXT SCRAMBLE / MATRIX (OPTIMIZADO PARA SAFARI Y MOBILE)
// ========================================
class TextScramble {
  constructor(el) {
    this.el = el;
    // Símbolos Matrix limpios sin caracteres HTML problemáticos (<, >, &)
    this.chars = '!#%*+=_~/?[]{}0123456789ABCDEFXYZ';
    this.update = this.update.bind(this);
  }

  setText(newText) {
    const oldText = this.el.textContent.trim();
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise(resolve => (this.resolve = resolve));
    this.queue = [];

    // Duración de animación ajustada a ~0.4s para que sea ágil y fluida
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 8);
      const end = start + Math.floor(Math.random() * 10) + 5;
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = '';
    let complete = 0;

    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += (to === '&' ? '&amp;' : to);
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.35) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += (from === '&' ? '&amp;' : from);
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      this.el.textContent = this.queue.map(item => item.to).join('');
      if (this.resolve) this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// Inicializar el scramble Matrix en el nombre de usuario
const usernameEl = document.querySelector('.username');
if (usernameEl) {
    const scramble = new TextScramble(usernameEl);
    const phrases = ['@raldylopez', 'Model & Developer'];
    let counter = 1;
    let isTransitioning = false;
    let timer = null;

    function triggerNext() {
        if (isTransitioning) return;
        isTransitioning = true;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        scramble.setText(phrases[counter]).then(() => {
            isTransitioning = false;
            counter = (counter + 1) % phrases.length;
            timer = setTimeout(triggerNext, 3000); // 3.0 segundos exactos
        });
    }

    // Iniciar el primer cambio a los 3.0 segundos
    timer = setTimeout(triggerNext, 3000);

    // Si el usuario cambia de app o pestaña en Safari/iOS y regresa, reanuda el ciclo
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (timer) clearTimeout(timer);
            isTransitioning = false;
            timer = setTimeout(triggerNext, 1000);
        }
    });

    // Efecto al pasar el cursor (solo en PC con mouse real)
    if (window.matchMedia('(hover: hover)').matches) {
        usernameEl.style.cursor = 'pointer';
        usernameEl.addEventListener('mouseenter', () => {
            if (isTransitioning) return;
            triggerNext();
        });
    }

    // Al hacer click o tap en móvil, dispara de inmediato y reinicia el ciclo de 3.0s
    usernameEl.addEventListener('click', () => {
        if (isTransitioning) return;
        triggerNext();
    });
}

// Efecto magnético para botones de redes sociales (solo en pantallas con puntero/mouse)
function initMagneticLinks() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    const links = document.querySelectorAll('.social-icon-btn');
    links.forEach(link => {
        link.addEventListener('mousemove', (e) => {
            const rect = link.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            link.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px) scale(1.08)`;
        });
        link.addEventListener('mouseleave', () => {
            link.style.transform = '';
        });
    });
}

initMagneticLinks();
