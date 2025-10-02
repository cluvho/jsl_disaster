package com.disaster.domain;

import lombok.Data;

@Data
public class userDto {
    private Long memberId;
    private String email;
    private String password;
    private String name;
    private String phone;
    private String lineUserId;
    private String role;
    private boolean active;
    private boolean marketingConsent;
    private String termsAgreedAt;
    private String privacyAgreedAt;
    private String createdAt;
    private String updatedAt;
    private Long addressId;
    private String postalCode;
    private String prefCode;
    private String muniCode;
    private String addrLine1;
    private String addrLine2;
    private Double lat;
    private Double lon;
    private boolean primary;
    private int disasterStatus;
}