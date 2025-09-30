// ===================================================================
// 완전 통합 재난 정보 시스템 JS 파일
// 모든 기능을 하나의 파일에 통합
// ===================================================================

// =========================
// 전역 변수 및 설정
// =========================
const WEATHER_API_KEY = "c8b2e054755849cda2e51309251009";
const warningCodeMap = {
    "11": "호우주의보", "12": "호우경보", "21": "홍수주의보", "22": "홍수경보",
    "31": "강풍주의보", "32": "강풍경보", "41": "풍랑주의보", "42": "풍랑경보",
    "51": "뇌우주의보", "52": "뇌우경보", "61": "폭풍우주의보", "62": "폭풍우경보"
};

// =========================
// JMA 재해 정보 크롤러 클래스
// =========================
class JMADisasterCrawler {
    constructor() {
        this.proxyUrl = 'https://api.allorigins.win/get?url=';
        this.baseUrl = 'https://www.jma.go.jp';
    }

    async fetchWithProxy(url) {
        try {
            const response = await fetch(this.proxyUrl + encodeURIComponent(url));
            const data = await response.json();
            return data.contents;
        } catch (error) {
            console.error('프록시 요청 실패:', error);
            throw error;
        }
    }

    async getEarthquakeData() {
        console.log('실제 지진 정보 수집 중...');
        
        try {
            const sources = [
                'https://api.p2pquake.net/v2/history?codes=551&limit=5'
            ];
            
            for (let sourceUrl of sources) {
                try {
                    if (sourceUrl.includes('p2pquake')) {
                        const response = await fetch(sourceUrl);
                        const data = await response.json();
                        
                        const earthquakes = data.slice(0, 5).map((item, index) => ({
                            magnitude: item.earthquake?.maxScale_int || item.earthquake?.hypocenter?.magnitude || 'N/A',
                            location: item.earthquake?.hypocenter?.name || '위치 정보 없음',
                            time: new Date(item.time).toLocaleString('ko-KR'),
                            depth: item.earthquake?.hypocenter?.depth ? `${item.earthquake.hypocenter.depth}km` : 'N/A',
                            type: 'earthquake',
                            source: 'P2P지진정보'
                        }));
                        
                        console.log(`실제 지진 데이터 ${earthquakes.length}개 수집 완료`);
                        return earthquakes;
                    }
                } catch (error) {
                    console.log(`${sourceUrl} 실패:`, error.message);
                    continue;
                }
            }
            
            throw new Error('모든 소스에서 데이터 가져오기 실패');
            
        } catch (error) {
            console.error('실제 지진 데이터 수집 실패, 테스트 데이터 사용:', error);
            
            return [
                {
                    magnitude: '4.8',
                    location: '도쿄만 (테스트)',
                    time: new Date().toLocaleString('ko-KR'),
                    depth: '25km',
                    type: 'earthquake',
                    source: 'TEST'
                },
                {
                    magnitude: '3.2', 
                    location: '오사카 북부 (테스트)',
                    time: new Date(Date.now() - 3600000).toLocaleString('ko-KR'),
                    depth: '15km',
                    type: 'earthquake',
                    source: 'TEST'
                }
            ];
        }
    }

    async getVolcanoData() {
        console.log('화산 정보 수집 중...');
        
        const testData = [
            {
                name: '후지산',
                alertLevel: '1',
                status: '정상',
                time: new Date().toLocaleString(),
                type: 'volcano'
            }
        ];
        
        console.log(`화산 데이터 ${testData.length}개 수집 완료`);
        return testData;
    }

    async collectAllData() {
        console.log('=== JMA 재해 정보 크롤링 시작 ===');
        
        try {
            const [earthquakes, volcanoes] = await Promise.all([
                this.getEarthquakeData(),
                this.getVolcanoData()
            ]);

            const allData = {
                earthquakes: earthquakes,
                volcanoes: volcanoes,
                tsunamis: [],
                typhoons: [],
                lastUpdated: new Date().toISOString(),
                totalCount: earthquakes.length + volcanoes.length
            };

            console.log('=== 데이터 수집 완료 ===');
            console.log(`총 ${allData.totalCount}개 데이터 수집`);

            return allData;

        } catch (error) {
            console.error('데이터 수집 중 오류:', error);
            throw error;
        }
    }
}

