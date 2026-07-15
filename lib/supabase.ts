type QueryResult<T=any>={data:T|null,error:{message:string}|null}
const base=()=>process.env.NEXT_PUBLIC_SUPABASE_URL
const secret=()=>process.env.SUPABASE_SECRET_KEY
async function request<T>(path:string,init:RequestInit={}):Promise<QueryResult<T>>{
  const url=base(),key=secret(); if(!url||!key)return{data:null,error:{message:'Supabase not configured'}}
  const r=await fetch(`${url}/rest/v1/${path}`,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation',...(init.headers||{})},cache:'no-store'})
  const text=await r.text(); if(!r.ok)return{data:null,error:{message:text||r.statusText}}
  return{data:text?JSON.parse(text):null,error:null}
}
export function adminSupabase(){
  if(!base()||!secret())return null
  return{
    from(table:string){
      return{
        select(cols='*'){let filters:string[]=[];let max='';const chain:any={neq(k:string,v:string){filters.push(`${k}=neq.${encodeURIComponent(v)}`);return chain},eq(k:string,v:string){filters.push(`${k}=eq.${encodeURIComponent(v)}`);return chain},limit(n:number){max=`&limit=${n}`;return chain.then.bind(chain)},single(){return request<any[]>(`${table}?select=${encodeURIComponent(cols)}&${filters.join('&')}&limit=1`).then(x=>({data:x.data?.[0]||null,error:x.error}))},then(resolve:any,reject:any){return request<any[]>(`${table}?select=${encodeURIComponent(cols)}${filters.length?'&'+filters.join('&'):''}${max}`).then(resolve,reject)}};return chain},
        upsert(rows:any[],opts:{onConflict:string,ignoreDuplicates?:boolean}){return request<any[]>(`${table}?on_conflict=${encodeURIComponent(opts.onConflict)}`,{method:'POST',headers:{Prefer:`resolution=merge-duplicates,return=representation`},body:JSON.stringify(rows)})},
        insert(row:any){return request<any[]>(table,{method:'POST',body:JSON.stringify(row)})}
      }
    }
  }
}
