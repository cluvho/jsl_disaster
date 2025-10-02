package com.disaster.mapper;

import com.disaster.domain.CommentReportDTO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CommentReportMapper {
    void insert(CommentReportDTO reportDto);
}