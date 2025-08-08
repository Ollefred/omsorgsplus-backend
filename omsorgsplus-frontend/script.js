// ----- script.js -----
// 1) Bas‐URL till ditt staff‐API
const API = "http://localhost:5000/api/staff";

let allStaff = [];

// 2) Hämta all personal och rendera
async function loadStaff() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(res.status);
    allStaff = await res.json();
    renderStaff(allStaff);
  } catch (err) {
    console.error("Kunde inte hämta personal:", err);
    document.getElementById("staff-list").innerHTML = `
      <p class="col-span-full text-center text-red-500">
        ❌ Kunde inte ladda personal. Ladda om sidan.
      </p>`;
  }
}

// 3) Render‐funktion för personal‐kort
function renderStaff(list) {
  const container = document.getElementById("staff-list");
  container.innerHTML = "";  // töm tidigare

  if (list.length === 0) {
    container.innerHTML = `
      <p class="col-span-full text-center text-gray-600">
        Inga matchande träffar
      </p>`;
    return;
  }

  list.forEach(p => {
    console.log("PERSON OBJEKT från API:", p);

    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow hover:shadow-lg cursor-pointer";

    card.innerHTML = `
      <h3 class="font-bold text-xl mb-1">${p.name}</h3>
      <p class="text-sm text-gray-600 mb-2">${p.role}</p>
      <p class="text-yellow-500 mb-2">⭐ ${p.rating?.toFixed(1) || "-"}</p>
      <button class="book-btn bg-blue-500 text-white px-3 py-1 rounded">
        Boka tid
      </button>
    `;

    // Klick på kortet tar till detaljsidan (om du vill behålla den)
    card.addEventListener("click", () => {
      window.location.href = `detail.html?id=${p.id}`;
    });

    // Klick på boka‐knappen → kontaktformulär
    const btn = card.querySelector(".book-btn");
    btn.addEventListener("click", e => {
      e.stopPropagation();  // hindra kort‐onclick
      window.location.href = `booking.html?staffId=${p.id}`;
    });

    container.appendChild(card);
  });
}

// 4) Filter-funktion (behov + stad)
function filterStaff() {
  const need = document.getElementById("need").value.trim().toLowerCase();
  const city = document.getElementById("city").value.trim().toLowerCase();

  const filtered = allStaff.filter(p => {
    const matchNeed = !need ||
      p.role.toLowerCase().includes(need) ||
      p.name.toLowerCase().includes(need);
    const matchCity = !city ||
      (p.city && p.city.toLowerCase().includes(city));
    return matchNeed && matchCity;
  });

  renderStaff(filtered);
}

// 5) Koppla input‐fält till filtrering
document.getElementById("need").addEventListener("input", filterStaff);
document.getElementById("city").addEventListener("input", filterStaff);

// 6) Kicka igång
loadStaff();
