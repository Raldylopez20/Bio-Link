const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
const mouse = { x: null, y: null, radius: 120 };

// Resize canvas
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Mouse listeners
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

// Touch listeners for mobile
window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
});

window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
});

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseSize = Math.random() * 2.0 + 0.8; // Estrellas más notorias (0.8px a 2.8px)
        this.size = this.baseSize;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = (Math.random() - 0.5) * 0.2;
        this.baseOpacity = Math.random() * 0.4 + 0.3; // Opacidad base más brillante (0.3 a 0.7)
        this.opacity = this.baseOpacity;
        this.twinkleSpeed = Math.random() * 0.04 + 0.02; // Titileo ligeramente más rápido y dinámico
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

        // Oscilación más pronunciada de opacidad y tamaño para notar el brillo fuerte
        this.angle += this.twinkleSpeed;
        this.opacity = Math.max(0.15, Math.min(1.0, this.baseOpacity + Math.sin(this.angle) * 0.45));
        this.size = Math.max(0.5, this.baseSize + Math.sin(this.angle) * 0.85);

        // Comportamiento de límites (wrap)
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }

    draw() {
        const { r, g, b } = this.color;

        // 1. Dibujar halo de brillo (Glow) para las estrellas más grandes cuando brillan fuerte
        if (this.opacity > 0.65 && this.baseSize > 1.4) {
            const glowSize = this.size * 3.5;
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.35})`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.1})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Dibujar el núcleo de la estrella
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 3. Dibujar destello en cruz (4-point sparkle) para estrellas "con poder" en su brillo máximo
        if (this.opacity > 0.75 && this.baseSize > 1.4) {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(this.opacity - 0.7) * 2})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            
            // Línea horizontal del destello
            const flareWidth = this.size * 3.0;
            ctx.moveTo(this.x - flareWidth, this.y);
            ctx.lineTo(this.x + flareWidth, this.y);
            
            // Línea vertical del destello
            ctx.moveTo(this.x, this.y - flareWidth);
            ctx.lineTo(this.x, this.y + flareWidth);
            
            ctx.stroke();
        }
    }
}

function init() {
    particles = [];
    // Cantidad adaptativa incrementada para poblar más el cielo estrellado
    const numberOfParticles = Math.min(100, Math.floor((width * height) / 12000));
    for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
    }
}

function connect() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 90) {
                const opacity = (1 - distance / 90) * 0.12;
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }

        // Conexión interactiva con el mouse/touch
        if (mouse.x !== null && mouse.y !== null) {
            const dxMouse = particles[a].x - mouse.x;
            const dyMouse = particles[a].y - mouse.y;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

            if (distMouse < mouse.radius) {
                const opacity = (1 - distMouse / mouse.radius) * 0.22;
                ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`; // Resplandor púrpura sutil
                ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    connect();
    requestAnimationFrame(animate);
}

// Re-iniciar en resize
window.addEventListener('resize', init);

init();
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
// EFECTO TEXT SCRAMBLE (DE CODEPEN)
// ========================================
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }

  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise(resolve => (this.resolve = resolve));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
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
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// Inicializar el scramble en el nombre de usuario
const usernameEl = document.querySelector('.username');
if (usernameEl) {
    const scramble = new TextScramble(usernameEl);
    const phrases = ['@raldylopez', 'Model & Developer'];
    let counter = 0;
    let isTransitioning = false;
    
    const nextPhrase = () => {
        if (isTransitioning) return;
        scramble.setText(phrases[counter]).then(() => {
            setTimeout(nextPhrase, 3000); // Cambia de frase cada 3 segundos
        });
        counter = (counter + 1) % phrases.length;
    };
    
    // Iniciar animación automática
    nextPhrase();
    
    // Scramble al pasar el mouse por encima
    usernameEl.addEventListener('mouseenter', () => {
        isTransitioning = true;
        // Reinicia con la frase actual para dar el efecto de glitch al entrar
        const currentText = phrases[counter === 0 ? phrases.length - 1 : counter - 1];
        scramble.setText(currentText).then(() => {
            isTransitioning = false;
        });
    });
}

// Efecto magnético para botones de redes sociales (estilo CodePen)
function initMagneticLinks() {
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