// =========================
// 자동 크롤러 클래스
// =========================
class AutoCrawler {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
    }
    
    start(intervalMinutes = 10) {
        if (this.isRunning) {
            console.log('이미 자동 크롤링이 실행 중입니다.');
            return;
        }
        
        console.log(`자동 크롤링 시작 - ${intervalMinutes}분마다 실행`);
        this.runOnce();
        
        this.intervalId = setInterval(() => {
            this.runOnce();
        }, intervalMinutes * 60 * 1000);
        
        this.isRunning = true;
    }
    
    async runOnce() {
        try {
            console.log(`[${new Date().toLocaleString()}] 자동 크롤링 실행`);
            await sendToSpringBoot();
        } catch (error) {
            console.error('자동 크롤링 오류:', error);
        }
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('자동 크롤링 중지됨');
        }
    }
    
    getStatus() {
        return {
            running: this.isRunning,
            intervalId: this.intervalId
        };
    }
}

// =========================
// 크롤러 인스턴스 생성
// =========================
const jmaCrawler = new JMADisasterCrawler();
const autoCrawler = new AutoCrawler();

// =========================
// 기본 함수들
// =========================
function showForecast(type, tab) {
    document.querySelectorAll('.forecast-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.forecast-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const targetElement = document.getElementById(type);
    if (targetElement) {
        targetElement.classList.add('active');
    }
}

function showFacility(type, tab) {
    document.querySelectorAll('.facility-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.facility-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const targetElement = document.getElementById(type);
    if (targetElement) {
        targetElement.classList.add('active');
    }
}

function scrollToSection(sectionId, navItem) {
    if (event) event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        navItem.classList.add('active');
        history.pushState(null, null, `#${sectionId}`);
    }
}

async function searchRegion() {
    const input = document.getElementById('regionSearchInput');
    const regionName = input.value.trim();

    if (!regionName) {
        alert('검색할 지역명을 입력해주세요.');
        return;
    }

    // 1. Google Maps Geocoder API를 사용하여 주소를 좌표로 변환합니다.
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': regionName }, async (results, status) => {
        
        if (status === 'OK' && results[0]) {
            // 2. 변환에 성공하면 첫 번째 결과에서 위도와 경도를 추출합니다.
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lon = location.lng();
            const formattedAddress = results[0].formatted_address; // 더 정확한 주소 이름

            console.log(`'${regionName}' 검색 성공:`, { lat, lon, formattedAddress });

            // 3. 추출한 좌표와 주소로 관련 정보들을 모두 업데이트합니다.
            // 날씨 정보 업데이트
            updateWeatherAPI(lat, lon, formattedAddress);
            
            // 관련 뉴스 업데이트
            fetchRegionalNews(regionName); // '大阪' 같은 검색어로 뉴스 다시 가져오기
            
            // 주변 시설 정보 업데이트 (기존 컨테이너 비우기)
            document.getElementById('shelter').querySelector('.facility-list').innerHTML = '';
            document.getElementById('hospital').querySelector('.facility-list').innerHTML = '';
            await searchFacility(lat, lon, "school", "shelter");
            await searchFacility(lat, lon, "hospital", "hospital");

        } else {
            // 4. 주소를 좌표로 변환하는 데 실패하면 사용자에게 알립니다.
            console.error(`'${regionName}' 지역을 찾을 수 없습니다. Geocode 실패 상태:`, status);
            alert(`'${regionName}'에 대한 위치 정보를 찾을 수 없습니다. 다른 검색어를 시도해보세요.`);
        }
    });
}

// =========================
// 날씨 관련 함수들
// =========================
function showLoadingState() {
    document.getElementById("currentTemp").textContent = "로딩중...";
    document.getElementById("currentWeather").textContent = "데이터 가져오는 중";
    document.querySelector(".weather-detail-item:nth-child(1) .value").textContent = "...";
    document.querySelector(".weather-detail-item:nth-child(2) .value").textContent = "...";
    document.querySelector(".weather-detail-item:nth-child(3) .value").textContent = "...";
    document.getElementById("hourly").querySelector(".hourly-forecast").innerHTML = "";
    document.getElementById("daily").querySelector(".daily-forecast").innerHTML = "";
    
    const warningSection = document.getElementById("warning");
    if (warningSection) {
        const warningItem = warningSection.querySelector(".disaster-item.warning");
        if (warningItem) {
            warningItem.style.display = 'none';
        }
    }
}

