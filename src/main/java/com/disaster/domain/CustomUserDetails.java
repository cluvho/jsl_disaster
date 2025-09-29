package com.disaster.domain;

import java.util.Collection;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class CustomUserDetails implements UserDetails {
    
    private String email;
    private String password;
    private String nickname;
    private boolean enabled;
    private Collection<? extends GrantedAuthority> authorities;
    
    public CustomUserDetails(String email, String password, String nickname, 
                           boolean enabled, Collection<? extends GrantedAuthority> authorities) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.enabled = enabled;
        this.authorities = authorities;
    }
    
    // UserDetails 인터페이스 구현
    @Override
    public String getUsername() { return email; }
    
    @Override
    public String getPassword() { return password; }
    
    @Override
    public boolean isEnabled() { return enabled; }
    
    @Override
    public boolean isAccountNonExpired() { return true; }
    
    @Override
    public boolean isAccountNonLocked() { return true; }
    
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    
    // 닉네임 getter
    public String getNickname() { return nickname; }
}