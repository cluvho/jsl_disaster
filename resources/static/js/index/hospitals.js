(function () {
  let map;
  let isActive = false;

  // 상태/리스너
  let idleListener = null;
  let debTimer = null;
  let lastCenter = null;     // {lat, lng} 형태
  let lastZoom = null;

  // 마커 & info
  let uniMarkers = [];       // 대학병원
  let generalMarkers = [];    // 종합병원
  let hospitalinfo = null;

  // 아이콘 (내 아이콘으로 교체 가능)
  const ICON_UNI_URL = "/images/generalhospital.png";
  const ICON_GEN_URL = "/images/hospital.png"; 

  // 표시/조회 옵션
  const MAX_RESULTS = 30;
  const RADIUS_M = 4000;       // Overpass 반경
  const DEBOUNCE_MS = 600;     // idle 디바운스
  const MOVE_THRESHOLD_M = 500; // 이 이상 이동/줌 변화 시 재조회
  const MIN_ZOOM = 12;         // 너무 멀면 조회 안 함

  // 그리드 캐시 (~500m 격자)
  const gridCache = new Map();
  function gridKey(lat, lng) {
	const k = 200;
    const latK = Math.round(lat * k) / k;
    const lngK = Math.round(lng * k) / k;
    return `${latK},${lngK}`;
  }

  // 사용자 위치
  async function getUserLocation() {
    try {
      const res = await fetch("/api/me/location", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      return {
        lat: (typeof data.lat === "number") ? data.lat : 35.681236,
        lon: (typeof data.lon === "number") ? data.lon : 139.767125,
      };
    } catch (e) {
      console.warn("[HospitalOSM] 사용자 위치 실패, 기본값 사용", e);
      return { lat: 35.681236, lon: 139.767125 };
    }
  }

  // Overpass 쿼리
  async function fetchOSMNearby(lat, lon, radiusM = RADIUS_M) {
    const query = `
      [out:json][timeout:25];
      (
		node["amenity"="hospital"](around:${radiusM},${lat},${lon});
		way ["amenity"="hospital"](around:${radiusM},${lat},${lon});
		relation ["amenity"="hospital"](around:${radiusM},${lat},${lon});
      );
      out center tags;`;
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
      body: query
    });
    if (!res.ok) throw new Error("Overpass HTTP " + res.status);
    const data = await res.json();
    return data?.elements || [];
  }

  // 분류: 대학병원 vs 개인병원
  function classify(item) {
    const tags = item.tags || {};
	const opType = (tags["operator:type"] || "").toLowerCase();
	const name = (tags.name || "");
	const isUniversity =
	  opType === "university" ||
	  /대학병원|university hospital|universitätsklinikum|大学病院/i.test(name);
	return isUniversity ? "uni" : "general";
  }

  // 거리(m) — 하버사인 (geometry 라이브러리 불필요)
  function distanceM(lat1, lon1, lat2, lon2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // 마커 관리
  function clearMarkers() {
    [...uniMarkers, ...generalMarkers].forEach(m => m.setMap(null));
    uniMarkers = [];
    generalMarkers = [];
  }

  function makeMarker(lat, lon, title, type) {
    const isUni = (type === "uni");
    const iconUrl = isUni ? ICON_UNI_URL : ICON_GEN_URL;

	const transparentIcon = {
	    url: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", // 1x1 px 투명 GIF
	    scaledSize: new google.maps.Size(1, 1)
	  };

	  const marker = new google.maps.Marker({
	    map,
	    position: { lat, lng: lon },
	    title: title || (isUni ? "대학병원" : "종합병원"),
	    icon: transparentIcon,   // <-- 여기서 빨간핀 제거
	    clickable: false
	  });

    // ★ 검은 배경 라벨: “이름 위 / 아이콘 아래”로 세로 배치
    if (window.makeLabel) {
      const name = escapeHtml(title || (isUni ? "대학병원" : "종합병원"));
      const html = `
        <div style="
          display:flex;
          flex-direction:column;   /* 세로배치 */
          align-items:center;
          gap:2px;
          line-height:1.1;
        ">
          <div style="font-weight:600">${name}</div>   <!-- 이름(위) -->
          <img src="${iconUrl}" style="width:18px;height:18px"> <!-- 아이콘(아래) -->
        </div>`;

      const label = window.makeLabel(
        map,
        { lat, lng: lon },
        html,
        14,         // 글자 크기
        800         // z-index
      );

      // clearMarkers에서 같이 지우도록 배열에 넣어둠
      (isUni ? uniMarkers : generalMarkers).push(label);
    }

    return marker;
  }

  // info 박스
  function createInfoBox() {
    const el = document.createElement("div");
    el.id = "hospital-info";
    el.innerHTML = `
      <div><img src="${ICON_UNI_URL}" class="info-icon">大学病院</div>
      <div><img src="${ICON_GEN_URL}" class="info-icon">総合病院</div>`;
    return el;
  }

  // 가까운 30개만 렌더
  function renderNearest(elements, centerLat, centerLon) {
    clearMarkers();

    const withCoord = elements.map(el => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return { ...el, _lat: lat, _lon: lon };
    }).filter(Boolean);

    const nearest = withCoord
      .map(el => ({ ...el, _dist: distanceM(centerLat, centerLon, el._lat, el._lon) }))
      .sort((a, b) => a._dist - b._dist)
      .slice(0, MAX_RESULTS);

    nearest.forEach(el => {
      const type = classify(el);
      const title = el.tags?.name || (type === "uni" ? "대학병원" : "종합병원");
      const marker = makeMarker(el._lat, el._lon, title, type);
      if (type === "uni") uniMarkers.push(marker);
      else generalMarkers.push(marker);
    });
  }

  // 안전한 HTML
  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // 스마트 조회(디바운스/이동임계/캐시)
  async function fetchAndRenderSmart() {
    if (!isActive) return;
    const c = map.getCenter();
    const z = map.getZoom();
    const centerLat = c.lat();
    const centerLon = c.lng();

    if (z < MIN_ZOOM) return;

    // 이동거리/줌 변화 체크
    const movedEnough = () => {
      if (!lastCenter) return true;
      const d = distanceM(lastCenter.lat, lastCenter.lng, centerLat, centerLon);
      return d >= MOVE_THRESHOLD_M || z !== lastZoom;
    };
    if (!movedEnough()) return;

    lastCenter = { lat: centerLat, lng: centerLon };
    lastZoom = z;

    // 그리드 캐시
    const key = gridKey(centerLat, centerLon);
    if (gridCache.has(key)) {
      renderNearest(gridCache.get(key), centerLat, centerLon);
      return;
    }

    try {
      const elements = await fetchOSMNearby(centerLat, centerLon, RADIUS_M);
      gridCache.set(key, elements);
      renderNearest(elements, centerLat, centerLon);
    } catch (e) {
      console.error("[HospitalOSM] Overpass fetch error:", e);
    }
  }

  // enable / disable
  async function enable(mapInstance) {
    if (isActive) return;
    map = mapInstance;
    isActive = true;

    // 초기 중심: 로그인 사용자 or 도쿄
    const me = await getUserLocation();
    map.setCenter({ lat: me.lat, lng: me.lon });

    // 첫 조회
    await fetchAndRenderSmart();

    // idle 리스너(디바운스)
    if (idleListener) {
      google.maps.event.removeListener(idleListener);
      idleListener = null;
    }
    idleListener = map.addListener("idle", () => {
      clearTimeout(debTimer);
      debTimer = setTimeout(fetchAndRenderSmart, DEBOUNCE_MS);
    });

    // info 박스
    if (!hospitalinfo) {
      hospitalinfo = createInfoBox();
      map.getDiv().appendChild(hospitalinfo);
	  updateLegendLayout();
    }
  }

  function disable() {
    if (!isActive) return;
    isActive = false;
    if (idleListener) {
      google.maps.event.removeListener(idleListener);
      idleListener = null;
    }
    clearTimeout(debTimer);
    debTimer = null;
    clearMarkers();
    if (hospitalinfo) {
      hospitalinfo.remove();
      hospitalinfo = null;
    }
  }

  // 전역 노출
  window.HospitalOSMFeature = { enable, disable };
  window.makeLabel = makeLabel;
})();