package com.disaster.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.disaster.domain.MemberDTO;

@Mapper
public interface indexMapper {
	
	 @Select("""
		        SELECT a.lat, a.lon, m.email
		        FROM member m
		        JOIN member_address a ON a.member_id = m.member_id
		        WHERE m.email = #{email}
		        ORDER BY a.is_primary DESC, a.created_at DESC
		        LIMIT 1
		    """)
    List<MemberDTO> selectByUseraddreess(@Param("email") String username);
}