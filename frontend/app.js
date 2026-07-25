/* =========================================================
   LEDGER — app.js
   Vanilla JS — connected to FastAPI + MySQL backend.
   ========================================================= */

(function(){
"use strict";
// Protect Dashboard
const token = localStorage.getItem("access_token");

if (!token) {
    window.location.replace("login.html");
}

/* ---------------------------------------------------------
   1. CONFIG / CONSTANTS
--------------------------------------------------------- */
const CATEGORIES = [
  { name:"Food",          icon:"fa-utensils",            weight:5 },
  { name:"Travel",        icon:"fa-plane",                weight:3 },
  { name:"Shopping",      icon:"fa-bag-shopping",         weight:4 },
  { name:"Bills",         icon:"fa-file-invoice-dollar",  weight:3 },
  { name:"Entertainment", icon:"fa-film",                 weight:3 },
  { name:"Health",        icon:"fa-heart-pulse",          weight:2 },
  { name:"Education",     icon:"fa-graduation-cap",       weight:2 },
  { name:"Salary",        icon:"fa-sack-dollar",          weight:0 },
  { name:"Investment",    icon:"fa-chart-line",           weight:0 },
  { name:"Others",        icon:"fa-ellipsis",             weight:2 }
];
const PAYMENTS = ["Cash","UPI","Card","Bank Transfer"];

let CURRENCY = "₹";
let MONTHLY_BUDGET = 45000;

/* ---------------------------------------------------------
   2. API FUNCTIONS
--------------------------------------------------------- */
const API_URL = "http://127.0.0.1:8000/transactions/";

async function getTransactions() {
  try {
    const token = localStorage.getItem("access_token");

    const res = await fetch(API_URL, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(err);
      throw new Error(`GET /transactions failed: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("getTransactions:", err);
    return [];
  }
}


async function createTransaction(payload) {
  try {
    const token = localStorage.getItem("access_token");

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(err);
      throw new Error(`POST failed: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    console.error("createTransaction:", err);
    return null;
  }
}

async function updateTransaction(id, payload) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`PUT /transactions/${id} failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("updateTransaction:", err);
    return null;
  }
}

async function deleteTransaction(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE /transactions/${id} failed: ${res.status}`);
    return true;
  } catch (err) {
    console.error("deleteTransaction:", err);
    return false;
  }
}

async function reloadAll() {
    transactions = await getTransactions();

    console.log("Transactions from backend:", transactions);

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* ---------------------------------------------------------
   3. STATE
--------------------------------------------------------- */
let transactions = [];

/* ---------------------------------------------------------
   4. UTILITIES
--------------------------------------------------------- */
function uid(){ return "tx_" + Math.random().toString(36).slice(2,10); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function money(n){
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits:0 });
  return `${sign}${CURRENCY}${v}`;
}
function moneyPrecise(n){
  return `${CURRENCY}${Math.abs(n).toLocaleString("en-IN",{minimumFractionDigits:2, maximumFractionDigits:2})}`;
}
function catMeta(name){ return CATEGORIES.find(c=>c.name===name) || CATEGORIES[CATEGORIES.length-1]; }
function fmtISO(d){ return d.toISOString().slice(0,10); }
function fmtDate(iso){
  const d = new Date(iso+"T00:00:00");
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}
function fmtDateShort(iso){
  const d = new Date(iso+"T00:00:00");
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}
function monthKey(iso){ return iso.slice(0,7); }
function monthLabel(key){
  const [y,m] = key.split("-").map(Number);
  return new Date(y, m-1, 1).toLocaleDateString("en-IN",{ month:"short", year:"2-digit" });
}
function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
function hexA(hex, a){
  const h = hex.replace("#","");
  const r = parseInt(h.substring(0,2),16), g=parseInt(h.substring(2,4),16), b=parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ---------------------------------------------------------
   5. TOASTS
--------------------------------------------------------- */
const toastContainer = document.getElementById("toastContainer");
function toast(type, title, msg){
  const icons = { success:"fa-circle-check", error:"fa-circle-exclamation", info:"fa-circle-info" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${icons[type]||icons.info}"></i></div>
    <div class="toast-text"><strong>${title}</strong><span>${msg||""}</span></div>`;
  toastContainer.appendChild(el);
  setTimeout(()=>{ el.classList.add("hide"); setTimeout(()=>el.remove(), 400); }, 3600);
}

/* ---------------------------------------------------------
   6. ANIMATED COUNTERS
--------------------------------------------------------- */
function animateCounter(el, target, isMoney=true, duration=1100){
  const start = 0;
  const startTime = performance.now();
  function tick(now){
    const p = Math.min(1, (now-startTime)/duration);
    const eased = 1 - Math.pow(1-p, 3);
    const val = start + (target-start)*eased;
    el.textContent = isMoney ? money(val) : Math.round(val).toLocaleString("en-IN");
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------------------------------------------------------
   7. NAVIGATION
--------------------------------------------------------- */
const pageMeta = {
  dashboard:   { title:"Dashboard", sub:"Welcome back — here's where things stand." },
  add:         { title:"Add transaction", sub:"Log a new expense or income entry." },
  transactions:{ title:"Transactions", sub:"Every entry, searchable and filterable." },
  analytics:   { title:"Analytics", sub:"Trends and patterns across your spending." },
  insights:    { title:"AI Insights", sub:"Smart observations from your recent activity." },
  settings:    { title:"Settings", sub:"Manage your profile, budget and preferences." }
};

function goToPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(`page-${page}`).classList.add("active");
  document.querySelectorAll(".nav-link[data-page]").forEach(a=>a.classList.toggle("active", a.dataset.page===page));
  document.querySelectorAll(".bn-link[data-page]").forEach(a=>a.classList.toggle("active", a.dataset.page===page));
  document.getElementById("pageTitle").textContent = pageMeta[page].title;
  document.getElementById("pageSubtitle").textContent = pageMeta[page].sub;
  closeSidebar();
  window.scrollTo({top:0, behavior:"smooth"});

  if(page==="dashboard") renderDashboard();
  if(page==="add") renderAddPage();
  if(page==="transactions") renderTransactionsPage();
  if(page==="analytics") renderAnalytics();
  if(page==="insights") renderInsights();
}

document.querySelectorAll("[data-page]").forEach(a=>{
  a.addEventListener("click", (e)=>{
    e.preventDefault();
    goToPage(a.dataset.page);
    history.replaceState(null,"","#"+a.dataset.page);
  });
});

function initialPageFromHash(){
  const h = location.hash.replace("#","");
  return pageMeta[h] ? h : "dashboard";
}

/* Mobile sidebar */
const sidebar = document.getElementById("sidebar");
const scrim = document.getElementById("scrim");
document.getElementById("menuBtn").addEventListener("click", ()=>{
  sidebar.classList.add("open"); scrim.classList.add("show");
});
scrim.addEventListener("click", closeSidebar);
function closeSidebar(){ sidebar.classList.remove("open"); scrim.classList.remove("show"); }

/* ---------------------------------------------------------
   8. THEME
--------------------------------------------------------- */
const themeToggle = document.getElementById("themeToggle");
function setTheme(mode){
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem("ledger-theme", mode);
  document.getElementById("setDarkMode").checked = mode==="dark";
  refreshChartsForCurrentPage();
}
// Logout function
function logout() {
    localStorage.removeItem("access_token");
    alert("Logged out successfully!");
    window.location.href = "login.html";
}
themeToggle.addEventListener("click", ()=>{
  const cur = document.documentElement.getAttribute("data-theme");
  setTheme(cur==="dark" ? "light" : "dark");
});
document.getElementById("setDarkMode").addEventListener("change", (e)=>{
  setTheme(e.target.checked ? "dark" : "light");
});

function refreshChartsForCurrentPage(){
  const active = document.querySelector(".page.active").id.replace("page-","");
  if(active==="dashboard") renderDashboardCharts();
  if(active==="analytics") renderAnalyticsCharts();
}

/* ---------------------------------------------------------
   9. GREETING
--------------------------------------------------------- */
function renderGreeting() {
  const now = new Date();
  const hour = now.getHours();

  const greet =
    hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : "Good evening";

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const name = currentUser ? currentUser.full_name : "User";

  document.getElementById("greetingText").textContent = `${greet}, ${name}`;

  document.getElementById("greetingDate").textContent =
    now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) +
    " · " +
    now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
}

/* ---------------------------------------------------------
   10. DASHBOARD
--------------------------------------------------------- */
let dashCharts = {};

function computeTotals(list){
  const income = list
    .filter(t => t.type.toLowerCase() === "income")
    .reduce((s,t) => s + Number(t.amount), 0);
  const expense = list
    .filter(t => t.type.toLowerCase() === "expense")
    .reduce((s,t) => s + Number(t.amount), 0);
  return {
    income,
    expense,
    balance: income - expense,
    savings: Math.max(0, income - expense)
  };
}

function currentMonthTx(){
  const key = monthKey(fmtISO(new Date()));
  return transactions.filter(t => monthKey(t.date) === key);
}

function last6MonthKeys(n = 6) {
  const keys = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    keys.push(dd.toISOString().slice(0, 7));
  }
  return keys;
}

function renderDashboard(){
  renderGreeting();
  const monthTx = currentMonthTx();
  const totals = computeTotals(transactions);
  const monthTotals = computeTotals(monthTx);

  document.querySelectorAll(".skeleton-wrap").forEach(el=>el.classList.add("loading"));
  setTimeout(()=>{
    document.querySelectorAll(".skeleton-wrap").forEach(el=>el.classList.remove("loading"));
    animateCounter(document.querySelector('[data-counter="balance"]'), totals.balance);
    animateCounter(document.querySelector('[data-counter="income"]'), totals.income);
    animateCounter(document.querySelector('[data-counter="expense"]'), totals.expense);
    animateCounter(document.querySelector('[data-counter="savings"]'), totals.savings);
  }, 550);

  const pct = Math.min(100, Math.round((monthTotals.expense/MONTHLY_BUDGET)*100));
  const fill = document.getElementById("dashBudgetFill");
  fill.style.width = pct+"%";
  fill.className = "progress-fill " + (pct>=100?"over":pct>=80?"warn":"");
  document.getElementById("dashSpent").textContent = money(monthTotals.expense);
  document.getElementById("dashBudgetTotal").textContent = money(MONTHLY_BUDGET);
  const pill = document.getElementById("budgetPill");
  pill.textContent = pct>=100 ? "Over budget" : pct>=80 ? "Close to limit" : "On track";
  pill.className = "pill " + (pct>=100?"over":pct>=80?"warn":"");

  document.getElementById("sbBudgetPct").textContent = pct+"%";
  document.getElementById("sbBudgetFill").style.width = pct+"%";
  document.getElementById("sbBudgetFill").className = "progress-fill " + (pct>=100?"over":pct>=80?"warn":"");
  document.getElementById("sbSpent").textContent = money(monthTotals.expense);
  document.getElementById("sbTotal").textContent = "of " + money(MONTHLY_BUDGET);

  // Recent transactions — sorted by date descending, newest first
  const recentList = document.getElementById("recentList");
  const recent = [...transactions]
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);
  recentList.innerHTML = recent.map(txRowHTML).join("") || emptyRowHTML();

  renderDashboardCharts();
}

function txRowHTML(t){
  const cat = {name: "food",
    icon: "fa-utensils"};
  const typeLC = t.type.toLowerCase();
  return `
  <div class="tx-row">
    <div class="tx-icon cat-${cat.name}"><i class="fa-solid ${cat.icon}"></i></div>
    <div class="tx-info">
      <p class="tx-title">${t.title}</p>
      <p class="tx-meta">${t.category} · ${t.payment_method||""} · ${fmtDateShort(t.date)}</p>
    </div>
    <p class="tx-amount mono ${typeLC}">${typeLC==="income"?"+":"−"}${t.amount}</p>
  </div>`;
}
function emptyRowHTML(){ return `<p class="muted" style="padding:20px 8px;text-align:center;">No transactions yet.</p>`; }

function renderDashboardCharts(){
  const gridColor = "rgba(120,110,160,0.14)";
  const textColor = cssVar("--ink-500");
  const violet = cssVar("--violet-500");
  const emerald = cssVar("--emerald-500");

  const range = document.getElementById("overviewRange").value === "12 months" ? 12 : 6;
  const keys = last6MonthKeys(range);

  const incomeData = keys.map(k =>
    transactions
      .filter(t => t.type.toLowerCase() === "income" && monthKey(t.date) === k)
      .reduce((s, t) => s + Number(t.amount), 0)
  );
  const expenseData = keys.map(k =>
    transactions
      .filter(t => t.type.toLowerCase() === "expense" && monthKey(t.date) === k)
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  if(dashCharts.overview) dashCharts.overview.destroy();
  dashCharts.overview = new Chart(document.getElementById("overviewChart"), {
    type:"line",
    data:{ labels: keys.map(monthLabel), datasets:[
      { label:"Income", data:incomeData, borderColor:emerald, backgroundColor:hexA(emerald,0.15), fill:true, tension:0.4, pointRadius:3, borderWidth:2.5 },
      { label:"Expense", data:expenseData, borderColor:violet, backgroundColor:hexA(violet,0.15), fill:true, tension:0.4, pointRadius:3, borderWidth:2.5 }
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:"bottom", labels:{ color:textColor, font:{ family:"Inter", weight:600, size:11 }, boxWidth:10, usePointStyle:true } } },
      scales:{
        x:{ grid:{ display:false }, ticks:{ color:textColor, font:{size:11} } },
        y:{ grid:{ color:gridColor }, ticks:{ color:textColor, font:{size:11}, callback:v=>CURRENCY+(v/1000)+"k" } }
      }
    }
  });

  // Category pie — expenses only, lowercase comparison
  const monthExpenses = currentMonthTx().filter(t => t.type.toLowerCase() === "expense");
  const byCat = {};
  monthExpenses.forEach(t => byCat[t.category] = (byCat[t.category]||0) + Number(t.amount));
  const catNames = Object.keys(byCat);
  const palette = ["#FF6B6B","#4433A0","#B15DFF","#F4B740","#6D5BD0","#0EA57E","#2C8CE0","#D69412","#6E6890"];

  if(dashCharts.pie) dashCharts.pie.destroy();
  dashCharts.pie = new Chart(document.getElementById("categoryPie"), {
    type:"doughnut",
    data:{ labels:catNames, datasets:[{ data:catNames.map(c=>byCat[c]), backgroundColor:catNames.map((_,i)=>palette[i%palette.length]), borderWidth:0, hoverOffset:8 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:"68%", plugins:{ legend:{ display:false } } }
  });
  document.getElementById("pieLegend").innerHTML = catNames.map((c,i)=>`
    <span class="legend-item"><span class="legend-dot" style="background:${palette[i%palette.length]}"></span>${c}</span>`).join("") || `<span class="muted">No expenses logged this month yet.</span>`;
}

document.getElementById("overviewRange").addEventListener("change", renderDashboardCharts);
document.getElementById("dashQuickAdd").addEventListener("click", ()=>openQuickModal());

/* ---------------------------------------------------------
   11. ADD TRANSACTION PAGE
--------------------------------------------------------- */
let addType = "expense";
let addCategory = null;

function buildCategoryGrid(container, onSelect, selected){
  container.innerHTML = CATEGORIES.map(c=>`
    <div class="cat-opt ${c.name===selected?"selected":""}" data-cat="${c.name}">
      <span class="cat-ic cat-${c.name}"><i class="fa-solid ${c.icon}"></i></span>
      <span>${c.name}</span>
    </div>`).join("");
  container.querySelectorAll(".cat-opt").forEach(el=>{
    el.addEventListener("click", ()=>{
      container.querySelectorAll(".cat-opt").forEach(o=>o.classList.remove("selected"));
      el.classList.add("selected");
      onSelect(el.dataset.cat);
    });
  });
}

function renderAddPage(){
  document.getElementById("txForm").reset();
  addType = "expense"; addCategory = null;
  document.querySelectorAll("#typeToggle .type-opt").forEach(b=>b.classList.toggle("active", b.dataset.type==="expense"));
  document.getElementById("txDate").value = fmtISO(new Date());
  buildCategoryGrid(document.getElementById("categoryGrid"), (cat)=>{ addCategory=cat; updatePreview(); clearFieldError("category"); }, null);
  document.getElementById("currencyPrefix").textContent = CURRENCY;
  updatePreview();
}

document.querySelectorAll("#typeToggle .type-opt").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll("#typeToggle .type-opt").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    addType = btn.dataset.type;
    updatePreview();
  });
});

["txAmount","txTitle","txPayment","txDesc"].forEach(id=>{
  document.getElementById(id).addEventListener("input", updatePreview);
});

function updatePreview(){
  const amount = parseFloat(document.getElementById("txAmount").value) || 0;
  const title = document.getElementById("txTitle").value || "Transaction title";
  const payment_method = document.getElementById("txPayment").value;
  const cat = addCategory || "Others";
  const meta = catMeta(cat);
  document.getElementById("previewIcon").className = "preview-icon cat-"+meta.name;
  document.getElementById("previewIcon").innerHTML = `<i class="fa-solid ${meta.icon}"></i>`;
  document.getElementById("previewTitle").textContent = title;
  document.getElementById("previewMeta").textContent = `${addCategory||"Category"} · ${payment_method}`;
  const amountEl = document.getElementById("previewAmount");
  amountEl.textContent = (addType==="income"?"+":"−") + moneyPrecise(amount);
  amountEl.style.color = addType==="income" ? cssVar("--emerald-600") : cssVar("--coral-600");
}

function setFieldError(name, on){
  const field = document.getElementById(name==="amount"?"txAmount": name==="title"?"txTitle": name==="date"?"txDate": "categoryGrid").closest(".field");
  field.classList.toggle("invalid", on);
}
function clearFieldError(name){ setFieldError(name, false); }

document.getElementById("dropzone").addEventListener("click", ()=>document.getElementById("receiptInput").click());
document.getElementById("receiptInput").addEventListener("change", (e)=>{
  const f = e.target.files[0];
  document.getElementById("dropzoneText").textContent = f ? `Attached: ${f.name}` : "Drop an image here or click to browse (UI only)";
});
["dragover","dragleave","drop"].forEach(ev=>{
  document.getElementById("dropzone").addEventListener(ev, (e)=>{
    e.preventDefault();
    document.getElementById("dropzone").style.borderColor = ev==="dragover" ? cssVar("--violet-500") : "";
  });
});

document.getElementById("txForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const amount = parseFloat(document.getElementById("txAmount").value);
  const title = document.getElementById("txTitle").value.trim();
  const date = document.getElementById("txDate").value;
  let valid = true;
  if(!amount || amount<=0){ setFieldError("amount", true); valid=false; } else setFieldError("amount", false);
  if(!title){ setFieldError("title", true); valid=false; } else setFieldError("title", false);
  if(!date){ setFieldError("date", true); valid=false; } else setFieldError("date", false);
  if(!addCategory){ setFieldError("category", true); valid=false; } else setFieldError("category", false);
  if(!valid){ toast("error","Check the form","Some required fields need your attention."); return; }

  const payload = {
    title,
    description: document.getElementById("txDesc").value.trim(),
    amount,
    type: addType,
    category: addCategory,
    payment_method: document.getElementById("txPayment").value,
    date,
    notes: document.getElementById("txNotes").value.trim()
  };

  const saved = await createTransaction(payload);
  if (!saved) { toast("error","Save failed","Could not save to server. Please try again."); return; }

  await reloadAll();
  toast("success","Transaction saved", `${title} · ${money(amount)}`);
  renderAddPage();
  goToPage("dashboard");
  history.replaceState(null,"","#dashboard");
});

document.getElementById("txReset").addEventListener("click", ()=> setTimeout(renderAddPage, 0));

/* ---------------------------------------------------------
   12. TRANSACTIONS PAGE
--------------------------------------------------------- */
let currentPage = 1;
const PAGE_SIZE = 8;

function populateCategoryFilter(){
  const sel = document.getElementById("filterCategory");
  const prev = sel.value || "all";
  sel.innerHTML = `<option value="all">All categories</option>` + CATEGORIES.map(c=>`<option value="${c.name}">${c.name}</option>`).join("");
  sel.value = prev;
}

function getFilteredTx(){
  const q = document.getElementById("txSearch").value.trim().toLowerCase();
  const type = document.getElementById("filterType").value;
  const cat = document.getElementById("filterCategory").value;
  const pay = document.getElementById("filterPayment").value;
  const from = document.getElementById("filterFrom").value;
  const to = document.getElementById("filterTo").value;
  const sort = document.getElementById("sortBy").value;

  let list = transactions.filter(t=>{
    const typeLC = t.type.toLowerCase();
    if(q && !(t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.notes||"").toLowerCase().includes(q) || (t.description||"").toLowerCase().includes(q))) return false;
    if(type!=="all" && typeLC !== type.toLowerCase()) return false;
    if(cat!=="all" && t.category!==cat) return false;
    if(pay!=="all" && (t.payment_method||"") !== pay) return false;
    if(from && t.date < from) return false;
    if(to && t.date > to) return false;
    return true;
  });

  list.sort((a,b)=>{
    if(sort==="newest") return new Date(b.date)-new Date(a.date);
    if(sort==="oldest") return new Date(a.date)-new Date(b.date);
    if(sort==="highest") return Number(b.amount)-Number(a.amount);
    if(sort==="lowest") return Number(a.amount)-Number(b.amount);
    return 0;
  });
  return list;
}

function renderTransactionsPage(){
  populateCategoryFilter();
  currentPage = 1;
  drawTxTable();
}

function drawTxTable(){
  const list = getFilteredTx();
  console.log("Transactions array:", transactions);
  console.log("Filtered list:", list);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const pageItems = list.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

  const tbody = document.getElementById("txTableBody");
  const emptyState = document.getElementById("txEmptyState");
  const table = document.getElementById("txTable");
  console.log("Table:", table);
  console.log("Tbody:", tbody);
  console.log("Empty State:", emptyState);

  if(list.length===0){
    table.style.display = "none";
    emptyState.hidden = false;
  } else {
    table.style.display = "";
    emptyState.hidden = true;
    tbody.innerHTML = pageItems.map(t => {
  const cat = catMeta(t.category);
  const typeLC = t.type.toLowerCase();

  return `
    <tr>
      <td>
        <div class="cell-tx">
          <div class="tx-icon cat-${cat.name}">
            <i class="fa-solid ${cat.icon}"></i>
          </div>
          <div>
            <p class="cell-title">${t.title}</p>
            <p class="cell-desc">${t.description || ""}</p>
          </div>
        </div>
      </td>

      <td><span class="badge">${t.category}</span></td>
      <td>${t.payment_method || ""}</td>
      <td>${fmtDate(t.date)}</td>

      <td class="right mono"
          style="color:${typeLC === "income"
            ? cssVar("--emerald-600")
            : cssVar("--coral-600")};
          font-weight:700;">
        ${typeLC === "income" ? "+" : "−"}${money(Number(t.amount))}
      </td>

      <td>
        <div class="row-actions">
          <button class="edit" data-id="${t.id}" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>

          <button class="del" data-id="${t.id}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}).join("");
}
  const pag = document.getElementById("pagination");
  if(totalPages<=1){ pag.innerHTML=""; }
  else{
    let html = `<button ${currentPage===1?"disabled":""} data-p="${currentPage-1}"><i class="fa-solid fa-chevron-left"></i></button>`;
    for(let i=1;i<=totalPages;i++){
      html += `<button class="${i===currentPage?"active":""}" data-p="${i}">${i}</button>`;
    }
    html += `<button ${currentPage===totalPages?"disabled":""} data-p="${currentPage+1}"><i class="fa-solid fa-chevron-right"></i></button>`;
    pag.innerHTML = html;
    pag.querySelectorAll("button").forEach(b=>b.addEventListener("click", ()=>{ currentPage=parseInt(b.dataset.p); drawTxTable(); }));
  }

  tbody.querySelectorAll(".edit").forEach(b=>b.addEventListener("click", ()=>openEditModal(b.dataset.id)));
  tbody.querySelectorAll(".del").forEach(b=>b.addEventListener("click", ()=>openDeleteModal(b.dataset.id)));
}

const debouncedFilterUpdate = debounce(() => {
  currentPage = 1;
  drawTxTable();
}, 300);
["txSearch","filterType","filterCategory","filterPayment","filterFrom","filterTo","sortBy"].forEach(id=>{
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener("input", id === "txSearch" ? debouncedFilterUpdate : () => {
    currentPage = 1;
    drawTxTable();
  });
});

function resetFilters(){
  document.getElementById("txSearch").value="";
  document.getElementById("filterType").value="all";
  document.getElementById("filterCategory").value="all";
  document.getElementById("filterPayment").value="all";
  document.getElementById("filterFrom").value="";
  document.getElementById("filterTo").value="";
  document.getElementById("sortBy").value="newest";
  currentPage=1; drawTxTable();
}
document.getElementById("clearFilters").addEventListener("click", resetFilters);
document.getElementById("emptyStateReset").addEventListener("click", resetFilters);

/* ----- Edit modal ----- */
const editBackdrop = document.getElementById("editModalBackdrop");
let editingId = null;

function openEditModal(id){
  const t = transactions.find(x=>x.id===id);
  if(!t) return;
  editingId = id;
  document.querySelectorAll("#editTypeToggle .type-opt").forEach(b=>b.classList.toggle("active", b.dataset.type===t.type.toLowerCase()));
  document.getElementById("editAmount").value = t.amount;
  document.getElementById("editDate").value = t.date;
  document.getElementById("editTitle").value = t.title;
  const sel = document.getElementById("editCategory");
  sel.innerHTML = CATEGORIES.map(c=>`<option value="${c.name}" ${c.name===t.category?"selected":""}>${c.name}</option>`).join("");
  document.getElementById("editPayment").value = t.payment_method || "";
  editBackdrop.classList.add("show");
}

document.querySelectorAll("#editTypeToggle .type-opt").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll("#editTypeToggle .type-opt").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
  });
});

