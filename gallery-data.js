import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from './supabase-config.js';

const galleryCount = document.getElementById('galleryCount');
const counter = document.getElementById('contador');

const updateGalleryCount = () => {
  if (!galleryCount) return;
  const total = document.querySelectorAll('.masonry .shot img').length;
  galleryCount.textContent = String(total).padStart(2, '0');
};

const getFigureKey = figure => figure.querySelector('img')?.getAttribute('src') || '';

const applyPhotoOrder = order => {
  const masonry = document.querySelector('.masonry');
  if (!masonry || !Array.isArray(order) || !order.length) {
    updateGalleryCount();
    return;
  }

  const figures = [...masonry.querySelectorAll('.shot')].filter(figure => getFigureKey(figure));
  const bySrc = new Map(figures.map(figure => [getFigureKey(figure), figure]));
  const used = new Set();

  order.forEach(src => {
    const figure = bySrc.get(src);
    if (!figure) return;
    masonry.appendChild(figure);
    used.add(src);
  });

  // Fotos novas que ainda não existem na ordem salva ficam no final.
  figures.forEach(figure => {
    const src = getFigureKey(figure);
    if (!used.has(src)) masonry.appendChild(figure);
  });

  updateGalleryCount();
};

const setCounter = value => {
  if (!counter) return;
  counter.textContent = Number(value || 0).toLocaleString('pt-BR');
  counter.classList.add('pulse');
  window.setTimeout(() => counter.classList.remove('pulse'), 300);
};

const init = async () => {
  updateGalleryCount();

  if (!isSupabaseConfigured()) {
    console.info('ZEY: Supabase ainda não configurado. Usando ordem padrão das fotos.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const { data, error } = await supabase
      .from('gallery_settings')
      .select('photo_order')
      .eq('id', 'main')
      .maybeSingle();

    if (error) throw error;
    applyPhotoOrder(data?.photo_order);
  } catch (error) {
    console.warn('Não foi possível carregar a ordem da galeria.', error);
  }

  try {
    const visitKey = 'zeyUltimaVisita';
    const limit = 24 * 60 * 60 * 1000;
    const lastVisit = Number(localStorage.getItem(visitKey) || 0);
    const now = Date.now();

    if (!lastVisit || now - lastVisit > limit) {
      const { data, error } = await supabase.rpc('increment_site_views');
      if (error) throw error;
      setCounter(data);
      localStorage.setItem(visitKey, String(now));
    } else {
      const { data, error } = await supabase
        .from('site_stats')
        .select('views')
        .eq('id', 'main')
        .maybeSingle();
      if (error) throw error;
      setCounter(data?.views);
    }
  } catch (error) {
    console.warn('Contador indisponível.', error);
  }
};

init();
