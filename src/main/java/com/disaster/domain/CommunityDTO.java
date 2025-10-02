package com.disaster.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CommunityDTO {
	
    private Long postId;
    private Long memberId;
    private Long addressId;
    private String muniCode;
    private String disasterType;
    private String title;
    private String body;
    private BigDecimal lat;
    private BigDecimal lon;
    private String status;
    private Integer viewCount;
    private LocalDateTime createdAt;   // 수정
    private LocalDateTime updatedAt;   // 수정
    private String nickname;
    private String reportReason;
	
	
}
