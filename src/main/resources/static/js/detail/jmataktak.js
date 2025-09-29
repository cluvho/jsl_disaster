document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('regionSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchRegion();
        });
    }

    const firstNavItem = document.querySelector('.nav-menu .nav-item');
    if (firstNavItem) firstNavItem.classList.add('active');

    // 초기 로딩: 대전 좌표
    updateWeatherAPI(35.6895, 139.6917, '도쿄');
});

// 검색 함수 (지역명 기반 좌표 검색 후 날씨 갱신)
function searchRegion() {
    const input = document.getElementById('regionSearchInput').value.trim();
    if (!input) return;
    // 간단 예: Google Geocoding API 등으로 좌표 변환 가능
    // 여기선 예시로 서울 좌표
    const coords = {lat: 37.5665, lon: 126.9780};
    updateWeatherAPI(coords.lat, coords.lon, input);
}

// 탭 기능
function showForecast(type, tab) {
    document.querySelectorAll('.forecast-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.forecast-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(type).classList.add('active');
}
function showFacility(type, tab) {
    document.querySelectorAll('.facility-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.facility-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(type).classList.add('active');
}

// 로딩 상태
function showLoadingState() {
    document.getElementById("currentTemp").textContent = "로딩중...";
    document.getElementById("currentWeather").textContent = "데이터 가져오는 중";
    document.querySelector(".weather-detail-item:nth-child(1) .value").textContent = "...";
    document.querySelector(".weather-detail-item:nth-child(2) .value").textContent = "...";
    document.querySelector(".weather-detail-item:nth-child(3) .value").textContent = "...";
    document.getElementById("hourly").querySelector(".hourly-forecast").innerHTML = "";
    document.getElementById("daily").querySelector(".daily-forecast").innerHTML = "";
    document.getElementById("warning").querySelector(".disaster-item.warning").style.display = 'none';
}
const warningCodeMap = {
	    "11": "호우주의보",
	    "12": "호우경보",
	    "21": "홍수주의보",
	    "22": "홍수경보",
	    "31": "강풍주의보",
	    "32": "강풍경보",
	    "41": "풍랑주의보",
	    "42": "풍랑경보",
	    "51": "뇌우주의보",
	    "52": "뇌우경보",
	    "61": "폭풍우주의보",
	    "62": "폭풍우경보"
	};
// WeatherAPI 호출
async function updateWeatherAPI(lat, lon, regionName,cityCode) {
    showLoadingState();
    const WEATHER_API_KEY = "c8b2e054755849cda2e51309251009";

    try {
        // 오늘/현재 날씨
        const currentRes = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&hours=24&lang=ja`);
        const currentData = await currentRes.json();
		const regionName = `${currentData.location.name}, ${currentData.location.country}`; 
        const tempC = currentData.current.temp_c;
        const condition = currentData.current.condition.text;
        const icon = `<img src="https:${currentData.current.condition.icon}" alt="${condition}" />`;
        const wind = `${currentData.current.wind_kph} km/h ${currentData.current.wind_dir}`;
        const uv = currentData.current.uv;
		const humidity = currentData.current.humidity;
		
		 // JMA API 호출
        const res = await fetch(`https://www.jma.go.jp/bosai/warning/data/warning/130000.json`);
        const jmadata = await res.json();

        const warningContainer = document.getElementById("warning");
        if (warningContainer) {
            warningContainer.innerHTML = ""; // 기존 내용 초기화
            
            // 데이터가 객체인지 확인하고, headlineText가 있는지 확인
            if (jmadata && jmadata.headlineText) {
                const reportTime = new Date(jmadata.reportDatetime);
                const formattedTime = `${reportTime.getFullYear()}.${(reportTime.getMonth() + 1).toString().padStart(2, '0')}.${reportTime.getDate().toString().padStart(2, '0')} ${reportTime.getHours().toString().padStart(2, '0')}:${reportTime.getMinutes().toString().padStart(2, '0')}`;
                
                // 특보 코드를 텍스트로 변환하는 로직 (API 응답에 따라 수정 필요)
                // 현재 JMA 데이터에 특보 코드가 없으므로 headlineText로 대체
                const disasterType = "기상 특보";

                const disasterItem = document.createElement("div");
                disasterItem.className = "disaster-item warning";
                disasterItem.innerHTML = `
                    <div class="disaster-header">
                        <div class="disaster-type">⚠️ <span>${disasterType}</span></div>
                        <div class="disaster-time">${formattedTime}</div>
                    </div>
                    <p>${jmadata.headlineText}</p>
                `;
                warningContainer.appendChild(disasterItem);
            } else {
                warningContainer.innerHTML = "<p>현재 발령된 기상특보가 없습니다.</p>";
            }
        }
        document.getElementById("regionName").textContent = regionName;
        document.getElementById("currentWeather").textContent = condition;
        document.getElementById("currentTemp").textContent = `${tempC}°C`;
        document.querySelector(".weather-detail-item:nth-child(1) .value").textContent = wind;
        document.querySelector(".weather-detail-item:nth-child(2) .value").textContent = humidity;
        document.querySelector(".weather-detail-item:nth-child(3) .value").textContent = uv;
        
        document.querySelector(".weather-card .icon").innerHTML = icon;
		
        // 1시간 단위 예보 (오늘 예보)
        const forecastRes = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=7&lang=ja`);
        const forecastData = await forecastRes.json();
        console.log('API 응답 전체 데이터:', forecastData);
        console.log('주간 예보 배열:', forecastData.forecast.forecastday);
        const hourlyDiv = document.getElementById("hourly").querySelector(".hourly-forecast");
        hourlyDiv.innerHTML = "";
     // 현재 시간 기준으로 3시간 단위만 표시
        const nowHour = new Date().getHours();
        forecastData.forecast.forecastday[0].hour.forEach((h, i) => {
            const hour = new Date(h.time).getHours();
            if ((hour - nowHour) % 3 === 0) { // 3시간 간격
                const hourIcon = `<img src="https:${h.condition.icon}" alt="${h.condition.text}" />`;
                hourlyDiv.innerHTML += `
                    <div class="forecast-item">
                        <div class="time">${h.time.slice(11,16)}</div>
                        <div class="icon">${hourIcon}</div>
                        <div class="temp">${h.temp_c}°C</div>
                    </div>`;
            }
        });

     
        // 주간 예보 7일
    const dailyDiv = document.getElementById("daily").querySelector(".daily-forecast");
    dailyDiv.innerHTML = "";
    forecastData.forecast.forecastday.forEach(d => {
        const date = new Date(d.date);
        const dayName = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`;
        dailyDiv.innerHTML += `
            <div class="forecast-item">
                <div class="time">${dayName}</div>
                <div class="icon"><img src="https:${d.day.condition.icon}" alt="${d.day.condition.text}"></div>
                <div class="temp">${d.day.maxtemp_c}°C / ${d.day.mintemp_c}°C</div>
            </div>`;
    });
    
    } catch(err) {
        console.error("날씨 API 오류:", err);
    }
	
}


