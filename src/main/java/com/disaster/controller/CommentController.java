package com.disaster.controller;

import com.disaster.domain.CommentDTO;
import com.disaster.domain.CustomUserDetails; // ✅ CustomUserDetails 임포트
import com.disaster.service.CommentService;
import lombok.RequiredArgsConstructor; // ✅ RequiredArgsConstructor 임포트

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication; // ✅ Authentication 임포트
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor // ✅ final 필드에 대한 생성자 자동 주입
@RequestMapping("/comment")
public class CommentController {

    private final CommentService commentService;

    /** ✅ 댓글/대댓글 등록 (로그인 사용자 연동) */
    @PostMapping("/add")
    public String addComment(@RequestParam("postId") Long postId,
                             CommentDTO comment, // body, parentId는 자동으로 바인딩됩니다.
                             Authentication authentication) {

        // 1. 현재 로그인한 사용자 정보 가져오기
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        // 2. DTO에 недостающая 정보(postId, memberId, nickname) 설정
        comment.setPostId(postId);
        comment.setMemberId(userDetails.getMemberId());
        comment.setNickname(userDetails.getNickname());
        
        // 3. 서비스 호출하여 댓글 저장
        commentService.addComment(comment);

        // 4. 원래 게시글 상세 페이지로 리다이렉트
        return "redirect:/community/" + postId;
    }

    /** ✅ 댓글 삭제 */
    @PostMapping("/delete/{commentId}")
    public String deleteComment(@PathVariable("commentId") Long commentId, 
                                @RequestParam("postId") Long postId,
                                Authentication authentication,
                                RedirectAttributes redirectAttributes) {

        try {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long currentMemberId = userDetails.getMemberId();
            
            commentService.deleteComment(commentId, currentMemberId);
            redirectAttributes.addFlashAttribute("message", "댓글이 삭제되었습니다.");

        } catch (AccessDeniedException e) {
            redirectAttributes.addFlashAttribute("error", "댓글을 삭제할 권한이 없습니다.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "댓글 삭제 중 오류가 발생했습니다.");
        }
        
        return "redirect:/community/" + postId;
    }

    /** ✅ 댓글 신고 */
    @PostMapping("/report/{commentId}")
    public String reportComment(@PathVariable("commentId") Long commentId,
                                @RequestParam("postId") Long postId) {
        commentService.reportComment(commentId);
        return "redirect:/community/communityDetail/" + postId;
    }
}