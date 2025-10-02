package com.disaster.service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.disaster.domain.CustomUserDetails;
import com.disaster.domain.MemberAddressDTO;
import com.disaster.domain.MemberDTO;
import com.disaster.mapper.MemberMapper;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberService implements UserDetailsService {
    
    // SLF4J 로거 추가 (System.out.println 대신 사용)
    private static final Logger log = LoggerFactory.getLogger(MemberService.class);
    
    private final MemberMapper memberMapper;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    
    // ========== Spring Security 로그인 관련 ==========
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        MemberDTO member = memberMapper.findByEmail(username);
        
        // member 객체가 null인 경우, 사용자를 찾을 수 없다는 로그를 남깁니다.
        if (member == null) {
            log.warn("Login attempt for non-existent user: {}", username);
            throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username);
        }

        // 로그를 통해 로그인 시도 중인 사용자와 데이터베이스에서 조회된 역할을 확인할 수 있습니다.
        log.info("Attempting login for user: {}, Role from DB: {}", member.getEmail(), member.getRole());
        
        // 권한 설정: "ROLE_" 접두사를 붙여 Security가 인식할 수 있는 권한으로 만듭니다.
        // 이 로직은 이미 올바르게 작성되어 있습니다.
        // 만약 관리자 로그인이 안된다면, 데이터베이스의 'role' 컬럼 값이 'ADMIN'이 맞는지 확인해야 합니다.
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + member.getRole()));
        
        // CustomUserDetails 반환
        return new CustomUserDetails(
            member.getMemberId(),       // memberId
            member.getEmail(),          // email
            member.getPasswordHash(),   // password
            member.getNickname(),       // nickname
            member.getIsActive(),       // enabled
            authorities                 // authorities
        );
    }
    
    // ========== 회원정보 조회 ==========
    public MemberDTO findByEmail(String email) {
        return memberMapper.findByEmail(email);
    }

    public MemberDTO findById(Long memberId) {
        return memberMapper.findById(memberId);
    }
    
    public MemberAddressDTO findAddressByMemberId(Long memberId) {
        return memberMapper.findAddressByMemberId(memberId);
    }
    
    // ========== 회원가입 관련 ==========
    
    public boolean isEmailExists(String email) {
        return memberMapper.countByEmail(email) > 0;
    }
    
    public boolean isNicknameExists(String nickname) {
        return memberMapper.countByNickname(nickname) > 0;
    }
    
    public void sendVerificationEmail(String email, HttpSession session) {
        String verifyCode = String.format("%06d", new Random().nextInt(1000000));
        
        session.setAttribute("verifyCode", verifyCode);
        session.setAttribute("verifyEmail", email);
        session.setAttribute("verifyTime", System.currentTimeMillis());
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[재난대응시스템] 이메일 인증코드");
        message.setText("인증코드: " + verifyCode + "\n\n5분 내에 입력해주세요.");
        
        mailSender.send(message);
    }
    
    public boolean verifyEmailCode(String email, String inputCode, HttpSession session) {
        String sessionCode = (String) session.getAttribute("verifyCode");
        String sessionEmail = (String) session.getAttribute("verifyEmail");
        Long verifyTime = (Long) session.getAttribute("verifyTime");
        
        if (sessionCode == null || sessionEmail == null || verifyTime == null) {
            return false;
        }
        
        // 5분(300,000 밀리초) 경과 시 만료
        if (System.currentTimeMillis() - verifyTime > 300000) {
            session.removeAttribute("verifyCode");
            session.removeAttribute("verifyEmail");
            session.removeAttribute("verifyTime");
            return false;
        }
        
        if (email.equals(sessionEmail) && inputCode.equals(sessionCode)) {
            session.setAttribute("emailVerified", true);
            return true;
        }
        
        return false;
    }
    
    @Transactional
    public void registerMember(MemberDTO memberDTO, HttpSession session) {
        Boolean emailVerified = (Boolean) session.getAttribute("emailVerified");
        if (emailVerified == null || !emailVerified) {
            throw new RuntimeException("이메일 인증이 완료되지 않았습니다.");
        }
        
        memberDTO.setPasswordHash(passwordEncoder.encode(memberDTO.getPassword()));
        
        // 약관 동의 시간 설정
        LocalDateTime now = LocalDateTime.now();
        if (memberDTO.getAgreeTerms() != null && memberDTO.getAgreeTerms()) {
            memberDTO.setTermsAgreedAt(Timestamp.valueOf(now));
        }
        if (memberDTO.getAgreePrivacy() != null && memberDTO.getAgreePrivacy()) {
            memberDTO.setPrivacyAgreedAt(Timestamp.valueOf(now));
        }
        
        memberDTO.setMarketingConsent(memberDTO.getAgreeMarketing());
        
        memberMapper.insertMember(memberDTO);
        
        if (memberDTO.getPostalCode() != null && !memberDTO.getPostalCode().isEmpty()) {
            MemberAddressDTO addressDTO = new MemberAddressDTO();
            addressDTO.setMemberId(memberDTO.getMemberId());
            addressDTO.setPostalCode(memberDTO.getPostalCode());
            addressDTO.setPrefCode(memberDTO.getPrefCode());
            addressDTO.setMuniCode(memberDTO.getMuniCode());
            addressDTO.setAddrLine1(memberDTO.getAddrLine1());
            addressDTO.setAddrLine2(memberDTO.getAddrLine2());
            addressDTO.setLat(memberDTO.getLat());
            addressDTO.setLon(memberDTO.getLon());
            
            memberMapper.insertMemberAddress(addressDTO);
        }
        // 사용자 초기 환경설정 추가
        memberMapper.insertUserPref(memberDTO.getMemberId());
        
        session.removeAttribute("verifyCode");
        session.removeAttribute("verifyEmail");
        session.removeAttribute("verifyTime");
        session.removeAttribute("emailVerified");
    }
    
    // ========== 비밀번호 재설정 관련 ==========
    
    public void sendPasswordResetEmail(String email) {
        MemberDTO member = memberMapper.findByEmail(email);
        if (member == null) {
            throw new RuntimeException("등록되지 않은 이메일입니다.");
        }
        
        String resetToken = UUID.randomUUID().toString();
        Timestamp expiresAt = new Timestamp(System.currentTimeMillis() + 30 * 60 * 1000); // 30분 후 만료
        
        memberMapper.updateResetToken(email, resetToken, expiresAt);
        
        // TODO: 운영 환경에서는 이 URL을 application.properties나 다른 설정 파일에서 관리해야 합니다.
        String resetLink = "http://localhost:8888/member/reset-password?token=" + resetToken;
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[재난대응시스템] 비밀번호 재설정");
        String emailBody = String.format(
            "비밀번호 재설정을 위해 아래 링크를 클릭해주세요.\n\n%s\n\n이 링크는 30분 후 만료됩니다.",
            resetLink
        );
        message.setText(emailBody);
        
        mailSender.send(message);
    }
    
    public boolean validateResetToken(String token) {
        MemberDTO member = memberMapper.findByResetToken(token);
        
        if (member == null || member.getResetTokenExpires() == null) {
            return false;
        }
        
        // 토큰 만료 시간 확인
        return member.getResetTokenExpires().after(new Timestamp(System.currentTimeMillis()));
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (!validateResetToken(token)) {
            throw new RuntimeException("유효하지 않거나 만료된 토큰입니다.");
        }
        
        MemberDTO member = memberMapper.findByResetToken(token);
        String encodedPassword = passwordEncoder.encode(newPassword);
        
        memberMapper.updatePassword(member.getEmail(), encodedPassword);
        memberMapper.clearResetToken(member.getEmail());
    }
    
    // ========== 관리자 기능 관련 ==========

    /**
     * 페이징 처리된 회원 목록을 조회합니다. (ID, 이름, 이메일, 가입일)
     * @param page 현재 페이지 번호
     * @param pageSize 페이지 당 항목 수
     * @return 페이징 처리된 회원 목록
     */
    @Transactional(readOnly = true)
    public List<MemberDTO> getMemberList(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        Map<String, Object> params = new HashMap<>();
        params.put("pageSize", pageSize);
        params.put("offset", offset);

        return memberMapper.findMembersPaginated(params);
    }
    
    /**
     * 전체 회원의 총 수를 조회합니다. (페이징 계산용)
     * @return 전체 회원 수
     */
    public int getMemberCount() {
        return memberMapper.totalMemberCount();
    }
    
    @Transactional(readOnly = true)
    public int getNewMemberCount() {
        return memberMapper.countNewMembers();
    }
    
    @Transactional(readOnly = true)
    public int getTotalMemberCount() {
        return memberMapper.totalMemberCount();
    }
    
    @Transactional
    public void deleteMember(Long memberId) {
        memberMapper.deleteAddressesByMemberId(memberId);
        memberMapper.deleteMemberById(memberId);
    }
    
    // ========== LINE 연동 관련 ==========
    
    @Transactional
    public void updateNotifyLine(Long memberId, boolean isNotifyEnabled) {
        log.info("Updating LINE notification status for memberId: {} to: {}", memberId, isNotifyEnabled);
        memberMapper.updateNotifyLine(memberId, isNotifyEnabled);
    }
    
    @Transactional
    public void updateLineUserId(Long memberId, String lineUserId) {
        memberMapper.updateLineUserId(memberId, lineUserId);
    }
}
