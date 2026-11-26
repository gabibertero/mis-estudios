import {generate, mins, dayKey, minRequired, phases} from './planner.mjs';

const days=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const fail=m=>{throw new Error(m)};
const string=(v,label,max=160)=>typeof v==='string'&&v.trim()&&v.length<=max?v.trim():fail(`${label}: texto inválido`);
const integer=(v,label,min,max)=>Number.isInteger(v)&&v>=min&&v<=max?v:fail(`${label}: número inválido (${min}–${max})`);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&dayKey(new Date(v+'T12:00'))===v?v:fail('Fecha inválida (AAAA-MM-DD)');
const time=(v,allowEnd=false)=>typeof v==='string'&&(/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v)||(allowEnd&&v==='24:00'))?v:fail('Hora inválida (HH:MM)');
const interval=(start,end)=>{start=time(start);end=time(end,true);if(mins(start)%5||mins(end)%5||start>=end)fail('Usá intervalos crecientes en múltiplos de cinco minutos');return {start,end};};
const list=(v,label)=>v===undefined?[]:Array.isArray(v)&&v.length<=200?v:fail(`${label}: se espera una lista de hasta 200 elementos`);
const obj=(v,keys,label)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))fail(`${label}: campos inválidos`);return v;};
const dow=v=>{const i=days.indexOf(norm(v));return i<0?fail('Día inválido: usá lunes, martes, etc.'):i;};
const same=(a,b,keys)=>keys.every(k=>a[k]===b[k]);
const overlaps=(start,end,otherStart,otherEnd,gap=0)=>mins(start)<mins(otherEnd)+gap&&mins(end)>mins(otherStart)-gap;
export function validatePlacement(state,s,now=new Date()){
 const e=state.exams.find(e=>e.id===s.exam), d=date(s.date), {start,end}=interval(s.start,s.end), duration=mins(end)-mins(start);
 if(s.done)fail('La sesión ya fue completada');
 if(!e||e.closed||new Date(d+'T'+start)<=now||d>e.date||(d===e.date&&mins(end)>mins(e.time)))fail('La sesión debe estar en el futuro y antes de su evaluación');
 if(duration<5||duration>state.settings.block)fail('La duración supera el bloque de estudio permitido');
 const day=new Date(d+'T12:00').getDay();
 if(!state.availability.some(a=>a.day===day&&a.start<=start&&a.end>=end))fail('Fuera de tu disponibilidad');
 if(state.busy.some(b=>(b.date===d||(!b.date&&b.day===day))&&overlaps(start,end,b.start,b.end)))fail('Coincide con un compromiso');
 if(state.exams.some(e=>!e.closed&&e.date===d&&mins(start)<mins(e.time)+(e.duration||120)&&mins(end)>mins(e.time)))fail('Coincide con una evaluación');
 const fixed=state.sessions.filter(t=>t.id!==s.id&&t.date===d&&(t.locked||t.done));
 if(fixed.some(t=>overlaps(start,end,t.start,t.end,state.settings.break)))fail('Coincide con una sesión fijada o completada, o con su descanso');
 if(fixed.reduce((n,t)=>n+t.minutes,0)+duration>state.settings.daily)fail('Supera el límite diario de estudio');
 return {...s,date:d,start,end,minutes:duration,locked:true};
}

export function makePrompt(state){
 const context={materias:state.subjects.map(s=>({nombre:s.name,codigo:s.corrId??null})),evaluaciones:state.exams.filter(e=>!e.closed).map(e=>({materia:state.subjects.find(s=>s.id===e.subject)?.name,tipo:e.kind,fecha:e.date,hora:e.time,duracion:e.duration,minimo:e.minimum,temas:state.topics.filter(t=>t.exam===e.id).map(t=>({nombre:t.name,minutos:t.estimate,dificultad:t.difficulty}))})),disponibilidad:state.availability.map(a=>({dia:days[a.day],desde:a.start,hasta:a.end})),compromisos:state.busy.map(b=>({nombre:b.name,...(b.date?{fecha:b.date}:{dia:days[b.day]}),desde:b.start,hasta:b.end})),sesionesFijadas:state.sessions.filter(s=>s.locked||s.done).map(s=>({materia:state.subjects.find(sub=>sub.id===state.exams.find(e=>e.id===s.exam)?.subject)?.name,tema:state.topics.find(t=>t.id===s.topic)?.name,fecha:s.date,desde:s.start,hasta:s.end,completada:s.done})),limites:state.settings};
 return `Ayudame a organizar mi estudio académico. Antes de planificar, preguntame por horarios faltantes, evaluaciones, temario y objetivos; no inventes datos. Devolveme solo JSON válido (sin comentarios) siguiendo este formato, con listas vacías cuando no necesite agregar nada. Usá fechas futuras AAAA-MM-DD, horas HH:MM de Córdoba, intervalos de 5 minutos, días en español. Las sesiones son opcionales: si se omiten, la app calcula el plan. Si las incluís, respetá disponibilidad, compromisos, descansos, fechas de examen y límites. No incluyas datos personales.\n\nFormato (ejemplo, reemplazar valores):\n${JSON.stringify({version:1,disponibilidad:[{dia:'lunes',desde:'09:00',hasta:'12:00'}],compromisos:[{nombre:'Clase de ejemplo',dia:'martes',desde:'18:00',hasta:'22:00',tipo:'clase',materia:'Nombre exacto'}],evaluaciones:[{materia:'Nombre exacto',tipo:'Parcial',fecha:'AAAA-MM-DD',hora:'18:00',duracion:120,minimo:55,temas:[{nombre:'Tema 1',minutos:60,dificultad:3,sesiones:[{fecha:'AAAA-MM-DD',desde:'09:00',hasta:'09:30',fase:'Aprender'}]}]}]},null,2)}\n\nContexto actual (conservar lo existente, agregar solo lo necesario):\n${JSON.stringify(context,null,2)}`;
}

