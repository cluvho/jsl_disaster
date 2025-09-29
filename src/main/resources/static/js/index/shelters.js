// shelter.js
(function () {
  let map;
  let shelterMarkers = [];
  let emergencyMarkers = [];
  let pininfo = null;

  // 토글 상태 & 지도 이동 리스너
  let isActive = false;
  let idleListener = null;

  // (옵션) CSV 캐시: 최초 1회만 로드해서 재사용
  let allData = null;

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
  // 사용자 위치 API (/api/me/location)
  // ========================
  async function getUserLocation() {
    try {
      const res = await fetch("/api/me/location", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      return {
        lat: (typeof data.lat === "number") ? data.lat : 35.681236,   // 도쿄 기본
        lon: (typeof data.lon === "number") ? data.lon : 139.767125,
        loggedIn: !!data.loggedIn
      };
    } catch (e) {
      console.warn("[Shelter] 사용자 위치 가져오기 실패, 기본값 사용", e);
      return { lat: 35.681236, lon: 139.767125, loggedIn: false };
    }
  }

  // ========================
  // 거리계산 (하버사인, km)
  // ========================
  function distKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  }
  
  // ========================
  // 대피소 핀 안내
  // ========================
  function createInfoBox() {
    const el = document.createElement("div");
    el.id = "shelter-info";
    el.innerHTML = `
      <div>
        <img src="https://maps.google.com/mapfiles/ms/icons/blue-dot.png" class="info-icon">
        指定避難所
      </div>
      <div>
        <img src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" class="info-icon">
        指定緊急避難場所
      </div>
    `;
    return el;
  }

  // ========================
  // CSV 2종 로드 후 합치기 (1회 캐시)
  // ========================
  async function fetchAllShelters() {
    const [res1, res2] = await Promise.all([
      fetch("/csv/shelters/shelters.csv", { cache: "no-store" }),
      fetch("/csv/shelters/emergency.csv", { cache: "no-store" })
    ]);
    const [text1, text2] = await Promise.all([res1.text(), res2.text()]);
    const data1 = parseCSV(text1).map(d => ({ ...d, type: "指定避難所" }));        // 파란 점
    const data2 = parseCSV(text2).map(d => ({ ...d, type: "指定緊急避難場所" })); // 빨간 점
    return [...data1, ...data2];
  }

  // ========================
  // 마커 정리
  // ========================
  function clearMarkers() {
    [...shelterMarkers, ...emergencyMarkers].forEach(m => m.setMap(null));
    shelterMarkers = [];
    emergencyMarkers = [];
  }

  // ========================
  // 중심(cx, cy) 기준으로 가까운 30개만 표시
  // ========================
  function renderNearest(all, cx, cy) {
    clearMarkers();

    const sorted = all
      .map(item => {
        const lat = parseFloat(item["緯度"]);
        const lng = parseFloat(item["経度"]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { ...item, lat, lng, dist: distKm(cx, cy, lat, lng) };
      })
      .filter(Boolean)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 30);

    sorted.forEach(item => {
      const marker = new google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        map,
        title: item["名称"] || item["施設名"] || item.type,
        icon: {
          url: item.type === "指定避難所"
            ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
        }
      });

      const info = new google.maps.InfoWindow({
        content: `
          <div style="min-width:200px">
            <b>${item["名称"] || item["施設名"] || ""}</b><br>
            ${item["住所"] || ""}<br>
            種別: ${item.type}
          </div>`
      });

      marker.addListener("click", () => info.open(map, marker));

      (item.type === "指定避難所" ? shelterMarkers : emergencyMarkers).push(marker);
    });
  }

  // ========================
  // enable (토글 ON)
  // ========================
  async function enable(mapInstance) {
    map = mapInstance;
    isActive = true;

    try {
      if (!allData) {
        allData = await fetchAllShelters();  // 최초 1회만 로드해서 재사용
      }

      const me = await getUserLocation();
      renderNearest(allData, me.lat, me.lon);
      map.setCenter({ lat: me.lat, lng: me.lon });

      // idle 리스너 중복 방지 후 등록
      if (idleListener) {
        google.maps.event.removeListener(idleListener);
        idleListener = null;
      }
      idleListener = map.addListener("idle", () => {
        if (!isActive) return;                 // OFF 상태면 동작 안 함
        const c = map.getCenter();
        renderNearest(allData, c.lat(), c.lng());
      });
	  if (!pininfo) {
	        pininfo = createInfoBox();
	        map.getDiv().appendChild(pininfo);
	  }
    } catch (e) {
      console.error("[Shelter] enable error:", e);
    }
  }

  // ========================
  // disable (토글 OFF)
  // ========================
  function disable() {
    isActive = false;
    if (idleListener) {
      google.maps.event.removeListener(idleListener);
      idleListener = null;
    }
	if (pininfo) {
      pininfo.remove();
	  pininfo = null;
	}
    clearMarkers();
  }

  window.ShelterFeature = { enable, disable };
})();