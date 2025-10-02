// /js/index/myLocation.js
(function () {
  let myMarker = null;

  // _map 준비될 때까지 잠깐만 대기
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

    const res = await fetch("/api/me/location", { cache: "no-store" });
    const j = await res.json();
    const pos = { lat: j.lat, lng: j.lon };

    // 내 위치 마커 (심플)
    myMarker = new google.maps.Marker({
      map,
      position: pos,
      title: "My Location",
	  icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
          scaledSize: new google.maps.Size(35, 35)
		  }
    });
	
	map.setCenter(pos);
	
  }
  

  document.addEventListener("DOMContentLoaded", run);
})();