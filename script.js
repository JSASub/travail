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

  let palanquees = [];
  let plongeurId = 0;

  document.getElementById("valider-dp").onclick = () => {
    if (dpNom.value && dpDate.value && dpLieu.value) {
      dpNom.disabled = true;
      dpDate.disabled = true;
      dpLieu.disabled = true;
      dpMessage.textContent = "Directeur de plongée validé ✔";
    }
  };

  function creerPlongeurElement(plongeur) {
    const el = document.createElement("div");
    el.className = "plongeur";
    el.draggable = true;
    el.dataset.id = plongeur.id;
    el.textContent = `${plongeur.nom} (${plongeur.niveau}) - ${plongeur.pre}`;
    const removeBtn = document.createElement("span");
    removeBtn.textContent = "↩";
    removeBtn.className = "remove-btn";
    removeBtn.onclick = () => {
      plongeursDispo.appendChild(el);
    };
    el.appendChild(removeBtn);
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", plongeur.id);
    });
    return el;
  }

  ajouterBtn.onclick = () => {
    const nom = document.getElementById("pl-nom").value.trim();
    const niveau = document.getElementById("pl-niveau").value;
    const pre = document.getElementById("pl-pre").value.trim();
    if (!nom || !niveau) return;
    const plongeur = { id: `p${++plongeurId}`, nom, niveau, pre };
    const el = creerPlongeurElement(plongeur);
    plongeursDispo.appendChild(el);
  };

  ajouterPalanqueeBtn.onclick = () => {
    const index = palanquees.length + 1;
    const palDiv = document.createElement("div");
    palDiv.className = "palanquee dropzone";
    palDiv.dataset.index = index;
    const titre = document.createElement("h3");
    titre.textContent = `Palanquée ${index}`;
    palDiv.appendChild(titre);
    palDiv.ondragover = (e) => e.preventDefault();
    palDiv.ondrop = (e) => {
      const id = e.dataTransfer.getData("text/plain");
      const el = document.querySelector(`[data-id='${id}']`);
      if (el) palDiv.appendChild(el);
    };
    palanqueesContainer.appendChild(palDiv);
    palanquees.push(palDiv);
  };

  plongeursDispo.ondragover = (e) => e.preventDefault();
  plongeursDispo.ondrop = (e) => {
    const id = e.dataTransfer.getData("text/plain");
    const el = document.querySelector(`[data-id='${id}']`);
    if (el) plongeursDispo.appendChild(el);
	
  };

  importInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = JSON.parse(event.target.result);
      data.forEach(p => {
        p.id = `p${++plongeurId}`;
        const el = creerPlongeurElement(p);
        plongeursDispo.appendChild(el);
      });
    };
    reader.readAsText(file);
  };
  
  function checkAlerts(palanqueeElement) {
    const plongeurs = palanqueeElement.querySelectorAll('.plongeur');
    const alertContainer = palanqueeElement.querySelector('.alert-container') || document.createElement('div');
    alertContainer.className = 'alert-container';
    alertContainer.innerHTML = '';

    let hasAlert = false;

    if (plongeurs.length === 1) {
        const icon = document.createElement('span');
        icon.className = 'alert-icon';
        icon.title = 'Palanquée avec un seul plongeur';
        icon.textContent = '⚠️';
        alertContainer.appendChild(icon);
        hasAlert = true;
    }

    let hasN1 = false, hasGP = false;
    plongeurs.forEach(p => {
        const niveau = p.dataset.niveau || p.getAttribute('data-niveau') || '';
        if (niveau === 'N1') hasN1 = true;
        if (['E2', 'E3', 'E4'].includes(niveau)) hasGP = true;
    });

    if (hasN1 && !hasGP) {
        const icon = document.createElement('span');
        icon.className = 'alert-icon';
        icon.title = 'Niveau 1 sans guide de palanquée (E2/E3/E4)';
        icon.textContent = '🚨';
        alertContainer.appendChild(icon);
        hasAlert = true;
    }

    if (hasAlert) {
        palanqueeElement.appendChild(alertContainer);
    } else if (alertContainer.parentNode) {
        alertContainer.remove();
    }
}

