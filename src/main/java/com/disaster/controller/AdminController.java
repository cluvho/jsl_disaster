package com.disaster.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.disaster.domain.AdminLogDTO;
import com.disaster.domain.CommentDTO;
import com.disaster.domain.CommunityDTO;
import com.disaster.domain.CustomUserDetails;
import com.disaster.domain.MemberDTO;
import com.disaster.service.AdminLogService;
import com.disaster.service.CommunityService;
import com.disaster.service.MemberService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    
	private final MemberService memberService;
	private final CommunityService communityService;
	private final AdminLogService adminLogService;
	
	// ==================== AJAX Fragment Endpoints ====================

	@GetMapping("/api/posts")
	public String getPostsFragment(Model model, @RequestParam(name = "page", defaultValue = "1") int page) {
	    int pageSize = 10;
	    List<CommunityDTO> postList = communityService.findPostsForAdmin(page, pageSize);
	    int totalPosts = communityService.getTotalPostCount();
	    int totalPages = (int) Math.ceil((double) totalPosts / pageSize);

	    model.addAttribute("postList", postList);
	    model.addAttribute("currentPage", page);
	    model.addAttribute("totalPages", totalPages);

	    return "admin/adminDetail :: #post-table-fragment"; 
	}
	
	@GetMapping("/api/members")
	public String getMembersFragment(Model model, @RequestParam(name = "page", defaultValue = "1") int page) {
	    int pageSize = 10;
	    List<MemberDTO> memberList = memberService.getMemberList(page, pageSize);
	    int totalMembers = memberService.getMemberCount();
	    int totalPages = (int) Math.ceil((double) totalMembers / pageSize);

	    model.addAttribute("memberList", memberList);
	    model.addAttribute("memberCurrentPage", page);
	    model.addAttribute("memberTotalPages", totalPages);

	    return "admin/adminDetail :: #member-table-fragment";
	}

	@GetMapping("/api/logs")
	public String getLogsFragment(Model model, @RequestParam(name = "page", defaultValue = "1") int page) {
	    int pageSize = 10;
	    List<AdminLogDTO> logList = adminLogService.getLogs(page, pageSize);
	    int totalLogs = adminLogService.getLogCount();
	    int totalPages = (int) Math.ceil((double) totalLogs / pageSize);

	    model.addAttribute("logList", logList);
	    model.addAttribute("logCurrentPage", page);
	    model.addAttribute("logTotalPages", totalPages);
	    
	    return "admin/adminDetail :: #log-table-fragment";
	}

	@GetMapping("/api/reported-comments")
	public String getReportedCommentsFragment(Model model, @RequestParam(name = "page", defaultValue = "1") int page) {
	    int pageSize = 10;
	    List<CommentDTO> commentList = communityService.getReportedComments(page, pageSize);
	    int totalComments = communityService.getReportedCommentCount();
	    int totalPages = (int) Math.ceil((double) totalComments / pageSize);

	    model.addAttribute("commentList", commentList);
	    model.addAttribute("commentCurrentPage", page);
	    model.addAttribute("commentTotalPages", totalPages);

	    return "admin/adminDetail :: #reported-comment-table-fragment"; 
	}
	
	@GetMapping("/api/soft-deleted-posts")
	public String getSoftDeletedPostsFragment(Model model, @RequestParam(name = "page", defaultValue = "1") int page) {
	    int pageSize = 10;
	    List<CommunityDTO> deletedPostList = communityService.getSoftDeletedPosts(page, pageSize);
	    int total = communityService.getSoftDeletedPostCount();
	    int totalPages = (int) Math.ceil((double) total / pageSize);

	    model.addAttribute("deletedPostList", deletedPostList);
	    model.addAttribute("deletedPostCurrentPage", page);
	    model.addAttribute("deletedPostTotalPages", totalPages);

	    return "admin/adminDetail :: #soft-deleted-post-table-fragment";
	}

	@GetMapping("/api/soft-deleted-comments")
	public String getSoftDeletedCommentsFragment(Model model, @RequestParam(name = "page", defaultValue = "1") int page) {
	    int pageSize = 10;
	    List<CommentDTO> deletedCommentList = communityService.getSoftDeletedComments(page, pageSize);
	    int total = communityService.getSoftDeletedCommentCount();
	    int totalPages = (int) Math.ceil((double) total / pageSize);

	    model.addAttribute("deletedCommentList", deletedCommentList);
	    model.addAttribute("deletedCommentCurrentPage", page);
	    model.addAttribute("deletedCommentTotalPages", totalPages);

	    return "admin/adminDetail :: #soft-deleted-comment-table-fragment";
	}
	
	// ==================== Main Page Load ====================
	
    @GetMapping("/adminDetail")
    public String admin(Model model) {
    	
    	int pageSize = 10;

        // --- 최초 로딩: 게시글 1페이지 ---
        List<CommunityDTO> postList = communityService.findPostsForAdmin(1, pageSize);
	    int totalPosts = communityService.getTotalPostCount();
	    int totalPages = (int) Math.ceil((double) totalPosts / pageSize);
        model.addAttribute("postList", postList);
	    model.addAttribute("currentPage", 1);
	    model.addAttribute("totalPages", totalPages);
        
        // --- 최초 로딩: 회원 1페이지 ---
        List<MemberDTO> memberList = memberService.getMemberList(1, pageSize);
        int totalMembers = memberService.getMemberCount();
        int memberTotalPages = (int) Math.ceil((double) totalMembers / pageSize);
        model.addAttribute("memberList", memberList);
        model.addAttribute("memberCurrentPage", 1);
        model.addAttribute("memberTotalPages", memberTotalPages);
        
        // --- 최초 로딩: 활동 로그 1페이지 ---
        List<AdminLogDTO> logList = adminLogService.getLogs(1, pageSize);
        int totalLogs = adminLogService.getLogCount();
        int logTotalPages = (int) Math.ceil((double) totalLogs / pageSize);
        model.addAttribute("logList", logList);
        model.addAttribute("logCurrentPage", 1);
        model.addAttribute("logTotalPages", logTotalPages);
		
		// --- 최초 로딩: 신고된 댓글 1페이지 ---
		List<CommentDTO> commentList = communityService.getReportedComments(1, pageSize);
		int totalReportedComments = communityService.getReportedCommentCount();
		int commentTotalPages = (int) Math.ceil((double) totalReportedComments / pageSize);
		model.addAttribute("commentList", commentList);
		model.addAttribute("commentCurrentPage", 1);
		model.addAttribute("commentTotalPages", commentTotalPages);
		
		// --- 최초 로딩: 소프트 삭제된 게시물 1페이지 ---
		List<CommunityDTO> deletedPosts = communityService.getSoftDeletedPosts(1, pageSize);
		int totalDeletedPosts = communityService.getSoftDeletedPostCount();
		int deletedPostTotalPages = (int) Math.ceil((double) totalDeletedPosts / pageSize);
		model.addAttribute("deletedPostList", deletedPosts);
		model.addAttribute("deletedPostCurrentPage", 1);
		model.addAttribute("deletedPostTotalPages", deletedPostTotalPages);

		// --- 최초 로딩: 소프트 삭제된 댓글 1페이지 ---
		List<CommentDTO> deletedComments = communityService.getSoftDeletedComments(1, pageSize);
		int totalDeletedComments = communityService.getSoftDeletedCommentCount();
		int deletedCommentTotalPages = (int) Math.ceil((double) totalDeletedComments / pageSize);
		model.addAttribute("deletedCommentList", deletedComments);
		model.addAttribute("deletedCommentCurrentPage", 1);
		model.addAttribute("deletedCommentTotalPages", deletedCommentTotalPages);

    	// --- 나머지 통계 데이터 조회 ---
		int newMember = memberService.getNewMemberCount();
		model.addAttribute("count",newMember);
		model.addAttribute("total", totalMembers);
		int totalPost = communityService.getTotalPostCount();
		model.addAttribute("post",totalPost);
		int totalComment = communityService.getTotalCommentCount();
		model.addAttribute("comment",totalComment);
		
        return "admin/adminDetail";
    }
    
    // ==================== Action Endpoints ====================
    
    // ✅✅✅ 핵심 수정 부분: 모든 Action 메소드에 Authentication 파라미터 추가 ✅✅✅

    @PostMapping("/deleteMember")
    public String deleteMember(@RequestParam("memberId") Long memberId, Authentication authentication) {
        // 실제 로그인한 관리자 ID를 가져와서 로그를 남기는 로직 추가 필요
        memberService.deleteMember(memberId);
        return "redirect:/admin/adminDetail";
    }
    
    @PostMapping("/soft-delete-post")
    public String deletePost(@RequestParam("postId") Long postId, Authentication authentication) {
        // Spring Security에서 현재 로그인한 관리자 정보 가져오기
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long currentAdminId = userDetails.getMemberId(); // 실제 관리자 ID 사용

        String reason = "관리자에 의한 게시글 숨김 처리";
        communityService.softDeletePost(postId, currentAdminId, reason);
        return "redirect:/admin/adminDetail";
    }
    
    @PostMapping("/soft-delete-comment")
    public String deleteComment(@RequestParam("commentId") Long commentId, Authentication authentication) {
        // Spring Security에서 현재 로그인한 관리자 정보 가져오기
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long currentAdminId = userDetails.getMemberId(); // 실제 관리자 ID 사용

        String reason = "관리자에 의한 댓글 숨김 처리";
        communityService.softDeleteComment(commentId, currentAdminId, reason);
        return "redirect:/admin/adminDetail";
    }
    
    
    @PostMapping("/hard-delete-post")
    public String hardDeletePost(@RequestParam("postId") Long postId, Authentication authentication) {
        // 실제 로그인한 관리자 ID를 가져와서 로그를 남기는 로직 추가 필요
        communityService.hardDeletePostById(postId);
        return "redirect:/admin/adminDetail";
    }
    
    @PostMapping("/hard-delete-comment")
    public String hardDeleteComment(@RequestParam("commentId") Long commentId, Authentication authentication) {
        // 실제 로그인한 관리자 ID를 가져와서 로그를 남기는 로직 추가 필요
        communityService.hardDeleteCommentById(commentId);
        return "redirect:/admin/adminDetail";
    }
}

