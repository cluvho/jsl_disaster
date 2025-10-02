package com.disaster.mapper;

import java.util.List;
import java.util.Map; // Map 사용을 위해 추가

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param; // @Param 사용을 위해 추가

import com.disaster.domain.CommentDTO;
import com.disaster.domain.CommunityDTO;

@Mapper
public interface CommunityMapper {
    
    // ========== 기존 메소드들 ==========

    //전체 게시글 수
    int getTotalPostCount();
    
    //전체 댓글 수
    int getTotalCommentCount();
    
    //게시글 조회 (신고된 게시글 우선) - 이 메소드는 관리자용 findAllPostsForAdmin으로 대체될 수 있습니다.
    List<CommunityDTO> findAllPostsWithReportedFirst();
    
    //신고된 댓글만 조회
    List<CommentDTO> findReportedComments();
    
    //마이페이지 - 내가 쓴 글
    List<CommunityDTO> findByMemberId(Long memberId);
    
    //마이페이지 - 내가 댓글 단 글
    List<CommunityDTO> findPostsCommentedByMemberId(Long memberId);

    //게시글 상세 조회
    CommunityDTO findPostById(Long postId);


    // ========== [관리자 기능] 추가된 메소드들 ==========

    // 게시글 관리 (페이징)
    List<CommunityDTO> findPostsForAdmin(Map<String, Object> params);

    // 신고된 댓글 관리 (페이징)
    List<CommentDTO> findReportedCommentsPaginated(@Param("offset") int offset, @Param("pageSize") int pageSize);
    int countReportedComments();

    // 삭제된 게시글 관리 (페이징)
    List<CommunityDTO> findSoftDeletedPostsPaginated(@Param("offset") int offset, @Param("pageSize") int pageSize);
    int countSoftDeletedPosts();

    // 삭제된 댓글 관리 (페이징)
    List<CommentDTO> findSoftDeletedCommentsPaginated(@Param("offset") int offset, @Param("pageSize") int pageSize);
    int countSoftDeletedComments();

    // Soft-delete (상태 변경 방식)
    void softDeletePostById(Long postId);
    void softDeleteCommentById(Long commentId);

    // Hard-delete (DB에서 완전 삭제)
    void hardDeletePostById(Long postId);
    void hardDeleteCommentById(Long commentId);

    /**
     * @deprecated hardDeletePostById 또는 softDeletePostById로 대체되었습니다.
     */
    @Deprecated
    void deletePostById(Long postId);
    
    /**
     * @deprecated hardDeleteCommentById 또는 softDeleteCommentById로 대체되었습니다.
     */
    @Deprecated
    void deleteCommentById(Long commentId);
}