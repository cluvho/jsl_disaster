package com.disaster.service;

import com.disaster.domain.DisasterType;
import com.disaster.domain.WriteDTO;
import com.disaster.mapper.CommentMapper;
import com.disaster.mapper.PostReportMapper;
import com.disaster.mapper.WriteMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WriteService {

    private final WriteMapper writeMapper;
    private final PostReportMapper postReportMapper; 
    private final CommentMapper commentMapper;
    


    public void createPost(WriteDTO dto) {
        writeMapper.insert(dto);
    }

    public List<WriteDTO> getAllPosts() {
        return writeMapper.findAllPosts();
    }

    public List<WriteDTO> getLatestPosts() {
        return writeMapper.selectLatestPost();
    }
    // post_id로 게시글 조회
    @Transactional
    public WriteDTO getPostById(Long postId) {
        // 1. 조회수를 1 증가시키는 UPDATE 쿼리를 먼저 실행
        writeMapper.incrementViewCount(postId);
        // 2. 그 다음, 증가된 정보가 포함된 게시글을 SELECT
        return writeMapper.findById(postId);
    }
    /**
     * 글 삭제 관련 (핵심 수정 부분)
     * 게시글과 관련된 자식 데이터(신고 내역, 댓글)를 먼저 삭제한 후 게시글을 삭제합니다.
     */
    @Transactional
    public void deletePost(Long postId) {
        // 1. 이 게시글에 대한 모든 신고 내역을 삭제
        postReportMapper.deleteReportsByPostId(postId);

        // 2. 이 게시글에 대한 모든 댓글을 삭제합니다.
        // (이 매퍼가 없을 시 대댓글이 달린 글은 삭제안됨 / 자식 데이터)
        commentMapper.deleteCommentsByPostId(postId);

        // 3. 모든 자식 데이터가 정리된 후, 게시글 본체를 삭제
        writeMapper.deletePost(postId);
    }
    // 글 수정 관련
    public void updatePost(WriteDTO dto) {
        writeMapper.updatePost(dto);
    }
    // 기존 getAllPosts는 이제 사용하지 않거나 페이징용으로 수정합
    public List<WriteDTO> getAllPosts(int page, int pageSize) {
    	int offset = (page - 1) * pageSize;
    	return writeMapper.findPostsPaginated(offset, pageSize);
    }
    // 전체 게시글 수를 가져오는 메소드 추가
    public int getPostCount() {
    	return writeMapper.countAllPosts();
    }
    
    
    
    // 다중 조건으로 검색된 게시글 목록을 조회합니다. (페이징 포함)
    // @param searchType 검색 필터 (all, title, nickname, disasterType)
    // @param keyword 검색어
   public List<WriteDTO> searchPosts(String searchType, String keyword, int page, int pageSize) {
       int offset = (page - 1) * pageSize;
       
       // Mapper에 여러 파라미터를 전달하기 위해 Map을 사용합니다.
       Map<String, Object> params = new HashMap<>();
       params.put("searchType", searchType);
       
       // '재난 유형'으로 검색 시, 한글 검색어를 DB에 저장된 영문 ENUM 이름으로 변환합니다.
       if ("disasterType".equals(searchType)) {
           DisasterType type = DisasterType.fromKoreanName(keyword);
           // 일치하는 ENUM이 있으면 그 이름(e.g., "TYPHOON")을, 없으면 절대 매칭되지 않을 값("-")을 전달합니다.
           params.put("keyword", (type != null) ? type.name() : "-");
       } else {
           params.put("keyword", keyword);
       }
       
       params.put("offset", offset);
       params.put("pageSize", pageSize);

       return writeMapper.findSearchedPostsPaginated(params);
   }

   /**
    * 다중 조건으로 검색된 게시글의 총 개수를 조회합니다.
    */
   public int getSearchPostCount(String searchType, String keyword) {
       Map<String, Object> params = new HashMap<>();
       params.put("searchType", searchType);

       // 위 searchPosts 메소드와 동일한 변환 로직을 적용합니다.
       if ("disasterType".equals(searchType)) {
           DisasterType type = DisasterType.fromKoreanName(keyword);
           params.put("keyword", (type != null) ? type.name() : "-");
       } else {
           params.put("keyword", keyword);
       }

       return writeMapper.countSearchedPosts(params);
   }
    
    
}
