let map;
// 구글맵 초기화
function initMap() {
	const mapElement = document.getElementById("map");
	const userLat = mapElement.dataset.lat ? parseFloat(mapElement.dataset.lat) : null;
	const userLon = mapElement.dataset.lon ? parseFloat(mapElement.dataset.lon) : null;
	const hospitalToggle = document.getElementById('hospitalToggle');

	const defaultCenter = { lat: 35.68, lng: 139.76 }; // 도쿄
	const center = (userLat && userLon) ? { lat: userLat, lng: userLon } : defaultCenter;

	map = new google.maps.Map(mapElement, {
		center: center,
		zoom: 12
	});
	// 다른 스크립트에서 공용으로 쓰도록
	window._map = map;
}
// 토글 이벤트 바인딩
document.addEventListener("DOMContentLoaded", () => {
	const weatherToggle = document.getElementById('weatherToggle');
	const disasterToggle = document.getElementById('disasterToggle');
	const shelterToggle = document.getElementById('shelterToggle');

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
		shelterToggle.addEventListener('change', () => {
			if (shelterToggle.checked) {
				ShelterFeature.enable(window._map);
				window._map.setZoom(15);
			} else {
				ShelterFeature.disable();
				window._map.setZoom(12);
			}
		});
	}
	// 병원 토글
	if (hospitalToggle) {
		hospitalToggle.addEventListener('change', () => {
			if (hospitalToggle.checked) {
				HospitalOSMFeature.enable(window._map);
				window._map.setZoom(15);
			} else {
				HospitalOSMFeature.disable();
				window._map.setZoom(12);
			}
		});
	}
});
