package com.disaster.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.disaster.domain.MemberDTO;
import com.disaster.service.MemberService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequestMapping("/member")
@RequiredArgsConstructor
public class MemberController {
    
    private final MemberService memberService;
    
    // ========== 회원가입 관련 ==========
    
    // 회원가입 폼 페이지
    @GetMapping("/signup")
    public String signup() {
        return "member/signup";
    }
    
    // 닉네임 중복 확인
    @GetMapping("/check-nickname")
    @ResponseBody
    public String checkNickname(@RequestParam("nickname") String nickname) {
        boolean exists = memberService.isNicknameExists(nickname);
        return exists ? "exist" : "ok";
    }
    
    // 이메일 중복 확인
    @GetMapping("/check-email")
    @ResponseBody
    public String checkEmail(@RequestParam("email") String email) {
        boolean exists = memberService.isEmailExists(email);
        return exists ? "exist" : "ok";
    }
    
    // 인증메일 발송
    @PostMapping("/send-verify-email")
    @ResponseBody
    public String sendVerifyEmail(@RequestParam("email") String email, HttpSession session) {
        try {
            if (memberService.isEmailExists(email)) {
                return "exist";
            }
            memberService.sendVerificationEmail(email, session);
            return "success";
        } catch (Exception e) {
            return "error";
        }
    }
    
    // 인증코드 확인
    @PostMapping("/verify-email-code")
    @ResponseBody
    public String verifyEmailCode(@RequestParam("email") String email, 
                                 @RequestParam("verifyCode") String verifyCode,
                                 HttpSession session) {
        try {
            boolean isValid = memberService.verifyEmailCode(email, verifyCode, session);
            return isValid ? "success" : "invalid";
        } catch (Exception e) {
            return "error";
        }
    }
    
    // 회원가입 처리
    @PostMapping("/signup")
    public String signupProcess(MemberDTO memberDTO, HttpSession session, Model model) {
        try {
            // === 주소 데이터 매핑 (새로 추가) ===
            // HTML 폼에서 detailAddress로 받은 값을 addrLine2에 복사
            if (memberDTO.getDetailAddress() != null && !memberDTO.getDetailAddress().trim().isEmpty()) {
                memberDTO.setAddrLine2(memberDTO.getDetailAddress().trim());
            }
            
            // 1. 기본 필수 값 검증
            if (memberDTO.getEmail() == null || memberDTO.getEmail().trim().isEmpty()) {
                model.addAttribute("error", "이메일을 입력해주세요.");
                return "member/signup";
            }
            
            if (memberDTO.getPassword() == null || memberDTO.getPassword().length() < 8) {
                model.addAttribute("error", "비밀번호는 8자 이상이어야 합니다.");
                return "member/signup";
            }
            
            if (memberDTO.getNickname() == null || memberDTO.getNickname().trim().isEmpty()) {
                model.addAttribute("error", "닉네임을 입력해주세요.");
                return "member/signup";
            }
            
            if (memberDTO.getName() == null || memberDTO.getName().trim().isEmpty()) {
                model.addAttribute("error", "이름을 입력해주세요.");
                return "member/signup";
            }
            
            // 2. 이메일 형식 검증
            if (!isValidEmail(memberDTO.getEmail())) {
                model.addAttribute("error", "올바른 이메일 형식이 아닙니다.");
                return "member/signup";
            }
            
         // === 디버깅용 코드 (임시 추가) ===
            System.out.println("=== 주소 데이터 디버깅 ===");
            System.out.println("PostalCode: '" + memberDTO.getPostalCode() + "'");
            System.out.println("PrefCode: '" + memberDTO.getPrefCode() + "'");
            System.out.println("MuniCode: '" + memberDTO.getMuniCode() + "'");
            System.out.println("DetailAddress: '" + memberDTO.getDetailAddress() + "'");
            System.out.println("AddrLine1: '" + memberDTO.getAddrLine1() + "'");
            System.out.println("AddrLine2: '" + memberDTO.getAddrLine2() + "'");
            System.out.println("========================");
            
            // === 3. 일본 주소 데이터 검증 (수정된 부분) ===
            if (memberDTO.getPostalCode() == null || memberDTO.getPostalCode().trim().isEmpty()) {
                model.addAttribute("error", "우편번호를 입력해주세요.");
                return "member/signup";
            }

            // 일본 우편번호 형식 검증 (7자리 숫자)
            if (!memberDTO.getPostalCode().matches("\\d{7}")) {
                model.addAttribute("error", "우편번호는 7자리 숫자로 입력해주세요.");
                return "member/signup";
            }

            if (memberDTO.getPrefCode() == null || memberDTO.getPrefCode().trim().isEmpty()) {
                model.addAttribute("error", "도도부현 정보가 누락되었습니다. 주소를 다시 검색해주세요.");
                return "member/signup";
            }

            // 시구정촌 코드가 없는 경우 기본값 설정 (북해도 시골지역 대응)
            if (memberDTO.getMuniCode() == null || memberDTO.getMuniCode().trim().isEmpty()) {
                // 북해도인 경우 기본 코드 설정
                if ("01".equals(memberDTO.getPrefCode())) {
                    memberDTO.setMuniCode("01000"); // 북해도 기본 코드
                } else {
                    model.addAttribute("error", "시구정촌 정보가 누락되었습니다. 주소를 다시 검색해주세요.");
                    return "member/signup";
                }
            }

            // 상세 주소 검증 - detailAddress 또는 addrLine2 확인
            String detailAddr = memberDTO.getDetailAddress();
            if (detailAddr == null || detailAddr.trim().isEmpty()) {
                detailAddr = memberDTO.getAddrLine2();
            }

            if (detailAddr == null || detailAddr.trim().isEmpty()) {
                model.addAttribute("error", "상세 주소를 입력해주세요.");
                return "member/signup";
            }

            // 최종적으로 addrLine2에 설정
            memberDTO.setAddrLine2(detailAddr.trim());

            // 도도부현 코드 형식 검증 (01-47)
            if (!memberDTO.getPrefCode().matches("^(0[1-9]|[1-4][0-7])$")) {
                model.addAttribute("error", "올바르지 않은 도도부현 코드입니다.");
                return "member/signup";
            }

            // 시구정촌 코드 형식 검증 (5자리 숫자) - 수정
            if (memberDTO.getMuniCode() != null && 
                (memberDTO.getMuniCode().length() < 5 || 
                 memberDTO.getMuniCode().length() > 6 ||
                 !memberDTO.getMuniCode().matches("\\d+"))) {
                model.addAttribute("error", "올바르지 않은 시구정촌 코드입니다.");
                return "member/signup";
            }
            
            // 4. 약관 동의 확인
            if (memberDTO.getAgreeTerms() == null || !memberDTO.getAgreeTerms()) {
                model.addAttribute("error", "이용약관에 동의해주세요.");
                return "member/signup";
            }
            
            if (memberDTO.getAgreePrivacy() == null || !memberDTO.getAgreePrivacy()) {
                model.addAttribute("error", "개인정보처리방침에 동의해주세요.");
                return "member/signup";
            }
            
            // 5. 회원가입 처리
            memberService.registerMember(memberDTO, session);
            
            return "redirect:/member/login?success=true";
            
        } catch (RuntimeException e) {
            model.addAttribute("error", e.getMessage());
            return "member/signup";
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("error", "회원가입 중 오류가 발생했습니다.");
            return "member/signup";
        }
    }
    
