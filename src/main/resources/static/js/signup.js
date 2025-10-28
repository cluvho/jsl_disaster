document.addEventListener('DOMContentLoaded', function() {
    
    // ========== 기존 기능들 (그대로 유지) ==========
	const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
	    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
    // ニックネーム重複確認
    const btnCheckNickname = document.getElementById('btnCheckNickname');
    if (btnCheckNickname) {
        btnCheckNickname.addEventListener('click', function() {
            const nickname = document.getElementById('nickname').value.trim();
            const msgElement = document.getElementById('nickMsg');
            
            if (!nickname) {
                msgElement.textContent = 'ニックネームを入力してください。';
                msgElement.className = 'hint error';
                return;
            }
            
            fetch(`/member/check-nickname?nickname=${encodeURIComponent(nickname)}`)
                .then(response => response.text())
                .then(result => {
                    if (result === 'exist') {
                        msgElement.textContent = 'すでに使用中のニックネームです。';
                        msgElement.className = 'hint error';
                    } else {
                        msgElement.textContent = '使用可能なニックネームです。';
                        msgElement.className = 'hint success';
                    }
                })
                .catch(error => {
                    msgElement.textContent = '重複確認中にエラーが発生しました。';
                    msgElement.className = 'hint error';
                });
        });
    }
    
	// 認証メール送信
	    const btnSendCode = document.getElementById('btnSendCode');
	    if (btnSendCode) {
	        btnSendCode.addEventListener('click', function() {
	            const email = document.getElementById('email').value.trim();
	            if (!email || !isValidEmail(email)) {
	                alert('正しいメール形式ではありません。');
	                return;
	            }
	            this.disabled = true;
	            this.textContent = '送信中...';
	            
	            fetch('/member/send-verify-email', {
	                method: 'POST',
	                headers: {
	                    'Content-Type': 'application/x-www-form-urlencoded',
	                    // [수정] CSRF 토큰 추가
	                    [csrfHeader]: csrfToken
	                },
	                // [수정] email 정보만 보내도록 수정
	                body: `email=${encodeURIComponent(email)}`
	            })
	            .then(response => response.text())
	            .then(result => {
	                if (result === 'exist') {
	                    alert('すでに使用中のメールアドレスです。');
	                } else if (result === 'success') {
	                    alert('認証メールが送信されました。メールを確認してください。');
	                    const verifyField = document.getElementById('verifyField');
	                    if (verifyField) verifyField.style.display = 'block';
	                } else {
	                    alert('メール送信中にエラーが発生しました。');
	                }
	            })
	            .catch(error => alert('メール送信リクエスト中にエラーが発生しました。'))
	            .finally(() => {
	                this.disabled = false;
	                this.textContent = '認証メール送信';
	            });
	        });
	    }
    
    // 認証コード確認
    const btnVerifyCode = document.getElementById('btnVerifyCode');
    if (btnVerifyCode) {
        btnVerifyCode.addEventListener('click', function() {
            const email = document.getElementById('email').value.trim();
            const verifyCode = document.getElementById('verifyCode').value.trim();
            const msgElement = document.getElementById('verifyMsg');
            
            if (!verifyCode) {
                msgElement.textContent = '認証コードを入力してください。';
                msgElement.className = 'hint error';
                return;
            }
            
            fetch('/member/verify-email-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
					[csrfHeader]: csrfToken
                },
                body: `email=${encodeURIComponent(email)}&verifyCode=${encodeURIComponent(verifyCode)}`
            })
            .then(response => response.text())
            .then(result => {
                if (result === 'success') {
                    msgElement.textContent = 'メール認証が完了しました。';
                    msgElement.className = 'hint success';
                    document.getElementById('email').readOnly = true;
                    document.getElementById('btnSendCode').disabled = true;
                    this.disabled = true;
                } else {
                    msgElement.textContent = '認証コードが正しくないか、有効期限が切れています。';
                    msgElement.className = 'hint error';
                }
            })
            .catch(error => {
                msgElement.textContent = '認証確認中にエラーが発生しました。';
                msgElement.className = 'hint error';
            });
        });
    }
    
    // パスワード確認
    const password2 = document.getElementById('password2');
    if (password2) {
        password2.addEventListener('input', function() {
            const password = document.getElementById('password').value;
            const password2 = this.value;
            const msgElement = document.getElementById('pwMatchMsg');
            
            if (password2 && password !== password2) {
                msgElement.textContent = 'パスワードが一致しません。';
                msgElement.className = 'hint error';
            } else if (password2 && password === password2) {
                msgElement.textContent = 'パスワードが一致します。';
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
                alert('郵便番号を7桁の数字で入力してください (例: 1234567)');
                return;
            }

            this.disabled = true;
            this.textContent = '検索中...';

            try {
                // zipcloud API 호출
                const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
                const data = await response.json();

                if (data.status === 200 && data.results && data.results.length > 0) {
                    const result = data.results[0];
                    displayBasicAddress(result);
                    showAddressFields();
                } else {
                    alert('該当する郵便番号が見つかりません');
                }
            } catch (error) {
                console.error('郵便番号検索エラー:', error);
                alert('検索中にエラーが発生しました');
            } finally {
                this.disabled = false;
                this.textContent = '住所検索';
            }
        });
    }

    // 2단계: 기본 주소 정보 표시
    function displayBasicAddress(addressData) {
        // 화면에 표시 (읽기 전용 필드)
        document.getElementById('prefecture').value = addressData.address1;
        document.getElementById('city').value = addressData.address2;
        document.getElementById('town').value = addressData.address3 || '';

        // 숨겨진 필드에 저장 (서버로 전송용)
        document.getElementById('prefCode').value = addressData.prefcode;
        document.getElementById('addrLine1').value = addressData.address3 || '';
        
        // 시구정촌 코드 찾기
        const muniCode = findMunicipalityCode(addressData.address1, addressData.address2);
        document.getElementById('muniCode').value = muniCode;
    }

    // cities.js에서 시구정촌 코드 찾기
    function findMunicipalityCode(pref, city) {
        console.log('検索中:', pref, city);
        
        if (!window.cities) {
            console.warn('cities.jsが読み込まれていません');
            return '';
        }
        
        // 1. 도도부현명 변환 (zipcloud는 "大阪市", cities.js는 "大阪府")
        let targetPref = pref;
        if (pref === "大阪市" || city.includes("大阪市")) {
            targetPref = "大阪府";
        }
        
        // 2. 정확 매칭 시도
        let found = window.cities.find(item => 
            item.pref === targetPref && item.city === city
        );
        
        if (found) {
            console.log('正確一致:', found);
            return found.code;
        }
        
        // 3. 시 단위로 매칭 (구 부분 제거)
        let cityBase = city;
        if (city.includes("市")) {
            // "大阪市東淀川区" → "大阪市"
            cityBase = city.substring(0, city.indexOf("市") + 1);
        }
        
        found = window.cities.find(item => 
            item.pref === targetPref && item.city === cityBase
        );
        
        if (found) {
            console.log('市単位一致:', found);
            return found.code;
        }
        
        console.warn('一致失敗:', targetPref, city);
        return '';
    }

    // 주소 필드들 표시
    function showAddressFields() {
        document.getElementById('addressAutoFields').style.display = 'block';
        document.getElementById('detailAddressField').style.display = 'block';
    }

    // 3단계: 상세 주소로 정확한 위치 확인
    const btnGetLocation = document.getElementById('btnGetLocation');
    if (btnGetLocation) {
        btnGetLocation.addEventListener('click', async function() {
            const prefecture = document.getElementById('prefecture').value;
            const city = document.getElementById('city').value;
            const town = document.getElementById('town').value;
            const detail = document.getElementById('addrLine2').value.trim();

            if (!detail) {
                alert('詳細住所を入力してください');
                return;
            }

            const fullAddress = `${prefecture}${city}${town}${detail}`;

            this.disabled = true;
            this.textContent = '位置確認中...';

            try {
                // Google Geocoding API 호출
                const coords = await geocodeAddress(fullAddress);
                
                if (coords) {
                    // 최종 데이터 저장 (숨겨진 필드)
                    document.getElementById('lat').value = coords.lat;
                    document.getElementById('lon').value = coords.lng;

                    // 지도 표시
                    initSignupMap(coords.lat, coords.lng);
                    document.getElementById('mapField').style.display = 'block';
                    
                    // 좌표 정보 표시
                    document.getElementById('coordinateInfo').textContent = 
                        `緯度: ${coords.lat.toFixed(6)}, 経度: ${coords.lng.toFixed(6)}`;
                } else {
                    alert('正確な位置が見つかりません。住所を確認してください');
                }
            } catch (error) {
                console.error('位置検索エラー:', error);
                alert('位置検索中にエラーが発生しました');
            } finally {
                this.disabled = false;
                this.textContent = '位置確認';
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

    // 4단계: 지도 초기화 (함수명 변경: initMap → initSignupMap)
    function initSignupMap(lat, lng) {
        if (!window.google || !window.google.maps) {
            console.warn('Google Maps API not loaded');
            return;
        }

        const mapElement = document.getElementById('map');
        map = new google.maps.Map(mapElement, {
            center: { lat: lat, lng: lng },
            zoom: 17,
            mapTypeId: 'roadmap'
        });

        marker = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map,
            draggable: true,
            title: 'クリックして位置を修正できます'
        });

        // 마커 드래그로 위치 수정
        marker.addListener('dragend', function() {
            const position = marker.getPosition();
            const newLat = position.lat();
            const newLng = position.lng();
            
            document.getElementById('lat').value = newLat;
            document.getElementById('lon').value = newLng;
            document.getElementById('coordinateInfo').textContent = 
                `緯度: ${newLat.toFixed(6)}, 経度: ${newLng.toFixed(6)}`;
        });

        // 지도 클릭으로 위치 수정
        map.addListener('click', function(e) {
            marker.setPosition(e.latLng);
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            
            document.getElementById('lat').value = newLat;
            document.getElementById('lon').value = newLng;
            document.getElementById('coordinateInfo').textContent = 
                `緯度: ${newLat.toFixed(6)}, 経度: ${newLng.toFixed(6)}`;
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
                alert('メール認証を完了してください。');
                return false;
            }
            
            // 비밀번호 확인
            const password = document.getElementById('password').value;
            const password2 = document.getElementById('password2').value;
            if (password !== password2) {
                e.preventDefault();
                alert('パスワードが一致しません。');
                return false;
            }

            // === 일본 주소 데이터 검증 (추가된 부분) ===
            const postalCode = document.getElementById('postalCode').value;
            const prefCode = document.getElementById('prefCode').value;
            const muniCode = document.getElementById('muniCode').value;
            const addrLine2 = document.getElementById('addrLine2').value;

            if (!postalCode || !prefCode || !muniCode || !addrLine2) {
                e.preventDefault();
                alert('住所情報をすべて入力してください。');
                return false;
            }

            // 우편번호 형식 검사
            if (!/^\d{7}$/.test(postalCode)) {
                e.preventDefault();
                alert('郵便番号を正しい形式で入力してください。');
                return false;
            }
            
            // 필수 약관 확인
            const agreeTerms = document.getElementById('agreeTerms');
            const agreePrivacy = document.getElementById('agreePrivacy');
            if (!agreeTerms.checked || !agreePrivacy.checked) {
                e.preventDefault();
                alert('必須約款に同意してください。');
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

// Google Maps API 콜백 함수 (전역으로 선언) - 함수명 변경
function initSignupMapCallback() {
    // Google Maps API 로드 완료
    console.log('Google Maps API loaded for signup');
}