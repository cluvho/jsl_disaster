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
    EARTHQUAKE("地震"),
    TSUNAMI("津波"),
    TYPHOON("台風"),
    FLOOD("豪雨・洪水"),
    VOLCANO("火山"),
    FIRE("火事"),
    LANDSLIDE("山崩れ"),
    OTHER("その他");

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