function closeEditModal(){ editBackdrop.classList.remove("show"); editingId=null; }
document.getElementById("editModalClose").addEventListener("click", closeEditModal);
document.getElementById("editCancel").addEventListener("click", closeEditModal);
editBackdrop.addEventListener("click", (e)=>{ if(e.target===editBackdrop) closeEditModal(); });

document.getElementById("editForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!editingId) return;

  const payload = {
    type: document.querySelector("#editTypeToggle .type-opt.active").dataset.type,
    amount: parseFloat(document.getElementById("editAmount").value),
    date: document.getElementById("editDate").value,
    title: document.getElementById("editTitle").value.trim(),
    category: document.getElementById("editCategory").value,
    payment_method: document.getElementById("editPayment").value
  };

  const updated = await updateTransaction(editingId, payload);
  if (!updated) { toast("error","Update failed","Could not update on server."); return; }

  closeEditModal();
  await reloadAll();
  drawTxTable();
  renderDashboard();
  renderAnalytics();
  toast("success","Transaction updated", payload.title);
});

/* ----- Delete modal ----- */
const deleteBackdrop = document.getElementById("deleteModalBackdrop");
let deletingId = null;

function openDeleteModal(id){
  const t = transactions.find(x=>x.id===id);
  if(!t) return;
  deletingId = id;
  document.getElementById("deleteModalText").textContent = `"${t.title}" · ${money(Number(t.amount))} will be permanently removed.`;
  deleteBackdrop.classList.add("show");
}
function closeDeleteModal(){ deleteBackdrop.classList.remove("show"); deletingId=null; }
document.getElementById("deleteCancel").addEventListener("click", closeDeleteModal);
deleteBackdrop.addEventListener("click", (e)=>{ if(e.target===deleteBackdrop) closeDeleteModal(); });

