
const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
    }
  });
},{threshold:0.12});

reveals.forEach(el=>observer.observe(el));

document.addEventListener('mousemove',(e)=>{
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  document.querySelector('.ambient-1').style.transform =
    `translate(${x * 30}px, ${y * 20}px)`;

  document.querySelector('.ambient-2').style.transform =
    `translate(-${x * 30}px, -${y * 20}px)`;
});

const music = document.getElementById('bg-music');

music.volume = 0;

document.addEventListener('click', () => {

  music.play();

  let volume = 0;

  const fade = setInterval(() => {

    if(volume < 0.18){
      volume += 0.01;
      music.volume = volume;
    }

  }, 200);

}, { once:true });



async function updateCounter(){

  const namespace = "euzey-site";
  const key = "global-visits";

  try{

    const response = await fetch(
      `https://api.countapi.xyz/hit/${namespace}/${key}`
    );

    const data = await response.json();

    const counter =
    document.getElementById('contador');

    counter.textContent =
    data.value.toLocaleString();

    counter.classList.add('update');

    setTimeout(() => {
      counter.classList.remove('update');
    }, 300);

  }catch(err){

    console.log('counter error');

  }
}

updateCounter();
