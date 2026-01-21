// Backend API
const API_BASE = "http://localhost:3000"; 
// later -> https://your-render-backend.onrender.com

const loginBox = document.getElementById("loginBox");
const dash = document.getElementById("dash");

const passEl = document.getElementById("pass");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");

const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

const ordersEl = document.getElementById("orders");
const searchEl = document.getElementById("search");

let token = localStorage.getItem("admin_token") || "";

function setLoggedIn(ok){
  if(ok){
    loginBox.classList.add("hidden");
    dash.classList.remove("hidden");
  }else{
    loginBox.classList.remove("hidden");
    dash.classList.add("hidden");
  }
}

async function login(){
  loginMsg.textContent = "Logging in...";
  try{
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ password: passEl.value })
    });

    if(!res.ok){
      loginMsg.textContent = "Wrong password.";
      return;
    }

    const data = await res.json();
    token = data.token;
    localStorage.setItem("admin_token", token);

    loginMsg.textContent = "Logged in ✅";
    setLoggedIn(true);
    await loadOrders();
  }catch(err){
    loginMsg.textContent = "Backend not connected.";
  }
}

async function loadOrders(){
  ordersEl.innerHTML = "<div class='muted'>Loading...</div>";

  try{
    const res = await fetch(`${API_BASE}/api/admin/orders`, {
      headers:{ "Authorization": `Bearer ${token}` }
    });

    if(!res.ok){
      ordersEl.innerHTML = "<div class='muted'>Access denied / invalid token.</div>";
      return;
    }

    const orders = await res.json();
    renderOrders(orders);
  }catch(err){
    ordersEl.innerHTML = "<div class='muted'>Backend not connected.</div>";
  }
}

function renderOrders(orders){
  const query = searchEl.value.trim().toLowerCase();
  const filtered = orders.filter(o =>
    (o.invoiceNumber || "").toLowerCase().includes(query) ||
    (o.discordUsername || "").toLowerCase().includes(query)
  );

  ordersEl.innerHTML = "";

  if(filtered.length === 0){
    ordersEl.innerHTML = "<div class='muted'>No orders found.</div>";
    return;
  }

  filtered.forEach(o=>{
    const div = document.createElement("div");
    div.className = "orderCard";
    div.innerHTML = `
      <div class="orderHead">
        <strong>${o.invoiceNumber}</strong>
        <span class="badge">$${o.total}</span>
      </div>
      <div class="orderMeta">
        <div><b>Service:</b> ${o.service}</div>
        <div><b>Package:</b> ${o.package}</div>
        <div><b>Discord:</b> ${o.discordUsername}</div>
        <div><b>Options:</b> ${(o.selectedOptions || []).join(", ") || "-"}</div>
        <div><b>Notes:</b> ${o.notes || "-"}</div>
        <div class="muted"><b>Date:</b> ${new Date(o.createdAt).toLocaleString()}</div>
      </div>
    `;
    ordersEl.appendChild(div);
  });
}

loginBtn.addEventListener("click", login);
refreshBtn.addEventListener("click", loadOrders);
logoutBtn.addEventListener("click", ()=>{
  localStorage.removeItem("admin_token");
  token = "";
  setLoggedIn(false);
});

searchEl.addEventListener("input", loadOrders);

// auto login if token exists
if(token){
  setLoggedIn(true);
  loadOrders();
}else{
  setLoggedIn(false);
}
