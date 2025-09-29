package com.disaster.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/community")
public class CommunityController {
    
    @GetMapping("")
    public String community() {
        return "community/communityList"; // templates/community/list.html
    }
    
    @GetMapping("/write")
    public String write() {
        return "community/communityWrite"; // templates/community/write.html
    }
    
    @GetMapping("/detail")
    public String communityDetail() {
        return "community/communityDetail"; // templates/community/write.html
    }
}