document.getElementById("deleteConfirm").addEventListener("click", async ()=>{
  const t = transactions.find(x=>x.id===deletingId);
  const success = await deleteTransaction(deletingId);
  if (!success) { toast("error","Delete failed","Could not delete from server."); return; }

  closeDeleteModal();
  await reloadAll();
  drawTxTable();
  renderDashboard();
  renderAnalytics();
  toast("success","Transaction deleted", t ? t.title : "");
});

/* ---------------------------------------------------------
   13. ANALYTICS PAGE
--------------------------------------------------------- */
let anCharts = {};

function renderAnalytics(){
  const monthTx = currentMonthTx();
  const expenses = transactions.filter(t => t.type.toLowerCase() === "expense");

  const byCat = {};
  monthTx.filter(t => t.type.toLowerCase() === "expense").forEach(t => byCat[t.category] = (byCat[t.category]||0) + Number(t.amount));
  const highestCat = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById("anHighestCat").textContent = highestCat ? `${highestCat[0]} (${money(highestCat[1])})` : "—";

  const largest = [...expenses].sort((a,b) => Number(b.amount)-Number(a.amount))[0];
  document.getElementById("anLargestExpense").textContent = largest ? money(Number(largest.amount)) : "—";
  document.getElementById("anTotalTx").textContent = transactions.length.toLocaleString("en-IN");

  const daysThisMonth = new Date().getDate();
  const monthExpenseTotal = monthTx.filter(t => t.type.toLowerCase() === "expense").reduce((s,t) => s + Number(t.amount), 0);
  document.getElementById("anAvgDaily").textContent = money(monthExpenseTotal / Math.max(1, daysThisMonth));

  const pct = Math.min(100, Math.round((monthExpenseTotal/MONTHLY_BUDGET)*100));
  document.getElementById("anBudgetFill").style.width = pct+"%";
  document.getElementById("anBudgetFill").className = "progress-fill " + (pct>=100?"over":pct>=80?"warn":"");
  document.getElementById("anBudgetPct").textContent = pct+"%";

  // Monthly comparison
  const now = new Date();
  const thisKey = fmtISO(now).slice(0,7);
  const lastKey = new Date(now.getFullYear(), now.getMonth()-1, 1).toISOString().slice(0,7);
  const thisM = computeTotals(transactions.filter(t => monthKey(t.date)===thisKey));
  const lastM = computeTotals(transactions.filter(t => monthKey(t.date)===lastKey));

  function delta(cur,prev){
    if(prev===0) return { text:"—", cls:"" };
    const d = ((cur-prev)/prev*100);
    return { text:(d>=0?"+":"")+d.toFixed(1)+"%", cls: d>=0 ? "up":"down" };
  }
  const incD = delta(thisM.income,lastM.income);
  const expD = delta(thisM.expense,lastM.expense);
  const savD = delta(thisM.savings,lastM.savings);

  document.getElementById("compareGrid").innerHTML = `
    <div class="compare-item"><p class="label">Income this month</p><p class="val mono">${money(thisM.income)}</p><p class="delta ${incD.cls==='up'?'up':'down'}" style="color:${incD.cls==='up'?cssVar('--emerald-600'):cssVar('--coral-600')}">${incD.text} vs last month</p></div>
    <div class="compare-item"><p class="label">Expense this month</p><p class="val mono">${money(thisM.expense)}</p><p class="delta" style="color:${expD.cls==='up'?cssVar('--coral-600'):cssVar('--emerald-600')}">${expD.text} vs last month</p></div>
    <div class="compare-item"><p class="label">Savings this month</p><p class="val mono">${money(thisM.savings)}</p><p class="delta" style="color:${savD.cls==='up'?cssVar('--emerald-600'):cssVar('--coral-600')}">${savD.text} vs last month</p></div>
    <div class="compare-item"><p class="label">Transactions logged</p><p class="val mono">${transactions.filter(t=>monthKey(t.date)===thisKey).length}</p><p class="delta muted">this month</p></div>
  `;

  renderAnalyticsCharts();
}

