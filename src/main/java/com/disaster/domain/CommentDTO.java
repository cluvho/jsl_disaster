package com.disaster.domain;

import lombok.Data;
import java.sql.Timestamp;

@Data
public class CommentDTO {

    private Long commentId;
    private Long postId;
    private Long memberId;
    private String body;
    private String status;
    private Timestamp createdAt;
    private String nickname;
    private String title;
}