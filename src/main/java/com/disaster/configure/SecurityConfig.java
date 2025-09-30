package com.disaster.configure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.disaster.service.MemberService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final MemberService memberService;

    public SecurityConfig(@Lazy MemberService memberService) {
        this.memberService = memberService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(memberService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authenticationProvider(authenticationProvider())
            .authorizeHttpRequests(authz -> authz
                // 공개 페이지들
                .requestMatchers("/",
                    "/member/login",
                    "/member/signup", 
                    "/member/forgot-password**",
                    "/member/reset-password**",
                    "/member/check-**",
                    "/member/send-**",
                    "/member/verify-**",
                    "/detail/**",
                    "/perform_login",  // Spring Security 기본 로그인 처리 URL
                    "/logout",
                    "/css/**",
                    "/js/**",
                    "/images/**",
                    "/api/**",
                    "/mock/**").permitAll()
                // 비밀번호 재설정 관련 명시적 허용
                .requestMatchers(HttpMethod.GET, "/member/reset-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/member/reset-password").permitAll()
                // 나머지는 인증 필요
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/member/login")
                .loginProcessingUrl("/perform_login")  // Spring Security 기본값 사용
                .usernameParameter("username")
                .passwordParameter("password")
                .defaultSuccessUrl("/", true)  // true 추가: 항상 홈으로 리다이렉트
                .failureUrl("/member/login?error=true")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .permitAll()
            )
            .sessionManagement(session -> session
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
            )
            .csrf(csrf -> csrf.disable());

        return http.build();
    }
}