async function updateWeatherAPI(lat, lon, regionName, cityCode) {
    showLoadingState();

    try {
        const currentRes = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&hours=24&lang=ja`);
        const currentData = await currentRes.json();
        const displayRegionName = `${currentData.location.name}, ${currentData.location.country}`;
        const tempC = currentData.current.temp_c;
        const condition = currentData.current.condition.text;
        const icon = `<img src="https:${currentData.current.condition.icon}" alt="${condition}" />`;
        const wind = `${currentData.current.wind_kph} km/h ${currentData.current.wind_dir}`;
        const uv = currentData.current.uv;
        const humidity = currentData.current.humidity;

        const res = await fetch(`https://www.jma.go.jp/bosai/warning/data/warning/130000.json`);
        const jmadata = await res.json();

        const warningContainer = document.getElementById("warning");
        if (warningContainer) {
            warningContainer.innerHTML = "";
            
            if (jmadata && jmadata.headlineText) {
                const reportTime = new Date(jmadata.reportDatetime);
                const formattedTime = `${reportTime.getFullYear()}.${(reportTime.getMonth() + 1).toString().padStart(2, '0')}.${reportTime.getDate().toString().padStart(2, '0')} ${reportTime.getHours().toString().padStart(2, '0')}:${reportTime.getMinutes().toString().padStart(2, '0')}`;
                
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

        document.getElementById("regionName").textContent = displayRegionName;
        document.getElementById("currentWeather").textContent = condition;
        document.getElementById("currentTemp").textContent = `${tempC}°C`;
        document.querySelector(".weather-detail-item:nth-child(1) .value").textContent = wind;
        document.querySelector(".weather-detail-item:nth-child(2) .value").textContent = humidity + '%';
        document.querySelector(".weather-detail-item:nth-child(3) .value").textContent = uv;
        document.querySelector(".weather-card .icon").innerHTML = icon;

        const forecastRes = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=7&lang=ja`);
        const forecastData = await forecastRes.json();
        
        const hourlyDiv = document.getElementById("hourly").querySelector(".hourly-forecast");
        hourlyDiv.innerHTML = "";
        const nowHour = new Date().getHours();
        forecastData.forecast.forecastday[0].hour.forEach((h, i) => {
            const hour = new Date(h.time).getHours();
            if ((hour - nowHour) % 3 === 0) {
                const hourIcon = `<img src="https:${h.condition.icon}" alt="${h.condition.text}" />`;
                hourlyDiv.innerHTML += `
                    <div class="forecast-item">
                        <div class="time">${h.time.slice(11,16)}</div>
                        <div class="icon">${hourIcon}</div>
                        <div class="temp">${h.temp_c}°C</div>
                    </div>`;
            }
        });

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

// =========================
// JMA 재난 정보 함수들
// =========================
function updateJMADisasterInfo() {
    const areaCode = "270000";

    const disasterList = document.querySelector("#disaster-list");
    const alertDiv = document.querySelector("#alert-desc");
    if (!disasterList || !alertDiv) return;

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

            const latest = list[0];
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
}

// =========================
// 시설 정보 함수들
// =========================
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

function createFacilityCard(containerId, name, address, distance, extraInfo = {}) {
    const container = document.getElementById(containerId).querySelector(".facility-list");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "facility-item";
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
            ${extraInfo.contact ? `<div><strong>연락처:</strong> ${contact}</div>` : "<div><strong>연락처:</strong> 정보없음</div>"}
            ${extraInfo.capacity ? `<div><strong>수용인원:</strong> ${extraInfo.capacity}</div>` : ""}
            <div><strong>거리:</strong> 현재 위치에서 ${distance} km</div>
        </div>
    `;
    container.appendChild(div);
}

function searchFacility(lat, lng, type, containerId) {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.maps) {
            console.error("Google Maps API가 로드되지 않았습니다.");
            reject("Google Maps API 없음");
            return;
        }

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

            results.slice(0,3).forEach(place => {
                const distance = calcDistance(lat, lng, place.geometry.location.lat(), place.geometry.location.lng());

                service.getDetails({ placeId: place.place_id, fields: ['name','formatted_address','formatted_phone_number','opening_hours','rating'] },
                    (details, detailsStatus) => {
                        if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && details) {
                            const extraInfo = {
                                contact: details.formatted_phone_number || "",
                            };
                            if(type === 'school') extraInfo.capacity = "500명";
                            if(type === 'hospital') extraInfo.emergency = "운영중";
                            createFacilityCard(containerId, details.name, details.formatted_address, distance, extraInfo);
                        } else {
                            createFacilityCard(containerId, place.name, place.vicinity, distance);
                        }
                    }
                );
            });

            resolve(results);
        });
    });
}

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

