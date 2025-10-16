document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll("header nav a");
    const currentPath = window.location.pathname; // 예: /community/communityList

    let bestMatch = null; // 가장 길고 정확하게 일치하는 링크를 찾기 위한 변수

    navLinks.forEach(link => {
        const linkPath = link.getAttribute("href");

        // 모든 링크의 active 클래스를 일단 제거
        link.classList.remove("active");

        // 현재 경로가 링크 경로로 시작하는 경우
        if (linkPath !== '#' && currentPath.startsWith(linkPath)) {
            // 더 길고 정확한 경로를 우선적으로 선택
            // 예: '/' 와 '/community' 둘 다 일치할 때 '/community'를 선택
            if (!bestMatch || linkPath.length > bestMatch.getAttribute("href").length) {
                bestMatch = link;
            }
        }
    });

    // 가장 정확하게 일치하는 링크를 찾았다면 active 클래스 추가
    if (bestMatch) {
        bestMatch.classList.add("active");
    }
});