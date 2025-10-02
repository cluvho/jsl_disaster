package com.disaster.mapper;

import java.util.List;
import com.disaster.domain.DisasterEventLive;
import com.disaster.domain.DisasterHistory;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DisasterMapper {
    
    // 현재 재난 관련
    void insertCurrentDisaster(DisasterEventLive disaster);
    void updateCurrentDisaster(DisasterEventLive disaster);
    List<DisasterEventLive> getCurrentDisasters();
    void deactivateOldDisasters();
    DisasterEventLive findSimilarCurrentDisaster(DisasterEventLive disaster);
    
    // 과거 재난 이력 관련
    void insertDisasterHistory(DisasterHistory history);
    List<DisasterHistory> getDisasterHistory(int limit);
    boolean isDuplicateDisaster(DisasterHistory history);
}