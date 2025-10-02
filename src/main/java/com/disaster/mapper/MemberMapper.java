package com.disaster.mapper;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.disaster.domain.MemberDTO;
import com.disaster.domain.MemberAddressDTO;

@Mapper
public interface MemberMapper {

    // ========== 회원가입 관련 ==========

    // 이메일 중복 확인
    int countByEmail(String email);

    // 닉네임 중복 확인
    int countByNickname(String nickname);

    // 회원 등록
    int insertMember(MemberDTO member);

    // 주소 등록
    int insertMemberAddress(MemberAddressDTO address);

    // ▼ 회원가입 시 user_pref 테이블에 기본값을 넣는 메소드
    @Insert("INSERT INTO user_pref (member_id, notify_line, notify_email) VALUES (#{memberId}, FALSE, FALSE)")
    void insertUserPref(Long memberId);

    // ========== 로그인 관련 ==========

    // 로그인 - 이메일로 회원 조회
    MemberDTO findByEmail(String email);

    // 재설정 토큰 업데이트
    int updateResetToken(@Param("email") String email,
                         @Param("resetToken") String resetToken,
                         @Param("expiresAt") Timestamp expiresAt);

    // 토큰으로 사용자 조회
    MemberDTO findByResetToken(String resetToken);

    // 비밀번호 업데이트
    int updatePassword(@Param("email") String email,
                       @Param("passwordHash") String passwordHash);

    // 토큰 삭제
    int clearResetToken(String email);

    // ========== 마이페이지 및 회원정보 조회 ==========

    // user_pref 테이블과 JOIN하여 notify_line 값을 함께 조회
    MemberDTO findById(Long memberId);

    // 회원 ID로 주소 조회
    MemberAddressDTO findAddressByMemberId(Long memberId);

    // 이메일로 기본 주소 조회
    MemberAddressDTO findPrimaryAddressByEmail(String email);

    // 라인 알림 설정 변경
    @Update("UPDATE user_pref SET notify_line = #{isNotifyEnabled} WHERE member_id = #{memberId}")
    void updateNotifyLine(@Param("memberId") Long memberId, @Param("isNotifyEnabled") boolean isNotifyEnabled);

    // LINE User ID 업데이트
    @Update("UPDATE member SET line_user_id = #{lineUserId} WHERE member_id = #{memberId}")
    void updateLineUserId(@Param("memberId") Long memberId, @Param("lineUserId") String lineUserId);

    // ========== 관리자 페이지 관련 ==========

    // 전체 회원 목록 조회
    List<MemberDTO> findByMember();

    // 페이징 + 다중 조건 검색된 회원 목록
    List<MemberDTO> findMembersPaginated(Map<String, Object> params);

    // 다중 조건 검색된 회원 수
    int countMembers(Map<String, Object> params);

    // 신규 가입자 수
    int countNewMembers();

    // 전체 회원 수
    int totalMemberCount();

    // 회원 삭제
    int deleteAddressesByMemberId(Long memberId);
    int deleteMemberById(Long memberId);
}