// =========================
// DB 연동 관련 함수들
// =========================
async function loadDisasterHistory() {
    try {
        console.log('DB에서 과거 재난 이력 조회 중...');
        
        const response = await fetch('/detail/disaster-history');
        
        if (response.ok) {
            const historyData = await response.json();
            console.log('DB 과거 이력 조회 성공:', historyData);
            displayDBHistory(historyData);
            return historyData;
        } else {
            console.error('DB 과거 이력 조회 실패:', response.status);
            const statusDiv = document.getElementById('db-history-status');
            if (statusDiv) statusDiv.textContent = 'DB 조회 실패';
            return [];
        }
        
    } catch (error) {
        console.error('DB 과거 이력 조회 오류:', error);
        const statusDiv = document.getElementById('db-history-status');
        if (statusDiv) statusDiv.textContent = '조회 중 오류 발생';
        return [];
    }
}

function displayDBHistory(historyData) {
    const historyList = document.getElementById('db-history-list');
    const statusDiv = document.getElementById('db-history-status');
    
    if (!historyList || !statusDiv) {
        console.warn('DB 히스토리 표시 요소를 찾을 수 없습니다.');
        return;
    }
    
    if (!historyData || historyData.length === 0) {
        statusDiv.textContent = 'DB에 저장된 재난 이력이 없습니다.';
        historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">저장된 재난 이력이 없습니다.</p>';
        return;
    }
    
    statusDiv.textContent = `DB에서 ${historyData.length}개의 재난 이력을 조회했습니다.`;
    
    let html = '';
    historyData.forEach((history, index) => {
        const disasterIcon = getDisasterIcon(history.disasterType);
        const occurredDate = new Date(history.occurredAt).toLocaleDateString('ko-KR');
        const createdDate = new Date(history.createdAt).toLocaleString('ko-KR');
        
        html += `
            <div class="history-item" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #fff;">
                <div class="history-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div class="history-title" style="font-weight: bold; color: #333;">
                        ${disasterIcon} ${history.title}
                    </div>
                    <div class="history-date" style="color: #666; font-size: 0.9em;">
                        ${occurredDate}
                    </div>
                </div>
                <div class="history-content" style="color: #555; line-height: 1.5;">
                    ${history.description || '상세 정보가 없습니다.'}
                    <br><br>
                    <strong>위치:</strong> ${history.location}<br>
                    ${history.magnitude ? `<strong>규모:</strong> ${history.magnitude}<br>` : ''}
                    ${history.depthKm ? `<strong>깊이:</strong> ${history.depthKm}<br>` : ''}
                    ${history.alertLevel ? `<strong>경보레벨:</strong> ${history.alertLevel}<br>` : ''}
                    <strong>출처:</strong> ${history.source}<br>
                    <small style="color: #888;">DB 저장: ${createdDate}</small>
                </div>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}

function getDisasterIcon(disasterType) {
    const icons = {
        'EARTHQUAKE': '🌋',
        'VOLCANO': '🗻',
        'TSUNAMI': '🌊',
        'TYPHOON': '🌪️',
        'FLOOD': '💧',
        'FIRE': '🔥',
        'LANDSLIDE': '⛰️',
        'OTHER': '⚠️'
    };
    return icons[disasterType] || '📋';
}

// =========================
// 실시간 데이터 표시 함수들
// =========================
function displayRealtimeData(data) {
    const statusElement = document.getElementById('disaster-status');
    if (statusElement) {
        statusElement.textContent = `총 ${data.totalCount}개 데이터 수집 완료`;
    }
    
    const updateElement = document.getElementById('last-update');
    if (updateElement) {
        updateElement.textContent = `마지막 업데이트: ${new Date(data.lastUpdated).toLocaleString()}`;
    }
    
    displayEarthquakes(data.earthquakes);
    displayVolcanoes(data.volcanoes);
}

function displayEarthquakes(earthquakes) {
    const earthquakeList = document.getElementById('earthquake-list');
    
    if (!earthquakeList) {
        console.warn('earthquake-list 요소를 찾을 수 없습니다.');
        return;
    }
    
    if (!earthquakes || earthquakes.length === 0) {
        earthquakeList.innerHTML = '<p>현재 지진 정보가 없습니다.</p>';
        return;
    }
    
    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
    earthquakes.slice(0, 5).forEach((eq, index) => {
        html += `<li style="padding: 10px; border-bottom: 1px solid #eee; ${index === earthquakes.length - 1 ? 'border-bottom: none;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="color: #dc3545;">규모 ${eq.magnitude}</strong> - ${eq.location}<br>
                    <small style="color: #666;">시간: ${eq.time}</small>
                    ${eq.depth && eq.depth !== 'N/A' ? `<br><small style="color: #666;">깊이: ${eq.depth}</small>` : ''}
                </div>
                <small style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">${eq.source}</small>
            </div>
        </li>`;
    });
    html += '</ul>';
    
    earthquakeList.innerHTML = html;
}

function displayVolcanoes(volcanoes) {
    const volcanoList = document.getElementById('volcano-list');
    
    if (!volcanoList) {
        console.warn('volcano-list 요소를 찾을 수 없습니다.');
        return;
    }
    
    if (!volcanoes || volcanoes.length === 0) {
        volcanoList.innerHTML = '<p>현재 화산 경보가 없습니다.</p>';
        return;
    }
    
    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
    volcanoes.forEach((vol, index) => {
        html += `<li style="padding: 10px; border-bottom: 1px solid #eee; ${index === volcanoes.length - 1 ? 'border-bottom: none;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="color: #fd7e14;">${vol.name}</strong> - 경보레벨 ${vol.alertLevel}<br>
                    <small style="color: #666;">상태: ${vol.status}</small>
                </div>
                <small style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">JMA</small>
            </div>
        </li>`;
    });
    html += '</ul>';
    
    volcanoList.innerHTML = html;
}

// =========================
// 스프링부트 전송 함수
// =========================
async function sendToSpringBoot() {
    try {
        console.log('스프링부트로 데이터 전송 시작...');
        
        const data = await jmaCrawler.collectAllData();
        
        const response = await fetch('/detail/jma-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.text();
            console.log('백엔드 전송 성공:', result);
            
            displayRealtimeData(data);
            
            setTimeout(() => {
                loadDisasterHistory();
            }, 1000);
            
            return true;
        } else {
            console.error('백엔드 전송 실패:', response.status);
            return false;
        }
        
    } catch (error) {
        console.error('전송 중 오류:', error);
        return false;
    }
}

// =========================
// DOM 로드 시 초기화
// =========================
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('regionSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchRegion();
        });
    }

    const firstNavItem = document.querySelector('.nav-menu .nav-item');
    if (firstNavItem) firstNavItem.classList.add('active');

    // 서버에서 받은 사용자 위치 사용
    const userLat = window.USER_LOCATION?.latitude || 35.6895;
    const userLng = window.USER_LOCATION?.longitude || 139.6917;
    const userRegion = window.USER_LOCATION?.address || "東京";
    
    console.log('로그인 사용자 기반 위치:', userLat, userLng, userRegion);
    
    // 기본 기능들 초기화
    updateWeatherAPI(userLat, userLng, userRegion);
    updateJMADisasterInfo();
    fetchRegionalNews(userRegion);
    
    // 시설 정보 로딩
    setTimeout(async () => {
        try {
            await searchFacility(userLat, userLng, "school", "shelter");
            await searchFacility(userLat, userLng, "hospital", "hospital");
        } catch(err) {
            console.error("시설 검색 실패:", err);
        }
    }, 1000);
    
    // DB 데이터 로드
    setTimeout(() => {
        loadDisasterHistory();
    }, 2000);
    
    // JMA 크롤러 자동 실행
    setTimeout(() => {
        console.log('페이지 로드 시 JMA 데이터 자동 수집...');
        sendToSpringBoot();
    }, 3000);
});

// =========================
// 전역 함수 등록
// =========================
window.jmaCrawler = jmaCrawler;
window.autoCrawler = autoCrawler;
window.sendToSpringBoot = sendToSpringBoot;
window.loadDisasterHistory = loadDisasterHistory;
window.displayDBHistory = displayDBHistory;
window.showForecast = showForecast;
window.showFacility = showFacility;
window.scrollToSection = scrollToSection;
window.searchRegion = searchRegion;

console.log('===== 완전 통합 재난 정보 시스템 로드 완료 =====');