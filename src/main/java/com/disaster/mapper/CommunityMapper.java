package com.disaster.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.disaster.domain.CommentDTO;
import com.disaster.domain.CommunityDTO;

@Mapper
public interface CommunityMapper {
	
	//전체 게시글 수
	int getTotalPostCount();
	
	//전체 댓글 수
	int getTotalCommentCount();
	
	//게시글 조회 (신고된 게시글 우선)
	List<CommunityDTO> findAllPostsWithReportedFirst();
	
	//신고된 댓글만 조회
	List<CommentDTO> findReportedComments();
	
	//게시글 삭제
	void deletePostById(Long postId);
	
	//댓글 삭제
	void deleteCommentById(Long commentId);
	
}
