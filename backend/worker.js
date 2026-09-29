const HEADERS = {"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*","access-control-allow-headers":"content-type","access-control-allow-methods":"GET,POST,OPTIONS"};

export default { async fetch(request, env) {
  if (request.method === "OPTIONS") return new Response("", {headers:HEADERS});
  const url = new URL(request.url);
  try {
    if (url.pathname === "/api/auth" && request.method === "POST") return auth(request, env);
    if (url.pathname === "/api/player/sync" && request.method === "POST") return playerSync(request, env);
    if (url.pathname === "/api/leaderboard" && request.method === "GET") return leaderboard(env);
    if (url.pathname === "/api/admin/players" && request.method === "POST") return adminPlayers(request, env);
    if (url.pathname === "/api/telegram" && request.method === "POST") return telegram(request, env);
    if (url.pathname === "/api/health") return json({ok:true, service:"put-ofitsera-access"});
    return json({ok:false,error:"not_found"},404);
  } catch (e) { return json({ok:false,error:"server_error"},500); }
} };

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS});}
async function body(request){try{return await request.json()}catch{return {}}}

async function auth(request,env){
  const {initData} = await body(request);
  if (!initData || !(await validInitData(initData,env.BOT_TOKEN))) return json({ok:false,error:"invalid_telegram_data"},401);
  const p = new URLSearchParams(initData);
  const user = JSON.parse(p.get("user")||"{}");
  if (!user.id) return json({ok:false,error:"no_user"},401);
  const id=String(user.id);
  if (isAdmin(id,env)) return json({ok:true,status:"approved",role:"admin",user:safeUser(user)});
  const key=`user:${id}`;
  let record=await env.ACCESS.get(key,"json");
  if (!record){
    record={status:"pending",user:safeUser(user),createdAt:new Date().toISOString()};
    await env.ACCESS.put(key,JSON.stringify(record));
    await notifyAdmin(env,record);
  } else if (record.user?.username !== user.username || record.user?.first_name !== user.first_name || record.user?.last_name !== user.last_name) {
    record.user=safeUser(user);
    await env.ACCESS.put(key,JSON.stringify(record));
  }
  return json({ok:true,status:record.status,role:"player",user:record.user});
}

async function playerSync(request,env){
  const {initData,stats} = await body(request);
  const user = await verifiedUser(initData,env);
  if (!user) return json({ok:false,error:"invalid_telegram_data"},401);
  const id=String(user.id);
  const admin=isAdmin(id,env);
  const access=await env.ACCESS.get(`user:${id}`,"json");
  if (!admin && access?.status !== "approved") return json({ok:false,error:"access_required"},403);
  const clean=safeStats(stats);
  const key=`player:${id}`;
  const old=await env.ACCESS.get(key,"json");
  const now=new Date().toISOString();
  const record={user:safeUser(user),stats:clean,updatedAt:now,lastSeenAt:now,status:"approved"};
  if (old?.createdAt) record.createdAt=old.createdAt;
  await env.ACCESS.put(key,JSON.stringify(record));
  return json({ok:true,stats:clean});
}

async function leaderboard(env){
  const players=await collectPlayers(env,false);
  players.sort(comparePlayers);
  return json({ok:true,players:players.slice(0,50).map(publicPlayer)});
}

async function adminPlayers(request,env){
  const {initData}=await body(request);
  const user=await verifiedUser(initData,env);
  if (!user || !isAdmin(String(user.id),env)) return json({ok:false,error:"forbidden"},403);
  const [players,requests]=await Promise.all([collectPlayers(env,true),countAccess(env)]);
  players.sort(comparePlayers);
  return json({ok:true,totalApproved:players.length,totalRequests:requests,players});
}

async function collectPlayers(env,includeId){
  const keys=[];let cursor;
  do {
    const page=await env.ACCESS.list({prefix:"player:",limit:1000,...(cursor?{cursor}:{})});
    for(const k of page.keys) keys.push(k.name);
    cursor=page.list_complete?null:page.cursor;
  } while(cursor);
  const out=[];
  for(let i=0;i<keys.length;i+=100){
    const chunk=keys.slice(i,i+100);
    const values=await env.ACCESS.get(chunk,"json");
    for(const key of chunk){
      const p=values.get(key);
      if(p?.status==="approved" || p?.stats) out.push(includeId?adminPlayer(p,key):p);
    }
  }
  return out;
}

async function countAccess(env){
  let total=0,cursor;
  do {
    const page=await env.ACCESS.list({prefix:"user:",limit:1000,...(cursor?{cursor}:{})});
    total+=page.keys.length;
    cursor=page.list_complete?null:page.cursor;
  } while(cursor);
  return total;
}

