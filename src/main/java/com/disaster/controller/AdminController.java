package com.disaster.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.disaster.domain.CommentDTO;
import com.disaster.domain.CommunityDTO;
import com.disaster.domain.MemberDTO;
import com.disaster.service.CommunityService;
import com.disaster.service.MemberService;

import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    
	private final MemberService memberService;
	private final CommunityService communityService;
	
	
    @GetMapping("")
    public String admin(Model model) {
    		//신규 회원 수
    		int newMember = memberService.getNewMemberCount();
    		model.addAttribute("count",newMember);
    		//전체 회원 수
    		int totalMember = memberService.getTotalMemberCount();
    		model.addAttribute("total",totalMember);
    		//전체 회원 정보
    		List<MemberDTO> memberList = memberService.getMemberList();
    		model.addAttribute("memberlist",memberList);
    		//게시글 수
    		int totalPost = communityService.getTotalPostCount();
    		model.addAttribute("post",totalPost);
    		//댓글 수
    		int totalComment = communityService.getTotalCommentCount();
    		model.addAttribute("comment",totalComment);
    		
    		//게시글 조회 (신고된 게시글 우선)
    		List<CommunityDTO> postList = communityService.findAllPostsWithReportedFirst();
    		model.addAttribute("postList", postList);
    		//신고된 댓글 조회 
    		List<CommentDTO> commentList = communityService.findReportedComments();
    		model.addAttribute("commentList", commentList);
        return "admin/adminDetail"; // templates/admin/dashboard.html
    }
    
 // 회원 관리 (삭제) 
    @PostMapping("/deleteMember")
    public String deleteMember(@RequestParam("memberId") Long memberId) {
        memberService.deleteMember(memberId);

        return "redirect:/admin/adminDetail";
    }
    
    
    //게시글 삭제
    @PostMapping("/delete-post")
    public String deletePost(@RequestParam("postId") Long postId) {
        communityService.deletePost(postId);
        return "redirect:/admin/adminDetail";
    }
    
    //댓글 삭제
    @PostMapping("/delete-comment")
    public String deleteComment(@RequestParam("commentId") Long commentId) {
        communityService.deleteComment(commentId);
        return "redirect:/admin/adminDetail";
    }
    
    
    
    
    
    
    
    
    
    
}
