import fs from "node:fs";
import readline from "node:readline";

const input = process.argv[2] || "tmp/fishing.geojsonseq";
const output = "data/lakes.generated.json";
if (!fs.existsSync(input)) throw new Error(`Lipsește ${input}`);

function center(geometry){
  if(!geometry) return null;
  if(geometry.type==="Point") return {lon:geometry.coordinates[0],lat:geometry.coordinates[1]};
  const coords=[];
  const walk=v=>Array.isArray(v)&&typeof v[0]==="number"?coords.push(v):Array.isArray(v)&&v.forEach(walk);
  walk(geometry.coordinates);
  if(!coords.length)return null;
  return {lon:coords.reduce((s,p)=>s+p[0],0)/coords.length,lat:coords.reduce((s,p)=>s+p[1],0)/coords.length};
}
function cleanUrl(v){if(!v)return null;const x=String(v).trim();return /^https?:\/\//i.test(x)?x:`https://${x}`}
function modes(tags){const text=Object.values(tags||{}).join(" ").toLowerCase();const out=[];if(/catch.?and.?release|no.?kill|fara retinere|fără reținere/.test(text))out.push("catch-release");if(/retinere|reținere|keep fish/.test(text))out.push("retention");return out}
function confidence(tags){let n=0;for(const k of ["name","website","contact:website","phone","contact:phone","opening_hours","addr:city","addr:county"])if(tags?.[k])n++;return n>=4?"high":n>=2?"medium":"limited"}
const seen=new Set();const lakes=[];
const rl=readline.createInterface({input:fs.createReadStream(input),crlfDelay:Infinity});
for await(const rawLine of rl){const line=rawLine.replace(/^\u001e/, "").trim();if(!line)continue;let f;try{f=JSON.parse(line)}catch{continue};const t=f.properties||{};const c=center(f.geometry);if(!c||c.lat<43.5||c.lat>48.4||c.lon<20||c.lon>30)continue;const name=t.name||t["name:ro"]||t["name:en"];if(!name)continue;const key=`${String(name).toLowerCase().replace(/\W/g,"")}:${c.lat.toFixed(4)}:${c.lon.toFixed(4)}`;if(seen.has(key))continue;seen.add(key);const osmType=t.type||"feature";const osmId=t.id||t["@id"]||`${c.lat}-${c.lon}`;lakes.push({id:`osm-${osmType}-${osmId}`,name:String(name),lat:+c.lat.toFixed(6),lon:+c.lon.toFixed(6),locality:t["addr:city"]||t["addr:village"]||t["addr:place"]||null,county:t["addr:county"]||null,website:cleanUrl(t.website||t["contact:website"]),phone:t.phone||t["contact:phone"]||null,openingHours:t.opening_hours||null,fishingModes:modes(t),sourceUrl:t["@id"]?`https://www.openstreetmap.org/${t["@id"]}`:null,confidence:confidence(t)});}
lakes.sort((a,b)=>a.name.localeCompare(b.name,"ro"));
if(lakes.length<5)throw new Error(`Import suspect: doar ${lakes.length} locații.`);
fs.writeFileSync(output,JSON.stringify(lakes,null,2)+"\n");
console.log(`Generate: ${lakes.length} locații în ${output}`);
