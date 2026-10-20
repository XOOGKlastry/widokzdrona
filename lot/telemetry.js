/* Flight Inspector: pure telemetry parsing, seconds and WGS84 degrees. */
(function(root){
'use strict';
const num=v=>v===null||v===undefined||String(v).trim()===''?null:(Number.isFinite(Number(v))?Number(v):null);
const key=s=>s.split(':').pop().toLowerCase().replace(/[^a-z0-9]/g,'');
function flatten(o,out={}){for(const [k,v] of Object.entries(o||{})){if(v&&typeof v==='object'&&!Array.isArray(v))flatten(v,out);else out[key(k)]=v;}return out;}
function row(o){
const p=flatten(o),get=(...names)=>{for(const n of names){const v=num(p[key(n)]);if(v!==null)return v;}return null;};
const angle=(...names)=>{const n=get(...names);return n===null?null:((n%360)+360)%360;};
return {t:get('t','start','SampleTime','timeSeconds','seconds'),end:get('end'),
lat:get('latitude','lat','GPSLatitude'),lon:get('longitude','lon','GPSLongitude'),
relative:get('relative','relativeAltitude','rel_alt','height_m'),absolute:get('absolute','absoluteAltitude','abs_alt'),
camera:angle('camera','GimbalYaw','GimbalYawDegree','camera_yaw'),drone:angle('drone','DroneYaw','FlightYawDegree','drone_yaw'),
pitch:get('pitch','GimbalPitch','GimbalPitchDegree','camera_pitch')};
}
function validGPS(r){return r&&Number.isFinite(r.lat)&&Number.isFinite(r.lon)&&Math.abs(r.lat)<=85.05112878&&Math.abs(r.lon)<=180;}
function finalize(rows){
const valid=rows.filter(r=>Number.isFinite(r.t)&&r.t>=0).sort((a,b)=>a.t-b.t);
const clean=[];for(const r of valid){if(clean.length&&clean[clean.length-1].t===r.t){const old=clean[clean.length-1];for(const k of Object.keys(r))if(r[k]!==null)old[k]=r[k];}else clean.push({...r});}
for(let i=0;i<clean.length;i++){const r=clean[i];if(!Number.isFinite(r.end)||r.end<=r.t)r.end=Math.min(clean[i+1]?.t??r.t+1,r.t+2);}
if(!clean.length)throw Error('Brak próbek z czasem w sekundach. Obsługiwane: SRT, CSV/JSON opisane w instrukcji.');
return clean;
}
function parseSRT(text){
const rows=[];
for(const block of text.replace(/\r/g,'').split(/\n\s*\n/)){
const m=block.match(/(\d+):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d+):(\d{2}):(\d{2})[,.](\d{3})/);if(!m)continue;
const fields={};for(const x of block.matchAll(/([A-Za-z_][A-Za-z_0-9]*)\s*[:=]\s*([-+]?\d+(?:\.\d+)?)/g))fields[x[1]]=x[2];
const r=row(fields),time=i=>Number(m[i])*3600+Number(m[i+1])*60+Number(m[i+2])+Number(m[i+3])/1000;r.t=time(1);r.end=time(5);rows.push(r);
}return finalize(rows);
}
function csv(text){
const lines=text.trim().split(/\r?\n/),delimiter=lines[0].includes(';')?';':',';
function split(s){const out=[];let value='',quote=false;for(let i=0;i<s.length;i++){if(s[i]==='"'){if(quote&&s[i+1]==='"'){value+='"';i++;}else quote=!quote;}else if(s[i]===delimiter&&!quote){out.push(value);value='';}else value+=s[i];}out.push(value);return out;}
const headers=split(lines.shift());return lines.filter(s=>s.trim()).map(s=>Object.fromEntries(split(s).map((v,i)=>[headers[i]||'',v])));
}
function parse(text,filename){
text=text.replace(/^\uFEFF/,'');
if(/\.srt$/i.test(filename))return parseSRT(text);
let data;
if(/\.csv$/i.test(filename))data=csv(text);
else {try{data=JSON.parse(text);}catch{throw Error('Nieobsługiwany plik. Surowe DJI FlightRecord TXT/DAT wymagają dekodowania do CSV/JSON.');}}
const entries=Array.isArray(data)?data:data.samples||data.frames||[data],rows=[];
for(const entry of entries){
const groups={};for(const [k,v] of Object.entries(entry)){if(/^Doc[\d-]+:/.test(k)){const at=k.lastIndexOf(':'),g=k.slice(0,at);(groups[g]??={})[k.slice(at+1)]=v;}}
if(Object.keys(groups).length)for(const g of Object.values(groups))rows.push(row(g));else rows.push(row(entry));
}
return finalize(rows);
}
function sampleAt(rows,t){let a=0,b=rows.length-1,last=-1;while(a<=b){const m=(a+b)>>1;if(rows[m].t<=t){last=m;a=m+1;}else b=m-1;}return last>=0&&t<rows[last].end?rows[last]:null;}
const api={num,row,validGPS,finalize,parse,parseSRT,sampleAt};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FlightTelemetry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
