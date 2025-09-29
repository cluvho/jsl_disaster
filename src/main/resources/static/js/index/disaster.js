// =============================================
// disaster.js — 지진 + 쓰나미 (전국) / 마커 유효시간 포함
//           + 검은 배경 라벨(이모지/이미지) 표시
// =============================================
(function () {
  // =============================================
  // 0) ENDPOINTS (테스트/실사용 전환)
  // =============================================
  const TEST_MODE = true; // true=테스트, false=실제 API 사용
  const MARKER_TIME_WINDOW_MIN = 30;

  const ENDPOINTS_TEST = {
    earthquakes: "/mock/quake.json",
    tsunami: "/mock/tsunami.json",
    warningsBase: "/mock/warningsBase"
  };

  const ENDPOINTS_PROD = {
    // 지진
    earthquakes: "https://www.jma.go.jp/bosai/quake/data/list.json",
    // 쓰나미
    tsunami:     "https://api.p2pquake.net/v2/history?codes=552&limit=50",
    // 경보/주의보
    warningsBase: "https://www.jma.go.jp/bosai/warning/data/warning"
  };

  const ENDPOINTS = TEST_MODE ? ENDPOINTS_TEST : ENDPOINTS_PROD;

  // (옵션) 전국 경보 수집: window.cities 의 code(도도부현 코드)를 사용
  async function fetchAllWarnings() {
    const items = [];
    const prefCities = (window.cities || []).filter(c => c.code);
    for (const c of prefCities) {
      const url = `${ENDPOINTS_PROD.warningsBase}/${c.code}.json`;
      try {
        const r = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!r.ok) continue;
        const j = await r.json();
        const reported = j.reportDatetime || j.targetDateTime || "";
        (j.areaTypes || []).forEach(areaType => {
          (areaType.areas || []).forEach(area => {
            (area.warnings || []).forEach(w => {
              items.push({
                name: w.codeName || w.name || "特報",
                area: area.name || "",
                areaCode: area.code,  // 예: 27100 같은 5자리일 수 있음
                issuedAt: reported
              });
            });
          });
        });
      } catch (e) {
        console.error("[DISASTER] Warning fetch error:", c.code, e);
      }
    }
    return items;
  }

  // =============================================
  // 1) 이모지 & 아이콘
  // =============================================
  const ALERT_EMOJI = {
	"大雨警報": '<i class="bi bi-cloud-rain-heavy-fill"></i>',
	"大雨注意報": '<i class="bi bi-cloud-rain-fill"></i>',
	"洪水警報": '<i class="bi bi-droplet-fill"></i>',
	"洪水注意報": '<i class="bi bi-droplet"></i>',
	"強風注意報": '<i class="bi bi-wind"></i>',
	"暴風注意報": '<i class="bi bi-wind"></i><i class="bi bi-cloud"></i>',
	"暴風警報": '<i class="bi bi-wind"></i>',
	"暴風雪警報": '<i class="bi bi-snow"></i>',
	"大雪警報": '<i class="bi bi-snow"></i>',
	"大雪注意報": '<i class="bi bi-snow"></i>',
	"低温注意報": '<i class="bi bi-thermometer-snow"></i>',
	"熱中症警戒アラート": '<i class="bi bi-thermometer-sun"></i>',
	"猛暑日情報": '<i class="bi bi-brightness-high-fill"></i>',
	"濃霧注意報": '<i class="bi bi-cloud-fog2-fill"></i>',
	"黄砂情報": '<i class="bi bi-cloud-haze2-fill"></i>',
	"雷注意報": '<i class="bi bi-lightning-fill"></i>',
	"乾燥注意報": '<i class="bi bi-brightness-high"></i>',
	"紫外線情報": '<i class="bi bi-sunglasses"></i>'
  };

  function getAlertEmoji(alert) {
    if (!alert) return "⚠️";
    const name = alert.codeName || alert.name;
    return (name && ALERT_EMOJI[name]) ? ALERT_EMOJI[name] : "⚠️";
  }

  // 5자리(시구정촌 등) → 앞 두 자리 + '0000' 로 도도부현 6자리로 표준화
  function toPrefCode(areaCode) {
    const s = String(areaCode || "");
    if (/^\d{5}$/.test(s)) return s.slice(0, 2) + "0000";
    if (/^\d{6}$/.test(s)) return s;          // 이미 6자리(도도부현)면 그대로
    if (/^\d{3,4}$/.test(s)) return s.slice(0, 2) + "0000";
    return null;
  }

  function getDisasterIconUrl(type) {
    switch (type) {
      case "earthquake": return "/images/quake.png";
      case "tsunami":    return "/images/tsunami.png";
      default:           return "/images/default.png";
    }
  }

  // === 검은 배경 텍스트/이모지 라벨(OverlayView) ===
  function makeLabel(map, position, text, fontPx = 16, offsetY = "-120%", zIndex = 600) {
    class LabelOverlay extends google.maps.OverlayView {
      constructor(pos, txt, opt) {
        super();
        this.pos = pos;
        this.txt = txt;
        this.offsetY = opt.offsetY;
        this.zIndex  = opt.zIndex;
        this.div = null;
      }
      onAdd() {
        this.div = document.createElement("div");
        this.div.innerHTML = this.txt;
        Object.assign(this.div.style, {
          position: "absolute",
          transform: `translate(-50%, ${this.offsetY})`,
          background: "rgba(0,0,0,0.65)",
          color: "#fff",
          fontSize: fontPx + "px",
          fontWeight: "bold",
          padding: "2px 6px",
          borderRadius: "6px",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          zIndex: String(this.zIndex),
          pointerEvents: "none"
        });
        this.getPanes().overlayLayer.appendChild(this.div);
      }
      draw() {
        const proj = this.getProjection();
        if (!proj || !this.div) return;
        const point = proj.fromLatLngToDivPixel(this.pos);
        this.div.style.left = point.x + "px";
        this.div.style.top  = point.y + "px";
      }
      onRemove() {
        if (this.div) this.div.remove();
      }
    }

    const overlay = new LabelOverlay(
      new google.maps.LatLng(position.lat, position.lng),
      text,
      { offsetY, zIndex }
    );
    overlay.setMap(map);
    return overlay;
  }

  // === 검은 배경 이미지 라벨(OverlayView): 지진/쓰나미 아이콘용 ===
  function makeIconLabel(map, position, imgUrl, size = 32, zIndex = 600, offsetY = "-50%") {
    class IconOverlay extends google.maps.OverlayView {
      constructor(pos) {
        super();
        this.pos = pos;
        this.div = null;
      }
      onAdd() {
        this.div = document.createElement("div");
        Object.assign(this.div.style, {
          position: "absolute",
          transform: `translate(-50%, ${offsetY})`,
          background: "rgba(0,0,0,0.65)",
          borderRadius: "6px",
          padding: "4px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          zIndex: String(zIndex),
          pointerEvents: "auto" // InfoWindow 클릭 등 허용
        });
        const img = document.createElement("img");
        img.src = imgUrl;
        img.style.width = size + "px";
        img.style.height = size + "px";
        this.div.appendChild(img);
        this.getPanes().overlayMouseTarget.appendChild(this.div);
      }
      draw() {
        const proj = this.getProjection();
        if (!proj || !this.div) return;
        const point = proj.fromLatLngToDivPixel(this.pos);
        this.div.style.left = point.x + "px";
        this.div.style.top  = point.y + "px";
      }
      onRemove() {
        if (this.div) this.div.remove();
      }
    }

    const overlay = new IconOverlay(new google.maps.LatLng(position.lat, position.lng));
    overlay.setMap(map);
    return overlay;
  }

  // =============================================
  // 2) 설정(유효시간/상태/유틸)
  // =============================================
  // 날짜/시간 파서 (ISO8601 & "YYYY/MM/DD HH:mm:ss" 지원)
  function parseEventTime(str) {
    if (!str) return null;
    if (str.includes("T")) {
      const d = new Date(str);          // ISO8601
      return isNaN(+d) ? null : d;
    }
    if (str.includes("/")) {
      const d = new Date(str.replace(" ", "T") + "+09:00"); // JMA/P2P 지진 포맷 → JST
      return isNaN(+d) ? null : d;
    }
    const d = new Date(str);
    return isNaN(+d) ? null : d;
  }

  function isExpired(eventTimeStr, windowMin = MARKER_TIME_WINDOW_MIN) {
    if (TEST_MODE) return false; // 테스트 중엔 항상 표기
    const t = parseEventTime(eventTimeStr);
    if (!t) return false;
    const diffMin = (Date.now() - t.getTime()) / 60000;
    return diffMin > windowMin;
  }

  const $S = { quakeMarkers: [], tsunamiMarkers: [], warnMarkers: [] };

  // cities.js 매칭 (있으면 느슨한 이름 매칭으로 쓰나미 위치 추정)
  const CITY_LIST = (window.cities || []).filter(c => typeof c.lat === "number" && typeof c.lon === "number");
  const norm = s => String(s || "").replace(/[市区町村郡]|[ 　]/g, "");

  const fetchJson = async (url) => {
    try {
      const r = await fetch(url, { headers: { "Accept": "application/json" } });
      const ct = r.headers.get("content-type") || "";
      if (!r.ok) { console.warn("[DISASTER] HTTP", r.status, url); return null; }
      if (!ct.includes("application/json")) {
        const txt = await r.text();
        return null;
      }
      return await r.json();
    } catch (e) {
      console.error("[DISASTER] fetch 예외", url, e);
      return null;
    }
  };

  function clearLayers() {
    $S.quakeMarkers.forEach(m => m.setMap && m.setMap(null));
    $S.tsunamiMarkers.forEach(m => m.setMap && m.setMap(null));
    $S.warnMarkers.forEach(m => m.setMap && m.setMap(null)); // OverlayView도 setMap(null) 동작
    $S.quakeMarkers = [];
    $S.tsunamiMarkers = [];
    $S.warnMarkers = [];
  }

  // 공통: 좌표 추출 (JMA/P2P 다양성 흡수)
  function pickLatLon(f) {
    if (typeof f.lat === "number" && typeof f.lon === "number") return { lat: f.lat, lon: f.lon };
    if (f.geometry?.type === "Point" && Array.isArray(f.geometry.coordinates)) {
      return { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] };
    }
    const hc = f.earthquake?.hypocenter;
    if (hc && typeof hc.latitude === "number" && typeof hc.longitude === "number") {
      return { lat: hc.latitude, lon: hc.longitude };
    }
    return null;
  }

  // 공통: 이벤트 시각 추출
  function pickEventTime(f) {
    return (
      f.properties?.originTime ||
      f.originTime ||
      f.time ||
      f.earthquake?.time ||
      f.properties?.time ||
      null
    );
  }

  // =============================================
  // 3) 렌더: 지진 (검은 배경 + 이미지)
  // =============================================
  
  function renderQuakes(data) {
    if (!data) return;

    const list = Array.isArray(data)
      ? data
      : (data?.type === "FeatureCollection" ? (data.features || []) : []);

    if (!list.length) return;

    list.forEach(f => {
      const when = pickEventTime(f);
      if (isExpired(when)) return;

      const coords = pickLatLon(f);
      if (!coords || typeof coords.lat !== "number" || typeof coords.lon !== "number") return;

      // 🔹 검은 배경 이미지 라벨(지진 아이콘)
      const iconOverlay = makeIconLabel(
        window.map,
        { lat: coords.lat, lng: coords.lon },
        getDisasterIconUrl("earthquake"),
        32,
        620,
        "-50%"
      );
      $S.quakeMarkers.push(iconOverlay);

      // InfoWindow (아이콘 클릭 시 열기)
      const p = f.properties || f.earthquake || {};
      const html = `
        <div style="min-width:220px">
          <div><b>${f.properties?.title || f.title || "地震"}</b></div>
          ${when ? `<div>時刻: ${when}</div>` : ""}
          ${p.mag != null ? `<div>規模: ${p.mag ?? p.magnitude}</div>` : (p.magnitude != null ? `<div>規模: ${p.magnitude}</div>` : "")}
          ${p.maxIntensity ? `<div>最大震度: ${p.maxIntensity}</div>` : (p.maxScale != null ? `<div>最大震度: ${p.maxScale}</div>` : "")}
          ${p.hypocenter?.name ? `<div>震源: ${p.hypocenter.name}</div>` : ""}
          ${p.url ? `<div><a href="${p.url}" target="_blank">詳細</a></div>` : ""}
        </div>`;

      iconOverlay.onAdd = (function (orig) {
        return function () {
          orig.call(iconOverlay);
          const iw = new google.maps.InfoWindow({ content: html });
          iconOverlay.div.style.cursor = "pointer";
          iconOverlay.div.addEventListener("click", () => {
            iw.setPosition(new google.maps.LatLng(coords.lat, coords.lon));
            iw.open({ map: window.map });
          });
        };
      })(iconOverlay.onAdd);
    });
  }

  // =============================================
  // 4) 렌더: 쓰나미 (검은 배경 + 이미지) + 리스트
  // =============================================
  function renderTsunami(data) {
    const events = Array.isArray(data) ? data : (data ? [data] : []);
    if (!events.length) return;

    const ul = document.getElementById("alertsList");
    if (ul) ul.innerHTML = "";

    events.forEach(ev => {
      const when = ev.time || ev.at || ev.reportDatetime || null;
      if (isExpired(when)) return;

      (ev.areas || []).forEach(a => {
        const name = a.name || "津波";
        const grade = a.grade || "";

        if (ul) {
          const li = document.createElement("li");
          li.innerHTML = `<span style="font-size:1.2rem">🌊</span> <b>${name}</b> ${grade ? "· " + grade : ""} <small style="opacity:.7">${when || ""}</small>`;
          ul.appendChild(li);
        }

        // 위치 추정 (도시 이름 기반)
        let city = null;
        const want = norm(name);
        for (const c of CITY_LIST) {
          const nm = norm(c.city || c.name || "");
          if (!nm) continue;
          if (want.includes(nm) || nm.includes(want)) { city = c; break; }
        }
        if (city && window.map) {
          const iconOverlay = makeIconLabel(
            window.map,
            { lat: city.lat, lng: city.lon },
            getDisasterIconUrl("tsunami"),
            28,
            610,
            "-50%"
          );
          $S.tsunamiMarkers.push(iconOverlay);
        }
      });
    });
  }

  // 테스트용 경보
  async function fetchWarningsTest() {
    const codes = ["130000","270000","260000"];
    const out = [];
    const BASE = "/mock/warningsBase";

    for (const code of codes) {
      const url = `${BASE}/${code}.json?_=${Date.now()}`; // 캐시버스터
      try {
        const r = await fetch(url, { headers: { "Accept":"application/json" } });
        if (!r.ok) continue;
        const j = await r.json();
        const reported = j.reportDatetime || j.targetDateTime || "";
        (j.areaTypes || []).forEach(t => {
          (t.areas || []).forEach(a => {
            (a.warnings || []).forEach(w => {
              out.push({
                name: w.codeName || w.name || "特報",
                area: a.name || "",
                areaCode: a.code,
                issuedAt: reported
              });
            });
          });
        });
      } catch (e) {
        console.warn("[WARNINGS][TEST] fetch 예외", code, e);
      }
    }
    return out;
  }

  // =============================================
  // 4.5) 렌더: 기상특보(경보) — 이모지 라벨(검은 배경), 빨간핀 없음
  // =============================================
  function renderWarnings(items) {
    (items || []).forEach(a => {
      const emo = getAlertEmoji(a);
      const prefCode = toPrefCode(a.areaCode);
      const pref = (window.cities || []).find(c => String(c.code) === String(prefCode));
      if (!pref || !window.map) return;

      const lbl = makeLabel(
        window.map,
        { lat: pref.lat, lng: pref.lon },
        `${emo}`,
        18,
        "-120%",
        700
      );
      $S.warnMarkers.push(lbl);
    });
  }

  // =============================================
  // 5) 메인 로더
  // =============================================
  async function loadForView() {

    clearLayers();
    try {
      const [quakes, tsunami] = await Promise.all([
        fetchJson(ENDPOINTS.earthquakes),
        fetchJson(ENDPOINTS.tsunami)
      ]);

      const warningsArr = TEST_MODE
        ? await fetchWarningsTest()
        : await fetchAllWarnings();

      // 순서: 경보 라벨 → 지진 아이콘 → 쓰나미 아이콘
      renderWarnings(warningsArr);
      if (quakes)  renderQuakes(quakes);
      if (tsunami) renderTsunami(tsunami);

      const meta = document.getElementById("meta");
      if (meta) {
        const qc = Array.isArray(quakes) ? quakes.length : (quakes?.features?.length || 0);
        const tc = Array.isArray(tsunami) ? tsunami.length : 0;
        const wc = Array.isArray(warningsArr) ? warningsArr.length : 0;
        meta.textContent = `지진 ${qc} · 쓰나미 ${tc} · 특보 ${wc}`;
      }
    } catch (e) {
      console.error(e);
      const meta = document.getElementById("meta");
      if (meta) meta.textContent = "지진/쓰나미/경보 데이터 로드 실패";
    }
  }

  // =============================================
  // 6) export (토글 제어)
  // =============================================
  async function enable(mapInstance) {
    if (mapInstance) window.map = mapInstance;
    await loadForView();
  }
  function disable() {
    clearLayers();
  }
  window.DisasterFeature = { enable, disable };
})();