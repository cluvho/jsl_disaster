package com.disaster.domain;

import java.time.LocalDateTime;

public class DisasterEventLive {
    private Long id;
    private String regionCode;
    private String disasterType;
    private String title;
    private String location;
    private Double magnitude;
    private String depthKm;
    private String alertLevel;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime expectedEnd;
    private String source;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 생성자
    public DisasterEventLive() {}
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getRegionCode() { return regionCode; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }
    
    public String getDisasterType() { return disasterType; }
    public void setDisasterType(String disasterType) { this.disasterType = disasterType; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public Double getMagnitude() { return magnitude; }
    public void setMagnitude(Double magnitude) { this.magnitude = magnitude; }
    
    public String getDepthKm() { return depthKm; }
    public void setDepthKm(String depthKm) { this.depthKm = depthKm; }
    
    public String getAlertLevel() { return alertLevel; }
    public void setAlertLevel(String alertLevel) { this.alertLevel = alertLevel; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    
    public LocalDateTime getExpectedEnd() { return expectedEnd; }
    public void setExpectedEnd(LocalDateTime expectedEnd) { this.expectedEnd = expectedEnd; }
    
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}