function publicPlayer(p){return {user:p.user,stats:p.stats||{}}}
function adminPlayer(p,key){return {...p,id:key.slice("player:".length)}}
function comparePlayers(a,b){
  const sa=a.stats||{},sb=b.stats||{};
  return (Number(sb.rank)||0)-(Number(sa.rank)||0)
    || (Number(sb.clicks)||0)-(Number(sa.clicks)||0)
    || (Number(sb.medals)||0)-(Number(sa.medals)||0)
    || (Number(sb.prestige)||0)-(Number(sa.prestige)||0);
}
function safeStats(s){
  s=s&&typeof s==="object"?s:{};
  const int=(v,min=0,max=100000000)=>Math.max(min,Math.min(max,Math.floor(Number(v)||0)));
  return {
    rank:int(s.rank,0,16),clicks:int(s.clicks),credits:int(s.credits),prestige:int(s.prestige),medals:int(s.medals),
    missionsCompleted:int(s.missionsCompleted),achievements:int(s.achievements),items:int(s.items),energy:int(s.energy,0,1000),
    rating:int(s.rating,0,1000000),wins:int(s.wins),losses:int(s.losses),attack:int(s.attack,0,100000),defense:int(s.defense,0,100000),power:int(s.power,0,200000)
  };
}

async function verifiedUser(initData,env){
  if (!initData || !(await validInitData(initData,env.BOT_TOKEN))) return null;
  try {
    const p=new URLSearchParams(initData);const user=JSON.parse(p.get("user")||"{}");
    return user?.id?user:null;
  } catch { return null; }
}

async function telegram(request,env){
  const update=await body(request);
  if (update.message) {
    const message=update.message;
    const chatId=message.chat?.id;
    const text=String(message.text||"").trim();
    if (chatId && message.chat?.type === "private") {
      if (text === "/start" || text === "привет" || text === "Привет") {
        const admin=isAdmin(String(message.from?.id||""),env);
        const reply=admin
          ? "👋 Бот работает. Webhook подключён.\n\nОткройте приложение «Путь офицера», чтобы проверить доступ и управлять заявками."
          : "👋 Бот работает.\n\nОткройте приложение «Путь офицера» для проверки доступа. Если доступ ещё не одобрен, заявка будет отправлена владельцу.\n\nЕсли вы уже получили одобрение — просто откройте приложение ещё раз.";
        await tg(env,"sendMessage",{chat_id:chatId,text:reply});
      }
    }
    return json({ok:true});
  }
  if (!update.callback_query) return json({ok:true});
  const cb=update.callback_query;
  const fromId=String(cb.from?.id||"");
  if(!isAdmin(fromId,env)) return json({ok:false,error:"forbidden"},403);
  const data=String(cb.data||"");
  const [action,id]=data.split(":");
  if(!["approve","deny"].includes(action)||!id) return json({ok:true});
  const key=`user:${id}`;
  const record=await env.ACCESS.get(key,"json");
  if(!record) return json({ok:true});
  record.status=action==="approve"?"approved":"denied";
  record.updatedAt=new Date().toISOString();
  await env.ACCESS.put(key,JSON.stringify(record));
  const text=action==="approve"?`✅ Доступ разрешён\n\nИгрок: ${display(record.user)}`:`❌ Доступ отклонён\n\nИгрок: ${display(record.user)}`;
  await tg(env,"answerCallbackQuery",{callback_query_id:cb.id,text:action==="approve"?"Доступ разрешён":"Доступ отклонён"});
  await tg(env,"editMessageText",{chat_id:cb.message.chat.id,message_id:cb.message.message_id,text});
  return json({ok:true});
}

async function notifyAdmin(env,record){
  const u=record.user;
  const text=`🆕 ЗАПРОС НА ДОСТУП\n\n👤 ${display(u)}\n🆔 ${u.id}\n\nРазрешить игроку доступ к закрытой бете?`;
  await tg(env,"sendMessage",{chat_id:env.ADMIN_CHAT_ID,text,reply_markup:{inline_keyboard:[[{text:"✅ Разрешить",callback_data:`approve:${u.id}`},{text:"❌ Отклонить",callback_data:`deny:${u.id}`}]]}});
}
function display(u){return u.username?`@${u.username}`:[u.first_name,u.last_name].filter(Boolean).join(" ")||String(u.id)}
function safeUser(u){return {id:String(u.id),username:u.username||null,first_name:u.first_name||"",last_name:u.last_name||"",language_code:u.language_code||null};}
function isAdmin(id,env){return String(env.ADMIN_CHAT_ID)===String(id)||(env.ADMIN_IDS||"").split(",").map(x=>x.trim()).includes(String(id));}
async function tg(env,method,payload){const r=await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});return r.json();}
async function validInitData(initData,token){
  const p=new URLSearchParams(initData);const hash=p.get("hash");if(!hash)return false;p.delete("hash");
  const data=[...p.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join("\n");
  const secret=await crypto.subtle.importKey("raw",new TextEncoder().encode("WebAppData"),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const tokenKey=await crypto.subtle.sign("HMAC",secret,new TextEncoder().encode(token));
  const key=await crypto.subtle.importKey("raw",tokenKey,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(data)));
  const got=hex(sig);if(got!==hash)return false;
  const authDate=Number(p.get("auth_date")||0);return authDate>0 && (Date.now()/1000-authDate)<86400;
}
function hex(a){return [...a].map(b=>b.toString(16).padStart(2,"0")).join("");}