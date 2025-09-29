let map;

// 구글맵 초기화
function initMap() {
  const mapElement = document.getElementById("map");
  const userLat = mapElement.dataset.lat ? parseFloat(mapElement.dataset.lat) : null;
  const userLon = mapElement.dataset.lon ? parseFloat(mapElement.dataset.lon) : null;

  const defaultCenter = { lat: 35.68, lng: 139.76 };
  const center = (userLat && userLon) ? { lat: userLat, lng: userLon } : defaultCenter;

  map = new google.maps.Map(mapElement, {
    center: center,
    zoom: 12
  });
  window._map = map; // 공용
}

/* ---------- 안내박스 겹침 방지 ---------- */
function updateLegendLayout() {
  const shelter  = document.getElementById("shelter-info");
  const hospital = document.getElementById("hospital-info");
  const BASE = 10; // 바닥 여백(px)
  const GAP  = 8;  // 두 박스 사이 간격(px)

  if (shelter && hospital) {
    const h = hospital.getBoundingClientRect().height || 0;
    hospital.style.bottom = BASE + "px";
    shelter.style.bottom  = (BASE + h + GAP) + "px"; // 대피소 위로 올리기
  } else {
    if (hospital) hospital.style.bottom = BASE + "px";
    if (shelter)  shelter.style.bottom  = BASE + "px";
  }
}

/* 안내박스가 DOM에 생길 때까지 잠깐 대기 */
function waitLegendsOnce(timeoutMs = 500) {
  const started = Date.now();
  return new Promise(resolve => {
    (function tick() {
      const s = document.getElementById("shelter-info");
      const h = document.getElementById("hospital-info");
      if ((s && s.offsetHeight) || (h && h.offsetHeight) || Date.now() - started > timeoutMs) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    })();
  });
}

/* ---------- 토글 바인딩 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const weatherToggle  = document.getElementById('weatherToggle');
  const disasterToggle = document.getElementById('disasterToggle');
  const shelterToggle  = document.getElementById('shelterToggle');
  const hospitalToggle = document.getElementById('hospitalToggle');

  // 날씨
  if (weatherToggle) {
    weatherToggle.addEventListener('change', () => {
      weatherToggle.checked ? WeatherFeature.enable(window._map)
                            : WeatherFeature.disable();
    });
  }

  // 재난
  if (disasterToggle) {
    disasterToggle.addEventListener('change', () => {
      disasterToggle.checked ? DisasterFeature.enable(window._map)
                             : DisasterFeature.disable();
    });
  }

  // 대피소
  if (shelterToggle) {
    shelterToggle.addEventListener('change', async () => {
      if (shelterToggle.checked) {
        await ShelterFeature.enable(window._map);
        window._map.setZoom(15);
      } else {
        ShelterFeature.disable();
        window._map.setZoom(12);
      }
      await waitLegendsOnce();
      updateLegendLayout();
    });
  }

  // 병원
  if (hospitalToggle) {
    hospitalToggle.addEventListener('change', async () => {
      if (hospitalToggle.checked) {
        await HospitalOSMFeature.enable(window._map); // enable이 async라면 대기
        window._map.setZoom(15);
      } else {
        HospitalOSMFeature.disable();
        window._map.setZoom(12);
      }
      await waitLegendsOnce();
      updateLegendLayout();
    });
  }
});