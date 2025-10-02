package com.disaster.mapper;

import com.disaster.domain.WriteDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map; // ✅ Map을 사용하기 위해 import 합니다.

@Mapper
public interface WriteMapper {

    void insert(WriteDTO dto);

    WriteDTO findById(@Param("postId") Long postId);

    void updatePost(WriteDTO dto);

    void deletePost(@Param("postId") Long postId);

    void incrementViewCount(@Param("postId") Long postId);

    List<WriteDTO> findAllPosts(); 

    List<WriteDTO> selectLatestPost();
    
    // --- 페이징 및 개수 조회 ---
    List<WriteDTO> findPostsPaginated(@Param("offset") int offset, @Param("limit") int limit); 
    
    int countAllPosts();

    // --- ✅✅✅ 검색 관련 메소드 수정 ✅✅✅ ---
    // 여러 검색 조건을 Map으로 한 번에 받도록 수정합니다.
    
    /**
     * 다중 조건으로 검색된 게시글의 총 개수를 조회합니다.
     * @param params (searchType, keyword)
     * @return 검색된 게시글 수
     */
    int countSearchedPosts(Map<String, Object> params);

	/**
     * 다중 조건으로 검색된 게시글 목록을 조회합니다. (페이징 포함)
     * @param params (searchType, keyword, pageSize, offset)
     * @return 검색된 게시글 목록
     */
    List<WriteDTO> findSearchedPostsPaginated(Map<String, Object> params);
    
    /*
     * 참고: 아래 중복되거나 사용하지 않는 메소드들은 혼란을 줄이기 위해 정리했습니다.
     * selectAll() -> findAllPosts()와 기능 중복
     * update(), delete() -> updatePost(), deletePost()와 기능 중복
     * findAllPostsWithLimit() -> findPostsPaginated()와 기능 중복
     */
}

