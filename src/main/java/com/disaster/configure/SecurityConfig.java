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
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
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
                // 공개 페이지 (모든 경로 통합)
                .requestMatchers(
                    "/",
                    "/member/login",
                    "/member/signup",
                    "/member/forgot-password**",
                    "/member/reset-password**",
                    "/member/check-**",
                    "/member/send-**",
                    "/member/verify-**",
                    "/detail/**",
                    "/perform_login",
                    "/logout",
                    "/css/**",
                    "/js/**",
                    "/images/**",
                    "/api/**",
                    "/mock/**",
                    "/csv/**",
                    "/line/**"
                ).permitAll()
                // 관리자 페이지는 ADMIN 권한 필요
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // 비밀번호 재설정 관련 명시적 허용
                .requestMatchers(HttpMethod.GET, "/member/reset-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/member/reset-password").permitAll()
                // 나머지는 인증 필요
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/member/login")
                .loginProcessingUrl("/perform_login")
                .usernameParameter("username")
                .passwordParameter("password")
                .successHandler(successHandler()) // 역할 기반 리디렉션
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
            // CSRF 보호 활성화
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            );

        return http.build();
    }

    @Bean
    public AuthenticationSuccessHandler successHandler() {
        return (request, response, authentication) -> {
            // 사용자의 권한 확인
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

            if (isAdmin) {
                // ADMIN 권한이 있으면 관리자 페이지로 리디렉트
                response.sendRedirect("/admin/adminDetail");
            } else {
                // 그 외 (USER 등)는 홈페이지로 리디렉트
                response.sendRedirect("/");
            }
        };
    }
}