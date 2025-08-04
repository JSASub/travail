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

// Sauvegarde des informations du DP avec la date comme identifiant
document.getElementById("valider-dp").addEventListener("click", () => {
  const nomDP = document.getElementById("dp-nom").value.trim();
  const date = document.getElementById("dp-date").value;
  const lieu = document.getElementById("dp-lieu").value.trim();

  if (!nomDP || !date || !lieu) {
    alert("Veuillez remplir tous les champs du DP.");
    return;
  }

  const dpData = {
    nom: nomDP,
    date: date,
    lieu: lieu
  };

  const dpKey = `dpInfo/${date}`;
  set(ref(db, dpKey), dpData)
    .then(() => {
      document.getElementById("dp-message").textContent = "Informations du DP enregistrées avec succès.";
      document.getElementById("dp-message").style.color = "green";
    })
    .catch((error) => {
      document.getElementById("dp-message").textContent = "Erreur lors de l'enregistrement : " + error.message;
      document.getElementById("dp-message").style.color = "red";
    });
});

// Chargement des infos DP du jour au démarrage
document.addEventListener("DOMContentLoaded", () => {
  const dpNomInput = document.getElementById("dp-nom");
  const dpDateInput = document.getElementById("dp-date");
  const dpLieuInput = document.getElementById("dp-lieu");

  const dbRef = ref(db);
  const today = new Date().toISOString().split("T")[0];

  dpDateInput.value = today;

  get(child(dbRef, `dpInfo/${today}`)).then((snapshot) => {
    if (snapshot.exists()) {
      const dpData = snapshot.val();
      dpNomInput.value = dpData.nom || "";
      dpLieuInput.value = dpData.lieu || "";
      document.getElementById("dp-message").textContent = "Informations du jour chargées.";
      document.getElementById("dp-message").style.color = "blue";
    }
  }).catch((error) => {
    console.error("Erreur de lecture des données DP :", error);
  });
});

// Chargement de l'historique des DP
function chargerHistoriqueDP() {
  const dpDatesSelect = document.getElementById("dp-dates");
  const historiqueInfo = document.getElementById("historique-info");

  const dbRef = ref(db);

  get(child(dbRef, "dpInfo")).then((snapshot) => {
    if (snapshot.exists()) {
      const dpInfos = snapshot.val();

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

document.addEventListener("DOMContentLoaded", chargerHistoriqueDP);



// Initialize Firebase app & database
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Local state
let dp = [];
let plongeurs = [];
let palanquees = [];

document.addEventListener("DOMContentLoaded", () => {
  const dpNom = document.getElementById("dp-nom");
  const dpDate = document.getElementById("dp-date");
  const dpLieu = document.getElementById("dp-lieu");
  const dpMessage = document.getElementById("dp-message");

  const plongeursDispo = document.getElementById("plongeurs-disponibles");
  const palanqueesContainer = document.getElementById("palanquees");
  const ajouterBtn = document.getElementById("ajouter-plongeur");
  const ajouterPalanqueeBtn = document.getElementById("ajouter-palanquee");
  const importInput = document.getElementById("import-json");
   
// DOM helpers
function $(id) {
  return document.getElementById(id);
}
<!--rajout-->
  document.get>ElementById("valider-dp").onclick = () => {
    if (dpNom.value && dpDate.value && dpLieu.value) {
	const dpnom = dpNom.value;
	const dpdate = dpDate.value;
	const dplieu = dpLieu.value;
    dp[0] = { nom: dpnom, date: dpdate, lieu: dplieu, message: "Directeur de plongée validé ✔" };     
		dpMessage.textContent = "Directeur de plongée validé ✔";
		syncToDatabase() 
	  <!--
	  dpNom.disabled = true;
      dpDate.disabled = true;
      dpLieu.disabled = true;
	  --> 
    }
  };
<!--rajout-->  

// Render functions

function renderDP() {
  dp.forEach((p, i) => {
		dpNom.value = p.dp-nomnom;
		dpDate.value = p.dp-datedate;
		dpLieu.value = p.dp-lieulieu;
		dpMessage.textContent = p.dp-message;
  });
}
function renderPlongeurs() {
  const liste = $("listePlongeurs");
  liste.innerHTML = "";
  plongeurs.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} (${p.niveau}) [${p.pre}]`;
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

// Sync dp & plongeurs & palanquées to the DB
function syncToDatabase() {
	set(ref(db, 'dp'), dp);
	set(ref(db, 'plongeurs'), plongeurs);
	set(ref(db, 'palanquees'), palanquees);
}

// Subscribe to DB updates on load
onValue(ref(db, 'dp'), snapshot => {
  dp = snapshot.val() || [];
  renderDP();
});
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
  const nom = $("nom").value.trim();
  const niveau = $("niveau").value;
  const pre = $("prerogative").value.trim();
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
