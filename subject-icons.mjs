// Original line icons, shared by subject cards and calendar items.
const shapes = [
 'M3 19h18M5 16l4-8 4 5 6-9', 'M4 19 12 4l8 15ZM8 12h8',
 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3v18',
 'M4 5h16v11H9l-5 4ZM8 9h8M8 12h5', 'M5 5h5v5H5zM14 14h5v5h-5zM10 7h6v7',
 'M8 5 2 12l6 7m8-14 6 7-6 7M14 4l-4 16', 'M6 6h12v12H6zM9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
 'M3 5h7v5H3zM14 14h7v5h-7zM10 7h5v7M8 10v7h6', 'M3 19h18M4 16c5 0 4-11 9-11s3 11 8 11',
 'M6 20V8m12 12V8M4 8h16M12 4v4M8 14h8', 'M4 20v-4a4 4 0 0 1 8 0v4M16 20v-5a3 3 0 0 1 5 0v5M8 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
 'M3 5h12v10H8l-5 4ZM16 9h5v8l-4-2M7 9h4', 'M7 3H4v18h3m10-18h3v18h-3M10 9h4m-4 6h4',
 'M4 5h5v5H4zM15 5h5v5h-5zM9 16h6v5H9zM6.5 10v3h11v-3M12 13v3', 'M3 4h18v14H3zM8 21h8M7 8l3 3-3 3m5 0h5',
 'M3 4h7v7H3zM14 4h7v7h-7zM3 15h7v6H3zM14 15h7v6h-7z', 'M4 20V4M4 20h17M8 16v-3m4 3V8m4 8v-5m4 5V5',
 'M3 20h18M5 16l5-5 4 2 6-8M16 5h4v4', 'M4 6c0-4 16-4 16 0v12c0 4-16 4-16 0ZM4 6c0 4 16 4 16 0M4 12c0 4 16 4 16 0',
 'M3 4h18v16H3zM3 8h18M8 12l-3 2 3 2m8-4 3 2-3 2', 'M2 12h4l3-7 6 14 3-7h4',
 'M4 5h16M7 5v14M13 8h7M13 13h7M13 18h7', 'M3 4h18v16H3zM3 10h18M10 10v10M13 14h5m-5 3h5',
 'M12 3v17m-7 0h14M4 7h16M7 7 3 15h8Zm10 0-4 8h8Z', 'M5 3h14v18H5zM8 8l2 2 5-5M8 15h8M8 18h6',
 'M9 3h6v5H9zM2 16h6v5H2zM16 16h6v5h-6zM12 8v5M5 16v-3h14v3', 'M4 20h16M6 16l4-7 4 4 4-8M6 16h12',
 'M12 3 21 8v8l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v8', 'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.2 2.2m8.4 8.4 2.2 2.2m0-12.8-2.2 2.2m-8.4 8.4-2.2 2.2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
 'M3 6h18v14H3zM8 6V3h8v3M3 12h18M11 11v3h2v-3', 'M12 3v18M7 5H5v6H3v4h5v4h4m5-14h2v6h2v4h-5v4h-4',
 'M4 4h16v16H4zM4 9h16M9 9v11M14 12h3m-3 4h3', 'M3 4h18v16H3zM7 8h4v8H7zM14 8h3v3h-3zM14 14h3v2h-3z',
 'M4 7h16v12H4zM8 7V4h8v3M9 12h6m-3-3v6', 'M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6ZM9 12l2 2 4-4',
 'M12 3 3 9l9 6 9-6ZM6 11v6l6 3 6-3v-6'
];
const normalize = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const keywords = ['analisis matematico i','algebra','fisica i','ingles i','logica','algoritmo','arquitectura','proceso de negocios','analisis matematico ii','fisica ii','sociedad','ingles ii','sintaxis','paradigma','sistemas operativos','analisis de sistemas','probabilidad','economia','base de datos','desarrollo de software','comunicacion','numerico','diseno de sistemas','legislacion','calidad de software','redes','investigacion operativa','simulacion','automatizacion','administracion de sistemas','inteligencia artificial','ciencia de datos','sistemas de gestion','gestion gerencial','seguridad','proyecto final'];
const fallback='M4 5h7a3 3 0 0 1 3 3v13a4 4 0 0 0-4-3H4Zm10 3a3 3 0 0 1 3-3h3v13h-3a4 4 0 0 0-3 3';
export function subjectIcon(subject={}) {
 const n=Number(subject.corrId), name=normalize(subject.name);
 const match=keywords.map((k,i)=>({k,i})).sort((a,b)=>b.k.length-a.k.length).find(({k})=>name.includes(k));
 const i=Number.isInteger(n)&&n>=1&&n<=shapes.length?n-1:match?.i;
 return `<span class="subject-icon" data-tone="${(i??0)%6}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="${shapes[i]??fallback}"/></svg></span>`;
}
const navPaths=['M3 10 12 3l9 7v11H3zM9 21v-8h6v8','M4 5h16v16H4zM4 10h16M8 3v4M16 3v4','M4 4h7v16H4zM13 4h7v16h-7z','M6 3h12v18H6zM9 9l2 2 4-4M9 15h6','M4 4h16v16H4zM8 8h8M8 12h5M8 16h8','M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2','M4 20V4M4 20h16M8 16v-4m4 4V7m4 9v-6','M12 3v3m0 12v3M3 12h3m12 0h3M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z'];
export const navIcon=i=>`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"><path d="${navPaths[i]}"/></svg>`;
