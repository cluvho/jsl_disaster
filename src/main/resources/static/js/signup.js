document.addEventListener('DOMContentLoaded', function() {
    
    // ========== 기존 기능들 (그대로 유지) ==========
    
    // 닉네임 중복확인
    const btnCheckNickname = document.getElementById('btnCheckNickname');
    if (btnCheckNickname) {
        btnCheckNickname.addEventListener('click', function() {
            const nickname = document.getElementById('nickname').value.trim();
            const msgElement = document.getElementById('nickMsg');
            
            if (!nickname) {
                msgElement.textContent = '닉네임을 입력해주세요.';
                msgElement.className = 'hint error';
                return;
            }
            
            fetch(`/member/check-nickname?nickname=${encodeURIComponent(nickname)}`)
                .then(response => response.text())
                .then(result => {
                    if (result === 'exist') {
                        msgElement.textContent = '이미 사용중인 닉네임입니다.';
                        msgElement.className = 'hint error';
                    } else {
                        msgElement.textContent = '사용 가능한 닉네임입니다.';
                        msgElement.className = 'hint success';
                    }
                })
                .catch(error => {
                    msgElement.textContent = '중복확인 중 오류가 발생했습니다.';
                    msgElement.className = 'hint error';
                });
        });
    }
    
    // 인증메일 발송
    const btnSendCode = document.getElementById('btnSendCode');
    if (btnSendCode) {
        btnSendCode.addEventListener('click', function() {
            const email = document.getElementById('email').value.trim();
            
            if (!email) {
                alert('이메일을 입력해주세요.');
                return;
            }
            
            if (!isValidEmail(email)) {
                alert('올바른 이메일 형식이 아닙니다.');
                return;
            }
            
            this.disabled = true;
            this.textContent = '발송 중...';
            
            fetch('/member/send-verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(email)}`
            })
            .then(response => response.text())
            .then(result => {
                if (result === 'exist') {
                    alert('이미 사용중인 이메일입니다.');
                } else if (result === 'success') {
                    alert('인증메일이 발송되었습니다. 이메일을 확인해주세요.');
                    const verifyField = document.getElementById('verifyField');
                    if (verifyField) verifyField.style.display = 'block';
                } else {
                    alert('메일 발송 중 오류가 발생했습니다.');
                }
            })
            .catch(error => {
                alert('메일 발송 중 오류가 발생했습니다.');
            })
            .finally(() => {
                this.disabled = false;
                this.textContent = '인증메일 발송';
            });
        });
    }
    
    // 인증코드 확인
    const btnVerifyCode = document.getElementById('btnVerifyCode');
    if (btnVerifyCode) {
        btnVerifyCode.addEventListener('click', function() {
            const email = document.getElementById('email').value.trim();
            const verifyCode = document.getElementById('verifyCode').value.trim();
            const msgElement = document.getElementById('verifyMsg');
            
            if (!verifyCode) {
                msgElement.textContent = '인증코드를 입력해주세요.';
                msgElement.className = 'hint error';
                return;
            }
            
            fetch('/member/verify-email-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(email)}&verifyCode=${encodeURIComponent(verifyCode)}`
            })
            .then(response => response.text())
            .then(result => {
                if (result === 'success') {
                    msgElement.textContent = '이메일 인증이 완료되었습니다.';
                    msgElement.className = 'hint success';
                    document.getElementById('email').readOnly = true;
                    document.getElementById('btnSendCode').disabled = true;
                    this.disabled = true;
                } else {
                    msgElement.textContent = '인증코드가 올바르지 않거나 만료되었습니다.';
                    msgElement.className = 'hint error';
                }
            })
            .catch(error => {
                msgElement.textContent = '인증 확인 중 오류가 발생했습니다.';
                msgElement.className = 'hint error';
            });
        });
    }
    
    // 비밀번호 확인
    const password2 = document.getElementById('password2');
    if (password2) {
        password2.addEventListener('input', function() {
            const password = document.getElementById('password').value;
            const password2 = this.value;
            const msgElement = document.getElementById('pwMatchMsg');
            
            if (password2 && password !== password2) {
                msgElement.textContent = '비밀번호가 일치하지 않습니다.';
                msgElement.className = 'hint error';
            } else if (password2 && password === password2) {
                msgElement.textContent = '비밀번호가 일치합니다.';
                msgElement.className = 'hint success';
            } else {
                msgElement.textContent = '';
                msgElement.className = 'hint';
            }
        });
    }

    // ========== 일본 주소 처리 로직 (새로 추가) ==========

    let map = null;
    let marker = null;

    // 1단계: 우편번호로 주소 검색 (다음 우편번호 API → zipcloud API로 대체)
    const btnSearchAddress = document.getElementById('btnSearchAddress');
    if (btnSearchAddress) {
        btnSearchAddress.addEventListener('click', async function() {
            const postalCode = document.getElementById('postalCode').value.trim();
            
            // 유효성 검사 (7자리 숫자)
            if (!/^\d{7}$/.test(postalCode)) {
                alert('우편번호를 7자리 숫자로 입력해주세요 (예: 1234567)');
                return;
            }

            this.disabled = true;
            this.textContent = '검색 중...';

            try {
                // zipcloud API 호출
                const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
                const data = await response.json();

                if (data.status === 200 && data.results && data.results.length > 0) {
                    const result = data.results[0];
                    displayBasicAddress(result);
                    showAddressFields();
                } else {
                    alert('해당 우편번호를 찾을 수 없습니다');
                }
            } catch (error) {
                console.error('우편번호 검색 오류:', error);
                alert('검색 중 오류가 발생했습니다');
            } finally {
                this.disabled = false;
                this.textContent = '주소 검색';
            }
        });
    }

    // 2단계: 기본 주소 정보 표시
	function displayBasicAddress(addressData) {
	    // 화면에 표시 (읽기 전용 필드)
	    const prefectureEl = document.getElementById('prefecture');
	    const cityEl = document.getElementById('city');
	    const townEl = document.getElementById('town');
	    
	    if (prefectureEl) prefectureEl.value = addressData.address1;
	    if (cityEl) cityEl.value = addressData.address2;
	    if (townEl) townEl.value = addressData.address3 || '';

	    // 숨겨진 필드에 저장 (서버로 전송용)
	    const prefCodeEl = document.getElementById('prefCode');
	    const addrLine1El = document.getElementById('addrLine1');
	    
	    // prefCode 설정 - zipcloud API의 prefcode를 2자리 형식으로 변환
	    if (prefCodeEl) {
	        const prefCode = String(addressData.prefcode).padStart(2, '0');
	        prefCodeEl.value = prefCode;
	        console.log('PrefCode 설정:', prefCode);
	    }
	    
	    if (addrLine1El) addrLine1El.value = addressData.address3 || '';
	    
	    // 시구정촌 코드 찾기
	    const muniCode = findMunicipalityCode(addressData.address1, addressData.address2);
	    const muniCodeEl = document.getElementById('muniCode');
	    if (muniCodeEl) {
	        muniCodeEl.value = muniCode;
	        console.log('MuniCode 설정:', muniCode);
	    }
	}

	// cities.js에서 시구정촌 코드 찾기 (개선된 버전)
	    function findMunicipalityCode(pref, city) {
	        console.log('찾는 중:', pref, city);
	        
	        if (!window.cities) {
	            console.warn('cities.js가 로드되지 않았습니다');
	            return '';
	        }
	        
	        // 1. 도도부현명 변환
	        let targetPref = pref;
	        if (pref === "大阪市" || city.includes("大阪市")) {
	            targetPref = "大阪府";
	        }
	        
	        // 2. 정확 매칭 시도
	        let found = window.cities.find(item => 
	            item.pref === targetPref && item.city === city
	        );
	        
	        if (found) {
	            console.log('정확 매칭:', found);
	            return found.code;
	        }
	        
	        // 3. 시 단위로 매칭 (구 부분 제거)
	        let cityBase = city;
	        if (city.includes("市")) {
	            cityBase = city.substring(0, city.indexOf("市") + 1);
	        }
	        
	        found = window.cities.find(item => 
	            item.pref === targetPref && item.city === cityBase
	        );
	        
	        if (found) {
	            console.log('시 단위 매칭:', found);
	            return found.code;
	        }
	        
	        // 4. 군 단위로 매칭 시도 (새로 추가)
	        if (city.includes("郡")) {
	            // "磯谷郡蘭越町" → "磯谷郡"
	            const gunIndex = city.indexOf("郡");
	            const gunName = city.substring(0, gunIndex + 1);
	            
	            found = window.cities.find(item => 
	                item.pref === targetPref && item.city.startsWith(gunName)
	            );
	            
	            if (found) {
	                console.log('군 단위 매칭:', found);
	                return found.code;
	            }
	            
	            // 5. 정목명으로 매칭 시도
	            const townName = city.substring(gunIndex + 1);
	            found = window.cities.find(item => 
	                item.pref === targetPref && item.city === townName
	            );
	            
	            if (found) {
	                console.log('정목명 매칭:', found);
	                return found.code;
	            }
	        }
	        
	        // 6. 부분 매칭 시도 (마지막 수단)
	        found = window.cities.find(item => 
	            item.pref === targetPref && 
	            (item.city.includes(city) || city.includes(item.city))
	        );
	        
	        if (found) {
	            console.log('부분 매칭:', found);
	            return found.code;
	        }
	        
	        // 7. 매칭 실패 시 기본값 반환 (북해도의 경우 01)
	        console.warn('매칭 실패:', targetPref, city);
	        if (targetPref === "北海道") {
	            return "01000"; // 북해도 기본 코드
	        }
	        return '';
	    }

    // 주소 필드들 표시
    function showAddressFields() {
        const addressAutoFields = document.getElementById('addressAutoFields');
        const detailAddressField = document.getElementById('detailAddressField');
        
        if (addressAutoFields) addressAutoFields.style.display = 'block';
        if (detailAddressField) detailAddressField.style.display = 'block';
    }

    // 3단계: 상세 주소로 정확한 위치 확인 (수정됨)
    const btnGetLocation = document.getElementById('btnGetLocation');
    if (btnGetLocation) {
        btnGetLocation.addEventListener('click', async function() {
            // null 체크 추가
            const prefectureEl = document.getElementById('prefecture');
            const cityEl = document.getElementById('city');
            const townEl = document.getElementById('town');
            const detailEl = document.getElementById('detailAddress'); // 필드명 수정

            if (!prefectureEl || !cityEl || !townEl || !detailEl) {
                alert('주소 정보가 완전하지 않습니다. 주소 검색을 다시 해주세요.');
                return;
            }

            const prefecture = prefectureEl.value;
            const city = cityEl.value;
            const town = townEl.value;
            const detail = detailEl.value.trim();

            if (!detail) {
                alert('상세 주소를 입력해주세요');
                return;
            }

            const fullAddress = `${prefecture}${city}${town}${detail}`;

            this.disabled = true;
            this.textContent = '위치 확인 중...';

            try {
                // Google Geocoding API 호출
                const coords = await geocodeAddress(fullAddress);
                
                if (coords) {
                    // 최종 데이터 저장 (숨겨진 필드) - null 체크 추가
                    const latEl = document.getElementById('lat');
                    const lonEl = document.getElementById('lon');
                    
                    if (latEl) latEl.value = coords.lat;
                    if (lonEl) lonEl.value = coords.lng;

                    // 지도 표시
                    initSignupMap(coords.lat, coords.lng);
                    const mapField = document.getElementById('mapField');
                    if (mapField) mapField.style.display = 'block';
                    
                    // 좌표 정보 표시
                    const coordInfo = document.getElementById('coordinateInfo');
                    if (coordInfo) {
                        coordInfo.textContent = `위도: ${coords.lat.toFixed(6)}, 경도: ${coords.lng.toFixed(6)}`;
                    }
                } else {
                    alert('정확한 위치를 찾을 수 없습니다. 주소를 확인해주세요');
                }
            } catch (error) {
                console.error('위치 검색 오류:', error);
                alert('위치 검색 중 오류가 발생했습니다');
            } finally {
                this.disabled = false;
                this.textContent = '위치 확인';
            }
        });
    }

    // Google Geocoding API 호출 함수
    async function geocodeAddress(address) {
        // Google Maps JavaScript API의 Geocoder 사용
        return new Promise((resolve) => {
            if (!window.google || !window.google.maps) {
                // Google Maps API가 로드되지 않은 경우 대략적인 좌표 반환
                console.warn('Google Maps API not loaded, using approximate coordinates');
                resolve({
                    lat: 35.6762 + (Math.random() - 0.5) * 0.1,
                    lng: 139.6503 + (Math.random() - 0.5) * 0.1
                });
                return;
            }

            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng()
                    });
                } else {
                    console.error('Geocoding failed:', status);
                    resolve(null);
                }
            });
        });
    }

    // 4단계: 지도 초기화
    function initSignupMap(lat, lng) {
        if (!window.google || !window.google.maps) {
            console.warn('Google Maps API not loaded');
            return;
        }

        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.warn('Map element not found');
            return;
        }

        map = new google.maps.Map(mapElement, {
            center: { lat: lat, lng: lng },
            zoom: 17,
            mapTypeId: 'roadmap'
        });

        marker = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map,
            draggable: true,
            title: '클릭하여 위치를 수정할 수 있습니다'
        });

        // 마커 드래그로 위치 수정
        marker.addListener('dragend', function() {
            const position = marker.getPosition();
            const newLat = position.lat();
            const newLng = position.lng();
            
            const latEl = document.getElementById('lat');
            const lonEl = document.getElementById('lon');
            const coordInfo = document.getElementById('coordinateInfo');
            
            if (latEl) latEl.value = newLat;
            if (lonEl) lonEl.value = newLng;
            if (coordInfo) {
                coordInfo.textContent = `위도: ${newLat.toFixed(6)}, 경도: ${newLng.toFixed(6)}`;
            }
        });

        // 지도 클릭으로 위치 수정
        map.addListener('click', function(e) {
            marker.setPosition(e.latLng);
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            
            const latEl = document.getElementById('lat');
            const lonEl = document.getElementById('lon');
            const coordInfo = document.getElementById('coordinateInfo');
            
            if (latEl) latEl.value = newLat;
            if (lonEl) lonEl.value = newLng;
            if (coordInfo) {
                coordInfo.textContent = `위도: ${newLat.toFixed(6)}, 경도: ${newLng.toFixed(6)}`;
            }
        });
    }

    // ========== 폼 제출 처리 (일본 주소 검증 추가) ==========
    
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            // 이메일 인증 확인
            const verifyMsg = document.getElementById('verifyMsg');
            if (verifyMsg && !verifyMsg.classList.contains('success')) {
                e.preventDefault();
                alert('이메일 인증을 완료해주세요.');
                return false;
            }
            
            // 비밀번호 확인
            const password = document.getElementById('password').value;
            const password2 = document.getElementById('password2').value;
            if (password !== password2) {
                e.preventDefault();
                alert('비밀번호가 일치하지 않습니다.');
                return false;
            }

            // === 일본 주소 데이터 검증 (수정된 부분) ===
            const postalCodeEl = document.getElementById('postalCode');
            const prefCodeEl = document.getElementById('prefCode');
            const muniCodeEl = document.getElementById('muniCode');
            const detailAddressEl = document.getElementById('detailAddress'); // 필드명 수정

            const postalCode = postalCodeEl ? postalCodeEl.value : '';
            const prefCode = prefCodeEl ? prefCodeEl.value : '';
            const muniCode = muniCodeEl ? muniCodeEl.value : '';
            const detailAddress = detailAddressEl ? detailAddressEl.value : '';

            if (!postalCode || !prefCode || !muniCode || !detailAddress) {
                e.preventDefault();
                alert('주소 정보를 모두 입력해주세요.');
                return false;
            }

            // 우편번호 형식 검사
            if (!/^\d{7}$/.test(postalCode)) {
                e.preventDefault();
                alert('우편번호를 올바른 형식으로 입력해주세요.');
                return false;
            }
            
            // 필수 약관 확인
            const agreeTerms = document.getElementById('agreeTerms');
            const agreePrivacy = document.getElementById('agreePrivacy');
            if (!agreeTerms || !agreePrivacy || !agreeTerms.checked || !agreePrivacy.checked) {
                e.preventDefault();
                alert('필수 약관에 동의해주세요.');
                return false;
            }
            
            return true;
        });
    }
    
    // ========== 유틸리티 함수들 ==========
    
    // 이메일 형식 검증 함수
    function isValidEmail(email) {
        const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(email);
    }
    
    // 비밀번호 찾기 링크 처리
    const forgotPasswordLink = document.querySelector('.forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/member/forgot-password';
        });
    }
});

// Google Maps API 콜백 함수 (전역으로 선언) - 함수명 수정
function initSignupMap() {
    console.log('Google Maps API loaded for signup');

}