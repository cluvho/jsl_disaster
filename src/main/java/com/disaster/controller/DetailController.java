package com.disaster.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.disaster.domain.DisasterEventLive;
import com.disaster.domain.DisasterHistory;
import com.disaster.domain.MemberAddressDTO;
import com.disaster.domain.MemberDTO;
import com.disaster.mapper.MemberMapper;
import com.disaster.service.DisasterService;

@Controller
@RequestMapping("/detail")
public class DetailController {

    // 실시간 데이터를 메모리에 저장 (화면 표시용)
    private Map<String, Object> latestJMAData = new HashMap<>();
    
    // 서비스 및 매퍼 주입
    @Autowired
    private DisasterService disasterService;
    
    @Autowired
    private MemberMapper memberMapper;

    // 상세 정보 페이지 - 로그인 사용자 위치 기반으로 표시
    @GetMapping
    public String detail(Authentication authentication, Model model) {
        if (authentication != null && authentication.isAuthenticated()) {
            try {
                // Spring Security에서 로그인한 사용자 이메일 가져오기
                String userEmail = authentication.getName();
                System.out.println("로그인한 사용자: " + userEmail);
                
                // 사용자 정보 조회
                MemberDTO member = memberMapper.findByEmail(userEmail);
                
                if (member != null) {
                    System.out.println("회원 정보 조회 성공: " + member.getNickname());
                    
                    // 사용자 주소 정보 조회
                    MemberAddressDTO address = memberMapper.findAddressByMemberId(member.getMemberId());
                    
                    if (address != null && address.getLat() != null && address.getLon() != null) {
                        // 사용자 좌표가 있으면 사용
                        String fullAddress = (address.getAddrLine1() != null ? address.getAddrLine1() : "") + 
                                           " " + (address.getAddrLine2() != null ? address.getAddrLine2() : "");
                        
                        model.addAttribute("userAddress", fullAddress.trim());
                        model.addAttribute("userLatitude", address.getLat());
                        model.addAttribute("userLongitude", address.getLon());
                        
                        System.out.println("사용자 위치 설정: " + fullAddress + " (" + address.getLat() + ", " + address.getLon() + ")");
                    } else {
                        System.out.println("사용자 주소 정보가 없음, 기본값 사용");
                        setDefaultLocation(model);
                    }
                } else {
                    System.out.println("회원 정보 조회 실패, 기본값 사용");
                    setDefaultLocation(model);
                }
                
            } catch (Exception e) {
                System.err.println("사용자 정보 조회 중 오류: " + e.getMessage());
                e.printStackTrace();
                setDefaultLocation(model);
            }
        } else {
            System.out.println("비로그인 사용자, 기본값 사용");
            setDefaultLocation(model);
        }
        
        return "detail/detail";
    }
    
    // 기본 위치 설정 (도쿄)
    private void setDefaultLocation(Model model) {
        model.addAttribute("userAddress", "東京");
        model.addAttribute("userLatitude", 35.6895);
        model.addAttribute("userLongitude", 139.6917);
    }

