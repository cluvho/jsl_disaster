// ===================================================================
// 완전 통합 재난 정보 시스템 JS 파일
// 모든 기능을 하나의 파일에 통합
// ===================================================================

// =========================
// 전역 변수 및 설정
// =========================
const WEATHER_API_KEY = "c8b2e054755849cda2e51309251009";
const warningCodeMap = {
    "11": "大雨注意報", "12": "大雨警報", "21": "洪水注意報", "22": "洪水警報",
    "31": "強風注意報", "32": "暴風警報", "41": "波浪注意報", "42": "波浪警報",
    "51": "雷注意報", "52": "雷警報", "61": "暴風雨注意報", "62": "暴風雨警報"
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
            console.error('プロキシリクエスト失敗:', error);
            throw error;
        }
    }

    async getEarthquakeData() {
        console.log('実際の地震情報を収集中...');

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
                            location: item.earthquake?.hypocenter?.name || '位置情報なし',
                            time: new Date(item.time).toLocaleString('ja-JP'),
                            depth: item.earthquake?.hypocenter?.depth ? `${item.earthquake.hypocenter.depth}km` : 'N/A',
                            type: 'earthquake',
                            source: 'P2P地震情報'
                        }));

                        console.log(`実際の地震データ ${earthquakes.length}件の収集完了`);
                        return earthquakes;
                    }
                } catch (error) {
                    console.log(`${sourceUrl} 失敗:`, error.message);
                    continue;
                }
            }

            throw new Error('全てのソースからのデータ取得に失敗');

        } catch (error) {
            console.error('実際の地震データ収集失敗、テストデータを使用:', error);

            return [
                {
                    magnitude: '4.8',
                    location: '東京湾 (テスト)',
                    time: new Date().toLocaleString('ja-JP'),
                    depth: '25km',
                    type: 'earthquake',
                    source: 'TEST'
                },
                {
                    magnitude: '3.2',
                    location: '大阪北部 (テスト)',
                    time: new Date(Date.now() - 3600000).toLocaleString('ja-JP'),
                    depth: '15km',
                    type: 'earthquake',
                    source: 'TEST'
                }
            ];
        }
    }

    async getVolcanoData() {
        console.log('火山情報を収集中...');

        const testData = [
            {
                name: '富士山',
                alertLevel: '1',
                status: '平常',
                time: new Date().toLocaleString(),
                type: 'volcano'
            }
        ];

        console.log(`火山データ ${testData.length}件の収集完了`);
        return testData;
    }

    async collectAllData() {
        console.log('=== JMA災害情報クローリング開始 ===');

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

            console.log('=== データ収集完了 ===');
            console.log(`合計 ${allData.totalCount}件のデータを収集`);

            return allData;

        } catch (error) {
            console.error('データ収集中にエラー:', error);
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
            console.log('すでに自動クローリングが実行中です。');
            return;
        }

        console.log(`自動クローリング開始 - ${intervalMinutes}分ごとに実行`);
        this.runOnce();

        this.intervalId = setInterval(() => {
            this.runOnce();
        }, intervalMinutes * 60 * 1000);

        this.isRunning = true;
    }

    async runOnce() {
        try {
            console.log(`[${new Date().toLocaleString()}] 自動クローリング実行`);
            await sendToSpringBoot();
        } catch (error) {
            console.error('自動クローリングエラー:', error);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('自動クローリングが停止しました');
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
        alert('検索する地域名を入力してください。');
        return;
    }

    // 1. Google Maps Geocoder API를 사용하여 주소를 좌표로 변환합니다.
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': regionName, 'language': 'ja' }, async (results, status) => {

        if (status === 'OK' && results[0]) {
            // 2. 변환에 성공하면 첫 번째 결과에서 위도와 경도를 추출합니다.
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lon = location.lng();
            const formattedAddress = results[0].formatted_address; // 더 정확한 주소 이름

            console.log(`'${regionName}' の検索成功:`, { lat, lon, formattedAddress });

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
            console.error(`'${regionName}' 地域が見つかりません。Geocode失敗ステータス:`, status);
            alert(`'${regionName}'の位置情報が見つかりませんでした。別の検索語をお試しください。`);
        }
    });
}

