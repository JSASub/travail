// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);


let plongeurs = [];
let palanquees = [];

function $(id) {
  return document.getElementById(id);
}

function renderPlongeurs() {
  const liste = $("listePlongeurs");
  liste.innerHTML = "";
  plongeurs.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} (${p.niveau}) [${p.prerogative}]`;
    li.draggable = true;
    li.dataset.index = i;
    li.addEventListener("dragstart", (e) => {
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
        renderPalanquees();
        renderPlongeurs();
      });
      div.appendChild(p);
    });

    div.addEventListener("dragover", (e) => e.preventDefault());
    div.addEventListener("drop", (e) => {
      const i = e.dataTransfer.getData("text/plain");
      const pl = plongeurs.splice(i, 1)[0];
      palanquee.push(pl);
      renderPalanquees();
      renderPlongeurs();
    });

    container.appendChild(div);
  });
}

function checkAlert(palanquee) {
  const n1s = palanquee.filter(p => p.niveau === "N1");
  const gps = palanquee.filter(p => ["N4", "E2", "E3", "E4"].includes(p.niveau));
  if (n1s.length && gps.length === 0) return true;
  if (palanquee.length === 1) return true;
  if (palanquee.length > 5) return true;
  if (palanquee.some(p => !p.niveau)) return true;
  if (palanquee.filter(p => p.niveau === "N1").length > 1 && gps.length === 0) return true;
  if (palanquee.some(p => p.niveau === "E1") && palanquee.some(p => p.niveau === "N1") && palanquee.length === 2) return true;
  return false;
}

$("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = $("nom").value.trim();
  const niveau = $("niveau").value;
  const pre = $("prerogative").value.trim();
  if (!nom || !niveau) return;
  plongeurs.push({ nom, niveau, prerogative: pre });
  $("nom").value = "";
  $("niveau").value = "";
  $("prerogative").value = "";
  renderPlongeurs();
});

$("addPalanquee").addEventListener("click", () => {
  palanquees.push([]);
  renderPalanquees();
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

$("importJSON").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    plongeurs = JSON.parse(e.target.result);
    renderPlongeurs();
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
	
