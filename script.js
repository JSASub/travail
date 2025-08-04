// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  onValue
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

// ===== GESTION DP - SYSTEM FIREBASE UNIQUEMENT =====

// Sauvegarde des informations du DP avec la date comme identifiant
document.addEventListener("DOMContentLoaded", () => {
  // Chargement des infos DP du jour au démarrage
  const dpNomInput = document.getElementById("dp-nom");
  const dpDateInput = document.getElementById("dp-date");
  const dpLieuInput = document.getElementById("dp-lieu");

  const dbRef = ref(db);
  const today = new Date().toISOString().split("T")[0];

  dpDateInput.value = today;

  get(child(dbRef, `dpInfo/${today}`)).then((snapshot) => {
    if (snapshot.exists()) {
      const dpData = snapshot.val();
      console.log("Données DP chargées:", dpData);
      dpNomInput.value = dpData.nom || "";
      dpLieuInput.value = dpData.lieu || "";
      const dpMessage = document.getElementById("dp-message");
      dpMessage.textContent = "Informations du jour chargées.";
      dpMessage.style.color = "blue";
    } else {
      console.log("Aucune donnée DP pour aujourd'hui");
    }
  }).catch((error) => {
    console.error("Erreur de lecture des données DP :", error);
  });

  // Gestionnaire de validation DP
  document.getElementById("valider-dp").addEventListener("click", () => {
    const nomDP = document.getElementById("dp-nom").value.trim();
    const date = document.getElementById("dp-date").value;
    const lieu = document.getElementById("dp-lieu").value.trim();
    
    console.log("Clic détecté :", nomDP, date, lieu);

    if (!nomDP || !date || !lieu) {
      alert("Veuillez remplir tous les champs du DP.");
      return;
    }

    const dpData = {
      nom: nomDP,
      date: date,
      lieu: lieu,
      timestamp: Date.now()
    };

    const dpKey = `dpInfo/${date}`;
    
    // Affichage en attente
    const dpMessage = document.getElementById("dp-message");
    dpMessage.textContent = "Enregistrement en cours...";
    dpMessage.style.color = "orange";
    
    set(ref(db, dpKey), dpData)
      .then(() => {
        console.log("Données DP sauvegardées avec succès");
        dpMessage.classList.add("success-icon");
        dpMessage.textContent = " Informations du DP enregistrées avec succès.";
        dpMessage.style.color = "green";
      })
      .catch((error) => {
        console.error("Erreur Firebase:", error);
        dpMessage.classList.remove("success-icon");
        dpMessage.textContent = "Erreur lors de l'enregistrement : " + error.message;
        dpMessage.style.color = "red";
      });
  });

  // Chargement de l'historique des DP
  chargerHistoriqueDP();
});

// Chargement de l'historique des DP
function chargerHistoriqueDP() {
  const dpDatesSelect = document.getElementById("dp-dates");
  const historiqueInfo = document.getElementById("historique-info");

  const dbRef = ref(db);

  get(child(dbRef, "dpInfo")).then((snapshot) => {
    if (snapshot.exists()) {
      const dpInfos = snapshot.val();

      // Vider les options existantes (sauf la première)
      dpDatesSelect.innerHTML = '<option value="">-- Choisir une date --</option>';

      for (const date in dpInfos) {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = date;
        dpDatesSelect.appendChild(option);
      }

      dpDatesSelect.addEventListener("change", () => {
        const selectedDate = dpDatesSelect.value;
        if (selectedDate && dpInfos[selectedDate]) {
          const dp = dpInfos[selectedDate];
          historiqueInfo.innerHTML = `
            <p><strong>Nom :</strong> ${dp.nom}</p>
            <p><strong>Lieu :</strong> ${dp.lieu}</p>
          `;
        } else {
          historiqueInfo.innerHTML = "";
        }
      });
    }
  }).catch((error) => {
    console.error("Erreur de lecture de l'historique DP :", error);
  });
}

// ===== GESTION PLONGEURS ET PALANQUEES =====

// Local state (UNIQUEMENT pour plongeurs et palanquees)
let plongeurs = [];
let palanquees = [];

// DOM helpers
function $(id) {
  return document.getElementById(id);
}

// Render functions
function renderPlongeurs() {
  const liste = $("listePlongeurs");
  liste.innerHTML = "";
  plongeurs.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} (${p.niveau}) [${p.pre || ''}]`;
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
      p.textContent = `${plg.nom} (${plg.niveau}) [${plg.pre || ''}]`;
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

// Alert logic
function checkAlert(palanquee) {
  const n1s = palanquee.filter(p => p.niveau === "N1");
  const gps = palanquee.filter(p => ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
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

// Sync UNIQUEMENT plongeurs & palanquées to the DB
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
document.addEventListener("DOMContentLoaded", () => {
  $("addForm").addEventListener("submit", e => {
    e.preventDefault();
    const nom = $("nom").value.trim();
    const niveau = $("niveau").value;
    const pre = $("pre").value.trim(); // Correction: utilise "pre" au lieu de "prerogative"
    if (!nom || !niveau) return;
    plongeurs.push({ nom, niveau, pre });
    $("nom").value = "";
    $("niveau").value = "";
    $("pre").value = ""; // Correction: utilise "pre"
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
    // Récupération des vraies valeurs du DP
    const dpNom = $("dp-nom").value;
    const dpDate = $("dp-date").value;
    const dpLieu = $("dp-lieu").value;
    
    let html = `<h1>Palanquées JSAS</h1><p><strong>DP :</strong> ${dpNom} | <strong>Date :</strong> ${dpDate} | <strong>Lieu :</strong> ${dpLieu}</p>`;
    palanquees.forEach((pal, i) => {
      html += `<h2>Palanquée ${i + 1}</h2><ul>`;
      pal.forEach(p => {
        html += `<li>${p.nom} (${p.niveau}) [${p.pre || ''}]</li>`;
      });
      html += `</ul>`;
    });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    $("previewContainer").style.display = "block";
    $("pdfPreview").src = url;
  });
});