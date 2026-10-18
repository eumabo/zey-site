/**
 * ZEY — personalize aqui.
 * Para usar um vídeo local, coloque assets/background.mp4 nesta pasta.
 * Para um vídeo muito grande (ex.: 4K / 5 minutos), coloque a URL HTTPS direta
 * do arquivo MP4 em videoUrl; URL de YouTube ou página não funciona.
 */
window.ZEY_CONFIG = {
  videoUrl: 'assets/background.mp4',
  posterUrl: 'assets/preview.webp',

  // 'ambient': trilha separada do vídeo, ideal para tocar em outra aba.
  // 'video': som embutido no MP4 (pode parar se o navegador suspender o vídeo).
  // 'auto': vídeo quando disponível, ambient quando estiver só na prévia.
  audioMode: 'ambient',
  ambientUrl: 'assets/ambient.mp3',

  videoFit: 'cover', // 'cover' preenche, 'contain' mostra o vídeo inteiro
  videoPosition: 'center center',
  videoVolume: 0.8,
  ambientVolume: 0.56,

  // No layout de referência há microtextos ARCHIVE / NOTES / CONTACT.
  // Sem links configurados, eles ficam como tipografia visual discreta.
  // Para ocultar completamente, mude para false.
  showNavigation: true,
  navigation: [
    { label: 'ARCHIVE', url: '' },
    { label: 'NOTES', url: '' },
    { label: 'CONTACT', url: '' },
  ],
};