    // JMA 실시간 데이터 업데이트 + DB 저장
    @PostMapping("/jma-data")
    @ResponseBody
    public ResponseEntity<String> receiveJMAData(@RequestBody Map<String, Object> jmaData) {
        try {
            // 실시간 데이터 업데이트 (기존 기능 유지)
            this.latestJMAData = jmaData;

            System.out.println("=== 실시간 JMA 데이터 업데이트 ===");
            System.out.println("업데이트 시간: " + jmaData.get("lastUpdated"));

            // 지진 데이터 개수만 출력
            if (jmaData.get("earthquakes") != null) {
                int earthquakeCount = ((java.util.List<?>) jmaData.get("earthquakes")).size();
                System.out.println("현재 지진 데이터: " + earthquakeCount + "개");
            }

            // 화산 데이터 개수만 출력
            if (jmaData.get("volcanoes") != null) {
                int volcanoCount = ((java.util.List<?>) jmaData.get("volcanoes")).size();
                System.out.println("현재 화산 데이터: " + volcanoCount + "개");
            }

            // 새로운 기능: DB에 저장
            disasterService.processJMAData(jmaData);
            System.out.println("DB 저장 완료");

            return ResponseEntity.ok("실시간 데이터 업데이트 및 DB 저장 완료");

        } catch (Exception e) {
            System.err.println("데이터 처리 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("데이터 처리 실패");
        }
    }

    // 현재 실시간 데이터 조회 API (기존 기능 유지)
    @GetMapping("/current-data")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getCurrentData() {
        if (latestJMAData.isEmpty()) {
            Map<String, Object> emptyData = new HashMap<>();
            emptyData.put("message", "아직 데이터가 없습니다");
            return ResponseEntity.ok(emptyData);
        }

        return ResponseEntity.ok(latestJMAData);
    }
    
    // 새로운 API: 현재 재난 목록 조회 (DB에서)
    @GetMapping("/current-disasters")
    @ResponseBody
    public ResponseEntity<List<DisasterEventLive>> getCurrentDisasters() {
        try {
            List<DisasterEventLive> disasters = disasterService.getCurrentDisasters();
            System.out.println("DB에서 현재 재난 " + disasters.size() + "개 조회");
            return ResponseEntity.ok(disasters);
        } catch (Exception e) {
            System.err.println("현재 재난 조회 오류: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }
    
    // 새로운 API: 과거 재난 이력 조회 (DB에서)
    @GetMapping("/disaster-history")
    @ResponseBody
    public ResponseEntity<List<DisasterHistory>> getDisasterHistory() {
        try {
            List<DisasterHistory> history = disasterService.getDisasterHistory(20);
            System.out.println("DB에서 과거 재난 이력 " + history.size() + "개 조회");
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            System.err.println("재난 이력 조회 오류: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }
    
    // 새로운 API: JMA 데이터와 DB 데이터 통합 조회
    @GetMapping("/all-disaster-data")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getAllDisasterData() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 실시간 JMA 데이터
            result.put("realtimeJMA", latestJMAData);
            
            // DB에서 현재 재난
            List<DisasterEventLive> currentDisasters = disasterService.getCurrentDisasters();
            result.put("currentDisasters", currentDisasters);
            
            // DB에서 과거 이력
            List<DisasterHistory> history = disasterService.getDisasterHistory(10);
            result.put("disasterHistory", history);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("통합 데이터 조회 오류: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }
    
    // 새로운 API: 로그인 사용자 위치 정보 조회
    @GetMapping("/user-location")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUserLocation(Authentication authentication) {
        Map<String, Object> result = new HashMap<>();
        
        if (authentication != null && authentication.isAuthenticated()) {
            try {
                String userEmail = authentication.getName();
                MemberDTO member = memberMapper.findByEmail(userEmail);
                
                if (member != null) {
                    MemberAddressDTO address = memberMapper.findAddressByMemberId(member.getMemberId());
                    
                    if (address != null && address.getLat() != null && address.getLon() != null) {
                        String fullAddress = (address.getAddrLine1() != null ? address.getAddrLine1() : "") + 
                                           " " + (address.getAddrLine2() != null ? address.getAddrLine2() : "");
                        
                        result.put("address", fullAddress.trim());
                        result.put("latitude", address.getLat());
                        result.put("longitude", address.getLon());
                        result.put("status", "user_location");
                        
                        return ResponseEntity.ok(result);
                    }
                }
            } catch (Exception e) {
                System.err.println("사용자 위치 조회 오류: " + e.getMessage());
            }
        }
        
        // 기본값 반환
        result.put("address", "東京");
        result.put("latitude", 35.6895);
        result.put("longitude", 139.6917);
        result.put("status", "default_location");
        
        return ResponseEntity.ok(result);
    }
}