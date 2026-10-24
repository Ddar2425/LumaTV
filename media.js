const video=document.querySelector('video'),params=new URLSearchParams(location.search),source=params.get('source');
document.title=params.get('title')||'Luma Player';
if(source&&new URL(source).protocol==='file:')video.src=source;
video.addEventListener('error',()=>document.querySelector('#message').textContent='This file could not be played. It may be missing, or its codec is not supported by this player. Escape returns home.');
document.addEventListener('keydown',event=>{if(event.code==='Space'){event.preventDefault();if(video.paused)video.play().catch(()=>{});else video.pause();}if(event.key==='ArrowRight')video.currentTime=Math.min(video.duration||Infinity,video.currentTime+10);if(event.key==='ArrowLeft')video.currentTime=Math.max(0,video.currentTime-10);});