document.querySelectorAll('.palanquee').forEach(palanquee => {
	console.log("Ici");
    checkAlerts(palanquee);
});

function generatePDF() {
    const preview = document.getElementById('pdfPreview');
    if (!preview) return;

    const clone = document.querySelector('.palanquees-container').cloneNode(true);
    clone.querySelectorAll('.alert-container').forEach(el => el.remove());
    preview.innerHTML = '';
    preview.appendChild(clone);
}

  document.getElementById("export-pdf").onclick = () => {
    const niveau_order = {'E4': 1, 'E3': 2, 'E2': 3, 'E1': 4, 'N4': 5, 'N3': 6, 'N2': 7, 'N1': 8};
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;
    doc.text("Fiche Palanquées", 10, y);
    y += 10;
    doc.text(`DP : ${dpNom.value || ''}`, 10, y);
    y += 8;
    doc.text(`Date : ${dpDate.value || ''}`, 10, y);
    y += 8;
    doc.text(`Lieu : ${dpLieu.value || ''}`, 10, y);
    y += 10;

    palanquees.forEach((p, i) => {
      doc.text(`Palanquée ${i + 1}`, 10, y);
      y += 6;
      
      const plongeurs = Array.from(p.querySelectorAll(".plongeur"));
      plongeurs.sort((a, b) => {
        const nivA = a.textContent.match(/\((.*?)\)/);
        const nivB = b.textContent.match(/\((.*?)\)/);
        const ordA = niveau_order[nivA ? nivA[1] : "N1"] || 99;
        const ordB = niveau_order[nivB ? nivB[1] : "N1"] || 99;
        return ordA - ordB;
      });
      plongeurs.forEach(pl => {

        doc.text(" - " + pl.textContent.replace("↩", "").trim(), 12, y);
        y += 6;
      });
      y += 4;
    });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    document.getElementById("pdf-preview").src = url;
  };
});


  // Export JSON
  document.getElementById("export-json").onclick = () => {
    const plongeurs = Array.from(plongeursDispo.querySelectorAll(".plongeur")).map(el => {
      const parts = el.textContent.split(" ");
      return {
        nom: parts[0],
        niveau: el.textContent.match(/\((.*?)\)/)?.[1] || "",
        pre: el.textContent.split("-")[1]?.trim() || ""
      };
    });
    const blob = new Blob([JSON.stringify(plongeurs, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "plongeurs.json";
    a.click();
  };
  
  document.getElementById("export-pdf").addEventListener("click", () => {
  const dpNom = document.getElementById("dp-nom").value || "(non renseigné)";
  const dpDate = document.getElementById("dp-date").value || "(non renseignée)";
  const dpLieu = document.getElementById("dp-lieu").value || "(non renseigné)";

  let contentHTML = `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Directeur de Plongée</h2>
      <p><strong>Nom :</strong> ${dpNom}</p>
      <p><strong>Date :</strong> ${dpDate}</p>
      <p><strong>Lieu :</strong> ${dpLieu}</p>
      <h2>Palanquées</h2>
  `;

  const palanquees = document.querySelectorAll(".palanquee");
  palanquees.forEach((palanquee, index) => {
    contentHTML += `<h3>Palanquée ${index + 1}</h3><ul>`;
    const plongeurs = palanquee.querySelectorAll(".plongeur");
    plongeurs.forEach(pl => {
      const nom = pl.dataset.nom || pl.textContent;
      const niveau = pl.dataset.niveau || "";
      const pre = pl.dataset.pre || "";
      contentHTML += `<li>${nom} (${niveau}, ${pre})</li>`;
    });
    contentHTML += `</ul>`;
  });

  contentHTML += `</div>`;

  // ✅ Affichage dans l’iframe
  const iframe = document.getElementById("pdf-preview");
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(contentHTML);
  doc.close();

  // ✅ Génération du PDF avec jsPDF
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.html(contentHTML, {
    callback: function (doc) {
      doc.save("palanquees.pdf");
    },
    margin: [10, 10, 10, 10],
    x: 10,
    y: 10,
    autoPaging: 'text',
    html2canvas: { scale: 0.5 }
  });
});

