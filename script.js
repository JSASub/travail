// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9FO6BiHkm7dOQ3Z4-wpPQRgnsGKg3pmM",
  authDomain: "palanquees-jsas.firebaseapp.com",
  databaseURL: "https://palanquees-jsas-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "palanquees-jsas",
  storageBucket: "palanquees-jsas.firebasestorage.app",
  messagingSenderId: "284449736616",
  appId: "1:284449736616:web:a0949a9b669def06323f9d"
};

// Initialize Firebase app & database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Local state
let plongeurs = [];
let palanquees = [];

// DOM helpers
function $(id) {
  return document.getElementById(id);
}

  document.getElementById("valider-dp").onclick = () => {
    if (dpNom.value && dpDate.value && dpLieu.value) {
      dpNom.disabled = true;
      dpDate.disabled = true;
      dpLieu.disabled = true;
      dpMessage.textContent = "Directeur de plongée validé ✔";
    }
  };
  
// Render functions
function renderPlongeurs() {
  const liste = $("listePlongeurs");
  liste.innerHTML = "";
  plongeurs.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} (${p.niveau}) [${p.prerogative}]`;
    li.draggable = true;
    li.dataset.index = i;
    li.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", i);
    });
    liste.appendChild(li);
  });
}

function renderPalanquees() {
  const container = $("palanqueesContainer");
  container.innerHTML = "";
  palanquees.forEach((palanquee, idx) => {
    const div = document.createElement("div");
    div.className = "palanquee";
    div.dataset.index = idx;
    div.dataset.alert = checkAlert(palanquee) ? "true" : "false";
    div.innerHTML = `<div class="palanquee-title">Palanquée ${idx + 1}</div>`;
    palanquee.forEach((plg, i) => {
      const p = document.createElement("p");
      p.textContent = `${plg.nom} (${plg.niveau}) [${plg.prerogative}]`;
      p.addEventListener("click", () => {
        palanquee.splice(i, 1);
        plongeurs.push(plg);
        syncToDatabase();
        renderPalanquees();
        renderPlongeurs();
      });
      div.appendChild(p);
    });

    div.addEventListener("dragover", e => e.preventDefault());
    div.addEventListener("drop", e => {
      const i = e.dataTransfer.getData("text/plain");
      const pl = plongeurs.splice(i, 1)[0];
      palanquee.push(pl);
      syncToDatabase();
      renderPalanquees();
      renderPlongeurs();
    });

    container.appendChild(div);
  });
}

// Alert logic unchanged
function checkAlert(palanquee) {
  const n1s = palanquee.filter(p => p.niveau === "N1");
  const gps = palanquee.filter(p => ["N4", "E2", "E3", "E4"].includes(p.niveau));
  if (n1s.length && gps.length === 0) return true;
  if (palanquee.length === 1) return true;
  if (palanquee.length > 5) return true;
  if (palanquee.some(p => !p.niveau)) return true;
  if (n1s.length > 1 && gps.length === 0) return true;
  if (palanquee.some(p => p.niveau === "E1") &&
      palanquee.some(p => p.niveau === "N1") &&
      palanquee.length === 2) return true;
  return false;
}

// Sync both plongeurs & palanquées to the DB
function syncToDatabase() {
  set(ref(db, 'plongeurs'), plongeurs);
  set(ref(db, 'palanquees'), palanquees);
}

// Subscribe to DB updates on load
onValue(ref(db, 'plongeurs'), snapshot => {
  plongeurs = snapshot.val() || [];
  renderPlongeurs();
});
onValue(ref(db, 'palanquees'), snapshot => {
  palanquees = snapshot.val() || [];
  renderPalanquees();
});

// UI Event Listeners
$("addForm").addEventListener("submit", e => {
  e.preventDefault();
  const nom = $("pl-nom").value.trim();
  const niveau = $("pl-niveau").value;
  const pre = $("pl-pre").value.trim();
  if (!nom || !niveau) return;
  plongeurs.push({ nom, niveau, prerogative: pre });
  $("nom").value = "";
  $("niveau").value = "";
  $("prerogative").value = "";
  syncToDatabase();
});

$("addPalanquee").addEventListener("click", () => {
  palanquees.push([]);
  syncToDatabase();
});

$("exportJSON").addEventListener("click", () => {
  const data = JSON.stringify(plongeurs, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plongeurs.json";
  a.click();
  URL.revokeObjectURL(url);
});

$("importJSON").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e2 => {
    plongeurs = JSON.parse(e2.target.result);
    syncToDatabase();
  };
  reader.readAsText(file);
});

$("generatePDF").addEventListener("click", () => {
  const dp = $("dp").value;
  const date = $("date").value;
  const lieu = $("lieu").value;
  let html = `<h1>Palanquées</h1><p>DP : ${dp} | Date : ${date} | Lieu : ${lieu}</p>`;
  palanquees.forEach((pal, i) => {
    html += `<h2>Palanquée ${i + 1}</h2><ul>`;
    pal.forEach(p => {
      html += `<li>${p.nom} (${p.niveau}) [${p.prerogative}]</li>`;
    });
    html += `</ul>`;
  });
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  $("previewContainer").style.display = "block";
  $("pdfPreview").src = url;
});
