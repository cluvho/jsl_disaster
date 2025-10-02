package com.disaster.domain;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WriteDTO {
	
    private Long postId;  // 게시글 ID
    private Long memberId;  // 작성자 ID
    private Long addressId;  // 주소ID
    private String muniCode;  // 지역코드
    private DisasterType disasterType;  // 재난유형
    private String subImage;  // 리스트 서브이미지
    private String title;  // 제목
    private String body;  // 내용
    private Double lat;  // 위치
    private Double lon;  // 위치
    private LocalDateTime createdAt;  // 작성일
    private String nickname;  // 닉네임
    private int viewCount;  // 조회수
    
    
    private String summary;
}