export function parseStudyPlan(raw,state,newId,now=new Date()){
 if(typeof raw!=='string'||raw.length>200000)fail('El JSON es demasiado largo');
 let x;try{x=JSON.parse(raw.trim().replace(/^```(?:json)?\s*\n?/i,'').replace(/\n?```\s*$/,''));}catch{fail('JSON inválido. Copiá la respuesta completa de ChatGPT.');}
 obj(x,['version','disponibilidad','compromisos','evaluaciones'],'Plan');if(x.version!==1)fail('El plan debe tener version: 1');
 const draft=structuredClone(state), counts={materias:0,disponibilidad:0,compromisos:0,evaluaciones:0,temas:0,sesiones:0}, preview=[];
 const add=(key,o,keys,label,description)=>{const existing=draft[key].find(e=>same(e,o,keys));if(existing){if(Object.keys(o).some(k=>existing[k]!==o[k]))preview.push(`Se conserva el registro existente · ${description}`);return existing;}const row={...o,id:newId()};draft[key].push(row);counts[label]++;preview.push(description);return row;};
 const subject=name=>{name=string(name,'Materia');const found=draft.subjects.filter(s=>norm(s.name)===norm(name)||String(s.corrId??'')===name);if(found.length>1)fail(`Materia ambigua: ${name}`);return found[0]||add('subjects',{name,state:'manual'},['name'],'materias',`Materia · ${name}`);};
 for(const a of list(x.disponibilidad,'Disponibilidad')){obj(a,['dia','desde','hasta'],'Disponibilidad');const day=dow(a.dia),r=interval(a.desde,a.hasta);add('availability',{day,...r},['day','start','end'],'disponibilidad',`Disponible · ${a.dia} ${r.start}–${r.end}`);}
 for(const b of list(x.compromisos,'Compromisos')){obj(b,['nombre','dia','fecha','desde','hasta','tipo','materia'],'Compromiso');if(Boolean(b.dia)===Boolean(b.fecha))fail('Cada compromiso requiere día semanal o fecha');const name=string(b.nombre,'Compromiso'),kind=b.tipo??'compromiso';if(!['clase','compromiso'].includes(kind))fail('Tipo de compromiso: clase o compromiso');const dateValue=b.fecha?date(b.fecha):undefined,day=b.dia?dow(b.dia):null;if(dateValue&&dateValue<dayKey(now))fail('Compromiso con fecha pasada');const r=interval(b.desde,b.hasta),s=b.materia?subject(b.materia):null;add('busy',{name,...r,day,...(dateValue?{date:dateValue}:{}),kind,...(s?{subject:s.id}:{})},['name','date','day','start','end'],'compromisos',`${kind} · ${name} ${r.start}–${r.end}`);}
 const pending=[];let topicCount=0;
 if(list(x.evaluaciones,'Evaluaciones').length>50)fail('Máximo 50 evaluaciones por importación');for(const v of list(x.evaluaciones,'Evaluaciones')){obj(v,['materia','tipo','fecha','hora','duracion','minimo','temas'],'Evaluación');const s=subject(v.materia),kind=string(v.tipo,'Tipo'),d=date(v.fecha),t=time(v.hora);if(!['Parcial','Recuperatorio','Final','Promoción'].includes(kind))fail('Tipo de evaluación inválido');if(new Date(d+'T'+t)<=now)fail('La evaluación debe ser futura');const duration=integer(v.duracion??120,'Duración',5,360),minimum=integer(v.minimo??minRequired(kind),'Mínimo',minRequired(kind),100);if(mins(t)+duration>1440)fail('La evaluación debe finalizar el mismo día');
 const e=add('exams',{subject:s.id,kind,date:d,time:t,duration,minimum,closed:false},['subject','kind','date','time'],'evaluaciones',`${kind} · ${s.name} · ${d} ${t}`);if(e.closed)fail('La evaluación ya está cerrada');
 for(const th of list(v.temas,'Temas')){if(++topicCount>200)fail('Máximo 200 temas por importación');obj(th,['nombre','minutos','dificultad','sesiones'],'Tema');const name=string(th.nombre,'Tema'),estimate=integer(th.minutos,'Minutos',5,3000),difficulty=integer(th.dificultad??3,'Dificultad',1,5);const tp=add('topics',{exam:e.id,name,estimate,difficulty},['exam','name'],'temas',`Tema · ${s.name} / ${name}`);
 for(const ss of list(th.sesiones,'Sesiones')){obj(ss,['fecha','desde','hasta','fase'],'Sesión');const phase=ss.fase??'Aprender';if(!phases.includes(phase))fail('Fase inválida');const r=interval(ss.desde,ss.hasta);pending.push({exam:e.id,topic:tp.id,date:date(ss.fecha),...r,phase,done:false,locked:true,label:`${s.name} · ${name}`});}}
 }
 if(pending.length>200)fail('Máximo 200 sesiones por importación');
 for(const {label,...s} of pending){const existing=draft.sessions.find(t=>same(t,s,['exam','topic','date','start','end']));if(existing?.locked||existing?.done)continue;const row=validatePlacement(draft,{...s,id:existing?.id??newId()},now);if(existing)draft.sessions=draft.sessions.filter(t=>t.id!==existing.id);draft.sessions.push({...row,id:existing?newId():row.id});counts.sesiones++;preview.push(`Sesión fijada · ${label} · ${s.date} ${s.start}–${s.end}`);}
 // A new commitment or evaluation must not introduce conflicts for any preserved session.
 for(const s of state.sessions.filter(s=>s.locked&&!s.done&&new Date(s.date+'T'+s.start)>now)){
  let wasValid=true;try{validatePlacement(state,s,now)}catch{wasValid=false;}
  if(wasValid)try{validatePlacement(draft,s,now)}catch{fail('El nuevo plan entra en conflicto con sesiones ya fijadas');}
 }
 const planned=generate(draft,now);
 draft.sessions=planned.sessions;
 return {draft,counts,preview,warnings:planned.warnings};
}

