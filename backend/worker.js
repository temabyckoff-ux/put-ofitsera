const HEADERS = {"content-type":"application/json; charset=utf-8","access-control-allow-origin":"*","access-control-allow-headers":"content-type","access-control-allow-methods":"GET,POST,OPTIONS"};

export default { async fetch(request, env) {
  if (request.method === "OPTIONS") return new Response("", {headers:HEADERS});
  const url = new URL(request.url);
  try {
    if (url.pathname === "/api/auth" && request.method === "POST") return auth(request, env);
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
  }
  return json({ok:true,status:record.status,role:"player",user:record.user});
}

async function telegram(request,env){
  const update=await body(request);

  // Telegram sends ordinary chat messages here too. The previous version
  // silently acknowledged them, which made the bot look unresponsive even
  // though the webhook itself was working. Keep callback handling below and
  // provide a small reply for private-chat messages.
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