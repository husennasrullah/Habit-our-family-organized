// Deterministic vector logo package. Uses the project's existing Sharp dependency for previews.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, 'docs/brand/habit-v3');
fs.mkdirSync(dir, { recursive: true });
const brand = fs.readFileSync(path.join(root, 'frontend/components/brand/HabitWordmark.tsx'), 'utf8');
const letters = brand.match(/<g fill="currentColor">([\s\S]*?)<\/g>/)[1].replaceAll('fillRule=', 'fill-rule=');
const colors = {
  color: { ink:'#007F5B', accent:'#F5B942' },
  dark: { ink:'#93E2BF', accent:'#F5C763' },
  mono: { ink:'#183C32', accent:'#183C32' },
  white: { ink:'#FFFFFF', accent:'#FFFFFF' },
};
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const wrap = (w,h,body,title,desc='') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="title desc"><title id="title">${escape(title)}</title><desc id="desc">${escape(desc)}</desc>${body}</svg>\n`;
const symbol = (ink,accent,concept='together') => {
 if(concept==='home')return `<g fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 29 32 10 54 29M16 26v28m32-28v28M16 40h32"/></g><circle cx="32" cy="27" r="4" fill="${accent}"/>`;
 if(concept==='grow')return `<g fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M32 55V36C18 38 9 29 11 16c13-1 21 7 21 20 0-13 9-21 22-20 1 13-8 22-22 20"/></g><circle cx="32" cy="12" r="5" fill="${accent}"/>`;
 return `<g fill="none" stroke="${ink}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"><path d="M14 20v30M50 20v30"/><path d="M14 32c9 13 27 13 36 0"/></g><circle cx="32" cy="18" r="5.5" fill="${accent}"/>`;
};
const word = (ink,accent=ink) => `<g fill="${ink}">${letters}<circle cx="410.5" cy="22.5" r="22.5" fill="${accent}"/></g>`;
const layouts = (c,concept='together') => ({
 icon: [64,64,symbol(c.ink,c.accent,concept)],
 horizontal:[240,80,`<g transform="translate(4 8)">${symbol(c.ink,c.accent,concept)}</g><g transform="translate(80 22) scale(.26)">${word(c.ink)}</g>`],
 stacked:[240,208,`<g transform="translate(72 14) scale(1.5)">${symbol(c.ink,c.accent,concept)}</g><g transform="translate(30 135) scale(.34)">${word(c.ink)}</g>`],
 wordmark:[530,154,word(c.ink,c.accent)],
 app:[512,512,`<rect width="512" height="512" rx="112" fill="${c.ink==='#FFFFFF'?'#183C32':c.ink==='#93E2BF'?'#142C24':c.ink}"/><g transform="translate(56 56) scale(6.25)">${symbol(c.ink==='#93E2BF'?c.ink:'#FFFFFF',c.ink===c.accent?'#FFFFFF':c.accent,concept)}</g>`],
});
const files=[];
for(const [name,c] of Object.entries(colors))for(const [layout,[w,h,body]] of Object.entries(layouts(c))){
 const filename=`habit-hadir-bersama-${layout}-${name}.svg`;
 fs.writeFileSync(path.join(dir,filename),wrap(w,h,body,'Habit — Hadir Bersama','Huruf H yang saling merangkul, dengan titik hangat di tengah. Identitas aplikasi keseharian keluarga.'));
 files.push(filename);
}
for(const [concept,label] of [['home','ritme-rumah'],['grow','tumbuh-bersama']])for(const layout of ['icon','horizontal']){
 const [w,h,body]=layouts(colors.color,concept)[layout];const name=`habit-alternatif-${label}-${layout}.svg`;
 fs.writeFileSync(path.join(dir,name),wrap(w,h,body,`Habit — ${label}`));files.push(name);
}
// Full-bleed PWA/maskable source: the foreground fits inside the central 80%-diameter safe circle.
const pwa = wrap(512,512,`<rect width="512" height="512" fill="#007F5B"/><g transform="translate(56 56) scale(6.25)">${symbol('#FFFFFF','#F5B942')}</g>`,'Habit — app icon');
fs.writeFileSync(path.join(dir,'habit-hadir-bersama-pwa.svg'),pwa);files.push('habit-hadir-bersama-pwa.svg');
const label=(x,y,text,size=16,fill='#60756C',weight=400)=>`<text x="${x}" y="${y}" font-family="DejaVu Sans, sans-serif" font-size="${size}" fill="${fill}" font-weight="${weight}">${escape(text)}</text>`;
const hero=layouts(colors.color).horizontal[2];
const board=wrap(1560,1120,`
<rect width="1560" height="1120" fill="#FAF8F2"/>
${label(64,58,'HABIT / IDENTITAS VISUAL',16,'#007F5B',700)}${label(1080,58,'13 NOV 2026 · KONSEP V3',14)}
<rect x="56" y="98" width="1448" height="432" rx="28" fill="#FFFFFF"/>
${label(104,150,'PILIHAN UTAMA · HADIR BERSAMA',13,'#007F5B',700)}
<g transform="translate(98 205) scale(2.6)">${hero}</g>
${label(114,461,'Kebiasaan kecil. Keluarga lebih dekat.',26,'#294B3F',500)}
<rect x="1130" y="186" width="220" height="220" rx="50" fill="#007F5B"/>
<g transform="translate(1154 210) scale(2.69)">${symbol('#FFFFFF','#F5B942')}</g>
${label(1162,450,'IKON APLIKASI',13,'#60756C',600)}
${[56,552,1048].map(x=>`<rect x="${x}" y="562" width="456" height="346" rx="24" fill="#FFFFFF"/>`).join('')}
${label(88,605,'01 / HADIR BERSAMA',14,'#007F5B',700)}
<g transform="translate(96 634) scale(1.65)">${symbol('#007F5B','#F5B942')}</g>
${label(88,781,'H sebagai inisial Habit.',20,'#183C32',600)}
${label(88,815,'Dua sisi terhubung; satu pusat perhatian.',15)}
${label(88,843,'Hangat, sederhana, mudah dikenali.',15)}
<rect x="88" y="867" width="114" height="23" rx="11" fill="#E7F3EC"/>${label(100,883,'DIREKOMENDASIKAN',9,'#007F5B',700)}
${label(584,605,'02 / RITME RUMAH',14,'#536B61',700)}
<g transform="translate(592 634) scale(1.65)">${symbol('#007F5B','#F5B942','home')}</g>
${label(584,781,'Rumah dengan monogram H.',20,'#183C32',600)}
${label(584,815,'Menekankan ruang keluarga yang tertata.',15)}
${label(584,843,'Lebih dekat dengan ikon sebelumnya.',15)}
${label(1080,605,'03 / TUMBUH BERSAMA',14,'#536B61',700)}
<g transform="translate(1088 634) scale(1.65)">${symbol('#007F5B','#F5B942','grow')}</g>
${label(1080,781,'Dua bentuk tumbuh dari satu pusat.',20,'#183C32',600)}
${label(1080,815,'Menekankan perkembangan dan kebiasaan.',15)}
${label(1080,843,'Lebih organik dan ekspresif.',15)}
${label(64,957,'PALET / KELUARGA, KEHANGATAN, KEJELASAN',12,'#60756C',700)}
<rect x="64" y="980" width="310" height="64" rx="14" fill="#007F5B"/>${label(84,1019,'Emerald · #007F5B',16,'#FFFFFF',500)}
<rect x="390" y="980" width="260" height="64" rx="14" fill="#F5B942"/>${label(410,1019,'Amber · #F5B942',16,'#183C32',500)}
<rect x="666" y="980" width="260" height="64" rx="14" fill="#183C32"/>${label(686,1019,'Forest · #183C32',16,'#FFFFFF',500)}
${label(1000,1009,'Keluarga · Kebiasaan · Kebersamaan',17,'#183C32',500)}
${label(1000,1037,'Vektor murni / bentuk utuh / tanpa efek dekoratif',13)}
`,'Habit — logo concepts','Konsep Hadir Bersama sebagai pilihan utama, dengan alternatif Ritme Rumah dan Tumbuh Bersama.');
fs.writeFileSync(path.join(dir,'habit-logo-presentation.svg'),board);
const usage=wrap(1560,900,`<rect width="1560" height="900" fill="#FAF8F2"/>${label(64,62,'HABIT / HADIR BERSAMA',18,'#007F5B',700)}
<rect x="56" y="102" width="700" height="340" rx="26" fill="#FFFFFF"/><g transform="translate(120 180) scale(2)">${hero}</g>${label(88,402,'UTAMA / DI ATAS PUTIH & CREAM',12)}
<rect x="788" y="102" width="716" height="340" rx="26" fill="#142C24"/><g transform="translate(858 180) scale(2)">${layouts(colors.dark).horizontal[2]}</g>${label(820,402,'TERANG / DI ATAS LATAR GELAP',12,'#B7CDBF')}
<rect x="56" y="474" width="700" height="340" rx="26" fill="#FFFFFF"/>${label(88,520,'PROPORSI SIDEBAR',12,'#60756C',700)}
<g transform="translate(104 565) scale(.65)">${hero}</g>${label(161,630,'Ruang keluarga kita',12)}
${label(88,709,'Ikon dan nama diperlakukan sebagai satu kesatuan.',17,'#183C32')}${label(88,742,'Nama lebih rendah dari ikon; ruang kosong tetap terjaga.',15)}
<rect x="788" y="474" width="716" height="340" rx="26" fill="#FFFFFF"/>${label(820,520,'SATU WARNA / UKURAN KECIL',12,'#60756C',700)}
<g transform="translate(830 566) scale(1)">${symbol('#183C32','#183C32')}</g><g transform="translate(940 586) scale(.53)">${symbol('#183C32','#183C32')}</g><g transform="translate(1020 596) scale(.375)">${symbol('#183C32','#183C32')}</g><g transform="translate(1084 604) scale(.25)">${symbol('#183C32','#183C32')}</g>
${label(830,692,'64 px',13)}${label(940,692,'34 px',13)}${label(1020,692,'24 px',13)}${label(1084,692,'16 px',13)}
${label(820,748,'Tetap dikenali tanpa warna atau detail tambahan.',16,'#183C32')}
`,'Habit — logo applications');
fs.writeFileSync(path.join(dir,'habit-logo-usage.svg'),usage);
(async()=>{
 await sharp(Buffer.from(board)).png().toFile(path.join(dir,'habit-logo-presentation.png'));
 await sharp(Buffer.from(usage)).png().toFile(path.join(dir,'habit-logo-usage.png'));
 await sharp(Buffer.from(fs.readFileSync(path.join(dir,'habit-hadir-bersama-horizontal-color.svg')))).resize(1200,400).png().toFile(path.join(dir,'habit-logo-primary.png'));
 await sharp(Buffer.from(pwa)).resize(512,512).png().toFile(path.join(dir,'habit-app-icon-512.png'));
 for(const size of [16,24,34,64])await sharp(Buffer.from(fs.readFileSync(path.join(dir,'habit-hadir-bersama-icon-color.svg')))).resize(size,size).png().toFile(path.join(dir,`habit-symbol-${size}.png`));
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({name:'Habit',concept:'Hadir Bersama',generated:'2026-11-13',files},null,2)+'\n');
 console.log(`Created ${files.length} production SVG assets, two presentation SVG/PNG boards and raster exports.`);
})().catch(error=>{console.error(error);process.exitCode=1});
