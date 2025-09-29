// JMA(일본 기상청) 재해 정보 크롤러
class JMADisasterCrawler {
    constructor() {
        this.proxyUrl = 'https://api.allorigins.win/get?url=';
        this.baseUrl = 'https://www.jma.go.jp';
    }

    // CORS 문제 해결을 위한 프록시 요청
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

    // 지진 정보 가져오기 (테스트용) 잘되서 지움
	// 더 안정적인 지진 정보 가져오기
	async getEarthquakeData() {
	    console.log('실제 지진 정보 수집 중...');
	    
	    try {
	        // 여러 소스 시도해보기
	        const sources = [
	            'https://www.jma.go.jp/bosai/forecast/data/earthquake/realtime.xml',
	            'https://www.jma.go.jp/bosai/forecast/data/earthquake/',
	            'https://api.p2pquake.net/v2/history?codes=551&limit=5' // 대안 API
	        ];
	        
	        for (let sourceUrl of sources) {
	            try {
	                console.log(`시도 중: ${sourceUrl}`);
	                
	                if (sourceUrl.includes('p2pquake')) {
	                    // P2P 지진정보 API 사용 (일본 지진 정보)
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
	                    
	                    console.log(`실제 지진 데이터 ${earthquakes.length}개 수집 완료 (P2P)`);
	                    return earthquakes;
	                }
	                else {
	                    // JMA 사이트 시도
	                    const htmlContent = await this.fetchWithProxy(sourceUrl);
	                    console.log('JMA 응답 받음:', htmlContent.substring(0, 200));
	                    
	                    // 간단한 파싱 시도
	                    if (htmlContent.includes('earthquake') || htmlContent.includes('地震')) {
	                        const earthquakes = [{
	                            magnitude: '실제데이터',
	                            location: 'JMA에서 가져온 데이터',
	                            time: new Date().toLocaleString('ko-KR'),
	                            depth: 'JMA',
	                            type: 'earthquake',
	                            source: 'JMA'
	                        }];
	                        
	                        console.log(`JMA 데이터 ${earthquakes.length}개 수집 완료`);
	                        return earthquakes;
	                    }
	                }
	                
	            } catch (error) {
	                console.log(`${sourceUrl} 실패:`, error.message);
	                continue;
	            }
	        }
	        
	        throw new Error('모든 소스에서 데이터 가져오기 실패');
	        
	    } catch (error) {
	        console.error('실제 지진 데이터 수집 실패, 테스트 데이터 사용:', error);
	        
	        // 실패시 현실적인 테스트 데이터 반환
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

    // 화산 정보 가져오기 (테스트용)
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

    // 모든 재해 정보 수집
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
                tsunamis: [], // 나중에 추가
                typhoons: [], // 나중에 추가
                lastUpdated: new Date().toISOString(),
                totalCount: earthquakes.length + volcanoes.length
            };

            console.log('=== 데이터 수집 완료 ===');
            console.log(`총 ${allData.totalCount}개 데이터 수집`);
            console.log('데이터:', allData);

            return allData;

        } catch (error) {
            console.error('데이터 수집 중 오류:', error);
            throw error;
        }
    }
}

// 크롤러 인스턴스 생성
const jmaCrawler = new JMADisasterCrawler();

// 테스트 실행 함수
async function testCrawler() {
    try {
        const data = await jmaCrawler.collectAllData();
        console.log('크롤링 테스트 성공!', data);
        return data;
    } catch (error) {
        console.error('크롤링 테스트 실패:', error);
    }
}

// 전역에서 사용할 수 있도록 export
window.jmaCrawler = jmaCrawler;
window.testCrawler = testCrawler;

console.log('JMA 크롤러 로드 완료');

// 스프링부트 백엔드로 데이터 전송
async function sendToSpringBoot() {
    try {
        console.log('스프링부트로 데이터 전송 시작...');
        
        // 최신 데이터 수집
        const data = await jmaCrawler.collectAllData();
        
        // 백엔드로 POST 요청
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

// 전역 함수로 등록
window.sendToSpringBoot = sendToSpringBoot;

// 자동 크롤링 및 전송 기능
class AutoCrawler {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
    }
    
    // 자동 크롤링 시작 (분 단위)
    start(intervalMinutes = 10) {
        if (this.isRunning) {
            console.log('이미 자동 크롤링이 실행 중입니다.');
            return;
        }
        
        console.log(`자동 크롤링 시작 - ${intervalMinutes}분마다 실행`);
        
        // 즉시 한 번 실행
        this.runOnce();
        
        // 주기적 실행 설정
        this.intervalId = setInterval(() => {
            this.runOnce();
        }, intervalMinutes * 60 * 1000); // 분을 밀리초로 변환
        
        this.isRunning = true;
    }
    
    // 한 번만 실행
    async runOnce() {
        try {
            console.log(`[${new Date().toLocaleString()}] 자동 크롤링 실행`);
            await sendToSpringBoot();
        } catch (error) {
            console.error('자동 크롤링 오류:', error);
        }
    }
    
    // 자동 크롤링 중지
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('자동 크롤링 중지됨');
        }
    }
    
    // 상태 확인
    getStatus() {
        return {
            running: this.isRunning,
            intervalId: this.intervalId
        };
    }
}

// 전역 인스턴스 생성
window.autoCrawler = new AutoCrawler();

