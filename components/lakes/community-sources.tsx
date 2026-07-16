export function CommunitySources({ name, sourceUrl }:{ name:string; sourceUrl?:string }) {
  const q=encodeURIComponent(`${name} pescuit balta`); const fq=encodeURIComponent(`${name} pescuit forum`);
  return <section className="detail-panel source-panel"><p className="section-kicker">SURSE ȘI VERIFICARE</p><h2>Verifică înainte să pleci</h2><p>FishCast combină date publice cu căutări comunitare. Programul, taxele și regulamentul se pot schimba.</p><div className="source-actions">
    {sourceUrl&&<a href={sourceUrl} target="_blank" rel="noreferrer">Sursa cartografică</a>}
    <a href={`https://duckduckgo.com/?q=${q}`} target="_blank" rel="noreferrer">Caută pagina oficială</a>
    <a href={`https://duckduckgo.com/?q=${fq}`} target="_blank" rel="noreferrer">Caută forumuri și discuții</a>
  </div></section>;
}
