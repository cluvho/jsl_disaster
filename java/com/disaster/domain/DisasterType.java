package com.disaster.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Objects;

/**
 * 재난 유형을 정의하는 ENUM 클래스.
 * DB에 저장되는 영문명과 화면에 표시되는 한글명을 관리합니다.
 */
@Getter
@RequiredArgsConstructor
public enum DisasterType {
    EARTHQUAKE("지진"),
    TSUNAMI("쓰나미"),
    TYPHOON("태풍"),
    FLOOD("호우/홍수"),
    VOLCANO("화산"),
    FIRE("화재"),
    LANDSLIDE("산사태"),
    OTHER("기타");

    private final String displayName;

    /**
     * 한글 이름으로 해당하는 ENUM 상수를 찾습니다. (검색 기능 등에 사용)
     * @param koreanName "태풍", "지진" 등
     * @return 해당하는 DisasterType ENUM 또는 null
     */
    public static DisasterType fromKoreanName(String koreanName) {
        if (koreanName == null) {
            return null;
        }
        return Arrays.stream(DisasterType.values())
                .filter(type -> Objects.equals(type.getDisplayName(), koreanName.trim()))
                .findFirst()
                .orElse(null);
    }
}