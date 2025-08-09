// ----- booking.js -----
const nodemailer = require('nodemailer');

// Läs gärna in användarnamn & lösen från miljövariabler
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,       // t.ex. din@gmail.com
    pass: process.env.MAIL_PASS        // ditt app-lösenord
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  const staffSelect = document.getElementById("staff-select");
  const datetimeInput = document.getElementById("datetime");
  const form = document.getElementById("booking-form");

  // 1) Läs staffId från URL (förvalet)
  const params = new URLSearchParams(window.location.search);
  const initialStaffId = params.get("staffId");

  // 2) Hämta all personal för dropdown
  const staffRes = await fetch("http://localhost:5000/api/staff");
  const staffList = await staffRes.json();
  staffList.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === initialStaffId) opt.selected = true;
    staffSelect.appendChild(opt);
  });

  // 3) Funktion för att (åter)initiera flatpickr med upptagna tider
  let picker = null;
  async function initPicker() {
    // Hämta redan bokade tider för vald personal
    const sid = staffSelect.value;
    const bRes = await fetch(`http://localhost:5000/api/bookings?staffId=${sid}`);
    const bookings = await bRes.json();

    // Diskutoffiler för flatpickr
    const disabled = bookings.map(b => b.datetime);

    // Återställ befintlig datepicker
    if (picker) picker.destroy();

    picker = flatpickr(datetimeInput, {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      minDate: "today",
      minTime: "07:00",
      maxTime: "18:00",
      disable: disabled
    });
  }

  // Initiera första gången
  await initPicker();

  // Om jag byter personal i dropdown – ladda om upptagna tider
  staffSelect.addEventListener("change", initPicker);

  // 4) När formuläret skickas
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {
      staffId: formData.get("staffId"),
      datetime: formData.get("datetime"),
      need: formData.get("need"),
      address: formData.get("address")
    };

    try {
      // a) Skicka bokningen till ditt API
      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(res.status);

      // b) Öppna mailklient med mailto
      const subject = encodeURIComponent("Ny bokning: " + payload.datetime);
      const body = encodeURIComponent(
        `Behov: ${payload.need}\n` +
        `Adress: ${payload.address}\n` +
        `Personal: ${
          staffSelect.selectedOptions[0].text
        }\n` +
        `Tid: ${payload.datetime}`
      );
      window.location.href =
        `mailto:olle@swebsstudio.com?subject=${subject}&body=${body}`;
    } catch (err) {
      console.error("Fel vid bokning:", err);
      alert("Något gick fel vid bokningen. Försök igen.");
    }
  });
});
