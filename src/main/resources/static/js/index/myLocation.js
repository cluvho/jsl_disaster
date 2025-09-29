(function () {
  let myMarker = null;

  // _map 준비될 때까지 대기
  function waitFor(fn, interval = 100, tries = 50) {
    return new Promise(resolve => {
      const t = setInterval(() => {
        const v = fn();
        if (v || --tries <= 0) { clearInterval(t); resolve(v || null); }
      }, interval);
    });
  }

  async function run() {
    const map = await waitFor(() => window._map);
    if (!map) return;

    try {
      const res = await fetch("/api/me/location", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = await res.json();

      const lat = typeof j.lat === "number" ? j.lat : parseFloat(j.lat);
      const lon = typeof j.lon === "number" ? j.lon : parseFloat(j.lon);
      if (!isFinite(lat) || !isFinite(lon)) throw new Error("Invalid lat/lon");

      const pos = { lat, lng: lon };

      // 마커 갱신/생성
      if (myMarker) {
        myMarker.setPosition(pos);
      } else {
        myMarker = new google.maps.Marker({
          map,
          position: pos,
          title: j.loggedIn ? "내 위치" : "기본 위치",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
            scaledSize: new google.maps.Size(35, 35)
          }
        });
      }

      // 카메라 이동 (줌은 유지, 필요하면 setZoom 추가)
      map.setCenter(pos);
      // map.setZoom(13); // 필요 시 주석 해제

    } catch (e) {
      console.error("[myLocation] 위치 불러오기 실패:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", run);
})();