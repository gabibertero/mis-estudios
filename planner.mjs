export const mins=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
export const clock=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
export const dayKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
export const plusDays=(d,n)=>{const x=new Date(d+'T12:00');x.setDate(x.getDate()+n);return dayKey(x)};
export const evaluationKinds=['Parcial','Recuperatorio','Final','Promoción','Complementario por equivalencia'];
const finalLike=kind=>kind==='Final'||kind==='Complementario por equivalencia';
export const grade=(p,kind)=>p>=96?10:p>=87?9:p>=78?8:p>=69?7:p>=60?6:finalLike(kind)?'Insuficiente':p>=58?5:p>=55?4:'Insuficiente';
export const minRequired=kind=>finalLike(kind)?60:55;
export const phases=['Aprender','Practicar','Dominar','Repasar'];
export function generate(state,now=new Date()){
 const today=dayKey(now),settings=state.settings;
 const exams=state.exams.filter(e=>!e.closed&&new Date(e.date+'T'+e.time)>now);
 const kept=state.sessions.filter(s=>s.done||(s.locked&&exams.some(e=>e.id===s.exam)&&new Date(s.date+'T'+s.end)>now)),sessions=[...kept], warnings=[];
 const work=[];
 for(const t of state.topics){
  const e=exams.find(e=>e.id===t.exam);if(!e)continue;
  const reserved=kept.filter(s=>s.topic===t.id).reduce((n,s)=>n+s.minutes,0);
  const latest=state.results.filter(r=>r.exam===e.id).sort((a,b)=>b.at.localeCompare(a.at))[0];
  const reinforcement=latest&&latest.percent<100?Math.ceil(t.estimate*Math.min(.5,(100-latest.percent)/100)/5)*5:0;const target=t.estimate+reinforcement;work.push({t,e,left:Math.max(0,target-reserved),used:reserved,target,score:latest?.percent??null});
 }
 const last=exams.map(e=>e.date).sort().at(-1);
 for(let d=today,i=0;last&&d<=last&&i<366;d=plusDays(d,1),i++){
  const dow=new Date(d+'T12:00').getDay();
  const ranges=state.availability.filter(a=>a.day===dow);
  const busy=state.busy.filter(b=>b.date===d||(!b.date&&b.day===dow));
  const booked=kept.filter(s=>s.date===d);
  const limit=Math.max(0,settings.daily-booked.reduce((n,s)=>n+s.minutes,0));
  let remaining=limit, available=new Set();
  for(const a of ranges)for(let m=mins(a.start);m+5<=mins(a.end);m+=5){
    if(d===today&&m<Math.ceil((now.getHours()*60+now.getMinutes()+now.getSeconds()/60)/5)*5)continue;
    if(busy.some(b=>m<mins(b.end)&&m+5>mins(b.start)))continue;
    if(booked.some(s=>m<mins(s.end)+settings.break&&m+5>mins(s.start)-settings.break))continue;
    if(exams.some(e=>e.date===d&&m<mins(e.time)+Math.max(5,e.duration||120)&&m+5>mins(e.time)))continue;
    available.add(m);
  }
  const priority=(w,m)=>{const days=Math.max(0,(new Date(w.e.date+'T'+w.e.time)-new Date(d+'T'+clock(m)))/86400000);return 5/(days+.4)+3*w.e.minimum/100+2*Math.max(0,w.e.minimum-(w.score??0))/100+w.t.difficulty*.4+(w.left/w.target)*.5};
  for(const m of [...available].sort((a,b)=>a-b)){
    if(!available.has(m)||remaining<5)continue;
    const choices=work.filter(w=>w.left>0&&(d<w.e.date||(d===w.e.date&&m+5<=mins(w.e.time)))).sort((a,b)=>priority(b,m)-priority(a,m));
    for(const w of choices){
      const bound=Math.min(settings.block,remaining,Math.ceil(w.left/5)*5,d===w.e.date?mins(w.e.time)-m:1440-m);let n=0;
      while(n+5<=bound&&available.has(m+n))n+=5;
      if(n<Math.min(15,Math.ceil(w.left/5)*5))continue;
      const progress=w.used/w.target, phase=phases[progress<.4?0:progress<.75?1:progress<.9?2:3];
      sessions.push({id:'auto:'+w.t.id+':'+d+':'+m,exam:w.e.id,topic:w.t.id,date:d,start:clock(m),end:clock(m+n),minutes:n,phase,done:false,locked:false});
      w.left-=n;w.used+=n;remaining-=n;
      for(let j=m;j<m+n+settings.break;j+=5)available.delete(j);
      break;
    }
  }
 }
 for(const w of work)if(w.left>0)warnings.push({exam:w.e.id,topic:w.t.id,minutes:w.left});
 for(const s of kept.filter(s=>s.locked&&!s.done)){
  const d=s.date,dow=new Date(d+'T12:00').getDay();
  if(!state.availability.some(a=>a.day===dow&&mins(a.start)<=mins(s.start)&&mins(a.end)>=mins(s.end))||state.busy.some(b=>(b.date===d||(!b.date&&b.day===dow))&&mins(b.start)<mins(s.end)&&mins(b.end)>mins(s.start))||exams.some(e=>e.date===d&&mins(e.time)<mins(s.end)&&mins(e.time)+(e.duration||120)>mins(s.start))||exams.some(e=>e.id===s.exam&&new Date(s.date+'T'+s.end)>new Date(e.date+'T'+e.time)))warnings.push({exam:s.exam,topic:s.topic,minutes:0,conflict:true});
 }
 return {sessions:sessions.sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)),warnings};
}
