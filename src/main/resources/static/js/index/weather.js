(function () {
  // ============================
  // 1) 공통 유틸
  // ============================
  const WEATHER_API_KEY = "c8b2e054755849cda2e51309251009";

  async function fetchJson(url, opt = {}) {
    const r = await fetch(url, { cache: "no-store", ...opt });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  // WeatherAPI 아이콘을 그대로 쓰는 헬퍼
  function iconUrlFrom(cond) {
    const u = cond?.icon;
    if (!u) return "";
    return u.startsWith("//") ? "https:" + u : u;
  }
  function iconTagFrom(cond, size = 20) {
    const url = iconUrlFrom(cond);
    const alt = cond?.text || "Weather";
    return url
      ? `<img src="${url}" alt="${alt}" style="width:${size}px;height:${size}px;vertical-align:middle">`
      : "❓";
  }

  // ============================
  // 2) 로그인 사용자 위치 가져오기
  // ============================
  async function getMeLocation() {
    try {
      const j = await fetchJson("/api/me/location");
      const lat = (typeof j.lat === "number") ? j.lat : 35.681236;
      const lon = (typeof j.lon === "number") ? j.lon : 139.767125;
      return { lat, lon, loggedIn: !!j.loggedIn };
    } catch {
      return { lat: 35.681236, lon: 139.767125, loggedIn: false }; // 도쿄 기본값
    }
  }

  // ============================
  // 3) 내부 상태
  // ============================
  let mapRef = null;
  let userPos = null;
  let userPin = null;
  let userLabel = null;
  let aborter = null;
  let busy = false;
  let viewportBusy = false;
  const nearbyLabels = [];

  function removeOverlay(m) {
    if (!m) return;
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

  function inViewport(map, lat, lon) {
    const b = map.getBounds?.();
    if (!b) return true;
    const sw = b.getSouthWest(), ne = b.getNorthEast();
    const inLat = (x) => x >= sw.lat() && x <= ne.lat();
    const inLng = (x) => {
      const L = sw.lng(), R = ne.lng();
      if (L <= R) return x >= L && x <= R;
      return (x >= L && x <= 180) || (x >= -180 && x <= R);
    };
    return inLat(lat) && inLng(lon);
  }

  function makeLabel(map, position, text, fontPx = 16, offsetY = "-170%", zIndex = 500) {
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

  // ============================
  // 4) 날씨 불러와 지도에 표시
  // ============================
  async function load() {
    if (!mapRef || !userPos || busy) return;
    if (!Array.isArray(window.cities) || window.cities.length === 0) {
      console.error("[Weather] cities 데이터가 로드되지 않았습니다. cities.js를 먼저 포함하세요.");
      return;
    }
    busy = true;

    try {
      const meUrl =
        `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${userPos.lat},${userPos.lon}&lang=ja`;
      aborter = new AbortController();
      const meData = await fetchJson(meUrl, { signal: aborter.signal });
      const meWx = meData.current;
      const meTemp = Math.round(meWx.temp_c);

      clear();

      userLabel = makeLabel(
        mapRef,
        { lat: userPos.lat, lng: userPos.lon },
        `${iconTagFrom(meWx.condition, 28)} ${meTemp}°C`,
        22,
        "-170%",
        1000
      );

      const valid = window.cities
        .map(c => {
          const lat = Number(c.lat), lon = Number(c.lon);
          return Number.isFinite(lat) && Number.isFinite(lon) ? { ...c, lat, lon } : null;
        })
        .filter(Boolean);

      const nearestUser = valid
        .map(c => ({ ...c, _d: distKm(userPos.lat, userPos.lon, c.lat, c.lon) }))
        .sort((a, b) => a._d - b._d)
        .slice(0, 15);

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

      const merged = [];
      const seen = new Set();
      const key = (c) => `${c.lat.toFixed(6)},${c.lon.toFixed(6)}`;
      for (const c of [...nearestUser, ...nearestView]) {
        const k = key(c);
        if (!seen.has(k)) { seen.add(k); merged.push(c); }
      }

      for (const city of merged) {
        try {
          const url =
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city.lat},${city.lon}&lang=ja`;
          const data = await fetchJson(url);
          const wx = data.current;
          const temp = Math.round(wx.temp_c);

          const lbl = makeLabel(
            mapRef,
            { lat: city.lat, lng: city.lon },
            `${iconTagFrom(wx.condition)} ${temp}°C`,
            28,
            "-120%",
            600
          );
          nearbyLabels.push(lbl);
        } catch (e) {
          console.warn("[Weather] city weather error:", city.pref, city.city, e?.message || e);
        }
      }

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

  function clearViewportLabels() {
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
      const valid = window.cities
        .map(c => {
          const lat = Number(c.lat), lon = Number(c.lon);
          return Number.isFinite(lat) && Number.isFinite(lon) ? { ...c, lat, lon } : null;
        })
        .filter(Boolean)
        .filter(c => inViewport(mapRef, c.lat, c.lon));

      const pick = valid
        .map(c => ({ ...c, _d: distKm(cx, cy, c.lat, c.lon) }))
        .sort((a, b) => a._d - b._d)
        .slice(0, 15);

      clearViewportLabels();

      for (const city of pick) {
        try {
          const url =
            `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${city.lat},${city.lon}&lang=ja`;
          const data = await fetchJson(url);
          const wx = data.current;
          const temp = Math.round(wx.temp_c);

          const lbl = makeLabel(
            mapRef,
            { lat: city.lat, lng: city.lon },
            `${iconTagFrom(wx.condition)} ${temp}°C`,
            16,
            "-120%",
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
  // 6) 외부 API
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

  // ============================
  // 7) Google Maps 콜백
  // ============================
  window.initMap = async function () {
    const map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 35.681236, lng: 139.767125 },
      zoom: 12
    });
    window._map = map;
    window.map  = map;
  };
})();