// The full-backup action is separate from a ChatGPT plan. Check its field types
// before a replacement is allowed; historic optional fields remain optional.
export function validateBackup(state){
 try{
  const tables=['subjects','exams','topics','sessions','results','availability','busy'];
  const indexes=new Map();for(const key of tables){if(!Array.isArray(state[key])||state[key].length>10000)return false;const ids=new Set();for(const row of state[key]){if(typeof row?.id!=='string'||!row.id||ids.has(row.id))return false;ids.add(row.id);}indexes.set(key,ids);}
  const has=(table,id)=>typeof id==='string'&&indexes.get(table).has(id);
  for(const s of state.subjects)string(s.name,'Materia',2000);
  for(const e of state.exams){if(!has('subjects',e.subject)||!['Parcial','Recuperatorio','Final','Promoción'].includes(e.kind))return false;date(e.date);time(e.time);integer(e.duration??120,'Duración',5,360);integer(e.minimum,'Mínimo',0,100);}
  for(const t of state.topics){if(!has('exams',t.exam))return false;string(t.name,'Tema',2000);integer(t.estimate,'Minutos',5,3000);integer(t.difficulty,'Dificultad',1,5);}
  for(const s of state.sessions){if(!has('exams',s.exam)||!has('topics',s.topic)||!phases.includes(s.phase))return false;date(s.date);interval(s.start,s.end);integer(s.minutes,'Minutos',5,1440);}
  for(const r of state.results){if(!has('exams',r.exam)||typeof r.at!=='string'||!Number.isFinite(Date.parse(r.at)))return false;integer(r.percent,'Resultado',0,100);}
  for(const a of state.availability){integer(a.day,'Día',0,6);interval(a.start,a.end);}
  for(const b of state.busy){string(b.name,'Compromiso',2000);if(b.date)date(b.date);else integer(b.day,'Día',0,6);interval(b.start,b.end);}
  return true;
 }catch{return false;}
}
