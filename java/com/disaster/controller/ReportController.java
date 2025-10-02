package com.disaster.controller;

import com.disaster.domain.CommentDTO;
import com.disaster.domain.CommentReportDTO;
import com.disaster.domain.CustomUserDetails;
import com.disaster.domain.PostReportDTO;
import com.disaster.domain.WriteDTO;
import com.disaster.service.CommentService;
import com.disaster.service.PostReportService;
import com.disaster.service.WriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
@RequestMapping("/report")
public class ReportController {

    // ✅ 1. 서비스를 ReportService로 통일하고, CommentService를 추가합니다.
    private final PostReportService reportService;
    private final WriteService writeService;
    private final CommentService commentService;

    /**
     * 게시글 신고 폼을 보여주는 메소드
     */
    @GetMapping("/post/{postId}")
    public String showPostReportForm(@PathVariable("postId") Long postId, Model model) {
        WriteDTO post = writeService.getPostById(postId);

        // ✅ 2. 재사용할 reportForm.html에 필요한 정보를 모델에 담아 전달합니다.
        model.addAttribute("reportTarget", "게시글");
        model.addAttribute("targetContent", post.getTitle());
        model.addAttribute("targetId", postId);
        model.addAttribute("formAction", "/report/post");
        model.addAttribute("reportDto", new PostReportDTO()); // DTO 이름 통일

        return "report/reportForm";
    }

    /**
     * 게시글 신고를 처리하는 메소드
     */
    @PostMapping("/post")
    public String submitPostReport(@ModelAttribute("reportDto") PostReportDTO reportDto,
                                   @RequestParam("targetId") Long postId,
                                   Authentication authentication,
                                   RedirectAttributes redirectAttributes) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        reportDto.setReporterMemberId(userDetails.getMemberId());
        reportDto.setPostId(postId);

        // ✅ 3. 통일된 reportService 사용
        reportService.createPostReport(reportDto);

        redirectAttributes.addFlashAttribute("message", "게시글이 정상적으로 신고되었습니다.");
        return "redirect:/community/communityDetail/" + postId;
    }

    /**
     * 댓글 신고 폼을 보여주는 메소드
     */
    @GetMapping("/comment/{commentId}")
    public String showCommentReportForm(@PathVariable("commentId") Long commentId,
                                        @RequestParam("postId") Long postId,
                                        Model model) {

        CommentDTO comment = commentService.getCommentById(commentId);

        model.addAttribute("reportTarget", "댓글");
        model.addAttribute("targetContent", comment.getBody());
        model.addAttribute("targetId", commentId);
        model.addAttribute("formAction", "/report/comment");
        model.addAttribute("reportDto", new CommentReportDTO()); // DTO 이름 통일
        model.addAttribute("postId", postId); // 신고 후 돌아갈 페이지를 위해 postId도 전달

        return "report/reportForm";
    }

    /**
     * 댓글 신고를 처리하는 메소드
     */
    @PostMapping("/comment")
    public String submitCommentReport(@ModelAttribute("reportDto") CommentReportDTO reportDto,
                                      @RequestParam("targetId") Long commentId,
                                      @RequestParam("postId") Long postId,
                                      Authentication authentication,
                                      RedirectAttributes redirectAttributes) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        reportDto.setReporterMemberId(userDetails.getMemberId());
        reportDto.setCommentId(commentId);

        // ✅ 3. 통일된 reportService 사용
        reportService.createCommentReport(reportDto);

        redirectAttributes.addFlashAttribute("message", "댓글이 정상적으로 신고되었습니다.");
        return "redirect:/community/communityDetail/" + postId;
    }
}

