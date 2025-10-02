package com.disaster.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentDTO {

    private Long commentId;
    private Long postId;
    private Long memberId;
    private String body;
    private String status;
    private LocalDateTime createdAt;
    private String nickname;
    private String title;
    private String reportReason;
    private Long parentId;
}