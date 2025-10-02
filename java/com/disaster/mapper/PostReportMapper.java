package com.disaster.mapper;

import com.disaster.domain.PostReportDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PostReportMapper {

    /** 신고 등록 */
    void insertReport(PostReportDTO report);

    /** 특정 게시글의 모든 신고 내역 조회 */
    List<PostReportDTO> findReportsByPostId(Long postId);

    /** 신고 상태 업데이트 */
    void updateReportStatus(PostReportDTO report);
    
    /** 글 삭제 시 신고내역 같이 삭제 */
    void deleteReportsByPostId(@Param("postId") Long postId);
}