package com.disaster.service;

import com.disaster.domain.CommentDTO;
import com.disaster.mapper.CommentMapper;
import lombok.RequiredArgsConstructor; // ✅ 생성자 주입을 위해 변경
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

@Service
@RequiredArgsConstructor // ✅ final 필드에 대한 생성자를 자동으로 만들어줍니다.
public class CommentService {

    private final CommentMapper commentMapper;

    /** 댓글 추가 */
    public void addComment(CommentDTO comment) {
        // ✅ Mapper의 insertComment를 호출 (메소드 이름은 그대로 사용)
        commentMapper.insertComment(comment);
    }

    /** 특정 게시글 댓글 목록 */
    public List<CommentDTO> getCommentsByPostId(Long postId) {
        return commentMapper.findByPostId(postId);
    }
    
    /** ✅ 특정 댓글 조회 기능 추가 */
    public CommentDTO getCommentById(Long commentId) {
        return commentMapper.findById(commentId);
    }

    /** 댓글 삭제 (소프트 삭제) */
    public void deleteComment(Long commentId, Long currentMemberId) {
        Long authorMemberId = commentMapper.findMemberIdByCommentId(commentId);
        
        // 권한 확인: 현재 로그인한 사용자가 댓글 작성자인지 확인
        if (authorMemberId == null || !authorMemberId.equals(currentMemberId)) {
            // 권한이 없으면 예외를 발생시켜 작업을 중단
            throw new AccessDeniedException("댓글을 삭제할 권한이 없습니다.");
        }
        commentMapper.updateStatus(commentId, "DELETED");
    }

    /** 댓글 신고 */
    public void reportComment(Long commentId) {
        // ✅ Mapper의 updateStatus 호출
        commentMapper.updateStatus(commentId, "REPORTED");
    }
}