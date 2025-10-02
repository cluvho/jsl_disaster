package com.disaster.domain;

import lombok.Data;
import java.math.BigDecimal;
import java.sql.Timestamp;

@Data
public class MemberAddressDTO {
    
    private Long addressId;        // address_id
    private Long memberId;         // member_id (FK)
    private String postalCode;     // postal_code
    private String prefCode;       // pref_code
    private String muniCode;       // muni_code
    private String addrLine1;      // addr_line1
    private String addrLine2;      // addr_line2
    private BigDecimal lat;        // lat (위도)
    private BigDecimal lon;        // lon (경도)
    private Boolean isPrimary;     // is_primary
    private Integer disasterStatus; // disaster_status
    private Timestamp createdAt;   // created_at
    
    // 생성자
    public MemberAddressDTO() {
        this.isPrimary = true;      // 기본값
        this.disasterStatus = 1;    // 기본값 (정상)
    }
}
