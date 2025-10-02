package com.disaster.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/guidelines")
public class GuidelineController {
    
    @GetMapping("")
    public String guidelines() {
        return "guidelines/guideLine"; // templates/guidelines/index.html
    }
}