function renderAnalyticsCharts(){
  const gridColor = "rgba(120,110,160,0.14)";
  const textColor = cssVar("--ink-500");
  const violet = cssVar("--violet-500");
  const emerald = cssVar("--emerald-500");
  const coral = cssVar("--coral-500");

  const keys = last6MonthKeys(6);
  const expenseByMonth = keys.map(k =>
    transactions.filter(t => t.type.toLowerCase() === "expense" && monthKey(t.date) === k)
      .reduce((s,t) => s + Number(t.amount), 0)
  );
  const incomeByMonth = keys.map(k =>
    transactions.filter(t => t.type.toLowerCase() === "income" && monthKey(t.date) === k)
      .reduce((s,t) => s + Number(t.amount), 0)
  );

  if(anCharts.monthly) anCharts.monthly.destroy();
  anCharts.monthly = new Chart(document.getElementById("monthlyExpenseChart"), {
    type:"bar",
    data:{ labels:keys.map(monthLabel), datasets:[{ label:"Expenses", data:expenseByMonth, backgroundColor:hexA(coral,0.75), borderRadius:8, maxBarThickness:38 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ x:{grid:{display:false}, ticks:{color:textColor}}, y:{grid:{color:gridColor}, ticks:{color:textColor, callback:v=>CURRENCY+(v/1000)+"k"}} } }
  });

  if(anCharts.incomeExpense) anCharts.incomeExpense.destroy();
  anCharts.incomeExpense = new Chart(document.getElementById("incomeExpenseChart"), {
    type:"doughnut",
    data:{ labels:["Income","Expense"], datasets:[{ data:[incomeByMonth.reduce((a,b)=>a+b,0), expenseByMonth.reduce((a,b)=>a+b,0)], backgroundColor:[emerald,coral], borderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:"65%", plugins:{ legend:{ position:"bottom", labels:{color:textColor, font:{family:"Inter",weight:600}} } } }
  });

  // Category polar area — expenses only
  const catExpenses = {};
  transactions.filter(t => t.type.toLowerCase() === "expense").forEach(t => catExpenses[t.category] = (catExpenses[t.category]||0) + Number(t.amount));
  const catNames = Object.keys(catExpenses);
  const palette = ["#FF6B6B","#4433A0","#B15DFF","#F4B740","#6D5BD0","#0EA57E","#2C8CE0","#D69412","#6E6890"];

  if(anCharts.cat) anCharts.cat.destroy();
  anCharts.cat = new Chart(document.getElementById("analyticsCategoryChart"), {
    type:"polarArea",
    data:{ labels:catNames, datasets:[{ data:catNames.map(c=>catExpenses[c]), backgroundColor:catNames.map((_,i)=>hexA(palette[i%palette.length],0.75)) }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:"bottom", labels:{color:textColor, font:{size:10}, boxWidth:8} } },
      scales:{ r:{ ticks:{ display:false }, grid:{ color:gridColor } } } }
  });

  // Weekly trend — last 8 weeks
  const weekLabels = [], weekData = [];
  for(let w=7; w>=0; w--){
    const end = new Date(); end.setDate(end.getDate()-w*7);
    const start = new Date(end); start.setDate(start.getDate()-6);
    const sum = transactions
      .filter(t => t.type.toLowerCase() === "expense" && new Date(t.date) >= start && new Date(t.date) <= end)
      .reduce((s,t) => s + Number(t.amount), 0);
    weekLabels.push(`${start.getDate()}/${start.getMonth()+1}`);
    weekData.push(sum);
  }
  if(anCharts.weekly) anCharts.weekly.destroy();
  anCharts.weekly = new Chart(document.getElementById("weeklyTrendChart"), {
    type:"line",
    data:{ labels:weekLabels, datasets:[{ label:"Weekly spend", data:weekData, borderColor:violet, backgroundColor:hexA(violet,0.15), fill:true, tension:0.45, pointRadius:3, borderWidth:2.5 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ x:{grid:{display:false}, ticks:{color:textColor}}, y:{grid:{color:gridColor}, ticks:{color:textColor, callback:v=>CURRENCY+(v/1000)+"k"}} } }
  });
}

/* ---------------------------------------------------------
   14. AI INSIGHTS PAGE
--------------------------------------------------------- */
function buildInsights(){
  const monthExpenses = currentMonthTx().filter(t => t.type.toLowerCase() === "expense");
  const total = monthExpenses.reduce((s,t) => s + Number(t.amount), 0) || 1;
  const byCat = {};
  monthExpenses.forEach(t => byCat[t.category] = (byCat[t.category]||0) + Number(t.amount));
  const top = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  const pctBudget = Math.round((total/MONTHLY_BUDGET)*100);

  const insights = [];
  if(top){
    insights.push({ icon:"fa-utensils", tag:"Spending pattern", text:`You spent ${Math.round((top[1]/total)*100)}% of this month's budget on ${top[0]}.`, cls:"insight-1" });
  }
  insights.push({ icon:"fa-piggy-bank", tag:"Savings tip", text:`Cutting food delivery by half could save you close to ${money(1500)} this month.`, cls:"insight-2" });
  insights.push({ icon:"fa-chart-line", tag:"Trend alert", text:`Shopping expenses are trending 18% higher than your monthly average.`, cls:"insight-3" });
  insights.push({ icon: pctBudget<100 ? "fa-circle-check":"fa-triangle-exclamation", tag:"Budget status",
    text: pctBudget<100 ? `You're within budget — ${100-pctBudget}% still available this month.` : `You've gone ${pctBudget-100}% over your monthly budget.`, cls:"insight-4" });
  return insights;
}

function renderInsights(){
  const insights = buildInsights();
  document.getElementById("insightsGrid").innerHTML = insights.map(i=>`
    <div class="insight-card ${i.cls}">
      <div class="insight-icon"><i class="fa-solid ${i.icon}"></i></div>
      <div><p class="insight-tag">${i.tag}</p><p class="insight-text">${i.text}</p></div>
    </div>`).join("");
  if(!chatSeeded) seedChat();
}

/* Chat UI */
const chatBody = document.getElementById("chatBody");
let chatSeeded = false;
function addMsg(role, text){
  const el = document.createElement("div");
  el.className = "msg "+role;
  el.textContent = text;
  chatBody.appendChild(el);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function seedChat(){
  chatSeeded = true;
  const currentUser = JSON.parse(localStorage.getItem("user"));
const name = currentUser ? currentUser.full_name : "User";

addMsg("bot", `Hi ${name}! I've looked at your recent activity. Ask me anything about your spending.`);
  addMsg("user","How much did I spend on food this month?");
  const foodTx = currentMonthTx().filter(t => t.type.toLowerCase() === "expense" && t.category==="Food");
  const foodTotal = foodTx.reduce((s,t) => s + Number(t.amount), 0);
  addMsg("bot",`You've spent ${money(foodTotal)} on Food so far this month, across ${foodTx.length} orders.`);
}
const CANNED_REPLIES = [
  "Based on your recent transactions, that category is trending slightly above last month.",
  "Here's the pattern I'm seeing: weekends account for a large share of your discretionary spending.",
  "You're on track with your budget overall — just keep an eye on shopping this week.",
  "That's a great question — once the backend is connected I'll be able to run the real numbers for you.",
  "Try setting a category-specific limit for that — it usually helps keep things predictable."
];
document.getElementById("chatForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const val = input.value.trim();
  if(!val) return;
  addMsg("user", val);
  input.value="";
  const typing = document.createElement("div");
  typing.className = "typing-dots";
  typing.innerHTML = "<span></span><span></span><span></span>";
  chatBody.appendChild(typing);
  chatBody.scrollTop = chatBody.scrollHeight;
  setTimeout(()=>{
    typing.remove();
    addMsg("bot", pick(CANNED_REPLIES));
  }, 1100);
});

/* ---------------------------------------------------------
   15. QUICK ADD MODAL
--------------------------------------------------------- */
const quickBackdrop = document.getElementById("quickModalBackdrop");
let quickCategory = null;
function openQuickModal(){
  document.getElementById("quickForm").reset();
  quickCategory = null;
  buildCategoryGrid(document.getElementById("quickCategoryGrid"), (c)=>{ quickCategory=c; }, null);
  quickBackdrop.classList.add("show");
}
function closeQuickModal(){ quickBackdrop.classList.remove("show"); }
document.getElementById("quickAddBtn").addEventListener("click", openQuickModal);
document.getElementById("fab").addEventListener("click", openQuickModal);
document.getElementById("quickModalClose").addEventListener("click", closeQuickModal);
document.getElementById("quickCancel").addEventListener("click", closeQuickModal);
quickBackdrop.addEventListener("click", (e)=>{ if(e.target===quickBackdrop) closeQuickModal(); });

document.getElementById("quickForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const amount = parseFloat(document.getElementById("quickAmount").value);
  const title = document.getElementById("quickTitle").value.trim();
  if(!amount || amount<=0 || !title){ toast("error","Missing details","Add an amount and a title to continue."); return; }

  const payload = {
    type: "expense",
    amount,
    title,
    description: "",
    category: quickCategory || "Others",
    payment_method: "UPI",
    date: fmtISO(new Date()),
    notes: ""
  };

  const saved = await createTransaction(payload);
  if (!saved) { toast("error","Save failed","Could not save to server."); return; }

  closeQuickModal();
  await reloadAll();
  toast("success","Expense added", `${title} · ${money(amount)}`);

  const active = document.querySelector(".page.active").id.replace("page-","");
  if(active==="dashboard") renderDashboard();
  if(active==="transactions") drawTxTable();
  if(active==="analytics") renderAnalytics();
});

/* ---------------------------------------------------------
   16. SETTINGS PAGE
--------------------------------------------------------- */
document.getElementById("setCurrency").addEventListener("change", (e)=>{
  CURRENCY = e.target.value;
  // Refresh all active views with new currency
  const active = document.querySelector(".page.active").id.replace("page-","");
  if(active==="dashboard") renderDashboard();
  if(active==="transactions") drawTxTable();
  if(active==="analytics") renderAnalytics();
  if(active==="insights") renderInsights();
  // Also refresh preview card if on add page
  if(active==="add"){ document.getElementById("currencyPrefix").textContent = CURRENCY; updatePreview(); }
});
document.getElementById("saveProfile").addEventListener("click", ()=>{
  toast("success","Profile saved","Your changes have been updated.");
});
document.getElementById("savePrefs").addEventListener("click", ()=>{
  MONTHLY_BUDGET = parseFloat(document.getElementById("setBudget").value) || MONTHLY_BUDGET;
  toast("success","Preferences saved", `Monthly budget set to ${money(MONTHLY_BUDGET)}.`);
  renderDashboard();
});
document.getElementById("setNotif").addEventListener("change", (e)=>{
  toast("info", e.target.checked ? "Notifications on" : "Notifications off", "This preference is saved locally.");
});
document.getElementById("logoutBtn").addEventListener("click", () => {
    logout();
});
document.getElementById("exportBtn").addEventListener("click", ()=>{
  toast("info","Preparing export","Your CSV export will be ready shortly (preview only).");
});
document.getElementById("backupBtn").addEventListener("click", ()=>{
  toast("success","Backup complete","Your data snapshot has been saved (preview only).");
});
document.getElementById("logoutBtn").addEventListener("click", ()=>{
  const currentUser = JSON.parse(localStorage.getItem("user"));
const name = currentUser ? currentUser.full_name : "User";

toast("info", "Signed out", `See you again soon, ${name}.`);
});

/* ---------------------------------------------------------
   17. GLOBAL SEARCH + KEYBOARD SHORTCUTS
--------------------------------------------------------- */
const globalSearch = document.getElementById("globalSearch");
globalSearch.addEventListener("keydown",(e)=>{
  if(e.key==="Enter"){
    goToPage("transactions"); history.replaceState(null,"","#transactions");
    document.getElementById("txSearch").value = globalSearch.value;
    currentPage=1; drawTxTable();
  }
});
document.addEventListener("keydown",(e)=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="n"){
    e.preventDefault(); goToPage("add"); history.replaceState(null,"","#add");
  }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="k"){
    e.preventDefault(); globalSearch.focus();
  }
  if(e.key==="Escape"){
    closeEditModal(); closeDeleteModal(); closeQuickModal();
  }
});
document.getElementById("notifBtn").addEventListener("click", ()=>{
  toast("info","No new notifications","You're all caught up for now.");
});

