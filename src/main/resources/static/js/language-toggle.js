(() => {
  // ✅ 페이지 로드 시 저장된 언어 불러오기 (없으면 일본어)
  let currentLang = localStorage.getItem('lang') || 'ja';

  // ✅ 언어 적용 함수 (페이지 진입 시 또는 버튼 클릭 시 공통 사용)
  function applyLanguage(lang) {
    const elements = document.querySelectorAll('[data-ko]');
    elements.forEach(el => {
      if (!el.getAttribute('data-ja')) {
        el.setAttribute('data-ja', el.textContent);
      }
      if (lang === 'ko') {
        el.textContent = el.getAttribute('data-ko');
      } else {
        el.textContent = el.getAttribute('data-ja');
      }
    });

    const toggleBtn = document.getElementById('langToggle');
    if (toggleBtn) {
      toggleBtn.textContent = (lang === 'ko') ? '日本語' : '한국어';
    }

    currentLang = lang;
    localStorage.setItem('lang', lang);
  }

  // ✅ 페이지 로드 완료 시 실행
  document.addEventListener('DOMContentLoaded', function() {
    const langToggle = document.getElementById('langToggle');

    // 페이지 첫 로드시 언어 상태 반영
    applyLanguage(currentLang);

    if (langToggle) {
      langToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // 언어 토글
        const newLang = (currentLang === 'ja') ? 'ko' : 'ja';
        applyLanguage(newLang);
      });
    }
  });
})();
