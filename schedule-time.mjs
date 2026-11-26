export const zone='America/Argentina/Cordoba';
const civilFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export const mins=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
export const clock=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
export function civilNow(now=new Date()){const p=Object.fromEntries(civilFormatter.formatToParts(now).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,minute:+p.hour*60+ +p.minute+ +p.second/60};}
export const dayKey=d=>civilNow(d).date;
export function plusDays(d,n){const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);}
export const weekday=d=>new Date(d+'T12:00:00Z').getUTCDay();
export const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&plusDays(d,0)===d;
export const afterNow=(date,time,now=new Date())=>{const n=civilNow(now);return date>n.date||(date===n.date&&mins(time)>n.minute);};
export function union(ranges){const result=[];for(const [a,b] of ranges.filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&a<b).sort((x,y)=>x[0]-y[0])){const tail=result.at(-1);if(tail&&a<=tail[1])tail[1]=Math.max(tail[1],b);else result.push([a,b]);}return result;}
export const availabilityOn=(state,date)=>union(state.availability.filter(a=>a.day===weekday(date)).map(a=>[mins(a.start),mins(a.end)]));
export const withinAvailability=(state,date,start,end)=>availabilityOn(state,date).some(([a,b])=>a<=mins(start)&&b>=mins(end));
export function subtract(ranges,blocked){let left=union(ranges);for(const [a,b] of union(blocked))left=left.flatMap(([x,y])=>b<=x||a>=y?[[x,y]]:[[x,Math.min(a,y)],[Math.max(b,x),y]].filter(([s,e])=>s<e));return left;}
export function scheduleBands(state,date){const available=availabilityOn(state,date),sessions=state.sessions.filter(s=>s.date===date),busy=state.busy.filter(b=>b.date===date||(!b.date&&b.day===weekday(date))),exams=state.exams.filter(e=>e.date===date&&!e.closed);const occupied=union([...sessions,...busy].map(s=>[mins(s.start),mins(s.end)]).concat(exams.map(e=>[mins(e.time),Math.min(1440,mins(e.time)+(e.duration||120))])));const gap=state.settings.break;const margins=union(sessions.flatMap(s=>[[mins(s.end),Math.min(1440,mins(s.end)+gap)],...(s.locked||s.done?[[Math.max(0,mins(s.start)-gap),mins(s.start)]]:[])]));const rest=subtract(available,occupied).flatMap(([a,b])=>margins.map(([m,n])=>[Math.max(a,m),Math.min(b,n)]).filter(([x,y])=>x<y));return {available,occupied,rest:union(rest),free:subtract(available,[...occupied,...rest]),unavailable:subtract([[0,1440]],available)};}
