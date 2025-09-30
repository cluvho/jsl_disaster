/* ---------- 안내박스 겹침 방지 ---------- */
function updateLegendLayout() {
  const shelter  = document.getElementById("shelter-info");
  const hospital = document.getElementById("hospital-info");
  const BASE = 10; // 바닥 여백
  const GAP  = 8;  // 두 박스 간격

  if (shelter && hospital) {
    const h = hospital.getBoundingClientRect().height || 0;
    hospital.style.bottom = BASE + "px";
    shelter.style.bottom  = (BASE + h + GAP) + "px";
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

/* ---------- 토글 이벤트 바인딩 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const weatherToggle  = document.getElementById('weatherToggle');
  const disasterToggle = document.getElementById('disasterToggle');
  const shelterToggle  = document.getElementById('shelterToggle');
  const hospitalToggle = document.getElementById('hospitalToggle');

  // 날씨 토글
  if (weatherToggle) {
    weatherToggle.addEventListener('change', () => {
      if (weatherToggle.checked) {
        WeatherFeature.enable(window._map);
      } else {
        WeatherFeature.disable();
      }
    });
  }

  // 재난 토글
  if (disasterToggle) {
    disasterToggle.addEventListener('change', () => {
      if (disasterToggle.checked) {
        DisasterFeature.enable(window._map);
      } else {
        DisasterFeature.disable();
      }
    });
  }

  // 대피소 토글
  if (shelterToggle) {
    shelterToggle.addEventListener('change', async () => {
      if (shelterToggle.checked) {
        ShelterFeature.enable(window._map);
        await waitLegendsOnce();   // 안내박스 DOM 대기
        updateLegendLayout();      // 겹침 방지
        window._map.setZoom(15);
      } else {
        ShelterFeature.disable();
        updateLegendLayout();      // 레이아웃 정리
        window._map.setZoom(12);
      }
    });
  }

  // 병원 토글
  if (hospitalToggle) {
    hospitalToggle.addEventListener('change', async () => {
      if (hospitalToggle.checked) {
        HospitalOSMFeature.enable(window._map);
        await waitLegendsOnce();   // 안내박스 DOM 대기
        updateLegendLayout();      // 겹침 방지
        window._map.setZoom(15);
      } else {
        HospitalOSMFeature.disable();
        updateLegendLayout();
        window._map.setZoom(12);
      }
    });
  }
});