package com.disaster.controller; 

import com.disaster.domain.CommentDTO;
import com.disaster.domain.CustomUserDetails;
import com.disaster.domain.MemberAddressDTO;
import com.disaster.domain.WriteDTO;
import com.disaster.service.CommentService;
import com.disaster.service.MemberService;
import com.disaster.service.WriteService;
import lombok.RequiredArgsConstructor;

import org.jsoup.Jsoup;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@RequestMapping("/community")
public class CommunityController {

    private final WriteService writeService;
    private final MemberService memberService;
    private final CommentService commentService;

    
    @GetMapping({"/main", "/communityList"})
    public String communityList(Model model, 
                                @RequestParam(value = "page", defaultValue = "1") int page,
                                @RequestParam(value = "searchType", defaultValue = "all") String searchType,
                                @RequestParam(value = "keyword", required = false) String keyword) {
        
        int pageSize = 5;
        List<WriteDTO> postList;
        int totalPosts;

        if (keyword != null && !keyword.trim().isEmpty()) {
            postList = writeService.searchPosts(searchType, keyword, page, pageSize);
            totalPosts = writeService.getSearchPostCount(searchType, keyword);
            model.addAttribute("keyword", keyword);
            model.addAttribute("searchType", searchType); 
        } else {
            postList = writeService.getAllPosts(page, pageSize);
            totalPosts = writeService.getPostCount();
            model.addAttribute("searchType", "all");
        }
        
        for (WriteDTO post : postList) {
            String plainText = Jsoup.parse(post.getBody()).text();
            String summary = plainText.length() > 100 ? plainText.substring(0, 100) + "..." : plainText;
            post.setSummary(summary);
        }
        
        int totalPages = (int) Math.ceil((double) totalPosts / pageSize);

        model.addAttribute("postList", postList);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", totalPages);
        
        return "community/communityList";
    }

    // ▼▼▼ [수정된 부분 1] URL을 마이페이지 링크와 일치시키고, 변수명을 통일했습니다. ▼▼▼
    // 글 상세 조회
    
    @GetMapping("/{postId}")
    public String communityDetail(@PathVariable("postId") Long postId, Model model) {
        WriteDTO post = writeService.getPostById(postId);
        List<CommentDTO> comments = commentService.getCommentsByPostId(postId);
        model.addAttribute("post", post);
        model.addAttribute("comments", comments);
        
        // return 값을 올바른 철자로 최종 수정합니다.
        return "community/communityDetail";
    }

    // 글쓰기 폼
    @GetMapping("/communityWrite")
    public String writeForm(Model model, Authentication authentication) {
        WriteDTO writeDto = new WriteDTO();

        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            Long memberId = userDetails.getMemberId();
            MemberAddressDTO memberAddress = memberService.findAddressByMemberId(memberId);

            if (memberAddress != null && memberAddress.getLat() != null && memberAddress.getLon() != null) {
                writeDto.setLat(memberAddress.getLat().doubleValue());
                writeDto.setLon(memberAddress.getLon().doubleValue());
            }
        }

        model.addAttribute("writeDto", writeDto);
        return "community/communityWrite";
    }

    // 글쓰기 저장
    @PostMapping("/communityWrite")
    public String submitPost(@ModelAttribute("writeDto") WriteDTO dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            dto.setMemberId(userDetails.getMemberId());
            dto.setNickname(userDetails.getNickname());

            MemberAddressDTO memberAddress = memberService.findAddressByMemberId(userDetails.getMemberId());

            if (memberAddress != null) {
                dto.setAddressId(memberAddress.getAddressId());
                dto.setMuniCode(memberAddress.getMuniCode());
            } else {
                return "redirect:/member/myPage?error=noAddress"; // 주소 없으면 마이페이지로
            }
        }

        writeService.createPost(dto);
        return "redirect:/community/main";
    }

    // 썸머노트 이미지 업로드
    @PostMapping("/uploadSummernoteImage")
    @ResponseBody
    public String uploadSummernoteImage(@RequestParam("file") MultipartFile file) throws IOException {
        String uploadFolder = "C:/upload/disaster/";

        File uploadDir = new File(uploadFolder);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        File saveFile = new File(uploadFolder, fileName);
        file.transferTo(saveFile);

        return "/summer/" + fileName;
    }
    
    // 글 삭제
    @GetMapping("/delete/{postId}")
    public String deletePost(@PathVariable("postId") Long postId) {
        writeService.deletePost(postId);
        return "redirect:/community/main";
    }
    
    // 글 수정 폼
    @GetMapping("/edit/{postId}")
    public String editForm(@PathVariable("postId") Long postId, Model model) {
        WriteDTO post = writeService.getPostById(postId);
        if (post == null) {
            return "redirect:/community/main";
        }
        model.addAttribute("writeDto", post);
        return "community/communityEdit";
    }

    // 글 수정 처리
    @PostMapping("/edit/{postId}")
    public String updatePost(@PathVariable("postId") Long postId,
                             @ModelAttribute("writeDto") WriteDTO dto) {
        dto.setPostId(postId);
        writeService.updatePost(dto);
        return "redirect:/community/" + postId; // 수정 후 상세 페이지로 이동
    }
    

}