/* ---------------------------------------------------------
   18. INIT
--------------------------------------------------------- */
async function init(){
  const savedTheme = localStorage.getItem("ledger-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("setDarkMode").checked = savedTheme === "dark";

  await reloadAll();
  goToPage(initialPageFromHash());

  setTimeout(()=>{
    document.getElementById("preloader").classList.add("hide");
  }, 900);
}
// ======================
// Load logged in user
// ======================
const currentUser = JSON.parse(localStorage.getItem("user"));

if (currentUser) {
  const userName = document.getElementById("userName");

if (userName) {
    userName.textContent = currentUser.full_name.toUpperCase();
}
const profileUserName = document.getElementById("profileUserName");

if (profileUserName) {
    profileUserName.textContent = currentUser.full_name;
}
const profileEmail = document.getElementById("profileEmail");

if (profileEmail) {
    profileEmail.textContent = currentUser.email;
}
const setName = document.getElementById("setName");
const setEmail = document.getElementById("setEmail");

if (setName) {
    setName.value = currentUser.full_name;
}

if (setEmail) {
    setEmail.value = currentUser.email;
}

    // Avatar in top bar
    const avatar = document.getElementById("userInitials");
    if (avatar) {
        const initials = currentUser.full_name
            .split(" ")
            .map(name => name[0])
            .join("")
            .toUpperCase();

        avatar.textContent = initials;
    }

    // Avatar in settings/profile
    const profileAvatar = document.getElementById("profileAvatar");
    if (profileAvatar) {
        const initials = currentUser.full_name
            .split(" ")
            .map(name => name[0])
            .join("")
            .toUpperCase();

        profileAvatar.textContent = initials;
    }
}

init();
})();
