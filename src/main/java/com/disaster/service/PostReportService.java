package com.disaster.service;

import com.disaster.domain.CommentReportDTO;
import com.disaster.domain.PostReportDTO;
import com.disaster.mapper.CommentReportMapper;
import com.disaster.mapper.PostReportMapper; // ✅ Mapper 변경
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostReportService {

    private final PostReportMapper postReportMapper; // ✅ Mapper 변경
    private final CommentReportMapper commentReportMapper;
    
    /** 신고 생성 (기존 메소드 이름 유지) */
    public void createPostReport(PostReportDTO report) {
        postReportMapper.insertReport(report);
    }

    /** ✅ 특정 게시글의 신고 목록 조회 */
    public List<PostReportDTO> getReportsByPostId(Long postId) {
        return postReportMapper.findReportsByPostId(postId);
    }

    /** ✅ 신고 상태 업데이트 */
    public void updateReportStatus(Long reportId, String status, Long adminId) {
        PostReportDTO reportToUpdate = new PostReportDTO();
        reportToUpdate.setReportId(reportId);
        reportToUpdate.setStatus(status);
        reportToUpdate.setAdminId(adminId);
        reportToUpdate.setUpdatedAt(LocalDateTime.now()); // 현재 시간으로 업데이트 시각 설정

        postReportMapper.updateReportStatus(reportToUpdate);
    }
    
    /** ✅ 댓글 신고 생성 */
    public void createCommentReport(CommentReportDTO reportDto) {
        commentReportMapper.insert(reportDto);
    }
}