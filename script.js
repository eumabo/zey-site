(() => {
  'use strict';

  const defaults = {
    videoUrl: 'assets/background.mp4',
    posterUrl: 'assets/preview.webp',
    ambientUrl: 'assets/ambient.mp3',
    audioMode: 'ambient',
    videoFit: 'cover',
    videoPosition: 'center center',
    videoVolume: 0.8,
    ambientVolume: 0.56,
    showNavigation: true,
    navigation: [],
  };
  const settings = Object.assign({}, defaults, window.ZEY_CONFIG || {});
  const video = document.getElementById('backgroundVideo');
  const audio = document.getElementById('ambientAudio');
  const soundButton = document.getElementById('soundButton');
  const fullscreenButton = document.getElementById('fullscreenButton');
  const frame = document.getElementById('frame');
  const poster = document.getElementById('poster');
  const nav = document.getElementById('microNav');

  let videoIsAvailable = false;
  let soundIsOn = false;
  let audioWasUnlocked = false;
  let manuallyMuted = false;

  poster.src = settings.posterUrl;
  video.style.objectFit = settings.videoFit === 'contain' ? 'contain' : 'cover';
  video.style.objectPosition = settings.videoPosition || 'center center';
  video.volume = Math.max(0, Math.min(1, Number(settings.videoVolume)));
  audio.volume = Math.max(0, Math.min(1, Number(settings.ambientVolume)));
  audio.src = settings.ambientUrl;

  // Decorative navigation remains plain text until real destinations are supplied.
  if (settings.showNavigation && Array.isArray(settings.navigation)) {
    for (const item of settings.navigation) {
      if (!item || !item.label) continue;
      const element = item.url ? document.createElement('a') : document.createElement('span');
      element.textContent = item.label;
      if (item.url) {
        // Only relative or standard web links, never javascript: URLs.
        const value = String(item.url).trim();
        if (value.startsWith('/') || value.startsWith('./') || /^https?:\/\//i.test(value)) {
          element.setAttribute('href', value);
        }
      }
      nav.appendChild(element);
    }
    nav.hidden = nav.children.length === 0;
  }

  function usesAmbient() {
    return settings.audioMode === 'ambient' ||
      (settings.audioMode !== 'video' && !videoIsAvailable);
  }

  async function playVideo() {
    try {
      await video.play();
      return true;
    } catch (error) {
      return false;
    }
  }

  function syncButton() {
    soundButton.classList.toggle('is-on', soundIsOn);
    soundButton.setAttribute('aria-label', soundIsOn ? 'Desativar som' : 'Ativar som');
    soundButton.title = soundIsOn ? 'Desativar som' : 'Ativar som';
  }

  async function setSound(nextState) {
    soundIsOn = Boolean(nextState);
    if (!soundIsOn) {
      video.muted = true;
      audio.pause();
      syncButton();
      return;
    }

    if (usesAmbient()) {
      video.muted = true;
      audio.currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      try {
        await audio.play();
        audioWasUnlocked = true;
      } catch (error) {
        soundIsOn = false;
      }
    } else {
      audio.pause();
      video.muted = false;
      const started = await playVideo();
      if (started) audioWasUnlocked = true;
    }
    syncButton();
  }

  soundButton.addEventListener('click', () => {
    manuallyMuted = soundIsOn;
    void setSound(!soundIsOn);
  });
  syncButton();

  // Tente música com som logo ao abrir. Se o navegador proibir,
  // comece na primeira interação válida em qualquer lugar do cenário.
  // Não há como contornar a política de autoplay de um navegador.
  void setSound(true);

  const unlockSound = (event) => {
    if (audioWasUnlocked || manuallyMuted || soundIsOn) return;
    if (event.target instanceof Element && event.target.closest('#soundButton')) return;
    void setSound(true);
  };
  document.addEventListener('pointerdown', unlockSound, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') unlockSound(event);
  });

  video.addEventListener('playing', async () => {
    const firstAvailability = !videoIsAvailable;
    videoIsAvailable = true;
    video.classList.add('is-playing');
    if (firstAvailability && soundIsOn && settings.audioMode !== 'ambient') {
      audio.pause();
      video.muted = false;
    }
  });
  video.addEventListener('error', () => {
    video.classList.remove('is-playing');
    videoIsAvailable = false;
    if (soundIsOn && settings.audioMode !== 'video') void setSound(true);
  });
  video.addEventListener('stalled', () => {
    // Keep poster visible only if the movie has never started.
    if (!videoIsAvailable) video.classList.remove('is-playing');
  });

  if (settings.videoUrl) {
    video.src = String(settings.videoUrl);
    video.load();
    void playVideo();
  }

  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (frame.requestFullscreen) {
        await frame.requestFullscreen();
      } else {
        // e.g. iOS Safari: use a full-viewport CSS alternative.
        frame.classList.toggle('mobile-immersive');
      }
    } catch (error) {
      frame.classList.toggle('mobile-immersive');
    }
    refreshFullscreenButton();
  });
  function refreshFullscreenButton() {
    const active = Boolean(document.fullscreenElement) || frame.classList.contains('mobile-immersive');
    fullscreenButton.setAttribute('aria-pressed', String(active));
    fullscreenButton.setAttribute('aria-label', active ? 'Sair da tela cheia' : 'Entrar em tela cheia');
    fullscreenButton.title = active ? 'Sair da tela cheia' : 'Tela cheia';
  }
  document.addEventListener('fullscreenchange', refreshFullscreenButton);
  refreshFullscreenButton();

  // A trilha usa <audio> separado do vídeo e continua tocando quando
  // o usuário abre outra aba. Não pausar no visibilitychange.
  // Alguns sistemas podem suspender áudio de abas inativas para economizar bateria.
})();
