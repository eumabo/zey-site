const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting) entry.target.classList.add('visible');
  });
},{threshold:0.12});
reveals.forEach(el=>observer.observe(el));

window.addEventListener('load',()=>{
  setTimeout(()=>document.getElementById('preloader')?.classList.add('hide'),650);
});

const cursorLight = document.getElementById('cursorLight');
document.addEventListener('mousemove',(e)=>{
  if(cursorLight){
    cursorLight.style.left = e.clientX + 'px';
    cursorLight.style.top = e.clientY + 'px';
  }
});

const music = document.getElementById('bg-music');
const soundBtn = document.getElementById('soundBtn');
const soundIcon = document.getElementById('soundIcon');
let playing = false;
if(music) music.volume = 0.18;

async function toggleMusic(){
  if(!music) return;
  try{
    if(!playing){
      await music.play();
      playing = true;
      soundBtn?.classList.add('playing');
      if(soundIcon) soundIcon.textContent = '♫';
    }else{
      music.pause();
      playing = false;
      soundBtn?.classList.remove('playing');
      if(soundIcon) soundIcon.textContent = '♪';
    }
  }catch(err){
    console.log('Autoplay bloqueado pelo navegador.');
  }
}

soundBtn?.addEventListener('click', toggleMusic);
document.addEventListener('click', async (e)=>{
  if(e.target.closest('#soundBtn')) return;
  if(!playing){ await toggleMusic(); }
},{once:true});

const discordUser = 'ghostenk';
const discordBtn = document.getElementById('discordBtn');
discordBtn?.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(discordUser);
    const old = discordBtn.textContent;
    discordBtn.textContent = 'Copiado!';
    setTimeout(()=>discordBtn.textContent = old,1500);
  }catch(err){ alert('Não foi possível copiar.'); }
});
