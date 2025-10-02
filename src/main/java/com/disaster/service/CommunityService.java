package com.disaster.service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.disaster.domain.AdminLogDTO;
import com.disaster.domain.CommentDTO;
import com.disaster.domain.CommunityDTO;
import com.disaster.mapper.AdminLogMapper;
import com.disaster.mapper.CommentMapper;
import com.disaster.mapper.CommunityMapper;
import com.disaster.mapper.PostReportMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityMapper communityMapper;
    private final AdminLogService adminLogService;

    // ✅ 자식 데이터 삭제를 위해 필요한 Mapper
    private final CommentMapper commentMapper;
    private final PostReportMapper postReportMapper;
    private final AdminLogMapper adminLogMapper;

    // ================== 기본 조회 ==================
    @Transactional(readOnly = true)
    public int getTotalPostCount() {
        return communityMapper.getTotalPostCount();
    }

    @Transactional(readOnly = true)
    public int getTotalCommentCount() {
        return communityMapper.getTotalCommentCount();
    }

    // 게시글 조회 (신고된 게시글 우선)
    @Transactional(readOnly = true)
    public List<CommunityDTO> findAllPostsWithReportedFirst() {
        return communityMapper.findAllPostsWithReportedFirst();
    }

    // 특정 게시글 조회
    @Transactional(readOnly = true)
    public CommunityDTO findPostById(Long postId) {
        // 조회수 증가 로직 추가 가능
        return communityMapper.findPostById(postId);
    }

    // ================== 마이페이지 ==================
    @Transactional(readOnly = true)
    public List<CommunityDTO> getPostsByMemberId(Long memberId) {
        List<CommunityDTO> posts = communityMapper.findByMemberId(memberId);
        return posts != null ? posts : Collections.emptyList();
    }

    @Transactional(readOnly = true)
    public List<CommunityDTO> getPostsCommentedByMember(Long memberId) {
        List<CommunityDTO> posts = communityMapper.findPostsCommentedByMemberId(memberId);
        return posts != null ? posts : Collections.emptyList();
    }

    // ================== 관리자용 조회 ==================
    @Transactional(readOnly = true)
    public List<CommunityDTO> findPostsForAdmin(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        Map<String, Object> params = new HashMap<>();
        params.put("offset", offset);
        params.put("pageSize", pageSize);
        return communityMapper.findPostsForAdmin(params);
    }

    // 신고된 댓글 조회 (페이징 O)
    @Transactional(readOnly = true)
    public List<CommentDTO> getReportedComments(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        return communityMapper.findReportedCommentsPaginated(offset, pageSize);
    }

    // 신고된 댓글 전체 수
    @Transactional(readOnly = true)
    public int getReportedCommentCount() {
        return communityMapper.countReportedComments();
    }

    // ================== 삭제 (소프트) ==================
    @Transactional
    public void softDeletePost(Long postId, Long adminId, String reason) {
        communityMapper.softDeletePostById(postId);
        AdminLogDTO log = new AdminLogDTO();
        log.setAdminMemberId(adminId);
        log.setTargetPostId(postId);
        log.setAction("HIDE_POST");
        log.setNote(reason);
        adminLogService.recordLog(log);
    }

    @Transactional
    public void softDeleteComment(Long commentId, Long adminId, String reason) {
        communityMapper.softDeleteCommentById(commentId);
        AdminLogDTO log = new AdminLogDTO();
        log.setAdminMemberId(adminId);
        log.setTargetCommentId(commentId);
        log.setAction("HIDE_COMMENT");
        log.setNote(reason);
        adminLogService.recordLog(log);
    }

    // 소프트 삭제된 데이터 조회
    @Transactional(readOnly = true)
    public List<CommunityDTO> getSoftDeletedPosts(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        return communityMapper.findSoftDeletedPostsPaginated(offset, pageSize);
    }

    @Transactional(readOnly = true)
    public int getSoftDeletedPostCount() {
        return communityMapper.countSoftDeletedPosts();
    }

    @Transactional(readOnly = true)
    public List<CommentDTO> getSoftDeletedComments(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        return communityMapper.findSoftDeletedCommentsPaginated(offset, pageSize);
    }

    @Transactional(readOnly = true)
    public int getSoftDeletedCommentCount() {
        return communityMapper.countSoftDeletedComments();
    }

    // ================== 삭제 (하드) ==================
    @Transactional
    public void hardDeletePostById(Long postId) {
        // 1. 댓글 삭제
        commentMapper.deleteCommentsByPostId(postId);
        // 2. 신고 기록 삭제
        postReportMapper.deleteReportsByPostId(postId);
        // 3. 관리자 로그 삭제
        adminLogMapper.deleteLogsByPostId(postId);
        // 4. 게시글 삭제
        communityMapper.hardDeletePostById(postId);
    }

    @Transactional
    public void hardDeleteCommentById(Long commentId) {
        // 1. (필요 시) 신고 기록 삭제 → commentReportMapper 필요
        // 2. 관리자 로그 삭제
        adminLogMapper.deleteLogsByCommentId(commentId);
        // 3. 댓글 삭제
        communityMapper.hardDeleteCommentById(commentId);
    }

    // ================== 즉시 삭제 (단순) ==================
    @Transactional
    public void deletePost(Long postId) {
        communityMapper.deletePostById(postId);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        communityMapper.deleteCommentById(commentId);
    }
}