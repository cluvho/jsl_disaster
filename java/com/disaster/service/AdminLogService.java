package com.disaster.service;

import com.disaster.domain.AdminLogDTO;
import com.disaster.mapper.AdminLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminLogService {

    private final AdminLogMapper adminLogMapper;

    
    public void recordLog(AdminLogDTO log) {
        adminLogMapper.insertLog(log);
    }

    
    public List<AdminLogDTO> getLogs(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        return adminLogMapper.findLogsPaginated(offset, pageSize);
    }
    
    
    public int getLogCount() {
        return adminLogMapper.countAllLogs();
    }
}