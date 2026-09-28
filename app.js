const areas = [
    "Town Center",
    "Public Market",
    "Municipal Hall",
    "Bus Terminal",
    "University",
    "Residential Area",
  ],
  $ = (s) => document.querySelector(s);
function fill(el) {
  el.innerHTML =
    '<option value="">Choose location</option>' +
    areas.map((x) => `<option>${x}</option>`).join("");
}
fill($("[name=pickup]"));
fill($("[name=destination]"));
fill($("#p"));
fill($("#d"));
async function api(url, opt = {}) {
  let r = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...opt,
    }),
    j = await r.json();
  if (!r.ok) throw Error(j.error);
  return j;
}
$("#form").onsubmit = async (e) => {
  e.preventDefault();
  let x = Object.fromEntries(new FormData(e.target));
  x.passengers = +x.passengers;
  try {
    let r = await api("/api/rides", {
      method: "POST",
      body: JSON.stringify(x),
    });
    $("#msg").textContent = `Booking ${r.code} created — ${r.status}`;
    e.target.reset();
    loadBookings();
  } catch (err) {
    $("#msg").textContent = err.message;
  }
};
$("#find").onclick = loadRoutes;
async function loadRoutes() {
  let p = $("#p").value,
    d = $("#d").value;
  if (!p || !d || p === d) {
    $("#routes").textContent = "Choose two different locations.";
    return;
  }
  try {
    let rows = await api(
      `/api/routes?pickup=${encodeURIComponent(p)}&destination=${encodeURIComponent(d)}`,
    );
    $("#routes").innerHTML = rows.length
      ? rows
          .map(
            (t) =>
              `<article class="item"><b>${t.driver} · ${t.plate}</b><p>${t.pickup} → ${t.destination}<br>${t.available} seat(s) available (${t.occupied}/${t.capacity} occupied)<br>Wait: ${t.wait} min<br>Next departure: ${t.next}</p>${t.available ? `<button data-join="${t.id}">Join ride (+1)</button>` : "FULL"}</article>`,
          )
          .join("")
      : "No exact route match found.";
    document.querySelectorAll("[data-join]").forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            await api("/api/trikes/" + b.dataset.join + "/join", {
              method: "POST",
              body: "{}",
            });
            loadRoutes();
          } catch (e) {
            alert(e.message);
          }
        }),
    );
  } catch (e) {
    $("#routes").textContent = e.message;
  }
}
async function loadBookings() {
  try {
    let rows = await api("/api/rides");
    $("#bookings").innerHTML = rows.length
      ? rows
          .map(
            (r) =>
              `<article class="item"><b>${r.code} · ${r.name}</b><p>${r.pickup} → ${r.destination}<br>${r.passengers} passenger(s)</p><label>Status<select data-id="${r.id}">${["Waiting", "Driver Confirmed", "On the Way", "In Progress", "Completed", "Cancelled"].map((s) => `<option ${s === r.status ? "selected" : ""}>${s}</option>`).join("")}</select></label></article>`,
          )
          .join("")
      : "No bookings yet.";
    document
      .querySelectorAll("[data-id]")
      .forEach(
        (s) =>
          (s.onchange = () =>
            api("/api/rides/" + s.dataset.id, {
              method: "PATCH",
              body: JSON.stringify({ status: s.value }),
            }).catch((e) => alert(e.message))),
      );
  } catch (e) {
    $("#bookings").textContent = e.message;
  }
}
$("#refresh").onclick = loadBookings;
loadBookings();
