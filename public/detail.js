// detail.js

// 1) Läs ut id från URL och logga för felsökning
const params = new URLSearchParams(window.location.search);
const id     = params.get("id");
console.log("👉 Det här är id som används:", id);

// 2) Bas-URL mot ditt API
const API_CONTACT = "/api/contact";


async function showProfile() {
  try {
    // 3a) Hämta data för den specifika personen
    const res = await fetch(`${API}/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const p   = await res.json();

    // 3b) Beskrivning – använd fältet description eller fallback-text
    const description = p.description || 
      "Jag är 19 år, studerande och aktiv handbollsspelare, vilket har gett mig ansvarstagande och god samarbetsförmåga. Som social person har jag lätt för att skapa trygghet och bygga relationer med äldre, så att de känner sig sedda och respekterade. Jag älskar att laga mat och kan erbjuda näringsrika, hemlagade måltider som bidrar till både glädje och välmående. Tack vare mina studier har jag också utvecklat goda organisatoriska färdigheter, vilket gör att jag kan sköta vardagssysslor som städning, inköp och tvätt på ett strukturerat och effektivt sätt.";

    // 3c) Profilbild – se till att filnamnet stämmer med din bild i /images
    const imageUrl = "images/fredrik.jpg";

    // 4) Rendera all HTML inuti <div id="profile">
    document.getElementById("profile").innerHTML = `
      <div class="flex flex-col md:flex-row gap-6">
        <img src="${imageUrl}"
             alt="${p.name}"
             class="w-48 h-48 object-cover rounded-full shadow" />

        <div>
          <h2 class="text-2xl font-bold mb-2">${p.name}</h2>
          <p class="text-gray-600 mb-4">${p.role}</p>
          <p class="text-yellow-500 mb-4">⭐ ${p.rating != null ? p.rating.toFixed(1) : "–"}</p>
          <p class="text-gray-700 leading-relaxed">${description}</p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("❌ Kunde inte hämta profildata:", err);
    document.getElementById("profile").innerHTML = `
      <p class="text-red-500">Tyvärr gick det inte att ladda profilen. Försök igen senare.</p>
    `;
  }
}

// 5) Kör funktionen direkt när scriptet laddas
showProfile();
