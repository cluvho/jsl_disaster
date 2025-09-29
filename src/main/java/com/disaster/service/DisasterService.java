package com.disaster.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.disaster.domain.DisasterEventLive;
import com.disaster.domain.DisasterHistory;
import com.disaster.mapper.DisasterMapper;

@Service
public class DisasterService {
    
    @Autowired
    private DisasterMapper disasterMapper;
    
    /**
     * JMA 데이터 처리 메인 메서드
     */
    public void processJMAData(Map<String, Object> jmaData) {
        System.out.println("=== JMA 데이터 DB 저장 시작 ===");
        System.out.println("받은 JMA 데이터 구조: " + jmaData.keySet());
        
        try {
            // 지진 데이터 처리
            List<Map<String, Object>> earthquakes = 
                (List<Map<String, Object>>) jmaData.get("earthquakes");
            
            System.out.println("지진 데이터 확인: " + (earthquakes != null ? earthquakes.size() + "개" : "null"));
            
            if (earthquakes != null && !earthquakes.isEmpty()) {
                System.out.println("지진 데이터 처리 시작");
                processEarthquakeData(earthquakes);
            } else {
                System.out.println("지진 데이터가 없거나 비어있음");
            }
            
            // 화산 데이터 처리
            List<Map<String, Object>> volcanoes = 
                (List<Map<String, Object>>) jmaData.get("volcanoes");
            
            System.out.println("화산 데이터 확인: " + (volcanoes != null ? volcanoes.size() + "개" : "null"));
            
            if (volcanoes != null && !volcanoes.isEmpty()) {
                System.out.println("화산 데이터 처리 시작");
                processVolcanoData(volcanoes);
            } else {
                System.out.println("화산 데이터가 없거나 비어있음");
            }
            
            // 오래된 재난 정보 정리
            disasterMapper.deactivateOldDisasters();
            
            System.out.println("=== JMA 데이터 DB 저장 완료 ===");
            
        } catch (Exception e) {
            System.err.println("JMA 데이터 처리 중 오류: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 지진 데이터 처리
     */
    private void processEarthquakeData(List<Map<String, Object>> earthquakes) {
        System.out.println("지진 데이터 처리 시작 - 총 " + earthquakes.size() + "개");
        
        for (Map<String, Object> eq : earthquakes) {
            try {
                System.out.println("지진 데이터 내용: " + eq);
                
                String magnitudeStr = eq.get("magnitude").toString();
                double magnitude = Double.parseDouble(magnitudeStr);
                
                System.out.println("파싱된 규모: " + magnitude + ", 위치: " + eq.get("location"));
                
                // 현재 재난으로 저장 (규모 3.0 이상)
                if (magnitude >= 0) {
                    System.out.println("현재 재난 저장 조건 만족 - 규모: " + magnitude);
                    saveCurrentEarthquake(eq, magnitude);
                } else {
                    System.out.println("현재 재난 저장 조건 미만족 - 규모: " + magnitude + " < 3.0");
                }
                
                // 과거 이력 저장 (규모 4.0 이상)  
                if (magnitude >= 0) {
                    System.out.println("이력 저장 조건 만족 - 규모: " + magnitude);
                    saveEarthquakeHistory(eq, magnitude);
                } else {
                    System.out.println("이력 저장 조건 미만족 - 규모: " + magnitude + " < 4.0");
                }
                
            } catch (Exception e) {
                System.err.println("지진 데이터 처리 오류: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
    
    /**
     * 화산 데이터 처리
     */
    private void processVolcanoData(List<Map<String, Object>> volcanoes) {
        for (Map<String, Object> vol : volcanoes) {
            try {
                int alertLevel = Integer.parseInt(vol.get("alertLevel").toString());
                
                // 현재 재난으로 저장 (경보 레벨 2 이상)
                if (alertLevel >= 2) {
                    saveCurrentVolcano(vol, alertLevel);
                }
                
                // 과거 이력 저장 (경보 레벨 3 이상)
                if (alertLevel >= 3) {
                    saveVolcanoHistory(vol, alertLevel);
                }
                
            } catch (Exception e) {
                System.err.println("화산 데이터 처리 오류: " + e.getMessage());
            }
        }
    }
    
    /**
     * 현재 지진 재난 저장
     */
    private void saveCurrentEarthquake(Map<String, Object> eq, double magnitude) {
        DisasterEventLive disaster = new DisasterEventLive();
        disaster.setDisasterType("EARTHQUAKE");
        disaster.setTitle("규모 " + magnitude + " 지진");
        disaster.setLocation(eq.get("location").toString());
        disaster.setMagnitude(magnitude);
        disaster.setDepthKm(eq.get("depth").toString());
        disaster.setStartedAt(parseDateTime(eq.get("time").toString()));
        disaster.setSource(eq.get("source").toString());
        
        // 중복 체크
        DisasterEventLive similar = disasterMapper.findSimilarCurrentDisaster(disaster);
        if (similar == null) {
            disasterMapper.insertCurrentDisaster(disaster);
            System.out.println("현재 지진 재난 저장: " + disaster.getTitle());
        }
    }
    
    /**
     * 지진 이력 저장
     */
    private void saveEarthquakeHistory(Map<String, Object> eq, double magnitude) {
        DisasterHistory history = new DisasterHistory();
        history.setDisasterType("EARTHQUAKE");
        history.setTitle("규모 " + magnitude + " 지진");
        history.setLocation(eq.get("location").toString());
        history.setMagnitude(magnitude);
        history.setDepthKm(eq.get("depth").toString());
        history.setDescription("규모 " + magnitude + "의 지진이 " + eq.get("location") + "에서 발생했습니다.");
        history.setOccurredAt(parseDateTime(eq.get("time").toString()));
        history.setSource(eq.get("source").toString());
        
        // 중복 체크
        if (!disasterMapper.isDuplicateDisaster(history)) {
            disasterMapper.insertDisasterHistory(history);
            System.out.println("지진 이력 저장: " + history.getTitle());
        }
    }
    
    /**
     * 현재 화산 재난 저장
     */
    private void saveCurrentVolcano(Map<String, Object> vol, int alertLevel) {
        DisasterEventLive disaster = new DisasterEventLive();
        disaster.setDisasterType("VOLCANO");
        disaster.setTitle(vol.get("name") + " 화산 경보");
        disaster.setLocation(vol.get("name").toString());
        disaster.setAlertLevel(String.valueOf(alertLevel));
        disaster.setStatus(vol.get("status").toString());
        disaster.setStartedAt(LocalDateTime.now());
        disaster.setSource("JMA");
        
        DisasterEventLive similar = disasterMapper.findSimilarCurrentDisaster(disaster);
        if (similar == null) {
            disasterMapper.insertCurrentDisaster(disaster);
            System.out.println("현재 화산 재난 저장: " + disaster.getTitle());
        }
    }
    
    /**
     * 화산 이력 저장
     */
    private void saveVolcanoHistory(Map<String, Object> vol, int alertLevel) {
        DisasterHistory history = new DisasterHistory();
        history.setDisasterType("VOLCANO");
        history.setTitle(vol.get("name") + " 화산 경보");
        history.setLocation(vol.get("name").toString());
        history.setAlertLevel(String.valueOf(alertLevel));
        history.setDescription(vol.get("name") + " 화산에 경보 레벨 " + alertLevel + " 발령");
        history.setOccurredAt(LocalDateTime.now());
        history.setSource("JMA");
        
        if (!disasterMapper.isDuplicateDisaster(history)) {
            disasterMapper.insertDisasterHistory(history);
            System.out.println("화산 이력 저장: " + history.getTitle());
        }
    }
    
    /**
     * 시간 문자열 파싱
     */
    private LocalDateTime parseDateTime(String timeStr) {
        try {
            // 여러 포맷 시도
            DateTimeFormatter[] formatters = {
                DateTimeFormatter.ofPattern("yyyy. M. d. a h:mm:ss"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss")
            };
            
            for (DateTimeFormatter formatter : formatters) {
                try {
                    return LocalDateTime.parse(timeStr, formatter);
                } catch (DateTimeParseException e) {
                    // 다음 포맷 시도
                }
            }
            
            // 모든 포맷 실패시 현재 시간 반환
            return LocalDateTime.now();
            
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }
    
    /**
     * 현재 재난 목록 조회
     */
    public List<DisasterEventLive> getCurrentDisasters() {
        return disasterMapper.getCurrentDisasters();
    }
    
    /**
     * 과거 재난 이력 조회
     */
    public List<DisasterHistory> getDisasterHistory(int limit) {
        return disasterMapper.getDisasterHistory(limit);
    }
}