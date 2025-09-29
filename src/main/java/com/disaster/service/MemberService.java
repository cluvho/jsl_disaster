package com.disaster.service;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Random;
import java.util.UUID;

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
    
    private final MemberMapper memberMapper;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    
    // ========== Spring Security 로그인 관련 ==========
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        MemberDTO member = memberMapper.findByEmail(username);
        
        System.out.println("로그인 사용자: " + member.getEmail());
        System.out.println("닉네임: " + member.getNickname()); 
        if (member == null) {
            throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username);
        }
        
        // 권한 설정
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + member.getRole()));
        
        // 기존 Spring Security User 대신 CustomUserDetails 반환
        return new CustomUserDetails(
            member.getEmail(),          // email
            member.getPasswordHash(),   // password
            member.getNickname(),       // nickname 추가!
            member.getIsActive(),       // enabled
            authorities                 // authorities
        );
    }
    
    // ========== 회원가입 관련 ==========
    
    // 이메일 중복 확인
    public boolean isEmailExists(String email) {
        return memberMapper.countByEmail(email) > 0;
    }
    
    // 닉네임 중복 확인
    public boolean isNicknameExists(String nickname) {
        return memberMapper.countByNickname(nickname) > 0;
    }
    
    // 인증메일 발송
    public void sendVerificationEmail(String email, HttpSession session) {
        // 6자리 랜덤 인증코드 생성
        String verifyCode = String.format("%06d", new Random().nextInt(1000000));
        
        // 세션에 인증코드와 이메일 저장 (5분 후 만료)
        session.setAttribute("verifyCode", verifyCode);
        session.setAttribute("verifyEmail", email);
        session.setAttribute("verifyTime", System.currentTimeMillis());
        
        // 이메일 발송
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[재난대응시스템] 이메일 인증코드");
        message.setText("인증코드: " + verifyCode + "\n\n5분 내에 입력해주세요.");
        
        mailSender.send(message);
    }
    
    // 인증코드 확인
    public boolean verifyEmailCode(String email, String inputCode, HttpSession session) {
        String sessionCode = (String) session.getAttribute("verifyCode");
        String sessionEmail = (String) session.getAttribute("verifyEmail");
        Long verifyTime = (Long) session.getAttribute("verifyTime");
        
        // 세션에 저장된 정보가 없으면 false
        if (sessionCode == null || sessionEmail == null || verifyTime == null) {
            return false;
        }
        
        // 5분(300초) 초과시 만료
        if (System.currentTimeMillis() - verifyTime > 300000) {
            session.removeAttribute("verifyCode");
            session.removeAttribute("verifyEmail");
            session.removeAttribute("verifyTime");
            return false;
        }
        
        // 이메일과 인증코드 일치 확인
        if (email.equals(sessionEmail) && inputCode.equals(sessionCode)) {
            session.setAttribute("emailVerified", true);
            return true;
        }
        
        return false;
    }
    
    // 회원가입 처리 (일본 주소로 수정)
    @Transactional
    public void registerMember(MemberDTO memberDTO, HttpSession session) {
        // 이메일 인증 확인 
        Boolean emailVerified = (Boolean) session.getAttribute("emailVerified");
        if (emailVerified == null || !emailVerified) {
            throw new RuntimeException("이메일 인증이 완료되지 않았습니다.");
        }
        
        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(memberDTO.getPassword());
        memberDTO.setPasswordHash(encodedPassword);
        
        // 약관 동의 시간 설정
        Timestamp now = new Timestamp(System.currentTimeMillis());
        if (memberDTO.getAgreeTerms() != null && memberDTO.getAgreeTerms()) {
            memberDTO.setTermsAgreedAt(now);
        }
        if (memberDTO.getAgreePrivacy() != null && memberDTO.getAgreePrivacy()) {
            memberDTO.setPrivacyAgreedAt(now);
        }
        
        // 마케팅 동의 설정
        memberDTO.setMarketingConsent(memberDTO.getAgreeMarketing());
        
        // 회원 정보 저장
        memberMapper.insertMember(memberDTO);
        
        // === 일본 주소 정보 저장 (수정된 부분) ===
        if (memberDTO.getPostalCode() != null && !memberDTO.getPostalCode().isEmpty()) {
            MemberAddressDTO addressDTO = new MemberAddressDTO();
            addressDTO.setMemberId(memberDTO.getMemberId());
            
            // 일본 주소 데이터 직접 매핑 (필드명 일치)
            addressDTO.setPostalCode(memberDTO.getPostalCode());
            addressDTO.setPrefCode(memberDTO.getPrefCode());
            addressDTO.setMuniCode(memberDTO.getMuniCode());
            addressDTO.setAddrLine1(memberDTO.getAddrLine1());
            addressDTO.setAddrLine2(memberDTO.getAddrLine2());
            
            // 좌표 정보 (있으면 저장, 없으면 null)
            addressDTO.setLat(memberDTO.getLat());
            addressDTO.setLon(memberDTO.getLon());
            
            memberMapper.insertMemberAddress(addressDTO);
        }
        
        // 인증 세션 정보 삭제
        session.removeAttribute("verifyCode");
        session.removeAttribute("verifyEmail");
        session.removeAttribute("verifyTime");
        session.removeAttribute("emailVerified");
    }
    
    // 비밀번호 재설정 이메일 발송
    public void sendPasswordResetEmail(String email) {
        // 1. 이메일로 사용자 조회
        MemberDTO member = memberMapper.findByEmail(email);
        if (member == null) {
            throw new RuntimeException("등록되지 않은 이메일입니다.");
        }
        
        // 2. 재설정 토큰 생성 (UUID 사용)
        String resetToken = UUID.randomUUID().toString();
        
        // 3. 토큰 만료시간 설정 (30분 후)
        Timestamp expiresAt = new Timestamp(System.currentTimeMillis() + 30 * 60 * 1000);
        
        // 4. DB에 토큰 저장
        memberMapper.updateResetToken(email, resetToken, expiresAt);
        
        // 5. 재설정 링크 생성
        String resetLink = "http://localhost:8888/member/reset-password?token=" + resetToken;
        
        // 6. 이메일 발송
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
    
    // 토큰 유효성 검증
    public boolean validateResetToken(String token) {
        MemberDTO member = memberMapper.findByResetToken(token);
        
        if (member == null) {
            return false; // 토큰이 존재하지 않음
        }
        
        // 토큰 만료시간 확인
        if (member.getResetTokenExpires() == null || 
            member.getResetTokenExpires().before(new Timestamp(System.currentTimeMillis()))) {
            return false; // 토큰이 만료됨
        }
        
        return true;
    }

    // 비밀번호 재설정
    @Transactional
    public void resetPassword(String token, String newPassword) {
        // 토큰 검증
        if (!validateResetToken(token)) {
            throw new RuntimeException("유효하지 않거나 만료된 토큰입니다.");
        }
        
        // 토큰으로 사용자 조회
        MemberDTO member = memberMapper.findByResetToken(token);
        
        // 새 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(newPassword);
        
        // 비밀번호 업데이트 및 토큰 삭제
        memberMapper.updatePassword(member.getEmail(), encodedPassword);
        memberMapper.clearResetToken(member.getEmail());
    }
    
    //ID, 이름, 이메일, 가입일만 조회
    @Transactional(readOnly = true)
    public List<MemberDTO> getMemberList(){
    		return memberMapper.findByMember();
    }
    
    
    //신규 가입자 조회
    @Transactional(readOnly = true)
    public int getNewMemberCount() {
    		return memberMapper.countNewMembers();
    	
    }
    
    //전체 가입자 조회
    @Transactional(readOnly = true)
    public int getTotalMemberCount() {
    		return memberMapper.totalMemberCount();
    }
    
    //회원정보 삭제
    @Transactional
    public void deleteMember(Long memberId) {
    		memberMapper.deleteAddressesByMemberId(memberId);
    		memberMapper.deleteMemberById(memberId);
    }
    
    
    
}