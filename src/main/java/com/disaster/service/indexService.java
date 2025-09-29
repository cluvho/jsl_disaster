package com.disaster.service;

import java.util.List;
import org.springframework.stereotype.Service;

import com.disaster.domain.MemberAddressDTO;
import com.disaster.domain.MemberDTO;
import com.disaster.mapper.MemberMapper;
import com.disaster.mapper.indexMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class indexService {

    private final indexMapper indexMapper; // MemberMapper 대신 indexMapper 사용

    public MemberDTO getPrimaryAddress(String username) {
        List<MemberDTO> addresses = indexMapper.selectByUseraddreess(username);
        return addresses.isEmpty() ? null : addresses.get(0);
    }
    
}