document.addEventListener("DOMContentLoaded", () => {
  const areaCode = "270000"; // 오사카부

  const disasterList = document.querySelector("#disaster-list");
  const alertDiv = document.querySelector("#alert-desc");
  if (!disasterList || !alertDiv) return;

  // -------------------------------
  // 1. 경보·주의보
  // -------------------------------
  fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${areaCode}.json`)
    .then(res => res.json())
    .then(data => {
      const area = data.areaTypes[0].areas[0];
      if (area.warnings && area.warnings.length > 0) {
        const alerts = area.warnings
          .map(w => `${w.codeName} (${w.status})`)
          .join(", ");
        alertDiv.textContent = alerts;
      } else {
        alertDiv.textContent = "현재 발령된 경보·주의보 없음";
      }
    })
    .catch(err => console.error("경보 불러오기 오류:", err));


  // -------------------------------
  // 2. 지진 (최근 기록만 표시)
  // -------------------------------
  fetch("https://www.jma.go.jp/bosai/quake/data/list.json")
    .then(res => res.json())
    .then(list => {
      if (!list || list.length === 0) {
        disasterList.innerHTML += `
          <div class="disaster-item">
            <div class="disaster-header">
              <div class="disaster-type">🌏 지진</div>
              <div class="disaster-time">-</div>
            </div>
            <p>최근 지진 기록이 없습니다.</p>
          </div>`;
        return;
      }

      const latest = list[0]; // 최근 지진
      const time = latest.time ?? "정보 없음";
      const magnitude = latest.magunitude ?? "정보 없음";
      const hypocenter = latest.hypocenter?.name ?? "정보 없음";
      const maxScale = latest.maxScale ?? "정보 없음";

      const item = document.createElement("div");
      item.className = "disaster-item";
      item.innerHTML = `
        <div class="disaster-header">
          <div class="disaster-type">🌏 지진</div>
          <div class="disaster-time">${new Date(time).toLocaleString()}</div>
        </div>
        <p><strong>진앙지:</strong> ${hypocenter}</p>
        <p><strong>규모:</strong> M${magnitude}</p>
        <p><strong>최대진도:</strong> ${maxScale}</p>
      `;
      disasterList.appendChild(item);
    })
    .catch(err => console.error("지진 불러오기 오류:", err));


  // -------------------------------
  // 3. 쓰나미 (최근 기록만 표시)
  // -------------------------------
  fetch("https://www.jma.go.jp/bosai/tsunami/data/list.json")
    .then(res => res.json())
    .then(list => {
      if (!list || list.length === 0) return;

      const latest = list[0]; // 최근 쓰나미
      const ts = latest; // list.json만 사용
      const time = ts.time ?? "정보 없음";

      // forecasts 배열이 없을 수도 있으니 방어
      if (ts.forecasts && ts.forecasts.length > 0) {
        ts.forecasts.forEach(f => {
          const areaName = f.area?.name ?? "정보 없음";
          const arrival = f.firstHeight?.arrivalTime ?? "정보 없음";
          const height = f.firstHeight?.height ?? "정보 없음";
          const condition = f.condition ?? "정보 없음";

          const item = document.createElement("div");
          item.className = "disaster-item";
          item.innerHTML = `
            <div class="disaster-header">
              <div class="disaster-type">🌊 쓰나미</div>
              <div class="disaster-time">${new Date(time).toLocaleString()}</div>
            </div>
            <p><strong>영향 지역:</strong> ${areaName}</p>
            <p><strong>예상 도달:</strong> ${arrival}</p>
            <p><strong>예상 높이:</strong> ${height}</p>
            <p><strong>상태:</strong> ${condition}</p>
          `;
          disasterList.appendChild(item);
        });
      }
    })
    .catch(err => console.error("쓰나미 불러오기 오류:", err));

});

// 대피소, 병원
// 거리 계산
function calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI / 180) *
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
}

// 카드 생성
function createFacilityCard(containerId, name, address, distance, extraInfo = {}) {
    const container = document.getElementById(containerId).querySelector(".facility-list");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "facility-item";
	// 기본값 처리
	    const emergency = extraInfo.emergency || "정보 없음";
	    const contact = extraInfo.contact || "정보 없음";

    div.innerHTML = `
        <div class="facility-header">
            <div>
                <div class="facility-name">${name}</div>
              	
            </div>
        </div>
        <div class="facility-info">
            <div><strong>주소:</strong> ${address}</div>
           	
            ${extraInfo.emergency ? `<div><strong>응급실:</strong> ${emergency}</div>` : ""}
            ${extraInfo.contact ? `<div><strong>연락처:</strong> ${contact}</div>` : "<strong>연락처:정보없음</strong>"}
            <div><strong>거리:</strong> 현재 위치에서 ${distance} km</div>
        </div>
    `;
    container.appendChild(div);
}

// 시설 검색 + Place Details
function searchFacility(lat, lng, type, containerId) {
    return new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(document.createElement("div"));
        const request = {
            location: { lat, lng },
            radius: 5000,
            type
        };

        service.nearbySearch(request, (results, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
                reject(status);
                return;
            }

            // 가장 가까운 3개만 처리
            results.slice(0,3).forEach(place => {
                const distance = calcDistance(lat, lng, place.geometry.location.lat(), place.geometry.location.lng());

                // Place Details 호출
                service.getDetails({ placeId: place.place_id, fields: ['name','formatted_address','formatted_phone_number','opening_hours','rating'] },
                    (details, detailsStatus) => {
                        if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && details) {
                            const extraInfo = {
                                contact: details.formatted_phone_number || "",
                                
                            };
                            if(type === 'school') extraInfo.capacity = "500명"; // 테스트용
                            if(type === 'hospital') extraInfo.emergency = "운영중"; // 테스트용
                            createFacilityCard(containerId, details.name, details.formatted_address, distance, extraInfo);
                        } else {
                            // Details 못 가져오면 기본 정보로
                            createFacilityCard(containerId, place.name, place.vicinity, distance);
                        }
                    }
                );
            });

            resolve(results);
        });
    });
}

// DOMContentLoaded 후 실행
document.addEventListener("DOMContentLoaded", async () => {
    const userLat = 35.6895; // 도쿄 테스트용
    const userLng = 139.6917;

    try {
        await searchFacility(userLat, userLng, "school", "shelter");
        await searchFacility(userLat, userLng, "hospital", "hospital");
    } catch(err) {
        console.error("시설 검색 실패:", err);
    }
});


async function fetchRegionalNews(region) {
    // ⭐️ 다른 공개 프록시 서버 주소로 변경
    const proxyUrl = 'https://corsproxy.io/?'; 
    
    const targetUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(region)}+災害&hl=ja&gl=JP&ceid=JP:ja`;
    
    // 프록시를 통해 요청할 최종 URL
    const url = proxyUrl + encodeURIComponent(targetUrl);

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "application/xml");
        const items = xml.querySelectorAll("item");
        const newsContainer = document.querySelector(".news-list");
        newsContainer.innerHTML = "";

        if (items.length === 0) {
            newsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #888;">"${region}" 지역의 뉴스가 없습니다.</div>`;
            return;
        }

        items.forEach((item, idx) => {
            if (idx < 5) {
                const title = item.querySelector("title").textContent;
                const link = item.querySelector("link").textContent;
                const pubDate = new Date(item.querySelector("pubDate").textContent).toLocaleString("ja-JP");

                const div = document.createElement("div");
                div.className = "news-item";
                div.innerHTML = `
                    <a href="${link}" target="_blank">
                        <div class="news-title">${title}</div>
                        <div class="news-summary">クリックすると記事の詳細を表示します</div>
                        <div class="news-meta">
                            <span>${region}</span>
                            <span>${pubDate}</span>
                        </div>
                    </a>
                `;
                newsContainer.appendChild(div);
            }
        });
    } catch (error) {
        console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
        const newsContainer = document.querySelector(".news-list");
        newsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #888;">뉴스를 가져오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.</div>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const userRegion = "東京";/*[[${userAddress}]]*/
    fetchRegionalNews(userRegion);
});