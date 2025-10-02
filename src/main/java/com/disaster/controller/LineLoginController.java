package com.disaster.controller;

import com.auth0.jwt.JWT;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.disaster.domain.CustomUserDetails;
import com.disaster.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class LineLoginController {

    private final MemberService memberService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${line.channel.id}")
    private String lineChannelId;

    @Value("${line.channel.secret}")
    private String lineChannelSecret;

    @Value("${line.callback.url}")
    private String lineCallbackUrl;

    // 1. 'LINE 연동하기' 버튼을 눌렀을 때 호출될 주소
    @GetMapping("/line/login")
    public String redirectToLineLogin() {
        String authUrl = "https://access.line.me/oauth2/v2.1/authorize?" +
                "response_type=code" +
                "&client_id=" + lineChannelId +
                "&redirect_uri=" + lineCallbackUrl +
                "&state=12345abcde" + // CSRF 방지용 임의의 문자열
                "&scope=profile%20openid" + // openid 스코프 필수
        		"&bot_prompt=normal";
        return "redirect:" + authUrl;
    }

    // 2. LINE에서 인증 후 사용자를 돌려보내는 Callback 주소
    @GetMapping("/line/callback")
    public String handleLineCallback(@RequestParam("code") String code, 
                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        // 3. 받은 code로 Access Token 요청
        String tokenUrl = "https://api.line.me/oauth2/v2.1/token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "authorization_code");
        map.add("code", code);
        map.add("redirect_uri", lineCallbackUrl);
        map.add("client_id", lineChannelId);
        map.add("client_secret", lineChannelSecret);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
        
        Map<String, String> responseBody = response.getBody();
        String idToken = responseBody.get("id_token");

        if (idToken != null) {
            // 4. id_token에서 line_user_id 추출
            DecodedJWT jwt = JWT.decode(idToken);
            String lineUserId = jwt.getSubject(); // 'sub' 클레임이 바로 line_user_id
            
            // 5. 현재 로그인된 사용자의 member_id 가져오기
            Long memberId = userDetails.getMemberId();
            
            // 6. DB에 line_user_id 업데이트
            memberService.updateLineUserId(memberId, lineUserId);
        }
        
        // 7. 연동 완료 후 마이페이지로 리디렉션
        return "redirect:/member/myPage";
    }
}