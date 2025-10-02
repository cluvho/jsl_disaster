package com.disaster.mapper;

import com.disaster.domain.CommentDTO;
import com.disaster.domain.CommunityDTO;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommentMapper {
	CommunityDTO findPostById(Long postId);
	// [마이페이지용] 내가 쓴 글 목록 조회
		List<CommunityDTO> findByMemberId(Long memberId);
		// [마이페이지용] 내가 댓글 단 글 목록 조회
		List<CommunityDTO> findPostsCommentedByMemberId(Long memberId);

    /** 댓글 등록 */
    void insertComment(CommentDTO comment);

    /** 특정 게시글 댓글 전체 조회 */
    List<CommentDTO> findByPostId(@Param("postId") Long postId);
    
    /** ✅ 특정 댓글 단건 조회 (인터페이스에 추가) */
    CommentDTO findById(@Param("commentId") Long commentId);

    /** ✅ 댓글 상태 변경 (소프트 삭제, 신고 등) - XML과 일치시킴 */
    void updateStatus(@Param("commentId") Long commentId, @Param("status") String status);
    
    /** 댓글을 'DELETED' 상태로 업데이트 */
    void updateCommentStatusToDelete(@Param("commentId") Long commentId);

    /** 댓글 ID로 작성자의 member_id를 조회 (권한 확인용) */
    Long findMemberIdByCommentId(@Param("commentId") Long commentId);
    
/** 특정 게시글의 모든 댓글 삭제 */
void deleteCommentsByPostId(@Param("postId") Long postId);
}