// ========= API CONFIG =========
// After hosting backend on Render, set this:
const API_BASE = "http://localhost:3000"; 
// Later -> "https://your-render-backend.onrender.com"

// ========= PRICES / OPTIONS =========
const BASE_PRICES = {
  Discord: { Basic: 10, Standard: 20, Premium: 40 },
  Minecraft: { Basic: 12, Standard: 30, Premium: 55 }
};
const ADDON_PRICE = {
  Discord: { Basic: 4, Standard: 5, Premium: 7 },
  Minecraft: { Basic: 5, Standard: 7, Premium: 10 }
};

const OPTIONS = {
  Discord: {
    Basic: { min: 2, options: ["Create channels & categories","Setup roles","Setup permissions","Add moderation bot"]},
    Standard: { min: 3, options: ["Ticket system","Auto role system","Welcome setup","Server security"]},
    Premium: { min: 3, options: ["Custom embeds","Full automation","Custom design theme","Staff tools"]}
  },
  Minecraft: {
    Basic: { min: 2, options: ["Setup Minecraft server","Install plugins","Basic configuration"]},
    Standard: { min: 3, options: ["10 plugins setup","LuckPerms setup","Spawn setup","Performance optimization"]},
    Premium: { min: 3, options: ["Full network setup","Premium plugin config","Anti-cheat setup","Support included"]}
  }
};

const $ = (id)=>document.getElementById(id);
$("year").textContent = new Date().getFullYear();

const serviceEl = $("service");
const packageEl = $("package");
const userEl = $("discordUser");
const emailEl = $("email");
const notesEl = $("notes");

const optionsBox = $("optionsBox");
const optionsContent = $("optionsContent");
const minLabel = $("minLabel");
const checks = $("checks");
const optError = $("optError");

const liveTotal = $("liveTotal");

const invoice = $("invoice");
const invNumber = $("invNumber");
const invService = $("invService");
const invPackage = $("invPackage");
const invOptions = $("invOptions");
const invTotal = $("invTotal");

const copyBtn = $("copyInvoice");
const copyMsg = $("copyMsg");

document.querySelector(".optionsToggle").addEventListener("click", ()=>{
  optionsContent.classList.toggle("hidden");
});

function invoiceNo(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const r = Math.floor(1000 + Math.random()*9000);
  return `INV-${yyyy}${mm}${dd}-${r}`;
}

function selectedOptions(){
  return [...checks.querySelectorAll("input:checked")].map(i=>i.value);
}

function calcTotal(service, pkg, count){
  if(!service || !pkg) return 0;
  const base = BASE_PRICES[service][pkg];
  const min = OPTIONS[service][pkg].min;
  const perAddon = ADDON_PRICE[service][pkg];
  const extra = Math.max(0, count - min);
  return base + extra * perAddon;
}

function updateTotal(){
  const s = serviceEl.value;
  const p = packageEl.value;
  const count = selectedOptions().length;
  liveTotal.textContent = "$" + calcTotal(s,p,count);
}

function renderOptions(){
  checks.innerHTML = "";
  optError.classList.add("hidden");

  const s = serviceEl.value;
  const p = packageEl.value;

  if(!s || !p){
    optionsBox.classList.add("hidden");
    updateTotal();
    return;
  }

  optionsBox.classList.remove("hidden");
  optionsContent.classList.remove("hidden");

  const cfg = OPTIONS[s][p];
  minLabel.textContent = `Minimum required: ${cfg.min}`;

  cfg.options.forEach((o, idx)=>{
    const lab = document.createElement("label");
    lab.className = "check";
    lab.innerHTML = `
      <input type="checkbox" value="${o}"/>
      <span>${o}</span>
    `;
    lab.querySelector("input").addEventListener("change", updateTotal);
    checks.appendChild(lab);
  });

  updateTotal();
}

serviceEl.addEventListener("change", renderOptions);
packageEl.addEventListener("change", renderOptions);

document.querySelectorAll(".orderBtn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    serviceEl.value = btn.dataset.service;
    packageEl.value = btn.dataset.package;
    renderOptions();
    document.querySelector("#order").scrollIntoView({behavior:"smooth"});
  });
});

$("orderForm").addEventListener("submit", async (e)=>{
  e.preventDefault();

  const s = serviceEl.value;
  const p = packageEl.value;
  const u = userEl.value.trim();

  if(!s || !p || !u){
    alert("Fill service, package, discord username.");
    return;
  }

  const cfg = OPTIONS[s][p];
  const sel = selectedOptions();
  if(sel.length < cfg.min){
    optError.textContent = `Select minimum ${cfg.min} options.`;
    optError.classList.remove("hidden");
    return;
  }

  const inv = invoiceNo();
  const total = calcTotal(s,p,sel.length);

  // Send order to backend
  const payload = {
    invoiceNumber: inv,
    service: s,
    package: p,
    discordUsername: u,
    email: emailEl.value.trim(),
    notes: notesEl.value.trim(),
    selectedOptions: sel,
    total
  };

  try{
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });

    if(!res.ok) throw new Error("failed");
  }catch(err){
    alert("⚠️ Backend not connected yet. You can still copy invoice.");
  }

  // invoice UI
  invNumber.textContent = inv;
  invService.textContent = s;
  invPackage.textContent = p;
  invOptions.textContent = sel.join(", ");
  invTotal.textContent = "$" + total;

  invoice.classList.remove("hidden");
  invoice.scrollIntoView({behavior:"smooth"});
  window.__lastInvoiceText = JSON.stringify(payload, null, 2);
});

copyBtn.addEventListener("click", async ()=>{
  try{
    await navigator.clipboard.writeText(window.__lastInvoiceText || "");
    copyMsg.textContent = "Copied ✅";
    copyMsg.classList.remove("hidden");
    setTimeout(()=>copyMsg.classList.add("hidden"), 1500);
  }catch(err){
    alert("Clipboard failed.");
  }
});

// ========= PARTICLES =========
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let W,H;

function resize(){
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const particles = [];
const COUNT = Math.min(120, Math.floor((W*H)/13000));

function rand(min,max){ return Math.random()*(max-min)+min; }

for(let i=0;i<COUNT;i++){
  particles.push({ x:rand(0,W), y:rand(0,H), r:rand(1,2.2), vx:rand(-0.25,0.25), vy:rand(-0.25,0.25), a:rand(0.25,0.8)});
}

function draw(){
  ctx.clearRect(0,0,W,H);

  for(const p of particles){
    p.x += p.vx; p.y += p.vy;
    if(p.x<0) p.x=W; if(p.x>W) p.x=0;
    if(p.y<0) p.y=H; if(p.y>H) p.y=0;

    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = `rgba(255,31,61,${p.a})`;
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255,31,61,0.6)";
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  requestAnimationFrame(draw);
}
draw();
