package com.disaster.domain;

import lombok.Data;
import java.math.BigDecimal;
import java.sql.Timestamp;

@Data
public class MemberDTO {

    // member 테이블 필드들
    private Long memberId; // member_id
    private String email; // email (로그인 아이디)
    private String passwordHash; // password_hash
    private String name; // name (실명)
    private String nickname; // nickname (닉네임) - DB 컬럼 추가
    private String phone; // phone
    private String lineUserId; // line_user_id
    private String role; // role (USER/ADMIN)
    private Boolean isActive; // is_active
    private Boolean marketingConsent; // marketing_consent
    private Timestamp termsAgreedAt; // terms_agreed_at
    private Timestamp privacyAgreedAt; // privacy_agreed_at
    private Timestamp createdAt; // created_at
    private Timestamp updatedAt; // updated_at

    // HTML 폼에서만 사용하는 필드들 (DB 저장 안함)
    private String password; // 평문 비밀번호 (해싱 전)
    private String password2; // 비밀번호 확인
    private String verifyCode; // 인증코드 (세션 처리)

    // === 일본 주소 관련 필드들 (MemberAddressDTO와 일치하게 수정) ===
    
    // HTML 폼에서 받는 필드들
    private String postalCode; // postal_code (우편번호 7자리)
    private String prefecture; // 도도부현명 (표시용)
    private String city; // 시구정촌명 (표시용)
    private String town; // 정목명 (표시용)
    private String detailAddress; // 상세주소

    // DB 저장용 필드들 (MemberAddressDTO와 정확히 일치)
    private String prefCode; // pref_code (도도부현 코드 2자리)
    private String muniCode; // muni_code (시구정촌 코드 5자리)
    private String addrLine1; // addr_line1 (정목)
    private String addrLine2; // addr_line2 (상세주소)
    private BigDecimal lat; // lat (위도)
    private BigDecimal lon; // lon (경도)

    // 약관 동의 관련
    private Boolean agreeTerms; // 이용약관 동의
    private Boolean agreePrivacy; // 개인정보처리방침 동의
    private Boolean agreeMarketing; // 마케팅 수신 동의

    private Timestamp resetTokenExpires; // reset_token_expires

    
    private Boolean notifyLine;
    
    
    
    // getter/setter
    public Timestamp getResetTokenExpires() { 
        return resetTokenExpires; 
    }
    
    public void setResetTokenExpires(Timestamp resetTokenExpires) { 
        this.resetTokenExpires = resetTokenExpires; 
    }

    // === 일본 주소 관련 편의 메서드들 ===
    
    // 주소 데이터가 완전한지 검증하는 메서드
    public boolean isAddressDataComplete() {
        return postalCode != null && !postalCode.trim().isEmpty() &&
               prefCode != null && !prefCode.trim().isEmpty() &&
               muniCode != null && !muniCode.trim().isEmpty() &&
               detailAddress != null && !detailAddress.trim().isEmpty();
    }

    // 우편번호 형식 검증 메서드 (7자리 숫자)
    public boolean isValidJapanesePostalCode() {
        return postalCode != null && postalCode.matches("\\d{7}");
    }

    // 생성자
    public MemberDTO() {
        this.role = "USER"; // 기본값
        this.isActive = true; // 기본값
    }
}