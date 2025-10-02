// shelter.js
(function () {
  let map;
  let shelterMarkers = [];
  let emergencyMarkers = [];

  // ========================
  // CSV 파서 (간단 버전)
  // ========================
  function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");
    return lines.slice(1).map(line => {
      const cols = line.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = cols[i] ? cols[i].trim() : "";
      });
      return obj;
    });
  }

  // ========================
  // 지정避難所 (shelters.csv)
  // ========================
  async function loadShelters() {
    const res = await fetch("/csv/shelters/shelters.csv");
    const text = await res.text();
    const data = parseCSV(text);

    data.forEach(item => {
      const lat = parseFloat(item["緯度"]);
      const lng = parseFloat(item["経度"]);
      if (!lat || !lng) return;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: item["名称"] || item["施設名"] || "指定避難所",
        icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }
      });

      const info = new google.maps.InfoWindow({
        content: `
          <div style="min-width:200px">
            <b>${item["名称"] || item["施設名"]}</b><br>
            ${item["住所"] || ""}<br>
            種別: 指定避難所
          </div>
        `
      });

      marker.addListener("click", () => info.open(map, marker));
      shelterMarkers.push(marker);
    });
  }

  // ========================
  // 지정緊急避難場所 (emergency.csv)
  // ========================
  async function loadEmergencyShelters() {
    const res = await fetch("/csv/shelters/emergency.csv");
    const text = await res.text();
    const data = parseCSV(text);

    data.forEach(item => {
      const lat = parseFloat(item["緯度"]);
      const lng = parseFloat(item["経度"]);
      if (!lat || !lng) return;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: item["名称"] || item["施設名"] || "指定緊急避難場所",
        icon: { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }
      });

      const info = new google.maps.InfoWindow({
        content: `
          <div style="min-width:200px">
            <b>${item["名称"] || item["施設名"]}</b><br>
            ${item["住所"] || ""}<br>
            種別: 指定緊急避難場所
          </div>
        `
      });

      marker.addListener("click", () => info.open(map, marker));
      emergencyMarkers.push(marker);
    });
  }

  // ========================
  // 전국 전체 표시 (enable)
  // ========================
  async function enable(mapInstance) {
    map = mapInstance;
    await loadShelters();
    await loadEmergencyShelters();
    [...shelterMarkers, ...emergencyMarkers].forEach(m => m.setMap(map));
  }

  // ========================
  // disable (모두 제거)
  // ========================
  function disable() {
    [...shelterMarkers, ...emergencyMarkers].forEach(m => m.setMap(null));
    shelterMarkers = [];
    emergencyMarkers = [];
  }

  window.ShelterFeature = { enable, disable };
})();