// =========================
// 날씨 관련 함수들
// =========================
function showLoadingState() {
    document.getElementById("currentTemp").textContent = "読込中...";
    document.getElementById("currentWeather").textContent = "データを取得中";
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

                const disasterType = "気象特報";

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
                warningContainer.innerHTML = "<p>現在発表されている気象特報はありません。</p>";
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
		return currentData.location.name;

    } catch(err) {
        console.error("天気APIエラー:", err);
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
                alertDiv.textContent = "現在発表されている警報・注意報はありません";
            }
        })
        .catch(err => console.error("警報の読み込みエラー:", err));

    fetch("https://www.jma.go.jp/bosai/quake/data/list.json")
        .then(res => res.json())
        .then(list => {
            if (!list || list.length === 0) {
                disasterList.innerHTML += `
                    <div class="disaster-item">
                        <div class="disaster-header">
                            <div class="disaster-type">🌏 地震</div>
                            <div class="disaster-time">-</div>
                        </div>
                        <p>最近の地震記録がありません。</p>
                    </div>`;
                return;
            }

            const latest = list[0];
            const time = latest.time ?? "情報なし";
            const magnitude = latest.magunitude ?? "情報なし";
            const hypocenter = latest.hypocenter?.name ?? "情報なし";
            const maxScale = latest.maxScale ?? "情報なし";

            const item = document.createElement("div");
            item.className = "disaster-item";
            item.innerHTML = `
                <div class="disaster-header">
                    <div class="disaster-type">🌏 地震</div>
                    <div class="disaster-time">${new Date(time).toLocaleString()}</div>
                </div>
                <p><strong>震源地:</strong> ${hypocenter}</p>
                <p><strong>規模:</strong> ${magnitude}</p>
                <p><strong>最大震度:</strong> ${maxScale}</p>
            `;
            disasterList.appendChild(item);
        })
        .catch(err => console.error("地震の読み込みエラー:", err));
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
    const emergency = extraInfo.emergency || "情報なし";
    const contact = extraInfo.contact || "情報なし";

    div.innerHTML = `
        <div class="facility-header">
            <div>
                <div class="facility-name">${name}</div>
            </div>
        </div>
        <div class="facility-info">
            <div><strong>住所:</strong> ${address}</div>
            ${extraInfo.emergency ? `<div><strong>救急外来:</strong> ${emergency}</div>` : ""}
            ${extraInfo.contact ? `<div><strong>連絡先:</strong> ${contact}</div>` : "<div><strong>連絡先:</strong> 情報なし</div>"}
            <div><strong>距離:</strong> 現在地から ${distance} km</div>
        </div>
    `;
    container.appendChild(div);
}

function searchFacility(lat, lng, type, containerId) {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.maps) {
            console.error("Google Maps APIが読み込まれていません。");
            reject("Google Maps APIなし");
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

                service.getDetails({ placeId: place.place_id, fields: ['name','formatted_address','formatted_phone_number','opening_hours','rating'],
									language:"ja"
				 },
                    (details, detailsStatus) => {
                        if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && details) {
                            const extraInfo = {
                                contact: details.formatted_phone_number || "",
                            };
                            if(type === 'school') extraInfo.capacity = "情報なし";
                            if(type === 'hospital') extraInfo.emergency = "運営中";
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
            newsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #888;">"${region}"地域のニュースがありません。</div>`;
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
        console.error("データの取得中にエラーが発生しました:", error);
        const newsContainer = document.querySelector(".news-list");
        newsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #888;">ニュースの取得に失敗しました。しばらくしてからもう一度お試しください。</div>`;
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
            if (statusDiv) statusDiv.textContent = 'DB照会失敗';
            return [];
        }

    } catch (error) {
        console.error('DB 과거 이력 조회 오류:', error);
        const statusDiv = document.getElementById('db-history-status');
        if (statusDiv) statusDiv.textContent = '照会中にエラー発生';
        return [];
    }
}

