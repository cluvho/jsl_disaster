(function () {
  // ============================
  // 1) 공통 유틸 & 이모지 매핑
  // ============================
  const WEATHER_API_KEY = "c8b2e054755849cda2e51309251009";
  const WEATHER_EMOJI_BY_CODE = {
    1000:"☀️",1003:"⛅",1006:"☁️",1009:"☁️",
    1183:"🌦️",1186:"🌧️",1189:"🌧️",
    1087:"⛈️",1273:"⛈️",1276:"⛈️",
    1066:"🌨️",1114:"🌨️",1117:"❄️"
  };
  const emoji = c => WEATHER_EMOJI_BY_CODE[c] || "❓";

  async function fetchJson(url, opt = {}) {
    const r = await fetch(url, { cache: "no-store", ...opt });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  // ============================
  // 2) 로그인 사용자 위치 가져오기
  // ============================
  async function getMeLocation() {
      try {
          const j = await fetchJson("/api/me/location");
          console.log("Weather - API 응답:", j);
          const lat = (typeof j.lat === "number") ? j.lat : 35.681236;
          const lon = (typeof j.lon === "number") ? j.lon : 139.767125;
          console.log("Weather - 최종 좌표:", lat, lon);
          return { lat, lon, loggedIn: !!j.loggedIn };
      } catch (error) {
          console.error("Weather - 위치 조회 오류:", error);
          return { lat: 35.681236, lon: 139.767125, loggedIn: false };
      }
  }

  // ============================
  // 3) 내부 상태
  // ============================
  let mapRef = null;       // Google Map instance
  let userPos = null;      // {lat, lon}
  let userPin = null;      // 내 위치(빨간핀, google.maps.Marker)
  let userLabel = null;    // 내 위치 라벨(OverlayView)
  let aborter = null;      // fetch 취소용 AbortController
  let busy = false;        // load() 재진입 방지
  let viewportBusy = false;// 화면 갱신 재진입 방지
  const nearbyLabels = []; // 주변(뷰포트/사용자 기준) 라벨(OverlayView)

  function removeOverlay(m) {
    if (!m) return;
    // OverlayView는 setMap(null) 지원
    if (typeof m.setMap === "function") m.setMap(null);
    else if ("map" in m) m.map = null;
  }

  function clear() {
    if (userPin) { userPin.setMap(null); userPin = null; }
    removeOverlay(userLabel); userLabel = null;
    for (const m of nearbyLabels) removeOverlay(m);
    nearbyLabels.length = 0;
    if (aborter) { aborter.abort(); aborter = null; }
    busy = false;
  }

  // 거리계산 (km, 하버사인)
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

  // 현재 뷰포트 안인지 판단
  function inViewport(map, lat, lon) {
    const b = map.getBounds?.();
    if (!b) return true;
    const sw = b.getSouthWest(), ne = b.getNorthEast();
    const inLat = (x) => x >= sw.lat() && x <= ne.lat();
    const inLng = (x) => {
      const L = sw.lng(), R = ne.lng();
      if (L <= R) return x >= L && x <= R;
      // anti-meridian 케이스
      return (x >= L && x <= 180) || (x >= -180 && x <= R);
    };
    return inLat(lat) && inLng(lon);
  }

  // OverlayView 라벨 생성 함수 (전역 유틸)
  function makeLabel(map, position, text, fontPx = 16, offsetY = "-170%", zIndex = 500) {
    class LabelOverlay extends google.maps.OverlayView {
      constructor(pos, txt, opt) {
        super();
        this.pos = pos;
        this.txt = txt;
        this.offsetY = opt.offsetY; // "-170%" 같은 문자열
        this.zIndex  = opt.zIndex;  // 숫자
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

  // ============================
  // 4) 날씨 불러와 지도에 표시 (내 위치 + 사용자 주변 15 + 화면중심 15)
  // ============================
  async function load() {
    if (!mapRef || !userPos || busy) return;
    if (!Array.isArray(window.cities) || window.cities.length === 0) {
      console.error("[Weather] cities 데이터가 로드되지 않았습니다. cities.js를 먼저 포함하세요.");
      return;
    }
    busy = true;

    try {
      // 1) 내 위치 날씨
      const meUrl =
        `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${userPos.lat},${userPos.lon}&lang=ja`;
      aborter = new AbortController();
      const meData = await fetchJson(meUrl, { signal: aborter.signal });
      const meWx = meData.current;
      const meEmo = emoji(meWx.condition.code);
      const meTemp = Math.round(meWx.temp_c);

      // 이전 것 정리
      clear();

      // 1) 내 위치 라벨
      userLabel = makeLabel(
        mapRef,
        { lat: userPos.lat, lng: userPos.lon },
        `${meEmo} ${meTemp}°C`,
        20,
        "-170%",
        1000
      );

      // 2) cities 유효 좌표
      const valid = window.cities
        .map(c => {
          const lat = Number(c.lat), lon = Number(c.lon);
          return Number.isFinite(lat) && Number.isFinite(lon) ? { ...c, lat, lon } : null;
        })
        .filter(Boolean);

      // 3) 사용자 기준 가까운 15개
      const nearestUser = valid
        .map(c => ({ ...c, _d: distKm(userPos.lat, userPos.lon, c.lat, c.lon) }))
        .sort((a, b) => a._d - b._d)
        .slice(0, 15);

      // 4) 화면 중심 기준 가까운 15개(뷰포트 안에서)
      const center = mapRef.getCenter?.();
      let nearestView = [];
      if (center) {
        const cx = center.lat(), cy = center.lng();
        const visible = valid.filter(c => inViewport(mapRef, c.lat, c.lon));
        nearestView = visible
          .map(c => ({ ...c, _d: distKm(cx, cy, c.lat, c.lon) }))
          .sort((a, b) => a._d - b._d)
          .slice(0, 15);
      }

      // 5) 두 집합 합치고 중복 제거
      const merged = [];
      const seen = new Set();
      const key = (c) => `${c.lat.toFixed(6)},${c.lon.toFixed(6)}`;
      for (const c of [...nearestUser, ...nearestView]) {
        const k = key(c);
        if (!seen.has(k)) { seen.add(k); merged.push(c); }
      }

      // 6) 각 지점 날씨 → 라벨만 표시(핀 없음)
      for (const city of merged) {
        try {
          const url =
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city.lat},${city.lon}&lang=ja`;
          const data = await fetchJson(url);
          const wx = data.current;
          const emo = emoji(wx.condition.code);
          const temp = Math.round(wx.temp_c);

          const lbl = makeLabel(
            mapRef,
            { lat: city.lat, lng: city.lon },
            `${emo} ${temp}°C`,
            16,
            "-120%",
            600 // 사용자 라벨(1000)보다 낮게
          );
          nearbyLabels.push(lbl);
        } catch (e) {
          console.warn("[Weather] city weather error:", city.pref, city.city, e?.message || e);
        }
      }

      // 7) 맵 이동/확대 시, 화면중심 15개만 갱신(디바운스)
      if (!mapRef.__wxIdleHooked) {
        mapRef.__wxIdleHooked = true;
        let idleTimer = null;
        mapRef.addListener("idle", () => {
          if (busy || viewportBusy) return;
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => { refreshViewportOnly(); }, 300);
        });
      }

    } catch (e) {
      console.error("[Weather] load error:", e);
      clear();
    } finally {
      busy = false;
    }
  }

  // ============================
  // 5) 화면 중심 15개만 갱신
  // ============================
  function clearViewportLabels() {
    // 사용자 라벨(userLabel)은 유지, 주변 라벨만 제거
    for (const m of nearbyLabels) removeOverlay(m);
    nearbyLabels.length = 0;
  }

  async function refreshViewportOnly() {
    if (!mapRef || !Array.isArray(window.cities) || viewportBusy) return;
    const center = mapRef.getCenter?.();
    if (!center) return;

    viewportBusy = true;
    try {
      const cx = center.lat(), cy = center.lng();

      // 유효 좌표 + 현재 화면 안
      const valid = window.cities
        .map(c => {
          const lat = Number(c.lat), lon = Number(c.lon);
          return Number.isFinite(lat) && Number.isFinite(lon) ? { ...c, lat, lon } : null;
        })
        .filter(Boolean)
        .filter(c => inViewport(mapRef, c.lat, c.lon));

      // 중심에서 가까운 15개
      const pick = valid
        .map(c => ({ ...c, _d: distKm(cx, cy, c.lat, c.lon) }))
        .sort((a, b) => a._d - b._d)
        .slice(0, 15);

      // 기존 화면 라벨 제거 후 다시 그림
      clearViewportLabels();

      for (const city of pick) {
        try {
          const url =
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city.lat},${city.lon}&lang=ja`;
          const data = await fetchJson(url);
          const code = data.current?.condition?.code;
          const temp = Math.round(data.current?.temp_c ?? 0);
          const emo  = (typeof code === "number") ? (WEATHER_EMOJI_BY_CODE[code] || "❓") : "❓";

          const lbl = makeLabel(
            mapRef,
            { lat: city.lat, lng: city.lon },
            `${emo} ${temp}°C`,
            16,      // 글자 크기
            "-120%", // 핀보다 약간 위
            600
          );
          nearbyLabels.push(lbl);
        } catch (e) {
          console.warn("[Weather] viewport city error:", city.pref, city.city, e?.message || e);
        }
      }
    } catch (err) {
      console.error("[Weather] refreshViewportOnly error:", err);
    } finally {
      viewportBusy = false;
    }
  }

  // ============================
  // 6) 외부 API (enable/disable/refresh)
  // ============================
  window.WeatherFeature = {
    async enable(map, opts = {}) {
      mapRef = map;
      if (typeof opts.lat === "number" && typeof opts.lon === "number") {
        userPos = { lat: opts.lat, lon: opts.lon };
      } else {
        const me = await getMeLocation();
        userPos = { lat: me.lat, lon: me.lon };
      }
      await load();
    },

    disable() {
      clear();
      mapRef = null;
      userPos = null;
    },

    async refresh() {
      if (!mapRef) return;
      const me = await getMeLocation();
      userPos = { lat: me.lat, lon: me.lon };
      await load();
    }
  };
})();