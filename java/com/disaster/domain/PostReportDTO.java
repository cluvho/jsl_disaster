package com.disaster.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PostReportDTO {
    private Long reportId;
    private Long postId;
    private Long reporterMemberId;
    private String reason;
    private String details;
    private String status;
    private Long adminId;         // ✅ reviewedByMemberId -> adminId (XML과 일치)
    private LocalDateTime updatedAt; // ✅ reviewedAt -> updatedAt (XML과 일치)
    private LocalDateTime createdAt;
	
    
}