function displayDBHistory(historyData) {
    const historyList = document.getElementById('db-history-list');
    const statusDiv = document.getElementById('db-history-status');

    if (!historyList || !statusDiv) {
        console.warn('DB履歴表示要素が見つかりません。');
        return;
    }

    if (!historyData || historyData.length === 0) {
        statusDiv.textContent = 'DBに保存された災害履歴がありません。';
        historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">保存された災害履歴がありません。</p>';
        return;
    }

    statusDiv.textContent = `DBから${historyData.length}件の災害履歴を照会しました。`;

    let html = '';
    historyData.forEach((history, index) => {
        const disasterIcon = getDisasterIcon(history.disasterType);
        const occurredDate = new Date(history.occurredAt).toLocaleDateString('ja-JP');
        const createdDate = new Date(history.createdAt).toLocaleString('ja-JP');

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
                    ${history.description || '詳細情報がありません。'}
                    <br><br>
                    <strong>位置:</strong> ${history.location}<br>
                    ${history.magnitude ? `<strong>規模:</strong> ${history.magnitude}<br>` : ''}
                    ${history.depthKm ? `<strong>深さ:</strong> ${history.depthKm}<br>` : ''}
                    ${history.alertLevel ? `<strong>警報レベル:</strong> ${history.alertLevel}<br>` : ''}
                    <strong>出典:</strong> ${history.source}<br>
                    <small style="color: #888;">DB保存: ${createdDate}</small>
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
        statusElement.textContent = `合計 ${data.totalCount}件のデータ収集完了`;
    }

    const updateElement = document.getElementById('last-update');
    if (updateElement) {
        updateElement.textContent = `最終更新: ${new Date(data.lastUpdated).toLocaleString()}`;
    }

    displayEarthquakes(data.earthquakes);
    displayVolcanoes(data.volcanoes);
}

function displayEarthquakes(earthquakes) {
    const earthquakeList = document.getElementById('earthquake-list');

    if (!earthquakeList) {
        console.warn('earthquake-list要素が見つかりません。');
        return;
    }

    if (!earthquakes || earthquakes.length === 0) {
        earthquakeList.innerHTML = '<p>現在、地震情報はありません。</p>';
        return;
    }

    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
    earthquakes.slice(0, 5).forEach((eq, index) => {
        html += `<li style="padding: 10px; border-bottom: 1px solid #eee; ${index === earthquakes.length - 1 ? 'border-bottom: none;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="color: #dc3545;">規模 ${eq.magnitude}</strong> - ${eq.location}<br>
                    <small style="color: #666;">時間: ${eq.time}</small>
                    ${eq.depth && eq.depth !== 'N/A' ? `<br><small style="color: #666;">深さ: ${eq.depth}</small>` : ''}
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
        console.warn('volcano-list要素が見つかりません。');
        return;
    }

    if (!volcanoes || volcanoes.length === 0) {
        volcanoList.innerHTML = '<p>現在、火山警報はありません。</p>';
        return;
    }

    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
    volcanoes.forEach((vol, index) => {
        html += `<li style="padding: 10px; border-bottom: 1px solid #eee; ${index === volcanoes.length - 1 ? 'border-bottom: none;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="color: #fd7e14;">${vol.name}</strong> - 警報レベル ${vol.alertLevel}<br>
                    <small style="color: #666;">状態: ${vol.status}</small>
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
        console.log('SpringBootへデータ転送開始...');

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
            console.log('バックエンド転送成功:', result);

            displayRealtimeData(data);

            setTimeout(() => {
                loadDisasterHistory();
            }, 1000);

            return true;
        } else {
            console.error('バックエンド転送失敗:', response.status);
            return false;
        }

    } catch (error) {
        console.error('転送中にエラー:', error);
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

    // 1. URL 파라미터 및 위치 정보 설정
    const urlParams = new URLSearchParams(window.location.search);
    const latFromUrl = urlParams.get('lat');
    const lonFromUrl = urlParams.get('lon');
    const userLat = parseFloat(latFromUrl) || window.USER_LOCATION?.latitude || 35.6895;
    const userLng = parseFloat(lonFromUrl) || window.USER_LOCATION?.longitude || 139.6917;
    const initialUserRegion = window.USER_LOCATION?.address || "指定された位置";

    console.log(`URLパラメータを検出: lat=${latFromUrl}, lon=${lonFromUrl}`);
    console.log('最終的に適用された位置:', userLat, userLng);

    // 2. 비동기 함수들을 순서에 맞게 실행하기 위한 즉시실행함수
    (async () => {
        // JMA 재난 정보는 지역 이름과 무관하므로 먼저 호출
        updateJMADisasterInfo();

        // 날씨 API를 먼저 호출하고, 완료될 때까지 기다려서 정확한 지역 이름을 얻어냄
        console.log("天気APIを呼び出して正確な地域名を取得中...");
        const accurateRegionName = await updateWeatherAPI(userLat, userLng, initialUserRegion);
        console.log(`APIから受け取った正確な地域名: ${accurateRegionName}`);

        // 얻어낸 정확한 지역 이름으로 뉴스를 검색
        fetchRegionalNews(accurateRegionName);

        // 시설 정보 로딩
        try {
            await searchFacility(userLat, userLng, "school", "shelter");
            await searchFacility(userLat, userLng, "hospital", "hospital");
        } catch(err) {
            console.error("施設検索失敗:", err);
        }

        // DB 데이터 로드
        loadDisasterHistory();

        // JMA 크롤러 자동 실행 (페이지 기능 로딩이 모두 끝난 후 실행되도록 순서를 조정)
        console.log('ページロード時にJMAデータを自動収集...');
        sendToSpringBoot();
    })();
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

console.log('===== 完全統合災害情報システム ロード完了 =====');