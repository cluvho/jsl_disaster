package com.disaster.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentReportDTO {

    private Long reportId;
    private Long commentId;
    private Long reporterMemberId;
    private String reason; // ENUM 타입은 String으로 받습니다.
    private String details;
    private String status;
    private Long reviewedByMemberId;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    
}