package com.disaster.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.disaster.domain.CommentDTO;
import com.disaster.domain.CommunityDTO;
import com.disaster.mapper.CommunityMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommunityService {
	
	private final CommunityMapper communityMapper;
	
	//전체 게시글 수
	@Transactional(readOnly = true)
	public int getTotalPostCount() {
        return communityMapper.getTotalPostCount();
    }
	
	//전체 댓글 수
	@Transactional(readOnly = true)
    public int getTotalCommentCount() {
        return communityMapper.getTotalCommentCount();
    }
	
	//게시글 조회 (신고된 게시글 우선)
	@Transactional(readOnly = true)
    public List<CommunityDTO> findAllPostsWithReportedFirst() {
        return communityMapper.findAllPostsWithReportedFirst();
    }

	
	//신고된 댓글만 조회
    @Transactional(readOnly = true)
    public List<CommentDTO> findReportedComments() {
        return communityMapper.findReportedComments();
    }
	
	//게시글 삭제
    @Transactional
    public void deletePost(Long postId) {
        communityMapper.deletePostById(postId);
    }

	
	//댓글 삭제
    @Transactional
    public void deleteComment(Long commentId) {
        communityMapper.deleteCommentById(commentId);
    }
	
}
