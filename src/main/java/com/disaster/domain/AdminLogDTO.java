package com.disaster.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AdminLogDTO {

    // DB 테이블 컬럼과 매칭되는 필드
    private Long logId;
    private Long adminMemberId;
    private Long targetPostId;
    private Long targetCommentId;
    private Long targetReportId;
    private Long targetUserId;
    private String action; // ENUM 타입은 String으로 받는 것이 간단합니다.
    private String note;
    private LocalDateTime createdAt;
    
    // JOIN을 통해 화면에 표시할 추가 정보
    private String adminNickname;
}