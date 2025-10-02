package com.disaster.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.disaster.domain.AdminLogDTO;

@Mapper
public interface AdminLogMapper {
	
	void insertLog(AdminLogDTO log);
	
	List<AdminLogDTO> findLogsPaginated(@Param("offset") int offset, @Param("limit") int limit);
	
	int countAllLogs();
	
	void deleteLogsByCommentId(Long commentId);
	
	void deleteLogsByPostId(Long postId);
}
