package com.disaster.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/guidelines")
public class GuidelineController {
    
    // ✨✨✨ 이 메서드를 추가하여 /guidelines 경로 자체에 대한 요청을 처리합니다. ✨✨✨
    @GetMapping({"", "/"})
    public String handleBaseGuidelines() {
        // /guidelines로 접속하면 자동으로 /guidelines/guide 페이지로 리다이렉트합니다.
        return "redirect:/guidelines/guide";  
    }
    
    @GetMapping("/guide")
    public String guidelines() {
        return "guidelines/guideLine";  
    }
    
    @GetMapping("/earthquake")
    public String earthquake() {
        return "guidelines/earthquake";  
    }
    
    @GetMapping("/fire")
    public String fire() {
        return "guidelines/fire";  
    }
    
    @GetMapping("/heatWave")
    public String heatWave() {
        return "guidelines/heatWave";  
    }
    
    @GetMapping("/heavyRain")
    public String heavyRain() {
        return "guidelines/heavyRain";  
    }
    
    @GetMapping("/heavySnow")
    public String heavySnow() {
        return "guidelines/heavySnow";  
    }
    
    @GetMapping("/tsunami")
    public String tsunami() {
        return "guidelines/tsunami";  
    }
    
    @GetMapping("/typhoon")
    public String typhoon() {
        return "guidelines/typhoon";  
    }
    
    @GetMapping("/volcano")
    public String volcano() {
        return "guidelines/volcano";  
    }
}