// 편의 함수들
window.startAutoCrawler = (minutes) => autoCrawler.start(minutes);
window.stopAutoCrawler = () => autoCrawler.stop();
window.crawlerStatus = () => autoCrawler.getStatus();

console.log('자동 크롤러 기능 로드 완료');

// 실시간 데이터 표시 함수들
function displayRealtimeData(data) {
    // 상태 업데이트
    document.getElementById('disaster-status').textContent = 
        `총 ${data.totalCount}개 데이터 수집 완료`;
    
    // 마지막 업데이트 시간
    document.getElementById('last-update').textContent = 
        `마지막 업데이트: ${new Date(data.lastUpdated).toLocaleString()}`;
    
    // 지진 데이터 표시
    displayEarthquakes(data.earthquakes);
    
    // 화산 데이터 표시
    displayVolcanoes(data.volcanoes);
}

function displayEarthquakes(earthquakes) {
    const earthquakeList = document.getElementById('earthquake-list');
    
    if (!earthquakes || earthquakes.length === 0) {
        earthquakeList.innerHTML = '<p>현재 지진 정보가 없습니다.</p>';
        return;
    }
    
    let html = '<ul>';
    earthquakes.slice(0, 5).forEach(eq => {  // 최근 5개만 표시
        html += `<li>
            <strong>규모 ${eq.magnitude}</strong> - ${eq.location}<br>
            <small>시간: ${eq.time} | 깊이: ${eq.depth}</small>
        </li>`;
    });
    html += '</ul>';
    
    earthquakeList.innerHTML = html;
}

function displayVolcanoes(volcanoes) {
    const volcanoList = document.getElementById('volcano-list');
    
    if (!volcanoes || volcanoes.length === 0) {
        volcanoList.innerHTML = '<p>현재 화산 경보가 없습니다.</p>';
        return;
    }
    
    let html = '<ul>';
    volcanoes.forEach(vol => {
        html += `<li>
            <strong>${vol.name}</strong> - 경보레벨 ${vol.alertLevel}<br>
            <small>상태: ${vol.status}</small>
        </li>`;
    });
    html += '</ul>';
    
    volcanoList.innerHTML = html;
}

// sendToSpringBoot 함수 수정 - 성공시 화면에 표시
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
            
            // 성공시 화면에 실시간 데이터 표시
            displayRealtimeData(data);
            
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

// ===============================
// DB 연동 관련 추가 기능
// ===============================

// DB에서 과거 재난 이력 가져오기
async function loadDisasterHistory() {
    try {
        console.log('DB에서 과거 재난 이력 조회 중...');
        
        const response = await fetch('/detail/disaster-history');
        
        if (response.ok) {
            const historyData = await response.json();
            console.log('DB 과거 이력 조회 성공:', historyData);
            
            // 화면에 표시
            displayDBHistory(historyData);
            
            return historyData;
        } else {
            console.error('DB 과거 이력 조회 실패:', response.status);
            document.getElementById('db-history-status').textContent = 'DB 조회 실패';
            return [];
        }
        
    } catch (error) {
        console.error('DB 과거 이력 조회 오류:', error);
        document.getElementById('db-history-status').textContent = '조회 중 오류 발생';
        return [];
    }
}

// DB에서 현재 재난 목록 가져오기
async function loadCurrentDisasters() {
    try {
        console.log('DB에서 현재 재난 조회 중...');
        
        const response = await fetch('/detail/current-disasters');
        
        if (response.ok) {
            const currentData = await response.json();
            console.log('DB 현재 재난 조회 성공:', currentData);
            
            return currentData;
        } else {
            console.error('DB 현재 재난 조회 실패:', response.status);
            return [];
        }
        
    } catch (error) {
        console.error('DB 현재 재난 조회 오류:', error);
        return [];
    }
}

// DB 과거 이력을 화면에 표시
function displayDBHistory(historyData) {
    const historyList = document.getElementById('db-history-list');
    const statusDiv = document.getElementById('db-history-status');
    
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

// 재난 유형별 아이콘 반환
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

// sendToSpringBoot 함수 수정 - DB 저장 후 이력도 업데이트
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
            
            // 성공시 화면에 실시간 데이터 표시
            displayRealtimeData(data);
            
            // DB에 저장되었으므로 과거 이력도 새로 불러오기
            setTimeout(() => {
                loadDisasterHistory();
            }, 1000); // 1초 후에 DB 조회 (저장 완료 대기)
            
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

// 페이지 로드 시 DB 데이터도 함께 로드
document.addEventListener('DOMContentLoaded', function() {
    // 기존 코드...
    
    // 페이지 로드 후 DB 데이터 로드
    setTimeout(() => {
        loadDisasterHistory();
    }, 2000);
    
    // 페이지 로드 후 3초 뒤에 JMA 데이터 자동 실행
    setTimeout(() => {
        if (window.sendToSpringBoot) {
            console.log('페이지 로드 시 JMA 데이터 자동 수집...');
            sendToSpringBoot();
        }
    }, 3000);
});

// 수동으로 DB 데이터 새로고침하는 함수들 (콘솔에서 사용 가능)
window.loadDisasterHistory = loadDisasterHistory;
window.loadCurrentDisasters = loadCurrentDisasters;

console.log('DB 연동 기능 로드 완료');