    // ========== 로그인 관련 ==========
    
    // 로그인 폼 페이지
    @GetMapping("/login")
    public String login(@RequestParam(value = "error", required = false) String error,
                       @RequestParam(value = "success", required = false) String success,
                       Model model) {
        
        if (error != null) {
            model.addAttribute("error", "아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        
        if (success != null) {
            model.addAttribute("success", "회원가입이 완료되었습니다. 로그인해주세요.");
        }
        
        return "member/login";
    }
    
    // ========== 비밀번호 관련 ==========
    
    // 비밀번호 찾기 폼
    @GetMapping("/forgot-password")
    public String forgotPasswordForm() {
        return "member/forgot-password";
    }

    // 비밀번호 재설정 링크 발송
    @PostMapping("/forgot-password")
    public String forgotPasswordProcess(@RequestParam("email") String email, Model model) {
        try {
            memberService.sendPasswordResetEmail(email);
            model.addAttribute("success", "비밀번호 재설정 링크가 이메일로 발송되었습니다.");
            return "member/forgot-password";
        } catch (RuntimeException e) {
            model.addAttribute("error", e.getMessage());
            return "member/forgot-password";
        }
    }
    
    // 비밀번호 재설정 페이지 (토큰 검증)
    @GetMapping("/reset-password")
    public String resetPasswordForm(@RequestParam("token") String token, Model model) {
        try {
            boolean isValidToken = memberService.validateResetToken(token);
            if (!isValidToken) {
                model.addAttribute("error", "유효하지 않거나 만료된 링크입니다.");
                model.addAttribute("success", false);
                return "member/forgot-password";
            }
            model.addAttribute("token", token);
            model.addAttribute("success", false);
            model.addAttribute("error", false);
            return "member/reset-password";
        } catch (Exception e) {
            model.addAttribute("error", "오류가 발생했습니다.");
            model.addAttribute("success", false);
            return "member/forgot-password";
        }
    }

    // 비밀번호 변경 처리
    @PostMapping("/reset-password")
    public String resetPasswordProcess(@RequestParam("token") String token,
                                     @RequestParam("password") String password,
                                     @RequestParam("passwordConfirm") String passwordConfirm,
                                     Model model) {
        try {
            // 비밀번호 확인 검증
            if (!password.equals(passwordConfirm)) {
                model.addAttribute("error", "비밀번호가 일치하지 않습니다.");
                model.addAttribute("success", false);
                model.addAttribute("token", token);
                return "member/reset-password";
            }
            
            // 비밀번호 길이 검증
            if (password.length() < 8) {
                model.addAttribute("error", "비밀번호는 8자 이상이어야 합니다.");
                model.addAttribute("success", false);
                model.addAttribute("token", token);
                return "member/reset-password";
            }
            
            // 비밀번호 재설정
            memberService.resetPassword(token, password);
            model.addAttribute("success", "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.");
            model.addAttribute("error", false);
            return "member/reset-password";
            
        } catch (RuntimeException e) {
            model.addAttribute("error", e.getMessage());
            model.addAttribute("success", false);
            model.addAttribute("token", token);
            return "member/reset-password";
        }
    }
    
    // ========== 마이페이지 ==========
    
    @GetMapping("/myPage")
    public String myPage() {
        return "member/mypage";
    }
    
    // ========== 유틸리티 메서드 ==========
    
    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }
    
    // 로그아웃은 Spring Security가 자동으로 처리하므로 제거
    // SecurityConfig에서 .logoutUrl("/logout")으로 설정됨
}