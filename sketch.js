/*
Pelotita Loca (física real con p5play)

- La figura se mueve sola y rebota en los cuatro bordes con física real
  (p5play + planck.js): cae por gravedad, gira y colisiona.
- Cada vez que toca un borde cambia de figura: círculo, triángulo,
  cuadrado y pentágono.
- En cada rebote suena un "blip" (p5.sound) y parpadea a rosa pastel.
- Si el cursor se pone encima, la figura se detiene.
*/

const RADIO = 25;
const GRAVEDAD = 10;

const CELESTE_PASTEL = [135, 206, 235];
const ROSA_PASTEL = [255, 183, 197];

// En este orden va cambiando la figura en cada rebote.
const FIGURAS = ['circle', 'triangle', 'square', 'pentagon'];

let pelota;
let muros = [];
let indiceFigura = 0;
let flashRebote = 0;      // 1 = acaba de rebotar (rosa), 0 = celeste
let cooldownRebote = 0;   // evita cambiar varias veces de golpe
let congelada = false;
let colorCeleste, colorRosa;

let osc;         // oscilador que genera el tono
let envolvente;  // controla el volumen del rebote
let audioListo = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  world.gravity.y = GRAVEDAD;
  world.allowSleeping = false;

  colorCeleste = color(...CELESTE_PASTEL);
  colorRosa = color(...ROSA_PASTEL);

  crearMuros();
  crearPelota(width / 2, height / 4);
  iniciarSonido();
}

// Muros estáticos justo fuera de la pantalla: marcan los cuatro bordes.
function crearMuros() {
  for (const m of muros) m.delete();
  muros = [];
  const t = 200;
  const defs = [
    [width / 2, -t / 2, width + t * 2, t],           // borde superior
    [width / 2, height + t / 2, width + t * 2, t],   // borde inferior
    [-t / 2, height / 2, t, height + t * 2],         // borde izquierdo
    [width + t / 2, height / 2, t, height + t * 2],  // borde derecho
  ];
  for (const d of defs) {
    const m = new Sprite(d[0], d[1], d[2], d[3], 'static');
    m.visible = false;
    muros.push(m);
  }
}

// Lado del polígono regular para que todas las figuras midan lo mismo.
function ladoDe(figura) {
  const n = figura === 'triangle' ? 3 : figura === 'square' ? 4 : 5;
  return 2 * RADIO * Math.sin(Math.PI / n);
}

function crearPelota(x, y) {
  indiceFigura = 0;
  const figura = FIGURAS[indiceFigura];
  if (figura === 'circle') {
    pelota = new Sprite(x, y, RADIO * 2);
  } else {
    pelota = new Sprite(x, y, ladoDe(figura), figura);
  }
  pelota.bounciness = 0.9;
  pelota.friction = 0.05;
  pelota.frictionAir = 0;
  pelota.stroke = color(255);
  pelota.strokeWeight = 2;
  pelota.allowSleeping = false;
  pelota.vel.x = (random() < 0.5 ? -1 : 1) * random(2, 5);
}

// Rehace el collider con la siguiente figura sin recrear la pelota,
// así conserva su posición, rotación y velocidad.
function cambiarFigura() {
  indiceFigura = (indiceFigura + 1) % FIGURAS.length;
  const figura = FIGURAS[indiceFigura];
  pelota.removeColliders();
  if (figura === 'circle') {
    pelota.addCollider(0, 0, RADIO * 2);
  } else {
    pelota.addCollider(0, 0, ladoDe(figura), figura);
  }
}

function draw() {
  background(120);

  // Color: celeste de base, rosa al rebotar y blanca si el cursor está encima.
  flashRebote = max(0, flashRebote - 0.05);
  if (congelada) {
    pelota.color = color(255);
  } else {
    pelota.color = lerpColor(colorCeleste, colorRosa, flashRebote);
  }

  actualizarCongelado();

  if (!congelada) {
    // Movimiento autónomo: empujoncitos laterales aleatorios.
    pelota.vel.x += random(-0.3, 0.3);
    if (abs(pelota.vel.x) < 2) {
      pelota.vel.x = (pelota.vel.x >= 0 ? 1 : -1) * 2;
    }
    // Si se queda dormida abajo, le damos un salto de vez en cuando.
    if (pelota.y > height - RADIO * 2 && abs(pelota.vel.y) < 1.5 && random() < 0.05) {
      pelota.vel.y = -random(10, 16);
    }
    comprobarRebote();
  }

  if (cooldownRebote > 0) cooldownRebote--;

  if (!audioListo) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('Haz clic para activar el sonido', width / 2, 30);
  }
}

function cursorEncima() {
  return dist(mouseX, mouseY, pelota.x, pelota.y) <= RADIO * 1.2;
}

function actualizarCongelado() {
  const encima = cursorEncima();
  if (encima && !congelada) {
    pelota.vel.x = 0;
    pelota.vel.y = 0;
    pelota.physics = 'static';
    congelada = true;
  } else if (!encima && congelada) {
    pelota.physics = 'dynamic';
    congelada = false;
  }
}

function comprobarRebote() {
  if (cooldownRebote > 0) return;
  for (const m of muros) {
    if (pelota.colliding(m)) {
      alRebotar();
      cooldownRebote = 8;
      return;
    }
  }
}

function alRebotar() {
  flashRebote = 1;
  cambiarFigura();
  // A veces rebota más fuerte, a veces más suave.
  if (random() < 0.4) pelota.vel.y -= random(2, 7);

  // Sonido del rebote (si p5.sound cargó).
  if (!osc || !envolvente) return;
  const rapidez = pelota.speed;
  osc.freq(map(rapidez, 0, 20, 180, 900));
  envolvente.play();
}

// Sonido: oscilador -> envolvente -> salida.
// La envolvente convierte cada rebote en un "blip" corto.
function iniciarSonido() {
  if (typeof p5 === 'undefined' || !p5.Oscillator) return;

  osc = new p5.Oscillator('sine');
  osc.disconnect();
  envolvente = new p5.Envelope();
  envolvente.setADSR(0.001, 0.05, 0.1, 0.1);
  osc.connect(envolvente);
  osc.start();
}

// Los navegadores solo permiten el audio después de una interacción.
function mousePressed() {
  if (typeof userStartAudio === 'function') userStartAudio();
  audioListo = true;
}

function touchStarted() {
  if (typeof userStartAudio === 'function') userStartAudio();
  audioListo = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  crearMuros();
  pelota.x = constrain(pelota.x, RADIO, width - RADIO);
  pelota.y = constrain(pelota.y, RADIO, height - RADIO);
}
