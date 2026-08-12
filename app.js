const body = document.body;
const enterScreen = document.getElementById('enterScreen');
const enterButton = document.getElementById('enterButton');
const music = document.getElementById('bg-music');
const soundBtn = document.getElementById('soundBtn');
const playerToggle = document.getElementById('playerToggle');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const cursorLight = document.getElementById('cursorLight');
const discordBtn = document.getElementById('discordBtn');
const galleryCount = document.getElementById('galleryCount');

let audioContext;
let analyser;
let sourceNode;
let animationFrame;
let hasEntered = false;

const formatTime = seconds => {
  if (!Number.isFinite(seconds)) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const setPlayingState = playing => {
  body.classList.toggle('music-playing', playing);
  soundBtn?.setAttribute('aria-pressed', String(playing));
  soundBtn?.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproduzir música');
  playerToggle?.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproduzir música');
};

const setupAudioReactiveGlow = () => {
  if (!music || audioContext) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    audioContext = new AudioContextClass();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    sourceNode = audioContext.createMediaElementSource(music);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const updateBeat = () => {
      analyser.getByteFrequencyData(data);
      let bass = 0;
      const bassBins = Math.min(10, data.length);
      for (let i = 0; i < bassBins; i += 1) bass += data[i];
      bass = bassBins ? bass / bassBins : 0;
      document.documentElement.style.setProperty('--beat', bass.toFixed(1));
      animationFrame = requestAnimationFrame(updateBeat);
    };
    updateBeat();
  } catch (error) {
    console.warn('Efeito reativo de áudio indisponível.', error);
  }
};

const playMusic = async () => {
  if (!music) return;
  try {
    setupAudioReactiveGlow();
    if (audioContext?.state === 'suspended') await audioContext.resume();
    await music.play();
    setPlayingState(true);
  } catch (error) {
    setPlayingState(false);
    console.warn('O navegador bloqueou a reprodução de áudio.', error);
  }
};

const pauseMusic = () => {
  if (!music) return;
  music.pause();
  setPlayingState(false);
};

const toggleMusic = () => {
  if (!music) return;
  if (music.paused) playMusic();
  else pauseMusic();
};

const enterSite = async () => {
  if (hasEntered) return;
  hasEntered = true;
  enterScreen?.classList.add('is-hidden');
  body.classList.remove('is-locked');
  await playMusic();
};

enterButton?.addEventListener('click', enterSite);
enterScreen?.addEventListener('click', event => {
  if (event.target === enterScreen) enterSite();
});
soundBtn?.addEventListener('click', toggleMusic);
playerToggle?.addEventListener('click', toggleMusic);

music?.addEventListener('loadedmetadata', () => {
  if (durationEl) durationEl.textContent = formatTime(music.duration);
});

music?.addEventListener('timeupdate', () => {
  if (!music.duration) return;
  const percentage = (music.currentTime / music.duration) * 100;
  if (progress) {
    progress.value = String(percentage);
    progress.style.setProperty('--progress', `${percentage}%`);
  }
  if (currentTimeEl) currentTimeEl.textContent = formatTime(music.currentTime);
});

music?.addEventListener('play', () => setPlayingState(true));
music?.addEventListener('pause', () => setPlayingState(false));

progress?.addEventListener('input', () => {
  if (!music?.duration) return;
  const percentage = Number(progress.value);
  music.currentTime = (percentage / 100) * music.duration;
  progress.style.setProperty('--progress', `${percentage}%`);
});

const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(element => observer.observe(element));

if (galleryCount) {
  const total = document.querySelectorAll('.masonry .shot').length;
  galleryCount.textContent = String(total).padStart(2, '0');
}

if (window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', event => {
    if (!cursorLight) return;
    cursorLight.style.left = `${event.clientX}px`;
    cursorLight.style.top = `${event.clientY}px`;
  });
}

discordBtn?.addEventListener('click', async () => {
  const user = discordBtn.dataset.user || 'ghostenk';
  try {
    await navigator.clipboard.writeText(user);
    const strong = discordBtn.querySelector('strong');
    const previous = strong?.textContent;
    if (strong) strong.textContent = 'COPIADO';
    window.setTimeout(() => {
      if (strong) strong.textContent = previous || `@${user}`;
    }, 1500);
  } catch (error) {
    window.prompt('Copie seu usuário do Discord:', user);
  }
});

window.addEventListener('beforeunload', () => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
});
